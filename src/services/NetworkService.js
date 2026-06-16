import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createOrder } from './database';

let isConnected = true;

// Подписка на изменения сети
export const initNetworkMonitoring = () => {
  NetInfo.addEventListener(state => {
    const wasConnected = isConnected;
    isConnected = state.isConnected ?? false;
    
    // Если интернет появился — синхронизируем
    if (isConnected && !wasConnected) {
      syncPendingOrders();
    }
  });
};

// Проверка соединения
export const checkConnection = async () => {
  const state = await NetInfo.fetch();
  isConnected = state.isConnected ?? false;
  return isConnected;
};

// Сохранение заказа в офлайн-очередь
export const saveOrderOffline = async (orderData) => {
  try {
    const queue = await AsyncStorage.getItem('pending_orders');
    const pendingOrders = queue ? JSON.parse(queue) : [];
    pendingOrders.push({
      ...orderData,
      offlineId: Date.now(),
      createdAt: new Date().toISOString()
    });
    await AsyncStorage.setItem('pending_orders', JSON.stringify(pendingOrders));
    console.log('[OFFLINE] Заказ сохранён в очередь');
    return { success: true, offline: true };
  } catch (error) {
    console.error('[OFFLINE] Ошибка сохранения заказа:', error);
    return { success: false, error: error.message };
  }
};

// Получение всех отложенных заказов
export const getPendingOrders = async () => {
  const queue = await AsyncStorage.getItem('pending_orders');
  return queue ? JSON.parse(queue) : [];
};

// Удаление заказа из очереди
export const removePendingOrder = async (offlineId) => {
  const queue = await AsyncStorage.getItem('pending_orders');
  if (!queue) return;
  
  const pendingOrders = JSON.parse(queue);
  const filtered = pendingOrders.filter(order => order.offlineId !== offlineId);
  await AsyncStorage.setItem('pending_orders', JSON.stringify(filtered));
};

// Синхронизация отложенных заказов
export const syncPendingOrders = async () => {
  const pendingOrders = await getPendingOrders();
  if (pendingOrders.length === 0) return;
  
  console.log('[SYNC] Начинаем синхронизацию', pendingOrders.length, 'заказов');
  
  for (const order of pendingOrders) {
    try {
      const result = await createOrder(
        order.userId,
        order.total,
        order.address,
        order.dateTime,
        order.paymentMethod,
        order.items
      );
      
      if (result) {
        await removePendingOrder(order.offlineId);
        console.log('[SYNC] Заказ', order.offlineId, 'синхронизирован');
      }
    } catch (error) {
      console.error('[SYNC] Ошибка синхронизации заказа', order.offlineId, error);
    }
  }
};

// Получение статуса соединения
export const getConnectionStatus = () => isConnected;