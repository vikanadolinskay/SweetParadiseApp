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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  
  const [modalVisible, setModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [tempUserData, setTempUserData] = useState(null);

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendCode = () => {
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

    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Ошибка', 'Введите корректный email');
      return;
    }

    setTempUserData({ fullName, phone, email, password });
    const code = generateCode();
    setGeneratedCode(code);
    setEnteredCode('');
    setModalVisible(true);
  };

  const handleConfirmCode = async () => {
    if (enteredCode !== generatedCode) {
      Alert.alert('Ошибка', 'Неверный код подтверждения');
      return;
    }

    setModalVisible(false);
    setLoading(true);

    const emailExists = await checkEmailExists(tempUserData.email);
    if (emailExists) {
      Alert.alert('Ошибка', 'Пользователь с таким email уже существует');
      setLoading(false);
      return;
    }

    const result = await createUser(
      tempUserData.email, 
      tempUserData.fullName, 
      tempUserData.phone, 
      tempUserData.password
    );
    setLoading(false);

    if (result.success) {
      Alert.alert('Успешно', 'Регистрация прошла успешно!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
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
          {/* Обычный розовый текст */}
          <Text style={styles.title}>Sweet Paradise</Text>

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

          <TouchableOpacity 
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              Я принимаю условия{' '}
              <Text style={styles.termsLink} onPress={() => setTermsModalVisible(true)}>
                Пользовательского соглашения
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleSendCode}
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
                <Text style={styles.registerButtonText}>Получить код</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
            <Text style={styles.loginLink}>Уже есть аккаунт? Войти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Подтверждение</Text>
            <Text style={styles.modalText}>Введите код подтверждения:</Text>
            <Text style={styles.modalCode}>{generatedCode}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Введите код"
              placeholderTextColor="#ccc"
              keyboardType="number-pad"
              value={enteredCode}
              onChangeText={setEnteredCode}
              maxLength={6}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleConfirmCode}>
              <Text style={styles.modalButtonText}>Подтвердить</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={termsModalVisible}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.termsModalContent}>
            <Text style={styles.termsModalTitle}>Пользовательское соглашение</Text>
            <ScrollView style={styles.termsScrollView}>
              <Text style={styles.termsModalText}>
                1. Общие положения{"\n\n"}
                1.1. Настоящее Пользовательское соглашение (далее — Соглашение) регулирует отношения между Sweet Paradise (далее — Компания) и пользователем мобильного приложения Sweet Paradise (далее — Пользователь).{"\n\n"}
                1.2. Регистрируясь в приложении, Пользователь подтверждает свое согласие с условиями настоящего Соглашения.{"\n\n"}
                2. Права и обязанности сторон{"\n\n"}
                2.1. Пользователь обязуется предоставлять достоверную информацию при регистрации.{"\n\n"}
                2.2. Пользователь имеет право заказывать кондитерские изделия в соответствии с каталогом приложения.{"\n\n"}
                2.3. Компания обязуется обрабатывать персональные данные Пользователя в соответствии с Федеральным законом № 152-ФЗ «О персональных данных».{"\n\n"}
                2.4. Компания имеет право изменять условия Соглашения в одностороннем порядке.{"\n\n"}
                3. Ответственность{"\n\n"}
                3.1. Компания не несет ответственности за задержки в доставке, связанные с действиями третьих лиц.{"\n\n"}
                4. Конфиденциальность{"\n\n"}
                4.1. Компания обязуется не передавать персональные данные Пользователя третьим лицам без его согласия.{"\n\n"}
                5. Заключительные положения{"\n\n"}
                5.1. Соглашение вступает в силу с момента регистрации Пользователя в приложении.{"\n\n"}
                5.2. Все споры решаются в соответствии с законодательством РФ.{"\n\n"}
                © Sweet Paradise, 2026
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.termsCloseButton} onPress={() => setTermsModalVisible(false)}>
              <Text style={styles.termsCloseButtonText}>Закрыть</Text>
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
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
    color: '#FFBCD9',
    marginBottom: 30,
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
    borderColor: '#FFBCD9',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFBCD9',
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
    color: '#FFBCD9',
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
    color: '#FFBCD9',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFBCD9',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  modalCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFBCD9',
    letterSpacing: 4,
    marginBottom: 15,
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#FFBCD9',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalClose: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
  termsModalContent: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  termsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFBCD9',
    textAlign: 'center',
    marginBottom: 15,
  },
  termsScrollView: {
    maxHeight: 400,
  },
  termsModalText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  termsCloseButton: {
    backgroundColor: '#FFBCD9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  termsCloseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});