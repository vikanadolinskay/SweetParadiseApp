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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  registerWithEmail,
  sendPhoneVerificationCode,
  verifyPhoneCode,
  clearPendingVerification,
} from '../../services/firebase';
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
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const countdownInterval = useRef(null);

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

  const startCountdown = (seconds = 60) => {
    setCountdown(seconds);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!phone || !validatePhone(phone)) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона в формате +7XXXXXXXXXX');
      return;
    }

    setLoading(true);
    const result = await sendPhoneVerificationCode(phone);
    setLoading(false);

    if (result.success) {
      setCodeSent(true);
      startCountdown(60);
      Alert.alert('Код отправлен', 'SMS с кодом подтверждения отправлена на ваш номер');
    } else {
      Alert.alert('Ошибка', result.error);
    }
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

    if (!codeSent || !verificationCode || verificationCode.length < 6) {
      Alert.alert('Ошибка', 'Введите код подтверждения из SMS');
      return;
    }

    setLoading(true);

    try {
      const phoneVerifyResult = await verifyPhoneCode(verificationCode);
      
      if (!phoneVerifyResult.success) {
        Alert.alert('Ошибка', phoneVerifyResult.error);
        setLoading(false);
        return;
      }

      const result = await registerWithEmail(email, password, fullName, phone);

      if (!result.success) {
        Alert.alert('Ошибка регистрации', result.error);
        setLoading(false);
        return;
      }

      await createUser(result.user.uid, email, fullName, phone);

      clearPendingVerification();
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
                    disabled={loading || countdown > 0}
                  >
                    <Text style={styles.codeButtonText}>
                      {countdown > 0 ? `${countdown}с` : 'Получить код'}
                    </Text>
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
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
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
});