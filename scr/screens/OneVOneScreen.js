import React, { useState, useEffect, useRef } from 'react';
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
import { useTutorial } from '../hooks/useTutorial';
import { useScreenProtection } from '../hooks/useScreenProtection';

const OneVOneScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('invite');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [showOpponentMessage, setShowOpponentMessage] = useState(false);

  const timerRef = useRef(null);
  const eventSourceRef = useRef(null);

  const PLATFORM_FEE = 0.10;
  const TOTAL_QUESTIONS = 41;
  const MAX_ATTEMPTS = 2;

  // Tutorial
  const { showTutorial } = useTutorial(
    '1 vs 1 Battle',
    '⚔️ 1 VS 1 RULES:\n\n' +
    '• You have 2 attempts per question\n' +
    '• Wrong on 2nd attempt = opponent gets point\n' +
    '• First to answer correctly gets point\n' +
    '• "Opponent answered" shows if they beat you\n' +
    '• Winner takes all minus 10% fee\n\n' +
    'Good luck!'
  );

  // Screen protection
  useScreenProtection(gameStarted && !gameOver, confirmQuit);

  useEffect(() => {
    loadUserBalance();
    loadOnlineUsers();
    loadInvites();
    loadActiveGames();
    
    const interval = setInterval(() => {
      loadOnlineUsers();
      loadInvites();
      loadActiveGames();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, gameOver, currentQuestion]);

  // Simulate opponent answers (in production, use WebSockets)
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Simulate opponent answering after random delay
      const opponentTimer = setTimeout(() => {
        if (!opponentAnswered && selectedAnswer === null) {
          setOpponentAnswered(true);
          setShowOpponentMessage(true);
          setTimeout(() => setShowOpponentMessage(false), 2000);
        }
      }, Math.random() * 5000 + 2000);

      return () => clearTimeout(opponentTimer);
    }
  }, [gameStarted, gameOver, currentQuestion, selectedAnswer]);

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

  const loadOnlineUsers = async () => {
    // Mock data - replace with API call
    setOnlineUsers([
      { id: '1', username: 'QuizMaster', wins: 150, rank: 1 },
      { id: '2', username: 'BrainKing', wins: 120, rank: 2 },
      { id: '3', username: 'SmartGuy', wins: 100, rank: 3 },
      { id: '4', username: 'GeniusMind', wins: 85, rank: 4 },
      { id: '5', username: 'Wizard', wins: 70, rank: 5 }
    ]);
  };

  const loadInvites = async () => {
    // Mock data - replace with API call
    setInvites([
      { id: '1', inviter: 'Champion99', stake: 500, createdAt: new Date().toISOString() },
      { id: '2', inviter: 'Legend42', stake: 1000, createdAt: new Date().toISOString() }
    ]);
  };

  const loadActiveGames = async () => {
    // Mock data - replace with API call
    setActiveGames([
      { id: 'g1', opponent: 'ProPlayer', stake: 500, status: 'active', startedAt: new Date().toISOString() }
    ]);
  };

  const calculatePrize = (stake) => {
    const totalPot = stake * 2;
    const platformFee = totalPot * PLATFORM_FEE;
    return totalPot - platformFee;
  };

  const handleInvite = async (user) => {
    const stake = parseFloat(stakeAmount);

    if (!stake || stake < 10) {
      Alert.alert('Error', 'Minimum stake is ₦10');
      return;
    }

    if (stake > 100000) {
      Alert.alert('Error', 'Maximum stake is ₦100,000');
      return;
    }

    if (stake > userBalance) {
      Alert.alert('Insufficient Balance', 'Please deposit more funds');
      return;
    }

    Alert.alert(
      'Send Invite',
      `Challenge ${user.username} for ₦${stake}?\n\nWinner gets: ₦${calculatePrize(stake).toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              Alert.alert('Invite Sent', `Waiting for ${user.username} to accept`);
            }, 1500);
          }
        }
      ]
    );
  };

  const handleAcceptInvite = async (invite) => {
    if (invite.stake > userBalance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough balance');
      return;
    }

    Alert.alert(
      'Accept Invite',
      `Stake: ₦${invite.stake}\nWinner gets: ₦${calculatePrize(invite.stake).toFixed(2)}`,
      [
        { text: 'Decline', style: 'cancel' },
        {
          text: 'ACCEPT',
          onPress: () => {
            startGame(invite);
          }
        }
      ]
    );
  };

  const startGame = (invite) => {
    setGameStarted(true);
    setOpponent({ username: invite.inviter });
    setGameId(invite.id);
    loadQuestions();
    setAttempts(0);
    setScore(0);
    setOpponentScore(0);
    setCurrentQuestion(0);
    setTimeLeft(10);
  };

  const loadQuestions = () => {
    // Mock questions - replace with API call
    const sampleQuestions = [];
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      sampleQuestions.push({
        id: i + 1,
        question: `Sample question ${i + 1}?`,
        options: [`Option A`, `Option B`, `Option C`, `Option D`],
        correct: Math.floor(Math.random() * 4)
      });
    }
    setQuestions(sampleQuestions);
  };

  const handleAnswer = (index) => {
    if (selectedAnswer !== null || gameOver) return;

    setSelectedAnswer(index);
    const isCorrect = (index === questions[currentQuestion].correct);
    
    if (isCorrect) {
      // Correct answer - player gets point
      setScore(prev => prev + 1);
      moveToNextQuestion();
    } else {
      // Wrong answer - check attempts
      if (attempts < MAX_ATTEMPTS - 1) {
        // Still have attempts left
        setAttempts(prev => prev + 1);
        setSelectedAnswer(null);
        Alert.alert('Wrong!', `Try again. ${MAX_ATTEMPTS - (attempts + 1)} attempt(s) left.`);
      } else {
        // Out of attempts - opponent gets point
        setOpponentScore(prev => prev + 1);
        Alert.alert('❌ Out of Attempts', 'Opponent gets the point!');
        moveToNextQuestion();
      }
    }
  };

  const moveToNextQuestion = () => {
    if (currentQuestion < TOTAL_QUESTIONS - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setAttempts(0);
        setOpponentAnswered(false);
        setTimeLeft(10);
      }, 1500);
    } else {
      endGame();
    }
  };

  const handleTimeout = () => {
    if (!gameOver) {
      Alert.alert('⏰ Time\'s Up!', 'Moving to next question.');
      setOpponentScore(prev => prev + 1);
      moveToNextQuestion();
    }
  };

  const confirmQuit = () => {
    Alert.alert(
      '⚠️ Quit Game?',
      'If you quit now, your opponent wins!',
      [
        { text: 'Continue Playing', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: handleQuit }
      ]
    );
  };

  const handleQuit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameOver(true);
    Alert.alert('Game Quit', 'You forfeited the match.');
    setTimeout(() => navigation.goBack(), 2000);
  };

  const endGame = () => {
    setGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const won = score > opponentScore;
    const prize = won ? calculatePrize(parseFloat(stakeAmount)) : 0;

    Alert.alert(
      won ? '🎉 VICTORY!' : '😞 DEFEAT',
      `Final Score: You ${score} - ${opponentScore} Opponent\n\n` +
      (won ? `You won ₦${prize.toFixed(2)}!` : 'Better luck next time!'),
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const OpponentMessage = () => (
    <Modal
      visible={showOpponentMessage}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.messageOverlay}>
        <LinearGradient
          colors={['#ff4757', '#ff6b6b']}
          style={styles.messageBox}
        >
          <Icon name="sports-esports" size={40} color="#fff" />
          <Text style={styles.messageText}>
            {opponent?.username} answered this question!
          </Text>
        </LinearGradient>
      </View>
    </Modal>
  );

  const renderInvite = ({ item }) => (
    <TouchableOpacity
      style={styles.inviteCard}
      onPress={() => handleAcceptInvite(item)}
    >
      <View style={styles.inviteHeader}>
        <Text style={styles.inviterName}>{item.inviter}</Text>
        <Text style={styles.inviteStake}>₦{item.stake}</Text>
      </View>
      <View style={styles.inviteDetails}>
        <Text style={styles.inviteText}>
          Winner gets: ₦{calculatePrize(item.stake).toFixed(2)}
        </Text>
        <Text style={styles.inviteTime}>
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>
      <TouchableOpacity style={styles.acceptButton}>
        <Text style={styles.acceptButtonText}>ACCEPT</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handleInvite(item)}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>
          {item.username[0].toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.userStats}>Wins: {item.wins} | Rank: #{item.rank}</Text>
      </View>
      <Icon name="sports-esports" size={24} color="#667eea" />
    </TouchableOpacity>
  );

  if (gameStarted) {
    return (
      <View style={styles.container}>
        <BackButton navigation={navigation} customOnPress={confirmQuit} />

        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gameHeader}>
          <View style={styles.gameHeaderTop}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>You</Text>
              <Text style={styles.playerScore}>{score}</Text>
            </View>
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{opponent?.username}</Text>
              <Text style={styles.playerScore}>{opponentScore}</Text>
            </View>
          </View>
          
          <View style={styles.gameStats}>
            <View style={styles.stat}>
              <Icon name="help" size={16} color="#fff" />
              <Text style={styles.statText}>
                {currentQuestion + 1}/{TOTAL_QUESTIONS}
              </Text>
            </View>
            <View style={[styles.stat, timeLeft < 3 && styles.timerWarning]}>
              <Icon name="timer" size={16} color="#fff" />
              <Text style={styles.statText}>{timeLeft}s</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="repeat" size={16} color="#fff" />
              <Text style={styles.statText}>Attempts: {attempts}/{MAX_ATTEMPTS}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.questionContainer}>
          <Text style={styles.questionNumber}>
            Question {currentQuestion + 1}/{TOTAL_QUESTIONS}
          </Text>
          <Text style={styles.questionText}>
            {questions[currentQuestion]?.question}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {questions[currentQuestion]?.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.optionSelected
              ]}
              onPress={() => handleAnswer(index)}
              disabled={selectedAnswer !== null || gameOver}
            >
              <View style={styles.optionPrefix}>
                <Text style={styles.optionPrefixText}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <OpponentMessage />
      </View>
    );
  }

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

      {activeGames.length > 0 && (
        <View style={styles.activeGamesSection}>
          <Text style={styles.sectionTitle}>Active Games</Text>
          {activeGames.map(game => (
            <TouchableOpacity
              key={game.id}
              style={styles.activeGameCard}
              onPress={() => {
                setGameStarted(true);
                setOpponent({ username: game.opponent });
                setGameId(game.id);
                loadQuestions();
              }}
            >
              <Text style={styles.activeGameText}>vs {game.opponent}</Text>
              <Text style={styles.activeGameStake}>₦{game.stake}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invite' && styles.activeTab]}
          onPress={() => setActiveTab('invite')}
        >
          <Text style={[styles.tabText, activeTab === 'invite' && styles.activeTabText]}>
            Invite Player
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'online' && styles.activeTab]}
          onPress={() => setActiveTab('online')}
        >
          <Text style={[styles.tabText, activeTab === 'online' && styles.activeTabText]}>
            Online Players
          </Text>
        </TouchableOpacity>
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
                <Text style={styles.prizeAmount}>
                  ₦{calculatePrize(parseFloat(stakeAmount)).toFixed(2)}
                </Text>
                <Text style={styles.prizeNote}>After 10% platform fee</Text>
              </View>
            )}

            <Text style={styles.label}>Quick Stake</Text>
            <View style={styles.quickStakes}>
              {[100, 200, 500, 1000, 5000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickStakeButton}
                  onPress={() => setStakeAmount(amount.toString())}
                >
                  <Text style={styles.quickStakeText}>₦{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.note}>
              Invite players from the online players tab
            </Text>
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
  activeGamesSection: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  activeGameCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  activeGameText: { fontSize: 14, fontWeight: '500', color: '#333' },
  activeGameStake: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },
  invitesSection: { paddingHorizontal: 20, marginBottom: 20 },
  invitesList: { flexDirection: 'row' },
  inviteCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginRight: 10, width: 250 },
  inviteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  inviterName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  inviteStake: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  inviteDetails: { marginBottom: 10 },
  inviteText: { fontSize: 12, color: '#666' },
  inviteTime: { fontSize: 10, color: '#999', marginTop: 2 },
  acceptButton: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 8, alignItems: 'center' },
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
  prizeNote: { fontSize: 10, color: '#999', marginTop: 2 },
  quickStakes: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  quickStakeButton: { backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, marginRight: 8, marginBottom: 8 },
  quickStakeText: { fontSize: 12, color: '#666' },
  note: { fontSize: 12, color: '#999', fontStyle: 'italic', textAlign: 'center' },
  usersList: { padding: 20 },
  userCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, padding: 12, marginBottom: 8 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  username: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  userStats: { fontSize: 11, color: '#666', marginTop: 2 },
  emptyState: { alignItems: 'center', padding: 50 },
  emptyStateText: { fontSize: 16, color: '#999', marginTop: 10 },
  // Game styles
  gameHeader: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  gameHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  playerInfo: { alignItems: 'center' },
  playerName: { color: '#fff', fontSize: 14, marginBottom: 5 },
  playerScore: { color: '#FFD700', fontSize: 24, fontWeight: 'bold' },
  vsContainer: { alignItems: 'center' },
  vsText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  gameStats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  statText: { color: '#fff', fontSize: 12, marginLeft: 4 },
  timerWarning: { backgroundColor: '#ff4757' },
  questionContainer: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15 },
  questionNumber: { fontSize: 12, color: '#667eea', fontWeight: 'bold', marginBottom: 10 },
  questionText: { fontSize: 16, color: '#333', lineHeight: 22 },
  optionsContainer: { paddingHorizontal: 20 },
  optionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  optionSelected: { backgroundColor: '#e0e0ff', borderWidth: 2, borderColor: '#667eea' },
  optionPrefix: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionPrefixText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  optionText: { flex: 1, fontSize: 14, color: '#333' },
  messageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  messageBox: { padding: 20, borderRadius: 15, alignItems: 'center', maxWidth: '80%' },
  messageText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' }
});

export default OneVOneScreen;