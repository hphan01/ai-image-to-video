import { NextRequest } from 'next/server';
import { readFile, writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { HuggingFaceProvider } from '@/lib/providers/huggingface';
import { LumaProvider } from '@/lib/providers/luma';
import { RunwayProvider } from '@/lib/providers/runway';
import { KlingProvider } from '@/lib/providers/kling';
import { getClipDuration, getClipsNeeded, VideoProvider, ProviderName } from '@/lib/providers';
import {
  extractLastFrame,
  concatenateClips,
  mixAudioWithVideo,
  generateThumbnail,
} from '@/lib/videoProcessor';
import { generateMusic } from '@/lib/audioGenerator';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes

// SSE helper
function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function getProvider(name: ProviderName): VideoProvider {
  switch (name) {
    case 'huggingface': {
      const key = process.env.HF_API_KEY;
      if (!key) throw new Error('HF_API_KEY is not set');
      return new HuggingFaceProvider(key);
    }
    case 'luma': {
      const key = process.env.LUMA_API_KEY;
      if (!key) throw new Error('LUMA_API_KEY is not set');
      return new LumaProvider(key);
    }
    case 'runway': {
      const key = process.env.RUNWAYML_API_SECRET;
      if (!key) throw new Error('RUNWAYML_API_SECRET is not set');
      return new RunwayProvider(key);
    }
    case 'kling': {
      const key = process.env.FAL_KEY;
      if (!key) throw new Error('FAL_KEY is not set');
      return new KlingProvider();
    }
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const imageId = searchParams.get('imageId');
  const providerName = (searchParams.get('provider') || 'huggingface') as ProviderName;
  const targetDuration = Math.min(parseInt(searchParams.get('duration') || '60', 10), 120);
  const prompt = searchParams.get('prompt') || 'Cinematic motion, smooth camera movement';
  const audioPrompt = searchParams.get('audioPrompt') || 'Ambient cinematic background music';
  const motionIntensity = (searchParams.get('motionIntensity') || 'medium') as 'subtle' | 'medium' | 'dynamic';

  if (!imageId) {
    return new Response(sseEvent({ type: 'error', message: 'imageId is required' }), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  const sessionId = uuidv4();
  const clipsDir = path.join(process.cwd(), 'public', 'temp', 'clips', sessionId);
  const videosDir = path.join(process.cwd(), 'public', 'videos');
  const thumbnailsDir = path.join(process.cwd(), 'public', 'videos');
  const tempImageDir = path.join(process.cwd(), 'public', 'temp', 'images');

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(new TextEncoder().encode(sseEvent(data)));
        } catch {
          // Stream may be closed by client
        }
      };

      const tempFiles: string[] = [];

      try {
        await mkdir(clipsDir, { recursive: true });
        await mkdir(videosDir, { recursive: true });

        // Find the uploaded image file
        send({ type: 'progress', step: 0, message: 'Loading uploaded image...' });

        const imageFiles = await import('fs').then(m =>
          m.readdirSync(tempImageDir).filter(f => f.startsWith(imageId))
        );

        if (imageFiles.length === 0) {
          throw new Error(`Image not found for id: ${imageId}. Please re-upload.`);
        }

        const imagePath = path.join(tempImageDir, imageFiles[0]);
        let currentFrameBuffer: Buffer = await readFile(imagePath);

        const provider = getProvider(providerName);
        const clipDuration = getClipDuration(providerName);
        const totalClips = getClipsNeeded(targetDuration, providerName);
        const clipPaths: string[] = [];

        send({
          type: 'progress',
          step: 0,
          total: totalClips,
          message: `Starting generation with ${providerName} (${totalClips} clips × ${clipDuration}s)...`,
        });

        // === CLIP GENERATION LOOP ===
        for (let i = 0; i < totalClips; i++) {
          send({
            type: 'progress',
            step: i + 1,
            total: totalClips,
            message: `Generating clip ${i + 1} of ${totalClips}...`,
            phase: 'video',
          });

          const clipBuffer = await provider.generateClip({
            imageBuffer: currentFrameBuffer,
            prompt,
            durationSeconds: clipDuration,
            motionIntensity,
          });

          const clipFileName = `clip_${String(i).padStart(3, '0')}.mp4`;
          const clipPath = path.join(clipsDir, clipFileName);
          await writeFile(clipPath, clipBuffer);
          clipPaths.push(clipPath);
          tempFiles.push(clipPath);

          // Extract last frame for next clip (continuity chaining)
          if (i < totalClips - 1) {
            send({
              type: 'progress',
              step: i + 1,
              total: totalClips,
              message: `Extracting transition frame ${i + 1}...`,
              phase: 'video',
            });
            currentFrameBuffer = await extractLastFrame(clipPath) as Buffer;
          }
        }

        // === CONCATENATE CLIPS ===
        send({ type: 'progress', step: totalClips, total: totalClips, message: 'Stitching clips together...', phase: 'concat' });

        const rawVideoId = uuidv4();
        const rawVideoPath = path.join(clipsDir, `raw_${rawVideoId}.mp4`);
        tempFiles.push(rawVideoPath);
        await concatenateClips(clipPaths, rawVideoPath);

        // === GENERATE AUDIO ===
        send({ type: 'progress', step: totalClips, total: totalClips, message: 'Generating background music...', phase: 'audio' });

        const audioBuffer = await generateMusic(audioPrompt, targetDuration);
        const audioPath = path.join(clipsDir, `audio_${rawVideoId}.wav`);
        tempFiles.push(audioPath);
        await writeFile(audioPath, audioBuffer);

        // === MIX AUDIO + VIDEO ===
        send({ type: 'progress', step: totalClips, total: totalClips, message: 'Mixing audio with video...', phase: 'audio' });

        const finalVideoId = uuidv4();
        const finalVideoFileName = `${finalVideoId}.mp4`;
        const finalVideoPath = path.join(videosDir, finalVideoFileName);
        await mixAudioWithVideo(rawVideoPath, audioPath, finalVideoPath);

        // === GENERATE THUMBNAIL ===
        send({ type: 'progress', step: totalClips, total: totalClips, message: 'Generating thumbnail...', phase: 'thumbnail' });

        const thumbnailFileName = `${finalVideoId}_thumb.jpg`;
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFileName);
        await generateThumbnail(finalVideoPath, thumbnailPath);

        // === CLEANUP TEMP FILES ===
        for (const f of tempFiles) {
          try { await unlink(f); } catch { /* ignore */ }
        }
        try {
          await import('fs').then(m => m.rmdirSync(clipsDir));
        } catch { /* ignore */ }

        send({
          type: 'complete',
          videoId: finalVideoId,
          videoUrl: `/videos/${finalVideoFileName}`,
          thumbnailUrl: `/videos/${thumbnailFileName}`,
          duration: targetDuration,
          provider: providerName,
        });
      } catch (error: unknown) {
        const err = error as Error;
        console.error('[generate-video]', err.message, err.stack);

        // Best-effort cleanup
        for (const f of tempFiles) {
          try { await unlink(f); } catch { /* ignore */ }
        }

        send({ type: 'error', message: err.message || 'An unexpected error occurred during video generation.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
