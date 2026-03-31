# VidForge AI

A web application for generating AI motion videos from a single source image, with support for both **free** and **paid** AI providers. Output videos are at least 60 seconds with AI-generated background music. Built with Next.js 14, React 18, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

🎬 **Image-to-Video Generation**
- Upload any JPEG, PNG, or WebP image (up to 10 MB) and animate it into a motion video
- Outputs MP4 files up to 120 seconds in duration
- Multiple clips are generated, chained for continuity, and merged into a single final video

🆓 **Free & Paid Provider Toggle**
- **Free**: HuggingFace `Wan-AI/Wan2.1-I2V-14B-720P` — no API cost, runs on HF Inference
- **Paid**: Luma Ray-2, Runway gen4_turbo, Kling v2.6 (via fal.ai) — faster, higher quality
- Provider cards are enabled/disabled based on which API keys are detected in your environment

🎵 **AI-Generated Audio**
- Background music synthesised by `facebook/musicgen-medium` via HuggingFace Inference
- Provide a text prompt to describe the mood (e.g. *"atmospheric orchestral score, slow dramatic build"*)
- Audio is mixed and embedded into the final MP4

⚙️ **Generation Controls**
- Duration presets: 15s, 30s, 60s, 120s (plus a 5–120s range slider)
- Motion intensity: Subtle, Medium, Dynamic
- Separate prompts for video motion and background audio
- Real-time progress via **Server-Sent Events (SSE)** with per-phase step tracking

💾 **Gallery & History**
- Auto-saves every generated video to browser `localStorage` via Zustand
- Persistent across browser sessions
- Download or delete individual videos from the gallery

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, `src/` layout) |
| UI | React 18, TypeScript, Tailwind CSS 3.4 |
| State | Zustand v5 (localStorage-persisted) |
| AI — Free video | `Wan-AI/Wan2.1-I2V-14B-720P` via `@huggingface/inference` |
| AI — Luma | Luma Ray-2 via `lumaai` SDK |
| AI — Runway | Runway gen4_turbo via `@runwayml/sdk` |
| AI — Kling | Kling v2.6 via `@fal-ai/client` |
| AI — Audio | `facebook/musicgen-medium` via HuggingFace Inference |
| Video processing | `fluent-ffmpeg` + `ffmpeg-static` + `ffprobe-static` |
| Image processing | `sharp` |
| Icons | Lucide React |

## Prerequisites

- Node.js 18+ and npm
- **Free tier**: A Hugging Face API key with Inference access — <https://huggingface.co/settings/tokens>
- **Paid tier** (optional — any combination):
  - Luma AI API key — <https://lumaai.com>
  - Runway API key — <https://runwayml.com>
  - fal.ai API key (for Kling) — <https://fal.ai>

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get your API keys

**Required for the free HuggingFace provider:**
1. Go to <https://huggingface.co/settings/tokens>
2. Create a token with **Read** access (or **Inference** scope)
3. Copy the token

**Optional paid providers** (add whichever you want to unlock):
- **Luma**: Create an account at <https://lumaai.com> → API Keys
- **Runway**: Create an account at <https://runwayml.com> → API Keys
- **Kling** (via fal.ai): Create an account at <https://fal.ai> → API Keys

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Required — HuggingFace (free provider)
HF_API_KEY=your_huggingface_api_key_here

# Optional — paid providers (leave blank to disable that provider card)
LUMA_API_KEY=your_luma_api_key_here
RUNWAY_API_KEY=your_runway_api_key_here
FAL_KEY=your_fal_api_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open <http://localhost:3000> in your browser.

## Usage

### Create tab

1. **Upload** your source image — drag-and-drop or click to browse
2. **Select a provider** — the card shows Free or Paid and is greyed out if the key is missing
3. **Configure generation options**:
   - Choose a duration preset or drag the slider (5–120 s)
   - Set motion intensity: Subtle / Medium / Dynamic
   - Write a **Motion Prompt** describing how the scene should move
   - Write an **Audio Prompt** describing the background music
