// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { getProducts } from '../../services/database';
import BannerCarousel from '../../components/BannerCarousel';

// Кэш для товаров
let productsCache = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 60 секунд

const getCachedProducts = async () => {
  const now = Date.now();
  if (productsCache && (now - lastFetch) < CACHE_TTL) {
    return productsCache;
  }
  productsCache = await getProducts();
  lastFetch = now;
  return productsCache;
};

const clearCache = () => {
  productsCache = null;
  lastFetch = 0;
};

export default function CatalogScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('default');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const categories = [
    { id: 'all', title: 'Все' },
    { id: 'cakes', title: 'Торты' },
    { id: 'pastries', title: 'Пирожные' },
    { id: 'desserts', title: 'Десерты' },
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [products, selectedCategory, search, sortOrder]);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getCachedProducts();
    setProducts(data);
    setLoading(false);
  };

  const filterAndSort = () => {
    let result = [...products];

    // Фильтр по категории
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Фильтр по поиску
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }

    // Сортировка
    switch (sortOrder) {
      case 'price_asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'discount':
        result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      default:
        result.sort((a, b) => a.product_id - b.product_id);
    }

    setFiltered(result);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearCache();
    await loadProducts();
    setRefreshing(false);
  }, []);

  const getFinalPrice = (product) => {
    if (product.discount && product.discount > 0) {
      return product.price * (100 - product.discount) / 100;
    }
    return product.price;
  };

  const handleAddToCart = (product) => {
    alert(`🍰 ${product.name} добавлен в корзину!`);
  };

  const renderProduct = ({ item }) => {
    const finalPrice = getFinalPrice(item);
    // Используем изображение из БД или заглушку
    const imageUrl = item.image_url || 'https://via.placeholder.com/150?text=No+Image';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
        activeOpacity={0.8}
      >
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <View style={styles.cardContent}>
          {/* Название торта */}
          <Text style={styles.name}>{item.name}</Text>
          
          {/* Начинка (если есть) */}
          {item.filling && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Начинка:</Text>
              <Text style={styles.detailValue}>{item.filling}</Text>
            </View>
          )}
          
          {/* Декор (если есть) */}
          {item.decor && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Декор:</Text>
              <Text style={styles.detailValue}>{item.decor}</Text>
            </View>
          )}
          
          {/* Калории (если есть) */}
          {item.calories && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Калории:</Text>
              <Text style={styles.detailValue}>{item.calories} ккал</Text>
            </View>
          )}
          
          {/* Цена */}
          <View style={styles.priceRow}>
            {item.discount && item.discount > 0 ? (
              <>
                <Text style={styles.oldPrice}>{item.price} ₽</Text>
                <Text style={styles.price}>{Math.round(finalPrice)} ₽</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{item.discount}%</Text>
                </View>
              </>
            ) : (
              <Text style={styles.price}>{item.price} ₽</Text>
            )}
          </View>
          
          {/* Кнопка добавления в корзину */}
          <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
            <Text style={styles.addButtonText}>В корзину</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextActive]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const handleSort = (order) => {
    setSortOrder(order);
    setShowSortMenu(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingText}>Загрузка товаров...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Шапка с названием и контактами (как на изображении) */}
      <View style={styles.header}>
        <Text style={styles.logo}>Weddingcake</Text>
        <Text style={styles.clientMark}>Клиентская компания</Text>
        <Text style={styles.phone}>00 123 456 789</Text>
        <Text style={styles.website}>www.yourwebsite.com</Text>
      </View>

      {/* Баннер - карусель */}
      <BannerCarousel navigation={navigation} />

      {/* Поиск */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск десертов..."
          placeholderTextColor="#828282"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Категории */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoriesList}
      />

      {/* Сортировка */}
      <View style={styles.sortContainer}>
        <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortMenu(!showSortMenu)}>
          <Text style={styles.sortButtonText}>
            {sortOrder === 'default' && 'Сортировка ▼'}
            {sortOrder === 'price_asc' && 'Сначала дешевле ▼'}
            {sortOrder === 'price_desc' && 'Сначала дороже ▼'}
            {sortOrder === 'discount' && 'По скидке ▼'}
          </Text>
        </TouchableOpacity>
        {showSortMenu && (
          <View style={styles.sortMenu}>
            <TouchableOpacity style={styles.sortMenuItem} onPress={() => handleSort('default')}>
              <Text style={styles.sortMenuItemText}>По умолчанию</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortMenuItem} onPress={() => handleSort('price_asc')}>
              <Text style={styles.sortMenuItemText}>Сначала дешевле</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortMenuItem} onPress={() => handleSort('price_desc')}>
              <Text style={styles.sortMenuItemText}>Сначала дороже</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortMenuItem} onPress={() => handleSort('discount')}>
              <Text style={styles.sortMenuItemText}>По размеру скидки</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Список товаров */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.product_id?.toString() || item.id?.toString()}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF69B4']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>😔 Ничего не найдено</Text>
          </View>
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C2C2C',
    letterSpacing: 0.5,
  },
  clientMark: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  phone: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C2C2C',
    marginTop: 8,
  },
  website: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999999',
  },
  searchContainer: {
    backgroundColor: '#F8F8F8',
    margin: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchInput: {
    fontSize: 16,
    padding: 12,
    paddingHorizontal: 16,
    color: '#2C2C2C',
  },
  categoriesList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
  },
  categoryChipActive: {
    backgroundColor: '#FF69B4',
  },
  categoryText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    position: 'relative',
    zIndex: 10,
  },
  sortButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF69B4',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#FF69B4',
    fontWeight: '500',
  },
  sortMenu: {
    position: 'absolute',
    top: 35,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
    minWidth: 160,
  },
  sortMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sortMenuItemText: {
    fontSize: 14,
    color: '#2C2C2C',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 11,
    color: '#999999',
    width: 55,
  },
  detailValue: {
    fontSize: 11,
    color: '#666666',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    marginBottom: 8,
  },
  oldPrice: {
    fontSize: 13,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF69B4',
  },
  discountBadge: {
    backgroundColor: '#FFE4E1',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  discountText: {
    fontSize: 10,
    color: '#FF69B4',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
  },
});