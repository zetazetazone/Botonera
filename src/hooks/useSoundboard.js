import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { deleteAudioFile, saveAudioFile } from '../utils/audioBridge';

const STORAGE_KEY = '@soundboard_items';

export const SoundboardContext = createContext(null);

export const SoundboardProvider = ({ children }) => {
    const [sounds, setSounds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load sounds from AsyncStorage on mount
    useEffect(() => {
        loadSounds();
    }, []);

    const loadSounds = async () => {
        try {
            const storedSounds = await AsyncStorage.getItem(STORAGE_KEY);
            if (storedSounds !== null) {
                setSounds(JSON.parse(storedSounds));
            }
        } catch (error) {
            console.error("Error loading sounds from storage", error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveToStorage = async (newSounds) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSounds));
            setSounds(newSounds);
        } catch (error) {
            console.error("Error saving sounds to storage", error);
        }
    };

    const addNewSound = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['audio/*', 'application/ogg'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const fileUri = result.assets[0].uri;
                let filename = result.assets[0].name || `Sound ${sounds.length + 1}`;

                // Remove extension from filename if present for a cleaner default title
                const titleMatch = filename.match(/(.+?)(?:\.[^.]*$|$)/);
                let defaultTitle = titleMatch ? titleMatch[1] : filename;
                if (defaultTitle.length > 15) {
                    defaultTitle = defaultTitle.substring(0, 15);
                }

                // Ask for title and color (We could do a custom modal, 
                // but for now we'll just save it and let the user edit it later, 
                // or prompt using React Native Alert if we wanted to block.
                // We will just create it with random color and default name).

                const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                // Save file locally
                const permanentUri = await saveAudioFile(fileUri);

                const newSound = {
                    id: Date.now().toString(),
                    title: defaultTitle,
                    uri: permanentUri,
                    color: randomColor,
                    createdAt: Date.now()
                };

                await saveToStorage([...sounds, newSound]);
            }
        } catch (error) {
            console.error("Error picking document", error);
            Alert.alert("Error", "Could not add sound file.");
        }
    };

    const saveSoundFromUri = async (fileUri, filename = "Received Sound") => {
        try {
            const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const permanentUri = await saveAudioFile(fileUri);

            const titleMatch = filename.match(/(.+?)(?:\.[^.]*$|$)/);
            let defaultTitle = titleMatch ? titleMatch[1] : filename;
            if (defaultTitle.length > 15) {
                defaultTitle = defaultTitle.substring(0, 15);
            }

            const newSound = {
                id: Date.now().toString(),
                title: defaultTitle,
                uri: permanentUri,
                color: randomColor,
                createdAt: Date.now()
            };

            await saveToStorage([...sounds, newSound]);
        } catch (error) {
            console.error("Error saving sound from incoming share:", error);
            Alert.alert("Error", "Could not save the shared sound.");
        }
    };

    const updateSound = async (id, title, color) => {
        const updatedSounds = sounds.map(sound =>
            sound.id === id ? { ...sound, title, color } : sound
        );
        await saveToStorage(updatedSounds);
    };

    const deleteSound = async (id) => {
        const soundToDelete = sounds.find(s => s.id === id);
        if (soundToDelete) {
            await deleteAudioFile(soundToDelete.uri);
            const filteredSounds = sounds.filter(s => s.id !== id);
            await saveToStorage(filteredSounds);
        }
    };

    return (
        <SoundboardContext.Provider
            value={{
                sounds,
                isLoading,
                addNewSound,
                saveSoundFromUri,
                updateSound,
                deleteSound
            }}
        >
            {children}
        </SoundboardContext.Provider>
    );
};

export const useSoundboard = () => {
    const context = useContext(SoundboardContext);
    if (!context) {
        throw new Error("useSoundboard must be used within a SoundboardProvider");
    }
    return context;
};
