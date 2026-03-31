'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (imageId: string, imageUrl: string) => void;
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      onUpload(data.imageId, data.imageUrl);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clear = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold" style={{ color: '#9cdcfe' }}>Source Image</label>

      {preview ? (
        <div className="relative rounded overflow-hidden border" style={{ borderColor: '#474747' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Uploaded source" className="w-full max-h-72 object-contain" style={{ background: '#2d2d2d' }} />
          <button
            onClick={clear}
            className="absolute top-2 right-2 rounded-full p-1.5 transition-colors"
            style={{ background: 'rgba(30,30,30,0.85)', color: '#d4d4d4' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#c72e0f')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(30,30,30,0.85)')}
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="flex flex-col items-center justify-center gap-3 p-10 rounded border-2 border-dashed cursor-pointer transition-all duration-200"
          style={{
            borderColor: isDragging ? '#007fd4' : '#474747',
            background: isDragging ? 'rgba(0,127,212,0.08)' : '#2d2d2d',
          }}
        >
          {isUploading ? (
            <>
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#007acc', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: '#858585' }}>Uploading...</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-14 h-14 rounded-full" style={{ background: '#3c3c3c' }}>
                {isDragging ? (
                  <ImageIcon className="w-7 h-7" style={{ color: '#569cd6' }} />
                ) : (
                  <Upload className="w-7 h-7" style={{ color: '#858585' }} />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: '#d4d4d4' }}>
                  {isDragging ? 'Drop it here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs mt-1" style={{ color: '#6c6c6c' }}>JPEG, PNG, or WebP — max 10 MB</p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <p className="text-sm rounded px-3 py-2" style={{ color: '#f44747', background: 'rgba(244,71,71,0.1)', border: '1px solid rgba(244,71,71,0.3)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
