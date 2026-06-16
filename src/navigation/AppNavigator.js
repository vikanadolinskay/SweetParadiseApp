import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Клиентские экраны
import CatalogScreen from '../screens/client/CatalogScreen';
import CartScreen from '../screens/client/CartScreen';
import OrderScreen from '../screens/client/OrderScreen';
import ProfileScreen from '../screens/client/ProfileScreen';
import ProductDetailScreen from '../screens/client/ProductDetailScreen';
import CheckoutScreen from '../screens/client/CheckoutScreen';

// Экран регистрации (переделать в навигатор)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Административные экраны
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminPromotionsScreen from '../screens/admin/AdminPromotionsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Нижняя навигация для клиентов
function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Каталог') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Корзина') iconName = focused ? 'basket' : 'basket-outline';
          else if (route.name === 'Заказы') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Профиль') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF147A',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Каталог" component={CatalogScreen} />
      <Tab.Screen name="Корзина" component={CartScreen} />
      <Tab.Screen name="Заказы" component={OrderScreen} />
      <Tab.Screen name="Профиль" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Нижняя навигация для администратора
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Каталог') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Корзина') iconName = focused ? 'basket' : 'basket-outline';
          else if (route.name === 'Профиль') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Заказы') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Товары') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'Клиенты') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Акции') iconName = focused ? 'pricetag' : 'pricetag-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF147A',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Каталог" component={CatalogScreen} />
      <Tab.Screen name="Корзина" component={CartScreen} />
      <Tab.Screen name="Заказы" component={AdminOrdersScreen} />
      <Tab.Screen name="Товары" component={AdminProductsScreen} />
      <Tab.Screen name="Клиенты" component={AdminUsersScreen} />
      <Tab.Screen name="Акции" component={AdminPromotionsScreen} />
      <Tab.Screen name="Профиль" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ isLoggedIn, onAuthStateChange }) {
  // Если не авторизован — показываем только экраны входа
  if (!isLoggedIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onLogin={onAuthStateChange} />}
        </Stack.Screen>
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  // Если авторизован — показываем основное приложение
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={ClientTabs} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
    </Stack.Navigator>
  );
}