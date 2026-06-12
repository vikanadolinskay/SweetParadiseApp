import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createOrder } from '../../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckoutScreen({ route, navigation }) {
  const { total, cart } = route.params;
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Данные заказа
  const [pickupAddress, setPickupAddress] = useState('г. Таганрог, ул. Петровская 711');
  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // Данные карты для платежного шлюза
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  
  // Статус платежа
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);

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
      } else {
        Alert.alert('Ошибка', 'Пожалуйста, войдите в аккаунт');
        navigation.navigate('Login');
      }
    };
    getUserId();
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const processPayment = async () => {
    // Симуляция платежного шлюза ЮMoney
    setPaymentProcessing(true);
    
    // Имитация запроса к API ЮMoney
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Валидация карты (простая проверка)
        if (cardNumber.length >= 16 && cardExpiry.length >= 5 && cardCvv.length >= 3) {
          resolve({ success: true, paymentId: 'PAY_' + Date.now() });
        } else {
          reject({ success: false, error: 'Неверные данные карты' });
        }
      }, 2000);
    });
  };

  const handleSubmitOrder = async () => {
    if (!userId) {
      Alert.alert('Ошибка', 'Пожалуйста, войдите в аккаунт');
      navigation.navigate('Login');
      return;
    }

    if (paymentMethod === 'card' && !cardNumber) {
      setShowPaymentModal(true);
      return;
    }

    setLoading(true);

    try {
      let paymentResult = null;
      
      if (paymentMethod === 'card') {
        paymentResult = await processPayment();
        if (!paymentResult.success) {
          Alert.alert('Ошибка оплаты', paymentResult.error || 'Платёж не прошёл');
          setLoading(false);
          return;
        }
      }

      // Формируем данные заказа
      const desiredDateTime = new Date(pickupDate);
      desiredDateTime.setHours(pickupTime.getHours(), pickupTime.getMinutes());

      const orderItems = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        customization: item.customization,
      }));

      const orderId = await createOrder(
        userId,
        total,
        pickupAddress,
        desiredDateTime.toISOString(),
        paymentMethod,
        orderItems
      );

      if (orderId) {
        setOrderNumber(orderId);
        setShowSuccessModal(true);
      } else {
        Alert.alert('Ошибка', 'Не удалось создать заказ');
      }
    } catch (error) {
      console.error('Order error:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при оформлении заказа');
    } finally {
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!cardNumber || !cardExpiry || !cardCvv) {
      Alert.alert('Ошибка', 'Заполните все поля карты');
      return;
    }
    setShowPaymentModal(false);
    await handleSubmitOrder();
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'ClientTabs' }],
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Адрес самовывоза */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>АДРЕС САМОВЫВОЗА</Text>
          <View style={styles.addressContainer}>
            {pickupAddresses.map((addr) => (
              <TouchableOpacity
                key={addr}
                style={[styles.addressOption, pickupAddress === addr && styles.addressOptionActive]}
                onPress={() => setPickupAddress(addr)}
              >
                <Text style={[styles.addressText, pickupAddress === addr && styles.addressTextActive]}>
                  {addr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Дата и время получения */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ДАТА И ВРЕМЯ ПОЛУЧЕНИЯ</Text>
          
          <TouchableOpacity style={styles.dateTimeRow} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={24} color="#FF147A" />
            <Text style={styles.dateTimeText}>{formatDate(pickupDate)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dateTimeRow} onPress={() => setShowTimePicker(true)}>
            <Ionicons name="time-outline" size={24} color="#FF147A" />
            <Text style={styles.dateTimeText}>{formatTime(pickupTime)}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={pickupDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setPickupDate(selectedDate);
            }}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={pickupTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) setPickupTime(selectedTime);
            }}
          />
        )}

        {/* Способ оплаты */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>СПОСОБ ОПЛАТЫ</Text>
          
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
            <TouchableOpacity style={styles.cardInfoBtn} onPress={() => setShowPaymentModal(true)}>
              <Ionicons name="card-outline" size={20} color="#FF147A" />
              <Text style={styles.cardInfoText}>
                {cardNumber ? `Карта •••• ${cardNumber.slice(-4)}` : 'Добавить карту'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#FF147A" />
            </TouchableOpacity>
          )}
        </View>

        {/* Состав заказа */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>СОСТАВ ЗАКАЗА</Text>
          {cart.map((item, index) => (
            <View key={index} style={styles.orderItemRow}>
              <Text style={styles.orderItemName}>
                {item.name} × {item.quantity}
              </Text>
              <Text style={styles.orderItemPrice}>{item.price * item.quantity} ₽</Text>
            </View>
          ))}
        </View>

        {/* Итого */}
        <LinearGradient
          colors={['#FFCBBB', '#FFCBBB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.totalGradient}
        >
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Итого:</Text>
            <Text style={styles.totalPrice}>{Math.round(total)} ₽</Text>
          </View>
        </LinearGradient>

        {/* Кнопка подтверждения */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleSubmitOrder}
          disabled={loading || paymentProcessing}
        >
          <LinearGradient
            colors={['#FF147A', '#FF69B4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmGradient}
          >
            {loading || paymentProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>
                {paymentMethod === 'card' ? 'Подтвердить и оплатить' : 'Подтвердить заказ'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Модальное окно ввода данных карты (ЮMoney) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentModal}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Оплата картой</Text>
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

            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmPayment}>
              <LinearGradient
                colors={['#FF147A', '#FF69B4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalConfirmGradient}
              >
                <Text style={styles.modalConfirmText}>Оплатить {Math.round(total)} ₽</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.modalSecureText}>
              <Ionicons name="shield-checkmark" size={14} color="#4CAF50" /> 
              Платежи защищены ЮMoney
            </Text>
          </View>
        </View>
      </Modal>

      {/* Модальное окно успешного заказа */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.successTitle}>Заказ успешно оформлен!</Text>
            <Text style={styles.successNumber}>Номер заказа: #{orderNumber}</Text>
            <Text style={styles.successDate}>
              Дата получения: {formatDate(pickupDate)} в {formatTime(pickupTime)}
            </Text>
            <Text style={styles.successAddress}>Самовывоз: {pickupAddress}</Text>
            <TouchableOpacity style={styles.successButton} onPress={handleSuccessClose}>
              <LinearGradient
                colors={['#FF147A', '#FF69B4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.successGradient}
              >
                <Text style={styles.successButtonText}>Перейти в каталог</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  addressContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  addressOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  addressOptionActive: {
    backgroundColor: '#FF147A',
  },
  addressText: {
    fontSize: 12,
    color: '#666',
  },
  addressTextActive: {
    color: '#fff',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentOptionActive: {
    backgroundColor: 'transparent',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF147A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF147A',
  },
  paymentOptionText: {
    fontSize: 14,
    color: '#2C2C2C',
  },
  cardInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  cardInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#2C2C2C',
    marginLeft: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 13,
    color: '#2C2C2C',
    flex: 2,
  },
  orderItemPrice: {
    fontSize: 13,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  totalGradient: {
    borderRadius: 12,
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  confirmButton: {
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
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
  modalConfirmBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 12,
  },
  modalConfirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
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
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  successNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF147A',
    marginBottom: 16,
  },
  successDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  successAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  successButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  successGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});