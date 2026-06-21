import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, View, ActivityIndicator, Text } from 'react-native';
import AppNavigator from './src/navigation';
import GradientToast from './src/components/GradientToast';
import GradientAlertProvider from './src/components/GradientAlert';
import GradientConfirmProvider from './src/components/GradientConfirm';
import { initDatabase, syncOfflineOrders, getOfflineOrdersCount } from './src/services/database';
import { showGradientAlert } from './src/components/GradientAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [navKey, setNavKey] = useState(0);

  useEffect(() => {
    const setup = async () => {
      try {
        console.log('Инициализация базы данных...');
        await initDatabase();
        console.log('База данных готова');
        setDbReady(true);
        
        const user = await AsyncStorage.getItem('user');
        setIsLoggedIn(!!user);
        
        await checkAndSyncOfflineOrders();
      } catch (err) {
        console.error('Ошибка при инициализации БД:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    setup();
  }, []);

  const updateAuthState = async () => {
    const user = await AsyncStorage.getItem('user');
    setIsLoggedIn(!!user);
    setNavKey(prev => prev + 1);
  };

  const checkAndSyncOfflineOrders = async () => {
    try {
      const count = await getOfflineOrdersCount();
      if (count > 0) {
        console.log(`[APP] Найдено ${count} офлайн-заказов для синхронизации`);
        setIsSyncing(true);
        
        const result = await syncOfflineOrders();
        setIsSyncing(false);
        
        if (result.success && result.synced > 0) {
          showGradientAlert({
            title: 'Синхронизация выполнена',
            message: `Успешно синхронизировано ${result.synced} заказов из ${result.total}`
          });
        } else if (result.success && result.synced === 0 && result.total > 0) {
          console.log('[APP] Офлайн-заказы ожидают подключения к интернету');
        }
      }
    } catch (error) {
      console.error('[APP] Ошибка синхронизации офлайн-заказов:', error);
    }
  };

  window.showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  if (isLoading || !dbReady) {
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
          {isSyncing && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: '#FF9800',
              paddingVertical: 4,
              zIndex: 999,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}>
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 12 }}>Синхронизация заказов...</Text>
            </View>
          )}
          <AppNavigator key={navKey} isLoggedIn={isLoggedIn} onAuthStateChange={updateAuthState} />
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