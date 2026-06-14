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
      if (banners.length > 0) {
        const nextIndex = (currentIndex + 1) % banners.length;
        scrollToIndex(nextIndex);
      }
    }, 5000);
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

  const onScrollEnd = useCallback((event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / screenWidth);
    setCurrentIndex(index);
  }, []);

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
      </TouchableOpacity>
    );
  };

  const renderDot = (index) => {
    const isActive = index === currentIndex;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          isActive ? styles.activeDot : styles.inactiveDot,
        ]}
      />
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
        keyExtractor={(item) => item.banner_id?.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScrollEnd}
        onScrollBeginDrag={stopAutoScroll}
        onScrollEndDrag={startAutoScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContent}
      />
      
      {banners.length > 1 && (
        <View style={styles.dotsContainer}>
          {banners.map((_, index) => renderDot(index))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    marginVertical: 10,
    borderRadius: 12,
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
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
    height: 180,
    backgroundColor: '#E0E0E0',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
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