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
  cacheSticker,
  cacheThumbnail,
  deleteFile,
} from '../services/FileCacheService';
import { useSoundboardStore } from '../store/soundboardStore';
import { AudioItem, SoundList } from '../store/types';

const COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
  '#795548', '#607d8b',
];

interface Props {
  sound: AudioItem | null;
  visible: boolean;
  onClose: () => void;
}

export default function EditSoundModal({ sound, visible, onClose }: Props) {
  if (!sound || !visible) return null;
  return <EditSoundModalInner sound={sound} onClose={onClose} />;
}

interface InnerProps {
  sound: AudioItem;
  onClose: () => void;
}

function EditSoundModalInner({ sound, onClose }: InnerProps) {
  const { lists, sounds, updateSound, deleteSound } = useSoundboardStore(
    useShallow((s) => ({
      lists: s.lists,
      sounds: s.sounds,
      updateSound: s.updateSound,
      deleteSound: s.deleteSound,
    }))
  );

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [stickerUri, setStickerUri] = useState<string | null>(null);
  const [listId, setListId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Populate form when sound changes
  useEffect(() => {
    setName(sound.title);
    setColor(sound.color);
    setThumbnailUri(sound.thumbnailUri ?? null);
    setStickerUri(sound.stickerUri ?? null);
    setListId(sound.listId);
    setSaving(false);
  }, [sound]);

  async function pickImage(
    setter: (uri: string | null) => void,
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
      console.warn('[EditSoundModal] Image pick error:', err);
    }
  }

  function showImagePickerOptions(setter: (uri: string | null) => void) {
    Alert.alert('Choose Image', 'Pick from gallery or take a new photo', [
      { text: 'Gallery', onPress: () => pickImage(setter, 'gallery') },
      { text: 'Camera', onPress: () => pickImage(setter, 'camera') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for the sound.');
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<AudioItem> = {
        title: name.trim(),
        color,
      };

      // Handle thumbnail changes
      if (thumbnailUri !== (sound.thumbnailUri ?? null)) {
        if (thumbnailUri === null) {
          // Removed thumbnail
          if (sound.thumbnailUri) {
            await deleteFile(sound.thumbnailUri);
          }
          updates.thumbnailUri = undefined;
        } else {
          // New thumbnail picked
          const ext = thumbnailUri.includes('.')
            ? thumbnailUri.slice(thumbnailUri.lastIndexOf('.') + 1).split('?')[0] || 'jpg'
            : 'jpg';
          const cached = await cacheThumbnail(thumbnailUri, sound.id, ext);
          if (sound.thumbnailUri && sound.thumbnailUri !== cached) {
            await deleteFile(sound.thumbnailUri);
          }
          updates.thumbnailUri = cached;
        }
      }

      // Handle sticker changes
      if (stickerUri !== (sound.stickerUri ?? null)) {
        if (stickerUri === null) {
          // Removed sticker
          if (sound.stickerUri) {
            await deleteFile(sound.stickerUri);
          }
          updates.stickerUri = undefined;
        } else {
          // New sticker picked
          const ext = stickerUri.includes('.')
            ? stickerUri.slice(stickerUri.lastIndexOf('.') + 1).split('?')[0] || 'jpg'
            : 'jpg';
          const cached = await cacheSticker(stickerUri, sound.id, ext);
          if (sound.stickerUri && sound.stickerUri !== cached) {
            await deleteFile(sound.stickerUri);
          }
          updates.stickerUri = cached;
        }
      }

      // Handle list change
      if (listId !== sound.listId) {
        const soundsInNewList = sounds.filter(
          (s) => !s.is_deleted && s.listId === listId
        );
        updates.listId = listId;
        updates.order = soundsInNewList.length;
      }

      updateSound(sound.id, updates);
      onClose();
    } catch (err) {
      console.warn('[EditSoundModal] Save error:', err);
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Delete Sound',
      `Delete "${sound.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            deleteSound(sound.id);
            // Clean up local files in background
            if (sound.uri) deleteFile(sound.uri).catch(() => {});
            if (sound.thumbnailUri) deleteFile(sound.thumbnailUri).catch(() => {});
            if (sound.stickerUri) deleteFile(sound.stickerUri).catch(() => {});
            onClose();
          },
        },
      ]
    );
  }

  const sortedLists: SoundList[] = [...lists].sort((a, b) => a.order - b.order);

  return (
    <Modal
      transparent
      animationType="slide"
      visible={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.header}>Edit Sound</Text>

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
                <Text style={styles.label}>Thumbnail</Text>
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
                <Text style={styles.label}>Sticker (for WhatsApp sharing)</Text>
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

                {/* List assignment */}
                {sortedLists.length > 0 && (
                  <>
                    <Text style={styles.label}>List</Text>
                    <View style={styles.listPicker}>
                      {sortedLists.map((list) => (
                        <TouchableOpacity
                          key={list.id}
                          style={[
                            styles.listOption,
                            listId === list.id && { borderColor: list.color, borderWidth: 2 },
                          ]}
                          onPress={() => setListId(list.id)}
                        >
                          <View style={[styles.listDot, { backgroundColor: list.color }]} />
                          <Text style={[
                            styles.listOptionText,
                            listId === list.id && { color: '#FFF' },
                          ]}>
                            {list.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {/* Action buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDelete}
                    disabled={saving}
                  >
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                  <View style={styles.rightButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={onClose}
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
    marginBottom: 16,
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
  listPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  listDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  listOptionText: {
    color: '#AAA',
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
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
