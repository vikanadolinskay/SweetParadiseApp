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
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCartItems, removeFromCart, updateCartQuantity } from '../../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen({ navigation }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('г. Таганрог, ул. Петровская 711');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [savedCard, setSavedCard] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [pickupDate, setPickupDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickupAddresses = [
    'г. Таганрог, ул. Петровская 711',
    'г. Таганрог, ул. Чехова 22',
    'г. Таганрог, пер. Итальянский 5',
  ];

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

  const handleSaveCard = () => {
    if (cardNumber && cardExpiry && cardCvv && cardHolder) {
      setSavedCard({ 
        number: cardNumber.slice(-4), 
        expiry: cardExpiry,
        holder: cardHolder 
      });
      setPaymentMethod('card');
      setShowPaymentModal(false);
      Alert.alert('Успешно', 'Карта сохранена');
    } else {
      Alert.alert('Ошибка', 'Заполните все поля карты');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Корзина пуста', 'Добавьте товары в корзину');
      return;
    }
    
    navigation.navigate('Checkout', { 
      total, 
      cart,
      pickupAddress,
      paymentMethod,
      savedCard,
      pickupDate: formatDate(pickupDate)
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const renderCartItem = ({ item }) => {
    const imageSource = item.image_source || { uri: item.image_url || 'https://via.placeholder.com/60x60' };
    const customizationText = getCustomizationText(item.customization);

    return (
      <View style={styles.cartItem}>
        <TouchableOpacity onPress={() => handleRemove(item.cart_item_id)} style={styles.removeIcon}>
          <Ionicons name="close-circle" size={24} color="#FF147A" />
        </TouchableOpacity>
        <Image source={imageSource} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          {customizationText && (
            <Text style={styles.itemCustom} numberOfLines={2}>
              {customizationText}
            </Text>
          )}
          <View style={styles.itemBottomRow}>
            <Text style={styles.itemPrice}>{item.price} ₽</Text>
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
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF147A" />
      </View>
    );
  }

  if (cart.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cart-outline" size={80} color="#ddd" />
        <Text style={styles.emptyText}>Корзина пуста</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Каталог')}>
          <Text style={styles.shopBtnText}>Перейти в каталог</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Корзина</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Список товаров */}
        <View style={styles.cartList}>
          {cart.map((item) => (
            <View key={item.cart_item_id}>
              {renderCartItem({ item })}
            </View>
          ))}
        </View>

        {/* Блок оплаты */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ОПЛАТА</Text>
          <View style={styles.paymentCard}>
            {savedCard ? (
              <>
                <View>
                  <Text style={styles.cardText}>Visa *{savedCard.number}</Text>
                  <Text style={styles.cardHolderText}>{savedCard.holder}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowPaymentModal(true)}>
                  <Text style={styles.changeText}>Изменить</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.addCardBtn} onPress={() => setShowPaymentModal(true)}>
                <Ionicons name="card-outline" size={20} color="#FF147A" />
                <Text style={styles.addCardText}>+ Добавить карту</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Промокод */}
        <View style={styles.section}>
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
        <View style={styles.section}>
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

          {/* Точка самовывоза */}
          <View style={styles.pickupRow}>
            <Text style={styles.pickupLabel}>ТОЧКА САМОВЫВОЗА:</Text>
            <View style={styles.pickupPicker}>
              {pickupAddresses.map((addr) => (
                <TouchableOpacity
                  key={addr}
                  style={[styles.pickupOption, pickupAddress === addr && styles.pickupOptionActive]}
                  onPress={() => setPickupAddress(addr)}
                >
                  <Text style={[styles.pickupOptionText, pickupAddress === addr && styles.pickupOptionTextActive]}>
                    {addr.length > 30 ? addr.substring(0, 27) + '...' : addr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Итого с фоном */}
          <LinearGradient
            colors={['#FFCBBB', '#FFCBBB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.finalTotalGradient}
          >
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>Итого:</Text>
              <Text style={styles.finalTotalPrice}>{Math.round(total)} ₽</Text>
            </View>
          </LinearGradient>

          <TouchableOpacity 
            style={styles.payButton}
            onPress={handleProceedToCheckout}
          >
            <LinearGradient
              colors={['#FF147A', '#FF69B4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payGradient}
            >
              <Text style={styles.payButtonText}>Оформить заказ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Модальное окно добавления карты */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentModal}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Данные карты</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.cardPreview}>
              <Text style={styles.cardPreviewNumber}>
                {cardNumber || '•••• •••• •••• ••••'}
              </Text>
              <View style={styles.cardPreviewRow}>
                <Text style={styles.cardPreviewExpiry}>{cardExpiry || 'MM/YY'}</Text>
                <Ionicons name="card" size={32} color="#fff" />
              </View>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Номер карты"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={19}
              value={cardNumber}
              onChangeText={(text) => {
                let formatted = text.replace(/\s/g, '');
                if (formatted.length > 16) formatted = formatted.slice(0, 16);
                formatted = formatted.replace(/(.{4})/g, '$1 ').trim();
                setCardNumber(formatted);
              }}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Имя держателя (как на карте)"
              placeholderTextColor="#999"
              value={cardHolder}
              onChangeText={setCardHolder}
              autoCapitalize="characters"
            />
            
            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, styles.modalHalfInput]}
                placeholder="MM/YY"
                placeholderTextColor="#999"
                value={cardExpiry}
                onChangeText={setCardExpiry}
                maxLength={5}
              />
              <TextInput
                style={[styles.modalInput, styles.modalHalfInput]}
                placeholder="CVC"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={3}
                secureTextEntry
                value={cardCvv}
                onChangeText={setCardCvv}
              />
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveCard}>
              <LinearGradient
                colors={['#FF147A', '#FF69B4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalSaveGradient}
              >
                <Text style={styles.modalSaveBtnText}>Сохранить карту</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.modalSecureText}>
              <Ionicons name="shield-checkmark" size={14} color="#4CAF50" /> 
              Данные защищены
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFBCD9',
    paddingTop: 48,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 20,
  },
  shopBtn: {
    backgroundColor: '#FF147A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cartList: {
    padding: 12,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF147A',
    marginBottom: 12,
    letterSpacing: 1,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    position: 'relative',
  },
  removeIcon: {
    position: 'absolute',
    left: -8,
    top: '50%',
    marginTop: -12,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginLeft: 12,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  itemCustom: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#2C2C2C',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  cardHolderText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  changeText: {
    fontSize: 12,
    color: '#FF147A',
  },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  addCardText: {
    fontSize: 14,
    color: '#FF147A',
    fontWeight: '500',
    marginLeft: 8,
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
    backgroundColor: '#FF147A',
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF147A',
    letterSpacing: 1,
  },
  totalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalItemName: {
    fontSize: 13,
    color: '#2C2C2C',
    flex: 2,
  },
  totalItemPrice: {
    fontSize: 13,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  pickupRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pickupLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF147A',
    marginBottom: 8,
  },
  pickupPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickupOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  pickupOptionActive: {
    backgroundColor: '#FF147A',
  },
  pickupOptionText: {
    fontSize: 12,
    color: '#666',
  },
  pickupOptionTextActive: {
    color: '#fff',
  },
  finalTotalGradient: {
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  finalTotalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  payButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  payGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF147A',
  },
  cardPreview: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardPreviewNumber: {
    fontSize: 18,
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 12,
  },
  cardPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPreviewExpiry: {
    fontSize: 14,
    color: '#ccc',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalHalfInput: {
    width: '48%',
  },
  modalSaveBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 12,
  },
  modalSaveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSecureText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});