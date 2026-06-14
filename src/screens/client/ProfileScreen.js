// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { getUserById, updateUserProfile } from '../../services/database';
import { showGradientAlert, showGradientConfirm } from '../../components/GradientAlert';
import QRCode from 'react-native-qrcode-svg';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    email: '',
  });
  
  // Данные для карты лояльности
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [personalDiscount, setPersonalDiscount] = useState(0);
  const [pointsToSpend, setPointsToSpend] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        const fullUser = await getUserById(userData.user_id);
        setUser(fullUser);
        setLoyaltyPoints(fullUser?.loyalty_points || 0);
        setPersonalDiscount(fullUser?.personal_discount || 0);
        setEditForm({
          full_name: fullUser?.full_name || '',
          phone: fullUser?.phone || '',
          email: fullUser?.email || '',
        });
        
        // Загружаем аватар
        const savedAvatar = await AsyncStorage.getItem(`avatar_${fullUser?.user_id}`);
        if (savedAvatar) {
          setAvatar(savedAvatar);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      await updateUserProfile(user.user_id, editForm);
      setUser({ ...user, ...editForm });
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const oldUser = JSON.parse(userStr);
        const updatedUser = { ...oldUser, ...editForm };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
      setIsEditing(false);
      showGradientAlert({ title: 'Успешно', message: 'Профиль обновлён' });
    } catch (error) {
      showGradientAlert({ title: 'Ошибка', message: 'Не удалось обновить профиль' });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      email: user?.email || '',
    });
  };

  const handleDeleteProfile = () => {
    showGradientConfirm({
      title: 'Удаление профиля',
      message: 'Вы уверены, что хотите удалить профиль? Это действие необратимо.',
      onConfirm: async () => {
        // Логика удаления профиля
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      },
    });
  };

  const handleAvatarPress = () => {
    setShowAvatarMenu(true);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showGradientAlert({ title: 'Ошибка', message: 'Нет доступа к камере' });
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
      await AsyncStorage.setItem(`avatar_${user?.user_id}`, result.assets[0].uri);
    }
    setShowAvatarMenu(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showGradientAlert({ title: 'Ошибка', message: 'Нет доступа к галерее' });
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
      await AsyncStorage.setItem(`avatar_${user?.user_id}`, result.assets[0].uri);
    }
    setShowAvatarMenu(false);
  };

  const deleteAvatar = () => {
    setAvatar(null);
    AsyncStorage.removeItem(`avatar_${user?.user_id}`);
    setShowAvatarMenu(false);
    showGradientAlert({ title: 'Успешно', message: 'Фото удалено' });
  };

  const handleLogout = () => {
    showGradientConfirm({
      title: 'Выход',
      message: 'Вы уверены, что хотите выйти из аккаунта?',
      onConfirm: async () => {
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      },
    });
  };

  const handleSpendPoints = () => {
    if (pointsToSpend <= 0) {
      showGradientAlert({ title: 'Ошибка', message: 'Введите количество баллов для списания' });
      return;
    }
    if (pointsToSpend > loyaltyPoints) {
      showGradientAlert({ title: 'Ошибка', message: 'Недостаточно баллов' });
      return;
    }
    
    showGradientConfirm({
      title: 'Списание баллов',
      message: `Списать ${pointsToSpend} баллов?`,
      onConfirm: async () => {
        const newPoints = loyaltyPoints - pointsToSpend;
        setLoyaltyPoints(newPoints);
        setPointsToSpend(0);
        // Здесь будет API для обновления баллов
        showGradientAlert({ title: 'Успешно', message: `Списано ${pointsToSpend} баллов` });
      },
    });
  };

  // Генерация номера карты лояльности на основе ID пользователя
  const getLoyaltyCardNumber = () => {
    if (!user) return '0000 0000 0000 0000';
    const id = user.user_id.toString().padStart(16, '0');
    return id.match(/.{1,4}/g).join(' ');
  };

  // Генерация данных для QR кода
  const getQRData = () => {
    if (!user) return '';
    return JSON.stringify({
      user_id: user.user_id,
      points: loyaltyPoints,
      discount: personalDiscount,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF147A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF147A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Профиль</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Аватар */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color="#999" />
              </View>
            )}
            <View style={styles.avatarEditIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.full_name}</Text>
          <Text style={styles.userAddress}>г. Таганрог, ул. Пушкинская, 111</Text>
        </View>

        {/* Информация о пользователе */}
        <View style={styles.section}>
          {isEditing ? (
            <>
              <View style={styles.editField}>
                <Text style={styles.fieldLabel}>ФИО</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.full_name}
                  onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
                  placeholder="Введите ФИО"
                />
              </View>
              <View style={styles.editField}>
                <Text style={styles.fieldLabel}>Номер телефона</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                  placeholder="+7 (999) 000-00-00"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.editField}>
                <Text style={styles.fieldLabel}>Электронная почта</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                  <Text style={styles.saveBtnText}>Сохранить</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                  <Text style={styles.cancelBtnText}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ФИО</Text>
                <Text style={styles.infoValue}>{user?.full_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Номер телефона</Text>
                <Text style={styles.infoValue}>{user?.phone || 'Не указан'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Электронная почта</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.editProfileBtn} onPress={handleEditProfile}>
                  <Text style={styles.editProfileBtnText}>Редактировать</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteProfileBtn} onPress={handleDeleteProfile}>
                  <Text style={styles.deleteProfileBtnText}>Удалить профиль</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Данные карты */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Данные карты</Text>
          <Text style={styles.cardNumber}>7 010 576 000 000</Text>
          <Text style={styles.cardLabel}>Номер карты</Text>
          <Text style={styles.cardValue}>7010576</Text>
        </View>

        {/* Карта лояльности */}
        <View style={styles.loyaltyCard}>
          <LinearGradient
            colors={['#FFBCD9', '#FFCBBB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loyaltyGradient}
          >
            <Text style={styles.loyaltyTitle}>Карта лояльности</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={getQRData()}
                size={100}
                backgroundColor="#fff"
                color="#FF147A"
              />
            </View>
            <Text style={styles.cardNumberText}>{getLoyaltyCardNumber()}</Text>
            <View style={styles.pointsRow}>
              <View style={styles.pointsInfo}>
                <Text style={styles.pointsLabel}>Баллы</Text>
                <Text style={styles.pointsValue}>{loyaltyPoints}</Text>
              </View>
              <View style={styles.spendPoints}>
                <TextInput
                  style={styles.spendInput}
                  placeholder="Списать баллы"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={pointsToSpend.toString()}
                  onChangeText={(text) => setPointsToSpend(Number(text) || 0)}
                />
                <TouchableOpacity style={styles.spendBtn} onPress={handleSpendPoints}>
                  <Text style={styles.spendBtnText}>Списать</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.discountText}>Скидка: {personalDiscount}%</Text>
          </LinearGradient>
        </View>

        {/* Кнопка выхода */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Выход</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Модальное окно выбора фото */}
      <Modal
        transparent={true}
        visible={showAvatarMenu}
        animationType="fade"
        onRequestClose={() => setShowAvatarMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAvatarMenu(false)}
        >
          <View style={styles.avatarMenu}>
            <TouchableOpacity style={styles.avatarMenuItem} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color="#FF147A" />
              <Text style={styles.avatarMenuText}>Сделать фото</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarMenuItem} onPress={pickImage}>
              <Ionicons name="images" size={24} color="#FF147A" />
              <Text style={styles.avatarMenuText}>Загрузить фото</Text>
            </TouchableOpacity>
            {avatar && (
              <TouchableOpacity style={styles.avatarMenuItem} onPress={deleteAvatar}>
                <Ionicons name="trash" size={24} color="#FF147A" />
                <Text style={styles.avatarMenuText}>Удалить фото</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF147A',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF147A',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  userAddress: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF147A',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    width: 120,
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#2C2C2C',
    fontFamily: 'Poppins-Regular',
  },
  editField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2C2C2C',
    fontFamily: 'Poppins-Regular',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#FF147A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editProfileBtn: {
    flex: 1,
    backgroundColor: '#FF147A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editProfileBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  deleteProfileBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF147A',
  },
  deleteProfileBtnText: {
    color: '#FF147A',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2C',
    fontFamily: 'Poppins-Bold',
  },
  cardLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
  cardValue: {
    fontSize: 16,
    color: '#2C2C2C',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  loyaltyCard: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  loyaltyGradient: {
    borderRadius: 16,
    padding: 20,
  },
  loyaltyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    alignSelf: 'center',
  },
  cardNumberText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
    fontFamily: 'Poppins-Regular',
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsInfo: {
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    fontFamily: 'Poppins-Regular',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  spendPoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spendInput: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    padding: 8,
    width: 100,
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  spendBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  spendBtnText: {
    color: '#FF147A',
    fontWeight: '600',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  discountText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginVertical: 20,
    backgroundColor: '#FF147A',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
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
  avatarMenu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '80%',
  },
  avatarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarMenuText: {
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 12,
    fontFamily: 'Poppins-Regular',
  },
});