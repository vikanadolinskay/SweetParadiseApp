import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { showGradientAlert } from '../../components/GradientAlert';

const sizes = [
  { id: 'small', name: 'Маленький (1-2 кг)', price: 0, kg: 1.5 },
  { id: 'medium', name: 'Средний (2-3 кг)', price: 500, kg: 2.5 },
  { id: 'large', name: 'Большой (3-5 кг)', price: 1000, kg: 4 },
  { id: 'family', name: 'Семейный (5-7 кг)', price: 1800, kg: 6 },
];

export default function CustomizeScreen2({ route, navigation }) {
  const { product, customization, totalExtra } = route.params;
  const [selected, setSelected] = useState(null);

  const handleNext = () => {
    if (!selected) {
      showGradientAlert({ 
        title: 'Ошибка', 
        message: 'Выберите размер' 
      });
      return;
    }
    navigation.navigate('Customize3', {
      product,
      customization: { ...customization, size: selected },
      totalExtra: totalExtra + selected.price,
    });
  };

  return (
    <View style={styles.container}>
      {/* Заголовок со стрелкой назад */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Выбор размера</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.title}>Выберите размер</Text>
      
      <FlatList
        data={sizes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.option, selected?.id === item.id && styles.selected]}
            onPress={() => setSelected(item)}
          >
            <View>
              <Text style={styles.optionName}>{item.name}</Text>
              <Text style={styles.optionSub}>{item.kg} кг</Text>
            </View>
            <Text style={styles.optionPrice}>
              {item.price === 0 ? 'Базовая' : `+${item.price} ₽`}
            </Text>
          </TouchableOpacity>
        )}
      />
      
      {/* Градиентная кнопка Далее */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <LinearGradient
          colors={['#FFBCD9', '#FFCBBB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.nextGradient}
        >
          <Text style={styles.nextButtonText}>Далее →</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    backgroundColor: '#FFBCD9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -16,
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 20, 
    color: '#2C2C2C',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 10,
  },
  selected: { 
    backgroundColor: '#FFE4E1', 
    borderWidth: 1.5, 
    borderColor: '#FF147A' 
  },
  optionName: { 
    fontSize: 14, 
    color: '#2C2C2C',
    fontFamily: 'Poppins-Regular',
  },
  optionSub: { 
    fontSize: 12, 
    color: '#999', 
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  optionPrice: { 
    fontSize: 12, 
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  nextButton: {
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});