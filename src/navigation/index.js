import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Временные заглушки для экранов (пока нет файлов)
const CatalogScreen = () => null;
const CartScreen = () => null;
const ProfileScreen = () => null;
const OrderScreen = () => null;
const LoginScreen = () => null;
const RegisterScreen = () => null;

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const ClientTabs = () => ( <
    Tab.Navigator screenOptions = {
        ({ route }) => ({
            tabBarIcon: ({ color, size }) => {
                let iconName;
                if (route.name === 'Каталог') iconName = 'menu-book';
                else if (route.name === 'Корзина') iconName = 'shopping-cart';
                else if (route.name === 'Заказы') iconName = 'list-alt';
                else if (route.name === 'Профиль') iconName = 'person';
                return <Icon name = { iconName }
                size = { size }
                color = { color }
                />;
            },
            tabBarActiveTintColor: '#D2691E',
            headerStyle: { backgroundColor: '#D2691E' },
            headerTintColor: '#fff',
        })
    } >
    <
    Tab.Screen name = "Каталог"
    component = { CatalogScreen }
    /> <
    Tab.Screen name = "Корзина"
    component = { CartScreen }
    /> <
    Tab.Screen name = "Заказы"
    component = { OrderScreen }
    /> <
    Tab.Screen name = "Профиль"
    component = { ProfileScreen }
    /> <
    /Tab.Navigator>
);

export default function AppNavigator() {
    return ( <
        NavigationContainer >
        <
        Stack.Navigator initialRouteName = "Login" >
        <
        Stack.Screen name = "Login"
        component = { LoginScreen }
        options = {
            { headerShown: false } }
        /> <
        Stack.Screen name = "Register"
        component = { RegisterScreen }
        options = {
            { headerShown: false } }
        /> <
        Stack.Screen name = "ClientTabs"
        component = { ClientTabs }
        options = {
            { headerShown: false } }
        /> <
        /Stack.Navigator> <
        /NavigationContainer>
    );
}