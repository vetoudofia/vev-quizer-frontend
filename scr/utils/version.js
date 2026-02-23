import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { STORAGE_KEYS } from './constants';

export const APP_VERSION = '1.0.0';

const STORE_LINKS = {
  android: 'https://play.google.com/store/apps/details?id=com.vevquizer.app',
  ios: 'https://apps.apple.com/app/vev-quizer/id123456789',
};

export const isInGame = async () => {
  try {
    const inGame = await AsyncStorage.getItem(STORAGE_KEYS.IN_GAME);
    return inGame === 'true';
  } catch (error) {
    return false;
  }
};

export const setGameState = async (playing) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.IN_GAME, playing ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting game state:', error);
  }
};

export const checkForUpdates = async (showIfNoUpdate = false) => {
  try {
    const inGame = await isInGame();
    if (inGame) {
      console.log('User in game - skipping update check');
      return;
    }

    const response = await api.get('/version');
    const latestVersion = response.data.version;
    const isForceUpdate = response.data.force || false;
    const updateMessage = response.data.message || 'New version available!';

    if (latestVersion !== APP_VERSION) {
      showUpdatePopup(latestVersion, isForceUpdate, updateMessage);
      return true;
    } else if (showIfNoUpdate) {
      Alert.alert('No Updates', 'You have the latest version!');
    }
    return false;
  } catch (error) {
    console.error('Update check failed:', error);
    return false;
  }
};

const showUpdatePopup = (latestVersion, isForce, message) => {
  Alert.alert(
    '📱 Update Available',
    `${message}\n\nCurrent version: ${APP_VERSION}\nNew version: ${latestVersion}`,
    [
      {
        text: 'Later',
        style: 'cancel',
        onPress: () => {
          if (isForce) {
            setTimeout(() => checkForUpdates(), 5 * 60 * 1000);
          }
        }
      },
      {
        text: 'Update Now',
        onPress: () => {
          const url = Platform.OS === 'ios' ? STORE_LINKS.ios : STORE_LINKS.android;
          Linking.openURL(url);
        }
      }
    ],
    { cancelable: !isForce }
  );
};

export const manualCheckForUpdates = () => {
  checkForUpdates(true);
};