// @ts-nocheck
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as Crypto from 'expo-crypto';

const DB_NAME = 'sweet.db';

let db = null;

// Функция для хэширования пароля
const hashPassword = async (password) => {
  const salt = 'sweet_paradise_salt_2024'; // Соль для усиления хэша
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

const initDatabase = async () => {
  try {
    const asset = Asset.fromModule(require('../../assets/database/sweet.db'));
    await asset.downloadAsync();

    const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

    const fileInfo = await FileSystem.getInfoAsync(dbPath);

    if (!fileInfo.exists) {
      console.log('Копирование базы данных...');
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: dbPath,
      });
      console.log('База данных скопирована');
    }

    db = await SQLite.openDatabaseAsync(DB_NAME);
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

export const executeQuery = async (sql, params = []) => {
  const database = await getDb();
  if (!database) return [];
  try {
    return await database.execSync(sql, params);
  } catch (error) {
    console.error('Ошибка запроса:', error);
    return [];
  }
};

export const getProducts = async () => {
  return await executeQuery('SELECT * FROM products WHERE is_available = 1');
};

export const getCartItems = async (userId) => {
  return await executeQuery(
    `SELECT c.*, p.name, p.price 
     FROM cart_items c
     JOIN products p ON c.product_id = p.product_id
     WHERE c.user_id = ?`,
    [userId]
  );
};

export const addToCart = async (userId, productId, quantity = 1, customization = null) => {
  const existing = await executeQuery(
    'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );

  if (existing.length > 0) {
    const newQuantity = existing[0].quantity + quantity;
    await executeQuery(
      'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [newQuantity, userId, productId]
    );
  } else {
    const customizationJson = customization ? JSON.stringify(customization) : null;
    await executeQuery(
      'INSERT INTO cart_items (user_id, product_id, quantity, customization) VALUES (?, ?, ?, ?)',
      [userId, productId, quantity, customizationJson]
    );
  }
  return true;
};

export const removeFromCart = async (userId, productId) => {
  await executeQuery(
    'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return true;
};

export const clearCart = async (userId) => {
  await executeQuery('DELETE FROM cart_items WHERE user_id = ?', [userId]);
  return true;
};

export const checkEmailExists = async (email) => {
  const result = await executeQuery(
    'SELECT 1 FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return result.length > 0;
};

// Создание пользователя с хэшированием пароля
export const createUser = async (email, fullName, phone, password) => {
  const existing = await executeQuery(
    'SELECT 1 FROM users WHERE email = ?',
    [email]
  );

  if (existing.length > 0) {
    return false;
  }

  const hashedPassword = await hashPassword(password);

  await executeQuery(
    `INSERT INTO users (email, full_name, phone, password_hash, loyalty_points, personal_discount, created_at)
     VALUES (?, ?, ?, ?, 0, 0, datetime('now'))`,
    [email, fullName, phone, hashedPassword]
  );
  return true;
};

// Получение пользователя по email (для входа)
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

  return { success: true, user };
};

export const updateLoyaltyPoints = async (userId, points) => {
  await executeQuery(
    'UPDATE users SET loyalty_points = loyalty_points + ? WHERE user_id = ?',
    [points, userId]
  );
};

export const getOrdersByUserId = async (userId) => {
  return await executeQuery(
    `SELECT o.*, 
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as items_count
     FROM orders o
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );
};

export const getOrderItems = async (orderId) => {
  return await executeQuery(
    `SELECT oi.*, p.name, p.price as product_price
     FROM order_items oi
     JOIN products p ON oi.product_id = p.product_id
     WHERE oi.order_id = ?`,
    [orderId]
  );
};

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

    await executeQuery('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    await database.execAsync('COMMIT');

    return orderId;
  } catch (error) {
    await database.execAsync('ROLLBACK');
    console.error('Ошибка создания заказа:', error);
    return null;
  }
};

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

export const getPromotions = async () => {
  const now = new Date().toISOString().split('T')[0];
  return await executeQuery(
    'SELECT * FROM promotions WHERE is_active = 1 AND start_date <= ? AND end_date >= ?',
    [now, now]
  );
};

// Получение пользователя по ID
export const getUserById = async (userId) => {
  const result = await executeQuery(
    'SELECT user_id, email, full_name, phone, loyalty_points, personal_discount, created_at FROM users WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return result.length > 0 ? result[0] : null;
};