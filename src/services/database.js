// @ts-nocheck
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import bcrypt from 'react-native-bcrypt';

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

    const dirInfo = await FileSystem.getInfoAsync(dbDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      console.log('[DB] Папка SQLite создана');
    }

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

    db = await SQLite.openDatabaseAsync(DB_NAME);
    console.log('[DB] База данных открыта');

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

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        calories INTEGER DEFAULT 0,
        weight INTEGER DEFAULT 0,
        category VARCHAR(100),
        image_url VARCHAR(500),
        is_available BOOLEAN DEFAULT 1,
        is_customizable BOOLEAN DEFAULT 0,
        discount INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Проверяем, есть ли колонка weight (для старых БД)
    try {
      await db.execAsync(`ALTER TABLE products ADD COLUMN weight INTEGER DEFAULT 0`);
      console.log('[DB] Колонка weight добавлена');
    } catch (e) {
      // Колонка уже существует
    }

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

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        pickup_address VARCHAR(500) NOT NULL,
        desired_pickup_time TIMESTAMP NOT NULL,
        payment_method VARCHAR(20) DEFAULT 'cash',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        CHECK(total_amount >= 0)
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS order_items (
        order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        price_at_time DECIMAL(10,2) NOT NULL,
        customization JSON,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        CHECK(quantity > 0)
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cart_items (
        cart_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        quantity INTEGER DEFAULT 1,
        customization JSON,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        CHECK(quantity > 0)
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS order_history (
        history_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS loyalty_history (
        history_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        points_change INTEGER NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS promotions (
        promotion_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        product_id INTEGER,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_orders (
        offline_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        order_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced BOOLEAN DEFAULT 0
      )
    `);

    // ===== СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ =====
    const usersData = [
      { user_id: 1, email: 'test@sweet.ru', fullName: 'Тестовый Пользователь', phone: '+79001234567', role: 'client', points: 0, discount: 0 },
      { user_id: 2, email: 'admin@sweetparadise.ru', fullName: 'Администратор', phone: '+79009999999', role: 'admin', points: 0, discount: 0 },
      { user_id: 3, email: 'anna@sweet.ru', fullName: 'Иванова Анна Сергеевна', phone: '+79993334455', role: 'client', points: 1500, discount: 5 },
    ];

    for (const userData of usersData) {
      const existing = await db.getAllAsync('SELECT * FROM users WHERE email = ?', [userData.email]);
      
      if (existing.length === 0) {
        const salt = bcrypt.genSaltSync(12);
        const hashedPassword = bcrypt.hashSync('123456', salt);
        
        await db.runAsync(`
          INSERT INTO users (user_id, email, full_name, phone, password_hash, role, loyalty_points, personal_discount, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          userData.user_id,
          userData.email,
          userData.fullName,
          userData.phone,
          hashedPassword,
          userData.role,
          userData.points,
          userData.discount
        ]);
        
        console.log('[DB] Создан пользователь:', userData.email, 'ID:', userData.user_id);
      } else {
        const user = existing[0];
        if (!user.password_hash || !user.password_hash.startsWith('$2')) {
          const salt = bcrypt.genSaltSync(12);
          const hashedPassword = bcrypt.hashSync('123456', salt);
          await db.runAsync(
            "UPDATE users SET password_hash = ? WHERE email = ?",
            [hashedPassword, userData.email]
          );
          console.log('[DB] Обновлён пароль для:', userData.email);
        }
      }
    }

    // ===== ДОБАВЛЕНИЕ ТОВАРОВ =====
    const existingProducts = await db.getAllAsync('SELECT COUNT(*) as count FROM products');
    if (existingProducts[0].count === 0) {
      console.log('[DB] Добавление товаров...');
      await db.runAsync(`
        INSERT INTO products (name, description, price, calories, weight, category, image_url, is_available, is_customizable, discount) VALUES
        ('Бант Классический', 'Нежное пирожное в форме банта с воздушным заварным кремом.', 350, 320, 80, 'pastries', 'images/bant_classic.jpg', 1, 0, 0),
        ('Бант Мини', 'Маленькое удовольствие для тех, кто следит за фигурой.', 180, 180, 40, 'pastries', 'images/bant_mini.jpg', 1, 0, 0),
        ('Бант Жемчужный', 'Изысканное пирожное с жемчужным декором и нежной начинкой из маскарпоне.', 420, 380, 90, 'pastries', 'images/bant_pearl.jpg', 1, 0, 0),
        ('Бант Розовый', 'Романтичное розовое пирожное с шоколадной начинкой и клубничным муссом.', 390, 350, 85, 'pastries', 'images/bant_pink.jpg', 1, 0, 0),
        ('Баскский Чизкейк', 'Знаменитый баскский чизкейк с карамелизированной корочкой и нежной кремовой текстурой.', 2500, 480, 800, 'cakes', 'images/basque.jpg', 1, 1, 0),
        ('Бенто Торт', 'Компактный торт в японском стиле.', 1800, 420, 500, 'cakes', 'images/bento.jpg', 1, 1, 0),
        ('Брауни', 'Плотный шоколадный брауни с грецкими орехами и шоколадными каплями.', 1500, 520, 400, 'cakes', 'images/brownie.jpg', 1, 0, 0),
        ('Канеле', 'Французское пирожное с хрустящей карамельной корочкой и мягкой ванильной начинкой.', 350, 280, 50, 'pastries', 'images/canele.jpg', 1, 0, 0),
        ('Профитроль с Сыром', 'Нежные заварные пирожные с сырным кремом.', 280, 250, 120, 'pastries', 'images/choux_cheese.jpg', 1, 0, 0),
        ('Шоколадное Печенье', 'Хрустящее шоколадное печенье с кусочками темного шоколада.', 250, 210, 150, 'cookies', 'images/cookies_choco.jpg', 1, 0, 0),
        ('Крем-брюле', 'Классический французский десерт с хрустящей карамельной корочкой.', 320, 350, 150, 'desserts', 'images/creme_brulee.jpg', 1, 0, 0),
        ('Круассан с Миндалем', 'Хрустящий слоеный круассан с миндальной начинкой.', 350, 420, 80, 'pastries', 'images/croissant_almond.jpg', 1, 0, 0),
        ('Круассан с Шоколадом', 'Классический французский круассан с начинкой из темного шоколада.', 320, 400, 75, 'pastries', 'images/croissant_choco.jpg', 1, 0, 0),
        ('Круассан с Фисташкой', 'Изысканный круассан с фисташковой пастой.', 380, 430, 80, 'pastries', 'images/croissant_pist.jpg', 1, 0, 0),
        ('Тарт с Лимоном', 'Песочный тарт с лимонным курдом и безе.', 420, 380, 120, 'desserts', 'images/danet_lemon.jpg', 1, 0, 0),
        ('Эклер с Карамелью', 'Классический французский эклер с карамельным заварным кремом.', 320, 290, 70, 'pastries', 'images/eclair_caramel.jpg', 1, 0, 0),
        ('Эклер с Шоколадом и Фисташкой', 'Изысканный эклер с шоколадно-фисташковым кремом.', 350, 320, 75, 'pastries', 'images/eclair_choco_pist.jpg', 1, 0, 0),
        ('Эклер с Ванилью', 'Нежный эклер с классическим ванильным заварным кремом.', 290, 270, 65, 'pastries', 'images/eclair_vanilla.jpg', 1, 0, 0),
        ('Финансье', 'Французское миндальное пирожное в форме золотого слитка.', 280, 310, 40, 'pastries', 'images/financier.jpg', 1, 0, 0),
        ('Торт Киндер', 'Нежный торт, напоминающий вкус знаменитых шоколадных батончиков.', 2200, 580, 800, 'cakes', 'images/kinder.jpg', 1, 1, 0),
        ('Ламбет с Карамелью', 'Нежный десерт в стаканчике с карамельным кремом.', 400, 380, 150, 'desserts', 'images/lambet_caramel.jpg', 1, 0, 0),
        ('Ламбет Классический', 'Традиционный десерт в стаканчике с заварным кремом.', 380, 350, 140, 'desserts', 'images/lambet_classic.jpg', 1, 0, 0),
        ('Ламбет с Кокосом', 'Тропический десерт в стаканчике с кокосовым кремом.', 390, 420, 150, 'desserts', 'images/lambet_coconut.jpg', 1, 0, 0),
        ('Ламбет с Шоколадом', 'Шоколадный десерт в стаканчике с насыщенным шоколадным кремом.', 430, 450, 150, 'desserts', 'images/lambet_fondant.jpg', 1, 0, 0),
        ('Ламбет с Фисташкой', 'Изысканный десерт в стаканчике с фисташковым кремом.', 450, 440, 150, 'desserts', 'images/lambet_pistachio.jpg', 1, 0, 0),
        ('Ламбет Тропический', 'Яркий тропический десерт с манго и маракуйей.', 420, 370, 150, 'desserts', 'images/lambet_tropical.jpg', 1, 0, 0),
        ('Макарон с Карамелью', 'Французское пирожное макарон с карамельной начинкой.', 180, 150, 20, 'desserts', 'images/macaron_caramel.jpg', 1, 0, 0),
        ('Макарон с Лавандой', 'Ароматный макарон с начинкой из лавандового крема.', 180, 140, 20, 'desserts', 'images/macaron_lavender.jpg', 1, 0, 0),
        ('Макарон с Манго', 'Яркий желтый макарон с начинкой из мангового крема.', 190, 145, 20, 'desserts', 'images/macaron_mango.jpg', 1, 0, 0),
        ('Макарон с Матчей', 'Зеленый макарон с кремом из японского порошка матча.', 190, 155, 20, 'desserts', 'images/macaron_matcha.jpg', 1, 0, 0),
        ('Макарон Жемчужный', 'Изысканный макарон с жемчужным декором и белым шоколадом.', 200, 160, 22, 'desserts', 'images/macaron_pearl.jpg', 1, 0, 0),
        ('Макарон с Фисташкой', 'Зеленый макарон с фисташковой начинкой.', 190, 165, 20, 'desserts', 'images/macaron_pistachio.jpg', 1, 0, 0),
        ('Макарон Трюфель', 'Роскошный макарон с начинкой из черного трюфеля и шоколада.', 220, 180, 22, 'desserts', 'images/macaron_truffle.jpg', 1, 0, 0),
        ('Торт Зеркальный', 'Впечатляющий торт с зеркальной глазурью и муссовой начинкой.', 2800, 520, 900, 'cakes', 'images/mirror.jpg', 1, 1, 0),
        ('Нью-Йорк с Голубикой', 'Нью-йоркский чизкейк с голубичным конфи.', 2300, 490, 800, 'cakes', 'images/ny_blueberry.jpg', 1, 1, 0),
        ('Нью-Йорк Классический', 'Знаменитый нью-йоркский чизкейк по традиционному рецепту.', 2100, 510, 800, 'cakes', 'images/ny_cheesecake.jpg', 1, 1, 0),
        ('Нью-Йорк с Малиной', 'Нью-йоркский чизкейк с малиновым конфи.', 2400, 495, 800, 'cakes', 'images/ny_raspberry.jpg', 1, 1, 0),
        ('Торт Опера', 'Классический французский торт Опера с кофейным кремом и шоколадным ганашем.', 2600, 550, 800, 'cakes', 'images/opera.jpg', 1, 1, 0),
        ('Панна-котта', 'Итальянский десерт панна-котта с ванилью и ягодным соусом.', 320, 280, 120, 'desserts', 'images/panna_cotta.jpg', 1, 0, 0),
        ('Панна-котта Фисташковая', 'Итальянская панна-котта с фисташковой пастой.', 350, 320, 120, 'desserts', 'images/panna_cotta_pist.jpg', 1, 0, 0),
        ('Панна-котта с Манго', 'Итальянская панна-котта с манговым пюре.', 340, 290, 120, 'desserts', 'images/panna_cotta_mango.jpg', 1, 0, 0),
        ('Париж-Брест', 'Французский торт Париж-Брест в форме колеса с пралиновым кремом.', 380, 430, 150, 'pastries', 'images/paris_brest.jpg', 1, 0, 0),
        ('Павлова', 'Легкий десерт Павлова с хрустящей меренгой и свежими ягодами.', 350, 310, 180, 'desserts', 'images/pavlova.jpg', 1, 0, 0),
        ('Торт Рафаэлло', 'Нежный торт с кокосовой стружкой и миндалем.', 2000, 560, 800, 'cakes', 'images/rafaello.jpg', 1, 1, 0),
        ('Торт Захер', 'Знаменитый венский торт Захер с шоколадным бисквитом и абрикосовым джемом.', 3000, 600, 800, 'cakes', 'images/sacher.jpg', 1, 1, 0),
        ('Сент-Оноре', 'Французский торт Сент-Оноре с заварным тестом и карамелью.', 450, 480, 200, 'pastries', 'images/saint_honore.jpg', 1, 0, 0),
        ('Ягодный Тарт', 'Песочный тарт с заварным кремом и ассорти из свежих ягод.', 400, 360, 130, 'desserts', 'images/tart_berry.jpg', 1, 0, 0),
        ('Лимонный Тарт', 'Песочный тарт с лимонным курдом и меренгой.', 380, 350, 120, 'desserts', 'images/tart_lemon.jpg', 1, 0, 0),
        ('Тирамису', 'Классический итальянский тирамису с маскарпоне и кофе.', 1800, 470, 800, 'cakes', 'images/tiramisu.jpg', 1, 1, 0),
        ('Трюфели Шоколадные', 'Шоколадные трюфели из бельгийского шоколада ручной работы.', 1500, 520, 200, 'desserts', 'images/truffles.jpg', 1, 0, 0)
      `);
      console.log('[DB] Товары добавлены');
    }

    // ===== ДОБАВЛЕНИЕ БАННЕРОВ =====
    const existingBanners = await db.getAllAsync('SELECT COUNT(*) as count FROM banners');
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

    // ===== ДОБАВЛЕНИЕ АКЦИЙ =====
    const existingPromotions = await db.getAllAsync('SELECT COUNT(*) as count FROM promotions');
    if (existingPromotions[0].count === 0) {
      console.log('[DB] Добавление акций...');
      await db.runAsync(`
        INSERT INTO promotions (name, type, value, product_id, start_date, end_date, is_active) VALUES
        ('Скидка на Прагу 10%', 'discount_percent', 10, 2, '2026-05-01', '2026-06-30', 1),
        ('Скидка на эклеры 5%', 'discount_percent', 5, 7, '2026-05-01', '2026-06-30', 1),
        ('Скидка на чизкейк', 'discount_fixed', 50, 6, '2026-05-01', '2026-06-30', 1),
        ('Скидка на брауни', 'discount_fixed', 50, 20, '2026-05-01', '2026-06-30', 1),
        ('Промокод SWEET10', 'discount_percent', 10, NULL, '2026-05-01', '2026-06-30', 1),
        ('Скидка для новых клиентов', 'discount_percent', 20, NULL, '2026-05-01', '2026-06-30', 1),
        ('День рождения', 'discount_percent', 10, NULL, '2026-01-01', '2026-12-31', 1),
        ('Скидка пенсионерам', 'discount_percent', 5, NULL, '2026-01-01', '2026-12-31', 1)
      `);
      console.log('[DB] Акции добавлены');
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
    
    return banners.map(b => ({
      ...b,
      image_source: getLocalImage(b.image_url)
    }));
  } catch (error) {
    console.error('[BANNERS] Ошибка получения баннеров:', error);
    return [];
  }
};

// ========== ТОВАРЫ ==========
export const getProducts = async () => {
  const dbConn = await getDb();
  const products = await dbConn.getAllAsync('SELECT * FROM products WHERE is_available = 1 ORDER BY product_id');
  
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
  const dbConn = await getDb();

  const existing = await dbConn.getAllAsync('SELECT 1 FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return { success: false, error: 'Email уже существует' };
  }

  const salt = bcrypt.genSaltSync(12);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const result = await dbConn.runAsync(
    `INSERT INTO users (email, full_name, phone, password_hash, role, loyalty_points, personal_discount, created_at)
     VALUES (?, ?, ?, ?, 'client', 0, 0, datetime('now'))`,
    [email, fullName, phone, hashedPassword]
  );

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
  const dbConn = await getDb();

  const user = await getUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Пользователь не найден' };
  }

  let isPasswordValid = false;
  try {
    isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  } catch (err) {
    console.log('[AUTH] Ошибка bcrypt:', err);
  }

  if (!isPasswordValid) {
    return { success: false, error: 'Неверный пароль' };
  }

  const { password_hash, ...userWithoutPassword } = user;
  return { success: true, user: userWithoutPassword };
};

