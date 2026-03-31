'use client';

import { getClipDuration, getClipsNeeded, ProviderName } from '@/lib/providers';

const DURATION_PRESETS = [15, 30, 60];
const MOTION_OPTIONS = [
  { value: 'subtle', label: 'Subtle', description: 'Gentle, minimal movement' },
  { value: 'medium', label: 'Medium', description: 'Natural, balanced motion' },
  { value: 'dynamic', label: 'Dynamic', description: 'Energetic, strong movement' },
] as const;

interface GenerationOptionsProps {
  provider: ProviderName;
  duration: number;
  prompt: string;
  audioPrompt: string;
  motionIntensity: 'subtle' | 'medium' | 'dynamic';
  onChange: (updates: Partial<{
    duration: number;
    prompt: string;
    audioPrompt: string;
    motionIntensity: 'subtle' | 'medium' | 'dynamic';
  }>) => void;
}

export default function GenerationOptions({
  provider,
  duration,
  prompt,
  audioPrompt,
  motionIntensity,
  onChange,
}: GenerationOptionsProps) {
  const clipDuration = getClipDuration(provider);
  const clipCount = getClipsNeeded(duration, provider);
  // Rough estimate: ~2 minutes/clip for free, ~1 min for paid
  const estimatedMinutes = provider === 'huggingface' ? clipCount * 2 : clipCount * 1;

  return (
    <div className="space-y-5">
      {/* Duration */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold" style={{ color: '#9cdcfe' }}>Video Duration</label>
          <span className="text-xs" style={{ color: '#858585' }}>
            {clipCount} clips × {clipDuration}s ≈ {estimatedMinutes} min generation
          </span>
        </div>

        <div className="flex gap-2">
          {DURATION_PRESETS.map(d => (
            <button
              key={d}
              onClick={() => onChange({ duration: d })}
              className="flex-1 py-2 rounded text-sm font-semibold transition-colors"
              style={{
                background: duration === d ? '#007acc' : '#3c3c3c',
                color: duration === d ? '#ffffff' : '#d4d4d4',
              }}
            >
              {d}s
            </button>
          ))}
        </div>

        <input
          type="range"
          min={5}
          max={120}
          step={5}
          value={duration}
          onChange={e => onChange({ duration: parseInt(e.target.value, 10) })}
          className="w-full h-1.5 rounded-full cursor-pointer" style={{ accentColor: '#007acc' }}
        />
        <div className="flex justify-between text-xs" style={{ color: '#6c6c6c' }}>
          <span>5s</span>
          <span className="font-semibold" style={{ color: '#569cd6' }}>{duration}s selected</span>
          <span>120s</span>
        </div>
      </div>

      {/* Motion Intensity */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold" style={{ color: '#9cdcfe' }}>Motion Intensity</label>
        <div className="flex gap-2">
          {MOTION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ motionIntensity: opt.value })}
              title={opt.description}
              className="flex-1 py-2 rounded text-sm font-semibold transition-colors"
              style={{
                background: motionIntensity === opt.value ? '#007acc' : '#3c3c3c',
                color: motionIntensity === opt.value ? '#ffffff' : '#d4d4d4',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Video Prompt */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold" style={{ color: '#9cdcfe' }}>
          Motion Prompt
          <span className="ml-2 text-xs font-normal" style={{ color: '#6c6c6c' }}>Describe how the scene should move</span>
        </label>
        <textarea
          value={prompt}
          onChange={e => onChange({ prompt: e.target.value })}
          placeholder="Smooth cinematic camera pan, gentle wind moving through the scene, natural lighting..."
          rows={3}
          className="w-full rounded px-3 py-2.5 text-sm resize-none transition-colors"
          style={{ background: '#3c3c3c', border: '1px solid #474747', color: '#d4d4d4', outline: 'none' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#007fd4')}
          onBlur={e => (e.currentTarget.style.borderColor = '#474747')}
        />
      </div>

      {/* Audio Prompt */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold" style={{ color: '#9cdcfe' }}>
          Audio Prompt
          <span className="ml-2 text-xs font-normal" style={{ color: '#6c6c6c' }}>AI-generated background music (MusicGen)</span>
        </label>
        <textarea
          value={audioPrompt}
          onChange={e => onChange({ audioPrompt: e.target.value })}
          placeholder="Atmospheric cinematic score, orchestral, slow build, dramatic tension..."
          rows={2}
          className="w-full rounded px-3 py-2.5 text-sm resize-none transition-colors"
          style={{ background: '#3c3c3c', border: '1px solid #474747', color: '#d4d4d4', outline: 'none' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#007fd4')}
          onBlur={e => (e.currentTarget.style.borderColor = '#474747')}
        />
        <p className="text-xs" style={{ color: '#cca700' }}>
          Note: MusicGen is CC-BY-NC 4.0 — for non-commercial use only.
        </p>
      </div>
    </div>
  );
}
