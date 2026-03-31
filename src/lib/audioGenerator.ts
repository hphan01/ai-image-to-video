import { InferenceClient } from '@huggingface/inference';

const MUSIC_MODELS = [
  'facebook/musicgen-medium',
  'facebook/musicgen-small',
];

/**
 * Generates background music as a WAV buffer using Meta MusicGen via HuggingFace Inference API.
 * Duration is approximate — controlled via token count.
 * Note: MusicGen is CC-BY-NC 4.0 (non-commercial use only).
 */
export async function generateMusic(prompt: string, targetDurationSeconds: number): Promise<Buffer> {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    throw new Error('HF_API_KEY is required for audio generation');
  }

  const client = new InferenceClient(apiKey);

  // MusicGen: ~50 audio tokens per second at 32kHz
  // 256 tokens ≈ 5s, cap at reasonable limit
  const maxNewTokens = Math.min(Math.ceil(targetDurationSeconds * 50), 1500);

  for (const model of MUSIC_MODELS) {
    try {
      console.log(`[Audio] Generating ${targetDurationSeconds}s music with ${model}...`);

      const blob = await client.textToSpeech({
        model,
        inputs: prompt,
        parameters: {
          max_new_tokens: maxNewTokens,
        },
      });

      const arrayBuffer = await blob.arrayBuffer();
      console.log(`[Audio] Generated audio blob: ${arrayBuffer.byteLength} bytes`);
      return Buffer.from(arrayBuffer);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`[Audio] Model ${model} failed:`, error.message);
      // Try next model
    }
  }

  throw new Error('All MusicGen models failed. Check your HF_API_KEY and rate limits.');
}
