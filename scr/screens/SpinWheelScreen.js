import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.8;

const SpinWheelScreen = ({ navigation }) => {
  const [freeSpins, setFreeSpins] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(null);
  const [spinHistory, setSpinHistory] = useState([]);

  const spinValue = useRef(new Animated.Value(0)).current;

  const segments = [
    { prize: 10, color: '#FF6B6B', label: '₦10' },
    { prize: 20, color: '#4ECDC4', label: '₦20' },
    { prize: 50, color: '#45B7D1', label: '₦50' },
    { prize: 100, color: '#96CEB4', label: '₦100' },
    { prize: 200, color: '#FFEAA7', label: '₦200' },
    { prize: 500, color: '#DDA0DD', label: '₦500' },
    { prize: 1000, color: '#F08080', label: '₦1000' },
    { prize: 2000, color: '#9ACD32', label: '₦2000' },
  ];

  useEffect(() => {
    loadUserData();
    loadSpinHistory();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsed = JSON.parse(data);
        setFreeSpins(parsed.free_spins || 10);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadSpinHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('spinHistory');
      if (history) {
        setSpinHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading spin history:', error);
    }
  };

  const spinWheel = async () => {
    if (isSpinning) return;

    if (freeSpins <= 0) {
      Alert.alert('No Free Spins', 'You have no free spins left. Would you like to buy more?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Spins', onPress: () => navigation.navigate('Wallet') }
      ]);
      return;
    }

    setIsSpinning(true);

    // Simulate spin result (random prize)
    const prize = segments[Math.floor(Math.random() * segments.length)].prize;
    
    // Animate wheel
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 3000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(() => {
      setIsSpinning(false);
      setLastWin(prize);
      
      // Update free spins
      const newFreeSpins = freeSpins - 1;
      setFreeSpins(newFreeSpins);

      // Update user data
      updateUserData(prize, newFreeSpins);

      // Show win message
      Alert.alert('🎉 Congratulations!', `You won ₦${prize}!`);
    });
  };

  const updateUserData = async (prize, newFreeSpins) => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsed = JSON.parse(data);
        parsed.free_spins = newFreeSpins;
        parsed.balance = (parsed.balance || 0) + prize;
        await AsyncStorage.setItem('userData', JSON.stringify(parsed));
      }

      // Save spin history
      const newSpin = { prize, date: new Date().toISOString() };
      const updatedHistory = [newSpin, ...spinHistory].slice(0, 10);
      setSpinHistory(updatedHistory);
      await AsyncStorage.setItem('spinHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1800deg']
  });

  const renderWheel = () => {
    const segmentAngle = 360 / segments.length;
    
    return (
      <View style={styles.wheelContainer}>
        <Animated.View style={[styles.wheel, { transform: [{ rotate: spin }] }]}>
          {segments.map((segment, index) => {
            const rotation = index * segmentAngle;
            return (
              <View
                key={index}
                style={[
                  styles.segment,
                  { backgroundColor: segment.color, transform: [{ rotate: `${rotation}deg` }, { translateX: WHEEL_SIZE / 2 }] }
                ]}
              >
                <Text style={styles.segmentText}>{segment.label}</Text>
              </View>
            );
          })}
        </Animated.View>
        <View style={styles.pointer}>
          <Icon name="arrow-drop-down" size={40} color="#ff4757" />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} />
      
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Text style={styles.headerTitle}>Lucky Spin Wheel</Text>
        <Text style={styles.headerSubtitle}>Spin and win cash prizes!</Text>
      </LinearGradient>

      <View style={styles.spinsCard}>
        <Icon name="casino" size={24} color="#FFD700" />
        <Text style={styles.spinsLabel}>Free Spins Today</Text>
        <Text style={styles.spinsCount}>{freeSpins}</Text>
        {freeSpins === 0 && (
          <TouchableOpacity style={styles.buySpinsButton} onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.buySpinsText}>Buy Spins</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.wheelWrapper}>{renderWheel()}</View>

      <TouchableOpacity
        style={[styles.spinButton, (isSpinning || freeSpins === 0) && styles.spinButtonDisabled]}
        onPress={spinWheel}
        disabled={isSpinning || freeSpins === 0}
      >
        <LinearGradient colors={isSpinning ? ['#ccc', '#999'] : ['#ff6b6b', '#ff4757']} style={styles.spinButtonGradient}>
          <Icon name="rotate-right" size={24} color="#fff" />
          <Text style={styles.spinButtonText}>{isSpinning ? 'SPINNING...' : 'SPIN NOW'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {lastWin && (
        <View style={styles.lastWinCard}>
          <Text style={styles.lastWinLabel}>Last Win</Text>
          <Text style={styles.lastWinAmount}>₦{lastWin}</Text>
        </View>
      )}

      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Prizes</Text>
        <View style={styles.legendGrid}>
          {segments.map((segment, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: segment.color }]} />
              <Text style={styles.legendText}>{segment.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  spinsCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', margin: 20, marginTop: -10 },
  spinsLabel: { fontSize: 16, color: '#999', marginLeft: 10, flex: 1 },
  spinsCount: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50', marginRight: 10 },
  buySpinsButton: { backgroundColor: '#667eea', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15 },
  buySpinsText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  wheelWrapper: { alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  wheelContainer: { width: WHEEL_SIZE, height: WHEEL_SIZE, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  wheel: { width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: WHEEL_SIZE / 2, backgroundColor: '#fff', overflow: 'hidden', position: 'relative' },
  segment: { position: 'absolute', width: WHEEL_SIZE / 2, height: 40, top: WHEEL_SIZE / 2 - 20, left: 0, alignItems: 'center', justifyContent: 'center', transformOrigin: 'left center' },
  segmentText: { color: '#333', fontSize: 12, fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 10 },
  pointer: { position: 'absolute', top: -20, zIndex: 10 },
  spinButton: { marginHorizontal: 20, borderRadius: 10, overflow: 'hidden' },
  spinButtonDisabled: { opacity: 0.5 },
  spinButtonGradient: { flexDirection: 'row', padding: 18, alignItems: 'center', justifyContent: 'center' },
  spinButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  lastWinCard: { backgroundColor: '#e8f5e9', borderRadius: 15, padding: 15, margin: 20, marginTop: 10, alignItems: 'center' },
  lastWinLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  lastWinAmount: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50' },
  legendContainer: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginHorizontal: 20, marginBottom: 20 },
  legendTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', width: '25%', marginBottom: 10 },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 5 },
  legendText: { fontSize: 12, color: '#666' }
});

export default SpinWheelScreen;