import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import HomeScreen from '../screens/HomeScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QuickPlayScreen from '../screens/QuickPlayScreen';
import QuizLevelScreen from '../screens/QuizLevelScreen';
import QuizBattleScreen from '../screens/QuizBattleScreen';
import OneVOneScreen from '../screens/OneVOneScreen';
import SpinWheelScreen from '../screens/SpinWheelScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ContactScreen from '../screens/ContactScreen';
import WinCelebrationScreen from '../screens/WinCelebrationScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Wallet') iconName = 'account-balance-wallet';
          else if (route.name === 'Profile') iconName = 'person';
          else if (route.name === 'Leaderboard') iconName = 'leaderboard';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500'
        },
        headerShown: false
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="QuickPlay" component={QuickPlayScreen} />
      <Stack.Screen name="QuizLevel" component={QuizLevelScreen} />
      <Stack.Screen name="QuizBattle" component={QuizBattleScreen} />
      <Stack.Screen name="OneVOne" component={OneVOneScreen} />
      <Stack.Screen name="SpinWheel" component={SpinWheelScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="WinCelebration" component={WinCelebrationScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;￼Enter
