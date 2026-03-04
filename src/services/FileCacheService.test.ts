// FileCacheService.test.ts
// Strategy: define mock fns INSIDE jest.mock factory (no hoisting issue),
// then retrieve them via the mocked module's instances.

// State flags used by getter — prefixed with 'mock' for jest.mock hoisting access
let mockFileExistsFlag = true;
let mockDirectoryExistsFlag = true;

jest.mock('expo-file-system', () => {
  const mockCopy = jest.fn();
  const mockDelete = jest.fn();
  const mockCreate = jest.fn();

  // Expose via module so tests can retrieve them
  const MockFile = jest.fn((...args: unknown[]) => ({
    get uri() {
      if (args.length === 2 && typeof args[1] === 'string') {
        return `file:///document/${args[1]}`;
      }
      return String(args[0] ?? '');
    },
    copy: mockCopy,
    delete: mockDelete,
    get exists() { return mockFileExistsFlag; },
    _mockCopy: mockCopy,
    _mockDelete: mockDelete,
  }));

  const MockDirectory = jest.fn(() => ({
    create: mockCreate,
    uri: 'file:///document/',
    get exists() { return mockDirectoryExistsFlag; },
    _mockCreate: mockCreate,
  }));

  return {
    File: MockFile,
    Directory: MockDirectory,
    Paths: { document: 'file:///document/' },
    // expose mock fns for test retrieval
    __mocks: { mockCopy, mockDelete, mockCreate },
  };
});

import { cacheAudioFile, cacheThumbnail, cacheSticker, deleteFile, ensureDirectories } from './FileCacheService';
import { File as MockedFile, Directory as MockedDirectory } from 'expo-file-system';

// Helper to get the internal mock fns from the module
function getMocks() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = require('expo-file-system') as any;
  return mod.__mocks as { mockCopy: jest.Mock; mockDelete: jest.Mock; mockCreate: jest.Mock };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFileExistsFlag = true;
  mockDirectoryExistsFlag = true;
});

describe('ensureDirectories', () => {
  it('does not call create when directories already exist', async () => {
    mockDirectoryExistsFlag = true;
    await ensureDirectories();
    expect(getMocks().mockCreate).not.toHaveBeenCalled();
  });

  it('calls create when directories do not exist', async () => {
    mockDirectoryExistsFlag = false;
    await ensureDirectories();
    // Three directories: sounds, thumbnails, stickers
    expect(getMocks().mockCreate).toHaveBeenCalledTimes(3);
  });
});

describe('cacheAudioFile', () => {
  it('calls copy on the source file', async () => {
    await cacheAudioFile('file:///source/audio.mp3', 'audio.mp3');
    expect(getMocks().mockCopy).toHaveBeenCalled();
  });

  it('returns a URI string', async () => {
    const result = await cacheAudioFile('file:///source/audio.mp3', 'audio.mp3');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('creates a File instance with the filename', async () => {
    jest.clearAllMocks();
    await cacheAudioFile('file:///source/audio.mp3', 'myaudio.mp3');
    const calls = (MockedFile as unknown as jest.Mock).mock.calls;
    const soundsFileCall = calls.find(
      (call: unknown[]) => call.length === 2 && call[1] === 'myaudio.mp3'
    );
    expect(soundsFileCall).toBeDefined();
  });
});

describe('cacheThumbnail', () => {
  it('calls copy on the source file', async () => {
    await cacheThumbnail('file:///source/img.jpg', 'sound-123');
    expect(getMocks().mockCopy).toHaveBeenCalled();
  });

  it('returns a URI string', async () => {
    const result = await cacheThumbnail('file:///source/img.jpg', 'sound-123');
    expect(typeof result).toBe('string');
  });

  it('creates a File instance with id.ext naming', async () => {
    jest.clearAllMocks();
    await cacheThumbnail('file:///source/img.png', 'sound-abc', 'png');
    const calls = (MockedFile as unknown as jest.Mock).mock.calls;
    const thumbFileCall = calls.find(
      (call: unknown[]) => call.length === 2 && call[1] === 'sound-abc.png'
    );
    expect(thumbFileCall).toBeDefined();
  });
});

describe('cacheSticker', () => {
  it('calls copy on the source file', async () => {
    await cacheSticker('file:///source/sticker.jpg', 'sound-456');
    expect(getMocks().mockCopy).toHaveBeenCalled();
  });

  it('returns a URI string', async () => {
    const result = await cacheSticker('file:///source/sticker.jpg', 'sound-456');
    expect(typeof result).toBe('string');
  });
});

describe('deleteFile', () => {
  it('calls delete on the file when it exists', async () => {
    mockFileExistsFlag = true;
    await deleteFile('file:///document/sounds/audio.mp3');
    expect(getMocks().mockDelete).toHaveBeenCalled();
  });

  it('does not call delete when file does not exist', async () => {
    mockFileExistsFlag = false;
    await deleteFile('file:///document/sounds/missing.mp3');
    expect(getMocks().mockDelete).not.toHaveBeenCalled();
  });

  it('does not throw when deletion fails', async () => {
    getMocks().mockDelete.mockImplementation(() => { throw new Error('delete failed'); });
    mockFileExistsFlag = true;
    await expect(deleteFile('file:///document/sounds/audio.mp3')).resolves.toBeUndefined();
  });
});
