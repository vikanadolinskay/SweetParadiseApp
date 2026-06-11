const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Добавляем поддержку db и изображений как ассетов
config.resolver.assetExts.push('db', 'jpg', 'jpeg', 'png', 'gif', 'webp');

module.exports = config;