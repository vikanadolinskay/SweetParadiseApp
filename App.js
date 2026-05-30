import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
    return ( <
        View style = { styles.container } >
        <
        Text style = { styles.text } > SweetParadise работает! < /Text> <
        /View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#D2691E',
    },
    text: {
        fontSize: 24,
        color: '#fff',
    },
});