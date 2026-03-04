import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface Props {
  onPress: () => void;
  visible?: boolean;
}

export default function AddSoundFab({ onPress, visible = true }: Props) {
  if (!visible) return null;

  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.icon}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    right: 24,
    bottom: 32,
    backgroundColor: '#25D366',
    borderRadius: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  icon: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
    lineHeight: 36,
  },
});
