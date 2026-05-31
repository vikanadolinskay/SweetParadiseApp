// @ts-nocheck
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const DB_NAME = 'sweet.db';

let db = null;

const initDatabase = async() => {
    try {
        // Правильный путь для Expo — из папки assets
        const asset = Asset.fromModule(require('../../../assets/database/sweet.db'));
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

const getDb = async() => {
    if (db) return db;
    return await initDatabase();
};

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
    return await executeQuery('SELECT * FROM products WHERE is_available = 1');
};

export const getCartItems = async(userId) => {
    return await executeQuery(
        `SELECT c.*, p.name, p.price 
     FROM cart_items c
     JOIN products p ON c.product_id = p.product_id
     WHERE c.user_id = ?`, [userId]
    );
};

export const addToCart = async(userId, productId, quantity = 1) => {
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
};

export const removeFromCart = async(userId, productId) => {
    await executeQuery(
        'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]
    );
    return true;
};

export const clearCart = async(userId) => {
    await executeQuery('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    return true;
};