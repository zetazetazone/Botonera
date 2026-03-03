import { Stack } from 'expo-router';
import { ShareIntentProvider } from 'expo-share-intent';
import { SoundboardProvider } from '../src/hooks/useSoundboard';

export default function RootLayout() {
    return (
        <ShareIntentProvider options={{ debug: false }}>
            <SoundboardProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                </Stack>
            </SoundboardProvider>
        </ShareIntentProvider>
    );
}
