// src/components/GradientAlert.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

let alertInstance = null;

export const showGradientAlert = ({ title, message, onOk }) => {
  if (alertInstance) {
    alertInstance.show({ title, message, onOk });
  }
};

export default function GradientAlertProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [onOkCallback, setOnOkCallback] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    alertInstance = { show };
    return () => {
      alertInstance = null;
    };
  }, []);

  const show = ({ title, message, onOk }) => {
    setTitle(title);
    setMessage(message);
    setOnOkCallback(() => onOk);
    setVisible(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hide = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setTitle('');
      setMessage('');
      setOnOkCallback(null);
    });
  };

  const handleOk = () => {
    if (onOkCallback) onOkCallback();
    hide();
  };

  return (
    <>
      {children}
      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
        onRequestClose={hide}
      >
        <View style={styles.overlay}>
          <Animated.View style={[styles.alertContainer, { opacity }]}>
            <LinearGradient
              colors={['#FFBCD9', '#FFCBBB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.alertGradient}
            >
              {title === 'Успешно' && (
                <Ionicons name="checkmark-circle" size={40} color="#fff" />
              )}
              {title === 'Ошибка' && (
                <Ionicons name="alert-circle" size={40} color="#fff" />
              )}
              {title === 'Добавлено' && (
                <Ionicons name="cart" size={40} color="#fff" />
              )}
              {title === 'Удаление' && (
                <Ionicons name="trash-bin" size={40} color="#fff" />
              )}
              <Text style={styles.alertTitle}>{title}</Text>
              <Text style={styles.alertMessage}>{message}</Text>
              <TouchableOpacity style={styles.okButton} onPress={handleOk}>
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  alertGradient: {
    padding: 24,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  okButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 25,
  },
  okButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});