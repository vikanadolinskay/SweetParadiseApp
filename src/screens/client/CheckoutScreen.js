import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createOrderWithOffline } from '../../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showGradientAlert } from '../../components/GradientAlert';

export default function CheckoutScreen({ route, navigation }) {
  const { total, cart, pickupAddress: savedAddress, paymentMethod: savedPaymentMethod, savedCard: savedCardData } = route.params;
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [pickupAddress, setPickupAddress] = useState(savedAddress || 'г. Таганрог, ул. Петровская 711');
  
  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date;
  };
  
  const [pickupDate, setPickupDate] = useState(getMinDate());
  const [pickupTime, setPickupTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(savedPaymentMethod || 'cash');
  const [savedCard, setSavedCard] = useState(savedCardData || null);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOfflineOrder, setIsOfflineOrder] = useState(false);

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
        showGradientAlert({ 
          title: 'Ошибка', 
          message: 'Пожалуйста, войдите в аккаунт' 
        });
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

  const processPayment = async () => {
    setPaymentProcessing(true);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (cardNumber.replace(/\s/g, '').length >= 16 && cardExpiry.length >= 5 && cardCvv.length >= 3) {
          resolve({ success: true, paymentId: 'PAY_' + Date.now() });
        } else {
          reject({ success: false, error: 'Неверные данные карты' });
        }
      }, 1500);
    });
  };

  const isDateValid = () => {
    const minDate = getMinDate();
    const selectedDateTime = new Date(pickupDate);
    selectedDateTime.setHours(pickupTime.getHours(), pickupTime.getMinutes(), 0, 0);
    
    const minDateOnly = new Date(minDate);
    minDateOnly.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDateTime);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    return selectedDateOnly >= minDateOnly;
  };

  const handleSubmitOrder = async () => {
    if (!userId) {
      showGradientAlert({ 
        title: 'Ошибка', 
        message: 'Пожалуйста, войдите в аккаунт' 
      });
      navigation.navigate('Login');
      return;
    }

    if (!isDateValid()) {
      showGradientAlert({ 
        title: 'Ошибка', 
        message: 'Дата получения должна быть не раньше чем через 2 дня' 
      });
      return;
    }

    if (paymentMethod === 'card' && !savedCard && !cardNumber) {
      setShowPaymentModal(true);
      return;
    }

    setLoading(true);

    try {
      let paymentResult = null;
      
      if (paymentMethod === 'card') {
        if (!savedCard && cardNumber) {
          paymentResult = await processPayment();
          if (!paymentResult.success) {
            setErrorMessage(paymentResult.error || 'Платёж не прошёл');
            setShowErrorModal(true);
            setLoading(false);
            return;
          }
        } else if (savedCard) {
          paymentResult = { success: true, paymentId: 'PAY_' + Date.now() };
        }
      }

      const desiredDateTime = new Date(pickupDate);
      desiredDateTime.setHours(pickupTime.getHours(), pickupTime.getMinutes());

      const orderItems = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        customization: item.customization,
      }));

      const result = await createOrderWithOffline(
        userId,
        total,
        pickupAddress,
        desiredDateTime.toISOString(),
        paymentMethod,
        orderItems
      );

      if (result.success) {
        if (result.offline) {
          setIsOfflineOrder(true);
          setOrderNumber('ОФ-' + (result.offlineId || Date.now()));
          setShowSuccessModal(true);
          
          showGradientAlert({ 
            title: 'Офлайн-режим', 
            message: result.message || 'Заказ сохранён и будет отправлен при подключении к интернету' 
          });
        } else {
          setIsOfflineOrder(false);
          setOrderNumber(result.orderId);
          setShowSuccessModal(true);
        }
      } else {
        setErrorMessage(result.error || 'Не удалось создать заказ');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Order error:', error);
      setErrorMessage('Произошла ошибка при оформлении заказа');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setPaymentProcessing(false);
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
      handleSubmitOrder();
    } else {
      showGradientAlert({ 
        title: 'Ошибка', 
        message: 'Заполните все поля карты' 
      });
    }
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
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Оформление заказа</Text>
        <View style={styles.placeholder} />
      </View>

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
          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#FF147A" />
              <Text style={styles.dateTimeText}>{formatDate(pickupDate)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={20} color="#FF147A" />
              <Text style={styles.dateTimeText}>{formatTime(pickupTime)}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>Минимальная дата получения: через 2 дня</Text>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={pickupDate}
            mode="date"
            display="default"
            minimumDate={getMinDate()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setPickupDate(selectedDate);
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={pickupTime}
            mode="time"
            display="default"
            minuteInterval={30}
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                const minutes = selectedTime.getMinutes();
                if (minutes < 15) {
                  selectedTime.setMinutes(0);
                } else if (minutes < 45) {
                  selectedTime.setMinutes(30);
                } else {
                  selectedTime.setMinutes(30);
                }
                setPickupTime(selectedTime);
              }
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
          colors={['#FFBCD9', '#FFCBBB']}
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
            colors={['#FFBCD9', '#FFCBBB']}
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

      {/* Модальное окно ввода данных карты */}
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
                secureTextEntry={!showCvv}
                onFocus={() => setShowCvv(true)}
                onBlur={() => setShowCvv(false)}
                value={cardCvv}
                onChangeText={(text) => setCardCvv(formatCvv(text))}
              />
            </View>

            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSaveCard}>
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
              <Ionicons name="shield-checkmark" size={12} color="#4CAF50" /> 
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
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            <Text style={styles.successTitle}>Заказ успешно оформлен!</Text>
            <Text style={styles.successNumber}>№ {orderNumber}</Text>
            {isOfflineOrder && (
              <Text style={styles.offlineBadge}>
                <Ionicons name="cloud-outline" size={14} color="#FF9800" /> 
                {' '}Сохранён офлайн
              </Text>
            )}
            <Text style={styles.successDate}>
              {formatDate(pickupDate)} в {formatTime(pickupTime)}
            </Text>
            <Text style={styles.successAddress}>{pickupAddress}</Text>
            <TouchableOpacity style={styles.successButton} onPress={handleSuccessClose}>
              <LinearGradient
                colors={['#FFBCD9', '#FFCBBB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.successGradient}
              >
                <Text style={styles.successButtonText}>В каталог</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальное окно ошибки */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.errorOverlay}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={50} color="#FF147A" />
            <Text style={styles.errorTitle}>Ошибка</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.errorButton} onPress={() => setShowErrorModal(false)}>
              <LinearGradient
                colors={['#FFBCD9', '#FFCBBB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.errorGradient}
              >
                <Text style={styles.errorButtonText}>OK</Text>
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
    fontSize: 12,
    fontWeight: '600',
    color: '#FF147A',
    marginBottom: 12,
    letterSpacing: 1,
    fontFamily: 'Poppins-SemiBold',
  },
  addressContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  addressOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
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
    fontFamily: 'Poppins-Regular',
  },
  addressTextActive: {
    color: '#fff',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 10,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#2C2C2C',
    fontFamily: 'Poppins-Regular',
  },
  hintText: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
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
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 12,
    color: '#2C2C2C',
    flex: 2,
    fontFamily: 'Poppins-Regular',
  },
  orderItemPrice: {
    fontSize: 12,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  totalGradient: {
    borderRadius: 12,
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmButton: {
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmButtonText: {
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
    fontSize: 16,
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
    fontSize: 13,
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
    fontSize: 11,
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
  modalConfirmBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
  },
  modalConfirmGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  successNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF147A',
    marginBottom: 12,
  },
  offlineBadge: {
    fontSize: 12,
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  successDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  successAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  successButton: {
    borderRadius: 25,
    overflow: 'hidden',
    width: '100%',
  },
  successGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF147A',
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  errorGradient: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});