4. Click **Generate Video** — a real-time progress tracker shows each phase via SSE
5. When complete, the video plays in-page with a Download button

### Gallery tab

- All generated videos are saved automatically
- Click **Download** on any card to save the MP4
- Click the trash icon to remove a video from the gallery
- **Clear all** with the toolbar button (requires confirmation)

## Provider Reference

| Provider | Model | Tier | Clip length | Quality |
|---|---|---|---|---|
| HuggingFace | `Wan-AI/Wan2.1-I2V-14B-720P` | Free | ~5 s/clip | Good |
| Luma | Ray-2 | Paid | ~5 s/clip | Excellent |
| Runway | gen4_turbo | Paid | ~10 s/clip | Excellent |
| Kling (fal.ai) | v2.6 | Paid | ~5 s/clip | Excellent |

> **Note**: The free HuggingFace tier can take ~2 minutes per clip. A 60-second video requires ~12 clips, so expect ~24 minutes total generation time. Paid providers are significantly faster.

Provider cards in the UI show a **Free** or **Paid** badge and are automatically disabled if the corresponding environment variable is not set. The app checks `/api/provider-status` on load.

## Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production build
npm run lint     # ESLint (eslint-config-next@14)
```

## File Structure

```
ai-image-to-video/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-video/route.ts   # SSE streaming endpoint — orchestrates generation
│   │   │   ├── provider-status/route.ts  # Returns which API keys are configured
│   │   │   └── upload-image/route.ts     # Accepts image upload, returns imageId
│   │   ├── layout.tsx
│   │   ├── page.tsx                      # Tab layout (Create / Gallery) + SSE lifecycle
│   │   └── globals.css
│   ├── components/
│   │   ├── Header.tsx                    # VidForge brand header (VS Code theme)
│   │   ├── ImageUploader.tsx             # Drag-and-drop upload with preview
│   │   ├── ProviderSelector.tsx          # 4-card provider picker with key status
│   │   ├── GenerationOptions.tsx         # Duration, intensity, motion + audio prompts
│   │   ├── ProgressTracker.tsx           # SSE consumer — progress bar, step dots, timer
│   │   ├── VideoPlayer.tsx               # Video playback with metadata and download
│   │   └── VideoGallery.tsx              # Saved video grid with download/delete
│   ├── lib/
│   │   ├── providers/
│   │   │   ├── index.ts                  # Provider interface + dispatcher
│   │   │   ├── huggingface.ts            # Wan2.1 I2V implementation
│   │   │   ├── luma.ts                   # Luma Ray-2 implementation
│   │   │   ├── runway.ts                 # Runway gen4_turbo implementation
│   │   │   └── kling.ts                  # Kling v2.6 via fal.ai implementation
│   │   ├── audioGenerator.ts             # MusicGen audio synthesis via HF Inference
│   │   ├── imageHost.ts                  # Temporary image hosting for provider URLs
│   │   ├── videoProcessor.ts             # ffmpeg clip chaining + audio mixing
│   │   └── store.ts                      # Zustand store with localStorage persistence
│   └── types/
│       └── ffprobe-static.d.ts           # Type declaration for ffprobe-static
├── .env.local                            # Your API keys (not committed)
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## API Reference

### `GET /api/provider-status`

Returns the configuration status of all four providers.

**Response:**
```json
{
  "huggingface": true,
  "luma": false,
  "runway": true,
  "kling": false
}
```

---

### `POST /api/upload-image`

Accepts a multipart form upload and stores the image temporarily on disk.

**Request:** `multipart/form-data` with field `image` (JPEG / PNG / WebP, max 20 MB)

**Success response:**
```json
{
  "imageId": "550e8400-e29b-41d4-a716-446655440000",
  "url": "/api/upload-image?id=550e8400..."
}
```

