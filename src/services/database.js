// @ts-nocheck
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as Crypto from 'expo-crypto';

const DB_NAME = 'sweet.db';

let db = null;

// Функция для хэширования пароля
const hashPassword = async (password) => {
  const salt = 'sweet_paradise_salt_2024';
  const saltedPassword = password + salt;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    saltedPassword
  );
  return hash;
};

// Функция для проверки пароля
export const verifyPassword = async (inputPassword, storedHash) => {
  const inputHash = await hashPassword(inputPassword);
  return inputHash === storedHash;
};

export const initDatabase = async () => {
  try {
    // Проверяем, существует ли уже БД в документе
    const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
    const dirPath = `${FileSystem.documentDirectory}SQLite`;
    
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
    
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    
    if (!fileInfo.exists) {
      console.log('Копирование базы данных...');
      
      // Загружаем ассет
      const asset = Asset.fromModule(require('../../assets/database/sweet.db'));
      await asset.downloadAsync();
      
      // Копируем
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: dbPath,
      });
      console.log('База данных скопирована');
    }

    // Открываем базу
    db = await SQLite.openDatabaseAsync(DB_NAME);
    console.log('База данных открыта');
    return db;
  } catch (error) {
    console.error('Ошибка инициализации БД:', error);
    return null;
  }
};

const getDb = async () => {
  if (db) return db;
  return await initDatabase();
};

// Исправленный executeQuery - используем getAllAsync вместо execSync
export const executeQuery = async (sql, params = []) => {
  const database = await getDb();
  if (!database) return [];
  
  try {
    // Для запросов SELECT используем getAllAsync
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const result = await database.getAllAsync(sql, params);
      return result || [];
    } 
    // Для INSERT, UPDATE, DELETE используем runAsync
    else {
      const result = await database.runAsync(sql, params);
      return { 
        lastInsertRowId: result.lastInsertRowId, 
        changes: result.changes 
      };
    }
  } catch (error) {
    console.error('Ошибка запроса:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    return [];
  }
};

// Получение всех товаров
export const getProducts = async () => {
  const products = await executeQuery(
    'SELECT * FROM products WHERE is_available = 1 ORDER BY product_id'
  );
  return products;
};

// Получение товара по ID
export const getProductById = async (productId) => {
  const products = await executeQuery(
    'SELECT * FROM products WHERE product_id = ? AND is_available = 1',
    [productId]
  );
  return products.length > 0 ? products[0] : null;
};

// Получение товаров по категории
export const getProductsByCategory = async (category) => {
  return await executeQuery(
    'SELECT * FROM products WHERE category = ? AND is_available = 1',
    [category]
  );
};

// Получение корзины пользователя
export const getCartItems = async (userId) => {
  return await executeQuery(
    `SELECT c.*, p.name, p.price, p.image_url 
     FROM cart_items c
     JOIN products p ON c.product_id = p.product_id
     WHERE c.user_id = ?`,
    [userId]
  );
};

