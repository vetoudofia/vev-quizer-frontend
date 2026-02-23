import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

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

  const badgeInfo = {
    bronze: { color: '#cd7f32', multiplier: '1.1x' },
    silver: { color: '#c0c0c0', multiplier: '1.2x' },
    gold: { color: '#ffd700', multiplier: '1.3x' },
    platinum: { color: '#e5e4e2', multiplier: '1.4x' },
    grand_master: { color: '#b22222', multiplier: '1.5x' },
    god: { color: '#4b0082', multiplier: '2x' },
    genius: { color: '#00ced1', multiplier: '3x' }
  };

  const userStats = {
    gamesPlayed: userData?.games_played || 0,
    totalWon: userData?.total_earned || 0,
    winRate: userData?.wins && userData?.games_played ? 
      Math.round((userData.wins / userData.games_played) * 100) : 0
  };

  const currentBadge = userData?.badge?.toLowerCase() || 'bronze';

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} />
      
      <ScrollView>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>
                {userData?.firstName?.[0]}{userData?.lastName?.[0]}
              </Text>
            </View>
          </View>
          
          <Text style={styles.userName}>
            {userData?.firstName} {userData?.lastName}
          </Text>
          
          <View style={[styles.badgeContainer, { backgroundColor: badgeInfo[currentBadge]?.color }]}>
            <Text style={styles.badgeText}>{currentBadge.toUpperCase()}</Text>
            <Text style={styles.badgeMultiplier}>{badgeInfo[currentBadge]?.multiplier}</Text>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.gamesPlayed}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₦{userStats.totalWon}</Text>
            <Text style={styles.statLabel}>Total Won</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoItem}>
            <Icon name="email" size={24} color="#667eea" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userData?.email || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="phone" size={24} color="#667eea" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{userData?.phone || 'Not set'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game History</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="history" size={24} color="#667eea" />
            <Text style={styles.menuText}>Quiz History</Text>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="account-balance-wallet" size={24} color="#667eea" />
            <Text style={styles.menuText}>Transaction History</Text>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="military-tech" size={24} color="#667eea" />
            <Text style={styles.menuText}>Badges</Text>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingBottom: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  profileImageContainer: { marginBottom: 15 },
  profileImagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  profileImageText: { fontSize: 36, color: '#667eea', fontWeight: 'bold' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  badgeContainer: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, alignItems: 'center' },
  badgeText: { color: '#fff', fontWeight: 'bold', marginRight: 5 },
  badgeMultiplier: { color: '#fff', fontSize: 12, backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 10 },
  statsContainer: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginTop: -20, borderRadius: 15, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 5 },
  statDivider: { width: 1, height: '100%', backgroundColor: '#eee' },
  section: { backgroundColor: '#fff', marginTop: 20, paddingHorizontal: 20, paddingVertical: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  infoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoContent: { flex: 1, marginLeft: 15 },
  infoLabel: { fontSize: 12, color: '#999' },
  infoValue: { fontSize: 16, color: '#333', marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { flex: 1, fontSize: 16, color: '#333', marginLeft: 15 }
});

export default ProfileScreen;