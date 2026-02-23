import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BackButton from '../components/BackButton';

const ContactScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const contactMethods = [
    { id: 1, icon: 'email', label: 'Email', value: 'vevquizer@gmail.com', color: '#EA4335' },
    { id: 2, icon: 'send', label: 'Telegram', value: '+234 7087690822', color: '#0088cc' },
    { id: 3, icon: 'whatsapp', label: 'WhatsApp', value: '+234 8142928718', color: '#25D366' }
  ];

  const handleContactPress = (method) => {
    let url = '';
    switch(method.label.toLowerCase()) {
      case 'email': url = `mailto:${method.value}`; break;
      case 'telegram': url = `https://t.me/${method.value.replace('+', '')}`; break;
      case 'whatsapp': url = `https://wa.me/${method.value.replace(/[^0-9]/g, '')}`; break;
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', `Cannot open ${method.label}`));
  };

  const handleSubmit = () => {
    if (!name || !email || !message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    Alert.alert('Message Sent', 'Thank you for contacting us. We\'ll get back to you soon.');
    setName('');
    setEmail('');
    setMessage('');
  };

  const faqs = [
    { q: 'How do I withdraw my winnings?', a: 'Go to Wallet → Withdraw, enter amount (min ₦500).' },
    { q: 'What is the minimum stake?', a: 'Minimum stake is ₦10 for all games.' },
    { q: 'How does the referral program work?', a: 'Share your invite code. Earn 10% of friend\'s first deposit!' }
  ];

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} />
      
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Icon name="contact-support" size={40} color="#fff" />
        <Text style={styles.headerTitle}>Contact & Support</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          {contactMethods.map(method => (
            <TouchableOpacity key={method.id} style={styles.contactCard} onPress={() => handleContactPress(method)}>
              <View style={[styles.contactIcon, { backgroundColor: method.color + '20' }]}>
                <Icon name={method.icon} size={24} color={method.color} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{method.label}</Text>
                <Text style={styles.contactValue}>{method.value}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a Message</Text>
          <TextInput style={styles.input} placeholder="Your Name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Your Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={[styles.input, styles.messageInput]} placeholder="Your Message" multiline numberOfLines={4} value={message} onChangeText={setMessage} />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.submitButtonGradient}>
              <Text style={styles.submitButtonText}>SEND MESSAGE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQ</Text>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </View>
          ))}
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
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 10 },
  contactIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 12, color: '#999' },
  contactValue: { fontSize: 14, color: '#333', fontWeight: '500', marginTop: 2 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 15, fontSize: 14, marginBottom: 12 },
  messageInput: { height: 100, textAlignVertical: 'top' },
  submitButton: { borderRadius: 10, overflow: 'hidden', marginTop: 10 },
  submitButtonGradient: { padding: 16, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  faqItem: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 8 },
  faqQuestion: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 4 },
  faqAnswer: { fontSize: 12, color: '#666', lineHeight: 18 }
});

export default ContactScreen;