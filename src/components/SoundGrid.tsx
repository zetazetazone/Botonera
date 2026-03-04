import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { getPlayer, playSound, stopSound } from '../services/AudioPlayerService';
import { useSoundboardStore } from '../store/soundboardStore';
import { AudioItem } from '../store/types';
import SoundButton from './SoundButton';

export default function SoundGrid() {
  const { sounds, activeSoundId, activeListId, isEditMode, setActiveSoundId } =
    useSoundboardStore(
      useShallow((s) => ({
        sounds: s.sounds,
        activeSoundId: s.activeSoundId,
        activeListId: s.activeListId,
        isEditMode: s.isEditMode,
        setActiveSoundId: s.setActiveSoundId,
      }))
    );

  // Listen for playback completion to clear activeSoundId
  useEffect(() => {
    const player = getPlayer();

    const subscription = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status?.didJustFinish) {
        setActiveSoundId(null);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [setActiveSoundId]);

  const filteredSounds: AudioItem[] = sounds
    .filter((s) => !s.is_deleted)
    .filter((s) => activeListId === null || s.listId === activeListId)
    .sort((a, b) => a.order - b.order);

  const handlePress = async (sound: AudioItem) => {
    if (sound.id === activeSoundId) {
      // Toggle: stop if already playing
      await stopSound();
      setActiveSoundId(null);
    } else {
      // Stop current and play new
      await playSound(sound.uri);
      setActiveSoundId(sound.id);
    }
  };

  const handleLongPress = (sound: AudioItem) => {
    // Placeholder: will be wired to edit modal in Plan 03
    console.log('[SoundGrid] Long press on sound:', sound.id, sound.title);
  };

  const renderItem = ({ item }: { item: AudioItem }) => (
    <SoundButton
      sound={item}
      onPress={handlePress}
      onLongPress={handleLongPress}
      isPlaying={item.id === activeSoundId}
      editMode={isEditMode}
    />
  );

  if (filteredSounds.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No sounds yet</Text>
        <Text style={styles.emptySubtitle}>Tap + to add your first sound</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredSounds}
      keyExtractor={(item) => item.id}
      numColumns={3}
      renderItem={renderItem}
      contentContainerStyle={styles.contentContainer}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 100, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    backgroundColor: '#121212',
  },
  emptyTitle: {
    color: '#888',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
  },
});
