import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioItem, SoundList, SoundboardState } from './types';

export const useSoundboardStore = create<SoundboardState>()(
  persist(
    (set) => ({
      sounds: [],
      lists: [],
      activeSoundId: null,
      activeListId: null,
      isEditMode: false,

      addSound: (sound: AudioItem) =>
        set((s) => ({ sounds: [...s.sounds, sound] })),

      updateSound: (id: string, updates: Partial<AudioItem>) =>
        set((s) => ({
          sounds: s.sounds.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      deleteSound: (id: string) =>
        set((s) => ({
          sounds: s.sounds.map((item) =>
            item.id === id
              ? { ...item, is_deleted: true, deleted_at: Date.now() }
              : item
          ),
        })),

      addList: (list: SoundList) =>
        set((s) => ({ lists: [...s.lists, list] })),

      updateList: (id: string, updates: Partial<SoundList>) =>
        set((s) => ({
          lists: s.lists.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),

      deleteList: (id: string) =>
        set((s) => ({ lists: s.lists.filter((l) => l.id !== id) })),

      reorderSounds: (listId: string, orderedIds: string[]) =>
        set((s) => ({
          sounds: s.sounds.map((item) => {
            const idx = orderedIds.indexOf(item.id);
            return item.listId === listId && idx !== -1
              ? { ...item, order: idx }
              : item;
          }),
        })),

      setActiveSoundId: (id: string | null) => set({ activeSoundId: id }),

      setActiveListId: (id: string | null) => set({ activeListId: id }),

      setEditMode: (on: boolean) => set({ isEditMode: on }),
    }),
    {
      name: 'soundboard-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
