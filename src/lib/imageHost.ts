import { fal } from '@fal-ai/client';

/**
 * Uploads an image buffer to fal.ai storage and returns a public HTTPS URL.
 * Required for providers (Luma, Kling) that only accept image URLs.
 */
export async function uploadToFal(imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<string> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    throw new Error('FAL_KEY environment variable is required for Luma and Kling providers.');
  }

  fal.config({ credentials: falKey });

  const blob = new Blob([new Uint8Array(imageBuffer)], { type: mimeType });

  const url = await fal.storage.upload(blob);
  return url;
}
