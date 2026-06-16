// src/navigation/index.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

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
  if (!focused) {
    return <Ionicons name={name} size={size} color="#CCCCCC" />;
  }
  return (
    <LinearGradient
      colors={['#FFBCD9', '#FFCBBB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ padding: 0 }}
    >
      <Ionicons name={name} size={size} color="#fff" />
    </LinearGradient>
  );
};

const ClientTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let iconName;
          if (route.name === 'Каталог') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Корзина') iconName = focused ? 'basket' : 'basket-outline';
          else if (route.name === 'Заказы') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Профиль') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={focused ? '#FF147A' : '#CCCCCC'} />;
        },
        tabBarActiveTintColor: '#FF147A',
        tabBarInactiveTintColor: '#CCCCCC',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#EEEEEE',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Poppins-Regular',
        },
      })}
    >
      <Tab.Screen name="Каталог" component={CatalogScreen} />
      <Tab.Screen name="Корзина" component={CartScreen} />
      <Tab.Screen name="Заказы" component={OrderScreen} />
      <Tab.Screen name="Профиль" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default function AppNavigator({ isLoggedIn, onAuthStateChange }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? "ClientTabs" : "Login"} screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={onAuthStateChange} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="ClientTabs" component={ClientTabs} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Customize1" component={CustomizeScreen1} />
            <Stack.Screen name="Customize2" component={CustomizeScreen2} />
            <Stack.Screen name="Customize3" component={CustomizeScreen3} />
            <Stack.Screen name="Customize4" component={CustomizeScreen4} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}