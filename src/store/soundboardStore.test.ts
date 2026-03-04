// Mock AsyncStorage before importing the store (native module not available in Jest)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { useSoundboardStore } from './soundboardStore';
import { AudioItem, SoundList } from './types';

const resetStore = () => {
  useSoundboardStore.setState({
    sounds: [],
    lists: [],
    activeSoundId: null,
    activeListId: null,
    isEditMode: false,
  });
};

const makeSound = (overrides: Partial<AudioItem> = {}): AudioItem => ({
  id: 'sound-1',
  title: 'Test Sound',
  uri: 'file:///test/sound.mp3',
  color: '#ff0000',
  listId: 'list-1',
  order: 0,
  createdAt: 1000000,
  is_deleted: false,
  ...overrides,
});

const makeList = (overrides: Partial<SoundList> = {}): SoundList => ({
  id: 'list-1',
  name: 'My List',
  color: '#00ff00',
  order: 0,
  createdAt: 1000000,
  ...overrides,
});

beforeEach(() => {
  resetStore();
});

describe('addSound', () => {
  it('adds an AudioItem to the sounds array', () => {
    const sound = makeSound();
    useSoundboardStore.getState().addSound(sound);
    const { sounds } = useSoundboardStore.getState();
    expect(sounds).toHaveLength(1);
    expect(sounds[0]).toEqual(sound);
  });

  it('appends additional sounds', () => {
    useSoundboardStore.getState().addSound(makeSound({ id: 'a' }));
    useSoundboardStore.getState().addSound(makeSound({ id: 'b' }));
    expect(useSoundboardStore.getState().sounds).toHaveLength(2);
  });
});

describe('updateSound', () => {
  it('updates specific fields on the matching sound', () => {
    useSoundboardStore.getState().addSound(makeSound({ id: 'sound-1', title: 'Old Title' }));
    useSoundboardStore.getState().updateSound('sound-1', { title: 'New Title' });
    const updated = useSoundboardStore.getState().sounds.find((s) => s.id === 'sound-1');
    expect(updated?.title).toBe('New Title');
  });

  it('does not affect other sounds', () => {
    useSoundboardStore.getState().addSound(makeSound({ id: 'a', title: 'A' }));
    useSoundboardStore.getState().addSound(makeSound({ id: 'b', title: 'B' }));
    useSoundboardStore.getState().updateSound('a', { title: 'Updated A' });
    const bSound = useSoundboardStore.getState().sounds.find((s) => s.id === 'b');
    expect(bSound?.title).toBe('B');
  });
});

describe('deleteSound', () => {
  it('sets is_deleted to true on the matching sound', () => {
    useSoundboardStore.getState().addSound(makeSound({ id: 'sound-1' }));
    useSoundboardStore.getState().deleteSound('sound-1');
    const deleted = useSoundboardStore.getState().sounds.find((s) => s.id === 'sound-1');
    expect(deleted?.is_deleted).toBe(true);
  });

  it('sets deleted_at to a number (timestamp)', () => {
    const before = Date.now();
    useSoundboardStore.getState().addSound(makeSound({ id: 'sound-1' }));
    useSoundboardStore.getState().deleteSound('sound-1');
    const deleted = useSoundboardStore.getState().sounds.find((s) => s.id === 'sound-1');
    expect(typeof deleted?.deleted_at).toBe('number');
    expect(deleted?.deleted_at).toBeGreaterThanOrEqual(before);
  });

  it('does not remove the sound from the array (soft delete)', () => {
    useSoundboardStore.getState().addSound(makeSound({ id: 'sound-1' }));
    useSoundboardStore.getState().deleteSound('sound-1');
    expect(useSoundboardStore.getState().sounds).toHaveLength(1);
  });
});

describe('addList', () => {
  it('adds a SoundList to the lists array', () => {
    const list = makeList();
    useSoundboardStore.getState().addList(list);
    expect(useSoundboardStore.getState().lists).toHaveLength(1);
    expect(useSoundboardStore.getState().lists[0]).toEqual(list);
  });

  it('stores list with provided name and color', () => {
    useSoundboardStore.getState().addList(makeList({ name: 'Work', color: '#blue' }));
    const { lists } = useSoundboardStore.getState();
    expect(lists[0].name).toBe('Work');
    expect(lists[0].color).toBe('#blue');
  });
});

describe('deleteList', () => {
  it('removes the list from the lists array', () => {
    useSoundboardStore.getState().addList(makeList({ id: 'list-1' }));
    useSoundboardStore.getState().addList(makeList({ id: 'list-2' }));
    useSoundboardStore.getState().deleteList('list-1');
    const { lists } = useSoundboardStore.getState();
    expect(lists).toHaveLength(1);
    expect(lists[0].id).toBe('list-2');
  });
});

describe('reorderSounds', () => {
  it('updates order field based on orderedIds index', () => {
    useSoundboardStore.getState().addSound(makeSound({ id: 'a', listId: 'list-1', order: 0 }));
    useSoundboardStore.getState().addSound(makeSound({ id: 'b', listId: 'list-1', order: 1 }));
    useSoundboardStore.getState().addSound(makeSound({ id: 'c', listId: 'list-1', order: 2 }));

    useSoundboardStore.getState().reorderSounds('list-1', ['c', 'a', 'b']);

    const { sounds } = useSoundboardStore.getState();
    const a = sounds.find((s) => s.id === 'a');
    const b = sounds.find((s) => s.id === 'b');
    const c = sounds.find((s) => s.id === 'c');
    expect(c?.order).toBe(0);
    expect(a?.order).toBe(1);
    expect(b?.order).toBe(2);
  });

  it('only reorders sounds in the specified list', () => {
    useSoundboardStore.getState().addSound(makeSound({ id: 'a', listId: 'list-1', order: 0 }));
    useSoundboardStore.getState().addSound(makeSound({ id: 'x', listId: 'list-2', order: 0 }));
    useSoundboardStore.getState().reorderSounds('list-1', ['a']);
    const { sounds } = useSoundboardStore.getState();
    const x = sounds.find((s) => s.id === 'x');
    expect(x?.order).toBe(0);
  });
});

describe('setActiveSoundId', () => {
  it('updates activeSoundId', () => {
    useSoundboardStore.getState().setActiveSoundId('sound-1');
    expect(useSoundboardStore.getState().activeSoundId).toBe('sound-1');
  });

  it('can be set to null', () => {
    useSoundboardStore.getState().setActiveSoundId('sound-1');
    useSoundboardStore.getState().setActiveSoundId(null);
    expect(useSoundboardStore.getState().activeSoundId).toBeNull();
  });
});

describe('setEditMode', () => {
  it('sets isEditMode to true', () => {
    useSoundboardStore.getState().setEditMode(true);
    expect(useSoundboardStore.getState().isEditMode).toBe(true);
  });

  it('sets isEditMode to false', () => {
    useSoundboardStore.getState().setEditMode(true);
    useSoundboardStore.getState().setEditMode(false);
    expect(useSoundboardStore.getState().isEditMode).toBe(false);
  });
});
