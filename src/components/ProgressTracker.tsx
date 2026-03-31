'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface SSEEvent {
  type: 'progress' | 'complete' | 'error';
  step?: number;
  total?: number;
  message?: string;
  phase?: 'video' | 'concat' | 'audio' | 'thumbnail';
  videoId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  provider?: string;
}

interface ProgressTrackerProps {
  url: string | null;
  onComplete: (result: { videoUrl: string; thumbnailUrl: string; duration: number; provider: string; videoId: string }) => void;
  onError: (message: string) => void;
}

const PHASE_LABELS: Record<string, string> = {
  video: 'Generating video clips',
  concat: 'Stitching clips together',
  audio: 'Generating audio',
  thumbnail: 'Creating thumbnail',
};

export default function ProgressTracker({ url, onComplete, onError }: ProgressTrackerProps) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [latest, setLatest] = useState<SSEEvent | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isError, setIsError] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!url) return;

    setEvents([]);
    setLatest(null);
    setIsDone(false);
    setIsError(false);
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (evt) => {
      const data: SSEEvent = JSON.parse(evt.data);
      setLatest(data);
      setEvents(prev => [...prev, data]);

      if (data.type === 'complete') {
        setIsDone(true);
        if (timerRef.current) clearInterval(timerRef.current);
        onComplete({
          videoUrl: data.videoUrl!,
          thumbnailUrl: data.thumbnailUrl!,
          duration: data.duration!,
          provider: data.provider!,
          videoId: data.videoId!,
        });
        es.close();
      } else if (data.type === 'error') {
        setIsError(true);
        if (timerRef.current) clearInterval(timerRef.current);
        onError(data.message || 'Unknown error');
        es.close();
      }
    };

    es.onerror = () => {
      if (!isDone && !isError) {
        setIsError(true);
        if (timerRef.current) clearInterval(timerRef.current);
        onError('Connection to server lost. Please try again.');
      }
      es.close();
    };

    return () => {
      es.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!url) return null;

  const progress = latest?.total ? Math.round(((latest.step ?? 0) / latest.total) * 100) : 0;
  const phasedProgress = isDone ? 100 : isError ? progress : Math.min(progress, 95);

  return (
    <div className="space-y-4 p-5 rounded border" style={{ background: '#252526', borderColor: '#474747' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isError ? (
            <XCircle className="w-5 h-5" style={{ color: '#f44747' }} />
          ) : isDone ? (
            <CheckCircle className="w-5 h-5" style={{ color: '#23d18b' }} />
          ) : (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#007acc' }} />
          )}
          <span className="text-sm font-semibold" style={{ color: isError ? '#f44747' : isDone ? '#23d18b' : '#d4d4d4' }}>
            {isError ? 'Generation Failed' : isDone ? 'Generation Complete!' : 'Generating Video...'}
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color: '#858585' }}>
          {formatElapsed(elapsedSeconds)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#3c3c3c' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${phasedProgress}%`,
              background: isError ? '#f44747' : isDone ? '#23d18b' : '#007acc',
            }}
          />
        </div>
        <div className="flex justify-between text-xs" style={{ color: '#6c6c6c' }}>
          <span>
            {latest?.phase ? PHASE_LABELS[latest.phase] || latest.phase : 'Initializing...'}
          </span>
          <span>{phasedProgress}%</span>
        </div>
      </div>

      {/* Current step message */}
      {latest?.message && (
        <p className="text-xs rounded px-3 py-2" style={{ color: '#858585', background: 'rgba(0,0,0,0.3)' }}>
          {latest.message}
        </p>
      )}

      {/* Step counter */}
      {latest?.total && !isDone && (
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: latest.total }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < (latest.step ?? 0) ? 'bg-[#007acc]' : 'bg-[#3c3c3c]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
