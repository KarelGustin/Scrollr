import { create } from "zustand";

interface FeedState {
  currentIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  setCurrentIndex: (index: number) => void;
  togglePlay: () => void;
  toggleMute: () => void;
  setPlaying: (playing: boolean) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  currentIndex: 0,
  isPlaying: true,
  isMuted: true,
  setCurrentIndex: (index) => set({ currentIndex: index }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setPlaying: (playing) => set({ isPlaying: playing }),
}));
