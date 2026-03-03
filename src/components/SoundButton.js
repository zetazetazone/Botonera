import { Dimensions, StyleSheet, Text, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');
// Responsive grid: 3 columns with padding
const numColumns = 3;
const padding = 16;
const itemSpacing = 12;
const totalSpacing = (numColumns - 1) * itemSpacing + (padding * 2);
const itemWidth = (width - totalSpacing) / numColumns;

export default function SoundButton({ sound, onPress, onLongPress }) {
    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: sound.color || '#333' }]}
            onPress={() => onPress(sound)}
            onLongPress={() => onLongPress(sound)}
            activeOpacity={0.7}
        >
            <Text style={styles.title} numberOfLines={2}>
                {sound.title}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: itemWidth,
        height: itemWidth,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: itemSpacing,
        padding: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
});
