import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { executeQuery, getProducts } from '../../services/database';
import { LinearGradient } from 'expo-linear-gradient';

const CATEGORIES = ['cakes', 'pastries', 'desserts', 'cookies'];

export default function AdminProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: 'cakes',
    is_available: 1, is_customizable: 0, discount: 0,
    calories: '', weight: ''
  });

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  const saveProduct = async () => {
    if (!form.name || !form.price) {
      Alert.alert('Ошибка', 'Заполните название и цену');
      return;
    }

    if (editingProduct) {
      await executeQuery(
        `UPDATE products SET name=?, description=?, price=?, category=?, 
         is_available=?, is_customizable=?, discount=?, calories=?, weight=? WHERE product_id=?`,
        [form.name, form.description, form.price, form.category,
         form.is_available, form.is_customizable, form.discount, form.calories, form.weight, editingProduct.product_id]
      );
    } else {
      await executeQuery(
        `INSERT INTO products (name, description, price, category, is_available, is_customizable, discount, calories, weight)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [form.name, form.description, form.price, form.category,
         form.is_available, form.is_customizable, form.discount, form.calories, form.weight]
      );
    }
    setModalVisible(false);
    setEditingProduct(null);
    setForm({ name: '', description: '', price: '', category: 'cakes', is_available: 1, is_customizable: 0, discount: 0, calories: '', weight: '' });
    loadProducts();
  };

  const deleteProduct = (productId) => {
    Alert.alert('Удаление', 'Удалить товар?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Да', onPress: async () => {
        await executeQuery('DELETE FROM products WHERE product_id = ?', [productId]);
        loadProducts();
      }}
    ]);
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price} ₽</Text>
        <View style={styles.productBadges}>
          <View style={[styles.badge, item.is_available ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.badgeText}>{item.is_available ? 'В наличии' : 'Нет в наличии'}</Text>
          </View>
          {item.is_customizable === 1 && (
            <View style={[styles.badge, styles.customizableBadge]}>
              <Text style={styles.badgeText}>Настраиваемый</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => {
          setEditingProduct(item);
          setForm({
            name: item.name, description: item.description || '',
            price: String(item.price), category: item.category,
            is_available: item.is_available, is_customizable: item.is_customizable,
            discount: item.discount, calories: String(item.calories || ''), weight: String(item.weight || '')
          });
          setModalVisible(true);
        }}>
          <Ionicons name="create-outline" size={22} color="#FF147A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteProduct(item.product_id)}>
          <Ionicons name="trash-outline" size={22} color="#FF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#FF147A" style={styles.center} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Управление товарами</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => {
          setEditingProduct(null);
          setForm({ name: '', description: '', price: '', category: 'cakes', is_available: 1, is_customizable: 0, discount: 0, calories: '', weight: '' });
          setModalVisible(true);
        }}>
          <LinearGradient colors={['#FFBCD9', '#FFCBBB']} style={styles.addGradient}>
            <Text style={styles.addBtnText}>+ Добавить</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={item => item.product_id.toString()}
        contentContainerStyle={styles.list}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Редактировать товар' : 'Новый товар'}
            </Text>

            <TextInput style={styles.input} placeholder="Название" value={form.name} onChangeText={t => setForm({...form, name: t})} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Описание" multiline value={form.description} onChangeText={t => setForm({...form, description: t})} />
            <TextInput style={styles.input} placeholder="Цена" keyboardType="numeric" value={String(form.price)} onChangeText={t => setForm({...form, price: t})} />
            <TextInput style={styles.input} placeholder="Калорийность (ккал)" keyboardType="numeric" value={String(form.calories)} onChangeText={t => setForm({...form, calories: t})} />
            <TextInput style={styles.input} placeholder="Вес (г)" keyboardType="numeric" value={String(form.weight)} onChangeText={t => setForm({...form, weight: t})} />

            <Text style={styles.label}>Категория:</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} style={[styles.categoryBtn, form.category === cat && styles.categoryActive]} onPress={() => setForm({...form, category: cat})}>
                  <Text style={[styles.categoryText, form.category === cat && styles.categoryTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text>В наличии:</Text>
              <TouchableOpacity onPress={() => setForm({...form, is_available: form.is_available ? 0 : 1})}>
                <View style={[styles.switch, form.is_available && styles.switchActive]}>
                  <Text style={styles.switchText}>{form.is_available ? 'Да' : 'Нет'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.switchRow}>
              <Text>Персонализация:</Text>
              <TouchableOpacity onPress={() => setForm({...form, is_customizable: form.is_customizable ? 0 : 1})}>
                <View style={[styles.switch, form.is_customizable && styles.switchActive]}>
                  <Text style={styles.switchText}>{form.is_customizable ? 'Да' : 'Нет'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Скидка %" keyboardType="numeric" value={String(form.discount)} onChangeText={t => setForm({...form, discount: t})} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelModalText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={saveProduct}>
                <Text style={styles.saveModalText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FF147A' },
  addBtn: { borderRadius: 20, overflow: 'hidden' },
  addGradient: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  list: { padding: 12 },
  productCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  productPrice: { fontSize: 14, color: '#FF147A', fontWeight: '500', marginBottom: 6 },
  productBadges: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  activeBadge: { backgroundColor: '#E8F5E9' },
  inactiveBadge: { backgroundColor: '#FFEBEE' },
  customizableBadge: { backgroundColor: '#E3F2FD' },
  badgeText: { fontSize: 10, color: '#666' },
  productActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editBtn: { padding: 6 },
  deleteBtn: { padding: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalContent: { backgroundColor: '#fff', margin: 20, borderRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FF147A', textAlign: 'center', marginBottom: 16 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 8 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5' },
  categoryActive: { backgroundColor: '#FF147A' },
  categoryText: { color: '#666' },
  categoryTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switch: { width: 50, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center' },
  switchActive: { backgroundColor: '#FF147A' },
  switchText: { fontSize: 12, color: '#666' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelModalBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center' },
  cancelModalText: { color: '#666' },
  saveModalBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#FF147A', alignItems: 'center' },
  saveModalText: { color: '#fff', fontWeight: '600' },
});