import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCartItems, removeFromCart, updateCartQuantity } from '../../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CartScreen({ navigation }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [userId, setUserId] = useState(null);

  // Получаем реальный userId из сессии
  useEffect(() => {
    const getUserId = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserId(user.user_id);
      }
    };
    getUserId();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadCart();
      }
    }, [userId])
  );

  const loadCart = async () => {
    if (!userId) return;
    setLoading(true);
    const items = await getCartItems(userId);
    setCart(items);
    setLoading(false);
  };

  // Функция для корректного парсинга customization
  const parseCustomization = (customization) => {
    if (!customization) return null;
    if (typeof customization === 'string') {
      try {
        return JSON.parse(customization);
      } catch (e) {
        return null;
      }
    }
    return customization;
  };

  // Форматирование текста персонализации
  const getCustomizationText = (customization) => {
    const parsed = parseCustomization(customization);
    if (!parsed) return null;
    const parts = [];
    if (parsed.shape) parts.push(parsed.shape.name || parsed.shape);
    if (parsed.size) parts.push(parsed.size.name || parsed.size);
    if (parsed.filling) parts.push(parsed.filling.name || parsed.filling);
    if (parsed.decor) parts.push(parsed.decor.name || parsed.decor);
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  const handleRemove = (cartItemId) => {
    Alert.alert('Удаление', 'Удалить товар из корзины?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        onPress: async () => {
          await removeFromCart(cartItemId);
          loadCart();
        },
      },
    ]);
  };

  const handleUpdateQuantity = async (cartItemId, productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemove(cartItemId);
      return;
    }
    await updateCartQuantity(cartItemId, newQuantity);
    loadCart();
  };

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === 'sweet2026') {
      setDiscount(10);
      setPromoApplied(true);
      Alert.alert('Успешно', 'Промокод применён! Скидка 10%');
    } else if (promoCode.toLowerCase() === 'welcome') {
      setDiscount(5);
      setPromoApplied(true);
      Alert.alert('Успешно', 'Промокод применён! Скидка 5%');
    } else {
      Alert.alert('Ошибка', 'Неверный промокод');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const renderCartItem = ({ item }) => {
    const imageUrl = item.image_url || 'https://via.placeholder.com/60x60?text=Cake';
    const customizationText = getCustomizationText(item.customization);

    return (
      <View style={styles.cartItem}>
        <Image source={{ uri: imageUrl }} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          {customizationText && (
            <Text style={styles.itemCustom} numberOfLines={2}>
              {customizationText}
            </Text>
          )}
          <Text style={styles.itemPrice}>{item.price} ₽</Text>
        </View>
        <View style={styles.itemRight}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => handleUpdateQuantity(item.cart_item_id, item.product_id, item.quantity - 1)}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => handleUpdateQuantity(item.cart_item_id, item.product_id, item.quantity + 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => handleRemove(item.cart_item_id)}>
            <Text style={styles.removeText}>Удалить</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D2691E" />
      </View>
    );
  }

  if (cart.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Корзина пуста</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Каталог')}>
          <Text style={styles.shopBtnText}>Перейти в каталог</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.cart_item_id.toString()}
        renderItem={renderCartItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Блок оплаты */}
      <View style={styles.paymentBlock}>
        <Text style={styles.sectionTitle}>ОПЛАТА</Text>
        <View style={styles.paymentCard}>
          <Text style={styles.cardText}>Visa *1234</Text>
          <TouchableOpacity>
            <Text style={styles.changeText}>Изменить</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Промокод */}
      <View style={styles.promoBlock}>
        <Text style={styles.sectionTitle}>ПРОМОКОД</Text>
        <View style={styles.promoRow}>
          <TextInput
            style={styles.promoInput}
            placeholder="Введите промокод"
            placeholderTextColor="#999"
            value={promoCode}
            onChangeText={setPromoCode}
            editable={!promoApplied}
          />
          {!promoApplied ? (
            <TouchableOpacity style={styles.applyBtn} onPress={applyPromoCode}>
              <Text style={styles.applyBtnText}>Применить</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.appliedBadge}>
              <Text style={styles.appliedText}>✓ Применён</Text>
            </View>
          )}
        </View>
        {promoApplied && (
          <Text style={styles.discountText}>Скидка: {discount}% ({Math.round(discountAmount)} ₽)</Text>
        )}
      </View>

      {/* Позиции и итог */}
      <View style={styles.totalBlock}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>ПОЗИЦИИ</Text>
          <Text style={styles.totalLabel}>ЦЕНА</Text>
        </View>
        
        {cart.map((item) => (
          <View key={item.cart_item_id} style={styles.totalItemRow}>
            <Text style={styles.totalItemName}>
              {item.name} × {item.quantity}
            </Text>
            <Text style={styles.totalItemPrice}>{item.price * item.quantity} ₽</Text>
          </View>
        ))}

        <View style={styles.pickupRow}>
          <Text style={styles.pickupLabel}>ТОЧКА САМОВЫВОЗА:</Text>
          <Text style={styles.pickupAddress}>г. Таганрог, ул. Петровская 711</Text>
        </View>

        <View style={styles.finalTotalRow}>
          <Text style={styles.finalTotalLabel}>Итого:</Text>
          <Text style={styles.finalTotalPrice}>{Math.round(total)} ₽</Text>
        </View>

        <TouchableOpacity 
          style={styles.payButton}
          onPress={() => navigation.navigate('Checkout', { total, cart })}
        >
          <Text style={styles.payButtonText}>Оплатить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  shopBtn: {
    backgroundColor: '#D2691E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 12,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  itemCustom: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: '#D2691E',
    marginTop: 4,
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  removeText: {
    color: '#ff6b6b',
    fontSize: 12,
  },
  paymentBlock: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 12,
    letterSpacing: 1,
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  changeText: {
    fontSize: 12,
    color: '#D2691E',
  },
  promoBlock: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
  },
  applyBtn: {
    backgroundColor: '#D2691E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  appliedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  appliedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  discountText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 8,
  },
  totalBlock: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    letterSpacing: 1,
  },
  totalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalItemName: {
    fontSize: 13,
    color: '#555',
    flex: 2,
  },
  totalItemPrice: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  pickupRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pickupLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 4,
  },
  pickupAddress: {
    fontSize: 14,
    color: '#333',
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  finalTotalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D2691E',
  },
  payButton: {
    backgroundColor: '#D2691E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});