import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';

export const SOUNDS_DIRECTORY = `${FileSystem.documentDirectory}sounds/`;

/**
 * Ensures the local sounds directory exists.
 */
export const ensureDirectoryExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(SOUNDS_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(SOUNDS_DIRECTORY, { intermediates: true });
  }
};

/**
 * Copies a file from a temporary picker location to the permanent app storage.
 * @param {string} sourceUri The temporary URI of the picked file.
 * @returns {string} The new permanent URI of the copied file.
 */
export const saveAudioFile = async (sourceUri) => {
  await ensureDirectoryExists();
  const filename = sourceUri.split('/').pop() || `sound_${Date.now()}.mp3`;
  const newUri = `${SOUNDS_DIRECTORY}${filename}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: newUri
  });

  return newUri;
};

/**
 * Deletes an audio file from the app storage.
 * @param {string} uri The URI of the file to delete.
 */
export const deleteAudioFile = async (uri) => {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    console.warn("Failed to delete file:", error);
  }
};

/**
 * Plays a local audio file.
 * @param {string} uri The URI of the audio file to play.
 * @returns {Promise<Audio.Sound>} The sound object (for stopping/unloading later).
 */
export const playSoundFile = async (uri) => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }
    );
    return sound;
  } catch (error) {
    console.error("Error playing sound:", error);
    return null;
  }
};

/**
 * Opens the native share sheet to send the audio file (e.g., via WhatsApp).
 * @param {string} uri The URI of the audio file.
 */
export const shareAudioToWhatsApp = async (uri) => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      // In Expo Go or standard managed workflow, this opens the standard Share sheet.
      // The user will pick WhatsApp from the sheet.
      await Sharing.shareAsync(uri, {
        mimeType: 'audio/*', // Generic audio type helps target audio-handling apps
        dialogTitle: 'Share sound'
      });
    } else {
      console.warn("Sharing is not available on this device");
    }
  } catch (error) {
    console.error("Error sharing sound:", error);
  }
};
