// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getProducts, addToCart, getBanners, getCartItems } from '../../services/database';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const BANNER_HEIGHT = 180;

let productsCache = null;
let lastFetch = 0;
const CACHE_TTL = 60000;

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

const getFirstSentence = (description) => {
  if (!description) return '';
  const firstSentence = description.split(/[.!?]/)[0];
  return firstSentence.trim();
};

export default function CatalogScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [userId, setUserId] = useState(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const flatListRef = useRef(null);
  const autoScrollInterval = useRef(null);

  const categories = [
    { id: 'all', title: 'Все' },
    { id: 'cakes', title: 'Торты' },
    { id: 'pastries', title: 'Пирожные' },
    { id: 'desserts', title: 'Десерты' },
  ];

  const sortOptions = [
    { id: 'default', title: 'По умолчанию' },
    { id: 'price_asc', title: 'Сначала дешевле' },
    { id: 'price_desc', title: 'Сначала дороже' },
    { id: 'discount', title: 'По размеру скидки' },
  ];

  useEffect(() => {
    const getUserId = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserId(user.user_id);
      }
    };
    getUserId();
    loadBanners();
    loadProducts();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [products, selectedCategory, search, sortOrder]);

  useEffect(() => {
    if (banners.length > 1) {
      startAutoScroll();
    }
    return () => stopAutoScroll();
  }, [banners]);

  const startAutoScroll = () => {
    if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
    autoScrollInterval.current = setInterval(() => {
      if (banners.length > 0) {
        const nextIndex = (currentBannerIndex + 1) % banners.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setCurrentBannerIndex(nextIndex);
      }
    }, 5000);
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  };

  const loadBanners = async () => {
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error loading banners:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    const data = await getCachedProducts();
    setProducts(data);
    setLoading(false);
  };

  const filterAndSort = () => {
    let result = [...products];

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }

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
    await loadBanners();
    setRefreshing(false);
  }, []);

  const handleAddToCart = async (product) => {
    if (!userId) {
      Alert.alert('Ошибка', 'Пожалуйста, войдите в аккаунт');
      navigation.navigate('Login');
      return;
    }
    
    try {
      await addToCart(userId, product.product_id, 1, null);
      Alert.alert('Добавлено', `${product.name} добавлен в корзину`);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить товар в корзину');
    }
  };

  const renderBanner = ({ item }) => {
    const imageSource = item.image_source || { uri: item.image_url || 'https://via.placeholder.com/800x200' };
    
    return (
      <TouchableOpacity
        style={styles.bannerContainer}
        onPress={() => {
          if (item.link_type === 'category' && item.link_value) {
            setSelectedCategory(item.link_value);
          }
        }}
        activeOpacity={0.9}
      >
        <Image source={imageSource} style={styles.bannerImage} resizeMode="cover" />
      </TouchableOpacity>
    );
  };

  const renderProduct = ({ item }) => {
    const imageSource = item.image_source || { uri: 'https://via.placeholder.com/150?text=No+Image' };
    const shortDescription = getFirstSentence(item.description);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
        activeOpacity={0.95}
      >
        <Image source={imageSource} style={styles.image} />
        <View style={styles.cardContent}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          
          {shortDescription && (
            <Text style={styles.description} numberOfLines={2}>
              {shortDescription}
            </Text>
          )}
          
          <Text style={styles.calories}>{item.calories || 0} ккал</Text>
          
          <View style={styles.bottomRow}>
            <Text style={styles.price}>{item.price} ₽</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text 
        style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextActive]}
        numberOfLines={1}
      >
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
      {/* Розовый верх с поиском - без стрелки */}
      <LinearGradient
        colors={['#FFBCD9', '#FFCBBB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowSortMenu(true)}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Баннеры */}
      {banners.length > 0 && (
        <View style={styles.bannerWrapper}>
          <FlatList
            ref={flatListRef}
            data={banners}
            renderItem={renderBanner}
            keyExtractor={(item) => item.banner_id?.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={width}
            decelerationRate="fast"
            onScroll={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentBannerIndex(index);
            }}
            onScrollBeginDrag={stopAutoScroll}
            onScrollEndDrag={startAutoScroll}
          />
          <View style={styles.dotContainer}>
            {banners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentBannerIndex === index ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Категории */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoriesList}
      />

      {/* Список товаров - сетка 2 колонки */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.product_id?.toString() || item.id?.toString()}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSortMenu}
        onRequestClose={() => setShowSortMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowSortMenu(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Сортировка</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.modalOption,
                  sortOrder === option.id && styles.modalOptionActive
                ]}
                onPress={() => handleSort(option.id)}
              >
                <Text style={[
                  styles.modalOptionText,
                  sortOrder === option.id && styles.modalOptionTextActive
                ]}>
                  {option.title}
                </Text>
                {sortOrder === option.id && (
                  <Ionicons name="checkmark" size={18} color="#FF147A" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    fontFamily: 'Poppins-Regular',
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
  },
  bannerWrapper: {
    marginTop: 8,
    marginBottom: 4,
  },
  bannerContainer: {
    width: width,
    height: BANNER_HEIGHT,
    paddingHorizontal: 16,
  },
  bannerImage: {
    width: width - 32,
    height: BANNER_HEIGHT,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FF147A',
    width: 16,
  },
  inactiveDot: {
    backgroundColor: '#CCCCCC',
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#FF147A',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8F8F8',
  },
  cardContent: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  calories: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2C2C',
    fontFamily: 'Poppins-Bold',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF147A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionActive: {
    backgroundColor: '#FFF0F5',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#666',
  },
  modalOptionTextActive: {
    color: '#FF147A',
    fontWeight: '600',
  },
});