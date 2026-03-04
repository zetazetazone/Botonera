import { isAllowedAudioFile, ALLOWED_EXTENSIONS, generateId } from './fileUtils';

describe('isAllowedAudioFile', () => {
  it('returns true for .opus files', () => {
    expect(isAllowedAudioFile('sound.opus')).toBe(true);
  });

  it('returns true for .m4a files', () => {
    expect(isAllowedAudioFile('voice.m4a')).toBe(true);
  });

  it('returns true for .mp3 files', () => {
    expect(isAllowedAudioFile('track.mp3')).toBe(true);
  });

  it('returns true for .aac files', () => {
    expect(isAllowedAudioFile('audio.aac')).toBe(true);
  });

  it('returns true for .ogg files', () => {
    expect(isAllowedAudioFile('file.ogg')).toBe(true);
  });

  it('returns false for .mp4 files', () => {
    expect(isAllowedAudioFile('video.mp4')).toBe(false);
  });

  it('returns false for .wav files', () => {
    expect(isAllowedAudioFile('sound.wav')).toBe(false);
  });

  it('returns false for .txt files', () => {
    expect(isAllowedAudioFile('document.txt')).toBe(false);
  });

  it('returns false for .exe files', () => {
    expect(isAllowedAudioFile('program.exe')).toBe(false);
  });

  it('returns true for uppercase .OPUS extension', () => {
    expect(isAllowedAudioFile('SOUND.OPUS')).toBe(true);
  });

  it('returns true for uppercase .M4A extension', () => {
    expect(isAllowedAudioFile('VOICE.M4A')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isAllowedAudioFile('')).toBe(false);
  });

  it('returns false for filename without extension', () => {
    expect(isAllowedAudioFile('noextension')).toBe(false);
  });
});

describe('ALLOWED_EXTENSIONS', () => {
  it('contains the expected extensions', () => {
    expect(ALLOWED_EXTENSIONS).toEqual(['.opus', '.m4a', '.mp3', '.aac', '.ogg']);
  });
});

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique ids', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
