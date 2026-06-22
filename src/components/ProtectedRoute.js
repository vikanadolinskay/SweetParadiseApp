import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteUserAccount } from '../../services/database';
import { showGradientAlert } from '../../components/GradientAlert';

export const useAuth = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // ===== ВЫХОД ИЗ АККАУНТА =====
  const logout = async (navigation, onAuthStateChange) => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setUser(null);
              
              if (onAuthStateChange) {
                await onAuthStateChange();
              }
              
              navigation.replace('Login');
            } catch (error) {
              console.error('Ошибка выхода:', error);
              showGradientAlert({ 
                title: 'Ошибка', 
                message: 'Не удалось выйти из аккаунта' 
              });
            }
          }
        }
      ]
    );
  };

  // ===== УДАЛЕНИЕ АККАУНТА =====
  const deleteAccount = async (navigation, onAuthStateChange) => {
    Alert.alert(
      'Удаление профиля',
      'Вы уверены, что хотите удалить профиль? Это действие необратимо.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const userStr = await AsyncStorage.getItem('user');
              if (userStr) {
                const user = JSON.parse(userStr);
                await deleteUserAccount(user.user_id);
              }
              
              await AsyncStorage.clear();
              setUser(null);
              
              if (onAuthStateChange) {
                await onAuthStateChange();
              }
              
              navigation.replace('Login');
              
              showGradientAlert({ 
                title: 'Успешно', 
                message: 'Аккаунт удалён' 
              });
            } catch (error) {
              console.error('Ошибка удаления аккаунта:', error);
              showGradientAlert({ 
                title: 'Ошибка', 
                message: 'Не удалось удалить аккаунт' 
              });
            }
          }
        }
      ]
    );
  };

  return { user, loading, isAdmin: user?.role === 'admin', logout, deleteAccount };
};

// Компонент для защиты админ-экранов
export const AdminOnly = ({ children, navigation }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || user.role !== 'admin') {
    return (
      <View style={styles.deniedContainer}>
        <Text style={styles.deniedText}>⛔ Доступ запрещён</Text>
        <Text style={styles.deniedSubtext}>Только для администраторов</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  deniedText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF147A',
    marginBottom: 10,
    fontFamily: 'Poppins-Bold',
  },
  deniedSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  backButton: {
    backgroundColor: '#FF147A',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});