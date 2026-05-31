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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Временная заглушка — после входа переходим в каталог
    navigation.replace('ClientTabs');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Sweet Paradise</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Логин"
              placeholderTextColor="#828282"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Пароль"
              placeholderTextColor="#828282"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <LinearGradient
              colors={['#FFBCD9', '#FFCBBB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.loginButtonText}>Войти</Text>
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

          <TouchableOpacity style={styles.googleButton}>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF147A',
    marginBottom: 50,
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
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  loginButton: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 15,
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Semibold' : 'Poppins',
  },
});