// Добавление в корзину
export const addToCart = async (userId, productId, quantity = 1, customization = null) => {
  const existing = await executeQuery(
    'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );

  if (existing.length > 0) {
    const newQuantity = existing[0].quantity + quantity;
    await executeQuery(
    `UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?`,
      [newQuantity, existing[0].cart_item_id]
    );
  } else {
    const customizationJson = customization ? JSON.stringify(customization) : null;
    await executeQuery(
      `INSERT INTO cart_items (user_id, product_id, quantity, customization, added_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [userId, productId, quantity, customizationJson]
    );
  }
  return true;
};

// Удаление из корзины
export const removeFromCart = async (userId, productId) => {
  await executeQuery(
    'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return true;
};

// Обновление количества в корзине
export const updateCartQuantity = async (userId, productId, quantity) => {
  if (quantity <= 0) {
    return await removeFromCart(userId, productId);
  }
  await executeQuery(
    'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
    [quantity, userId, productId]
  );
  return true;
};

// Очистка корзины
export const clearCart = async (userId) => {
  await executeQuery('DELETE FROM cart_items WHERE user_id = ?', [userId]);
  return true;
};

// Проверка существования email
export const checkEmailExists = async (email) => {
  const result = await executeQuery(
    'SELECT 1 FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return result.length > 0;
};

// Создание пользователя
export const createUser = async (email, fullName, phone, password) => {
  const existing = await executeQuery(
    'SELECT 1 FROM users WHERE email = ?',
    [email]
  );

  if (existing.length > 0) {
    return { success: false, error: 'Email уже существует' };
  }

  const hashedPassword = await hashPassword(password);

  const result = await executeQuery(
    `INSERT INTO users (email, full_name, phone, password_hash, role, loyalty_points, personal_discount, created_at)
     VALUES (?, ?, ?, ?, 'client', 0, 0, datetime('now'))`,
    [email, fullName, phone, hashedPassword]
  );
  
  return { success: true, userId: result.lastInsertRowId };
};

// Получение пользователя по email
export const getUserByEmail = async (email) => {
  const result = await executeQuery(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return result.length > 0 ? result[0] : null;
};

// Аутентификация пользователя
export const authenticateUser = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Пользователь не найден' };
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return { success: false, error: 'Неверный пароль' };
  }

  // Убираем password_hash из возвращаемого объекта
  const { password_hash, ...userWithoutPassword } = user;
  return { success: true, user: userWithoutPassword };
};

// Обновление бонусных баллов
export const updateLoyaltyPoints = async (userId, points) => {
  await executeQuery(
    'UPDATE users SET loyalty_points = loyalty_points + ? WHERE user_id = ?',
    [points, userId]
  );
};

// Получение заказов пользователя
export const getOrdersByUserId = async (userId) => {
  const orders = await executeQuery(
    `SELECT o.*, 
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as items_count
     FROM orders o
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );
  
  // Для каждого заказа получаем позиции
  for (const order of orders) {
    order.items = await getOrderItems(order.order_id);
  }
  
  return orders;
};

// Получение позиций заказа
export const getOrderItems = async (orderId) => {
  return await executeQuery(
    `SELECT oi.*, p.name, p.image_url
     FROM order_items oi
     JOIN products p ON oi.product_id = p.product_id
     WHERE oi.order_id = ?`,
    [orderId]
  );
};

// Создание заказа
export const createOrder = async (userId, totalAmount, pickupAddress, desiredPickupTime, paymentMethod, items) => {
  const database = await getDb();
  if (!database) return null;

  try {
    await database.execAsync('BEGIN TRANSACTION');

    const orderResult = await executeQuery(
      `INSERT INTO orders (user_id, status, total_amount, pickup_address, desired_pickup_time, payment_method, created_at, updated_at)
       VALUES (?, 'pending', ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [userId, totalAmount, pickupAddress, desiredPickupTime, paymentMethod]
    );

    const orderId = orderResult.lastInsertRowId;

    for (const item of items) {
      const customizationJson = item.customization ? JSON.stringify(item.customization) : null;
      await executeQuery(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_time, customization)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price, customizationJson]
      );
    }

    // Очищаем корзину
    await executeQuery('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    
    // Добавляем запись в историю
    await executeQuery(
      `INSERT INTO order_history (order_id, action, description, created_at)
       VALUES (?, 'created', 'Заказ создан', datetime('now'))`,
      [orderId]
    );

    await database.execAsync('COMMIT');

    return orderId;
  } catch (error) {
    await database.execAsync('ROLLBACK');
    console.error('Ошибка создания заказа:', error);
    return null;
  }
};

// Обновление статуса заказа
export const updateOrderStatus = async (orderId, status) => {
  await executeQuery(
    'UPDATE orders SET status = ?, updated_at = datetime("now") WHERE order_id = ?',
    [status, orderId]
  );

  await executeQuery(
    `INSERT INTO order_history (order_id, action, description, created_at)
     VALUES (?, 'status_changed', ?, datetime('now'))`,
    [orderId, `Статус изменён на ${status}`]
  );
};

// Получение активных акций
export const getPromotions = async () => {
  const now = new Date().toISOString().split('T')[0];
  return await executeQuery(
    `SELECT * FROM promotions 
     WHERE is_active = 1 AND start_date <= ? AND end_date >= ?
     ORDER BY value DESC`,
    [now, now]
  );
};

// Получение пользователя по ID
export const getUserById = async (userId) => {
  const result = await executeQuery(
    `SELECT user_id, email, full_name, phone, role, loyalty_points, personal_discount, created_at 
     FROM users WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return result.length > 0 ? result[0] : null;
};

// Поиск товаров
export const searchProducts = async (query) => {
  const searchQuery = `%${query}%`;
  return await executeQuery(
    `SELECT * FROM products 
     WHERE is_available = 1 
     AND (name LIKE ? OR description LIKE ? OR filling LIKE ?)
     ORDER BY name`,
    [searchQuery, searchQuery, searchQuery]
  );
};

// Получение популярных товаров
export const getPopularProducts = async (limit = 10) => {
  return await executeQuery(
    `SELECT p.*, COUNT(oi.order_item_id) as order_count
     FROM products p
     LEFT JOIN order_items oi ON p.product_id = oi.product_id
     WHERE p.is_available = 1
     GROUP BY p.product_id
     ORDER BY order_count DESC
     LIMIT ?`,
    [limit]
  );
};

// Экспорт всех функций
export default {
  getProducts,
  getProductById,
  getProductsByCategory,
  getCartItems,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  checkEmailExists,
  createUser,
  getUserByEmail,
  authenticateUser,
  updateLoyaltyPoints,
  getOrdersByUserId,
  getOrderItems,
  createOrder,
  updateOrderStatus,
  getPromotions,
  getUserById,
  searchProducts,
  getPopularProducts,
};