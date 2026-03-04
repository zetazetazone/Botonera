import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AudioItem } from '../store/types';

const { width: windowWidth } = Dimensions.get('window');

const PADDING = 16;
const GAP = 8;
const BUTTON_SIZE = (windowWidth - PADDING * 2 - GAP * 2) / 3;

interface SoundButtonProps {
  sound: AudioItem;
  onPress: (sound: AudioItem) => void;
  onLongPress: (sound: AudioItem) => void;
  isPlaying: boolean;
  editMode: boolean;
}

export default function SoundButton({
  sound,
  onPress,
  onLongPress,
  isPlaying,
  editMode,
}: SoundButtonProps) {
  const shadowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      shadowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      shadowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!isPlaying) {
      return {};
    }
    return {
      borderWidth: 2,
      borderColor: '#25D366',
      shadowColor: '#25D366',
      shadowOpacity: shadowOpacity.value,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
      elevation: 8,
    };
  });

  const handlePress = () => {
    if (editMode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(sound);
  };

  const handleLongPress = () => {
    if (editMode) return;
    onLongPress(sound);
  };

  const content = sound.thumbnailUri ? (
    <>
      <Image
        source={{ uri: sound.thumbnailUri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={[StyleSheet.absoluteFill, styles.gradient]}
      />
      <Text style={styles.titleOnImage} numberOfLines={2}>
        {sound.title}
      </Text>
    </>
  ) : (
    <View style={[StyleSheet.absoluteFill, styles.colorBackground, { backgroundColor: sound.color || '#333' }]}>
      <Text style={styles.title} numberOfLines={2}>
        {sound.title}
      </Text>
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={editMode ? 1 : 0.7}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={styles.touchable}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        {content}
        {editMode && (
          <View style={styles.editOverlay}>
            <Ionicons name="reorder-three" size={24} color="rgba(255,255,255,0.9)" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    margin: GAP / 2,
  },
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1F1F1F',
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    borderRadius: 0,
  },
  titleOnImage: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
    paddingHorizontal: 6,
    paddingBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  colorBackground: {
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  title: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  editOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 4,
    padding: 2,
  },
});
