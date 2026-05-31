let productsCache = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 60 секунд

export const getCachedProducts = async(fetchFunction) => {
    const now = Date.now();
    if (productsCache && (now - lastFetch) < CACHE_TTL) {
        return productsCache;
    }
    productsCache = await fetchFunction();
    lastFetch = now;
    return productsCache;
};

export const clearCache = () => {
    productsCache = null;
    lastFetch = 0;
};