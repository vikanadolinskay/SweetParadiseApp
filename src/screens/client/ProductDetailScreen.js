import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    console.log('Product data:', data);
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
        <ActivityIndicator size="large" color="#FF69B4" />
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
      <Image 
        source={imageSource} 
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
            <LinearGradient
              colors={['#FFBCD9', '#FFCBBB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.customizeGradientBorder}
            >
              <TouchableOpacity style={styles.customizeButton} onPress={handleCustomize}>
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
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyText: { 
    fontSize: 16, 
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
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 8,
    textAlign: 'center',
  },
  discountRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 4 
  },
  oldPrice: { 
    fontSize: 16, 
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
    color: '#FF69B4', 
    fontWeight: 'bold' 
  },
  price: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#2C2C2C', 
    marginBottom: 16,
    textAlign: 'center',
  },
  description: { 
    fontSize: 15, 
    color: '#444', 
    lineHeight: 22, 
    marginBottom: 20,
    textAlign: 'left',
  },
  infoRow: { 
    flexDirection: 'row', 
    marginBottom: 8 
  },
  infoLabel: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#555', 
    width: 100 
  },
  infoValue: { 
    fontSize: 14, 
    color: '#666', 
    flex: 1 
  },
  buttons: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 16 
  },
  cartButton: { 
    flex: 1, 
    backgroundColor: '#FF69B4', 
    padding: 14, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  customizeGradientBorder: {
    flex: 1,
    borderRadius: 8,
    padding: 2,
  },
  customizeButton: { 
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  customizeButtonText: { 
    color: '#FF69B4', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
});