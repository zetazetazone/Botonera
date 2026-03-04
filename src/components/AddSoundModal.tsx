import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import {
  cacheAudioFile,
  cacheSticker,
  cacheThumbnail,
  deleteFile,
} from '../services/FileCacheService';
import { useSoundboardStore } from '../store/soundboardStore';
import { AudioItem } from '../store/types';
import { generateId, isAllowedAudioFile } from '../utils/fileUtils';

const COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
  '#795548', '#607d8b',
];

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AddSoundModal({ visible, onClose }: Props) {
  const { sounds, lists, activeListId, addSound } = useSoundboardStore(
    useShallow((s) => ({
      sounds: s.sounds,
      lists: s.lists,
      activeListId: s.activeListId,
      addSound: s.addSound,
    }))
  );

  // Step 1 state: picked file
  const [cachedAudioUri, setCachedAudioUri] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'form'>('idle');

  // Step 2 form state
  const [name, setName] = useState('');
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [stickerUri, setStickerUri] = useState<string | null>(null);
  const [color, setColor] = useState<string>(getRandomColor());
  const [saving, setSaving] = useState(false);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setCachedAudioUri(null);
      setStep('idle');
      setName('');
      setThumbnailUri(null);
      setStickerUri(null);
      setColor(getRandomColor());
      setSaving(false);
    }
  }, [visible]);

  // Trigger file picker when modal opens (step idle -> pick)
  useEffect(() => {
    if (visible && step === 'idle') {
      pickFile();
    }
  }, [visible, step]);

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        onClose();
        return;
      }

      const asset = result.assets[0];

      if (!isAllowedAudioFile(asset.name)) {
        Alert.alert(
          'Unsupported format',
          'Please select .opus, .m4a, .mp3, .aac, or .ogg files.'
        );
        onClose();
        return;
      }

      // Extract extension from filename
      const dotIndex = asset.name.lastIndexOf('.');
      const ext = dotIndex !== -1 ? asset.name.slice(dotIndex) : '.mp3';
      const tempId = generateId();
      const cached = await cacheAudioFile(asset.uri, `${tempId}${ext}`);
      setCachedAudioUri(cached);

      // Pre-fill name from filename (strip extension)
      const nameWithoutExt =
        dotIndex !== -1 ? asset.name.slice(0, dotIndex) : asset.name;
      setName(nameWithoutExt.slice(0, 30));
      setStep('form');
    } catch (err) {
      console.warn('[AddSoundModal] File pick error:', err);
      onClose();
    }
  }

  async function pickImage(
    setter: (uri: string) => void,
    source: 'gallery' | 'camera'
  ) {
    try {
      let result: ImagePicker.ImagePickerResult;
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'] as ImagePicker.MediaType[],
        allowsEditing: true,
        quality: 0.8,
      };

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets.length > 0) {
        setter(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[AddSoundModal] Image pick error:', err);
    }
  }

  function showImagePickerOptions(setter: (uri: string) => void) {
    Alert.alert('Choose Image', 'Pick from gallery or take a new photo', [
      { text: 'Gallery', onPress: () => pickImage(setter, 'gallery') },
      { text: 'Camera', onPress: () => pickImage(setter, 'camera') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleSave() {
    if (!cachedAudioUri) return;
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for the sound.');
      return;
    }

    setSaving(true);
    try {
      const id = generateId();

      // Determine target list ID
      let targetListId: string;
      if (activeListId) {
        targetListId = activeListId;
      } else if (lists.length > 0) {
        targetListId = lists.sort((a, b) => a.order - b.order)[0].id;
      } else {
        // No lists exist — use a placeholder (should not normally happen)
        targetListId = 'default';
      }

      // Calculate order (end of list)
      const soundsInList = sounds.filter(
        (s) => !s.is_deleted && s.listId === targetListId
      );
      const order = soundsInList.length;

      // Cache thumbnail if picked
      let cachedThumbnailUri: string | undefined;
      if (thumbnailUri) {
        const ext = thumbnailUri.includes('.')
          ? thumbnailUri.slice(thumbnailUri.lastIndexOf('.') + 1).split('?')[0] || 'jpg'
          : 'jpg';
        cachedThumbnailUri = await cacheThumbnail(thumbnailUri, id, ext);
      }

      // Cache sticker if picked
      let cachedStickerUri: string | undefined;
      if (stickerUri) {
        const ext = stickerUri.includes('.')
          ? stickerUri.slice(stickerUri.lastIndexOf('.') + 1).split('?')[0] || 'jpg'
          : 'jpg';
        cachedStickerUri = await cacheSticker(stickerUri, id, ext);
      }

      const audioItem: AudioItem = {
        id,
        title: name.trim(),
        uri: cachedAudioUri,
        color,
        thumbnailUri: cachedThumbnailUri,
        stickerUri: cachedStickerUri,
        listId: targetListId,
        order,
        createdAt: Date.now(),
        is_deleted: false,
      };

      addSound(audioItem);
      onClose();
    } catch (err) {
      console.warn('[AddSoundModal] Save error:', err);
      setSaving(false);
    }
  }

  async function handleCancel() {
    // Clean up cached audio file
    if (cachedAudioUri) {
      await deleteFile(cachedAudioUri);
    }
    onClose();
  }

  // Don't show the modal UI until we're at the form step
  if (step !== 'form') {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible && step === 'form'}
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.header}>New Sound</Text>

                {/* Name */}
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(t) => setName(t.slice(0, 30))}
                  placeholder="Sound name"
                  placeholderTextColor="#666"
                  maxLength={30}
                />

                {/* Thumbnail */}
                <Text style={styles.label}>Thumbnail (optional)</Text>
                {thumbnailUri ? (
                  <View style={styles.previewRow}>
                    <Image source={{ uri: thumbnailUri }} style={styles.imagePreview} />
                    <View style={styles.previewActions}>
                      <TouchableOpacity
                        style={styles.smallButton}
                        onPress={() => showImagePickerOptions(setThumbnailUri)}
                      >
                        <Text style={styles.smallButtonText}>Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.smallButton, styles.removeButton]}
                        onPress={() => setThumbnailUri(null)}
                      >
                        <Text style={styles.smallButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.chooseButton}
                    onPress={() => showImagePickerOptions(setThumbnailUri)}
                  >
                    <Text style={styles.chooseButtonText}>Choose Image</Text>
                  </TouchableOpacity>
                )}

                {/* Color */}
                <Text style={styles.label}>Color</Text>
                <View style={styles.colorGrid}>
                  {COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        color === c && styles.selectedColorCircle,
                      ]}
                      onPress={() => setColor(c)}
                    />
                  ))}
                </View>

                {/* Sticker */}
                <Text style={styles.label}>Sticker (for WhatsApp sharing, optional)</Text>
                {stickerUri ? (
                  <View style={styles.previewRow}>
                    <Image source={{ uri: stickerUri }} style={styles.imagePreview} />
                    <View style={styles.previewActions}>
                      <TouchableOpacity
                        style={styles.smallButton}
                        onPress={() => showImagePickerOptions(setStickerUri)}
                      >
                        <Text style={styles.smallButtonText}>Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.smallButton, styles.removeButton]}
                        onPress={() => setStickerUri(null)}
                      >
                        <Text style={styles.smallButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.chooseButton}
                    onPress={() => showImagePickerOptions(setStickerUri)}
                  >
                    <Text style={styles.chooseButtonText}>Choose Sticker</Text>
                  </TouchableOpacity>
                )}

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                    disabled={saving}
                  >
                    <Text style={[styles.buttonText, { color: '#AAA' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    color: '#CCC',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  chooseButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  chooseButtonText: {
    color: '#AAA',
    fontSize: 14,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imagePreview: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    backgroundColor: '#333',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removeButton: {
    backgroundColor: '#4A2020',
  },
  smallButtonText: {
    color: '#FFF',
    fontSize: 13,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selectedColorCircle: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: '#25D366',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
