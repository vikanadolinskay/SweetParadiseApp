import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { addToCart } from '../../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [userId, setUserId] = useState(null);

  // Получаем userId при загрузке
  React.useEffect(() => {
    const getUserId = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserId(user.user_id);
      }
    };
    getUserId();
  }, []);

  const handleAddToCart = async () => {
    if (!selected) {
      Alert.alert('Ошибка', 'Выберите декор');
      return;
    }
    
    if (!userId) {
      Alert.alert('Ошибка', 'Пожалуйста, войдите в аккаунт');
      navigation.navigate('Login');
      return;
    }
    
    const finalCustomization = { ...customization, decor: selected };
    const finalPrice = product.price + totalExtra + selected.price;
    
    try {
      await addToCart(userId, product.product_id, 1, finalCustomization);
      Alert.alert('Успешно', 'Товар добавлен в корзину с вашими настройками');
      navigation.popToTop();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить товар в корзину');
    }
  };

  const total = product.price + totalExtra + (selected?.price || 0);

  return (
    <View style={styles.container}>
      {/* Заголовок со стрелкой назад */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Выбор декора</Text>
        <View style={styles.placeholder} />
      </View>

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
      
      {/* Градиентная кнопка Добавить в корзину */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
        <LinearGradient
          colors={['#FFBCD9', '#FFCBBB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addGradient}
        >
          <Text style={styles.addButtonText}>Добавить в корзину</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    backgroundColor: '#FFBCD9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -16,
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 20, 
    color: '#2C2C2C',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 10,
  },
  selected: { 
    backgroundColor: '#FFE4E1', 
    borderWidth: 1.5, 
    borderColor: '#FF147A' 
  },
  optionName: { 
    fontSize: 14, 
    color: '#2C2C2C',
    fontFamily: 'Poppins-Regular',
  },
  optionPrice: { 
    fontSize: 12, 
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginVertical: 20,
  },
  totalText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#2C2C2C',
    fontFamily: 'Poppins-SemiBold',
  },
  totalPrice: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#FF147A',
    fontFamily: 'Poppins-Bold',
  },
  addButton: {
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});