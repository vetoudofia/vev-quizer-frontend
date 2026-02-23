import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';

const OneVOneScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('invite');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [invites, setInvites] = useState([]);

  const PLATFORM_FEE = 0.10;

  useEffect(() => {
    loadUserBalance();
    loadOnlineUsers();
    loadInvites();
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

  const loadOnlineUsers = () => {
    setOnlineUsers([
      { id: '1', username: 'QuizMaster', wins: 150, rank: 1 },
      { id: '2', username: 'BrainKing', wins: 120, rank: 2 },
      { id: '3', username: 'SmartGuy', wins: 100, rank: 3 }
    ]);
  };

  const loadInvites = () => {
    setInvites([
      { id: '1', inviter: 'Champion99', stake: 500, createdAt: new Date().toISOString() }
    ]);
  };

  const calculatePrize = (stake) => {
    const totalPot = stake * 2;
    const platformFee = totalPot * PLATFORM_FEE;
    return totalPot - platformFee;
  };

  const handleInvite = (user) => {
    const stake = parseFloat(stakeAmount);
    if (!stake || stake < 10) {
      Alert.alert('Error', 'Minimum stake is ₦10');
      return;
    }
    if (stake > userBalance) {
      Alert.alert('Insufficient Balance', 'Please deposit more funds');
      return;
    }

    Alert.alert(
      'Send Invite',
      `Challenge ${user.username} for ₦${stake}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'SEND', onPress: () => Alert.alert('Invite Sent', 'Waiting for response') }
      ]
    );
  };

  const handleAcceptInvite = (invite) => {
    if (invite.stake > userBalance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough balance');
      return;
    }

    Alert.alert(
      'Accept Invite',
      `Stake: ₦${invite.stake}\nWinner gets: ₦${calculatePrize(invite.stake).toFixed(2)}`,
      [
        { text: 'Decline', style: 'cancel' },
        { text: 'ACCEPT', onPress: () => Alert.alert('Game Started!', 'Good luck!') }
      ]
    );
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => handleInvite(item)}>
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.userStats}>Wins: {item.wins} | Rank: #{item.rank}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderInvite = ({ item }) => (
    <TouchableOpacity style={styles.inviteCard} onPress={() => handleAcceptInvite(item)}>
      <Text style={styles.inviterName}>{item.inviter}</Text>
      <Text style={styles.inviteStake}>₦{item.stake}</Text>
      <TouchableOpacity style={styles.acceptButton}>
        <Text style={styles.acceptButtonText}>ACCEPT</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} />
      
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Text style={styles.headerTitle}>1 vs 1 Battle</Text>
        <Text style={styles.headerSubtitle}>Challenge other players</Text>
      </LinearGradient>

      <View style={styles.balanceCard}>
        <Icon name="account-balance-wallet" size={24} color="#667eea" />
        <Text style={styles.balanceLabel}>Balance: ₦{userBalance.toFixed(2)}</Text>
      </View>

      {invites.length > 0 && (
        <View style={styles.invitesSection}>
          <Text style={styles.sectionTitle}>Pending Invites</Text>
          <FlatList
            data={invites}
            renderItem={renderInvite}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.invitesList}
          />
        </View>
      )}

      <View style={styles.tabContainer}>
        {['invite', 'online'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'invite' ? 'Invite Player' : 'Online Players'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'invite' ? (
        <ScrollView style={styles.content}>
          <View style={styles.inviteSection}>
            <Text style={styles.label}>Stake Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter stake amount"
              keyboardType="numeric"
              value={stakeAmount}
              onChangeText={setStakeAmount}
            />
            {stakeAmount > 0 && (
              <View style={styles.prizeCard}>
                <Text style={styles.prizeLabel}>Winner's Prize</Text>
                <Text style={styles.prizeAmount}>₦{calculatePrize(parseFloat(stakeAmount)).toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.quickStakes}>
              {[100, 200, 500, 1000].map(amount => (
                <TouchableOpacity key={amount} style={styles.quickStakeButton} onPress={() => setStakeAmount(amount.toString())}>
                  <Text style={styles.quickStakeText}>₦{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={onlineUsers}
          renderItem={renderUser}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.usersList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="people" size={60} color="#ccc" />
              <Text style={styles.emptyStateText}>No players online</Text>
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
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  balanceCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', margin: 20, marginTop: -10 },
  balanceLabel: { fontSize: 16, color: '#999', marginLeft: 10, flex: 1 },
  invitesSection: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  invitesList: { flexDirection: 'row' },
  inviteCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginRight: 10, width: 200 },
  inviterName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  inviteStake: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginTop: 5 },
  acceptButton: { backgroundColor: '#4CAF50', padding: 8, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  acceptButtonText: { color: '#fff', fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: '#fff', borderRadius: 10, padding: 5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#667eea' },
  tabText: { fontSize: 14, color: '#999', fontWeight: '500' },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  content: { paddingHorizontal: 20 },
  inviteSection: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  label: { fontSize: 14, color: '#333', fontWeight: '500', marginBottom: 8 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 15 },
  prizeCard: { backgroundColor: '#f0f0ff', borderRadius: 15, padding: 15, alignItems: 'center', marginBottom: 15 },
  prizeLabel: { fontSize: 14, fontWeight: 'bold', color: '#667eea', marginBottom: 5 },
  prizeAmount: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  quickStakes: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  quickStakeButton: { backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, marginRight: 8, marginBottom: 8 },
  quickStakeText: { fontSize: 12, color: '#666' },
  usersList: { padding: 20 },
  userCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, padding: 12, marginBottom: 8 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  userStats: { fontSize: 12, color: '#666', marginTop: 2 },
  emptyState: { alignItems: 'center', padding: 50 }
});

export default OneVOneScreen;