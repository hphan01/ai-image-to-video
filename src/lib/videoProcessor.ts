import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Configure fluent-ffmpeg to use bundled binaries
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
if (ffprobeStatic?.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

/**
 * Extracts the last frame of a video as a JPEG buffer.
 */
export function extractLastFrame(videoPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tmpOut = path.join(os.tmpdir(), `last_frame_${Date.now()}.jpg`);

    ffmpeg(videoPath)
      .inputOptions(['-sseof', '-0.5'])
      .outputOptions([
        '-frames:v', '1',
        '-f', 'image2',
        '-q:v', '2',
      ])
      .output(tmpOut)
      .on('end', () => {
        try {
          const buffer = fs.readFileSync(tmpOut);
          fs.unlinkSync(tmpOut);
          resolve(buffer);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
        reject(new Error(`extractLastFrame failed: ${err.message}`));
      })
      .run();
  });
}

/**
 * Concatenates an ordered list of video file paths into a single MP4.
 * Returns the path to the output file.
 */
export function concatenateClips(clipPaths: string[], outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (clipPaths.length === 0) {
      reject(new Error('No clips to concatenate'));
      return;
    }

    if (clipPaths.length === 1) {
      // Just copy the single clip
      fs.copyFileSync(clipPaths[0], outputPath);
      resolve(outputPath);
      return;
    }

    // Write a concat list file
    const listFile = path.join(os.tmpdir(), `concat_list_${Date.now()}.txt`);
    const lines = clipPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(listFile, lines, 'utf-8');

    ffmpeg()
      .input(listFile)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions(['-c', 'copy'])
      .output(outputPath)
      .on('end', () => {
        fs.unlinkSync(listFile);
        resolve(outputPath);
      })
      .on('error', (err) => {
        if (fs.existsSync(listFile)) fs.unlinkSync(listFile);
        reject(new Error(`concatenateClips failed: ${err.message}`));
      })
      .run();
  });
}

/**
 * Mixes an audio file into a video. Audio loops if shorter than video,
 * and is trimmed if longer. Returns the path to the output file.
 */
export function mixAudioWithVideo(
  videoPath: string,
  audioPath: string,
  outputPath: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        // Loop audio if shorter than video
        '-stream_loop', '-1',
        '-map', '0:v:0',
        '-map', '1:a:0',
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(new Error(`mixAudioWithVideo failed: ${err.message}`)))
      .run();
  });
}

/**
 * Extracts the first frame of a video as a JPEG thumbnail.
 * Returns the path to the saved thumbnail.
 */
export function generateThumbnail(videoPath: string, thumbnailPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        '-ss', '0',
        '-frames:v', '1',
        '-f', 'image2',
        '-q:v', '3',
      ])
      .output(thumbnailPath)
      .on('end', () => resolve(thumbnailPath))
      .on('error', (err) => reject(new Error(`generateThumbnail failed: ${err.message}`)))
      .run();
  });
}

/**
 * Gets the duration of a video in seconds using ffprobe.
 */
export function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(new Error(`getVideoDuration failed: ${err.message}`));
      const duration = metadata?.format?.duration;
      if (duration === undefined) return reject(new Error('Could not read video duration'));
      resolve(duration);
    });
  });
}
