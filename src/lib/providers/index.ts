// Provider interface and factory for all video generation backends

export type ProviderName = 'huggingface' | 'luma' | 'runway' | 'kling';

export interface GenerateClipOptions {
  imageBuffer: Buffer;
  prompt: string;
  durationSeconds: number;
  motionIntensity?: 'subtle' | 'medium' | 'dynamic';
}

export interface VideoProvider {
  name: ProviderName;
  /** Clip duration this provider generates per call (in seconds) */
  clipDurationSeconds: number;
  generateClip(options: GenerateClipOptions): Promise<Buffer>;
}

export function getClipDuration(provider: ProviderName): number {
  switch (provider) {
    case 'huggingface': return 5;
    case 'luma': return 5;
    case 'runway': return 10;
    case 'kling': return 5;
    default: return 5;
  }
}

export function getClipsNeeded(targetDurationSeconds: number, provider: ProviderName): number {
  return Math.ceil(targetDurationSeconds / getClipDuration(provider));
}
