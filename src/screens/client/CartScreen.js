import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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
import { showGradientAlert } from '../../components/GradientAlert';
import { showGradientConfirm } from '../../components/GradientConfirm';

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
  const [showCvv, setShowCvv] = useState(false);

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

  const handleRemove = (cartItemId, productName) => {
    showGradientConfirm({
      title: 'Удаление',
      message: 'Удалить товар из корзины?',
      onConfirm: async () => {
        await removeFromCart(cartItemId);
        loadCart();
      },
    });
  };

  const handleUpdateQuantity = async (cartItemId, productId, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }
    await updateCartQuantity(cartItemId, newQuantity);
    loadCart();
  };

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === 'sweet2026') {
      setDiscount(10);
      setPromoApplied(true);
      showGradientAlert({ title: 'Успешно', message: 'Промокод применён! Скидка 10%' });
    } else if (promoCode.toLowerCase() === 'welcome') {
      setDiscount(5);
      setPromoApplied(true);
      showGradientAlert({ title: 'Успешно', message: 'Промокод применён! Скидка 5%' });
    } else {
      showGradientAlert({ title: 'Ошибка', message: 'Неверный промокод' });
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
      showGradientAlert({ title: 'Успешно', message: 'Карта сохранена' });
    } else {
      showGradientAlert({ title: 'Ошибка', message: 'Заполните все поля карты' });
    }
  };

  const formatCardNumber = (text) => {
    let formatted = text.replace(/\s/g, '');
    if (formatted.length > 16) formatted = formatted.slice(0, 16);
    formatted = formatted.replace(/(.{4})/g, '$1 ').trim();
    return formatted;
  };

  const formatExpiry = (text) => {
    let formatted = text.replace(/\//g, '');
    if (formatted.length > 4) formatted = formatted.slice(0, 4);
    if (formatted.length >= 3) {
      formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
    }
    return formatted;
  };

  const formatCvv = (text) => {
    if (text.length > 3) return text.slice(0, 3);
    return text;
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      showGradientAlert({ title: 'Корзина пуста', message: 'Добавьте товары в корзину' });
      return;
    }
    
    navigation.navigate('Checkout', { 
      total, 
      cart,
      pickupAddress,
      paymentMethod,
      savedCard,
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
        <TouchableOpacity onPress={() => handleRemove(item.cart_item_id, item.name)} style={styles.removeIcon}>
          <Ionicons name="close-circle" size={22} color="#FF147A" />
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
        <Ionicons name="cart-outline" size={70} color="#ddd" />
        <Text style={styles.emptyText}>Корзина пуста</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Каталог')}>
          <Text style={styles.shopBtnText}>Перейти в каталог</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Заголовок со стрелкой назад */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF147A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Корзина</Text>
        <View style={styles.placeholder} />
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
          
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('cash')}
          >
            <View style={styles.radioCircle}>
              {paymentMethod === 'cash' && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.paymentOptionText}>Наличными при получении</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.radioCircle}>
              {paymentMethod === 'card' && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.paymentOptionText}>Банковской картой онлайн</Text>
          </TouchableOpacity>

          {paymentMethod === 'card' && (
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
                  <Ionicons name="card-outline" size={18} color="#FF147A" />
                  <Text style={styles.addCardText}>Добавить карту</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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
                <Text style={styles.appliedText}>Применён</Text>
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
                    {addr.length > 35 ? addr.substring(0, 32) + '...' : addr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Итого - градиентный фон */}
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

          {/* Кнопка Оформить заказ - градиентная */}
          <TouchableOpacity 
            style={styles.payButton}
            onPress={handleProceedToCheckout}
          >
            <LinearGradient
              colors={['#FFBCD9', '#FFCBBB']}
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
                <Ionicons name="close" size={22} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.cardPreview}>
              <Text style={styles.cardPreviewNumber}>
                {cardNumber || '•••• •••• •••• ••••'}
              </Text>
              <View style={styles.cardPreviewRow}>
                <Text style={styles.cardPreviewExpiry}>{cardExpiry || 'MM/YY'}</Text>
                <Ionicons name="card" size={28} color="#fff" />
              </View>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Номер карты"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={19}
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Имя держателя"
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
                onChangeText={(text) => setCardExpiry(formatExpiry(text))}
                maxLength={5}
              />
              <TextInput
                style={[styles.modalInput, styles.modalHalfInput]}
                placeholder="CVC"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={3}
                secureTextEntry={false}
                value={showCvv ? cardCvv : (cardCvv ? cardCvv.replace(/./g, '*') : '')}
                onFocus={() => setShowCvv(true)}
                onBlur={() => setShowCvv(false)}
                onChangeText={(text) => setCardCvv(formatCvv(text))}
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
              <Ionicons name="shield-checkmark" size={12} color="#4CAF50" /> 
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
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF147A',
    fontFamily: 'Poppins-SemiBold',
  },
  placeholder: {
    width: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 16,
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  shopBtn: {
    backgroundColor: '#FF147A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
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
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF147A',
    marginBottom: 12,
    letterSpacing: 1,
    fontFamily: 'Poppins-SemiBold',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
  },
  removeIcon: {
    position: 'absolute',
    left: -8,
    top: '50%',
    marginTop: -11,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  itemImage: {
    width: 55,
    height: 55,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginLeft: 10,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C2C2C',
    fontFamily: 'Poppins-SemiBold',
  },
  itemCustom: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2C2C2C',
    fontFamily: 'Poppins-Medium',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  quantityText: {
    marginHorizontal: 10,
    fontSize: 13,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentOptionActive: {
    backgroundColor: 'transparent',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FF147A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioSelected: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FF147A',
  },
  paymentOptionText: {
    fontSize: 13,
    color: '#2C2C2C',
    fontFamily: 'Poppins-Regular',
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  cardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  cardHolderText: {
    fontSize: 10,
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
    paddingVertical: 8,
  },
  addCardText: {
    fontSize: 13,
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
    paddingVertical: 8,
    fontSize: 13,
    marginRight: 8,
  },
  applyBtn: {
    backgroundColor: '#FF147A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  appliedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  appliedText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  discountText: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF147A',
    letterSpacing: 1,
    fontFamily: 'Poppins-SemiBold',
  },
  totalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalItemName: {
    fontSize: 12,
    color: '#2C2C2C',
    flex: 2,
    fontFamily: 'Poppins-Regular',
  },
  totalItemPrice: {
    fontSize: 12,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  pickupRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pickupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF147A',
    marginBottom: 6,
  },
  pickupPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickupOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    marginRight: 6,
    marginBottom: 6,
  },
  pickupOptionActive: {
    backgroundColor: '#FF147A',
  },
  pickupOptionText: {
    fontSize: 11,
    color: '#666',
  },
  pickupOptionTextActive: {
    color: '#fff',
  },
  finalTotalGradient: {
    borderRadius: 10,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  finalTotalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  payButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  payGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF147A',
    fontFamily: 'Poppins-SemiBold',
  },
  cardPreview: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  cardPreviewNumber: {
    fontSize: 14,
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 10,
  },
  cardPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPreviewExpiry: {
    fontSize: 12,
    color: '#ccc',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
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
    marginTop: 10,
  },
  modalSaveGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSecureText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
});