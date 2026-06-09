import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

const shapes = [
  { id: 'round', name: 'Круглый', price: 0 },
  { id: 'square', name: 'Квадратный', price: 200 },
  { id: 'heart', name: 'Сердце', price: 300 },
  { id: 'oval', name: 'Овальный', price: 150 },
];

export default function CustomizeScreen1({ route, navigation }) {
  const { product } = route.params;
  const [selected, setSelected] = useState(null);

  const handleNext = () => {
    if (!selected) {
      alert('Выберите форму');
      return;
    }
    navigation.navigate('Customize2', {
      product,
      customization: { shape: selected },
      totalExtra: selected.price,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Выберите форму торта</Text>
      <FlatList
        data={shapes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.option, selected?.id === item.id && styles.selected]}
            onPress={() => setSelected(item)}
          >
            <Text style={styles.optionName}>{item.name}</Text>
            <Text style={styles.optionPrice}>
              {item.price === 0 ? 'Базовая' : `+${item.price} ₽`}
            </Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>Далее →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 10,
  },
  selected: { backgroundColor: '#FFE4E1', borderWidth: 1, borderColor: '#D2691E' },
  optionName: { fontSize: 16, color: '#333' },
  optionPrice: { fontSize: 14, color: '#666' },
  nextButton: { backgroundColor: '#D2691E', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  nextButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});