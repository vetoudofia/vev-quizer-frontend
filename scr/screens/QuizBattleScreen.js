import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  FlatList,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';

const QuizBattleScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [stakeAmount, setStakeAmount] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('3');
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState([]);

  const PLATFORM_FEE = 0.10;

  useEffect(() => {
    loadUserBalance();
    loadAvailableGames();
  }, []);

  const loadUserBalance = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserBalance(parsed.balance || 0);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadAvailableGames = () => {
    const mockGames = [
      {
        id: '1',
        creator: 'QuizMaster',
        stake: 500,
        maxPlayers: 4,
        currentPlayers: 2,
        code: 'BAT123'
      },
      {
        id: '2',
        creator: 'BrainKing',
        stake: 1000,
        maxPlayers: 3,
        currentPlayers: 1,
        code: 'BAT456'
      }
    ];
    setGames(mockGames);
  };

  const calculatePrize = () => {
    const stake = parseFloat(stakeAmount) || 0;
    const players = parseInt(maxPlayers) || 3;
    const totalPot = stake * players;
    const platformFee = totalPot * PLATFORM_FEE;
    return { total: totalPot, fee: platformFee, winner: totalPot - platformFee };
  };

  const handleCreateGame = () => {
    const stake = parseFloat(stakeAmount);
    const players = parseInt(maxPlayers);

    if (!stake || stake < 10) {
      Alert.alert('Error', 'Minimum stake is ₦10');
      return;
    }
    if (stake > userBalance) {
      Alert.alert('Insufficient Balance', 'Please deposit more funds');
      return;
    }
    if (players < 3 || players > 10) {
      Alert.alert('Error', 'Players must be between 3 and 10');
      return;
    }

    const prize = calculatePrize();
    Alert.alert(
      'Create Battle',
      `Stake: ₦${stake}\nPlayers: ${players}\nWinner gets: ₦${prize.winner.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'CREATE',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              Alert.alert('Game Created!', 'Waiting for players to join...');
            }, 1500);
          }
        }
      ]
    );
  };

  const handleJoinGame = (game) => {
    if (game.stake > userBalance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough balance');
      return;
    }

    Alert.alert(
      'Join Game',
      `Stake: ₦${game.stake}\nPlayers: ${game.currentPlayers}/${game.maxPlayers}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'JOIN', onPress: () => Alert.alert('Joined!', 'You joined the game') }
      ]
    );
  };

  const renderGame = ({ item }) => (
    <TouchableOpacity style={styles.gameCard} onPress={() => handleJoinGame(item)}>
      <View style={styles.gameHeader}>
        <Text style={styles.gameCode}>{item.code}</Text>
        <Text style={styles.gameStake}>₦{item.stake}</Text>
      </View>
      <View style={styles.gameDetails}>
        <Text>Creator: {item.creator}</Text>
        <Text>Players: {item.currentPlayers}/{item.maxPlayers}</Text>
      </View>
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>JOIN</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} />
      
      <LinearGradient colors={['#a18cd1', '#fbc2eb']} style={styles.header}>
        <Icon name="groups" size={40} color="#fff" />
        <Text style={styles.headerTitle}>Quiz Battle</Text>
        <Text style={styles.headerSubtitle}>Compete with multiple players</Text>
      </LinearGradient>

      <View style={styles.balanceCard}>
        <Icon name="account-balance-wallet" size={24} color="#667eea" />
        <Text style={styles.balanceLabel}>Balance: ₦{userBalance.toFixed(2)}</Text>
      </View>

      <View style={styles.tabContainer}>
        {['create', 'join'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'create' ? 'Create Game' : 'Join Game'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'create' ? (
        <ScrollView style={styles.content}>
          <View style={styles.createSection}>
            <Text style={styles.label}>Stake Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter stake amount"
              keyboardType="numeric"
              value={stakeAmount}
              onChangeText={setStakeAmount}
            />

            <Text style={styles.label}>Max Players (3-10)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of players"
              keyboardType="numeric"
              value={maxPlayers}
              onChangeText={setMaxPlayers}
            />

            {stakeAmount > 0 && maxPlayers > 0 && (
              <View style={styles.prizeCard}>
                <Text style={styles.prizeLabel}>Winner's Prize</Text>
                <Text style={styles.prizeAmount}>₦{calculatePrize().winner.toFixed(2)}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.createButton} onPress={handleCreateGame} disabled={loading}>
              <LinearGradient colors={['#ff6b6b', '#ff4757']} style={styles.createButtonGradient}>
                <Text style={styles.createButtonText}>{loading ? 'Creating...' : 'CREATE GAME'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={games}
          renderItem={renderGame}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.gamesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="sports-esports" size={60} color="#ccc" />
              <Text style={styles.emptyStateText}>No games available</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  balanceCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', margin: 20, marginTop: -10 },
  balanceLabel: { fontSize: 16, color: '#999', marginLeft: 10, flex: 1 },
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: '#fff', borderRadius: 10, padding: 5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#667eea' },
  tabText: { fontSize: 16, color: '#999', fontWeight: '500' },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  content: { paddingHorizontal: 20 },
  createSection: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  label: { fontSize: 16, color: '#333', fontWeight: '500', marginBottom: 8 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 20 },
  prizeCard: { backgroundColor: '#e8f5e9', borderRadius: 15, padding: 20, alignItems: 'center', marginBottom: 20 },
  prizeLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  prizeAmount: { fontSize: 28, fontWeight: 'bold', color: '#4CAF50' },
  createButton: { borderRadius: 10, overflow: 'hidden' },
  createButtonGradient: { padding: 16, alignItems: 'center' },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  gamesList: { padding: 20 },
  gameCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 10 },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  gameCode: { fontSize: 16, fontWeight: 'bold', color: '#667eea' },
  gameStake: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  gameDetails: { marginBottom: 10 },
  joinButton: { backgroundColor: '#667eea', padding: 10, borderRadius: 8, alignItems: 'center' },
  joinButtonText: { color: '#fff', fontWeight: 'bold' },
  emptyState: { alignItems: 'center', padding: 50 }
});

export default QuizBattleScreen;