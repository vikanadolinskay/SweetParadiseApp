// src/navigation/index.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';

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

// Градиентная иконка
const GradientIcon = ({ name, size, focused }) => {
  const IconComponent = require('react-native-vector-icons/MaterialIcons').default;
  return (
    <LinearGradient
      colors={['#FFBCD9', '#FFCBBB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ padding: 0 }}
    >
      <IconComponent name={name} size={size} color="#fff" />
    </LinearGradient>
  );
};

const ClientTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let iconName;
          if (route.name === 'Каталог') iconName = 'menu-book';
          else if (route.name === 'Корзина') iconName = 'shopping-cart';
          else if (route.name === 'Заказы') iconName = 'list-alt';
          else if (route.name === 'Профиль') iconName = 'person';
          
          // Активная иконка - градиентная, неактивная - серая
          if (focused) {
            return <GradientIcon name={iconName} size={24} focused={true} />;
          } else {
            const IconComponent = require('react-native-vector-icons/MaterialIcons').default;
            return <IconComponent name={iconName} size={24} color="#CCCCCC" />;
          }
        },
        tabBarActiveTintColor: '#FF147A',
        tabBarInactiveTintColor: '#CCCCCC',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 203, 187, 0.5)', // полупрозрачный #FFCBBB
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Poppins-Regular',
        },
        tabBarActiveBackgroundColor: 'rgba(200, 200, 200, 0.3)', // серый прозрачный прямоугольник вокруг активной иконки
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
        <Stack.Screen 
          name="ProductDetail" 
          component={ProductDetailScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Customize1" 
          component={CustomizeScreen1} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Customize2" 
          component={CustomizeScreen2} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Customize3" 
          component={CustomizeScreen3} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Customize4" 
          component={CustomizeScreen4} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Checkout" 
          component={CheckoutScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}