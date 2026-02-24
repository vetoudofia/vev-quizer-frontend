import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dynamically import expo-device only on Android
let Device;
if (Platform.OS === 'android') {
  Device = require('expo-device');
} else {
  // Mock for iOS (device fingerprinting not needed)
  Device = {
    brand: 'Apple',
    modelName: 'iPhone',
    deviceName: 'iPhone'
  };
}

const BASE_URL = 'https://vev-squizer-backend.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

const getDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem('deviceId');
  if (!deviceId) {
    if (Platform.OS === 'android') {
      deviceId = `${Device.brand || 'unknown'}_${Device.modelName || 'unknown'}_${Date.now()}`;
    } else {
      deviceId = `ios_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
    await AsyncStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const deviceId = await getDeviceId();
    config.headers['X-Device-ID'] = deviceId;
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
    }
    return Promise.reject(error);
  }
);

export default api;