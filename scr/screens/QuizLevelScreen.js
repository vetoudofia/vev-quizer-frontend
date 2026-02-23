import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Dimensions,
  Modal,
  BackHandler
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';
import { useScreenProtection } from '../hooks/useScreenProtection';

const { width } = Dimensions.get('window');

const QuizLevelScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState('good');
  const [stakeAmount, setStakeAmount] = useState('500');
  const [customStake, setCustomStake] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [gameResult, setGameResult] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const timerRef = useRef(null);

  // Add screen protection
  useScreenProtection(gameStarted && !gameOver, confirmQuit);

  const levels = {
    good: {
      name: 'Good',
      icon: 'sentiment-satisfied',
      colors: ['#4CAF50', '#45a049'],
      questions: 45,
      requiredCorrect: 40,
      odds: 2.5,
      timePerQuestion: 10,
      description: 'Perfect for beginners',
      badge: 'Bronze'
    },
    smart: {
      name: 'Smart',
      icon: 'psychology',
      colors: ['#FF9800', '#F57C00'],
      questions: 65,
      requiredCorrect: 58,
      odds: 4.5,
      timePerQuestion: 10,
      description: 'For experienced players',
      badge: 'Silver'
    },
    best: {
      name: 'Best',
      icon: 'emoji-events',
      colors: ['#ff4757', '#ff6b6b'],
      questions: 85,
      requiredCorrect: 73,
      odds: 6.5,
      timePerQuestion: 10,
      description: 'Only for champions',
      badge: 'Gold'
    }
  };

  const PLATFORM_FEE = 0.10;

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
      if (timerRef.current) clearInterval(timerRef.current);
      backHandler.remove();
    };
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
    const sampleQuestions = [];
    for (let i = 0; i < levels[selectedLevel].questions; i++) {
      sampleQuestions.push({
        id: i + 1,
        question: `Sample question ${i + 1}?`,
        options: [`Option A`, `Option B`, `Option C`, `Option D`],
        correct: Math.floor(Math.random() * 4)
      });
    }
    setQuestions(sampleQuestions);
    setUserAnswers(new Array(sampleQuestions.length).fill(null));
    setTimeLeft(sampleQuestions.length * levels[selectedLevel].timePerQuestion);
  };

  const calculateWinnings = () => {
    const stake = parseFloat(stakeAmount);
    const level = levels[selectedLevel];
    const grossWin = stake * level.odds;
    const afterFee = grossWin * (1 - PLATFORM_FEE);
    return { gross: grossWin, net: afterFee, fee: grossWin * PLATFORM_FEE };
  };

  const checkBalance = () => {
    const stake = parseFloat(stakeAmount);
    if (balance < stake) {
      Alert.alert('Insufficient Balance', `You need ₦${stake} to play.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deposit', onPress: () => navigation.navigate('Wallet') }
      ]);
      return false;
    }
    return true;
  };

  const handlePlayPress = () => {
    if (!checkBalance()) return;
    
    const winnings = calculateWinnings();
    
    Alert.alert(
      'Confirm Game',
      `${levels[selectedLevel].name} Level\nStake: ₦${parseFloat(stakeAmount).toFixed(2)}\nPotential Win: ₦${winnings.net.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'START GAME', onPress: startGame }
      ]
    );
  };

  const startGame = async () => {
    setLoading(true);
    try {
      const stake = parseFloat(stakeAmount);
      const newBalance = balance - stake;
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
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setTimeLeft(prev => prev + levels[selectedLevel].timePerQuestion);
      } else {
        setGameOver(true);
        if (timerRef.current) clearInterval(timerRef.current);
        calculateResults();
      }
    }, 500);
  };

  const handleTimeout = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setGameOver(true);
      if (timerRef.current) clearInterval(timerRef.current);
      calculateResults();
    }
  };

  const calculateResults = () => {
    const finalScore = userAnswers.reduce((acc, answer, index) => {
      return acc + (answer === questions[index].correct ? 1 : 0);
    }, 0);
    setScore(finalScore);
    endGame();
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

  const endGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameOver(true);
    
    const stake = parseFloat(stakeAmount);
    const level = levels[selectedLevel];
    const isWin = score >= level.requiredCorrect;
    const winnings = calculateWinnings();
    const prize = isWin ? winnings.net : 0;

    if (isWin) {
      const newBalance = balance + prize;
      setBalance(newBalance);
      if (userData) {
        const updatedUser = { ...userData, balance: newBalance, total_earned: (userData.total_earned || 0) + prize };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      }
    }

    const gameResult = {
      result: isWin ? 'win' : 'loss',
      prize,
      score,
      requiredCorrect: level.requiredCorrect,
      totalQuestions: questions.length
    };

    setGameResult(gameResult);
    setShowResults(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!gameStarted) {
    return (
      <View style={styles.container}>
        <BackButton navigation={navigation} />
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose Your Level</Text>
          </View>

          <View style={styles.levelsContainer}>
            {Object.keys(levels).map(levelKey => (
              <TouchableOpacity
                key={levelKey}
                style={[styles.levelCard, selectedLevel === levelKey && styles.selectedLevelCard]}
                onPress={() => setSelectedLevel(levelKey)}
              >
                <LinearGradient colors={levels[levelKey].colors} style={styles.levelGradient}>
                  <Icon name={levels[levelKey].icon} size={30} color="#fff" />
                  <Text style={styles.levelName}>{levels[levelKey].name}</Text>
                  <View style={styles.levelStats}>
                    <Text style={styles.levelStat}>📚 {levels[levelKey].questions} Q</Text>
                    <Text style={styles.levelStat}>🎯 Need {levels[levelKey].requiredCorrect}</Text>
                    <Text style={styles.levelStat}>⚡ {levels[levelKey].odds}x</Text>
                  </View>
                  {selectedLevel === levelKey && (
                    <View style={styles.selectedIndicator}>
                      <Icon name="check-circle" size={24} color="#fff" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.stakeContainer}>
            <Text style={styles.sectionTitle}>Stake Amount</Text>
            
            <View style={styles.balanceInfo}>
              <Icon name="account-balance-wallet" size={20} color="#667eea" />
              <Text style={styles.balanceText}>Balance: ₦{balance.toFixed(2)}</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Stake amount (min ₦10)"
              keyboardType="numeric"
              value={stakeAmount}
              onChangeText={setStakeAmount}
            />

            <View style={styles.quickStakes}>
              {[100, 500, 1000, 5000].map(amount => (
                <TouchableOpacity key={amount} style={styles.quickStakeButton} onPress={() => setStakeAmount(amount.toString())}>
                  <Text style={styles.quickStakeText}>₦{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {stakeAmount > 0 && (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.prizeContainer}>
              <Text style={styles.prizeTitle}>Potential Prize</Text>
              <Text style={styles.prizeAmount}>₦{calculateWinnings().net.toFixed(2)}</Text>
            </LinearGradient>
          )}

          <TouchableOpacity style={styles.playButton} onPress={handlePlayPress}>
            <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.playButtonGradient}>
              <Text style={styles.playButtonText}>PLAY NOW</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} customOnPress={confirmQuit} />

      <LinearGradient colors={levels[selectedLevel].colors} style={styles.gameHeader}>
        <View style={styles.gameStats}>
          <View style={styles.stat}><Icon name="help" size={16} color="#fff" /><Text style={styles.statText}>{currentQuestion + 1}/{questions.length}</Text></View>
          <View style={styles.stat}><Icon name="star" size={16} color="#FFD700" /><Text style={styles.statText}>{score}</Text></View>
          <View style={[styles.stat, timeLeft < 30 && styles.timerWarning]}><Icon name="timer" size={16} color="#fff" /><Text style={styles.statText}>{formatTime(timeLeft)}</Text></View>
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
              <Text style={styles.statValue}>{score}/{gameResult?.totalQuestions}</Text>
              <Text style={styles.requirementText}>Required: {gameResult?.requiredCorrect}</Text>
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
  header: { paddingTop: 60, paddingHorizontal: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  levelsContainer: { padding: 20 },
  levelCard: { marginBottom: 15, borderRadius: 15, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  selectedLevelCard: { borderColor: '#667eea', borderWidth: 3 },
  levelGradient: { padding: 20, position: 'relative' },
  levelName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  levelStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  levelStat: { color: '#fff', fontSize: 12 },
  selectedIndicator: { position: 'absolute', top: 10, right: 10 },
  stakeContainer: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 15, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  balanceInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0ff', padding: 10, borderRadius: 10, marginBottom: 15 },
  balanceText: { marginLeft: 10, fontSize: 14, color: '#333', fontWeight: '500' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  quickStakes: { flexDirection: 'row', flexWrap: 'wrap' },
  quickStakeButton: { backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, marginRight: 10, marginBottom: 10 },
  quickStakeText: { fontSize: 14, color: '#666' },
  prizeContainer: { marginHorizontal: 20, marginTop: 20, borderRadius: 15, padding: 20, alignItems: 'center' },
  prizeTitle: { color: '#fff', fontSize: 14 },
  prizeAmount: { color: '#FFD700', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  playButton: { marginHorizontal: 20, marginTop: 20, marginBottom: 30, borderRadius: 10, overflow: 'hidden' },
  playButtonGradient: { padding: 18, alignItems: 'center' },
  playButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  gameHeader: { padding: 20, alignItems: 'center' },
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
  requirementText: { fontSize: 14, color: '#666', marginTop: 5 },
  winAmount: { fontSize: 28, fontWeight: 'bold', color: '#4CAF50', marginTop: 10 },
  closeButton: { backgroundColor: '#667eea', padding: 18, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default QuizLevelScreen;