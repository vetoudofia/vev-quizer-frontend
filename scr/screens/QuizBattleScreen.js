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
  Modal,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';
import { useTutorial } from '../hooks/useTutorial';
import { useScreenProtection } from '../hooks/useScreenProtection';

const { width } = Dimensions.get('window');

const QuizBattleScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [games, setGames] = useState([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('3');
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showGameDetails, setShowGameDetails] = useState(false);
  const [joinedPlayers, setJoinedPlayers] = useState([]);

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [playerScores, setPlayerScores] = useState({});
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [answeredPlayers, setAnsweredPlayers] = useState([]);
  const [showAnswerNotifications, setShowAnswerNotifications] = useState(false);
  const [lastAnswerer, setLastAnswerer] = useState(null);

  // Tie-breaker state
  const [tieBreaker, setTieBreaker] = useState(false);
  const [tiedPlayers, setTiedPlayers] = useState([]);
  const [tieScores, setTieScores] = useState({});
  const [tieQuestions, setTieQuestions] = useState([]);
  const [tieCurrentQuestion, setTieCurrentQuestion] = useState(0);
  const TIE_WIN_SCORE = 4;

  const timerRef = useRef(null);
  const eventSourceRef = useRef(null);

  const PLATFORM_FEE = 0.10;
  const TOTAL_QUESTIONS = 50;

  // Tutorial
  const { showTutorial } = useTutorial(
    'Quiz Battle',
    '👥 QUIZ BATTLE RULES:\n\n' +
    '• 3-10 players compete\n' +
    '• 1 attempt per question\n' +
    '• First correct answer wins the point\n' +
    '• See who answered first in real-time\n' +
    '• If tied at the end → SUDDEN DEATH!\n' +
    '• Tied players face off: first to 4 correct wins\n' +
    '• Winner takes all minus 10% fee\n\n' +
    'May the fastest win!'
  );

  // Screen protection
  useScreenProtection((gameStarted || tieBreaker) && !gameOver, confirmQuit);

  useEffect(() => {
    loadUserBalance();
    loadAvailableGames();
    
    const interval = setInterval(loadAvailableGames, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ((gameStarted || tieBreaker) && !gameOver && timeLeft > 0) {
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
  }, [gameStarted, tieBreaker, gameOver, currentQuestion, tieCurrentQuestion]);

  // Simulate other players answering (in production, use WebSockets)
  useEffect(() => {
    if (gameStarted && !gameOver && players.length > 1) {
      const otherPlayers = players.filter(p => p.id !== 'me');
      if (otherPlayers.length > 0 && !answeredPlayers.includes(otherPlayers[0].id)) {
        const answerTimer = setTimeout(() => {
          const randomPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
          if (!answeredPlayers.includes(randomPlayer.id) && selectedAnswer === null) {
            handleOtherPlayerAnswer(randomPlayer);
          }
        }, Math.random() * 3000 + 1000);

        return () => clearTimeout(answerTimer);
      }
    }
  }, [gameStarted, gameOver, currentQuestion, answeredPlayers, selectedAnswer, players]);

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

  const loadAvailableGames = () => {
    // Mock data - replace with API call
    setGames([
      {
        id: 'game1',
        creator: 'QuizMaster',
        stake: 500,
        maxPlayers: 4,
        currentPlayers: 2,
        code: 'BAT123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'game2',
        creator: 'BrainKing',
        stake: 1000,
        maxPlayers: 3,
        currentPlayers: 1,
        code: 'BAT456',
        createdAt: new Date().toISOString()
      },
      {
        id: 'game3',
        creator: 'SmartGuy',
        stake: 2000,
        maxPlayers: 5,
        currentPlayers: 3,
        code: 'BAT789',
        createdAt: new Date().toISOString()
      }
    ]);
  };

  const loadGamePlayers = (gameId) => {
    // Mock data - replace with API call
    setJoinedPlayers([
      { id: 'user1', username: 'QuizMaster', isCreator: true },
      { id: 'user2', username: 'Player2', isCreator: false },
      { id: 'user3', username: 'Player3', isCreator: false }
    ]);
  };

  const calculatePrize = () => {
    const stake = parseFloat(stakeAmount) || 0;
    const players = parseInt(maxPlayers) || 3;
    const totalPot = stake * players;
    const platformFee = totalPot * PLATFORM_FEE;
    return {
      total: totalPot,
      fee: platformFee,
      winner: totalPot - platformFee,
      perPlayer: stake
    };
  };

  const loadQuestions = () => {
    // Mock questions - replace with API call
    const sampleQuestions = [];
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      sampleQuestions.push({
        id: i + 1,
        question: `Battle Question ${i + 1}?`,
        options: [`Option A`, `Option B`, `Option C`, `Option D`],
        correct: Math.floor(Math.random() * 4)
      });
    }
    setQuestions(sampleQuestions);
  };

  const loadTieQuestions = () => {
    // Load 10 questions for tie breaker
    const tieQs = [];
    for (let i = 0; i < 10; i++) {
      tieQs.push({
        id: `tie-${i}`,
        question: `⚔️ TIE-BREAKER Q${i + 1}: Which option is correct?`,
        options: [`Option A`, `Option B`, `Option C`, `Option D`],
        correct: Math.floor(Math.random() * 4)
      });
    }
    setTieQuestions(tieQs);
  };

  const handleOtherPlayerAnswer = (player) => {
    setAnsweredPlayers(prev => [...prev, player.id]);
    setLastAnswerer(player);
    setShowAnswerNotifications(true);
    
    // Update player score
    setPlayerScores(prev => ({
      ...prev,
      [player.id]: (prev[player.id] || 0) + 1
    }));
    
    setTimeout(() => setShowAnswerNotifications(false), 2000);
  };

  const handleAnswer = (index) => {
    if (selectedAnswer !== null || gameOver) return;

    setSelectedAnswer(index);
    
    const isCorrect = (index === questions[currentQuestion].correct);
    
    if (isCorrect) {
      // Update player's score
      setPlayerScores(prev => ({
        ...prev,
        me: (prev.me || 0) + 1
      }));
      
      // Move to next question
      setTimeout(() => {
        if (currentQuestion < TOTAL_QUESTIONS - 1) {
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
          setAnsweredPlayers([]);
          setTimeLeft(10);
        } else {
          endGame();
        }
      }, 1000);
    } else {
      // Wrong answer - no point, move to next question
      setTimeout(() => {
        if (currentQuestion < TOTAL_QUESTIONS - 1) {
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
          setAnsweredPlayers([]);
          setTimeLeft(10);
        } else {
          endGame();
        }
      }, 1000);
    }
  };

  const handleTieAnswer = (index) => {
    if (selectedAnswer !== null || gameOver) return;

    setSelectedAnswer(index);
    
    const isCorrect = (index === tieQuestions[tieCurrentQuestion].correct);
    
    if (isCorrect) {
      // Update score for current player
      const newScores = { ...tieScores };
      newScores.me = (newScores.me || 0) + 1;
      setTieScores(newScores);
      
      // Check if player won
      if (newScores.me >= TIE_WIN_SCORE) {
        endTieBreaker('me');
        return;
      }
    }
    
    // Move to next tie question
    setTimeout(() => {
      if (tieCurrentQuestion < tieQuestions.length - 1) {
        setTieCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setTimeLeft(10);
      } else {
        // If all questions exhausted, compare scores
        const myScore = tieScores.me || 0;
        const highestOpponent = Math.max(...Object.values(tieScores).filter(v => v !== myScore));
        
        if (myScore > highestOpponent) {
          endTieBreaker('me');
        } else {
          // Continue with more questions (in production, fetch more)
          loadTieQuestions();
          setTieCurrentQuestion(0);
          setSelectedAnswer(null);
          setTimeLeft(10);
        }
      }
    }, 1000);
  };

  const handleTimeout = () => {
    if (!gameOver) {
      if (tieBreaker) {
        // In tie breaker, timeout means move to next question
        if (tieCurrentQuestion < tieQuestions.length - 1) {
          setTieCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
          setTimeLeft(10);
        } else {
          // End tie breaker with current scores
          const myScore = tieScores.me || 0;
          const highestOpponent = Math.max(...Object.values(tieScores).filter(v => v !== myScore));
          
          if (myScore > highestOpponent) {
            endTieBreaker('me');
          } else {
            Alert.alert('🤝 Tie Continues', 'Moving to next set of questions...');
            loadTieQuestions();
            setTieCurrentQuestion(0);
            setSelectedAnswer(null);
            setTimeLeft(10);
          }
        }
      } else {
        // Regular game timeout - move to next question
        if (currentQuestion < TOTAL_QUESTIONS - 1) {
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
          setAnsweredPlayers([]);
          setTimeLeft(10);
        } else {
          endGame();
        }
      }
    }
  };

  const confirmQuit = () => {
    Alert.alert(
      '⚠️ Quit Game?',
      tieBreaker ? 
        'If you quit now, you lose the tie-breaker!' :
        'If you quit now, you forfeit your stake!',
      [
        { text: 'Continue Playing', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: handleQuit }
      ]
    );
  };

  const handleQuit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameOver(true);
    setTieBreaker(false);
    Alert.alert('Game Quit', 'You forfeited the match.');
    setTimeout(() => navigation.goBack(), 2000);
  };

  const endGame = () => {
    setGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Find highest score
    const maxScore = Math.max(...Object.values(playerScores));
    
    // Find all players with max score
    const tied = Object.entries(playerScores)
      .filter(([_, score]) => score === maxScore)
      .map(([id]) => id);

    if (tied.length > 1) {
      // Multiple winners - start tie breaker
      startTieBreaker(tied);
    } else {
      // Single winner
      const winner = players.find(p => p.id === tied[0]);
      const totalPot = parseFloat(stakeAmount) * players.length;
      const prize = totalPot * (1 - PLATFORM_FEE);
      
      Alert.alert(
        '🏆 WINNER!',
        `${winner?.username || 'You'} wins ₦${prize.toFixed(2)}!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const startTieBreaker = (tied) => {
    setTiedPlayers(tied);
    setTieBreaker(true);
    setGameOver(false);
    
    // Initialize tie scores
    const initialScores = {};
    tied.forEach(id => { initialScores[id] = 0; });
    setTieScores(initialScores);
    
    // Load tie breaker questions
    loadTieQuestions();
    
    Alert.alert(
      '⚔️ SUDDEN DEATH TIE-BREAKER!',
      `Tied players: ${tied.map(id => 
        players.find(p => p.id === id)?.username || 'You'
      ).join(' vs ')}\n\n` +
      `First to answer ${TIE_WIN_SCORE} questions correctly wins!\n\n` +
      `Stake remains: ₦${stakeAmount}`,
      [{ text: 'FIGHT!', onPress: () => setTieCurrentQuestion(0) }]
    );
  };

  const endTieBreaker = (winnerId) => {
    setTieBreaker(false);
    setGameOver(true);
    
    const winner = winnerId === 'me' ? 'You' : 
      players.find(p => p.id === winnerId)?.username;
    const totalPot = parseFloat(stakeAmount) * players.length;
    const prize = totalPot * (1 - PLATFORM_FEE);
    
    Alert.alert(
      '🏆 TIE-BREAKER WINNER!',
      `${winner} wins after answering ${TIE_WIN_SCORE} correct!\n\n` +
      `Prize: ₦${prize.toFixed(2)}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const handleGamePress = (game) => {
    setSelectedGame(game);
    loadGamePlayers(game.id);
    setShowGameDetails(true);
  };

  const handleJoinGame = () => {
    if (!selectedGame) return;

    if (selectedGame.stake > userBalance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough balance');
      return;
    }

    Alert.alert(
      'Join Game',
      `Stake: ₦${selectedGame.stake}\nPlayers: ${selectedGame.currentPlayers}/${selectedGame.maxPlayers}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'JOIN',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              setShowGameDetails(false);
              startBattle(selectedGame);
            }, 1500);
          }
        }
      ]
    );
  };

  const startBattle = (game) => {
    setGameStarted(true);
    setGameId(game.id);
    setPlayers([
      { id: 'me', username: 'You' },
      ...joinedPlayers.map(p => ({ id: p.id, username: p.username }))
    ]);
    setPlayerScores({ me: 0 });
    setCurrentQuestion(0);
    loadQuestions();
    setTimeLeft(10);
  };

  const handleCreateGame = () => {
    const stake = parseFloat(stakeAmount);
    const players = parseInt(maxPlayers);

    if (!stake || stake < 10) {
      Alert.alert('Error', 'Minimum stake is ₦10');
      return;
    }

    if (stake > userBalance) {
      Alert.alert('Insufficient Balance', 'Please deposit more funds');
      return;
    }

    if (players < 3 || players > 10) {
      Alert.alert('Error', 'Players must be between 3 and 10');
      return;
    }

    const prize = calculatePrize();

    Alert.alert(
      'Create Battle',
      `Stake: ₦${stake}\nPlayers: ${players}\nWinner gets: ₦${prize.winner.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'CREATE',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              Alert.alert('Game Created!', 'Waiting for players to join...');
            }, 1500);
          }
        }
      ]
    );
  };

  const AnswerNotification = () => (
    <Modal
      visible={showAnswerNotifications}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.notificationOverlay}>
        <LinearGradient
          colors={['#4CAF50', '#45a049']}
          style={styles.notificationBox}
        >
          <Icon name="emoji-events" size={40} color="#fff" />
          <Text style={styles.notificationText}>
            {lastAnswerer?.username} answered correctly!
          </Text>
        </LinearGradient>
      </View>
    </Modal>
  );

  const renderGame = ({ item }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => handleGamePress(item)}
    >
      <View style={styles.gameHeader}>
        <Text style={styles.gameCode}>{item.code}</Text>
        <Text style={styles.gameStake}>₦{item.stake}</Text>
      </View>
      <View style={styles.gameDetails}>
        <Text>Creator: {item.creator}</Text>
        <Text>Players: {item.currentPlayers}/{item.maxPlayers}</Text>
      </View>
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>VIEW</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (tieBreaker) {
    return (
      <View style={styles.container}>
        <BackButton navigation={navigation} customOnPress={confirmQuit} />

        <LinearGradient colors={['#ff4757', '#ff6b6b']} style={styles.tieHeader}>
          <Text style={styles.tieTitle}>⚔️ SUDDEN DEATH ⚔️</Text>
          <Text style={styles.tieSubtitle}>First to {TIE_WIN_SCORE} correct wins!</Text>
          
          <View style={styles.tieScores}>
            {tiedPlayers.map(id => {
              const isMe = id === 'me';
              const score = isMe ? tieScores.me || 0 : tieScores[id] || 0;
              return (
                <View key={id} style={styles.tieScoreItem}>
                  <Text style={styles.tiePlayerName}>
                    {isMe ? 'You' : players.find(p => p.id === id)?.username}
                  </Text>
                  <Text style={styles.tiePlayerScore}>{score}</Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>

        <View style={styles.gameStats}>
          <View style={[styles.stat, timeLeft < 3 && styles.timerWarning]}>
            <Icon name="timer" size={16} color="#fff" />
            <Text style={styles.statText}>{timeLeft}s</Text>
          </View>
          <View style={styles.stat}>
            <Icon name="help" size={16} color="#fff" />
            <Text style={styles.statText}>
              {tieCurrentQuestion + 1}/{tieQuestions.length}
            </Text>
          </View>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.tieQuestionLabel}>⚡ TIE-BREAKER ⚡</Text>
          <Text style={styles.questionText}>
            {tieQuestions[tieCurrentQuestion]?.question}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {tieQuestions[tieCurrentQuestion]?.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.optionSelected
              ]}
              onPress={() => handleTieAnswer(index)}
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
  }

  if (gameStarted) {
    return (
      <View style={styles.container}>
        <BackButton navigation={navigation} customOnPress={confirmQuit} />

        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gameHeader}>
          <View style={styles.playersList}>
            {players.map(player => (
              <View key={player.id} style={styles.playerScoreItem}>
                <Text style={styles.playerName}>{player.username}</Text>
                <Text style={[
                  styles.playerScore,
                  playerScores[player.id] === Math.max(...Object.values(playerScores)) && 
                  styles.leadingScore
                ]}>
                  {playerScores[player.id] || 0}
                </Text>
                {answeredPlayers.includes(player.id) && player.id !== 'me' && (
                  <Icon name="check-circle" size={16} color="#4CAF50" />
                )}
              </View>
            ))}
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
          </View>
        </LinearGradient>

        <View style={styles.questionContainer}>
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

        <AnswerNotification />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} />
      
      <LinearGradient colors={['#a18cd1', '#fbc2eb']} style={styles.header}>
        <Icon name="groups" size={40} color="#fff" />
        <Text style={styles.headerTitle}>Quiz Battle</Text>
        <Text style={styles.headerSubtitle}>Compete with multiple players</Text>
      </LinearGradient>

      <View style={styles.balanceCard}>
        <Icon name="account-balance-wallet" size={24} color="#667eea" />
        <Text style={styles.balanceLabel}>Balance: ₦{userBalance.toFixed(2)}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
            Create Game
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'join' && styles.activeTab]}
          onPress={() => setActiveTab('join')}
        >
          <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>
            Join Game
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'create' ? (
        <ScrollView style={styles.content}>
          <View style={styles.createSection}>
            <Text style={styles.label}>Stake Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter stake amount"
              keyboardType="numeric"
              value={stakeAmount}
              onChangeText={setStakeAmount}
            />

            <Text style={styles.label}>Max Players (3-10)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of players"
              keyboardType="numeric"
              value={maxPlayers}
              onChangeText={setMaxPlayers}
            />

            {stakeAmount > 0 && maxPlayers > 0 && (
              <View style={styles.prizeCard}>
                <Text style={styles.prizeLabel}>Winner's Prize</Text>
                <Text style={styles.prizeAmount}>
                  ₦{calculatePrize().winner.toFixed(2)}
                </Text>
                <Text style={styles.prizeNote}>After 10% platform fee</Text>
                <Text style={styles.prizeNote}>Tie? Sudden death! First to 4 correct wins</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateGame}
              disabled={loading}
            >
              <LinearGradient
                colors={['#ff6b6b', '#ff4757']}
                style={styles.createButtonGradient}
              >
                <Text style={styles.createButtonText}>
                  {loading ? 'Creating...' : 'CREATE GAME'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={games}
          renderItem={renderGame}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.gamesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="sports-esports" size={60} color="#ccc" />
              <Text style={styles.emptyStateText}>No games available</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showGameDetails}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalHeaderText}>Game Details</Text>
              <Text style={styles.gameCodeModal}>Code: {selectedGame?.code}</Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Icon name="account-balance-wallet" size={20} color="#667eea" />
                <Text style={styles.detailLabel}>Stake:</Text>
                <Text style={styles.detailValue}>₦{selectedGame?.stake}</Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="people" size={20} color="#667eea" />
                <Text style={styles.detailLabel}>Players:</Text>
                <Text style={styles.detailValue}>
                  {selectedGame?.currentPlayers}/{selectedGame?.maxPlayers}
                </Text>
              </View>

              <Text style={styles.playersTitle}>Players Joined:</Text>
              {joinedPlayers.map((player, index) => (
                <View key={index} style={styles.playerItem}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>
                      {player.username[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.playerName}>{player.username}</Text>
                  {player.isCreator && (
                    <View style={styles.creatorBadge}>
                      <Text style={styles.creatorBadgeText}>Creator</Text>
                    </View>
                  )}
                </View>
              ))}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowGameDetails(false)}
                >
                  <Text style={styles.cancelButtonText}>CLOSE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.joinModalButton]}
                  onPress={handleJoinGame}
                >
                  <Text style={styles.joinModalButtonText}>JOIN GAME</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  balanceCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', margin: 20, marginTop: -10 },
  balanceLabel: { fontSize: 16, color: '#999', marginLeft: 10, flex: 1 },
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: '#fff', borderRadius: 10, padding: 5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#667eea' },
  tabText: { fontSize: 16, color: '#999', fontWeight: '500' },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  content: { paddingHorizontal: 20 },
  createSection: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  label: { fontSize: 16, color: '#333', fontWeight: '500', marginBottom: 8 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 20 },
  prizeCard: { backgroundColor: '#e8f5e9', borderRadius: 15, padding: 20, alignItems: 'center', marginBottom: 20 },
  prizeLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  prizeAmount: { fontSize: 28, fontWeight: 'bold', color: '#4CAF50' },
  prizeNote: { fontSize: 12, color: '#999', marginTop: 5, textAlign: 'center' },
  createButton: { borderRadius: 10, overflow: 'hidden' },
  createButtonGradient: { padding: 16, alignItems: 'center' },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  gamesList: { padding: 20 },
  gameCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 10 },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  gameCode: { fontSize: 16, fontWeight: 'bold', color: '#667eea' },
  gameStake: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  gameDetails: { marginBottom: 10 },
  joinButton: { backgroundColor: '#667eea', padding: 10, borderRadius: 8, alignItems: 'center' },
  joinButtonText: { color: '#fff', fontWeight: 'bold' },
  emptyState: { alignItems: 'center', padding: 50 },
  emptyStateText: { fontSize: 16, color: '#999', marginTop: 10 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  modalHeader: { padding: 20, alignItems: 'center' },
  modalHeaderText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  gameCodeModal: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  modalBody: { padding: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailLabel: { flex: 1, marginLeft: 10, fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  playersTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 10 },
  playerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 10, borderRadius: 10, marginBottom: 8 },
  playerAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  playerAvatarText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  creatorBadge: { backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 10 },
  creatorBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
  modalActions: { flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  cancelButton: { backgroundColor: '#f5f5f5' },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
  joinModalButton: { backgroundColor: '#4CAF50' },
  joinModalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // Game styles
  gameHeader: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  playersList: { marginBottom: 15 },
  playerScoreItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' },
  playerName: { color: '#fff', fontSize: 14, fontWeight: '500' },
  playerScore: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  leadingScore: { color: '#FFD700', fontSize: 18 },
  gameStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
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
  notificationOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  notificationBox: { padding: 20, borderRadius: 15, alignItems: 'center', maxWidth: '80%' },
  notificationText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  // Tie-breaker styles
  tieHeader: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' },
  tieTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  tieSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 20 },
  tieScores: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  tieScoreItem: { alignItems: 'center' },
  tiePlayerName: { color: '#fff', fontSize: 14, marginBottom: 5 },
  tiePlayerScore: { color: '#FFD700', fontSize: 28, fontWeight: 'bold' },
  tieQuestionLabel: { color: '#ff4757', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }
});

export default QuizBattleScreen;