import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import CatalogScreen from '../screens/client/CatalogScreen';
import CartScreen from '../screens/client/CartScreen';
import ProfileScreen from '../screens/client/ProfileScreen';
import OrderScreen from '../screens/client/OrderScreen';
import ProductDetailScreen from '../screens/client/ProductDetailScreen';
import CustomizeScreen1 from '../screens/client/CustomizeScreen1';
import CustomizeScreen2 from '../screens/client/CustomizeScreen2';
import CustomizeScreen3 from '../screens/client/CustomizeScreen3';
import CustomizeScreen4 from '../screens/client/CustomizeScreen4';
import CheckoutScreen from '../screens/client/CheckoutScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const EmptyScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Экран {route.name} в разработке</Text>
  </View>
);

const ClientTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Каталог') iconName = 'menu-book';
          else if (route.name === 'Корзина') iconName = 'shopping-cart';
          else if (route.name === 'Заказы') iconName = 'list-alt';
          else if (route.name === 'Профиль') iconName = 'person';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#D2691E',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#D2691E' },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen name="Каталог" component={CatalogScreen} />
      <Tab.Screen name="Корзина" component={CartScreen} />
      <Tab.Screen name="Заказы" component={OrderScreen} />
      <Tab.Screen name="Профиль" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ClientTabs" 
          component={ClientTabs} 
          options={{ headerShown: false }} 
        />

        {/* Добавленные экраны для навигации */}
        <Stack.Screen 
          name="ProductDetail" 
          component={ProductDetailScreen} 
          options={{ title: 'Детали товара' }} 
        />
        <Stack.Screen 
          name="Customize1" 
          component={CustomizeScreen1} 
          options={{ title: 'Выбор формы' }} 
        />
        <Stack.Screen 
          name="Customize2" 
          component={CustomizeScreen2} 
          options={{ title: 'Выбор размера' }} 
        />
        <Stack.Screen 
          name="Customize3" 
          component={CustomizeScreen3} 
          options={{ title: 'Выбор начинки' }} 
        />
        <Stack.Screen 
          name="Customize4" 
          component={CustomizeScreen4} 
          options={{ title: 'Выбор декора' }} 
        />
        <Stack.Screen 
          name="Checkout" 
          component={CheckoutScreen} 
          options={{ title: 'Оформление заказа' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}