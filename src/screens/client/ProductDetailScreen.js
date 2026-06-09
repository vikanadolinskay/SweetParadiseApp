import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { getProductById, addToCart } from '../../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserId(user.user_id);
      }
    };
    getUserId();
    loadProduct();
  }, []);

  const loadProduct = async () => {
    const data = await getProductById(productId);
    setProduct(data);
    setLoading(false);
  };

  const handleAddToCart = async () => {
    if (!userId) {
      Alert.alert('Ошибка', 'Пожалуйста, войдите в аккаунт');
      navigation.navigate('Login');
      return;
    }
    await addToCart(userId, product.product_id, 1, null);
    Alert.alert('Добавлено', `${product.name} добавлен в корзину`);
  };

  const handleCustomize = () => {
    if (!userId) {
      Alert.alert('Ошибка', 'Пожалуйста, войдите в аккаунт');
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('Customize1', { product });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D2691E" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Товар не найден</Text>
      </View>
    );
  }

  const finalPrice = product.discount
    ? product.price * (100 - product.discount) / 100
    : product.price;

  return (
    <ScrollView style={styles.container}>
      <Image 
        source={{ uri: product.image_url || 'https://via.placeholder.com/400?text=Cake' }} 
        style={styles.image} 
      />
      
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        
        {product.discount > 0 && (
          <View style={styles.discountRow}>
            <Text style={styles.oldPrice}>{product.price} ₽</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{product.discount}%</Text>
            </View>
          </View>
        )}
        
        <Text style={styles.price}>{Math.round(finalPrice)} ₽</Text>
        
        <Text style={styles.description}>
          {product.description || 'Описание отсутствует'}
        </Text>
        
        {/* Дополнительные характеристики */}
        {product.filling && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Начинка:</Text>
            <Text style={styles.infoValue}>{product.filling}</Text>
          </View>
        )}
        
        {product.weight && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Вес:</Text>
            <Text style={styles.infoValue}>{product.weight}</Text>
          </View>
        )}
        
        {product.calories && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Калорийность:</Text>
            <Text style={styles.infoValue}>{product.calories} ккал</Text>
          </View>
        )}
        
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
            <Text style={styles.buttonText}>В корзину</Text>
          </TouchableOpacity>
          
          {product.is_customizable === 1 && (
            <TouchableOpacity style={styles.customizeButton} onPress={handleCustomize}>
              <Text style={styles.customizeButtonText}>Настроить</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  image: { width: '100%', height: 320, resizeMode: 'cover' },
  content: { padding: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  discountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  oldPrice: { fontSize: 16, color: '#999', textDecorationLine: 'line-through', marginRight: 8 },
  discountBadge: { backgroundColor: '#FFE4E1', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  discountText: { color: '#D2691E', fontWeight: 'bold' },
  price: { fontSize: 28, fontWeight: 'bold', color: '#D2691E', marginBottom: 16 },
  description: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 },
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  infoLabel: { fontSize: 14, fontWeight: 'bold', color: '#555', width: 100 },
  infoValue: { fontSize: 14, color: '#666', flex: 1 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cartButton: { flex: 1, backgroundColor: '#D2691E', padding: 14, borderRadius: 8, alignItems: 'center' },
  customizeButton: { flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#D2691E' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  customizeButtonText: { color: '#D2691E', fontWeight: 'bold', fontSize: 16 },
});