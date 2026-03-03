import { useShareIntentContext } from 'expo-share-intent';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import AddSoundFab from '../components/AddSoundFab';
import EditSoundModal from '../components/EditSoundModal';
import SoundButton from '../components/SoundButton';
import { useSoundboard } from '../hooks/useSoundboard';
import { playSoundFile, shareAudioToWhatsApp } from '../utils/audioBridge';

export default function HomeScreen() {
    const { sounds, isLoading, addNewSound, saveSoundFromUri, updateSound, deleteSound } = useSoundboard();
    const { hasShareIntent, shareIntent, resetShareIntent, error: shareError } = useShareIntentContext();

    const [selectedSound, setSelectedSound] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeSoundObj, setActiveSoundObj] = useState(null);

    useEffect(() => {
        if (shareError) {
            console.error("Share Intent Error:", shareError);
        }
        if (hasShareIntent && shareIntent.type === 'file' && shareIntent.files && shareIntent.files.length > 0) {
            const incomingFileUri = shareIntent.files[0].path;

            // Generate a decent default name based on the filename if given, else generic
            const filename = shareIntent.files[0].fileName || "Shared Sound";

            // Process and save
            saveSoundFromUri(incomingFileUri, filename)
                .then(() => {
                    resetShareIntent(); // Clear the intent so it doesn't fire again
                })
                .catch(err => {
                    console.error("Failed to save incoming intent:", err);
                    resetShareIntent();
                });
        }
    }, [hasShareIntent, shareIntent, shareError]);

    const handleShortTap = async (sound) => {
        // Send to WhatsApp (or Share sheet)
        await shareAudioToWhatsApp(sound.uri);
    };

    const handleLongPress = async (sound) => {
        // Preview the audio and open edit modal

        // Stop any previously playing sound
        if (activeSoundObj) {
            await activeSoundObj.unloadAsync();
            setActiveSoundObj(null);
        }

        const playbackObj = await playSoundFile(sound.uri);
        setActiveSoundObj(playbackObj);

        setSelectedSound(sound);
        setIsModalVisible(true);
    };

    const handleModalClose = async () => {
        setIsModalVisible(false);
        setSelectedSound(null);

        if (activeSoundObj) {
            await activeSoundObj.unloadAsync();
            setActiveSoundObj(null);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#25D366" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Botonera</Text>
            </View>

            <FlatList
                data={sounds}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={styles.gridContainer}
                columnWrapperStyle={styles.row}
                renderItem={({ item }) => (
                    <SoundButton
                        sound={item}
                        onPress={handleShortTap}
                        onLongPress={handleLongPress}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            No sounds yet! Tap the + button to add your first sound.
                        </Text>
                    </View>
                }
            />

            <AddSoundFab onPress={addNewSound} />

            <EditSoundModal
                visible={isModalVisible}
                sound={selectedSound}
                onClose={handleModalClose}
                onSave={updateSound}
                onDelete={deleteSound}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        paddingTop: 40,
        backgroundColor: '#1F1F1F',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        elevation: 4,     // Android shadow
        zIndex: 10,       // Keep header above flatlist
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: 'bold',
    },
    gridContainer: {
        padding: 16,
        paddingBottom: 100, // Make room for FAB
    },
    row: {
        justifyContent: 'flex-start',
        gap: 12, // Native margin works better sometimes, but gap is supported in newer React Native versions when using flexWrap or columnWrapperStyle
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    }
});
