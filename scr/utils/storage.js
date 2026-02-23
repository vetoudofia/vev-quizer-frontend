import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

class StorageManager {
  // User Data
  async setUserToken(token) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
    } catch (error) {
      console.error('Error saving user token:', error);
    }
  }

  async getUserToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    } catch (error) {
      console.error('Error getting user token:', error);
      return null;
    }
  }

  async setUserData(userData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  async getUserData() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async updateUserData(updates) {
    try {
      const currentData = await this.getUserData();
      const newData = { ...currentData, ...updates };
      await this.setUserData(newData);
      return newData;
    } catch (error) {
      console.error('Error updating user data:', error);
      return null;
    }
  }

  // Settings
  async setSettings(settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  async getSettings() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return data ? JSON.parse(data) : {
        soundFX: true,
        backgroundMusic: true,
        darkMode: false,
        notifications: true,
        autoSave: true,
        showTutorial: true,
        vibration: true
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  }

  async updateSettings(updates) {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...updates };
      await this.setSettings(newSettings);
      return newSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      return null;
    }
  }

  // Transactions
  async addTransaction(transaction) {
    try {
      const transactions = await this.getTransactions();
      const newTransactions = [transaction, ...(transactions || [])];
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTransactions));
      return newTransactions;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return null;
    }
  }

  async getTransactions() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  // Game History
  async addGameToHistory(game) {
    try {
      const history = await this.getGameHistory();
      const newHistory = [game, ...(history || [])];
      await AsyncStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(newHistory));
      return newHistory;
    } catch (error) {
      console.error('Error adding game to history:', error);
      return null;
    }
  }

  async getGameHistory() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting game history:', error);
      return [];
    }
  }

  async getGameByCode(gameCode) {
    try {
      const history = await this.getGameHistory();
      return history.find(game => game.gameCode === gameCode) || null;
    } catch (error) {
      console.error('Error finding game:', error);
      return null;
    }
  }

  // Device ID
  async getOrCreateDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return this.generateDeviceId();
    }
  }

  generateDeviceId() {
    return 'DEV-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Clear all data (logout)
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Clear cache (keep user data)
  async clearCache() {
    try {
      // Don't remove user data, just temporary stuff
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.includes('cache') || 
        key.includes('temp') ||
        key === STORAGE_KEYS.GAME_HISTORY
      );
      await AsyncStorage.multiRemove(cacheKeys);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  // Export all data
  async exportAllData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data = {};
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        data[key] = JSON.parse(value);
      }
      
      return data;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  // Get storage size
  async getStorageSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        totalSize += (key.length + (value?.length || 0)) * 2; // Approximate bytes
      }
      
      return {
        items: keys.length,
        size: totalSize,
        sizeFormatted: this.formatBytes(totalSize)
      };
    } catch (error) {
      console.error('Error getting storage size:', error);
      return null;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
const storage = new StorageManager();
export default storage;