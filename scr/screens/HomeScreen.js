import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { checkForUpdates, setGameState } from '../utils/version';

import TopWinnersSlide from '../components/TopWinnersSlide';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [sound, setSound] = useState(null);
  const [currentMusic, setCurrentMusic] = useState(0);
  const [freeSpins, setFreeSpins] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      setGameState(false);
      const timer = setTimeout(() => {
        checkForUpdates();
      }, 2000);
      return () => clearTimeout(timer);
    }, [])
  );

  const musicFiles = [
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
    loadUserData();
    startMusicSequence();
    
    return () => {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
    };
  }, []);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsed = JSON.parse(data);
        setUserData(parsed);
        setWalletBalance(parsed.balance || 0);
        setFreeSpins(parsed.free_spins || 10);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const startMusicSequence = async () => {
    try {
      const startIndex = Math.floor(Math.random() * musicFiles.length);
      setCurrentMusic(startIndex);
      await playMusicInSequence(startIndex);
    } catch (error) {
      console.error('Error starting music:', error);
    }
  };

  const playMusicInSequence = async (startIndex) => {
    try {
      setIsPlaying(true);
      
      for (let i = 0; i < musicFiles.length; i++) {
        const currentIndex = (startIndex + i) % musicFiles.length;
        
        if (sound) {
          await sound.unloadAsync();
        }
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          musicFiles[currentIndex],
          { 
            shouldPlay: true,
            isLooping: false,
            volume: 0.5
          }
        );
        
        setSound(newSound);
        setCurrentMusic(currentIndex);
        
        await new Promise((resolve) => {
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              newSound.unloadAsync();
              resolve();
            }
          });
        });
      }
      
      const nextStartIndex = (startIndex + 1) % musicFiles.length;
      await playMusicInSequence(nextStartIndex);
      
    } catch (error) {
      console.error('Error in music sequence:', error);
      setIsPlaying(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            if (sound) {
              await sound.stopAsync();
              await sound.unloadAsync();
            }
            
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            navigation.replace('Auth');
          }
        }
      ]
    );
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [140, 100],
    extrapolate: 'clamp'
  });

  const walletScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp'
  });

  const menuItems = [
    {
      name: 'Quick Play',
      icon: 'flash-on',
      colors: ['#ff6b6b', '#ff4757'],
      screen: 'QuickPlay',
      description: '10 Questions • 3x Odds'
    },
    {
      name: 'Play Quiz',
      icon: 'play-circle',
      colors: ['#4facfe', '#00f2fe'],
      screen: 'QuizLevel',
      description: 'Choose Your Level'
    },
    {
      name: 'Quiz Battle',
      icon: 'groups',
      colors: ['#a18cd1', '#fbc2eb'],
      screen: 'QuizBattle',
      description: '3+ Players'
    },
    {
      name: '1 vs 1',
      icon: 'sports-esports',
      colors: ['#f093fb', '#f5576c'],
      screen: 'OneVOne',
      description: 'Head to Head'
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.spinIcon}
              onPress={() => navigation.navigate('SpinWheel')}
            >
              <Icon name="casino" size={30} color="#ffd700" />
              {freeSpins > 0 && (
                <View style={styles.freeSpinBadge}>
                  <Text style={styles.freeSpinText}>{freeSpins}</Text>
                </View>
              )}
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: walletScale }] }}>
              <TouchableOpacity 
                style={styles.walletContainer}
                onPress={() => navigation.navigate('Wallet')}
              >
                <LinearGradient
                  colors={['#ffd700', '#ffa500']}
                  style={styles.walletGradient}
                >
                  <Icon name="account-balance-wallet" size={20} color="#fff" />
                  <Text style={styles.walletText}>
                    ₦{walletBalance.toFixed(2)}
                  </Text>
                  <Text style={styles.walletSubtext}>
                    ${(walletBalance * 0.001).toFixed(2)}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity 
              style={styles.profileIcon}
              onPress={() => navigation.navigate('Profile')}
            >
              <Icon name="person" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.welcomeText}>
            Welcome back, {userData?.firstName || 'Player'}! 👋
          </Text>
          <Text style={styles.badgeText}>
            {userData?.badge || 'Bronze'} Member
          </Text>
          
          <Text style={styles.nowPlayingText}>
            🎵 Now Playing: Background Music {currentMusic + 1}
          </Text>
        </LinearGradient>
      </Animated.View>

      <TopWinnersSlide />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <LinearGradient
                colors={item.colors}
                style={styles.menuGradient}
              >
                <Icon name={item.icon} size={40} color="#fff" />
                <Text style={styles.menuName}>{item.name}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.casinoButton}
          onPress={() => Alert.alert('Coming Soon', 'Casino features coming soon!')}
        >
          <LinearGradient
            colors={['#ffd700', '#ffa500']}
            style={styles.casinoGradient}
          >
            <Icon name="casino" size={40} color="#fff" />
            <View style={styles.casinoTextContainer}>
              <Text style={styles.casinoText}>CASINO</Text>
              <Text style={styles.casinoSubtext}>Coming Soon</Text>
            </View>
            <Icon name="arrow-forward" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings" size={24} color="#667eea" />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Contact')}
          >
            <Icon name="contact-support" size={24} color="#667eea" />
            <Text style={styles.actionText}>Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Icon name="leaderboard" size={24} color="#667eea" />
            <Text style={styles.actionText}>Leaderboard</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#ff4757" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: 'hidden'
  },
  headerGradient: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  spinIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  freeSpinBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff'
  },
  freeSpinText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  walletContainer: {
    borderRadius: 25,
    overflow: 'hidden'
  },
  walletGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8
  },
  walletText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 14
  },
  walletSubtext: {
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 5,
    fontSize: 12
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  welcomeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10
  },
  badgeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 5
  },
  nowPlayingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 10
  },
  scrollView: {
    flex: 1,
    marginTop: 160
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  menuItem: {
    width: (width - 50) / 2,
    marginBottom: 15
  },
  menuGradient: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  menuName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center'
  },
  menuDescription: {
    color: '#fff',
    fontSize: 11,
    marginTop: 5,
    opacity: 0.9,
    textAlign: 'center'
  },
  casinoButton: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  casinoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20
  },
  casinoTextContainer: {
    flex: 1,
    marginLeft: 15
  },
  casinoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  casinoSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41
  },
  actionButton: {
    alignItems: 'center'
  },
  actionText: {
    color: '#667eea',
    marginTop: 5,
    fontSize: 12,
    fontWeight: '500'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff4757',
    marginBottom: 10
  },
  logoutText: {
    color: '#ff4757',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold'
  },
  versionText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center'
  }
});

export default HomeScreen;