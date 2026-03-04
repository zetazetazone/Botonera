export const ALLOWED_EXTENSIONS = ['.opus', '.m4a', '.mp3', '.aac', '.ogg'];

export function isAllowedAudioFile(filename: string): boolean {
  if (!filename || filename.indexOf('.') === -1) return false;
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
