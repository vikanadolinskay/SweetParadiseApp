// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = '@sweet_users';
let isInitialized = false;

export const initDatabase = async () => {
  if (isInitialized) return true;
  
  try {
    const users = await AsyncStorage.getItem(USERS_KEY);
    if (!users) {
      const testUser = {
        id: 1,
        email: 'test@sweet.ru',
        password: '123456',
        full_name: 'Тестовый Пользователь',
        phone: '+79001234567',
        role: 'client',
        loyalty_points: 0,
        personal_discount: 0,
        created_at: new Date().toISOString()
      };
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify([testUser]));
      console.log('[DB] Тестовый пользователь создан');
    }
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('[DB] Ошибка:', error);
    return false;
  }
};

const getUsers = async () => {
  const users = await AsyncStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

const saveUsers = async (users) => {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getProducts = async () => {
  return [
    { product_id: 1, name: 'Торт "Наполеон"', price: 1500, description: 'Классический торт', category: 'cakes', image_url: null, is_available: 1, discount: 0 },
    { product_id: 2, name: 'Макаруны', price: 350, description: 'Французские макаруны', category: 'desserts', image_url: null, is_available: 1, discount: 0 },
    { product_id: 3, name: 'Капкейк', price: 250, description: 'Кекс с кремом', category: 'pastries', image_url: null, is_available: 1, discount: 0 },
    { product_id: 4, name: 'Чизкейк', price: 1800, description: 'Нью-Йорк чизкейк', category: 'cakes', image_url: null, is_available: 1, discount: 0 },
    { product_id: 5, name: 'Печенье', price: 200, description: 'Овсяное печенье', category: 'cookies', image_url: null, is_available: 1, discount: 0 },
    { product_id: 6, name: 'Эклер', price: 120, description: 'Заварное пирожное', category: 'pastries', image_url: null, is_available: 1, discount: 0 },
  ];
};

export const getProductById = async (productId) => {
  const products = await getProducts();
  return products.find(p => p.product_id === productId) || null;
};

export const getProductsByCategory = async (category) => {
  const products = await getProducts();
  return products.filter(p => p.category === category);
};

export const searchProducts = async (query) => {
  const products = await getProducts();
  return products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
};

export const getCartItems = async (userId) => {
  return [];
};

export const addToCart = async (userId, productId, quantity = 1, customization = null) => {
  return true;
};

export const removeFromCart = async (cartItemId) => {
  return true;
};

export const updateCartQuantity = async (cartItemId, quantity) => {
  return true;
};

export const clearCart = async (userId) => {
  return true;
};

export const checkEmailExists = async (email) => {
  const users = await getUsers();
  return users.some(u => u.email === email);
};

export const createUser = async (email, fullName, phone, password) => {
  console.log('[CREATE] Регистрация:', email);
  
  const users = await getUsers();
  const existing = users.find(u => u.email === email);
  if (existing) {
    return { success: false, error: 'Email уже существует' };
  }
  
  const newUser = {
    id: users.length + 1,
    email,
    full_name: fullName,
    phone,
    password: password,
    role: 'client',
    loyalty_points: 0,
    personal_discount: 0,
    created_at: new Date().toISOString()
  };
  
  users.push(newUser);
  await saveUsers(users);
  
  console.log('[CREATE] Пользователь создан, userId:', newUser.id);
  return { success: true, userId: newUser.id };
};

export const getUserByEmail = async (email) => {
  const users = await getUsers();
  return users.find(u => u.email === email) || null;
};

export const getUserById = async (userId) => {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const authenticateUser = async (email, password) => {
  console.log('[AUTH] Попытка входа:', email);
  
  const user = await getUserByEmail(email);
  if (!user) {
    console.log('[AUTH] Пользователь не найден:', email);
    return { success: false, error: 'Пользователь не найден' };
  }
  
  console.log('[AUTH] Пароль из БД:', user.password);
  console.log('[AUTH] Введённый пароль:', password);

  if (password !== user.password) {
    console.log('[AUTH] Неверный пароль:', email);
    return { success: false, error: 'Неверный пароль' };
  }

  console.log('[AUTH] Вход выполнен:', email);
  const { password, ...userWithoutPassword } = user;
  return { success: true, user: userWithoutPassword };
};

export const updateLoyaltyPoints = async (userId, points) => {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.loyalty_points += points;
    await saveUsers(users);
  }
};

export const getOrdersByUserId = async (userId) => {
  return [];
};

export const getOrderItems = async (orderId) => {
  return [];
};

export const createOrder = async (userId, totalAmount, pickupAddress, desiredPickupTime, paymentMethod, items) => {
  return 1;
};

export const updateOrderStatus = async (orderId, status) => {};

export const getPromotions = async () => {
  return [];
};

export const getPopularProducts = async (limit = 10) => {
  const products = await getProducts();
  return products.slice(0, limit);
};

export default {
  initDatabase,
  getProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  getCartItems,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  checkEmailExists,
  createUser,
  getUserByEmail,
  getUserById,
  authenticateUser,
  updateLoyaltyPoints,
  getOrdersByUserId,
  getOrderItems,
  createOrder,
  updateOrderStatus,
  getPromotions,
  getPopularProducts,
};