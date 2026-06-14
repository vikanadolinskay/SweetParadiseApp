import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, View, ActivityIndicator, Text } from 'react-native';
import AppNavigator from './src/navigation';
import GradientToast from './src/components/GradientToast';
import GradientAlertProvider from './src/components/GradientAlert';
import GradientConfirmProvider from './src/components/GradientConfirm';
import { initDatabase } from './src/services/database';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        console.log('Инициализация базы данных...');
        await initDatabase();
        console.log('База данных готова');
        setDbReady(true);
      } catch (err) {
        console.error('Ошибка при инициализации БД:', err);
        setError(err.message);
      }
    };

    setupDatabase();
  }, []);

  // Функция для показа тоста из любого места
  window.showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  if (!dbReady && !error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FF147A" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Text style={{ color: 'red', textAlign: 'center' }}>Ошибка БД: {error}</Text>
      </View>
    );
  }

  return (
    <GradientAlertProvider>
      <GradientConfirmProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <AppNavigator />
        </SafeAreaView>
        <GradientToast 
          visible={toastVisible} 
          message={toastMessage} 
          onHide={() => setToastVisible(false)} 
        />
      </GradientConfirmProvider>
    </GradientAlertProvider>
  );
}