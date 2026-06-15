// navigation/AppNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../components/ProtectedRoute';

// Клиентские экраны
import MainScreen from '../screens/client/MainScreen';
import CartScreen from '../screens/client/CartScreen';
import ProfileScreen from '../screens/client/ProfileScreen';

// Административные экраны
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminPromotionsScreen from '../screens/admin/AdminPromotionsScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { user, isAdmin } = useAuth();

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
      {/* Всегда доступные вкладки */}
      <Tab.Screen name="Каталог" component={MainScreen} />
      <Tab.Screen name="Корзина" component={CartScreen} />
      <Tab.Screen name="Профиль" component={ProfileScreen} />

      {/* Админские вкладки (только для admin) */}
      {isAdmin && (
        <>
          <Tab.Screen name="Заказы" component={AdminOrdersScreen} />
          <Tab.Screen name="Товары" component={AdminProductsScreen} />
          <Tab.Screen name="Клиенты" component={AdminUsersScreen} />
          <Tab.Screen name="Акции" component={AdminPromotionsScreen} />
        </>
      )}
    </Tab.Navigator>
  );
}