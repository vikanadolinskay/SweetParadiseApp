import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function CheckoutScreen({ route, navigation }) {
  const { total, cart } = route.params || { total: 0, cart: [] };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Оформление заказа</Text>
      <Text style={styles.total}>Сумма: {total} ₽</Text>
      <Text style={styles.info}>Количество позиций: {cart.length}</Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => {
          alert('Заказ оформлен! Спасибо за покупку!');
          navigation.navigate('Каталог');
        }}
      >
        <Text style={styles.buttonText}>Подтвердить заказ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#D2691E',
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  info: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#D2691E',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});