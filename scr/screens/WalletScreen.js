import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';

const WalletScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setBalance(parsed.balance || 0);
      }

      const history = await AsyncStorage.getItem('transactionHistory');
      if (history) {
        setTransactions(JSON.parse(history));
      } else {
        const sampleTransactions = [
          {
            id: '1',
            type: 'win',
            amount: 500,
            date: '2024-01-15',
            status: 'completed',
            description: 'Quiz Battle Win'
          },
          {
            id: '2',
            type: 'deposit',
            amount: 1000,
            date: '2024-01-14',
            status: 'completed',
            description: 'Card Deposit'
          }
        ];
        setTransactions(sampleTransactions);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) < 100) {
      Alert.alert('Error', 'Minimum deposit amount is ₦100');
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      const depositAmount = parseFloat(amount);
      const newBalance = balance + depositAmount;
      setBalance(newBalance);
      
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.balance = newBalance;
        await AsyncStorage.setItem('userData', JSON.stringify(parsed));
      }

      const newTransaction = {
        id: Date.now().toString(),
        type: 'deposit',
        amount: depositAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `${selectedPaymentMethod} Deposit`
      };

      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      await AsyncStorage.setItem('transactionHistory', JSON.stringify(updatedTransactions));

      setLoading(false);
      setShowDepositModal(false);
      setAmount('');
      Alert.alert('Success', `₦${depositAmount} deposited successfully!`);
    }, 2000);
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) < 500) {
      Alert.alert('Error', 'Minimum withdrawal amount is ₦500');
      return;
    }

    if (parseFloat(amount) > balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      const withdrawAmount = parseFloat(amount);
      const newBalance = balance - withdrawAmount;
      setBalance(newBalance);
      
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.balance = newBalance;
        await AsyncStorage.setItem('userData', JSON.stringify(parsed));
      }

      const newTransaction = {
        id: Date.now().toString(),
        type: 'withdraw',
        amount: withdrawAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        description: 'Withdrawal to Bank'
      };

      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      await AsyncStorage.setItem('transactionHistory', JSON.stringify(updatedTransactions));

      setLoading(false);
      setShowWithdrawModal(false);
      setAmount('');
      Alert.alert('Success', 'Withdrawal request submitted!');
    }, 2000);
  };

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'deposit': return 'arrow-downward';
      case 'withdraw': return 'arrow-upward';
      case 'win': return 'emoji-events';
      default: return 'swap-horiz';
    }
  };

  const getTransactionColor = (type) => {
    switch(type) {
      case 'deposit': return '#4CAF50';
      case 'withdraw': return '#ff4757';
      case 'win': return '#FFD700';
      default: return '#999';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FFA500';
      case 'failed': return '#ff4757';
      default: return '#999';
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item.type) + '20' }]}>
        <Icon name={getTransactionIcon(item.type)} size={24} color={getTransactionColor(item.type)} />
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      
      <View style={styles.transactionAmount}>
        <Text style={[styles.amountText, { color: getTransactionColor(item.type) }]}>
          {item.type === 'withdraw' ? '-₦' : '+₦'}{item.amount}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} />
      
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wallet</Text>
        </View>

        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>₦{balance.toFixed(2)}</Text>
          <Text style={styles.balanceUSD}>≈ ${(balance * 0.001).toFixed(2)} USD</Text>
          
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.balanceAction} onPress={() => setShowDepositModal(true)}>
              <View style={styles.actionIcon}>
                <Icon name="arrow-downward" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.actionLabel}>Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.balanceAction} onPress={() => setShowWithdrawModal(true)}>
              <View style={styles.actionIcon}>
                <Icon name="arrow-upward" size={24} color="#ff4757" />
              </View>
              <Text style={styles.actionLabel}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="account-balance-wallet" size={24} color="#667eea" />
            <Text style={styles.statLabel}>Total Deposited</Text>
            <Text style={styles.statValue}>
              ₦{transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="emoji-events" size={24} color="#FFD700" />
            <Text style={styles.statLabel}>Total Won</Text>
            <Text style={styles.statValue}>
              ₦{transactions.filter(t => t.type === 'win').reduce((sum, t) => sum + t.amount, 0)}
            </Text>
          </View>
        </View>

        <View style={styles.transactionContainer}>
          <Text style={styles.transactionTitle}>Transaction History</Text>
          
          {transactions.length > 0 ? (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="history" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showDepositModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deposit Funds</Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.balancePreview}>
              <Text style={styles.balancePreviewLabel}>Current Balance</Text>
              <Text style={styles.balancePreviewAmount}>₦{balance.toFixed(2)}</Text>
            </View>

            <Text style={styles.inputLabel}>Amount (₦)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={styles.minAmountText}>Minimum: ₦100</Text>

            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[styles.paymentMethod, selectedPaymentMethod === 'card' && styles.selectedPaymentMethod]}
                onPress={() => setSelectedPaymentMethod('card')}
              >
                <Icon name="credit-card" size={24} color={selectedPaymentMethod === 'card' ? '#667eea' : '#999'} />
                <Text style={[styles.paymentMethodText, selectedPaymentMethod === 'card' && styles.selectedPaymentMethodText]}>Card</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentMethod, selectedPaymentMethod === 'bank' && styles.selectedPaymentMethod]}
                onPress={() => setSelectedPaymentMethod('bank')}
              >
                <Icon name="account-balance" size={24} color={selectedPaymentMethod === 'bank' ? '#667eea' : '#999'} />
                <Text style={[styles.paymentMethodText, selectedPaymentMethod === 'bank' && styles.selectedPaymentMethodText]}>Bank</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleDeposit} disabled={loading}>
              <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.modalButtonGradient}>
                <Text style={styles.modalButtonText}>{loading ? 'Processing...' : 'Deposit Now'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.balancePreview}>
              <Text style={styles.balancePreviewLabel}>Available Balance</Text>
              <Text style={styles.balancePreviewAmount}>₦{balance.toFixed(2)}</Text>
            </View>

            <Text style={styles.inputLabel}>Amount (₦)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={styles.minAmountText}>Minimum: ₦500</Text>

            <TouchableOpacity style={styles.modalButton} onPress={handleWithdraw} disabled={loading}>
              <LinearGradient colors={['#ff4757', '#ff6b6b']} style={styles.modalButtonGradient}>
                <Text style={styles.modalButtonText}>{loading ? 'Processing...' : 'Withdraw Now'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.withdrawNote}>Withdrawals processed within 24-48 hours</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  balanceCard: { marginHorizontal: 20, borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  balanceLabel: { color: '#fff', fontSize: 16, opacity: 0.9 },
  balanceAmount: { color: '#fff', fontSize: 40, fontWeight: 'bold', marginTop: 5 },
  balanceUSD: { color: '#fff', fontSize: 16, opacity: 0.8, marginTop: 5 },
  balanceActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 25 },
  balanceAction: { alignItems: 'center' },
  actionIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  actionLabel: { color: '#fff', fontSize: 14, fontWeight: '500' },
  statsContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 15, padding: 15, marginHorizontal: 5, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 5, textAlign: 'center' },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 3 },
  transactionContainer: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20, marginBottom: 30, borderRadius: 15, padding: 15 },
  transactionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  transactionIcon: { width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionDetails: { flex: 1 },
  transactionDescription: { fontSize: 16, color: '#333', fontWeight: '500' },
  transactionDate: { fontSize: 12, color: '#999', marginTop: 2 },
  transactionAmount: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '500', textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', padding: 30 },
  emptyStateText: { color: '#999', fontSize: 16, marginTop: 10 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  balancePreview: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 15, marginBottom: 20 },
  balancePreviewLabel: { fontSize: 14, color: '#999', marginBottom: 5 },
  balancePreviewAmount: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  inputLabel: { fontSize: 16, color: '#333', fontWeight: '500', marginBottom: 8 },
  amountInput: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 15, fontSize: 18, marginBottom: 5 },
  minAmountText: { fontSize: 12, color: '#999', marginBottom: 20 },
  paymentMethods: { flexDirection: 'row', marginBottom: 25 },
  paymentMethod: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginRight: 10 },
  selectedPaymentMethod: { borderColor: '#667eea', backgroundColor: '#f0f0ff' },
  paymentMethodText: { marginLeft: 8, fontSize: 14, color: '#999' },
  selectedPaymentMethodText: { color: '#667eea', fontWeight: '500' },
  modalButton: { borderRadius: 10, overflow: 'hidden' },
  modalButtonGradient: { padding: 16, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  withdrawNote: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 15 }
});

export default WalletScreen;