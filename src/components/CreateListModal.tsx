import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useSoundboardStore } from '../store/soundboardStore';
import { SoundList } from '../store/types';
import { generateId } from '../utils/fileUtils';

const COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
  '#795548', '#607d8b',
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CreateListModal({ visible, onClose }: Props) {
  const { lists, addList, setActiveListId } = useSoundboardStore(
    useShallow((s) => ({
      lists: s.lists,
      addList: s.addList,
      setActiveListId: s.setActiveListId,
    }))
  );

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(COLORS[0]);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setName('');
      setColor(COLORS[0]);
    }
  }, [visible]);

  function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for the list.');
      return;
    }

    const newList: SoundList = {
      id: generateId(),
      name: name.trim().slice(0, 20),
      color,
      order: lists.length,
      createdAt: Date.now(),
    };

    addList(newList);
    setActiveListId(newList.id);
    onClose();
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.header}>New List</Text>

              {/* Name */}
              <Text style={styles.label}>List Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(t) => setName(t.slice(0, 20))}
                placeholder="e.g. Greetings"
                placeholderTextColor="#666"
                maxLength={20}
                autoFocus
              />

              {/* Color */}
              <Text style={styles.label}>Theme Color</Text>
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

              {/* Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={[styles.buttonText, { color: '#AAA' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.createButton]}
                  onPress={handleCreate}
                >
                  <Text style={styles.buttonText}>Create</Text>
                </TouchableOpacity>
              </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
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
    marginTop: 12,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
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
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  createButton: {
    backgroundColor: '#25D366',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