**Error response:**
```json
{ "error": "No image file provided" }
```

---

### `GET /api/generate-video` (SSE)

Streams real-time progress events and returns the final video URL.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `imageId` | string | ID returned by `/api/upload-image` |
| `provider` | `huggingface` \| `luma` \| `runway` \| `kling` | AI provider to use |
| `duration` | number | Target duration in seconds (5–120) |
| `prompt` | string | Motion description prompt |
| `audioPrompt` | string | Background music description prompt |
| `motionIntensity` | `subtle` \| `medium` \| `dynamic` | Intensity level |

**SSE event types:**

```jsonc
// Progress update
{ "type": "progress", "phase": "generating", "message": "Generating clip 3/12", "step": 3, "progress": 25 }

// Completion
{ "type": "complete", "videoUrl": "/videos/output-uuid.mp4", "thumbnailUrl": "...", "duration": 60, "provider": "huggingface", "videoId": "uuid" }

// Error
{ "type": "error", "message": "Provider API returned 429 — rate limited" }
```

## Troubleshooting

### HuggingFace model returns 503 / "Model is loading"
- The free HF inference tier cold-starts inactive models; wait ~30 seconds and retry
- The provider implementation has automatic retry with backoff before surfacing the error

### Video generation times out on free tier
- A 60-second video with Wan2.1 can take up to 30 minutes on the free tier
- Start with a **15-second** test to validate your prompt and image before requesting longer videos
- Consider a paid provider for production use

### "Missing key" shown on provider card
- Verify the corresponding variable is in `.env.local` (not `.env` or `.env.development`)
- Restart the dev server after editing `.env.local`
- Check `NEXT_PUBLIC_*` vs server-side variable naming — all keys in this app are **server-only** (no `NEXT_PUBLIC_` prefix)

### Audio not in the final video
- Audio synthesis uses `facebook/musicgen-medium` on HuggingFace — it can fail silently when the model is cold
- The video will still be delivered without audio; retry or rephrase your audio prompt
- Check the SSE progress events in the browser DevTools Network tab for `generate-video` to see per-phase messages

### ffmpeg errors on Windows
- `ffmpeg-static` and `ffprobe-static` bundle their own binaries; no system install is needed
- If you see permission errors, try running the terminal as Administrator

### Images not saving to gallery
- Gallery data is stored in browser `localStorage` (typically 5–10 MB limit)
- Delete older videos from the Gallery tab to free space

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo at <https://vercel.com>
3. Add environment variables: `HF_API_KEY`, and any paid keys you want
4. Deploy

```bash
# Or via CLI:
npx vercel
```

> **Note**: Vercel Hobby has a 10-second function timeout. Video generation can take minutes. Use a **Pro** plan or deploy to a platform without function timeout limits.

### Other Node.js platforms

Compatible with Railway, Render, Fly.io, and any Node.js 18+ host. Set all environment variables on the platform and ensure the server has enough RAM for ffmpeg operations (~512 MB minimum).

## Browser Support

Chrome/Edge 90+, Firefox 88+, Safari 14+, iOS Safari, Chrome Mobile

## License

MIT License — see LICENSE file for details

## Acknowledgments

- Powered by [Hugging Face](https://huggingface.co/), [Luma AI](https://lumaai.com), [Runway](https://runwayml.com), and [fal.ai](https://fal.ai)
- Video model: [Wan-AI/Wan2.1-I2V-14B-720P](https://huggingface.co/Wan-AI/Wan2.1-I2V-14B-720P)
- Audio model: [facebook/musicgen-medium](https://huggingface.co/facebook/musicgen-medium)
- Built with [Next.js](https://nextjs.org/) & [React](https://react.dev/)
- UI by [Tailwind CSS](https://tailwindcss.com/) & [Lucide](https://lucide.dev/)
- Video processing by [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)

---

**Happy video generating! 🎬**
