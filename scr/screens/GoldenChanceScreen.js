import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  BackHandler
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';
import { useTutorial } from '../hooks/useTutorial';
import { useScreenProtection } from '../hooks/useScreenProtection';

const { width } = Dimensions.get('window');

const GoldenChanceScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [stakeAmount, setStakeAmount] = useState(100);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [loading, setLoading] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);

  const ODDS = 10;
  const PLATFORM_FEE = 0.10;
  const TIME_LIMIT = 5;

  // Tutorial
  const { showTutorial } = useTutorial(
    'Golden Chance',
    '🎲 GOLDEN CHANCE RULES:\n\n' +
    '• Answer 1 question correctly\n' +
    '• Time limit: 5 seconds\n' +
    '• 10x multiplier if correct!\n' +
    '• Questions never repeat\n' +
    '• Options shuffle every time\n\n' +
    'Ready to try your luck?'
  );

  // Screen protection
  useScreenProtection(gameStarted && !gameOver, confirmQuit);

  useEffect(() => {
    loadUserData();
    loadQuestionHistory();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (gameStarted && !gameOver) {
        confirmQuit();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    let timer;
    if (gameStarted && !gameOver && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, gameStarted, gameOver]);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsed = JSON.parse(data);
        setUserData(parsed);
        setBalance(parsed.balance || 0);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadQuestionHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('goldenChanceHistory');
      if (history) {
        setQuestionHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading question history:', error);
    }
  };

  const getRandomQuestion = () => {
    // Sample questions - in production, fetch from API
    const allQuestions = [
      {
        id: 1,
        question: "What is the capital of Nigeria?",
        options: ["Lagos", "Abuja", "Kano", "Ibadan"],
        correct: 1
      },
      {
        id: 2,
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correct: 1
      },
      {
        id: 3,
        question: "Who painted the Mona Lisa?",
        options: ["Van Gogh", "Picasso", "Da Vinci", "Rembrandt"],
        correct: 2
      },
      {
        id: 4,
        question: "What is the largest ocean?",
        options: ["Atlantic", "Indian", "Arctic", "Pacific"],
        correct: 3
      },
      {
        id: 5,
        question: "Nigeria's independence year?",
        options: ["1956", "1960", "1963", "1965"],
        correct: 1
      }
    ];

    // Filter out used questions
    const availableQuestions = allQuestions.filter(
      q => !questionHistory.includes(q.id)
    );

    if (availableQuestions.length === 0) {
      // Reset history if all questions used
      setQuestionHistory([]);
      return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }

    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  };

  const shuffleOptions = (question) => {
    const options = [...question.options];
    const correctIdx = question.correct;
    
    // Create pairs and shuffle
    const pairs = options.map((opt, idx) => ({ opt, idx }));
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    
    // Find new correct index
    const newCorrect = pairs.findIndex(p => p.idx === correctIdx);
    
    return {
      ...question,
      options: pairs.map(p => p.opt),
      shuffledCorrect: newCorrect
    };
  };

  const checkBalance = () => {
    if (balance < stakeAmount) {
      Alert.alert('Insufficient Balance', `You need ₦${stakeAmount} to play.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deposit', onPress: () => navigation.navigate('Wallet') }
      ]);
      return false;
    }
    return true;
  };

  const startGame = async () => {
    if (!checkBalance()) return;

    setLoading(true);
    try {
      // Deduct stake
      const newBalance = balance - stakeAmount;
      setBalance(newBalance);
      
      if (userData) {
        const updatedUser = { ...userData, balance: newBalance };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        setUserData(updatedUser);
      }

      // Get random question
      const question = getRandomQuestion();
      const shuffledQuestion = shuffleOptions(question);
      
      setCurrentQuestion(shuffledQuestion);
      setGameStarted(true);
      setTimeLeft(TIME_LIMIT);
      
      // Add to history
      const newHistory = [...questionHistory, question.id];
      setQuestionHistory(newHistory);
      await AsyncStorage.setItem('goldenChanceHistory', JSON.stringify(newHistory));

    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index) => {
    if (selectedAnswer !== null || gameOver) return;

    setSelectedAnswer(index);
    
    const isCorrect = (index === currentQuestion.shuffledCorrect);
    
    if (isCorrect) {
      // Calculate winnings
      const grossWin = stakeAmount * ODDS;
      const netWin = grossWin * (1 - PLATFORM_FEE);
      
      // Update balance
      const newBalance = balance + netWin;
      setBalance(newBalance);
      
      if (userData) {
        const updatedUser = { 
          ...userData, 
          balance: newBalance,
          total_earned: (userData.total_earned || 0) + netWin
        };
        AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      }

      Alert.alert(
        '🎉 YOU WIN!',
        `You won ₦${netWin.toFixed(2)}!`,
        [{ text: 'Awesome!', onPress: () => endGame(true) }]
      );
    } else {
      Alert.alert(
        '😞 Wrong Answer',
        'Better luck next time!',
        [{ text: 'OK', onPress: () => endGame(false) }]
      );
    }
  };

  const handleTimeout = () => {
    if (!gameOver) {
      setGameOver(true);
      Alert.alert(
        '⏰ Time\'s Up!',
        'You ran out of time.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const confirmQuit = () => {
    Alert.alert(
      '⚠️ Quit Game?',
      'If you quit now, you will lose your stake!',
      [
        { text: 'Continue Playing', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  const endGame = (won) => {
    setGameOver(true);
    setTimeout(() => {
      navigation.goBack();
    }, 2000);
  };

  const stakeOptions = [100, 200, 500, 1000, 2000, 5000];

  if (!gameStarted) {
    return (
      <View style={styles.container}>
        <BackButton navigation={navigation} />
        
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.header}
        >
          <Icon name="stars" size={60} color="#fff" />
          <Text style={styles.headerTitle}>GOLDEN CHANCE</Text>
          <Text style={styles.headerSubtitle}>10x Multiplier • 5 Seconds</Text>
        </LinearGradient>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="info" size={20} color="#FFD700" />
            <Text style={styles.infoText}>Answer 1 question correctly</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="timer" size={20} color="#FFD700" />
            <Text style={styles.infoText}>Time limit: 5 seconds</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="trending-up" size={20} color="#FFD700" />
            <Text style={styles.infoText}>10x multiplier if correct!</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="shuffle" size={20} color="#FFD700" />
            <Text style={styles.infoText}>Questions never repeat</Text>
          </View>
        </View>

        <View style={styles.stakeCard}>
          <Text style={styles.stakeLabel}>Select Stake</Text>
          
          <View style={styles.stakeOptions}>
            {stakeOptions.map(amount => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.stakeOption,
                  stakeAmount === amount && styles.selectedStake
                ]}
                onPress={() => setStakeAmount(amount)}
              >
                <Text style={[
                  styles.stakeOptionText,
                  stakeAmount === amount && styles.selectedStakeText
                ]}>
                  ₦{amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.prizeContainer}>
            <Text style={styles.prizeLabel}>Potential Win</Text>
            <Text style={styles.prizeAmount}>
              ₦{(stakeAmount * ODDS * (1 - PLATFORM_FEE)).toFixed(2)}
            </Text>
            <Text style={styles.prizeNote}>After 10% platform fee</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceAmount}>₦{balance.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.playButton, balance < stakeAmount && styles.playButtonDisabled]}
          onPress={startGame}
          disabled={balance < stakeAmount || loading}
        >
          <LinearGradient
            colors={balance < stakeAmount ? ['#ccc', '#999'] : ['#FFD700', '#FFA500']}
            style={styles.playButtonGradient}
          >
            <Text style={styles.playButtonText}>
              {loading ? 'STARTING...' : 
               balance < stakeAmount ? 'INSUFFICIENT BALANCE' : 'PLAY GOLDEN CHANCE'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} customOnPress={confirmQuit} />

      <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.gameHeader}>
        <View style={styles.gameStats}>
          <View style={[styles.stat, timeLeft < 3 && styles.timerWarning]}>
            <Icon name="timer" size={20} color="#fff" />
            <Text style={styles.statText}>{timeLeft}s</Text>
          </View>
          <View style={styles.stat}>
            <Icon name="stars" size={20} color="#fff" />
            <Text style={styles.statText}>{ODDS}x</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {currentQuestion?.question}
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion?.options.map((option, index) => (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 5 },
  infoCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, margin: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { marginLeft: 10, fontSize: 14, color: '#333' },
  stakeCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginHorizontal: 20 },
  stakeLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  stakeOptions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  stakeOption: { width: '30%', backgroundColor: '#f5f5f5', padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  selectedStake: { backgroundColor: '#FFD700', borderColor: '#FFA500' },
  stakeOptionText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  selectedStakeText: { color: '#fff' },
  prizeContainer: { alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  prizeLabel: { fontSize: 12, color: '#999' },
  prizeAmount: { fontSize: 24, fontWeight: 'bold', color: '#FFD700', marginTop: 5 },
  prizeNote: { fontSize: 10, color: '#999', marginTop: 3 },
  balanceCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, margin: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 16, color: '#333' },
  balanceAmount: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  playButton: { marginHorizontal: 20, borderRadius: 10, overflow: 'hidden' },
  playButtonDisabled: { opacity: 0.5 },
  playButtonGradient: { padding: 18, alignItems: 'center' },
  playButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  gameHeader: { padding: 20, alignItems: 'center' },
  gameStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  stat: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  statText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  timerWarning: { backgroundColor: '#ff4757' },
  questionContainer: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15 },
  questionText: { fontSize: 20, color: '#333', lineHeight: 28, textAlign: 'center' },
  optionsContainer: { paddingHorizontal: 20 },
  optionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10 },
  optionSelected: { backgroundColor: '#e0e0ff', borderWidth: 2, borderColor: '#667eea' },
  optionPrefix: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  optionPrefixText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  optionText: { flex: 1, fontSize: 16, color: '#333' }
});

export default GoldenChanceScreen;