import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';

const LeaderboardScreen = ({ navigation }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
    fetchLeaderboard();
  }, [selectedPeriod]);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        setUserData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        const sampleData = generateSampleData();
        setLeaderboardData(sampleData);
        
        const currentUserRank = sampleData.findIndex(
          user => user.id === (userData?.id || 'user123')
        ) + 1;
        setUserRank(currentUserRank > 0 ? currentUserRank : null);
        
        setLoading(false);
        setRefreshing(false);
      }, 1500);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateSampleData = () => {
    const names = ['QuizMaster', 'BrainKing', 'SmartGuy', 'GeniusMind', 'Wizard'];
    const badges = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Grand Master'];
    
    return Array(20).fill(null).map((_, index) => ({
      id: `user${index + 1}`,
      username: names[index % names.length] + (Math.floor(index / names.length) + 1),
      fullName: `User ${index + 1}`,
      avatar: null,
      badge: badges[Math.floor(Math.random() * badges.length)],
      totalWon: Math.floor(Math.random() * 1000000) + 10000,
      gamesPlayed: Math.floor(Math.random() * 500) + 50,
      winRate: Math.floor(Math.random() * 30) + 60,
      rank: index + 1
    }));
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getBadgeColor = (badge) => {
    switch(badge) {
      case 'Bronze': return '#cd7f32';
      case 'Silver': return '#c0c0c0';
      case 'Gold': return '#ffd700';
      case 'Platinum': return '#e5e4e2';
      case 'Grand Master': return '#b22222';
      default: return '#cd7f32';
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return 'emoji-events';
    if (rank === 2) return 'military-tech';
    if (rank === 3) return 'emoji-events';
    return 'person';
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#cd7f32';
    return '#999';
  };

  const formatMoney = (amount) => {
    return '₦' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const isTopThree = index < 3;
    
    return (
      <TouchableOpacity style={[styles.leaderboardItem, isTopThree && styles.topThreeItem]}>
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Icon name={getRankIcon(index + 1)} size={24} color={getRankColor(index + 1)} />
          ) : (
            <Text style={styles.rankText}>{index + 1}</Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </View>

          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.username}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.badgeDot, { backgroundColor: getBadgeColor(item.badge) }]} />
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Won</Text>
            <Text style={styles.statValue}>{formatMoney(item.totalWon)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>{item.winRate}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const TopThreeCard = ({ user, rank }) => {
    const heights = { 1: 120, 2: 90, 3: 70 };

    return (
      <View style={[styles.topThreeCard, { height: heights[rank] }]}>
        <LinearGradient
          colors={rank === 1 ? ['#FFD700', '#FFA500'] : 
                  rank === 2 ? ['#C0C0C0', '#A0A0A0'] : 
                  ['#cd7f32', '#8B4513']}
          style={styles.topThreeGradient}
        >
          <View style={styles.topThreeRank}>
            <Icon name={getRankIcon(rank)} size={20} color="#fff" />
            <Text style={styles.topThreeRankText}>#{rank}</Text>
          </View>
          
          <View style={styles.topThreeAvatar}>
            <View style={styles.topThreeAvatarPlaceholder}>
              <Text style={styles.topThreeAvatarText}>{user.username.charAt(0).toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.topThreeUsername} numberOfLines={1}>{user.username}</Text>
          <Text style={styles.topThreeWon}>{formatMoney(user.totalWon)}</Text>
        </LinearGradient>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} />
      
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Top Players This Week</Text>

        <View style={styles.periodSelector}>
          {['weekly', 'monthly', 'alltime'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.activePeriod]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodText, selectedPeriod === period && styles.activePeriodText]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {leaderboardData.length >= 3 && (
        <View style={styles.podiumContainer}>
          <View style={styles.podiumRow}>
            <TopThreeCard user={leaderboardData[1]} rank={2} />
            <TopThreeCard user={leaderboardData[0]} rank={1} />
            <TopThreeCard user={leaderboardData[2]} rank={3} />
          </View>
        </View>
      )}

      <LinearGradient colors={['#ff6b6b', '#ff4757']} style={styles.rewardBanner}>
        <Icon name="emoji-events" size={30} color="#fff" />
        <View style={styles.rewardTextContainer}>
          <Text style={styles.rewardTitle}>Top 5 Get Exclusive Rewards!</Text>
          <Text style={styles.rewardSubtitle}>Join top 5 to receive exclusive badge and bonus</Text>
        </View>
        <Icon name="star" size={24} color="#FFD700" />
      </LinearGradient>

      <FlatList
        data={leaderboardData}
        renderItem={renderLeaderboardItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#667eea', fontSize: 16 },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 5 },
  periodSelector: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  periodButton: { paddingHorizontal: 20, paddingVertical: 8, marginHorizontal: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  activePeriod: { backgroundColor: '#fff' },
  periodText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  activePeriodText: { color: '#667eea', fontWeight: 'bold' },
  podiumContainer: { backgroundColor: '#fff', marginTop: -20, marginHorizontal: 20, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5, zIndex: 10 },
  podiumRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', height: 130 },
  topThreeCard: { flex: 1, marginHorizontal: 5, borderRadius: 15, overflow: 'hidden' },
  topThreeGradient: { flex: 1, padding: 10, alignItems: 'center', justifyContent: 'space-between' },
  topThreeRank: { flexDirection: 'row', alignItems: 'center' },
  topThreeRankText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 2 },
  topThreeAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  topThreeAvatarPlaceholder: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  topThreeAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  topThreeUsername: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  topThreeWon: { color: '#fff', fontSize: 10, fontWeight: '500' },
  rewardBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 20, padding: 15, borderRadius: 15 },
  rewardTextContainer: { flex: 1, marginLeft: 10 },
  rewardTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  rewardSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 2 },
  listContent: { padding: 20, paddingTop: 0 },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1.41, elevation: 2 },
  topThreeItem: { backgroundColor: '#fff9e6' },
  rankContainer: { width: 35, alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: 'bold', color: '#999' },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: 12 },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  userDetails: { flex: 1 },
  username: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  badgeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  badgeText: { fontSize: 10, color: '#999' },
  statsContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  stat: { alignItems: 'center', paddingHorizontal: 8 },
  statLabel: { fontSize: 9, color: '#999' },
  statValue: { fontSize: 12, fontWeight: 'bold', color: '#333', marginTop: 2 },
  statDivider: { width: 1, height: 20, backgroundColor: '#eee' }
});

export default LeaderboardScreen;