import { File, Directory, Paths } from 'expo-file-system';

const soundsDir = new Directory(Paths.document, 'sounds');
const thumbnailsDir = new Directory(Paths.document, 'thumbnails');
const stickersDir = new Directory(Paths.document, 'stickers');

export async function ensureDirectories(): Promise<void> {
  if (!soundsDir.exists) soundsDir.create();
  if (!thumbnailsDir.exists) thumbnailsDir.create();
  if (!stickersDir.exists) stickersDir.create();
}

export async function cacheAudioFile(
  sourceUri: string,
  filename: string
): Promise<string> {
  await ensureDirectories();
  const dest = new File(soundsDir, filename);
  const source = new File(sourceUri);
  source.copy(dest);
  return dest.uri;
}

export async function cacheThumbnail(
  sourceUri: string,
  id: string,
  ext: string = 'jpg'
): Promise<string> {
  await ensureDirectories();
  const dest = new File(thumbnailsDir, `${id}.${ext}`);
  const source = new File(sourceUri);
  source.copy(dest);
  return dest.uri;
}

export async function cacheSticker(
  sourceUri: string,
  id: string,
  ext: string = 'jpg'
): Promise<string> {
  await ensureDirectories();
  const dest = new File(stickersDir, `${id}.${ext}`);
  const source = new File(sourceUri);
  source.copy(dest);
  return dest.uri;
}

export async function deleteFile(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (e) {
    console.warn('Failed to delete file:', uri, e);
  }
}
