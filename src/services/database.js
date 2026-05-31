import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('sweetparadise.db');

export const executeQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        try {
            const result = db.execSync(sql, params);
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
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