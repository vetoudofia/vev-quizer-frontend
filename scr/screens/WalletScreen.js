// Add this state for bank details
const [bankCode, setBankCode] = useState('');
const [accountNumber, setAccountNumber] = useState('');
const [accountName, setAccountName] = useState('');
const [banks, setBanks] = useState([]);

// Load banks on mount
useEffect(() => {
  loadBanks();
}, []);

const loadBanks = async () => {
  try {
    const response = await api.get('/wallet/banks');
    if (response.data.success) {
      setBanks(response.data.banks);
    }
  } catch (error) {
    console.error('Error loading banks:', error);
  }
};

// Update handleWithdraw
const handleWithdraw = async () => {
  if (!amount || parseFloat(amount) < 500) {
    Alert.alert('Error', 'Minimum withdrawal amount is ₦500');
    return;
  }

  if (parseFloat(amount) > balance) {
    Alert.alert('Error', 'Insufficient balance');
    return;
  }

  if (!bankCode || !accountNumber || !accountName) {
    Alert.alert('Error', 'Please fill all bank details');
    return;
  }

  setLoading(true);
  try {
    const response = await api.post('/wallet/withdraw/initialize', {
      amount: parseFloat(amount),
      bank_code: bankCode,
      account_number: accountNumber,
      account_name: accountName
    });

    if (response.data.success) {
      const { message, processing_days, estimated_completion } = response.data;
      
      Alert.alert(
        processing_days === 3 ? '⏳ Processing Time Notice' : 'Withdrawal Initiated',
        `${message}\n\nEstimated completion: ${new Date(estimated_completion).toLocaleDateString()}`,
        [{ text: 'OK' }]
      );
      
      // Refresh balance and transactions
      loadWalletData();
      setShowWithdrawModal(false);
      setAmount('');
      setBankCode('');
      setAccountNumber('');
      setAccountName('');
    }
  } catch (error) {
    Alert.alert('Error', error.response?.data?.error || 'Withdrawal failed');
  } finally {
    setLoading(false);
  }
};

// Update the withdrawal modal JSX
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

      <Text style={styles.inputLabel}>Select Bank</Text>
      <Picker
        selectedValue={bankCode}
        onValueChange={setBankCode}
        style={styles.picker}
      >
        <Picker.Item label="Select bank..." value="" />
        {banks.map(bank => (
          <Picker.Item key={bank.code} label={bank.name} value={bank.code} />
        ))}
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="Account Number"
        keyboardType="numeric"
        value={accountNumber}
        onChangeText={setAccountNumber}
        maxLength={10}
      />

      <TextInput
        style={styles.input}
        placeholder="Account Name"
        value={accountName}
        onChangeText={setAccountName}
      />

      <TouchableOpacity style={styles.modalButton} onPress={handleWithdraw} disabled={loading}>
        <LinearGradient colors={['#ff4757', '#ff6b6b']} style={styles.modalButtonGradient}>
          <Text style={styles.modalButtonText}>{loading ? 'Processing...' : 'Withdraw Now'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.withdrawNote}>
        {amount > 5000 ? 
          'Large withdrawals may take 3 working days' : 
          'Withdrawals processed within 24-48 hours'}
      </Text>
    </View>
  </View>
</Modal>