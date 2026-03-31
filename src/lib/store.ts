'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VideoEntry {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  provider: string;
  prompt: string;
  audioPrompt: string;
  createdAt: string;
}

interface VideoStore {
  videos: VideoEntry[];
  addVideo: (entry: VideoEntry) => void;
  removeVideo: (id: string) => void;
  clearAll: () => void;
}

export const useVideoStore = create<VideoStore>()(
  persist(
    (set) => ({
      videos: [],
      addVideo: (entry) =>
        set((state) => ({ videos: [entry, ...state.videos] })),
      removeVideo: (id) =>
        set((state) => ({ videos: state.videos.filter((v) => v.id !== id) })),
      clearAll: () => set({ videos: [] }),
    }),
    {
      name: 'vidforge-videos',
    },
  ),
);
