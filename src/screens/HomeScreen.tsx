import React, { useState } from 'react';
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
import { useSoundboardStore } from '../store/soundboardStore';
import { AudioItem } from '../store/types';

export default function HomeScreen() {
  const { isEditMode, setEditMode } = useSoundboardStore(
    useShallow((s) => ({
      isEditMode: s.isEditMode,
      setEditMode: s.setEditMode,
    }))
  );

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
