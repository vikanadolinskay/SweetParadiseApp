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
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { getUserById, updateUserProfile, deleteUserAccount, executeQuery, getOfflineOrdersCount } from '../../services/database';
import { showGradientAlert } from '../../components/GradientAlert';
import QRCode from 'react-native-qrcode-svg';

export default function ProfileScreen({ navigation, onAuthStateChange }) {
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
  
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [personalDiscount, setPersonalDiscount] = useState(0);
  const [pointsToSpend, setPointsToSpend] = useState(0);
  const [offlineOrdersCount, setOfflineOrdersCount] = useState(0);
  
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState('г. Таганрог, ул. Петровская 711');
  
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState('orders');
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminPromotions, setAdminPromotions] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', category: 'cakes',
    is_available: 1, is_customizable: 0, discount: 0
  });
  
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoForm, setPromoForm] = useState({
    name: '', type: 'discount_percent', value: '', product_id: null,
    start_date: '', end_date: '', is_active: 1
  });

  const pickupAddresses = [
    'г. Таганрог, ул. Петровская 711',
    'г. Таганрог, ул. Чехова 22',
    'г. Таганрог, пер. Итальянский 5',
  ];

  const STATUS_RU = {
    pending: 'Оформлен',
    paid: 'Оплачен',
    preparing: 'В производстве',
    ready: 'Готов к выдаче',
    completed: 'Выполнен',
    cancelled: 'Отменён'
  };

  // Форсированное обновление для проверки авторизации
  const [logoutTrigger, setLogoutTrigger] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  // Проверка авторизации при каждом изменении logoutTrigger
  useEffect(() => {
    const checkAuth = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        setTimeout(() => {
          navigation.replace('Login');
        }, 100);
      }
    };
    checkAuth();
  }, [logoutTrigger]);

  useEffect(() => {
    if (showAdminPanel && user?.role === 'admin') {
      loadAdminData();
    }
  }, [showAdminPanel, adminTab]);

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
        
        const savedAvatar = await AsyncStorage.getItem(`avatar_${fullUser?.user_id}`);
        if (savedAvatar) {
          setAvatar(savedAvatar);
        }
        
        await loadOfflineOrdersCount();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineOrdersCount = async () => {
    try {
      const count = await getOfflineOrdersCount();
      setOfflineOrdersCount(count);
    } catch (error) {
      console.error('Error loading offline orders count:', error);
    }
  };

  const loadAdminData = async () => {
    setAdminLoading(true);
    try {
      if (adminTab === 'orders') {
        const orders = await executeQuery(`
          SELECT o.*, u.full_name, u.email 
          FROM orders o
          JOIN users u ON o.user_id = u.user_id
          ORDER BY o.created_at DESC
        `);
        setAdminOrders(orders);
      } else if (adminTab === 'products') {
        const products = await executeQuery('SELECT * FROM products ORDER BY product_id DESC');
        setAdminProducts(products);
      } else if (adminTab === 'users') {
        const users = await executeQuery('SELECT user_id, email, full_name, phone, role, loyalty_points, personal_discount, created_at FROM users ORDER BY user_id DESC');
        setAdminUsers(users);
      } else if (adminTab === 'promotions') {
        const promotions = await executeQuery('SELECT * FROM promotions ORDER BY promotion_id DESC');
        setAdminPromotions(promotions);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setAdminLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    await executeQuery(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
      [newStatus, orderId]
    );
    await executeQuery(
      `INSERT INTO order_history (order_id, action, description, created_at)
       VALUES (?, 'status_changed', ?, CURRENT_TIMESTAMP)`,
      [orderId, `Статус изменён на ${STATUS_RU[newStatus]}`]
    );
    loadAdminData();
    showGradientAlert({ title: 'Успешно', message: 'Статус обновлён' });
  };

  const saveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      showGradientAlert({ title: 'Ошибка', message: 'Заполните название и цену' });
      return;
    }

    if (editingProduct) {
      await executeQuery(
        `UPDATE products SET name=?, description=?, price=?, category=?, 
         is_available=?, is_customizable=?, discount=? WHERE product_id=?`,
        [productForm.name, productForm.description, productForm.price, productForm.category,
         productForm.is_available, productForm.is_customizable, productForm.discount, editingProduct.product_id]
      );
      showGradientAlert({ title: 'Успешно', message: 'Товар обновлён' });
    } else {
      await executeQuery(
        `INSERT INTO products (name, description, price, category, is_available, is_customizable, discount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [productForm.name, productForm.description, productForm.price, productForm.category,
         productForm.is_available, productForm.is_customizable, productForm.discount]
      );
      showGradientAlert({ title: 'Успешно', message: 'Товар добавлен' });
    }
    setProductModalVisible(false);
    setEditingProduct(null);
    setProductForm({ name: '', description: '', price: '', category: 'cakes', is_available: 1, is_customizable: 0, discount: 0 });
    loadAdminData();
  };

  const deleteProduct = async (productId) => {
    Alert.alert('Удаление', 'Удалить товар?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Да', onPress: async () => {
        await executeQuery('DELETE FROM products WHERE product_id = ?', [productId]);
        loadAdminData();
        showGradientAlert({ title: 'Успешно', message: 'Товар удалён' });
      }}
    ]);
  };

  const savePromotion = async () => {
    if (!promoForm.name || !promoForm.value || !promoForm.start_date || !promoForm.end_date) {
      showGradientAlert({ title: 'Ошибка', message: 'Заполните обязательные поля' });
      return;
    }

    if (editingPromo) {
      await executeQuery(
        `UPDATE promotions SET name=?, type=?, value=?, product_id=?, start_date=?, end_date=?, is_active=?
         WHERE promotion_id=?`,
        [promoForm.name, promoForm.type, promoForm.value, promoForm.product_id || null,
         promoForm.start_date, promoForm.end_date, promoForm.is_active, editingPromo.promotion_id]
      );
      showGradientAlert({ title: 'Успешно', message: 'Акция обновлена' });
    } else {
      await executeQuery(
        `INSERT INTO promotions (name, type, value, product_id, start_date, end_date, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [promoForm.name, promoForm.type, promoForm.value, promoForm.product_id || null,
         promoForm.start_date, promoForm.end_date, promoForm.is_active]
      );
      showGradientAlert({ title: 'Успешно', message: 'Акция добавлена' });
    }
    setPromoModalVisible(false);
    setEditingPromo(null);
    setPromoForm({ name: '', type: 'discount_percent', value: '', product_id: null, start_date: '', end_date: '', is_active: 1 });
    loadAdminData();
  };

  const deletePromotion = async (promotionId) => {
    Alert.alert('Удаление', 'Удалить акцию?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Да', onPress: async () => {
        await executeQuery('DELETE FROM promotions WHERE promotion_id = ?', [promotionId]);
        loadAdminData();
        showGradientAlert({ title: 'Успешно', message: 'Акция удалена' });
      }}
    ]);
  };

  const updateUserRole = async (userId, newRole) => {
    await executeQuery('UPDATE users SET role = ? WHERE user_id = ?', [newRole, userId]);
    loadAdminData();
    showGradientAlert({ title: 'Успешно', message: 'Роль обновлена' });
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

  // ============================================================
  // 100% РАБОЧЕЕ УДАЛЕНИЕ ПРОФИЛЯ
  // ============================================================
  const handleDeleteProfile = () => {
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
              if (user?.user_id) {
                await deleteUserAccount(user.user_id);
              }
              await AsyncStorage.clear();
              
              // Обновляем состояние
              if (onAuthStateChange) {
                await onAuthStateChange();
              }
              setLogoutTrigger(prev => prev + 1);
              
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
              setTimeout(() => {
                navigation.replace('Login');
              }, 200);
            } catch (error) {
              navigation.replace('Login');
            }
          }
        }
      ]
    );
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

  // ============================================================
  // 100% РАБОЧИЙ ВЫХОД
  // ============================================================
  const handleLogout = () => {
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
              
              // Обновляем состояние в App.js
              if (onAuthStateChange) {
                await onAuthStateChange();
              }
              
              // Триггерим проверку авторизации
              setLogoutTrigger(prev => prev + 1);
              
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
              setTimeout(() => {
                navigation.replace('Login');
              }, 200);
            } catch (error) {
              navigation.replace('Login');
            }
          }
        }
      ]
    );
  };

  const handleSpendPoints = () => {
    if (loyaltyPoints === 0) {
      showGradientAlert({ title: 'Ошибка', message: 'У вас 0 баллов. Списание невозможно' });
      return;
    }
    if (pointsToSpend <= 0) {
      showGradientAlert({ title: 'Ошибка', message: 'Введите количество баллов для списания' });
      return;
    }
    if (pointsToSpend > loyaltyPoints) {
      showGradientAlert({ title: 'Ошибка', message: 'Недостаточно баллов' });
      return;
    }
    
    Alert.alert(
      'Списание баллов',
      `Списать ${pointsToSpend} баллов?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Списать',
          onPress: async () => {
            const newPoints = loyaltyPoints - pointsToSpend;
            setLoyaltyPoints(newPoints);
            await executeQuery('UPDATE users SET loyalty_points = ? WHERE user_id = ?', [newPoints, user.user_id]);
            setPointsToSpend(0);
            showGradientAlert({ title: 'Успешно', message: `Списано ${pointsToSpend} баллов` });
          }
        }
      ]
    );
  };

  const getLoyaltyCardNumber = () => {
    if (!user) return '0000 0000 0000 0000';
    const id = user.user_id.toString().padStart(16, '0');
    return id.match(/.{1,4}/g).join(' ');
  };

  const getQRData = () => {
    if (!user) return '';
    return JSON.stringify({
      user_id: user.user_id,
      points: loyaltyPoints,
      discount: personalDiscount,
    });
  };

  const renderAdminPanel = () => {
    const tabs = [
      { id: 'orders', name: 'Заказы', icon: 'list-outline' },
      { id: 'products', name: 'Товары', icon: 'cube-outline' },
      { id: 'users', name: 'Клиенты', icon: 'people-outline' },
      { id: 'promotions', name: 'Акции', icon: 'pricetag-outline' },
    ];

    return (
      <View style={styles.adminPanel}>
        <View style={styles.adminHeader}>
          <Text style={styles.adminTitle}>Панель администратора</Text>
          <TouchableOpacity onPress={() => setShowAdminPanel(false)}>
            <Ionicons name="close" size={24} color="#FF147A" />
          </TouchableOpacity>
        </View>

        <View style={styles.adminTabs}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.adminTab, adminTab === tab.id && styles.adminTabActive]}
              onPress={() => setAdminTab(tab.id)}
            >
              <Ionicons name={tab.icon} size={20} color={adminTab === tab.id ? '#FF147A' : '#666'} />
              <Text style={[styles.adminTabText, adminTab === tab.id && styles.adminTabTextActive]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {adminLoading ? (
          <ActivityIndicator size="large" color="#FF147A" style={styles.adminLoader} />
        ) : (
          <ScrollView style={styles.adminContent}>
            {adminTab === 'orders' && renderOrdersTab()}
            {adminTab === 'products' && renderProductsTab()}
            {adminTab === 'users' && renderUsersTab()}
            {adminTab === 'promotions' && renderPromotionsTab()}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderOrdersTab = () => (
    <>
      <TouchableOpacity style={styles.adminRefreshBtn} onPress={loadAdminData}>
        <Text style={styles.adminRefreshText}>Обновить</Text>
      </TouchableOpacity>
      {adminOrders.map(order => (
        <View key={order.order_id} style={styles.adminOrderCard}>
          <View style={styles.adminOrderHeader}>
            <Text style={styles.adminOrderId}>Заказ #{order.order_id}</Text>
            <Text style={styles.adminOrderDate}>
              {new Date(order.created_at).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.adminOrderUser}>{order.full_name} ({order.email})</Text>
          <Text style={styles.adminOrderTotal}>{order.total_amount} руб.</Text>
          <View style={styles.adminOrderStatusRow}>
            <Text style={styles.adminOrderStatusLabel}>Статус:</Text>
            <View style={[styles.adminStatusBadge, getStatusStyle(order.status)]}>
              <Text style={styles.adminStatusText}>{STATUS_RU[order.status]}</Text>
            </View>
          </View>
          <View style={styles.adminStatusButtons}>
            {Object.keys(STATUS_RU).map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.adminStatusBtn, order.status === status && styles.adminStatusBtnActive]}
                onPress={() => updateOrderStatus(order.order_id, status)}
              >
                <Text style={[styles.adminStatusBtnText, order.status === status && styles.adminStatusBtnTextActive]}>
                  {STATUS_RU[status]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </>
  );

  const renderProductsTab = () => (
    <>
      <TouchableOpacity style={styles.adminAddBtn} onPress={() => {
        setEditingProduct(null);
        setProductForm({ name: '', description: '', price: '', category: 'cakes', is_available: 1, is_customizable: 0, discount: 0 });
        setProductModalVisible(true);
      }}>
        <LinearGradient colors={['#FFBCD9', '#FFCBBB']} style={styles.adminAddGradient}>
          <Text style={styles.adminAddBtnText}>+ Добавить товар</Text>
        </LinearGradient>
      </TouchableOpacity>

      {adminProducts.map(product => (
        <View key={product.product_id} style={styles.adminProductCard}>
          <View style={styles.adminProductInfo}>
            <Text style={styles.adminProductName}>{product.name}</Text>
            <Text style={styles.adminProductPrice}>{product.price} руб.</Text>
            <View style={styles.adminProductBadges}>
              <View style={[styles.adminBadge, product.is_available ? styles.adminActiveBadge : styles.adminInactiveBadge]}>
                <Text style={styles.adminBadgeText}>{product.is_available ? 'В наличии' : 'Нет'}</Text>
              </View>
              {product.is_customizable === 1 && (
                <View style={[styles.adminBadge, styles.adminCustomBadge]}>
                  <Text style={styles.adminBadgeText}>Настраиваемый</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.adminProductActions}>
            <TouchableOpacity onPress={() => {
              setEditingProduct(product);
              setProductForm({
                name: product.name, description: product.description || '',
                price: String(product.price), category: product.category,
                is_available: product.is_available, is_customizable: product.is_customizable,
                discount: product.discount
              });
              setProductModalVisible(true);
            }}>
              <Ionicons name="create-outline" size={22} color="#FF147A" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteProduct(product.product_id)}>
              <Ionicons name="trash-outline" size={22} color="#FF4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Modal visible={productModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingProduct ? 'Редактировать товар' : 'Новый товар'}</Text>
            <TextInput style={styles.input} placeholder="Название" value={productForm.name} onChangeText={t => setProductForm({...productForm, name: t})} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Описание" multiline value={productForm.description} onChangeText={t => setProductForm({...productForm, description: t})} />
            <TextInput style={styles.input} placeholder="Цена" keyboardType="numeric" value={String(productForm.price)} onChangeText={t => setProductForm({...productForm, price: t})} />
            <TextInput style={styles.input} placeholder="Скидка %" keyboardType="numeric" value={String(productForm.discount)} onChangeText={t => setProductForm({...productForm, discount: t})} />
            
            <Text style={styles.label}>Категория:</Text>
            <View style={styles.categoryRow}>
              {['cakes', 'pastries', 'desserts', 'cookies'].map(cat => (
                <TouchableOpacity key={cat} style={[styles.categoryBtn, productForm.category === cat && styles.categoryActive]} onPress={() => setProductForm({...productForm, category: cat})}>
                  <Text style={[styles.categoryText, productForm.category === cat && styles.categoryTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text>В наличии:</Text>
              <TouchableOpacity onPress={() => setProductForm({...productForm, is_available: productForm.is_available ? 0 : 1})}>
                <View style={[styles.switch, productForm.is_available && styles.switchActive]}>
                  <Text style={styles.switchText}>{productForm.is_available ? 'Да' : 'Нет'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.switchRow}>
              <Text>Персонализация:</Text>
              <TouchableOpacity onPress={() => setProductForm({...productForm, is_customizable: productForm.is_customizable ? 0 : 1})}>
                <View style={[styles.switch, productForm.is_customizable && styles.switchActive]}>
                  <Text style={styles.switchText}>{productForm.is_customizable ? 'Да' : 'Нет'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setProductModalVisible(false)}>
                <Text style={styles.cancelModalText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={saveProduct}>
                <Text style={styles.saveModalText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );

  const renderUsersTab = () => (
    <>
      <TouchableOpacity style={styles.adminRefreshBtn} onPress={loadAdminData}>
        <Text style={styles.adminRefreshText}>Обновить</Text>
      </TouchableOpacity>
      {adminUsers.map(u => (
        <View key={u.user_id} style={styles.adminUserCard}>
          <Text style={styles.adminUserName}>{u.full_name}</Text>
          <Text style={styles.adminUserEmail}>{u.email}</Text>
          <Text style={styles.adminUserPhone}>{u.phone || 'Телефон не указан'}</Text>
          <View style={styles.adminUserStats}>
            <Text style={styles.adminUserPoints}>Баллы: {u.loyalty_points}</Text>
            <Text style={styles.adminUserDiscount}>Скидка: {u.personal_discount}%</Text>
          </View>
          <View style={styles.adminUserRoleRow}>
            <Text style={styles.adminUserRoleLabel}>Роль:</Text>
            <View style={[styles.adminRoleBadge, u.role === 'admin' && styles.adminRoleAdmin]}>
              <Text style={styles.adminRoleText}>{u.role === 'admin' ? 'Администратор' : 'Клиент'}</Text>
            </View>
            {u.role !== 'admin' && (
              <TouchableOpacity style={styles.adminMakeAdminBtn} onPress={() => updateUserRole(u.user_id, 'admin')}>
                <Text style={styles.adminMakeAdminText}>Сделать админом</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </>
  );

  const renderPromotionsTab = () => (
    <>
      <TouchableOpacity style={styles.adminAddBtn} onPress={() => {
        setEditingPromo(null);
        setPromoForm({ name: '', type: 'discount_percent', value: '', product_id: null, start_date: '', end_date: '', is_active: 1 });
        setPromoModalVisible(true);
      }}>
        <LinearGradient colors={['#FFBCD9', '#FFCBBB']} style={styles.adminAddGradient}>
          <Text style={styles.adminAddBtnText}>+ Добавить акцию</Text>
        </LinearGradient>
      </TouchableOpacity>

      {adminPromotions.map(promo => (
        <View key={promo.promotion_id} style={styles.adminPromoCard}>
          <View style={styles.adminPromoHeader}>
            <Text style={styles.adminPromoName}>{promo.name}</Text>
            <TouchableOpacity onPress={() => deletePromotion(promo.promotion_id)}>
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>
          <Text style={styles.adminPromoInfo}>Тип: {promo.type}</Text>
          <Text style={styles.adminPromoInfo}>Значение: {promo.value}</Text>
          <Text style={styles.adminPromoInfo}>Действует: {promo.start_date} - {promo.end_date}</Text>
          <View style={[styles.adminPromoStatus, promo.is_active ? styles.adminPromoActive : styles.adminPromoInactive]}>
            <Text style={styles.adminPromoStatusText}>{promo.is_active ? 'Активна' : 'Неактивна'}</Text>
          </View>
        </View>
      ))}

      <Modal visible={promoModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingPromo ? 'Редактировать акцию' : 'Новая акция'}</Text>
            <TextInput style={styles.input} placeholder="Название акции" value={promoForm.name} onChangeText={t => setPromoForm({...promoForm, name: t})} />
            
            <Text style={styles.label}>Тип:</Text>
            <View style={styles.categoryRow}>
              {['discount_percent', 'discount_fixed', 'loyalty_multiplier'].map(type => (
                <TouchableOpacity key={type} style={[styles.categoryBtn, promoForm.type === type && styles.categoryActive]} onPress={() => setPromoForm({...promoForm, type: type})}>
                  <Text style={[styles.categoryText, promoForm.type === type && styles.categoryTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput style={styles.input} placeholder="Значение" keyboardType="numeric" value={String(promoForm.value)} onChangeText={t => setPromoForm({...promoForm, value: t})} />
            <TextInput style={styles.input} placeholder="ID товара (оставьте пустым для всех)" keyboardType="numeric" value={String(promoForm.product_id || '')} onChangeText={t => setPromoForm({...promoForm, product_id: t ? Number(t) : null})} />
            <TextInput style={styles.input} placeholder="Дата начала (ГГГГ-ММ-ДД)" value={promoForm.start_date} onChangeText={t => setPromoForm({...promoForm, start_date: t})} />
            <TextInput style={styles.input} placeholder="Дата окончания (ГГГГ-ММ-ДД)" value={promoForm.end_date} onChangeText={t => setPromoForm({...promoForm, end_date: t})} />
            
            <View style={styles.switchRow}>
              <Text>Активна:</Text>
              <TouchableOpacity onPress={() => setPromoForm({...promoForm, is_active: promoForm.is_active ? 0 : 1})}>
                <View style={[styles.switch, promoForm.is_active && styles.switchActive]}>
                  <Text style={styles.switchText}>{promoForm.is_active ? 'Да' : 'Нет'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setPromoModalVisible(false)}>
                <Text style={styles.cancelModalText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={savePromotion}>
                <Text style={styles.saveModalText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );

  const getStatusStyle = (status) => {
    const stylesMap = {
      pending: { backgroundColor: '#FFE4E1' },
      paid: { backgroundColor: '#E3F2FD' },
      preparing: { backgroundColor: '#FFF3E0' },
      ready: { backgroundColor: '#E8F5E9' },
      completed: { backgroundColor: '#E0F2F1' },
      cancelled: { backgroundColor: '#FFEBEE' },
    };
    return stylesMap[status] || {};
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
        <Text style={styles.headerTitle}>Профиль</Text>
        {user?.role === 'admin' && (
          <TouchableOpacity onPress={() => setShowAdminPanel(true)} style={styles.adminIcon}>
            <Ionicons name="shield-checkmark" size={24} color="#FF147A" />
          </TouchableOpacity>
        )}
        {user?.role !== 'admin' && <View style={styles.placeholder} />}
      </View>

      {showAdminPanel ? renderAdminPanel() : (
        <ScrollView showsVerticalScrollIndicator={false}>
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
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user?.role === 'admin' ? 'Администратор' : 'Клиент'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowPickupModal(true)}>
              <Text style={styles.userAddress}>{selectedPickup}</Text>
            </TouchableOpacity>
            
            {offlineOrdersCount > 0 && (
              <TouchableOpacity 
                style={styles.offlineBadge}
                onPress={() => {
                  showGradientAlert({ 
                    title: 'Офлайн-заказы', 
                    message: `У вас ${offlineOrdersCount} заказ(ов), ожидающих отправки. Они будут отправлены при подключении к интернету.` 
                  });
                }}
              >
                <Ionicons name="cloud-outline" size={16} color="#FF9800" />
                <Text style={styles.offlineBadgeText}>
                  {offlineOrdersCount} заказ(ов) ожидают отправки
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            {isEditing ? (
              <>
                <View style={styles.editField}>
                  <Text style={styles.fieldLabel}>ФИО</Text>
                  <TextInput style={styles.input} value={editForm.full_name} onChangeText={(text) => setEditForm({ ...editForm, full_name: text })} placeholder="Введите ФИО" />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.fieldLabel}>Номер телефона</Text>
                  <TextInput style={styles.input} value={editForm.phone} onChangeText={(text) => setEditForm({ ...editForm, phone: text })} placeholder="+7 (999) 000-00-00" keyboardType="phone-pad" />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.fieldLabel}>Электронная почта</Text>
                  <TextInput style={styles.input} value={editForm.email} onChangeText={(text) => setEditForm({ ...editForm, email: text })} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
                </View>
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}><Text style={styles.saveBtnText}>Сохранить</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}><Text style={styles.cancelBtnText}>Отмена</Text></TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>ФИО</Text><Text style={styles.infoValue}>{user?.full_name}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Номер телефона</Text><Text style={styles.infoValue}>{user?.phone || 'Не указан'}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Электронная почта</Text><Text style={styles.infoValue}>{user?.email}</Text></View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.editProfileBtn} onPress={handleEditProfile}><Text style={styles.editProfileBtnText}>Редактировать</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.deleteProfileBtn} onPress={handleDeleteProfile}><Text style={styles.deleteProfileBtnText}>Удалить профиль</Text></TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <View style={styles.loyaltyCard}>
            <LinearGradient colors={['#FFBCD9', '#FFCBBB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.loyaltyGradient}>
              <Text style={styles.loyaltyTitle}>Карта лояльности</Text>
              <View style={styles.qrContainer}>
                <QRCode value={getQRData()} size={100} backgroundColor="#fff" color="#FF147A" />
              </View>
              <Text style={styles.cardNumberText}>{getLoyaltyCardNumber()}</Text>
              <View style={styles.pointsRow}>
                <View style={styles.pointsInfo}>
                  <Text style={styles.pointsLabel}>Баллы</Text>
                  <Text style={styles.pointsValue}>{loyaltyPoints}</Text>
                </View>
                <View style={styles.spendPoints}>
                  <TextInput style={styles.spendInput} placeholder="Списать баллы" placeholderTextColor="#999" keyboardType="numeric" value={pointsToSpend.toString()} onChangeText={(text) => setPointsToSpend(Number(text) || 0)} />
                  <TouchableOpacity style={styles.spendBtn} onPress={handleSpendPoints}><Text style={styles.spendBtnText}>Списать</Text></TouchableOpacity>
                </View>
              </View>
              <Text style={styles.discountText}>Скидка: {personalDiscount}%</Text>
            </LinearGradient>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Выход</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal transparent={true} visible={showPickupModal} animationType="fade" onRequestClose={() => setShowPickupModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPickupModal(false)}>
          <View style={styles.pickupModal}>
            <Text style={styles.pickupModalTitle}>Выберите точку самовывоза</Text>
            {pickupAddresses.map((address) => (
              <TouchableOpacity key={address} style={[styles.pickupOption, selectedPickup === address && styles.pickupOptionActive]} onPress={() => { setSelectedPickup(address); setShowPickupModal(false); }}>
                <Text style={[styles.pickupOptionText, selectedPickup === address && styles.pickupOptionTextActive]}>{address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal transparent={true} visible={showAvatarMenu} animationType="fade" onRequestClose={() => setShowAvatarMenu(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAvatarMenu(false)}>
          <View style={styles.avatarMenu}>
            <TouchableOpacity style={styles.avatarMenuItem} onPress={takePhoto}><Ionicons name="camera" size={24} color="#FF147A" /><Text style={styles.avatarMenuText}>Сделать фото</Text></TouchableOpacity>
            <TouchableOpacity style={styles.avatarMenuItem} onPress={pickImage}><Ionicons name="images" size={24} color="#FF147A" /><Text style={styles.avatarMenuText}>Загрузить фото</Text></TouchableOpacity>
            {avatar && <TouchableOpacity style={styles.avatarMenuItem} onPress={deleteAvatar}><Ionicons name="trash" size={24} color="#FF147A" /><Text style={styles.avatarMenuText}>Удалить фото</Text></TouchableOpacity>}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { backgroundColor: '#FFFFFF', paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FF147A', fontFamily: 'Poppins-SemiBold', textAlign: 'center' },
  placeholder: { width: 32 },
  adminIcon: { padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarContainer: { alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0F0F0' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  avatarEditIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF147A', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 18, fontWeight: '600', color: '#2C2C2C', marginTop: 12, textAlign: 'center', fontFamily: 'Poppins-SemiBold' },
  roleBadge: { backgroundColor: '#FFE4E1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  roleText: { fontSize: 12, color: '#FF147A', fontWeight: '500' },
  userAddress: { fontSize: 14, color: '#FF147A', marginTop: 4, textAlign: 'center', fontFamily: 'Poppins-Regular' },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  offlineBadgeText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 8,
    fontFamily: 'Poppins-Medium',
  },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#FF147A', marginBottom: 12, fontFamily: 'Poppins-SemiBold' },
  infoRow: { flexDirection: 'row', marginBottom: 12 },
  infoLabel: { width: 120, fontSize: 14, color: '#999', fontFamily: 'Poppins-Regular' },
  infoValue: { flex: 1, fontSize: 14, color: '#2C2C2C', fontFamily: 'Poppins-Regular' },
  editField: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, color: '#999', marginBottom: 4, fontFamily: 'Poppins-Regular' },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 14, color: '#2C2C2C', fontFamily: 'Poppins-Regular' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  editButtons: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 16 },
  saveBtn: { flex: 1, backgroundColor: '#FF147A', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  cancelBtn: { flex: 1, backgroundColor: '#F0F0F0', padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: '600', fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  actionButtons: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8 },
  editProfileBtn: { flex: 1, backgroundColor: '#FF147A', padding: 12, borderRadius: 8, alignItems: 'center' },
  editProfileBtnText: { color: '#fff', fontWeight: '600', fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  deleteProfileBtn: { flex: 1, backgroundColor: 'transparent', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FF147A' },
  deleteProfileBtnText: { color: '#FF147A', fontWeight: '600', fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  loyaltyCard: { paddingHorizontal: 16, marginVertical: 16 },
  loyaltyGradient: { borderRadius: 16, padding: 20 },
  loyaltyTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 16, fontFamily: 'Poppins-Bold' },
  qrContainer: { alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', padding: 10, borderRadius: 12, alignSelf: 'center' },
  cardNumberText: { fontSize: 14, color: '#fff', textAlign: 'center', letterSpacing: 1, marginBottom: 16, fontFamily: 'Poppins-Regular' },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pointsInfo: { alignItems: 'center' },
  pointsLabel: { fontSize: 12, color: '#fff', opacity: 0.8, fontFamily: 'Poppins-Regular' },
  pointsValue: { fontSize: 24, fontWeight: 'bold', color: '#fff', fontFamily: 'Poppins-Bold' },
  spendPoints: { flexDirection: 'row', alignItems: 'center' },
  spendInput: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8, padding: 8, width: 100, color: '#fff', fontSize: 14, textAlign: 'center', fontFamily: 'Poppins-Regular' },
  spendBtn: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  spendBtnText: { color: '#FF147A', fontWeight: '600', fontSize: 12, fontFamily: 'Poppins-SemiBold' },
  discountText: { fontSize: 14, color: '#fff', textAlign: 'center', fontFamily: 'Poppins-Regular' },
  logoutBtn: { marginHorizontal: 16, marginVertical: 20, backgroundColor: '#FF147A', padding: 14, borderRadius: 12, alignItems: 'center' },
  logoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', fontFamily: 'Poppins-SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pickupModal: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%' },
  pickupModalTitle: { fontSize: 18, fontWeight: '600', color: '#FF147A', textAlign: 'center', marginBottom: 16, fontFamily: 'Poppins-SemiBold' },
  pickupOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginBottom: 8, backgroundColor: '#F5F5F5', alignItems: 'center' },
  pickupOptionActive: { backgroundColor: '#FF147A' },
  pickupOptionText: { fontSize: 14, color: '#333', fontFamily: 'Poppins-Regular' },
  pickupOptionTextActive: { color: '#fff' },
  avatarMenu: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '80%' },
  avatarMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  avatarMenuText: { fontSize: 16, color: '#2C2C2C', marginLeft: 12, fontFamily: 'Poppins-Regular' },
  
  adminPanel: { flex: 1, backgroundColor: '#F8F8F8' },
  adminHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  adminTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF147A' },
  adminTabs: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  adminTab: { flex: 1, alignItems: 'center', paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  adminTabActive: { borderBottomWidth: 2, borderBottomColor: '#FF147A' },
  adminTabText: { fontSize: 12, color: '#666' },
  adminTabTextActive: { color: '#FF147A', fontWeight: '600' },
  adminLoader: { marginTop: 50 },
  adminContent: { flex: 1, padding: 12 },
  adminRefreshBtn: { backgroundColor: '#F0F0F0', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  adminRefreshText: { fontSize: 14, color: '#666' },
  adminAddBtn: { marginBottom: 12, borderRadius: 8, overflow: 'hidden' },
  adminAddGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  adminAddBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  adminOrderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  adminOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  adminOrderId: { fontSize: 14, fontWeight: '600', color: '#333' },
  adminOrderDate: { fontSize: 12, color: '#999' },
  adminOrderUser: { fontSize: 12, color: '#666', marginBottom: 4 },
  adminOrderTotal: { fontSize: 16, fontWeight: 'bold', color: '#FF147A', marginBottom: 8 },
  adminOrderStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  adminOrderStatusLabel: { fontSize: 12, color: '#666', marginRight: 8 },
  adminStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  adminStatusText: { fontSize: 11, fontWeight: '500', color: '#666' },
  adminStatusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  adminStatusBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F0F0F0' },
  adminStatusBtnActive: { backgroundColor: '#FF147A' },
  adminStatusBtnText: { fontSize: 10, color: '#666' },
  adminStatusBtnTextActive: { color: '#fff' },
  adminProductCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 },
  adminProductInfo: { flex: 1 },
  adminProductName: { fontSize: 14, fontWeight: '500', color: '#333' },
  adminProductPrice: { fontSize: 13, color: '#FF147A', marginTop: 4 },
  adminProductBadges: { flexDirection: 'row', gap: 6, marginTop: 6 },
  adminBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  adminActiveBadge: { backgroundColor: '#E8F5E9' },
  adminInactiveBadge: { backgroundColor: '#FFEBEE' },
  adminCustomBadge: { backgroundColor: '#E3F2FD' },
  adminBadgeText: { fontSize: 9, color: '#666' },
  adminProductActions: { flexDirection: 'row', gap: 12 },
  adminUserCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
  adminUserName: { fontSize: 15, fontWeight: '600', color: '#333' },
  adminUserEmail: { fontSize: 12, color: '#666', marginTop: 2 },
  adminUserPhone: { fontSize: 12, color: '#999', marginTop: 2 },
  adminUserStats: { flexDirection: 'row', gap: 16, marginTop: 8 },
  adminUserPoints: { fontSize: 12, color: '#FF147A' },
  adminUserDiscount: { fontSize: 12, color: '#FF9800' },
  adminUserRoleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  adminUserRoleLabel: { fontSize: 12, color: '#666' },
  adminRoleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: '#F0F0F0' },
  adminRoleAdmin: { backgroundColor: '#FFE4E1' },
  adminRoleText: { fontSize: 11, color: '#666' },
  adminMakeAdminBtn: { backgroundColor: '#FF147A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  adminMakeAdminText: { fontSize: 10, color: '#fff' },
  adminPromoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
  adminPromoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  adminPromoName: { fontSize: 14, fontWeight: '600', color: '#333' },
  adminPromoInfo: { fontSize: 12, color: '#666', marginBottom: 3 },
  adminPromoStatus: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  adminPromoActive: { backgroundColor: '#E8F5E9' },
  adminPromoInactive: { backgroundColor: '#FFEBEE' },
  adminPromoStatusText: { fontSize: 11, color: '#666' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5' },
  categoryActive: { backgroundColor: '#FF147A' },
  categoryText: { color: '#666' },
  categoryTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switch: { width: 50, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center' },
  switchActive: { backgroundColor: '#FF147A' },
  switchText: { fontSize: 12, color: '#666' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelModalBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center' },
  cancelModalText: { color: '#666' },
  saveModalBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#FF147A', alignItems: 'center' },
  saveModalText: { color: '#fff', fontWeight: '600' },
  modalContent: { backgroundColor: '#fff', margin: 20, borderRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FF147A', textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 8 },
});