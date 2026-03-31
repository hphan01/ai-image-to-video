'use client';

import { useRef, useState } from 'react';
import { Download, Clock, Cpu } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  provider: string;
  prompt?: string;
}

export default function VideoPlayer({ videoUrl, thumbnailUrl, duration, provider, prompt }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vidforge_${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rounded overflow-hidden border" style={{ borderColor: '#474747', background: '#252526' }}>
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        controls
        className="w-full max-h-96 bg-black"
        playsInline
      />

      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-3 text-xs" style={{ color: '#858585' }}>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ background: '#3c3c3c' }}>
            <Clock className="w-3 h-3" />
            {duration}s
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ background: '#3c3c3c' }}>
            <Cpu className="w-3 h-3" />
            {provider}
          </span>
          <span className="px-2.5 py-1 rounded" style={{ background: '#3c3c3c' }}>720P</span>
          <span className="px-2.5 py-1 rounded" style={{ background: 'rgba(35,209,139,0.15)', color: '#23d18b' }}>With Audio</span>
        </div>

        {prompt && (
          <p className="text-xs italic line-clamp-2" style={{ color: '#6c6c6c' }}>&ldquo;{prompt}&rdquo;</p>
        )}

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded transition-colors"
          style={{ background: '#0e639c' }}
          onMouseEnter={e => !isDownloading && (e.currentTarget.style.background = '#1177bb')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0e639c')}
        >
          <Download className="w-4 h-4" />
          {isDownloading ? 'Downloading...' : 'Download MP4'}
        </button>
      </div>
    </div>
  );
}
