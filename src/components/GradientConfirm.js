// src/components/GradientConfirm.js
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

let confirmInstance = null;

export const showGradientConfirm = ({ title, message, onConfirm, onCancel }) => {
  if (confirmInstance) {
    confirmInstance.show({ title, message, onConfirm, onCancel });
  }
};

export default function GradientConfirmProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [onConfirmCallback, setOnConfirmCallback] = useState(null);
  const [onCancelCallback, setOnCancelCallback] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    confirmInstance = { show };
    return () => {
      confirmInstance = null;
    };
  }, []);

  const show = ({ title, message, onConfirm, onCancel }) => {
    setTitle(title);
    setMessage(message);
    setOnConfirmCallback(() => onConfirm);
    setOnCancelCallback(() => onCancel);
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
      setOnConfirmCallback(null);
      setOnCancelCallback(null);
    });
  };

  const handleConfirm = () => {
    if (onConfirmCallback) onConfirmCallback();
    hide();
  };

  const handleCancel = () => {
    if (onCancelCallback) onCancelCallback();
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
              <Ionicons name="help-circle" size={40} color="#fff" />
              <Text style={styles.alertTitle}>{title}</Text>
              <Text style={styles.alertMessage}>{message}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                  <Text style={styles.confirmButtonText}>Удалить</Text>
                </TouchableOpacity>
              </View>
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF147A',
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});