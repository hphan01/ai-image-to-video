import LumaAI from 'lumaai';
import type { VideoProvider, GenerateClipOptions } from './index';
import { uploadToFal } from '../imageHost';

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 300_000; // 5 minutes

export class LumaProvider implements VideoProvider {
  name = 'luma' as const;
  clipDurationSeconds = 5;

  private client: LumaAI;

  constructor(apiKey: string) {
    this.client = new LumaAI({ authToken: apiKey });
  }

  async generateClip({ imageBuffer, prompt }: GenerateClipOptions): Promise<Buffer> {
    // Luma requires a public HTTPS URL — upload to fal.ai storage
    const imageUrl = await uploadToFal(imageBuffer, 'image/jpeg');

    const generation = await this.client.generations.create({
      prompt,
      model: 'ray-2',
      resolution: '720p',
      duration: '5s',
      aspect_ratio: '16:9',
      keyframes: {
        frame0: { type: 'image', url: imageUrl },
      },
    });

    const generationId = generation.id;
    if (!generationId) {
      throw new Error('[Luma] Failed to create generation — no ID returned');
    }

    // Poll until complete
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      const status = await this.client.generations.get(generationId);

      if (status.state === 'completed') {
        const videoUrl = status.assets?.video;
        if (!videoUrl) throw new Error('[Luma] Generation completed but no video URL returned');
        return await downloadToBuffer(videoUrl);
      }

      if (status.state === 'failed') {
        throw new Error(`[Luma] Generation failed: ${status.failure_reason || 'unknown reason'}`);
      }

      console.log(`[Luma] Status: ${status.state}...`);
    }

    throw new Error('[Luma] Generation timed out after 5 minutes');
  }
}

async function downloadToBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`[Luma] Failed to download video: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
