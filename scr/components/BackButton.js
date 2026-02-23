import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BackButton = ({ navigation, customOnPress, warningMessage }) => {
  const handlePress = () => {
    if (customOnPress) {
      customOnPress();
    } else if (warningMessage) {
      Alert.alert(
        'Warning',
        warningMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Leave', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Icon name="arrow-back" size={24} color="#333" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1000,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  }
});

export default BackButton;