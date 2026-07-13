import React, { useEffect } from 'react';
import './global.css';
import { BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AppNavigator from './navigation/AppNavigator';

const AppContent = () => {
  const { theme, colors } = useTheme();
  
  return (
    <>
      <StatusBar
        style={theme === 'dark' ? 'light' : 'dark'}
        backgroundColor={theme === 'dark' ? '#1c1c14' : '#FFFFFF'}
      />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
};

export default function App() {
  // Handle hardware back button to prevent app from closing
  React.useEffect(() => {
    // Lock to portrait by default
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT).catch(() => {});

    // Hide the native splash screen as fast as possible so your custom one shows
    const hideNativeSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    };
    hideNativeSplash();

    const backAction = () => {
      // Let the navigation handle the back action
      // This prevents the app from closing when back is pressed
      return false; // Return false to let the navigation handle it
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}