import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getProductById, addToCart } from '../../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

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
        <ActivityIndicator size="large" color="#FF147A" />
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
    
  let imageSource;
  if (product.image_source) {
    imageSource = product.image_source;
  } else if (product.image_url) {
    imageSource = { uri: product.image_url };
  } else {
    imageSource = { uri: 'https://via.placeholder.com/400?text=No+Image' };
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Детали товара</Text>
        <View style={styles.placeholder} />
      </View>

      <Image source={imageSource} style={styles.image} />
      
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
        
        {product.calories && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Калорийность:</Text>
            <Text style={styles.infoValue}>{product.calories} ккал</Text>
          </View>
        )}
        
        <View style={styles.buttons}>
          <LinearGradient
            colors={['#FFBCD9', '#FFCBBB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cartButton}
          >
            <TouchableOpacity style={styles.cartButtonInner} onPress={handleAddToCart}>
              <Text style={styles.buttonText}>В корзину</Text>
            </TouchableOpacity>
          </LinearGradient>
          
          {product.is_customizable === 1 && (
            <LinearGradient
              colors={['#FFBCD9', '#FFCBBB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.customizeButton}
            >
              <TouchableOpacity style={styles.customizeInner} onPress={handleCustomize}>
                <Text style={styles.customizeButtonText}>Настроить</Text>
              </TouchableOpacity>
            </LinearGradient>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  header: {
    backgroundColor: '#FFBCD9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyText: { 
    fontSize: 14, 
    color: '#999' 
  },
  image: { 
    width: '100%', 
    height: 320, 
    resizeMode: 'cover' 
  },
  content: { 
    padding: 16 
  },
  name: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#2C2C2C', 
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  discountRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 4 
  },
  oldPrice: { 
    fontSize: 14, 
    color: '#999', 
    textDecorationLine: 'line-through', 
    marginRight: 8 
  },
  discountBadge: { 
    backgroundColor: '#FFE4E1', 
    borderRadius: 12, 
    paddingHorizontal: 8, 
    paddingVertical: 2 
  },
  discountText: { 
    color: '#FF147A', 
    fontWeight: '600',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  price: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#2C2C2C', 
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  description: { 
    fontSize: 14, 
    color: '#444', 
    lineHeight: 22, 
    marginBottom: 20,
    textAlign: 'justify',
    fontFamily: 'Poppins-Regular',
  },
  infoRow: { 
    flexDirection: 'row', 
    marginBottom: 8 
  },
  infoLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#555', 
    width: 100,
    fontFamily: 'Poppins-SemiBold',
  },
  infoValue: { 
    fontSize: 14, 
    color: '#666', 
    flex: 1,
    fontFamily: 'Poppins-Regular',
  },
  buttons: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 16 
  },
  cartButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cartButtonInner: {
    padding: 14,
    alignItems: 'center',
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  customizeButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  customizeInner: {
    backgroundColor: '#fff',
    padding: 12,
    alignItems: 'center',
  },
  customizeButtonText: { 
    color: '#FF147A', 
    fontWeight: '600', 
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
});