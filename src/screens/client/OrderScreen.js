import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrdersByUserId, executeQuery } from '../../services/database';
import { showGradientAlert, showGradientConfirm } from '../../components/GradientAlert';

export default function OrderScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  // Статусы, которые можно отменить
  const cancellableStatuses = ['pending', 'paid'];
  const activeStatuses = ['pending', 'paid', 'preparing', 'ready'];
  const completedStatuses = ['completed', 'cancelled'];

  useEffect(() => {
    loadOrders();
  }, []);

  // Загрузка заказов
  const loadOrders = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const userOrders = await getOrdersByUserId(user.user_id);
        setOrders(userOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showGradientAlert({ title: 'Ошибка', message: 'Не удалось загрузить заказы' });
    } finally {
      setLoading(false);
    }
  };

  // Функция для получения локального времени из UTC
  const getLocalDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    // Добавляем смещение часового пояса (+3 для Москвы)
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000 + 3 * 60 * 60 * 1000);
  };

  // Проверка, можно ли отменить заказ (исправлено с учётом часового пояса)
  const canCancelOrder = (order) => {
    if (order.status === 'cancelled' || order.status === 'completed') {
      return false;
    }
    
    if (order.status === 'preparing' || order.status === 'ready') {
      return false;
    }
    
    if (cancellableStatuses.includes(order.status)) {
      const createdAt = getLocalDate(order.created_at);
      const now = new Date();
      const minutesDiff = (now - createdAt) / (1000 * 60);
      
      return minutesDiff <= 15;
    }
    
    return false;
  };

  // Получение сообщения о причине невозможности отмены (исправлено)
  const getCancelReason = (order) => {
    if (order.status === 'cancelled') return 'Заказ уже отменён';
    if (order.status === 'completed') return 'Выполненный заказ нельзя отменить';
    if (order.status === 'preparing') return 'Заказ уже в производстве, отмена невозможна';
    if (order.status === 'ready') return 'Заказ готов к выдаче, отмена невозможна';
    
    if (order.status === 'pending' || order.status === 'paid') {
      const createdAt = getLocalDate(order.created_at);
      const now = new Date();
      const minutesDiff = (now - createdAt) / (1000 * 60);
      const remainingMinutes = Math.round(15 - minutesDiff);
      
      if (minutesDiff > 15) {
        return 'Истекло время отмены (15 минут). Заказ передан в обработку';
      }
      return `Отмена возможна в течение 15 минут. Осталось ${remainingMinutes} мин`;
    }
    
    return 'Отмена недоступна';
  };

  // Отмена заказа
  const cancelOrder = async (order) => {
    if (!canCancelOrder(order)) {
      const reason = getCancelReason(order);
      showGradientAlert({ 
        title: 'Отмена невозможна', 
        message: reason 
      });
      return;
    }

    const createdAt = getLocalDate(order.created_at);
    const now = new Date();
    const minutesLeft = 15 - ((now - createdAt) / (1000 * 60));
    
    showGradientConfirm({
      title: 'Отмена заказа',
      message: `Вы действительно хотите отменить заказ №${order.order_id}?\n\nВнимание: отмена возможна только в течение 15 минут с момента оформления. Осталось ${Math.round(minutesLeft)} минут.`,
      onConfirm: async () => {
        try {
          await executeQuery(
            `UPDATE orders 
             SET status = 'cancelled', 
                 updated_at = datetime('now') 
             WHERE order_id = ?`,
            [order.order_id]
          );
          
          await executeQuery(
            `INSERT INTO order_history (order_id, action, description, created_at)
             VALUES (?, 'status_changed', 'Заказ отменён пользователем', datetime('now'))`,
            [order.order_id]
          );
          
          showGradientAlert({ 
            title: 'Успешно', 
            message: `Заказ №${order.order_id} отменён`,
            onOk: () => {
              setModalVisible(false);
              loadOrders();
            }
          });
        } catch (error) {
          console.error('Cancel order error:', error);
          showGradientAlert({ 
            title: 'Ошибка', 
            message: 'Не удалось отменить заказ' 
          });
        }
      },
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Оформлен',
      'paid': 'Оплачен',
      'preparing': 'В производстве',
      'ready': 'Готов к выдаче',
      'completed': 'Выполнен',
      'cancelled': 'Отменён',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#FFA500',
      'paid': '#4CAF50',
      'preparing': '#2196F3',
      'ready': '#9C27B0',
      'completed': '#4CAF50',
      'cancelled': '#F44336',
    };
    return colorMap[status] || '#999';
  };

  // Функция форматирования даты с учётом часового пояса (исправлена)
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    // Добавляем +3 часа для московского времени
    const localDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    return localDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeOrders = orders.filter(order => activeStatuses.includes(order.status));
  const completedOrders = orders.filter(order => completedStatuses.includes(order.status));

  const renderOrderCard = ({ item }) => {
    const cancellable = canCancelOrder(item);
    const cancelReason = getCancelReason(item);
    
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          setSelectedOrder(item);
          setModalVisible(true);
        }}
        activeOpacity={0.95}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Заказ №{item.order_id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        <Text style={styles.orderTotal}>{Math.round(item.total_amount)} ₽</Text>
        <Text style={styles.orderItems}>Товаров: {item.items_count || 0}</Text>
        
        {/* Кнопка отмены для активных заказов */}
        {activeStatuses.includes(item.status) && (
          <TouchableOpacity
            style={[styles.cancelButton, !cancellable && styles.cancelButtonDisabled]}
            onPress={() => cancelOrder(item)}
            disabled={!cancellable}
          >
            <Text style={[styles.cancelButtonText, !cancellable && styles.cancelButtonTextDisabled]}>
              {cancellable ? 'Отменить заказ' : cancelReason}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderOrderDetail = () => {
    if (!selectedOrder) return null;
    
    const cancellable = canCancelOrder(selectedOrder);
    const cancelReason = getCancelReason(selectedOrder);

    const statusHistory = [
      { status: 'pending', label: 'Оформлен', time: selectedOrder.created_at },
      { status: 'paid', label: 'Оплачен', time: selectedOrder.paid_at },
      { status: 'preparing', label: 'В производстве', time: selectedOrder.preparing_at },
      { status: 'ready', label: 'Готов к выдаче', time: selectedOrder.ready_at },
      { status: 'completed', label: 'Выполнен', time: selectedOrder.completed_at },
    ];

    const currentStatusIndex = statusHistory.findIndex(s => s.status === selectedOrder.status);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Детали заказа</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#FF147A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalOrderNumber}>Заказ №{selectedOrder.order_id}</Text>
              
              <View style={styles.statusContainer}>
                <Text style={styles.statusTitle}>Статус заказа</Text>
                <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
                  <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedOrder.status) }]}>
                    {getStatusText(selectedOrder.status)}
                  </Text>
                </View>
              </View>

              {/* Кнопка отмены в модальном окне */}
              {activeStatuses.includes(selectedOrder.status) && (
                <TouchableOpacity
                  style={[styles.modalCancelButton, !cancellable && styles.modalCancelButtonDisabled]}
                  onPress={() => {
                    setModalVisible(false);
                    setTimeout(() => cancelOrder(selectedOrder), 300);
                  }}
                  disabled={!cancellable}
                >
                  <LinearGradient
                    colors={cancellable ? ['#FF6B6B', '#FF4444'] : ['#CCCCCC', '#BBBBBB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalCancelGradient}
                  >
                    <Text style={styles.modalCancelButtonText}>
                      {cancellable ? 'Отменить заказ' : cancelReason}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Информация</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Дата создания:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedOrder.created_at)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Время для отмены:</Text>
                  <Text style={styles.infoValue}>
                    {cancellable 
                      ? `Осталось ${Math.round(15 - ((new Date() - new Date(selectedOrder.created_at)) / (1000 * 60)))} мин`
                      : 'Отмена недоступна'}
                  </Text>
                </View>
                {selectedOrder.completed_at && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Дата выполнения:</Text>
                    <Text style={styles.infoValue}>{formatDate(selectedOrder.completed_at)}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Сумма заказа:</Text>
                  <Text style={styles.infoValue}>{Math.round(selectedOrder.total_amount)} ₽</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Способ оплаты:</Text>
                  <Text style={styles.infoValue}>{selectedOrder.payment_method === 'card' ? 'Картой онлайн' : 'Наличными'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Самовывоз:</Text>
                  <Text style={styles.infoValue}>{selectedOrder.pickup_address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Время получения:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedOrder.desired_pickup_time)}</Text>
                </View>
              </View>

              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Состав заказа</Text>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <Image 
                        source={item.image_source || { uri: item.image_url || 'https://via.placeholder.com/50x50?text=No+Image' }}
                        style={styles.orderItemImage}
                      />
                      <View style={styles.orderItemInfo}>
                        <Text style={styles.orderItemName}>{item.name}</Text>
                        <Text style={styles.orderItemQuantity}>Количество: {item.quantity}</Text>
                        {item.customization && (
                          <Text style={styles.orderItemCustom} numberOfLines={1}>
                            {typeof item.customization === 'string' 
                              ? item.customization 
                              : JSON.stringify(item.customization)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.orderItemPrice}>{Math.round(item.price_at_time * item.quantity)} ₽</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Нет товаров</Text>
                )}
              </View>

              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>История статусов</Text>
                {statusHistory.map((item, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  return (
                    <View key={item.status} style={styles.historyItem}>
                      <View style={styles.historyIcon}>
                        {isCompleted ? (
                          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        ) : (
                          <Ionicons name="ellipse-outline" size={20} color="#ccc" />
                        )}
                      </View>
                      <View style={styles.historyContent}>
                        <Text style={[styles.historyLabel, isCompleted && styles.historyLabelCompleted]}>
                          {item.label}
                        </Text>
                        {item.time && (
                          <Text style={styles.historyTime}>{formatDate(item.time)}</Text>
                        )}
                      </View>
                      {index < statusHistory.length - 1 && (
                        <View style={[styles.historyLine, isCompleted && styles.historyLineCompleted]} />
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <LinearGradient
                colors={['#FFBCD9', '#FFCBBB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeGradient}
              >
                <Text style={styles.closeButtonText}>Закрыть</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF147A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Мои заказы</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Активные ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Завершённые ({completedOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'active' ? activeOrders : completedOrders}
        keyExtractor={(item) => item.order_id.toString()}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Нет заказов</Text>
          </View>
        }
      />

      {renderOrderDetail()}
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
    paddingTop: 48,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#FF147A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    fontFamily: 'Poppins-SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  orderItems: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 13,
    color: '#F44336',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  cancelButtonTextDisabled: {
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    fontFamily: 'Poppins-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF147A',
    fontFamily: 'Poppins-SemiBold',
  },
  modalOrderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2C',
    textAlign: 'center',
    marginVertical: 16,
    fontFamily: 'Poppins-Bold',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  statusBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusTextLarge: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  modalCancelButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalCancelButtonDisabled: {
    opacity: 0.6,
  },
  modalCancelGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  infoSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF147A',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  infoValue: {
    fontSize: 13,
    color: '#2C2C2C',
    fontFamily: 'Poppins-Regular',
    flex: 1,
    textAlign: 'right',
  },
  itemsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  orderItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    fontFamily: 'Poppins-SemiBold',
  },
  orderItemQuantity: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  orderItemCustom: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    fontFamily: 'Poppins-SemiBold',
  },
  historySection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  historyIcon: {
    width: 30,
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyLabel: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  historyLabelCompleted: {
    color: '#2C2C2C',
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  historyLine: {
    position: 'absolute',
    left: 14,
    top: 25,
    width: 2,
    height: 25,
    backgroundColor: '#E0E0E0',
  },
  historyLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  closeButton: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  closeGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});