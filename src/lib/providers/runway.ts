import RunwayML from '@runwayml/sdk';
import type { VideoProvider, GenerateClipOptions } from './index';

const ASPECT_RATIO = '1280:720';
const CLIP_DURATION = 10;

export class RunwayProvider implements VideoProvider {
  name = 'runway' as const;
  clipDurationSeconds = CLIP_DURATION;

  private client: RunwayML;

  constructor(apiKey: string) {
    this.client = new RunwayML({ apiKey });
  }

  async generateClip({ imageBuffer, prompt }: GenerateClipOptions): Promise<Buffer> {
    const base64 = imageBuffer.toString('base64');
    const promptImage = `data:image/jpeg;base64,${base64}`;

    console.log('[Runway] Creating image-to-video task...');

    const taskOutput = await this.client.imageToVideo
      .create({
        model: 'gen4_turbo',
        promptImage,
        promptText: prompt,
        ratio: ASPECT_RATIO,
        duration: CLIP_DURATION,
      })
      .waitForTaskOutput();

    const videoUrl = taskOutput.output?.[0];
    if (!videoUrl) {
      throw new Error('[Runway] Task completed but no output URL returned');
    }

    console.log('[Runway] Downloading clip...');
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error(`[Runway] Failed to download video: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
