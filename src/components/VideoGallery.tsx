'use client';

import { useState } from 'react';
import { Trash2, Download, Play, Clock, Cpu } from 'lucide-react';
import { useVideoStore, VideoEntry } from '@/lib/store';

export default function VideoGallery() {
  const { videos, removeVideo, clearAll } = useVideoStore();
  const [confirmClear, setConfirmClear] = useState(false);

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20" style={{ color: '#6c6c6c' }}>
        <Play className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-lg font-semibold">No videos yet</p>
        <p className="text-sm mt-1">Generate your first video on the Create tab</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: '#858585' }}>{videos.length} video{videos.length !== 1 ? 's' : ''}</p>
        {confirmClear ? (
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: '#f44747' }}>Clear all?</span>
            <button
              onClick={() => { clearAll(); setConfirmClear(false); }}
              className="text-xs text-white px-3 py-1.5 rounded"
              style={{ background: '#c72e0f' }}
            >
              Yes, clear
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="text-xs px-3 py-1.5 rounded"
              style={{ background: '#3c3c3c', color: '#d4d4d4' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="text-xs transition-colors flex items-center gap-1" style={{ color: '#6c6c6c' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f44747')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6c6c6c')}
          >
            <Trash2 className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onRemove={removeVideo} />
        ))}
      </div>
    </div>
  );
}

function VideoCard({ video, onRemove }: { video: VideoEntry; onRemove: (id: string) => void }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vidforge_${video.id}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedDate = new Date(video.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="group rounded overflow-hidden border transition-colors" style={{ borderColor: '#474747', background: '#252526' }}>
      {/* Thumbnail / Video */}
      <div className="relative aspect-video bg-black">
        <video
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          controls
          className="absolute inset-0 w-full h-full object-contain"
          playsInline
        />
      </div>

      {/* Meta */}
      <div className="p-3 space-y-2">
        <div className="flex flex-wrap gap-1.5 text-xs" style={{ color: '#858585' }}>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: '#3c3c3c' }}>
            <Clock className="w-3 h-3" /> {video.duration}s
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: 'rgba(0,122,204,0.2)', color: '#9cdcfe' }}>
            <Cpu className="w-3 h-3" /> {video.provider}
          </span>
        </div>

        {video.prompt && (
          <p className="text-xs italic line-clamp-1" style={{ color: '#6c6c6c' }}>&ldquo;{video.prompt}&rdquo;</p>
        )}

<p className="text-xs" style={{ color: '#6c6c6c' }}>{formattedDate}</p>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded transition-colors disabled:opacity-50"
            style={{ background: '#3c3c3c', color: '#d4d4d4' }}
            onMouseEnter={e => { if (!isDownloading) e.currentTarget.style.background = '#4c4c4c'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#3c3c3c'; }}
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloading ? 'Saving...' : 'Download'}
          </button>
          <button
            onClick={() => onRemove(video.id)}
            className="flex items-center justify-center gap-1.5 text-xs py-1.5 px-2.5 rounded transition-colors"
            style={{ background: '#3c3c3c', color: '#858585' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#c72e0f'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#3c3c3c'; e.currentTarget.style.color = '#858585'; }}
            title="Remove from gallery"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
