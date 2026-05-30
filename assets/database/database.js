import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';

const DB_NAME = 'sweetparadise.db';
const DB_PATH = `${RNFS.DocumentDirectoryPath}/${DB_NAME}`;
const ASSET_DB_PATH = `${RNFS.MainBundlePath}/assets/database/${DB_NAME}`;

// Функция копирования базы из assets при первом запуске
const copyDatabaseIfNeeded = async() => {
    const exists = await RNFS.exists(DB_PATH);
    if (!exists) {
        try {
            await RNFS.copyFile(ASSET_DB_PATH, DB_PATH);
            console.log('✅ База данных скопирована из assets');
        } catch (error) {
            console.error('❌ Ошибка копирования базы:', error);
        }
    }
};

// Открытие базы
const getDB = async() => {
    await copyDatabaseIfNeeded();
    return SQLite.openDatabase({
            name: DB_NAME,
            location: 'Library',
        },
        () => console.log('✅ База данных открыта'),
        (error) => console.error('❌ Ошибка открытия БД:', error)
    );
};