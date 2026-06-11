import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { addToCart } from '../../services/cart';

const decors = [
  { id: 'none', name: 'Без декора', price: 0 },
  { id: 'cream', name: 'Кремовые розочки', price: 400 },
  { id: 'fruit', name: 'Свежие ягоды', price: 350 },
  { id: 'chocolate', name: 'Шоколадные фигуры', price: 500 },
  { id: 'macaron', name: 'Макарон', price: 450 },
];

export default function CustomizeScreen4({ route, navigation }) {
  const { product, customization, totalExtra } = route.params;
  const [selected, setSelected] = useState(null);

  const handleAddToCart = async () => {
    if (!selected) {
      alert('Выберите декор');
      return;
    }
    
    const finalCustomization = { ...customization, decor: selected };
    const finalPrice = product.price + totalExtra + selected.price;
    
    await addToCart({
      ...product,
      price: finalPrice,
    }, 1, finalCustomization);
    
    Alert.alert('Успешно', 'Товар добавлен в корзину с вашими настройками');
    navigation.popToTop(); // Возврат в каталог
  };

  const total = product.price + totalExtra + (selected?.price || 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Выберите декор</Text>
      <FlatList
        data={decors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.option, selected?.id === item.id && styles.selected]}
            onPress={() => setSelected(item)}
          >
            <Text style={styles.optionName}>{item.name}</Text>
            <Text style={styles.optionPrice}>
              {item.price === 0 ? 'Базовый' : `+${item.price} ₽`}
            </Text>
          </TouchableOpacity>
        )}
      />
      
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Итоговая цена:</Text>
        <Text style={styles.totalPrice}>{total} ₽</Text>
      </View>
      
      <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
        <Text style={styles.addButtonText}>Добавить в корзину</Text>
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
  selected: { backgroundColor: '#FFE4E1', borderWidth: 1, borderColor: '#FF147A' },
  optionName: { fontSize: 16, color: '#333' },
  optionPrice: { fontSize: 14, color: '#666' },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginVertical: 20,
  },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  totalPrice: { fontSize: 24, fontWeight: 'bold', color: '#FF147A' },
  addButton: { backgroundColor: '#FFBCD9', padding: 16, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});