export const updateLoyaltyPoints = async (userId, points) => {
  const dbConn = await getDb();
  await dbConn.runAsync('UPDATE users SET loyalty_points = loyalty_points + ? WHERE user_id = ?', [points, userId]);
};

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

export const deleteUserAccount = async (userId) => {
  const dbConn = await getDb();
  if (!dbConn) return false;
  
  try {
    await dbConn.execAsync('BEGIN TRANSACTION');
    
    await dbConn.runAsync('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    await dbConn.runAsync('DELETE FROM order_history WHERE user_id = ?', [userId]);
    await dbConn.runAsync('DELETE FROM loyalty_history WHERE user_id = ?', [userId]);
    await dbConn.runAsync(`
      DELETE FROM order_items 
      WHERE order_id IN (SELECT order_id FROM orders WHERE user_id = ?)
    `, [userId]);
    await dbConn.runAsync('DELETE FROM orders WHERE user_id = ?', [userId]);
    await dbConn.runAsync('DELETE FROM users WHERE user_id = ?', [userId]);
    
    await dbConn.execAsync('COMMIT');
    console.log('[DELETE] Пользователь', userId, 'удалён');
    return true;
  } catch (error) {
    await dbConn.execAsync('ROLLBACK');
    console.error('[DELETE] Ошибка удаления пользователя:', error);
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

export const createOrderWithOffline = async (userId, totalAmount, pickupAddress, desiredPickupTime, paymentMethod, items) => {
  const database = await getDb();
  if (!database) return { success: false, error: 'База данных недоступна' };

  try {
    const orderId = await createOrder(userId, totalAmount, pickupAddress, desiredPickupTime, paymentMethod, items);
    
    if (orderId) {
      return { success: true, orderId, offline: false };
    } else {
      throw new Error('Не удалось создать заказ');
    }
  } catch (error) {
    console.log('[ORDER] Ошибка онлайн-создания, сохраняем офлайн:', error.message);
    
    try {
      const orderData = JSON.stringify({
        userId,
        totalAmount,
        pickupAddress,
        desiredPickupTime,
        paymentMethod,
        items,
        createdAt: new Date().toISOString()
      });

      const result = await database.runAsync(
        `INSERT INTO offline_orders (user_id, order_data, created_at, synced)
         VALUES (?, ?, datetime('now'), 0)`,
        [userId, orderData]
      );

      return { 
        success: true, 
        offlineId: result.lastInsertRowId,
        offline: true,
        message: 'Заказ сохранён и будет отправлен при подключении к интернету'
      };
    } catch (offlineError) {
      console.error('[OFFLINE] Ошибка сохранения офлайн-заказа:', offlineError);
      return { success: false, error: 'Не удалось сохранить заказ' };
    }
  }
};

export const syncOfflineOrders = async () => {
  const database = await getDb();
  if (!database) return { success: false, error: 'База данных недоступна' };

  try {
    const offlineOrders = await database.getAllAsync(
      'SELECT offline_id, user_id, order_data FROM offline_orders WHERE synced = 0 ORDER BY created_at ASC'
    );

    if (offlineOrders.length === 0) {
      return { success: true, synced: 0 };
    }

    let syncedCount = 0;

    for (const offlineOrder of offlineOrders) {
      try {
        const orderData = JSON.parse(offlineOrder.order_data);
        
        const orderId = await createOrder(
          orderData.userId,
          orderData.totalAmount,
          orderData.pickupAddress,
          orderData.desiredPickupTime,
          orderData.paymentMethod,
          orderData.items
        );

        if (orderId) {
          await database.runAsync(
            'UPDATE offline_orders SET synced = 1 WHERE offline_id = ?',
            [offlineOrder.offline_id]
          );
          syncedCount++;
        }
      } catch (error) {
        console.error('[SYNC] Ошибка синхронизации заказа', offlineOrder.offline_id, error);
      }
    }

    return { success: true, synced: syncedCount, total: offlineOrders.length };
  } catch (error) {
    console.error('[SYNC] Ошибка синхронизации:', error);
    return { success: false, error: error.message };
  }
};

export const getOfflineOrdersCount = async () => {
  const database = await getDb();
  if (!database) return 0;

  try {
    const result = await database.getAllAsync(
      'SELECT COUNT(*) as count FROM offline_orders WHERE synced = 0'
    );
    return result[0]?.count || 0;
  } catch (error) {
    console.error('[OFFLINE] Ошибка получения количества:', error);
    return 0;
  }
};

export const getOfflineOrders = async () => {
  const database = await getDb();
  if (!database) return [];

  try {
    return await database.getAllAsync(
      'SELECT offline_id, user_id, order_data, created_at, synced FROM offline_orders ORDER BY created_at DESC'
    );
  } catch (error) {
    console.error('[OFFLINE] Ошибка получения офлайн-заказов:', error);
    return [];
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
  deleteUserAccount,
  getOrdersByUserId,
  getOrderItems,
  createOrder,
  createOrderWithOffline,
  syncOfflineOrders,
  getOfflineOrdersCount,
  getOfflineOrders,
  updateOrderStatus,
  getPromotions,
  getPopularProducts,
  executeQuery,
};