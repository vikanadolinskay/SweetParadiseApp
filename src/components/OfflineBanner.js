import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getConnectionStatus } from '../services/NetworkService';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const check = async () => {
      const connected = await getConnectionStatus();
      setIsOffline(!connected);
    };
    check();

    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="wifi-outline" size={16} color="#fff" />
      <Text style={styles.text}>Нет подключения к интернету</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
});