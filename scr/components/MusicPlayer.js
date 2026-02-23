import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated
} from 'react-native';
import { Audio } from 'expo-av';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MusicPlayer = ({ onError }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [settings, setSettings] = useState({
    backgroundMusic: true
  });

  const spinValue = useRef(new Animated.Value(0)).current;

  // 10 background music tracks
  const musicTracks = [
    require('../assets/sounds/background-music-1.mp3'),
    require('../assets/sounds/background-music-2.mp3'),
    require('../assets/sounds/background-music-3.mp3'),
    require('../assets/sounds/background-music-4.mp3'),
    require('../assets/sounds/background-music-5.mp3'),
    require('../assets/sounds/background-music-6.mp3'),
    require('../assets/sounds/background-music-7.mp3'),
    require('../assets/sounds/background-music-8.mp3'),
    require('../assets/sounds/background-music-9.mp3'),
    require('../assets/sounds/background-music-10.mp3')
  ];

  useEffect(() => {
    loadSettings();
    startMusic();

    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true
      })
    ).start();

    return () => {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const startMusic = async () => {
    if (!settings.backgroundMusic) return;

    try {
      await playMusicInSequence(0);
    } catch (error) {
      console.error('Error starting music:', error);
      if (onError) onError(error);
    }
  };

  const playMusicInSequence = async (startIndex) => {
    try {
      if (!settings.backgroundMusic) return;

      for (let i = 0; i < musicTracks.length; i++) {
        const currentIndex = (startIndex + i) % musicTracks.length;
        
        const currentSettings = await AsyncStorage.getItem('userSettings');
        const parsed = JSON.parse(currentSettings || '{}');
        if (!parsed.backgroundMusic) {
          setIsPlaying(false);
          return;
        }

        if (sound) {
          await sound.unloadAsync();
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
          musicTracks[currentIndex],
          {
            shouldPlay: true,
            isLooping: false,
            volume: volume
          }
        );

        setSound(newSound);
        setCurrentTrack(currentIndex);
        setIsPlaying(true);

        await new Promise((resolve) => {
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              newSound.unloadAsync();
              resolve();
            }
          });
        });
      }

      if (settings.backgroundMusic) {
        await playMusicInSequence((startIndex + 1) % musicTracks.length);
      }

    } catch (error) {
      console.error('Error in music sequence:', error);
      setIsPlaying(false);
    }
  };

  const toggleMusic = async () => {
    try {
      const newSettings = { ...settings, backgroundMusic: !settings.backgroundMusic };
      setSettings(newSettings);
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));

      if (newSettings.backgroundMusic) {
        startMusic();
      } else {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error('Error toggling music:', error);
    }
  };

  const nextTrack = async () => {
    if (!sound || !isPlaying) return;

    try {
      await sound.stopAsync();
      await sound.unloadAsync();
      
      const nextIndex = (currentTrack + 1) % musicTracks.length;
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        musicTracks[nextIndex],
        {
          shouldPlay: true,
          isLooping: false,
          volume: volume
        }
      );

      setSound(newSound);
      setCurrentTrack(nextIndex);
    } catch (error) {
      console.error('Error skipping track:', error);
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (!settings.backgroundMusic) {
    return (
      <TouchableOpacity style={styles.miniPlayer} onPress={toggleMusic}>
        <Icon name="music-off" size={20} color="#999" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { transform: [{ rotate: spin }] }]}>
        <Icon 
          name="music-note" 
          size={24} 
          color={isPlaying ? '#667eea' : '#999'} 
        />
      </Animated.View>

      <View style={styles.infoContainer}>
        <Text style={styles.trackText}>
          Track {currentTrack + 1} of 10
        </Text>
        <View style={styles.volumeContainer}>
          <Icon name="volume-down" size={16} color="#999" />
          <View style={styles.volumeBar}>
            <View style={[styles.volumeFill, { width: `${volume * 100}%` }]} />
          </View>
          <Icon name="volume-up" size={16} color="#999" />
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleMusic}>
          <Icon 
            name={isPlaying ? 'pause' : 'play-arrow'} 
            size={24} 
            color="#667eea" 
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={nextTrack}>
          <Icon name="skip-next" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    marginHorizontal: 20,
    marginBottom: 10
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    zIndex: 1000
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  infoContainer: {
    flex: 1
  },
  trackText: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  volumeBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginHorizontal: 5,
    overflow: 'hidden'
  },
  volumeFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10
  }
});

export default MusicPlayer;