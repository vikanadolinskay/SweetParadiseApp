// @ts-nocheck
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

const DB_NAME = 'sweet.db';

let db = null;

export const initDatabase = async () => {
  try {
    const dbDir = FileSystem.documentDirectory + 'SQLite/';
    const dbPath = dbDir + DB_NAME;

    // Создаём директорию
    const dirInfo = await FileSystem.getInfoAsync(dbDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      console.log('[DB] Папка SQLite создана');
    }

    // Проверяем наличие БД
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      console.log('[DB] Копирование базы данных...');
      const asset = Asset.fromModule(require('../../assets/database/sweet.db'));
      await asset.downloadAsync();
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: dbPath,
      });
      console.log('[DB] База данных скопирована');
    }

    // Открываем БД
    db = await SQLite.openDatabaseAsync(DB_NAME);
    console.log('[DB] База данных открыта');

    // Создаём таблицу users, если её нет
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'client',
        loyalty_points INTEGER DEFAULT 0,
        personal_discount DECIMAL(5,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[DB] Таблица users проверена');

    // Создаём тестового пользователя
    const existingUser = await db.getAllAsync("SELECT * FROM users WHERE email = 'test@sweet.ru'");
    if (existingUser.length === 0) {
      await db.runAsync(`
        INSERT INTO users (email, full_name, phone, password_hash, role) 
        VALUES ('test@sweet.ru', 'Тестовый Пользователь', '+79001234567', '123456', 'client')
      `);
      console.log('[DB] Тестовый пользователь создан');
    } else {
      console.log('[DB] Тестовый пользователь уже существует');
    }

    return db;
  } catch (error) {
    console.error('[DB] Ошибка инициализации:', error);
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
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const result = await database.getAllAsync(sql, params);
      return result || [];
    } else {
      const result = await database.runAsync(sql, params);
      return {
        lastInsertRowId: result.lastInsertRowId,
        changes: result.changes
      };
    }
  } catch (error) {
    console.error('[QUERY] Ошибка:', error);
    console.error('[QUERY] SQL:', sql);
    return [];
  }
};

// ========== ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений) ==========
export const getProducts = async () => {
  const dbConn = await getDb();
  return await dbConn.getAllAsync('SELECT * FROM products WHERE is_available = 1 ORDER BY product_id');
};

export const getProductById = async (productId) => {
  const dbConn = await getDb();
  const result = await dbConn.getAllAsync('SELECT * FROM products WHERE product_id = ? AND is_available = 1', [productId]);
  return result.length > 0 ? result[0] : null;
};

export const getProductsByCategory = async (category) => {
  const dbConn = await getDb();
  return await dbConn.getAllAsync('SELECT * FROM products WHERE category = ? AND is_available = 1', [category]);
};

export const searchProducts = async (query) => {
  const dbConn = await getDb();
  const searchQuery = `%${query}%`;
  return await dbConn.getAllAsync(
    `SELECT * FROM products 
     WHERE is_available = 1 
     AND (name LIKE ? OR description LIKE ?)
     ORDER BY name`,
    [searchQuery, searchQuery]
  );
};

export const getCartItems = async (userId) => {
  const dbConn = await getDb();
  return await dbConn.getAllAsync(
    `SELECT c.cart_item_id, c.product_id, c.quantity, c.customization,
            p.name, p.price, p.image_url, p.discount
     FROM cart_items c
     JOIN products p ON c.product_id = p.product_id
     WHERE c.user_id = ?
     ORDER BY c.added_at DESC`,
    [userId]
  );
};

