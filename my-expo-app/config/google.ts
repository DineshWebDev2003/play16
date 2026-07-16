import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const GOOGLE = {
  clientId: extra.googleClientId || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  androidClientId: extra.googleAndroidClientId || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  iosClientId: extra.googleIosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
};
