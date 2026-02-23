import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SoundManager {
  constructor() {
    this.sounds = {};
    this.settings = { soundFX: true };
    this.loadSettings();
    this.preloadSounds();
  }

  // Preload all sound effects (NO BACKGROUND MUSIC)
  preloadSounds = async () => {
    const soundFiles = {
      click: require('../assets/sounds/click.mp3'),
      success: require('../assets/sounds/success.mp3'),
      error: require('../assets/sounds/error.mp3'),
      win: require('../assets/sounds/win-sound.mp3'),
      countdown: require('../assets/sounds/countdown.mp3'),
      correct: require('../assets/sounds/correct.mp3'),
      wrong: require('../assets/sounds/wrong.mp3'),
      coin: require('../assets/sounds/coin.mp3'),
      levelUp: require('../assets/sounds/level-up.mp3'),
      notification: require('../assets/sounds/notification.mp3')
    };

    try {
      for (const [key, file] of Object.entries(soundFiles)) {
        const { sound } = await Audio.Sound.createAsync(file, { volume: 0.5 });
        this.sounds[key] = sound;
      }
      console.log('Sound effects preloaded successfully');
    } catch (error) {
      console.error('Error preloading sounds:', error);
    }
  };

  // Load user settings
  loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        this.settings = JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error('Error loading sound settings:', error);
    }
  };

  // Play a sound by key
  playSound = async (soundKey, volume = 0.5) => {
    if (!this.settings.soundFX) return;
    if (!this.sounds[soundKey]) return;

    try {
      const sound = this.sounds[soundKey];
      if (sound) {
        await sound.setVolumeAsync(volume);
        await sound.replayAsync();
      }
    } catch (error) {
      console.error(`Error playing sound ${soundKey}:`, error);
    }
  };

  // Individual sound functions
  playButtonClick = () => this.playSound('click', 0.3);
  playSuccess = () => this.playSound('success', 0.4);
  playError = () => this.playSound('error', 0.4);
  playWin = () => this.playSound('win', 0.6);
  playCountdown = () => this.playSound('countdown', 0.4);
  playCorrect = () => this.playSound('correct', 0.3);
  playWrong = () => this.playSound('wrong', 0.3);
  playCoin = () => this.playSound('coin', 0.5);
  playLevelUp = () => this.playSound('levelUp', 0.5);
  playNotification = () => this.playSound('notification', 0.4);

  // Update settings
  updateSettings = async (newSettings) => {
    this.settings = newSettings;
    await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
  };

  // Clean up sounds
  unloadAll = async () => {
    for (const key in this.sounds) {
      try {
        await this.sounds[key].unloadAsync();
      } catch (error) {
        console.error(`Error unloading sound ${key}:`, error);
      }
    }
    this.sounds = {};
  };
}

// Create singleton instance
const soundManager = new SoundManager();

// Export helper functions
export const playButtonSound = () => soundManager.playButtonClick();
export const playSuccessSound = () => soundManager.playSuccess();
export const playErrorSound = () => soundManager.playError();
export const playWinSound = () => soundManager.playWin();
export const playCountdownSound = () => soundManager.playCountdown();
export const playCorrectSound = () => soundManager.playCorrect();
export const playWrongSound = () => soundManager.playWrong();
export const playCoinSound = () => soundManager.playCoin();
export const playLevelUpSound = () => soundManager.playLevelUp();
export const playNotificationSound = () => soundManager.playNotification();
export const updateSoundSettings = (settings) => soundManager.updateSettings(settings);

export default soundManager;