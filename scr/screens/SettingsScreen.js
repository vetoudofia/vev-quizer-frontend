import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    soundFX: true,
    backgroundMusic: true,
    darkMode: false,
    notifications: true,
    vibration: true
  });

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadSettings();
    loadUserData();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

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

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'This will clear temporary data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'CLEAR', onPress: () => Alert.alert('Success', 'Cache cleared') }
    ]);
  };

  const handleContactSupport = () => {
    navigation.navigate('Contact');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Your data is safe with us. We never share your information.');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'By using this app, you agree to our terms and conditions.');
  };

  const SettingItem = ({ icon, label, value, onValueChange, type = 'switch' }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color="#667eea" />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {type === 'switch' ? (
        <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#ccc', true: '#667eea' }} />
      ) : (
        <TouchableOpacity onPress={onValueChange}>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} />
      
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Icon name="settings" size={40} color="#fff" />
        <Text style={styles.headerTitle}>Settings</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio</Text>
          <SettingItem icon="volume-up" label="Sound FX" value={settings.soundFX} onValueChange={() => toggleSetting('soundFX')} />
          <SettingItem icon="music-note" label="Background Music" value={settings.backgroundMusic} onValueChange={() => toggleSetting('backgroundMusic')} />
          <SettingItem icon="vibration" label="Vibration" value={settings.vibration} onValueChange={() => toggleSetting('vibration')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          <SettingItem icon="brightness-4" label="Dark Mode" value={settings.darkMode} onValueChange={() => toggleSetting('darkMode')} />
          <SettingItem icon="notifications" label="Notifications" value={settings.notifications} onValueChange={() => toggleSetting('notifications')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Username</Text><Text style={styles.infoValue}>{userData?.firstName || 'Player'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Email</Text><Text style={styles.infoValue}>{userData?.email || 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Phone</Text><Text style={styles.infoValue}>{userData?.phone || 'Not set'}</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingItem icon="contact-support" label="Contact Support" type="button" onValueChange={handleContactSupport} />
          <SettingItem icon="privacy-tip" label="Privacy Policy" type="button" onValueChange={handlePrivacyPolicy} />
          <SettingItem icon="gavel" label="Terms of Service" type="button" onValueChange={handleTermsOfService} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <SettingItem icon="delete-sweep" label="Clear Cache" type="button" onValueChange={handleClearCache} />
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>VEV QUIZER v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  content: { flex: 1, padding: 20 },
  section: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingLabel: { fontSize: 14, color: '#333', marginLeft: 12 },
  infoCard: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  infoLabel: { fontSize: 12, color: '#999' },
  infoValue: { fontSize: 12, fontWeight: '500', color: '#333' },
  versionContainer: { alignItems: 'center', marginBottom: 30 },
  versionText: { fontSize: 12, color: '#999' }
});

export default SettingsScreen;