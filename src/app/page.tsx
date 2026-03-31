'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import ProviderSelector from '@/components/ProviderSelector';
import GenerationOptions from '@/components/GenerationOptions';
import ProgressTracker from '@/components/ProgressTracker';
import VideoPlayer from '@/components/VideoPlayer';
import VideoGallery from '@/components/VideoGallery';
import { useVideoStore } from '@/lib/store';
import type { ProviderName } from '@/lib/providers';
import { Sparkles, Film } from 'lucide-react';

type Tab = 'create' | 'gallery';

interface GenerationResult {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  provider: string;
  videoId: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('create');

  // Upload state
  const [imageId, setImageId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Provider / options state
  const [provider, setProvider] = useState<ProviderName>('huggingface');
  const [duration, setDuration] = useState(60);
  const [prompt, setPrompt] = useState('Cinematic camera motion, smooth parallax, natural lighting');
  const [audioPrompt, setAudioPrompt] = useState('Atmospheric cinematic orchestral score, slow build, dramatic tension');
  const [motionIntensity, setMotionIntensity] = useState<'subtle' | 'medium' | 'dynamic'>('medium');

  // Generation state
  const [sseUrl, setSseUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const addVideo = useVideoStore(s => s.addVideo);
  const videos = useVideoStore(s => s.videos);

  const handleUpload = (id: string, url: string) => {
    setImageId(id);
    setImageUrl(url);
    setResult(null);
    setGenError(null);
    setSseUrl(null);
  };

  const handleGenerate = () => {
    if (!imageId) return;

    setIsGenerating(true);
    setGenError(null);
    setResult(null);

    const params = new URLSearchParams({
      imageId,
      provider,
      duration: String(duration),
      prompt,
      audioPrompt,
      motionIntensity,
    });

    setSseUrl(`/api/generate-video?${params.toString()}`);
  };

  const handleComplete = (res: GenerationResult) => {
    setResult(res);
    setIsGenerating(false);
    setSseUrl(null);

    addVideo({
      id: uuidv4(),
      videoUrl: res.videoUrl,
      thumbnailUrl: res.thumbnailUrl,
      duration: res.duration,
      provider: res.provider,
      prompt,
      audioPrompt,
      createdAt: new Date().toISOString(),
    });
  };

  const handleError = (message: string) => {
    setGenError(message);
    setIsGenerating(false);
    setSseUrl(null);
  };

  const handleOptionsChange = (updates: Partial<{
    duration: number;
    prompt: string;
    audioPrompt: string;
    motionIntensity: 'subtle' | 'medium' | 'dynamic';
  }>) => {
    if (updates.duration !== undefined) setDuration(updates.duration);
    if (updates.prompt !== undefined) setPrompt(updates.prompt);
    if (updates.audioPrompt !== undefined) setAudioPrompt(updates.audioPrompt);
    if (updates.motionIntensity !== undefined) setMotionIntensity(updates.motionIntensity);
  };

  const canGenerate = !!imageId && !isGenerating;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1e1e1e' }}>
      <Header />

      {/* Tabs */}
      <div className="border-b" style={{ borderColor: '#3c3c3c', background: '#252526' }}>
        <div className="max-w-6xl mx-auto px-6 flex gap-1 pt-2">
          {([
            { id: 'create', label: 'Create', icon: Sparkles },
            { id: 'gallery', label: `Gallery ${videos.length > 0 ? `(${videos.length})` : ''}`, icon: Film },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t transition-colors"
              style={activeTab === id
                ? { background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #474747', borderBottom: '1px solid #1e1e1e' }
                : { color: '#858585', background: 'transparent', border: '1px solid transparent' }
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="space-y-6">
              <ImageUploader onUpload={handleUpload} />
              <ProviderSelector selected={provider} onChange={setProvider} />
              <GenerationOptions
                provider={provider}
                duration={duration}
                prompt={prompt}
                audioPrompt={audioPrompt}
                motionIntensity={motionIntensity}
                onChange={handleOptionsChange}
              />

              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full py-4 rounded text-base font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-3"
                style={{ background: canGenerate ? '#0e639c' : '#3c3c3c', color: canGenerate ? '#ffffff' : '#6c6c6c', cursor: canGenerate ? 'pointer' : 'not-allowed' }}
                onMouseEnter={e => { if (canGenerate) e.currentTarget.style.background = '#1177bb'; }}
                onMouseLeave={e => { if (canGenerate) e.currentTarget.style.background = '#0e639c'; }}
              >
                <Sparkles className="w-5 h-5" />
                {isGenerating ? 'Generating...' : !imageId ? 'Upload an image first' : 'Generate Video'}
              </button>
            </div>

            {/* Right: Progress + Result */}
            <div className="space-y-6">
              {/* Info card when idle */}
              {!isGenerating && !result && !genError && (
                <div className="rounded p-6 space-y-4" style={{ border: '1px solid #474747', background: '#252526' }}>
                  <h2 className="text-lg font-bold" style={{ color: '#d4d4d4', fontFamily: 'monospace' }}>How it works</h2>
                  <ol className="space-y-3 text-sm" style={{ color: '#858585' }}>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#0d3a58', color: '#9cdcfe' }}>1</span>
                      <span>Upload your source image (JPEG, PNG, or WebP)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#0d3a58', color: '#9cdcfe' }}>2</span>
                      <span>Select a provider — free (HF Wan2.1) or paid (Luma, Runway, Kling)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#0d3a58', color: '#9cdcfe' }}>3</span>
                      <span>Choose duration, motion intensity, and prompts for video + audio</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#0d3a58', color: '#9cdcfe' }}>4</span>
                      <span>VidForge generates multiple clips, chains them for continuity, adds AI music, and delivers your final MP4</span>
                    </li>
                  </ol>

                  <div className="border-t pt-4 text-xs space-y-1" style={{ borderColor: '#474747', color: '#6c6c6c' }}>
                    <p>⚡ Free tier: ~2 min/clip. A 60s video ≈ 24 min total generation time.</p>
                    <p>💡 Start with 15s to test your settings before going to 60s.</p>
                  </div>
                </div>
              )}

              <ProgressTracker
                url={sseUrl}
                onComplete={handleComplete}
                onError={handleError}
              />

              {genError && (
                <div className="rounded p-4 text-sm" style={{ border: '1px solid rgba(244,71,71,0.4)', background: 'rgba(244,71,71,0.08)', color: '#f44747' }}>
                  <p className="font-semibold mb-1">Generation failed</p>
                  <p>{genError}</p>
                </div>
              )}

              {result && (
                <VideoPlayer
                  videoUrl={result.videoUrl}
                  thumbnailUrl={result.thumbnailUrl}
                  duration={result.duration}
                  provider={result.provider}
                  prompt={prompt}
                />
              )}
            </div>
          </div>
        ) : (
          <VideoGallery />
        )}
      </main>
    </div>
  );
}

