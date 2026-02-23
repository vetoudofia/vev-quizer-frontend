import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

const WinCelebrationScreen = ({ navigation, route }) => {
  const { amount, gameType } = route.params || { amount: 0, gameType: 'Quiz' };

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    playWinSound();
    
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
      Animated.loop(Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 1000, useNativeDriver: true })
      ]))
    ]).start();
  }, []);

  const playWinSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/win-sound.mp3'));
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing win sound:', error);
    }
  };

  const bounce = bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2', '#ff6b6b']} style={styles.gradient}>
        <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.congratulations}>🎉 CONGRATULATIONS! 🎉</Text>
          <Text style={styles.youWon}>YOU WON!</Text>

          <Animated.View style={[styles.amountContainer, { transform: [{ translateY: bounce }] }]}>
            <Text style={styles.amountLabel}>Amount Won</Text>
            <Text style={styles.amount}>₦{amount.toFixed(2)}</Text>
          </Animated.View>

          <View style={styles.imageContainer}>
            <Image source={require('../assets/images/win-animation.gif')} style={styles.winImage} resizeMode="contain" />
          </View>

          <Text style={styles.appName}>vevquizer</Text>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Game Code</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{gameType}-{Date.now().toString(36).toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.playButton} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.playButtonText}>KEEP PLAYING</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { width: width * 0.9, alignItems: 'center', padding: 20 },
  congratulations: { fontSize: 28, fontWeight: 'bold', color: '#FFD700', textAlign: 'center', marginBottom: 5 },
  youWon: { fontSize: 36, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  amountContainer: { alignItems: 'center', marginBottom: 20 },
  amountLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 5 },
  amount: { fontSize: 48, fontWeight: 'bold', color: '#FFD700' },
  imageContainer: { width: 200, height: 200, marginBottom: 20 },
  winImage: { width: '100%', height: '100%' },
  appName: { fontSize: 18, color: '#fff', marginBottom: 20, textTransform: 'lowercase', opacity: 0.9 },
  codeContainer: { alignItems: 'center', marginBottom: 20 },
  codeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 5 },
  codeBox: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  codeText: { fontSize: 16, fontWeight: 'bold', color: '#FFD700' },
  buttonContainer: { width: '100%', marginBottom: 15 },
  playButton: { backgroundColor: '#FFD700', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  playButtonText: { color: '#333', fontSize: 18, fontWeight: 'bold' }
});

export default WinCelebrationScreen;