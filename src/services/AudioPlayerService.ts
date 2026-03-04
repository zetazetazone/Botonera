import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

let _player: AudioPlayer | null = null;

export async function initAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'doNotMix',
  });
}

export function getPlayer(): AudioPlayer {
  if (!_player) {
    _player = createAudioPlayer(null);
  }
  return _player;
}

export async function playSound(uri: string): Promise<void> {
  const player = getPlayer();
  player.replace({ uri });
  player.play();
}

export async function stopSound(): Promise<void> {
  const player = getPlayer();
  player.pause();
  player.seekTo(0);
}

export function releasePlayer(): void {
  if (_player) {
    _player.release();
    _player = null;
  }
}
