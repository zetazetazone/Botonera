import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { getPlayer, playSound, stopSound } from '../services/AudioPlayerService';
import { useSoundboardStore } from '../store/soundboardStore';
import { AudioItem } from '../store/types';
import SoundButton from './SoundButton';

interface Props {
  onLongPressSound?: (sound: AudioItem) => void;
}

export default function SoundGrid({ onLongPressSound }: Props) {
  const {
    sounds,
    activeSoundId,
    activeListId,
    isEditMode,
    setActiveSoundId,
    reorderSounds,
  } = useSoundboardStore(
    useShallow((s) => ({
      sounds: s.sounds,
      activeSoundId: s.activeSoundId,
      activeListId: s.activeListId,
      isEditMode: s.isEditMode,
      setActiveSoundId: s.setActiveSoundId,
      reorderSounds: s.reorderSounds,
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
      await stopSound();
      setActiveSoundId(null);
    } else {
      await playSound(sound.uri);
      setActiveSoundId(sound.id);
    }
  };

  const handleLongPress = (sound: AudioItem) => {
    if (onLongPressSound) {
      onLongPressSound(sound);
    }
  };

  if (filteredSounds.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No sounds yet</Text>
        <Text style={styles.emptySubtitle}>Tap + to add your first sound</Text>
      </View>
    );
  }

  // ── EDIT MODE: DraggableFlatList with row grouping ──────────────────────────
  // DraggableFlatList does not support numColumns, so we group into rows of 3
  // and drag entire rows. Within-row reordering uses normal tap ordering.
  if (isEditMode) {
    // Only enable drag when viewing a specific list (not "All Sounds")
    if (activeListId === null) {
      return (
        <View style={styles.noReorderContainer}>
          <Text style={styles.noReorderText}>
            Switch to a specific list to reorder sounds
          </Text>
          <FlatList
            data={filteredSounds}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item }) => (
              <SoundButton
                sound={item}
                onPress={handlePress}
                onLongPress={handleLongPress}
                isPlaying={item.id === activeSoundId}
                editMode={isEditMode}
              />
            )}
            contentContainerStyle={styles.contentContainer}
            style={styles.list}
          />
        </View>
      );
    }

    // Group sounds into rows of 3 for DraggableFlatList
    type Row = { id: string; items: AudioItem[] };
    const rows: Row[] = [];
    for (let i = 0; i < filteredSounds.length; i += 3) {
      rows.push({
        id: filteredSounds.slice(i, i + 3).map((s) => s.id).join('-'),
        items: filteredSounds.slice(i, i + 3),
      });
    }

    const renderRow = ({ item: row, drag, isActive }: RenderItemParams<Row>) => (
      <ScaleDecorator>
        <View
          style={[styles.row, isActive && styles.rowActive]}
          onTouchStart={drag}
        >
          {row.items.map((sound) => (
            <SoundButton
              key={sound.id}
              sound={sound}
              onPress={handlePress}
              onLongPress={drag}
              isPlaying={sound.id === activeSoundId}
              editMode={isEditMode}
            />
          ))}
          {/* Fill empty slots if row has fewer than 3 items */}
          {row.items.length < 3 &&
            Array.from({ length: 3 - row.items.length }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.emptySlot} />
            ))}
        </View>
      </ScaleDecorator>
    );

    return (
      <DraggableFlatList
        data={rows}
        keyExtractor={(row) => row.id}
        onDragEnd={({ data: reorderedRows }) => {
          // Flatten rows back into ordered IDs
          const orderedIds = reorderedRows.flatMap((row) => row.items.map((s) => s.id));
          reorderSounds(activeListId, orderedIds);
        }}
        renderItem={renderRow}
        contentContainerStyle={styles.contentContainer}
        style={styles.list}
      />
    );
  }

  // ── NORMAL MODE: FlatList ──────────────────────────────────────────────────
  return (
    <FlatList
      data={filteredSounds}
      keyExtractor={(item) => item.id}
      numColumns={3}
      renderItem={({ item }) => (
        <SoundButton
          sound={item}
          onPress={handlePress}
          onLongPress={handleLongPress}
          isPlaying={item.id === activeSoundId}
          editMode={false}
        />
      )}
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
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  rowActive: {
    opacity: 0.85,
  },
  emptySlot: {
    flex: 1,
    margin: 4,
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
  noReorderContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  noReorderText: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1F1F1F',
  },
});
