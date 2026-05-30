import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import AppNavigator from './src/navigation';

export default function App() {
    return ( <
        >
        <
        StatusBar barStyle = "light-content"
        backgroundColor = "#D2691E" / >
        <
        SafeAreaView style = {
            { flex: 1, backgroundColor: '#D2691E' } } >
        <
        AppNavigator / >
        <
        /SafeAreaView> <
        />
    );
}