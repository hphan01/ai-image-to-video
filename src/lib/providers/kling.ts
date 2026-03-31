import { fal } from '@fal-ai/client';
import type { QueueStatus } from '@fal-ai/client';
import type { VideoProvider, GenerateClipOptions } from './index';
import { uploadToFal } from '../imageHost';

const KLING_MODEL = 'fal-ai/kling-video/v2.6/pro/image-to-video';

type KlingMotionStrength = 'low' | 'medium' | 'high';

function toKlingMotion(intensity?: string): KlingMotionStrength {
  switch (intensity) {
    case 'subtle': return 'low';
    case 'dynamic': return 'high';
    default: return 'medium';
  }
}

export class KlingProvider implements VideoProvider {
  name = 'kling' as const;
  clipDurationSeconds = 5;

  async generateClip({ imageBuffer, prompt, motionIntensity }: GenerateClipOptions): Promise<Buffer> {
    const imageUrl = await uploadToFal(imageBuffer, 'image/jpeg');

    console.log('[Kling] Submitting to fal.ai...');

    const result = await fal.subscribe(KLING_MODEL, {
      input: {
        prompt,
        image_url: imageUrl,
        duration: '5',
        aspect_ratio: '16:9',
        motion_strength: toKlingMotion(motionIntensity),
        cfg_scale: 0.5,
      },
      logs: true,
      onQueueUpdate: (update: QueueStatus) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('[Kling] In progress...');
        }
      },
    });

    const videoUrl = (result.data as { video?: { url?: string } })?.video?.url;
    if (!videoUrl) {
      throw new Error('[Kling] No video URL in fal.ai response');
    }

    console.log('[Kling] Downloading clip...');
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error(`[Kling] Failed to download video: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
