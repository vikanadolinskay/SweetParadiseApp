// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { getBanners } from '../services/database';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = screenWidth - 32;

// Кэш для баннеров
let bannersCache = null;
let lastFetch = 0;
const CACHE_TTL = 60000;

const getCachedBanners = async () => {
  const now = Date.now();
  if (bannersCache && (now - lastFetch) < CACHE_TTL) {
    return bannersCache;
  }
  bannersCache = await getBanners();
  lastFetch = now;
  return bannersCache;
};

export default function BannerCarousel({ navigation, onBannerPress }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const flatListRef = useRef(null);
  const autoScrollInterval = useRef(null);

  useEffect(() => {
    loadBanners();
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      startAutoScroll();
    }
    return () => stopAutoScroll();
  }, [banners]);

  const loadBanners = async () => {
    setLoading(true);
    const data = await getCachedBanners();
    setBanners(data);
    setLoading(false);
  };

  const startAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    autoScrollInterval.current = setInterval(() => {
      if (banners.length > 0 && !isScrolling) {
        const nextIndex = (currentIndex + 1) % banners.length;
        scrollToIndex(nextIndex);
      }
    }, 4000); // 4 секунды
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  };

  const scrollToIndex = (index) => {
    if (flatListRef.current && banners[index]) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
      });
      setCurrentIndex(index);
    }
  };

  // Исправленная обработка прокрутки
  const onScrollEnd = useCallback((event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    // Вычисляем индекс на основе смещения и ширины экрана
    const index = Math.round(contentOffset.x / screenWidth);
    if (index >= 0 && index < banners.length) {
      setCurrentIndex(index);
    }
    setIsScrolling(false);
    // Возобновляем автопрокрутку через 3 секунды
    setTimeout(() => {
      if (banners.length > 1) {
        startAutoScroll();
      }
    }, 3000);
  }, [banners.length]);

  const onScrollBegin = useCallback(() => {
    setIsScrolling(true);
    stopAutoScroll();
  }, []);

  // Исправленный рендер баннера с градиентом для текста
  const renderBanner = ({ item }) => {
    const imageSource = item.image_source || { uri: item.image_url || 'https://via.placeholder.com/800x400?text=Banner' };
    
    return (
      <TouchableOpacity
        style={styles.bannerContainer}
        onPress={() => handleBannerPress(item)}
        activeOpacity={0.9}
      >
        <Image
          source={imageSource}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        {/* Текст на баннере */}
        {(item.title || item.subtitle) && (
          <View style={styles.bannerOverlay}>
            {item.title && (
              <Text style={styles.bannerTitle} numberOfLines={2}>
                {item.title}
              </Text>
            )}
            {item.subtitle && (
              <Text style={styles.bannerSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
            )}
            {item.button_text && (
              <View style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>{item.button_text}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleBannerPress = (banner) => {
    if (onBannerPress) {
      onBannerPress(banner);
    } else {
      if (banner.link_type === 'category' && banner.link_value) {
        navigation.navigate('Catalog', { category: banner.link_value });
      } else if (banner.link_type === 'promotion' && banner.link_value) {
        navigation.navigate('Promotions');
      }
    }
  };

  // Индикаторы (точки)
  const renderDots = () => {
    if (banners.length <= 1) return null;
    
    return (
      <View style={styles.dotsContainer}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF147A" />
      </View>
    );
  }

  if (!banners.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        keyExtractor={(item, index) => item.banner_id?.toString() || index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={onScrollBegin}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToAlignment="center"
        snapToInterval={screenWidth}
        contentContainerStyle={styles.flatListContent}
        // Важно: убираем лишние отступы
        style={styles.flatList}
        // Для бесконечной прокрутки (опционально)
        // initialScrollIndex={0}
        // getItemLayout={(data, index) => ({
        //   length: screenWidth,
        //   offset: screenWidth * index,
        //   index,
        // })}
      />
      
      {renderDots()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    marginVertical: 8,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  flatList: {
    paddingHorizontal: 0,
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  bannerButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  bannerButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
    width: 20,
  },
  inactiveDot: {
    backgroundColor: '#CCCCCC',
  },
});