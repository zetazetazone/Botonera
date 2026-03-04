import { initAudioSession, playSound, stopSound, releasePlayer } from './AudioPlayerService';

// Define mock player with jest.fn() — these are created before jest.mock runs
// since jest.mock is hoisted, we use 'mock' prefix pattern for the module approach
jest.mock('expo-audio', () => {
  const mockPlayerInstance = {
    replace: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    release: jest.fn(),
  };

  return {
    createAudioPlayer: jest.fn(() => mockPlayerInstance),
    setAudioModeAsync: jest.fn(),
    __mockPlayer: mockPlayerInstance,
  };
});

// Retrieve mock references from the mocked module
import * as ExpoAudio from 'expo-audio';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getMockPlayer = () => (ExpoAudio as any).__mockPlayer as {
  replace: jest.Mock;
  play: jest.Mock;
  pause: jest.Mock;
  seekTo: jest.Mock;
  release: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the module-level _player by releasing it
  releasePlayer();
});

describe('initAudioSession', () => {
  it('calls setAudioModeAsync with playsInSilentMode and interruptionMode', async () => {
    await initAudioSession();
    expect(ExpoAudio.setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
    });
  });
});

describe('playSound', () => {
  it('calls replace with the uri object', async () => {
    await playSound('file:///test/sound.mp3');
    expect(getMockPlayer().replace).toHaveBeenCalledWith({ uri: 'file:///test/sound.mp3' });
  });

  it('calls play after replace', async () => {
    await playSound('file:///test/sound.mp3');
    expect(getMockPlayer().play).toHaveBeenCalled();
  });

  it('calls replace before play', async () => {
    const callOrder: string[] = [];
    getMockPlayer().replace.mockImplementation(() => callOrder.push('replace'));
    getMockPlayer().play.mockImplementation(() => callOrder.push('play'));
    await playSound('file:///test/sound.mp3');
    expect(callOrder).toEqual(['replace', 'play']);
  });
});

describe('stopSound', () => {
  it('calls pause on the player', async () => {
    await stopSound();
    expect(getMockPlayer().pause).toHaveBeenCalled();
  });

  it('calls seekTo(0) on the player', async () => {
    await stopSound();
    expect(getMockPlayer().seekTo).toHaveBeenCalledWith(0);
  });

  it('calls pause before seekTo', async () => {
    const callOrder: string[] = [];
    getMockPlayer().pause.mockImplementation(() => callOrder.push('pause'));
    getMockPlayer().seekTo.mockImplementation(() => callOrder.push('seekTo'));
    await stopSound();
    expect(callOrder).toEqual(['pause', 'seekTo']);
  });
});
