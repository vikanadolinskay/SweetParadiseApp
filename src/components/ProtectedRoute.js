import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuth = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUser = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  return { user, loading, isAdmin: user?.role === 'admin' };
};

// Компонент для защиты админ-экранов
export const AdminOnly = ({ children, navigation }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || user.role !== 'admin') {
    return (
      <View style={styles.deniedContainer}>
        <Text style={styles.deniedText}> Доступ запрещён</Text>
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
  },
  deniedText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF147A',
    marginBottom: 10,
  },
  deniedSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
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
  },
});