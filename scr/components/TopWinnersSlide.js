import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { api } from '../utils/api';

const { width } = Dimensions.get('window');

const TopWinnersSlide = () => {
  const [winners, setWinners] = useState([]);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    loadTopWinners();
    
    const interval = setInterval(() => {
      if (winners.length > 1 && scrollViewRef.current) {
        const nextIndex = (Math.floor(scrollX._value / width) + 1) % winners.length;
        scrollViewRef.current.scrollTo({
          x: nextIndex * width,
          animated: true
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [winners]);

  const loadTopWinners = async () => {
    try {
      const response = await api.get('/leaderboard/top-winners');
      if (response.data) {
        setWinners(response.data.winners);
      }
    } catch (error) {
      // Fallback data
      setWinners([
        {
          id: 1,
          username: 'QuizMaster',
          amount: 15000,
          game: 'Quiz Battle',
          badge: 'gold'
        },
        {
          id: 2,
          username: 'BrainKing',
          amount: 12000,
          game: '1 vs 1',
          badge: 'silver'
        },
        {
          id: 3,
          username: 'SmartGuy',
          amount: 10000,
          game: 'Quick Play',
          badge: 'bronze'
        }
      ]);
    }
  };

  const getBadgeColor = (badge) => {
    switch(badge) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#cd7f32';
      default: return '#667eea';
    }
  };

  const renderWinner = ({ item, index }) => (
    <View key={item.id} style={styles.winnerCard}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: getBadgeColor(item.badge) }]}>
          <Text style={styles.avatarText}>
            {item.username[0].toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.winnerInfo}>
        <Text style={styles.winnerName}>{item.username}</Text>
        <Text style={styles.winnerGame}>{item.game}</Text>
      </View>

      <View style={styles.winnerAmount}>
        <Icon name="emoji-events" size={16} color="#FFD700" />
        <Text style={styles.amountText}>₦{item.amount.toLocaleString()}</Text>
      </View>

      <View style={[styles.badgeIndicator, { backgroundColor: getBadgeColor(item.badge) }]}>
        <Icon name="stars" size={12} color="#fff" />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="emoji-events" size={20} color="#FFD700" />
        <Text style={styles.title}>Top Winners</Text>
        <Icon name="emoji-events" size={20} color="#FFD700" />
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {winners.map((winner, index) => renderWinner({ item: winner, index }))}
      </Animated.ScrollView>

      <View style={styles.pagination}>
        {winners.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width
          ];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp'
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp'
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { width: dotWidth, opacity }
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginVertical: 10,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 10
  },
  winnerCard: {
    width: width - 40,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  avatarContainer: {
    marginRight: 12
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  winnerInfo: {
    flex: 1
  },
  winnerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  winnerGame: {
    fontSize: 10,
    color: '#999',
    marginTop: 2
  },
  winnerAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10
  },
  amountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 4
  },
  badgeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginHorizontal: 4
  }
});

export default TopWinnersSlide;