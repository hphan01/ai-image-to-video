'use client';

import { Film } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full border-b px-6 py-3" style={{ background: '#252526', borderColor: '#474747' }}>
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded" style={{ background: '#007acc' }}>
          <Film className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-widest" style={{ color: '#d4d4d4', fontFamily: 'monospace' }}>VIDFORGE</h1>
          <p className="text-xs font-medium" style={{ color: '#858585' }}>AI Image-to-Video Generator</p>
        </div>
      </div>
    </header>
  );
}
