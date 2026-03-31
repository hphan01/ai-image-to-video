import { InferenceClient } from '@huggingface/inference';
import type { VideoProvider, GenerateClipOptions } from './index';

const PRIMARY_MODELS = [
  'Wan-AI/Wan2.1-I2V-14B-720P',
  'Wan-AI/Wan2.1-I2V-14B-480P',
];

const RETRY_ATTEMPTS = 2;
const RETRY_BACKOFF_MS = 5000;

export class HuggingFaceProvider implements VideoProvider {
  name = 'huggingface' as const;
  clipDurationSeconds = 5;

  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateClip({ imageBuffer, prompt, durationSeconds }: GenerateClipOptions): Promise<Buffer> {
    const client = new InferenceClient(this.apiKey);

    for (const model of PRIMARY_MODELS) {
      for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        try {
          console.log(`[HF] Trying model ${model} (attempt ${attempt})`);

          const blob = await client.imageToVideo({
            model,
            inputs: new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' }),
            parameters: {
              prompt,
              num_inference_steps: 30,
              guidance_scale: 7.5,
            },
          });

          const arrayBuffer = await blob.arrayBuffer();
          return Buffer.from(arrayBuffer);
        } catch (err: unknown) {
          const error = err as { status?: number; message?: string } & Error;
          console.error(`[HF] ${model} attempt ${attempt} failed:`, error.message || error);

          if (error.status === 503 && attempt < RETRY_ATTEMPTS) {
            const wait = RETRY_BACKOFF_MS * attempt;
            console.log(`[HF] Waiting ${wait}ms before retry...`);
            await new Promise(r => setTimeout(r, wait));
            continue;
          }
          // Break inner loop, try next model
          break;
        }
      }
    }

    throw new Error('All HuggingFace models failed to generate video clip. Please check your API key and try again.');
  }
}
