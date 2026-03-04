import { useShareIntentContext } from 'expo-share-intent';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import AddSoundFab from '../components/AddSoundFab';
import AddSoundModal from '../components/AddSoundModal';
import CreateListModal from '../components/CreateListModal';
import EditSoundModal from '../components/EditSoundModal';
import ListTabBar from '../components/ListTabBar';
import SoundGrid from '../components/SoundGrid';
import { cacheAudioFile } from '../services/FileCacheService';
import { useSoundboardStore } from '../store/soundboardStore';
import { AudioItem } from '../store/types';
import { generateId, isAllowedAudioFile } from '../utils/fileUtils';

export default function HomeScreen() {
  const { isEditMode, setEditMode, sounds, lists, activeListId, addSound } = useSoundboardStore(
    useShallow((s) => ({
      isEditMode: s.isEditMode,
      setEditMode: s.setEditMode,
      sounds: s.sounds,
      lists: s.lists,
      activeListId: s.activeListId,
      addSound: s.addSound,
    }))
  );

  const { hasShareIntent, shareIntent, resetShareIntent, error: shareError } = useShareIntentContext();

  // Handle incoming share intents (audio shared from other apps)
  useEffect(() => {
    if (shareError) {
      console.error('Share Intent Error:', shareError);
    }
    if (hasShareIntent && shareIntent.type === 'file' && shareIntent.files && shareIntent.files.length > 0) {
      const file = shareIntent.files[0];
      const incomingFileUri = file.path;
      const filename = file.fileName || 'Shared Sound';

      (async () => {
        try {
          const dotIndex = filename.lastIndexOf('.');
          const ext = dotIndex !== -1 ? filename.slice(dotIndex) : '.mp3';
          const nameWithoutExt = dotIndex !== -1 ? filename.slice(0, dotIndex) : filename;
          const id = generateId();

          const cachedUri = await cacheAudioFile(incomingFileUri, `${id}${ext}`);

          // Determine target list
          let targetListId: string;
          if (activeListId) {
            targetListId = activeListId;
          } else if (lists.length > 0) {
            targetListId = [...lists].sort((a, b) => a.order - b.order)[0].id;
          } else {
            targetListId = 'default';
          }

          const soundsInList = sounds.filter(
            (s) => !s.is_deleted && s.listId === targetListId
          );

          const audioItem: AudioItem = {
            id,
            title: nameWithoutExt.slice(0, 30),
            uri: cachedUri,
            color: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50'][Math.floor(Math.random() * 10)],
            listId: targetListId,
            order: soundsInList.length,
            createdAt: Date.now(),
            is_deleted: false,
          };

          addSound(audioItem);
          resetShareIntent();
        } catch (err) {
          console.error('Failed to save incoming intent:', err);
          resetShareIntent();
        }
      })();
    }
  }, [hasShareIntent, shareIntent, shareError]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [editingSound, setEditingSound] = useState<AudioItem | null>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>YapDeck</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditMode(!isEditMode)}
          activeOpacity={0.7}
        >
          <Text style={styles.editButtonText}>
            {isEditMode ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <ListTabBar onCreateList={() => setShowCreateListModal(true)} />

      {/* Sound grid */}
      <SoundGrid onLongPressSound={(sound) => setEditingSound(sound)} />

      {/* FAB: hidden in edit mode */}
      {!isEditMode && <AddSoundFab onPress={() => setShowAddModal(true)} />}

      {/* Modals */}
      <AddSoundModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      <CreateListModal
        visible={showCreateListModal}
        onClose={() => setShowCreateListModal(false)}
      />
      <EditSoundModal
        sound={editingSound}
        visible={!!editingSound}
        onClose={() => setEditingSound(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1F1F1F',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#333',
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
