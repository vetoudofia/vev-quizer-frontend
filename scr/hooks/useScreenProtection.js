import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

export const useScreenProtection = (gameActive, onQuit) => {
  useEffect(() => {
    let screenshotSubscription = null;

    const setupProtection = async () => {
      if (gameActive) {
        // Disable screenshots
        await ScreenCapture.preventScreenCaptureAsync();
        
        // Listen for screenshot attempts
        screenshotSubscription = ScreenCapture.addScreenshotListener(() => {
          Alert.alert(
            '📸 Screenshot Blocked',
            'Screenshots are not allowed during quizzes for security reasons.'
          );
        });

        // Handle back button
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
          if (onQuit) {
            onQuit();
            return true;
          }
          return false;
        });

        return () => {
          backHandler.remove();
        };
      }
    };

    setupProtection();

    // Cleanup
    return () => {
      if (screenshotSubscription) {
        screenshotSubscription.remove();
      }
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, [gameActive, onQuit]);
};
