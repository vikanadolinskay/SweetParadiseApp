import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({
        name: 'sweetparadise.db',
        location: 'default',
    },
    () => console.log('База данных открыта'),
    (error) => console.error('Ошибка открытия БД:', error)
);

export const executeQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                sql,
                params,
                (tx, results) => resolve(results),
                (tx, error) => reject(error)
            );
        });
    });
};

export const getProducts = async() => {
    try {
        const results = await executeQuery('SELECT * FROM products WHERE is_available = 1');
        const products = [];
        for (let i = 0; i < results.rows.length; i++) {
            products.push(results.rows.item(i));
        }
        return products;
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        return [];
    }
};

export const getProductById = async(id) => {
    try {
        const results = await executeQuery('SELECT * FROM products WHERE product_id = ?', [id]);
        if (results.rows.length > 0) {
            return results.rows.item(0);
        }
        return null;
    } catch (error) {
        console.error('Ошибка загрузки товара:', error);
        return null;
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
        const items = [];
        for (let i = 0; i < results.rows.length; i++) {
            items.push(results.rows.item(i));
        }
        return items;
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

        if (existing.rows.length > 0) {
            const newQuantity = existing.rows.item(0).quantity + quantity;
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