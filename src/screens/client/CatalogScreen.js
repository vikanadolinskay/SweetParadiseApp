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
} from 'react-native';
import { getProducts } from '../../services/database';

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
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
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
    alert(`Товар ${product.name} добавлен в корзину`);
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
        <ActivityIndicator size="large" color="#FF147A" />
        <Text style={styles.loadingText}>Загрузка товаров...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Шапка с названием и контактами (как на изображении) */}
      <View style={styles.header}>
        <Text style={styles.logo}>Weddingcake</Text>
        <Text style={styles.clientMark}>Клиентская марка</Text>
        <Text style={styles.phone}>00 123 456 789</Text>
        <Text style={styles.website}>www.yourwebsite.com</Text>
      </View>

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
          <Text style={styles.sortButtonText}>Сортировка ▼</Text>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF147A']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Ничего не найдено</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Стили шапки (как на изображении)
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clientMark: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  phone: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  website: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#828282',
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#F5F5F5',
    margin: 10,
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 16,
    padding: 10,
    color: '#333',
  },
  categoriesList: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E6E6E6',
    marginHorizontal: 4,
  },
  categoryChipActive: {
    backgroundColor: '#FF147A',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 8,
    position: 'relative',
  },
  sortButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF147A',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#FF147A',
  },
  sortMenu: {
    position: 'absolute',
    top: 35,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  sortMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortMenuItemText: {
    fontSize: 14,
    color: '#333',
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    width: 55,
  },
  detailValue: {
    fontSize: 12,
    color: '#555',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    marginBottom: 6,
  },
  oldPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF147A',
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
    color: '#FF147A',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#FF147A',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});