import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LoadingScreen = () => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.5)).current;
  const moneyAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true
        })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(moneyAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(moneyAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
      easing: Easing.linear
    }).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const moneyTranslateY = moneyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20]
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#6b8cff']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [
              { rotate: spin },
              { scale: scaleValue },
              { perspective: 1000 },
              { rotateY: spin }
            ]
          }
        ]}
      >
        <Text style={styles.logoText}>VEV</Text>
        <Text style={styles.logoSubText}>QUIZER</Text>
      </Animated.View>

      <View style={styles.moneyContainer}>
        <Animated.Text
          style={[
            styles.moneyText,
            { transform: [{ translateY: moneyTranslateY }] }
          ]}
        >
          💰 ₦
        </Animated.Text>
        <Animated.Text
          style={[
            styles.moneyText,
            { transform: [{ translateY: moneyTranslateY }] }
          ]}
        >
          💵 $
        </Animated.Text>
      </View>

      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Amazing Quizzes...</Text>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressWidth }
            ]}
          />
        </View>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff'
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5
  },
  logoSubText: {
    fontSize: 20,
    color: '#fff',
    marginTop: -5
  },
  moneyContainer: {
    flexDirection: 'row',
    marginTop: 50,
    justifyContent: 'space-around',
    width: width * 0.6
  },
  moneyText: {
    fontSize: 40,
    marginHorizontal: 20
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 50,
    width: width * 0.8
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2
  },
  versionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10
  }
});

export default LoadingScreen;