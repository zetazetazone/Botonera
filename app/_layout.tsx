import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ShareIntentProvider } from 'expo-share-intent';
import { SoundboardProvider } from '../src/hooks/useSoundboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initAudioSession } from '../src/services/AudioPlayerService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      retry: 0,
      staleTime: Infinity,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    initAudioSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ShareIntentProvider options={{ debug: false }}>
        <SoundboardProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
        </SoundboardProvider>
      </ShareIntentProvider>
    </QueryClientProvider>
  );
}
