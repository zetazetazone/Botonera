import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import AddSoundFab from '../components/AddSoundFab';
import ListTabBar from '../components/ListTabBar';
import SoundGrid from '../components/SoundGrid';
import { useSoundboardStore } from '../store/soundboardStore';

export default function HomeScreen() {
  const { isEditMode, setEditMode } = useSoundboardStore(
    useShallow((s) => ({
      isEditMode: s.isEditMode,
      setEditMode: s.setEditMode,
    }))
  );

  const handleAddSound = () => {
    // Placeholder: will be wired to AddSoundModal in Plan 03
    console.log('[HomeScreen] Add sound tapped');
  };

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
      <ListTabBar />

      {/* Sound grid */}
      <SoundGrid />

      {/* FAB: hidden in edit mode */}
      {!isEditMode && <AddSoundFab onPress={handleAddSound} />}
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
