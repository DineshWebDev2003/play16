import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const GOOGLE = {
  // Web client ID from Google Cloud Console (required for expo-auth-session)
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  // Android client ID (for native Android app)
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  // iOS client ID (for native iOS app)
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
};
