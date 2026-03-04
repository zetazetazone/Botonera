export interface AudioItem {
  id: string;
  title: string;
  uri: string;
  color: string;
  thumbnailUri?: string;
  stickerUri?: string;
  listId: string;
  order: number;
  createdAt: number;
  is_deleted: boolean;
  deleted_at?: number;
}

export interface SoundList {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: number;
}

export interface SoundboardState {
  sounds: AudioItem[];
  lists: SoundList[];
  activeSoundId: string | null;
  activeListId: string | null;
  isEditMode: boolean;
  addSound: (sound: AudioItem) => void;
  updateSound: (id: string, updates: Partial<AudioItem>) => void;
  deleteSound: (id: string) => void;
  addList: (list: SoundList) => void;
  updateList: (id: string, updates: Partial<SoundList>) => void;
  deleteList: (id: string) => void;
  reorderSounds: (listId: string, orderedIds: string[]) => void;
  setActiveSoundId: (id: string | null) => void;
  setActiveListId: (id: string | null) => void;
  setEditMode: (on: boolean) => void;
}
