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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { createUser, checkEmailExists } from '../../services/database';
import { showGradientAlert } from '../../components/GradientAlert';

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

  // Состояние для подсказок валидации
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    special: false,
  });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // ===== ФОРМАТИРОВАНИЕ ТЕЛЕФОНА: +7 (XXX) XXX-XX-XX =====
  const formatPhone = (text) => {
    let cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);
    
    let formatted = '';
    if (cleaned.length === 0) {
      formatted = '';
    } else if (cleaned.length <= 1) {
      formatted = '+' + cleaned;
    } else if (cleaned.length <= 4) {
      formatted = '+' + cleaned.slice(0, 1) + ' (' + cleaned.slice(1);
    } else if (cleaned.length <= 7) {
      formatted = '+' + cleaned.slice(0, 1) + ' (' + cleaned.slice(1, 4) + ') ' + cleaned.slice(4);
    } else if (cleaned.length <= 9) {
      formatted = '+' + cleaned.slice(0, 1) + ' (' + cleaned.slice(1, 4) + ') ' + cleaned.slice(4, 7) + '-' + cleaned.slice(7);
    } else {
      formatted = '+' + cleaned.slice(0, 1) + ' (' + cleaned.slice(1, 4) + ') ' + cleaned.slice(4, 7) + '-' + cleaned.slice(7, 9) + '-' + cleaned.slice(9, 11);
    }
    
    return formatted;
  };

  // ===== ФОРМАТИРОВАНИЕ EMAIL =====
  const formatEmail = (text) => {
    return text.replace(/\s/g, '').toLowerCase();
  };

  // ===== ВАЛИДАЦИЯ ПАРОЛЯ =====
  const validatePassword = (pass) => {
    const errors = {
      length: pass.length >= 6 && pass.length <= 15,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      digit: /[0-9]/.test(pass),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass),
    };
    setPasswordErrors(errors);
    return Object.values(errors).every(Boolean);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    validatePassword(text);
  };

  const getPasswordRequirementText = () => {
    const requirements = [
      { key: 'length', text: 'От 6 до 15 символов' },
      { key: 'uppercase', text: 'Заглавная латинская буква (A-Z)' },
      { key: 'lowercase', text: 'Строчная латинская буква (a-z)' },
      { key: 'digit', text: 'Цифра (0-9)' },
      { key: 'special', text: 'Спецсимвол (!@#$%^&* и др.)' },
    ];
    
    return requirements.map(req => ({
      ...req,
      passed: passwordErrors[req.key],
    }));
  };

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendCode = () => {
    if (!fullName || !phone || !email || !password || !confirmPassword) {
      showGradientAlert({ 
        title: 'Ошибка', 
        message: 'Заполните все поля' 
      });
      return;
    }

    if (!acceptedTerms) {
      showGradientAlert({ 
        title: 'Ошибка', 
        message: 'Примите условия Пользовательского соглашения' 
      });
      return;
    }

    if (password !== confirmPassword) {
      showGradientAlert({ 
        title: 'Ошибка', 
        message: 'Пароли не совпадают' 
      });
      return;
    }

    const isValid = validatePassword(password);
    if (!isValid) {
      showGradientAlert({ 
        title: 'Ошибка', 
        message: 'Пароль не соответствует требованиям безопасности' 
      });
      return;
    }

    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!emailRegex.test(email)) {
      showGradientAlert({ 
        title: 'Ошибка', 
        message: 'Введите корректный email (example@gmail.com)' 
      });
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 11) {
      showGradientAlert({ 
        title: 'Ошибка', 
        message: 'Введите полный номер телефона' 
      });
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
      showGradientAlert({ 
        title: 'Ошибка', 
        message: 'Неверный код подтверждения' 
      });
      return;
    }

    setModalVisible(false);
    setLoading(true);

    const emailExists = await checkEmailExists(tempUserData.email);
    if (emailExists) {
      showGradientAlert({ 
        title: 'Ошибка', 
        message: 'Пользователь с таким email уже существует' 
      });
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
      showGradientAlert({ 
        title: 'Успешно', 
        message: 'Регистрация прошла успешно!',
        onOk: () => navigation.navigate('Login')
      });
    } else {
      showGradientAlert({ 
        title: 'Ошибка', 
        message: result.error || 'Не удалось создать аккаунт' 
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <MaskedView
            style={styles.maskedView}
            maskElement={
              <Text style={styles.title}>Sweet Paradise</Text>
            }
          >
            <LinearGradient
              colors={['#FFBCD9', '#FFCBBB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientMask}
            />
          </MaskedView>

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
              placeholder="+7 (XXX) XXX-XX-XX"
              placeholderTextColor="#828282"
              value={phone}
              onChangeText={(text) => setPhone(formatPhone(text))}
              keyboardType="phone-pad"
              editable={!loading}
              maxLength={18}
            />
            
            <TextInput
              style={styles.input}
              placeholder="example@gmail.com"
              placeholderTextColor="#828282"
              value={email}
              onChangeText={(text) => setEmail(formatEmail(text))}
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
                onChangeText={handlePasswordChange}
                editable={!loading}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
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

            {(isPasswordFocused || password.length > 0) && (
              <View style={styles.passwordRequirements}>
                {getPasswordRequirementText().map((req, index) => (
                  <View key={index} style={styles.requirementRow}>
                    <Ionicons
                      name={req.passed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={req.passed ? '#4CAF50' : '#999'}
                    />
                    <Text style={[
                      styles.requirementText,
                      req.passed && styles.requirementPassed
                    ]}>
                      {req.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}

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

            {password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.errorText}>Пароли не совпадают</Text>
            )}
          </View>

          <TouchableOpacity 
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
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
              <LinearGradient
                colors={['#FFBCD9', '#FFCBBB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalGradientButton}
              >
                <Text style={styles.modalButtonText}>Подтвердить</Text>
              </LinearGradient>
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
            <TouchableOpacity 
              style={styles.termsCloseButton} 
              onPress={() => setTermsModalVisible(false)}
            >
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
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  maskedView: {
    marginBottom: 30,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
    color: '#000',
  },
  gradientMask: {
    width: '100%',
    height: 40,
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
  passwordRequirements: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  requirementPassed: {
    color: '#4CAF50',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
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
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#FF147A',
    borderColor: '#FF147A',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  termsLink: {
    color: '#FF147A',
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
    borderRadius: 30,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Semibold' : 'Poppins',
  },
  loginLink: {
    color: '#FF147A',
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
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF147A',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  modalCode: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FF147A',
    letterSpacing: 6,
    marginBottom: 15,
    textAlign: 'center',
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
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 10,
  },
  modalGradientButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 25,
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
    color: '#FF147A',
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
    backgroundColor: '#FF147A',
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