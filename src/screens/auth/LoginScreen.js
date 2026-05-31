// @ts-nocheck
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '276128636621-bkibjllkm0ie3mm5vagbv176fr3r8r2i.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({
      scheme: 'com.victoria007.SweetParadiseApp',
    }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${authentication.accessToken}` },
      })
        .then(res => res.json())
        .then(userInfo => {
          Alert.alert('Успех', `Добро пожаловать, ${userInfo.name}`);
          navigation.replace('ClientTabs');
        })
        .catch(err => {
          Alert.alert('Ошибка', 'Не удалось получить данные пользователя');
        });
    }
  }, [response]);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }
    setLoading(true);
    // Здесь добавишь проверку в Firebase
    setTimeout(() => {
      setLoading(false);
      navigation.replace('ClientTabs');
    }, 1000);
  };

  const handleGoogleLogin = () => {
    promptAsync();
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
              placeholder="Email"
              placeholderTextColor="#828282"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Пароль"
                placeholderTextColor="#828282"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
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
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FFBCD9', '#FFCBBB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Вход...' : 'Войти'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Зарегистрироваться</Text>
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          <Text style={styles.agreeText}>
            Нажимая продолжить, вы соглашаетесь с политикой конфиденциальности
          </Text>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={!request}
          >
            <LinearGradient
              colors={['#FFBCD9', '#FFCBBB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </LinearGradient>
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
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 40,
    marginBottom: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
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
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6E6E6',
    borderRadius: 12,
    paddingHorizontal: 15,
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
  loginButton: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 30,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Semibold' : 'Poppins',
  },
  registerLink: {
    color: '#FF147A',
    fontSize: 14,
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E6E6E6',
  },
  orText: {
    marginHorizontal: 10,
    color: '#828282',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  agreeText: {
    textAlign: 'center',
    color: '#828282',
    fontSize: 12,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  googleButton: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Semibold' : 'Poppins',
  },
});