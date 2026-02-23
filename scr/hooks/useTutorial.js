import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useTutorial = (screenName, tutorialContent) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const hasSeen = await AsyncStorage.getItem(`tutorial_${screenName}`);
      if (!hasSeen) {
        setShowTutorial(true);
        showTutorialPopup();
      }
    } catch (error) {
      console.error('Error checking tutorial:', error);
    } finally {
      setLoading(false);
    }
  };

  const showTutorialPopup = () => {
    Alert.alert(
      `📚 Welcome to ${screenName}!`,
      tutorialContent,
      [
        {
          text: 'Got it!',
          onPress: async () => {
            await AsyncStorage.setItem(`tutorial_${screenName}`, 'true');
            setShowTutorial(false);
          }
        }
      ],
      { cancelable: false }
    );
  };

  const resetTutorial = async () => {
    await AsyncStorage.removeItem(`tutorial_${screenName}`);
  };

  return { showTutorial, loading, resetTutorial };
};