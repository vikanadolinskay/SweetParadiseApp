import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

const sizes = [
  { id: 'small', name: 'Маленький (1-2 кг)', price: 0, kg: 1.5 },
  { id: 'medium', name: 'Средний (2-3 кг)', price: 500, kg: 2.5 },
  { id: 'large', name: 'Большой (3-5 кг)', price: 1000, kg: 4 },
  { id: 'family', name: 'Семейный (5-7 кг)', price: 1800, kg: 6 },
];

export default function CustomizeScreen2({ route, navigation }) {
  const { product, customization, totalExtra } = route.params;
  const [selected, setSelected] = useState(null);

  const handleNext = () => {
    if (!selected) {
      alert('Выберите размер');
      return;
    }
    navigation.navigate('Customize3', {
      product,
      customization: { ...customization, size: selected },
      totalExtra: totalExtra + selected.price,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Выберите размер</Text>
      <FlatList
        data={sizes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.option, selected?.id === item.id && styles.selected]}
            onPress={() => setSelected(item)}
          >
            <View>
              <Text style={styles.optionName}>{item.name}</Text>
              <Text style={styles.optionSub}>{item.kg} кг</Text>
            </View>
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 10,
  },
  selected: { backgroundColor: '#FFE4E1', borderWidth: 1, borderColor: '#D2691E' },
  optionName: { fontSize: 16, color: '#333' },
  optionSub: { fontSize: 12, color: '#999', marginTop: 4 },
  optionPrice: { fontSize: 14, color: '#666' },
  nextButton: { backgroundColor: '#D2691E', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  nextButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});