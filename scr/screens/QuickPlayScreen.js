import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  BackHandler,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';
import { useScreenProtection } from '../hooks/useScreenProtection';

const { width } = Dimensions.get('window');

const QuickPlayScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  const timerRef = useRef(null);

  const STAKE_AMOUNT = 100;
  const ODDS = 3.0;
  const PLATFORM_FEE = 0.10;
  const TOTAL_QUESTIONS = 10;
  const TIME_LIMIT = 60;

  // Add screen protection
  useScreenProtection(gameStarted && !gameOver, confirmQuit);

  useEffect(() => {
    loadUserData();
    loadQuestions();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (gameStarted && !gameOver) {
        confirmQuit();
        return true;
      }
      return false;
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      backHandler.remove();
    };
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            endGame('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, gameOver]);

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

  const loadQuestions = () => {
    const sampleQuestions = [
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
    setQuestions(sampleQuestions);
    setUserAnswers(new Array(sampleQuestions.length).fill(null));
  };

  const checkBalance = () => {
    if (balance < STAKE_AMOUNT) {
      Alert.alert('Insufficient Balance', `You need ₦${STAKE_AMOUNT} to play.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deposit', onPress: () => navigation.navigate('Wallet') }
      ]);
      return false;
    }
    return true;
  };

  const confirmStake = () => {
    if (!checkBalance()) return;
    
    Alert.alert(
      'Confirm Stake',
      `Stake: ₦${STAKE_AMOUNT}\nPotential Win: ₦${(STAKE_AMOUNT * ODDS * (1 - PLATFORM_FEE)).toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PLAY NOW', onPress: startGame }
      ]
    );
  };

  const startGame = async () => {
    setLoading(true);
    try {
      const newBalance = balance - STAKE_AMOUNT;
      setBalance(newBalance);
      
      if (userData) {
        const updatedUser = { ...userData, balance: newBalance };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        setUserData(updatedUser);
      }

      setGameStarted(true);
      setLoading(false);
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game');
      setLoading(false);
    }
  };

  const handleAnswer = (index) => {
    if (selectedAnswer !== null || gameOver) return;

    setSelectedAnswer(index);
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = index;
    setUserAnswers(newAnswers);

    const isCorrect = index === questions[currentQuestion].correct;
    if (isCorrect) setScore(prev => prev + 1);

    setTimeout(() => {
      if (currentQuestion < TOTAL_QUESTIONS - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setGameOver(true);
        if (timerRef.current) clearInterval(timerRef.current);
        calculateResults();
      }
    }, 500);
  };

  const calculateResults = () => {
    const finalScore = userAnswers.reduce((acc, answer, index) => {
      return acc + (answer === questions[index].correct ? 1 : 0);
    }, 0);
    setScore(finalScore);
    endGame('completed');
  };

  const confirmQuit = () => {
    Alert.alert(
      '⚠️ Warning',
      'If you quit now, you will LOSE your stake!',
      [
        { text: 'NO, CONTINUE', style: 'cancel' },
        { text: 'YES, QUIT', style: 'destructive', onPress: handleQuit }
      ]
    );
  };

  const handleQuit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigation.goBack();
  };

  const endGame = async (reason) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameOver(true);
    
    const won = (score === TOTAL_QUESTIONS);
    const prize = won ? STAKE_AMOUNT * ODDS * (1 - PLATFORM_FEE) : 0;

    if (won) {
      const newBalance = balance + prize;
      setBalance(newBalance);
      if (userData) {
        const updatedUser = { ...userData, balance: newBalance, total_earned: (userData.total_earned || 0) + prize };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      }
    }

    const gameResult = {
      result: won ? 'win' : 'loss',
      prize,
      score,
      totalQuestions: TOTAL_QUESTIONS
    };

    setGameResult(gameResult);
    setShowResults(true);
  };

  if (!gameStarted && !gameOver) {
    return (
      <View style={styles.container}>
        <BackButton navigation={navigation} />
        <ScrollView contentContainerStyle={styles.startContainer}>
          <LinearGradient colors={['#ff6b6b', '#ff4757']} style={styles.gameHeader}>
            <Icon name="flash-on" size={60} color="#fff" />
            <Text style={styles.gameTitle}>Quick Play</Text>
            <Text style={styles.gameSubtitle}>Fast-Paced Quiz Action</Text>
          </LinearGradient>

          <View style={styles.stakeCard}>
            <Text style={styles.stakeLabel}>Stake Amount</Text>
            <Text style={styles.stakeAmount}>₦{STAKE_AMOUNT}</Text>
            <View style={styles.potentialWinContainer}>
              <Text style={styles.potentialWinLabel}>Potential Win</Text>
              <Text style={styles.potentialWinAmount}>
                ₦{(STAKE_AMOUNT * ODDS * (1 - PLATFORM_FEE)).toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={styles.balanceAmount}>₦{balance.toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={styles.playButton} onPress={confirmStake} disabled={loading}>
            <LinearGradient colors={balance < STAKE_AMOUNT ? ['#ccc', '#999'] : ['#4CAF50', '#45a049']} style={styles.playButtonGradient}>
              <Text style={styles.playButtonText}>
                {loading ? 'PROCESSING...' : balance < STAKE_AMOUNT ? 'INSUFFICIENT BALANCE' : 'PLAY NOW'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} customOnPress={confirmQuit} />
      
      <LinearGradient colors={['#ff6b6b', '#ff4757']} style={styles.gameHeader}>
        <View style={styles.gameStats}>
          <View style={styles.stat}><Icon name="help" size={16} color="#fff" /><Text style={styles.statText}>{currentQuestion + 1}/{TOTAL_QUESTIONS}</Text></View>
          <View style={styles.stat}><Icon name="star" size={16} color="#FFD700" /><Text style={styles.statText}>{score}</Text></View>
          <View style={[styles.stat, timeLeft < 10 && styles.timerWarning]}><Icon name="timer" size={16} color="#fff" /><Text style={styles.statText}>{Math.floor(timeLeft / 60)}:{timeLeft % 10 < 10 ? '0' : ''}{timeLeft % 60}</Text></View>
        </View>
      </LinearGradient>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{questions[currentQuestion]?.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {questions[currentQuestion]?.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.optionButton, selectedAnswer === index && styles.optionSelected]}
            onPress={() => handleAnswer(index)}
            disabled={userAnswers[currentQuestion] !== null || gameOver}
          >
            <View style={styles.optionPrefix}><Text style={styles.optionPrefixText}>{String.fromCharCode(65 + index)}</Text></View>
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={showResults} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.resultsModal}>
            <LinearGradient colors={gameResult?.result === 'win' ? ['#4CAF50', '#45a049'] : ['#ff4757', '#ff6b6b']} style={styles.resultsHeader}>
              <Text style={styles.resultsHeaderText}>{gameResult?.result === 'win' ? '🎉 VICTORY!' : '😞 GAME OVER'}</Text>
            </LinearGradient>
            <View style={styles.resultsStats}>
              <Text style={styles.statValue}>{score}/{TOTAL_QUESTIONS}</Text>
              {gameResult?.result === 'win' && <Text style={styles.winAmount}>₦{gameResult.prize.toFixed(2)}</Text>}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => { setShowResults(false); navigation.goBack(); }}>
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  startContainer: { padding: 20, paddingTop: 80 },
  gameHeader: { padding: 20, alignItems: 'center' },
  gameTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  gameSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 5 },
  stakeCard: { backgroundColor: '#667eea', borderRadius: 15, padding: 20, marginTop: 20, alignItems: 'center' },
  stakeLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  stakeAmount: { color: '#fff', fontSize: 40, fontWeight: 'bold', marginTop: 5 },
  potentialWinContainer: { alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  potentialWinLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  potentialWinAmount: { color: '#FFD700', fontSize: 24, fontWeight: 'bold', marginTop: 5 },
  balanceCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 16, color: '#333' },
  balanceAmount: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  playButton: { marginTop: 20, borderRadius: 10, overflow: 'hidden' },
  playButtonGradient: { padding: 18, alignItems: 'center' },
  playButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  gameStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  stat: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  statText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 5 },
  timerWarning: { backgroundColor: '#ff4757' },
  questionContainer: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15 },
  questionText: { fontSize: 18, color: '#333', lineHeight: 24 },
  optionsContainer: { paddingHorizontal: 20 },
  optionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10 },
  optionSelected: { backgroundColor: '#e0e0ff', borderWidth: 2, borderColor: '#667eea' },
  optionPrefix: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  optionPrefixText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  optionText: { flex: 1, fontSize: 16, color: '#333' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  resultsModal: { width: width * 0.8, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  resultsHeader: { padding: 20, alignItems: 'center' },
  resultsHeaderText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  resultsStats: { padding: 20, alignItems: 'center' },
  winAmount: { fontSize: 28, fontWeight: 'bold', color: '#4CAF50', marginTop: 10 },
  closeButton: { backgroundColor: '#667eea', padding: 18, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default QuickPlayScreen;