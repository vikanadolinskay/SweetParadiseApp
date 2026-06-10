import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@sweet_cart';

export const getCart = async() => {
    try {
        const cart = await AsyncStorage.getItem(CART_KEY);
        return cart ? JSON.parse(cart) : [];
    } catch {
        return [];
    }
};

const saveCart = async(cart) => {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const addToCart = async(product, quantity = 1, customization = null) => {
    const cart = await getCart();
    const existingIndex = cart.findIndex(item =>
        item.product_id === product.product_id &&
        JSON.stringify(item.customization) === JSON.stringify(customization)
    );

    if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            product_id: product.product_id,
            name: product.name,
            price: product.price,
            discount: product.discount,
            image_url: product.image_url,
            quantity,
            customization,
        });
    }
    await saveCart(cart);
    return cart;
};

export const updateQuantity = async(productId, newQuantity, customization) => {
    const cart = await getCart();
    const index = cart.findIndex(item =>
        item.product_id === productId &&
        JSON.stringify(item.customization) === JSON.stringify(customization)
    );
    if (index >= 0) {
        if (newQuantity <= 0) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = newQuantity;
        }
        await saveCart(cart);
    }
    return cart;
};

export const removeFromCart = async(productId, customization) => {
    const cart = await getCart();
    const filtered = cart.filter(item =>
        !(item.product_id === productId &&
            JSON.stringify(item.customization) === JSON.stringify(customization))
    );
    await saveCart(filtered);
    return filtered;
};

export const clearCart = async() => {
    await saveCart([]);
};