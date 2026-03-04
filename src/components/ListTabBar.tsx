import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useSoundboardStore } from '../store/soundboardStore';

interface Props {
  onCreateList: () => void;
}

export default function ListTabBar({ onCreateList }: Props) {
  const { lists, activeListId, setActiveListId } = useSoundboardStore(
    useShallow((s) => ({
      lists: s.lists,
      activeListId: s.activeListId,
      setActiveListId: s.setActiveListId,
    }))
  );

  const sortedLists = [...lists].sort((a, b) => a.order - b.order);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* All Sounds tab */}
        <TouchableOpacity
          style={[
            styles.tab,
            activeListId === null ? styles.tabActive : styles.tabInactive,
            activeListId === null && styles.tabActiveAllSounds,
          ]}
          onPress={() => setActiveListId(null)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeListId === null ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            All Sounds
          </Text>
        </TouchableOpacity>

        {/* User list tabs */}
        {sortedLists.map((list) => {
          const isActive = activeListId === list.id;
          return (
            <TouchableOpacity
              key={list.id}
              style={[
                styles.tab,
                isActive
                  ? [styles.tabActive, { backgroundColor: list.color }]
                  : [styles.tabInactive, { borderColor: list.color }],
              ]}
              onPress={() => setActiveListId(list.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive ? styles.tabTextActive : [styles.tabTextInactive, { color: list.color }],
                ]}
              >
                {list.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Add list button */}
        <TouchableOpacity
          style={[styles.tab, styles.addTab]}
          onPress={onCreateList}
          activeOpacity={0.7}
        >
          <Text style={styles.addTabText}>+</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#1F1F1F',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  scrollView: {
    height: 52,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 8,
  },
  tab: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#25D366',
  },
  tabActiveAllSounds: {
    backgroundColor: '#25D366',
  },
  tabInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#555',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
  },
  tabTextInactive: {
    color: '#AAA',
  },
  addTab: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#555',
    width: 36,
    paddingHorizontal: 0,
  },
  addTabText: {
    color: '#AAA',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
});
