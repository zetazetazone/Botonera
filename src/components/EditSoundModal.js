import { useEffect, useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

const COLORS = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
    '#795548', '#607d8b'
];

export default function EditSoundModal({ visible, sound, onClose, onSave, onDelete }) {
    const [title, setTitle] = useState('');
    const [selectedColor, setSelectedColor] = useState('');

    useEffect(() => {
        if (sound) {
            setTitle(sound.title);
            setSelectedColor(sound.color);
        }
    }, [sound, visible]);

    if (!visible || !sound) return null;

    const handleSave = () => {
        onSave(sound.id, title, selectedColor);
        onClose();
    };

    const handleDelete = () => {
        onDelete(sound.id);
        onClose();
    };

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
                            <Text style={styles.header}>Edit Sound</Text>

                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Sound Title"
                                placeholderTextColor="#999"
                                maxLength={20}
                            />

                            <Text style={styles.subHeader}>Choose Color</Text>
                            <View style={styles.colorGrid}>
                                {COLORS.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[
                                            styles.colorCircle,
                                            { backgroundColor: c },
                                            selectedColor === c && styles.selectedColorCircle
                                        ]}
                                        onPress={() => setSelectedColor(c)}
                                    />
                                ))}
                            </View>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
                                    <Text style={styles.buttonText}>Delete</Text>
                                </TouchableOpacity>
                                <View style={styles.rightButtons}>
                                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                                        <Text style={[styles.buttonText, { color: '#bbb' }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                                        <Text style={styles.buttonText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
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
        backgroundColor: 'rgba(0,0,0,0.6)',
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
    input: {
        backgroundColor: '#2A2A2A',
        color: '#FFF',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    subHeader: {
        color: '#CCC',
        fontSize: 14,
        marginBottom: 12,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 12,
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
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rightButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    deleteButton: {
        backgroundColor: '#d32f2f',
    },
    cancelButton: {
        backgroundColor: 'transparent',
    },
    saveButton: {
        backgroundColor: '#25D366',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 15,
    }
});
