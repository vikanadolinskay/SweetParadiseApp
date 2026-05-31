import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const DB_NAME = 'sweet.db';
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

let db = null;

// Инициализация — копируем базу при первом запуске
const initDatabase = async() => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(DB_PATH);

        if (!fileInfo.exists) {
            console.log('Копирование базы данных...');
            // Пробуем из android/assets (для APK)
            let asset;
            try {
                asset = Asset.fromModule(require('../../android/app/src/main/assets/database/sweet.db'));
            } catch (e) {
                // Если нет — пробуем из корневой assets (для локальной разработки)
                asset = Asset.fromModule(require('../../assets/database/sweet.db'));
            }
            await asset.downloadAsync();
            await FileSystem.copyAsync({
                from: asset.localUri,
                to: DB_PATH,
            });
            console.log('База данных скопирована');
        }

        db = SQLite.openDatabaseSync(DB_NAME);
        return db;
    } catch (error) {
        console.error('Ошибка инициализации БД:', error);
        return null;
    }
};

// Получить базу (создаёт при первом вызове)
const getDb = async() => {
    if (db) return db;
    return await initDatabase();
};

// Выполнение запросов
export const executeQuery = async(sql, params = []) => {
    const database = await getDb();
    if (!database) return [];

    try {
        return database.execSync(sql, params);
    } catch (error) {
        console.error('Ошибка запроса:', error);
        return [];
    }
};

export const getProducts = async() => {
    try {
        const results = await executeQuery('SELECT * FROM products WHERE is_available = 1');
        return results;
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        return [];
    }
};

export const getCartItems = async(userId) => {
    try {
        const results = await executeQuery(
            `SELECT c.*, p.name, p.price 
       FROM cart_items c
       JOIN products p ON c.product_id = p.product_id
       WHERE c.user_id = ?`, [userId]
        );
        return results;
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        return [];
    }
};

export const addToCart = async(userId, productId, quantity = 1) => {
    try {
        const existing = await executeQuery(
            'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]
        );

        if (existing.length > 0) {
            const newQuantity = existing[0].quantity + quantity;
            await executeQuery(
                'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', [newQuantity, userId, productId]
            );
        } else {
            await executeQuery(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [userId, productId, quantity]
            );
        }
        return true;
    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
        return false;
    }
};

export const removeFromCart = async(userId, productId) => {
    try {
        await executeQuery(
            'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]
        );
        return true;
    } catch (error) {
        console.error('Ошибка удаления из корзины:', error);
        return false;
    }
};

export const clearCart = async(userId) => {
    try {
        await executeQuery('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        return true;
    } catch (error) {
        console.error('Ошибка очистки корзины:', error);
        return false;
    }
};