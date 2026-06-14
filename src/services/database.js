// @ts-nocheck
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

const DB_NAME = 'sweet.db';

let db = null;

// Функция для получения локального изображения
const getLocalImage = (imagePath) => {
  if (!imagePath) return null;
  
  const imageMap = {
    // Товары
    'images/bant_classic.jpg': require('../../assets/images/bant_classic.jpg'),
    'images/bant_mini.jpg': require('../../assets/images/bant_mini.jpg'),
    'images/bant_pearl.jpg': require('../../assets/images/bant_pearl.jpg'),
    'images/bant_pink.jpg': require('../../assets/images/bant_pink.jpg'),
    'images/basque.jpg': require('../../assets/images/basque.jpg'),
    'images/bento.jpg': require('../../assets/images/bento.jpg'),
    'images/brownie.jpg': require('../../assets/images/brownie.jpg'),
    'images/canele.jpg': require('../../assets/images/canele.jpg'),
    'images/choux_cheese.jpg': require('../../assets/images/choux_cheese.jpg'),
    'images/cookies_choco.jpg': require('../../assets/images/cookies_choco.jpg'),
    'images/creme_brulee.jpg': require('../../assets/images/creme_brulee.jpg'),
    'images/croissant_almond.jpg': require('../../assets/images/croissant_almond.jpg'),
    'images/croissant_choco.jpg': require('../../assets/images/croissant_choco.jpg'),
    'images/croissant_pist.jpg': require('../../assets/images/croissant_pist.jpg'),
    'images/danet_lemon.jpg': require('../../assets/images/danet_lemon.jpg'),
    'images/eclair_caramel.jpg': require('../../assets/images/eclair_caramel.jpg'),
    'images/eclair_choco_pist.jpg': require('../../assets/images/eclair_choco_pist.jpg'),
    'images/eclair_vanilla.jpg': require('../../assets/images/eclair_vanilla.jpg'),
    'images/financier.jpg': require('../../assets/images/financier.jpg'),
    'images/kinder.jpg': require('../../assets/images/kinder.jpg'),
    'images/lambet_caramel.jpg': require('../../assets/images/lambet_caramel.jpg'),
    'images/lambet_classic.jpg': require('../../assets/images/lambet_classic.jpg'),
    'images/lambet_coconut.jpg': require('../../assets/images/lambet_coconut.jpg'),
    'images/lambet_fondant.jpg': require('../../assets/images/lambet_fondant.jpg'),
    'images/lambet_pistachio.jpg': require('../../assets/images/lambet_pistachio.jpg'),
    'images/lambet_tropical.jpg': require('../../assets/images/lambet_tropical.jpg'),
    'images/macaron_caramel.jpg': require('../../assets/images/macaron_caramel.jpg'),
    'images/macaron_lavender.jpg': require('../../assets/images/macaron_lavender.jpg'),
    'images/macaron_mango.jpg': require('../../assets/images/macaron_mango.jpg'),
    'images/macaron_matcha.jpg': require('../../assets/images/macaron_matcha.jpg'),
    'images/macaron_pearl.jpg': require('../../assets/images/macaron_pearl.jpg'),
    'images/macaron_pistachio.jpg': require('../../assets/images/macaron_pistachio.jpg'),
    'images/macaron_truffle.jpg': require('../../assets/images/macaron_truffle.jpg'),
    'images/mirror.jpg': require('../../assets/images/mirror.jpg'),
    'images/ny_blueberry.jpg': require('../../assets/images/ny_blueberry.jpg'),
    'images/ny_cheesecake.jpg': require('../../assets/images/ny_cheesecake.jpg'),
    'images/ny_raspberry.jpg': require('../../assets/images/ny_raspberry.jpg'),
    'images/opera.jpg': require('../../assets/images/opera.jpg'),
    'images/panna_cotta.jpg': require('../../assets/images/panna_cotta.jpg'),
    'images/panna_cotta_pist.jpg': require('../../assets/images/panna_cotta_pist.jpg'),
    'images/panna_cotta_mango.jpg': require('../../assets/images/panna_cotta_mango.jpg'),
    'images/paris_brest.jpg': require('../../assets/images/paris_brest.jpg'),
    'images/pavlova.jpg': require('../../assets/images/pavlova.jpg'),
    'images/rafaello.jpg': require('../../assets/images/rafaello.jpg'),
    'images/sacher.jpg': require('../../assets/images/sacher.jpg'),
    'images/saint_honore.jpg': require('../../assets/images/saint_honore.jpg'),
    'images/tart_berry.jpg': require('../../assets/images/tart_berry.jpg'),
    'images/tart_lemon.jpg': require('../../assets/images/tart_lemon.jpg'),
    'images/tiramisu.jpg': require('../../assets/images/tiramisu.jpg'),
    'images/truffles.jpg': require('../../assets/images/truffles.jpg'),
    
    // Баннеры
    'banners/banner_wedding_main.jpg': require('../../assets/images/banners/banner_wedding_main.jpg'),
    'banners/banner_sale_20.jpg': require('../../assets/images/banners/banner_sale_20.jpg'),
    'banners/banner_new_arrivals.jpg': require('../../assets/images/banners/banner_new_arrivals.jpg'),
    'banners/banner_birthday.jpg': require('../../assets/images/banners/banner_birthday.jpg'),
    'banners/banner_seasonal_summer.jpg': require('../../assets/images/banners/banner_seasonal_summer.jpg'),
  };
  
  return imageMap[imagePath] || null;
};

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

    // Создаём таблицу banners, если её нет
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS banners (
        banner_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        subtitle VARCHAR(500),
        image_url VARCHAR(500) NOT NULL,
        link_type VARCHAR(50),
        link_value VARCHAR(500),
        button_text VARCHAR(100),
        order_position INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[DB] Таблица banners проверена');

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

    // Проверяем и добавляем баннеры, если их нет
    const existingBanners = await db.getAllAsync("SELECT COUNT(*) as count FROM banners");
    if (existingBanners[0].count === 0) {
      console.log('[DB] Добавление баннеров...');
      await db.runAsync(`
        INSERT INTO banners (name, title, subtitle, image_url, link_type, link_value, button_text, order_position, is_active) VALUES
        ('Свадебные торты', 'Свадебные торты', 'Индивидуальный дизайн под ваш праздник', 'banners/banner_wedding_main.jpg', 'category', 'cakes', 'Выбрать торт', 1, 1),
        ('Акция 20%', 'Скидка 20%', 'На все торты при заказе от 3 кг', 'banners/banner_sale_20.jpg', 'promotion', '2', 'Подробнее', 2, 1),
        ('Новинки сезона', 'Новые десерты', 'Пирожные и капкейки', 'banners/banner_new_arrivals.jpg', 'category', 'pastries', 'Смотреть', 3, 1),
        ('День рождения', 'Сладкий подарок', 'Торт в подарок - скидка 10%', 'banners/banner_birthday.jpg', 'promotion', '7', 'Заказать', 4, 1),
        ('Летние десерты', 'Легкие десерты', 'Фруктовые и ягодные', 'banners/banner_seasonal_summer.jpg', 'category', 'desserts', 'Попробовать', 5, 1)
      `);
      console.log('[DB] Баннеры добавлены');
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

// ========== БАННЕРЫ ==========
export const getBanners = async () => {
  const dbConn = await getDb();
  if (!dbConn) return [];
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const banners = await dbConn.getAllAsync(`
      SELECT 
        banner_id,
        name,
        title,
        subtitle,
        image_url,
        link_type,
        link_value,
        button_text,
        order_position
      FROM banners
      WHERE is_active = 1
        AND (start_date IS NULL OR start_date <= ?)
        AND (end_date IS NULL OR end_date >= ?)
      ORDER BY order_position ASC, banner_id ASC
    `, [today, today]);
    
    // Добавляем поле image_source с require для локальных изображений баннеров
    return banners.map(b => ({
      ...b,
      image_source: getLocalImage(b.image_url)
    }));
  } catch (error) {
    console.error('[BANNERS] Ошибка получения баннеров:', error);
    return [];
  }
};

// ========== ТОВАРЫ С ИЗОБРАЖЕНИЯМИ ==========
export const getProducts = async () => {
  const dbConn = await getDb();
  const products = await dbConn.getAllAsync('SELECT * FROM products WHERE is_available = 1 ORDER BY product_id');
  
  // Добавляем поле image_source с require для локальных изображений
  return products.map(p => ({
    ...p,
    image_source: getLocalImage(p.image_url)
  }));
};

export const getProductById = async (productId) => {
  const dbConn = await getDb();
  const products = await dbConn.getAllAsync('SELECT * FROM products WHERE product_id = ? AND is_available = 1', [productId]);
  if (products.length === 0) return null;
  const product = products[0];
  return {
    ...product,
    image_source: getLocalImage(product.image_url)
  };
};

export const getProductsByCategory = async (category) => {
  const dbConn = await getDb();
  const products = await dbConn.getAllAsync('SELECT * FROM products WHERE category = ? AND is_available = 1', [category]);
  return products.map(p => ({
    ...p,
    image_source: getLocalImage(p.image_url)
  }));
};

export const searchProducts = async (query) => {
  const dbConn = await getDb();
  const searchQuery = `%${query}%`;
  const products = await dbConn.getAllAsync(
    `SELECT * FROM products 
     WHERE is_available = 1 
     AND (name LIKE ? OR description LIKE ?)
     ORDER BY name`,
    [searchQuery, searchQuery]
  );
  return products.map(p => ({
    ...p,
    image_source: getLocalImage(p.image_url)
  }));
};

export const getCartItems = async (userId) => {
  const dbConn = await getDb();
  const items = await dbConn.getAllAsync(
    `SELECT c.cart_item_id, c.product_id, c.quantity, c.customization,
            p.name, p.price, p.image_url, p.discount
     FROM cart_items c
     JOIN products p ON c.product_id = p.product_id
     WHERE c.user_id = ?
     ORDER BY c.added_at DESC`,
    [userId]
  );
  return items.map(item => ({
    ...item,
    image_source: getLocalImage(item.image_url)
  }));
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

// ========== ОБНОВЛЕНИЕ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ ==========
export const updateUserProfile = async (userId, data) => {
  const dbConn = await getDb();
  const { full_name, phone, email } = data;
  
  try {
    await dbConn.runAsync(
      `UPDATE users SET full_name = ?, phone = ?, email = ? WHERE user_id = ?`,
      [full_name, phone, email, userId]
    );
    return true;
  } catch (error) {
    console.error('[UPDATE] Ошибка обновления профиля:', error);
    return false;
  }
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
  const items = await dbConn.getAllAsync(
    `SELECT oi.*, p.name, p.image_url
     FROM order_items oi
     JOIN products p ON oi.product_id = p.product_id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  return items.map(item => ({
    ...item,
    image_source: getLocalImage(item.image_url)
  }));
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
  const products = await dbConn.getAllAsync(
    `SELECT p.*, COUNT(oi.order_item_id) as order_count
     FROM products p
     LEFT JOIN order_items oi ON p.product_id = oi.product_id
     WHERE p.is_available = 1
     GROUP BY p.product_id
     ORDER BY order_count DESC
     LIMIT ?`,
    [limit]
  );
  return products.map(p => ({
    ...p,
    image_source: getLocalImage(p.image_url)
  }));
};

export default {
  initDatabase,
  getBanners,
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
  updateUserProfile,
  getOrdersByUserId,
  getOrderItems,
  createOrder,
  updateOrderStatus,
  getPromotions,
  getPopularProducts,
};