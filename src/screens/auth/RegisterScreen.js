// src/screens/auth/RegisterScreen.js
// @ts-nocheck
import React, { useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUser, checkEmailExists } from '../../services/database';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleRegister = async () => {
    // Валидация полей
    if (!fullName || !phone || !email || !password || !confirmPassword) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Ошибка', 'Примите условия Пользовательского соглашения');
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

    // Валидация email
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Ошибка', 'Введите корректный email');
      return;
    }

    setLoading(true);

    // Проверяем, существует ли email
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      Alert.alert('Ошибка', 'Пользователь с таким email уже существует');
      setLoading(false);
      return;
    }

    const result = await createUser(email, fullName, phone, password);
    setLoading(false);

    if (result.success) {
      // Автоматический вход после регистрации (как в ТЗ)
      Alert.alert('Успешно', 'Регистрация прошла успешно!', [
        { 
          text: 'OK', 
          onPress: () => navigation.navigate('Login')
        }
      ]);
    } else {
      Alert.alert('Ошибка', result.error || 'Не удалось создать аккаунт');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Градиентный текст без фона */}
          <LinearGradient
            colors={['#FFBCD9', '#FFCBBB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientTextContainer}
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
            <TextInput
              style={styles.input}
              placeholder="Номер телефона"
              placeholderTextColor="#828282"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#828282"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Пароль"
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

          {/* Чекбокс принятия условий */}
          <TouchableOpacity 
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              Я принимаю условия <Text style={styles.termsLink}>Пользовательского соглашения</Text>
            </Text>
          </TouchableOpacity>

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
  gradientTextContainer: {
    marginBottom: 30,
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
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
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
    marginBottom: 20,
    width: '100%',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D2691E',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#D2691E',
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  termsLink: {
    color: '#D2691E',
    textDecorationLine: 'underline',
  },
  registerButton: {
    width: '100%',
    marginBottom: 15,
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
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Semibold' : 'Poppins',
  },
  loginLink: {
    color: '#D2691E',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
});