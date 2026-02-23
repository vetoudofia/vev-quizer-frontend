import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

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
    deviceId = `${Device.brand || 'unknown'}_${Device.modelName || 'unknown'}_${Date.now()}`;
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