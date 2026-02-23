import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LoadingSpinner = ({ 
  size = 50, 
  color = '#667eea', 
  text = 'Loading...',
  fullScreen = false 
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const Spinner = () => (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [
              { rotate: spin },
              { scale: pulseValue }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={[color, color + '80', color + '20']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <Spinner />
      </View>
    );
  }

  return <Spinner />;
};

const styles = StyleSheet.create({
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinner: {
    borderWidth: 0,
    overflow: 'hidden'
  },
  text: {
    marginTop: 15,
    fontSize: 14,
    color: '#999',
    fontWeight: '500'
  }
});

export default LoadingSpinner;