// src/screens/auth/RegisterScreen.js
// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { checkEmailExists, createUser } from '../../services/database';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sentCode, setSentCode] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const validateEmail = (emailText) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailText);
  };

  const validatePhone = (phoneText) => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phoneText.replace(/\s/g, ''));
  };

  const formatPhoneNumber = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.startsWith('7') && cleaned.length === 11) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('8') && cleaned.length === 11) {
      cleaned = '+7' + cleaned.slice(1);
    } else if (!cleaned.startsWith('+') && cleaned.length > 0) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
    setIsPhoneValid(validatePhone(formatted));
  };

  const handleEmailChange = async (text) => {
    setEmail(text);
    const isValid = validateEmail(text);
    setIsEmailValid(isValid);

    if (isValid && text.length > 0) {
      setIsEmailChecking(true);
      const exists = await checkEmailExists(text);
      if (exists) {
        setIsEmailValid(false);
        Alert.alert('Ошибка', 'Этот email уже зарегистрирован');
      }
      setIsEmailChecking(false);
    }
  };

  const handleSendCode = () => {
    if (!phone || !validatePhone(phone)) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона в формате +7XXXXXXXXXX');
      return;
    }
    const code = generateVerificationCode();
    setSentCode(code);
    setCodeSent(true);
    Alert.alert('Код подтверждения', `Ваш код: ${code}\n(в реальном приложении будет отправлен по SMS)`);
  };

  const handleRegister = async () => {
    if (!fullName || !phone || !email || !password || !confirmPassword) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Ошибка', 'Введите корректный email адрес');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона в формате +7XXXXXXXXXX');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен быть не менее 6 символов');
      return;
    }

    if (!codeSent || !verificationCode || verificationCode !== sentCode) {
      Alert.alert('Ошибка', 'Неверный код подтверждения');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Ошибка', 'Примите условия Пользовательского соглашения');
      return;
    }

    setLoading(true);

    try {
      await createUser(email, fullName, phone, password);
      Alert.alert('Успех', 'Регистрация прошла успешно');
      navigation.replace('ClientTabs');
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert('Ошибка', 'Не удалось завершить регистрацию');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#FFBCD9', '#FFCBBB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.titleGradient}
          >
            <Text style={styles.title}>Sweet Paradise</Text>
          </LinearGradient>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="ФИО"
              placeholderTextColor="#828282"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />

            <View>
              <View style={styles.phoneContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.phoneInput,
                    !isPhoneValid && phone.length > 0 && styles.inputError,
                  ]}
                  placeholder="Номер телефона (+7XXXXXXXXXX)"
                  placeholderTextColor="#828282"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  editable={!loading && !codeSent}
                />
                {!codeSent ? (
                  <TouchableOpacity
                    style={[styles.codeButton, loading && styles.codeButtonDisabled]}
                    onPress={handleSendCode}
                    disabled={loading}
                  >
                    <Text style={styles.codeButtonText}>Получить код</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.codeSentBadge}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  </View>
                )}
              </View>
              {!isPhoneValid && phone.length > 0 && (
                <Text style={styles.errorText}>Неверный формат номера телефона</Text>
              )}
            </View>

            {codeSent && (
              <TextInput
                style={styles.input}
                placeholder="Код из SMS (6 цифр)"
                placeholderTextColor="#828282"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
            )}

            <View>
              <TextInput
                style={[
                  styles.input,
                  !isEmailValid && email.length > 0 && styles.inputError,
                ]}
                placeholder="Email"
                placeholderTextColor="#828282"
                value={email}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading && !isEmailChecking}
              />
              {isEmailChecking && (
                <ActivityIndicator
                  size="small"
                  color="#FF147A"
                  style={styles.emailIndicator}
                />
              )}
              {!isEmailValid && email.length > 0 && !isEmailChecking && (
                <Text style={styles.errorText}>
                  Email уже зарегистрирован или неверный формат
                </Text>
              )}
            </View>

            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Пароль (мин. 6 символов)"
                placeholderTextColor="#828282"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#828282"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Подтвердите пароль"
                placeholderTextColor="#828282"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#828282"
                />
              </TouchableOpacity>
            </View>

            {/* Галочка принятия условий Пользовательского соглашения */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.termsText}>
                Я принимаю условия{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => setShowTermsModal(true)}
                >
                  Пользовательского соглашения
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FFBCD9', '#FFCBBB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Зарегистрироваться</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
            <Text style={styles.loginLink}>Уже есть аккаунт? Войти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal с Пользовательским соглашением */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Пользовательское соглашение</Text>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalText}>
                {`1. Общие положения\n\n1.1. Настоящее Пользовательское соглашение (далее — Соглашение) регулирует отношения между кондитерской "Sweet Paradise" (далее — Кондитерская) и пользователем мобильного приложения "Sweet Paradise" (далее — Приложение).\n\n1.2. Используя Приложение и проходя регистрацию, Пользователь подтверждает свое полное и безоговорочное согласие с условиями настоящего Соглашения.\n\n1.3. Кондитерская оставляет за собой право вносить изменения в Соглашение без предварительного уведомления Пользователя. Актуальная версия Соглашения всегда доступна в Приложении.\n\n2. Предмет Соглашения\n\n2.1. Кондитерская предоставляет Пользователю возможность использовать Приложение для ознакомления с ассортиментом, персонализации и заказа кондитерских изделий.\n\n2.2. Приложение предоставляет следующие функции: просмотр каталога, персонализация товаров, добавление в корзину, оформление заказа, отслеживание статуса заказа, программа лояльности.\n\n3. Права и обязанности Пользователя\n\n3.1. Пользователь обязуется предоставлять достоверную информацию при регистрации и оформлении заказов.\n\n3.2. Пользователь обязуется самостоятельно обеспечивать сохранность своих учетных данных (логин и пароль).\n\n3.3. Пользователь имеет право отменить заказ до момента его передачи в производство.\n\n3.4. Пользователь имеет право получать информацию о статусе своего заказа.\n\n4. Права и обязанности Кондитерской\n\n4.1. Кондитерская обязуется обрабатывать заказы в установленные сроки и в соответствии с выбранными параметрами.\n\n4.2. Кондитерская обязуется обеспечивать конфиденциальность персональных данных Пользователя.\n\n4.3. Кондитерская имеет право отказать в обслуживании при нарушении Пользователем условий Соглашения.\n\n5. Конфиденциальность и обработка персональных данных\n\n5.1. Личные данные Пользователя (ФИО, номер телефона, email) используются исключительно для обработки заказов и программы лояльности.\n\n5.2. Кондитерская обязуется не передавать персональные данные третьим лицам без согласия Пользователя, за исключением случаев, предусмотренных законодательством РФ.\n\n5.3. Пользователь дает согласие на получение уведомлений о статусе заказа и акциях Кондитерской.\n\n6. Ответственность\n\n6.1. Пользователь несет ответственность за достоверность предоставленной информации.\n\n6.2. Кондитерская не несет ответственность за качество продукции, если Пользователь не указал особенности при заказе (аллергии, предпочтения).\n\n6.3. Кондитерская не несет ответственность за невозможность использования Приложения по техническим причинам, не зависящим от Кондитерской.\n\n7. Программа лояльности\n\n7.1. Бонусные баллы начисляются за каждый заказ в размере 5% от суммы заказа.\n\n7.2. Накопленные баллы можно использовать для оплаты до 50% стоимости заказа.\n\n7.3. Баллы действительны в течение 6 месяцев с момента начисления.\n\n8. Заключительные положения\n\n8.1. Настоящее Соглашение вступает в силу с момента регистрации Пользователя в Приложении.\n\n8.2. По всем вопросам, связанным с Соглашением, Пользователь может обратиться в службу поддержки Кондитерской.`}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setAcceptedTerms(true);
                setShowTermsModal(false);
              }}
            >
              <Text style={styles.modalButtonText}>Принимаю</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#fff',
  },
  titleGradient: {
    marginBottom: 40,
    borderRadius: 40,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
    color: '#fff',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#E6E6E6',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF147A',
    backgroundColor: '#FFF0F0',
  },
  errorText: {
    color: '#FF147A',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  emailIndicator: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
  },
  codeButton: {
    backgroundColor: '#FF147A',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  codeButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  codeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  codeSentBadge: {
    marginLeft: 10,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6E6E6',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  eyeIcon: {
    padding: 5,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FF147A',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF147A',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  termsLink: {
    color: '#FF147A',
    textDecorationLine: 'underline',
  },
  registerButton: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 30,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    color: '#FF147A',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
  },
  modalContent: {
    maxHeight: 400,
    marginBottom: 20,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  modalButton: {
    backgroundColor: '#FF147A',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Semibold' : 'Poppins',
  },
});