export const addToCart = async (userId, productId, quantity = 1, customization = null) => {
  const dbConn = await getDb();
  const customizationJson = customization ? JSON.stringify(customization) : null;

  let existing = [];
  if (customizationJson) {
    existing = await dbConn.getAllAsync(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND customization = ?',
      [userId, productId, customizationJson]
    );
  } else {
    existing = await dbConn.getAllAsync(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND customization IS NULL',
      [userId, productId]
    );
  }

  if (existing.length > 0) {
    const newQuantity = existing[0].quantity + quantity;
    await dbConn.runAsync('UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?', [newQuantity, existing[0].cart_item_id]);
  } else {
    await dbConn.runAsync(
      `INSERT INTO cart_items (user_id, product_id, quantity, customization, added_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [userId, productId, quantity, customizationJson]
    );
  }
  return true;
};

export const removeFromCart = async (cartItemId) => {
  const dbConn = await getDb();
  await dbConn.runAsync('DELETE FROM cart_items WHERE cart_item_id = ?', [cartItemId]);
  return true;
};

export const updateCartQuantity = async (cartItemId, quantity) => {
  if (quantity <= 0) {
    return await removeFromCart(cartItemId);
  }
  const dbConn = await getDb();
  await dbConn.runAsync('UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?', [quantity, cartItemId]);
  return true;
};

export const clearCart = async (userId) => {
  const dbConn = await getDb();
  await dbConn.runAsync('DELETE FROM cart_items WHERE user_id = ?', [userId]);
  return true;
};

export const checkEmailExists = async (email) => {
  const dbConn = await getDb();
  const result = await dbConn.getAllAsync('SELECT 1 FROM users WHERE email = ? LIMIT 1', [email]);
  return result.length > 0;
};

export const createUser = async (email, fullName, phone, password) => {
  console.log('[CREATE] Регистрация:', email);
  const dbConn = await getDb();

  const existing = await dbConn.getAllAsync('SELECT 1 FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return { success: false, error: 'Email уже существует' };
  }

  const result = await dbConn.runAsync(
    `INSERT INTO users (email, full_name, phone, password_hash, role, loyalty_points, personal_discount, created_at)
     VALUES (?, ?, ?, ?, 'client', 0, 0, datetime('now'))`,
    [email, fullName, phone, password]
  );

  console.log('[CREATE] Пользователь создан, userId:', result.lastInsertRowId);
  return { success: true, userId: result.lastInsertRowId };
};

export const getUserByEmail = async (email) => {
  const dbConn = await getDb();
  const result = await dbConn.getAllAsync('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return result.length > 0 ? result[0] : null;
};

export const getUserById = async (userId) => {
  const dbConn = await getDb();
  const result = await dbConn.getAllAsync(
    `SELECT user_id, email, full_name, phone, role, loyalty_points, personal_discount, created_at 
     FROM users WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return result.length > 0 ? result[0] : null;
};

export const authenticateUser = async (email, password) => {
  console.log('[AUTH] Попытка входа:', email);
  const dbConn = await getDb();

  const user = await getUserByEmail(email);
  if (!user) {
    console.log('[AUTH] Пользователь не найден:', email);
    return { success: false, error: 'Пользователь не найден' };
  }

  console.log('[AUTH] Пароль из БД:', user.password_hash);
  console.log('[AUTH] Введённый пароль:', password);

  if (password !== user.password_hash) {
    console.log('[AUTH] Неверный пароль:', email);
    return { success: false, error: 'Неверный пароль' };
  }

  console.log('[AUTH] Вход выполнен:', email);
  const { password_hash, ...userWithoutPassword } = user;
  return { success: true, user: userWithoutPassword };
};

export const updateLoyaltyPoints = async (userId, points) => {
  const dbConn = await getDb();
  await dbConn.runAsync('UPDATE users SET loyalty_points = loyalty_points + ? WHERE user_id = ?', [points, userId]);
};

export const getOrdersByUserId = async (userId) => {
  const dbConn = await getDb();
  const orders = await dbConn.getAllAsync(
    `SELECT o.*, 
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as items_count
     FROM orders o
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );

  for (const order of orders) {
    order.items = await getOrderItems(order.order_id);
  }
  return orders;
};

export const getOrderItems = async (orderId) => {
  const dbConn = await getDb();
  return await dbConn.getAllAsync(
    `SELECT oi.*, p.name, p.image_url
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

    const orderResult = await database.runAsync(
      `INSERT INTO orders (user_id, status, total_amount, pickup_address, desired_pickup_time, payment_method, created_at, updated_at)
       VALUES (?, 'pending', ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [userId, totalAmount, pickupAddress, desiredPickupTime, paymentMethod]
    );

    const orderId = orderResult.lastInsertRowId;

    for (const item of items) {
      const customizationJson = item.customization ? JSON.stringify(item.customization) : null;
      await database.runAsync(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_time, customization)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price, customizationJson]
      );
    }

    await clearCart(userId);

    await database.runAsync(
      `INSERT INTO order_history (order_id, action, description, created_at)
       VALUES (?, 'created', 'Заказ создан', datetime('now'))`,
      [orderId]
    );

    await database.execAsync('COMMIT');
    return orderId;
  } catch (error) {
    await database.execAsync('ROLLBACK');
    console.error('[ORDER] Ошибка создания заказа:', error);
    return null;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  const dbConn = await getDb();
  await dbConn.runAsync('UPDATE orders SET status = ?, updated_at = datetime("now") WHERE order_id = ?', [status, orderId]);
  await dbConn.runAsync(
    `INSERT INTO order_history (order_id, action, description, created_at)
     VALUES (?, 'status_changed', ?, datetime('now'))`,
    [orderId, `Статус изменён на ${status}`]
  );
};

export const getPromotions = async () => {
  const dbConn = await getDb();
  const now = new Date().toISOString().split('T')[0];
  return await dbConn.getAllAsync(
    `SELECT * FROM promotions 
     WHERE is_active = 1 AND start_date <= ? AND end_date >= ?
     ORDER BY value DESC`,
    [now, now]
  );
};

export const getPopularProducts = async (limit = 10) => {
  const dbConn = await getDb();
  return await dbConn.getAllAsync(
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