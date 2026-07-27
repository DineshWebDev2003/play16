import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import api from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type NotificationData = {
  screen?: string;
  id?: string;
  image?: string;
  url?: string;
  localImageUri?: string;
};

let notificationResponseHandler: ((data: NotificationData) => void) | null = null;

export function setNotificationResponseHandler(handler: (data: NotificationData) => void) {
  notificationResponseHandler = handler;
}

export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    // Main channel for announcements with image support (MAX importance = heads-up + big picture)
    await Notifications.setNotificationChannelAsync('announcements', {
      name: 'Announcements',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
    });

    // Channel for payment notifications
    await Notifications.setNotificationChannelAsync('payments', {
      name: 'Payments',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100, 100],
      lightColor: '#10B981',
    });

    // Channel for activity notifications
    await Notifications.setNotificationChannelAsync('activities', {
      name: 'Activities',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100, 100],
      lightColor: '#8B5CF6',
    });
  }
}

export async function registerForPushNotificationsAsync() {
  await setupNotificationChannels();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    Constants.manifest?.extra?.eas?.projectId ??
    'caad12b4-5080-41c9-b239-071e6d9f622a';

  const result = await Notifications.getExpoPushTokenAsync({ projectId });
  return result.data;
}

export async function savePushToken(token: string) {
  try {
    await api.post('/update-push-token', { push_token: token });
    return true;
  } catch (error) {
    console.error('Error saving push token:', error);
    return false;
  }
}

export function addNotificationListeners() {
  // Listen for incoming notifications while app is foregrounded
  const foregroundSub = Notifications.addNotificationReceivedListener(async notification => {
    const data = notification.request.content.data as NotificationData;
    console.log('Notification received in foreground:', data);

    // Pre-cache the image for foreground notifications so it's available
    // if the user navigates to the relevant screen
    if (data?.image && Platform.OS === 'android') {
      try {
        const filename = `notif_cache_${data.id ?? Date.now()}.jpg`;
        const localUri = FileSystem.cacheDirectory + filename;
        const downloadResult = await FileSystem.downloadAsync(data.image, localUri);
        if (downloadResult?.uri) {
          // Store the local URI in the data for later retrieval
          data.localImageUri = downloadResult.uri;
        }
      } catch (e) {
        console.log('Notification image cache failed (non-critical):', e);
      }
    }
  });

  // Listen for notification taps (background → foreground)
  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as NotificationData;
    if (notificationResponseHandler && data) {
      notificationResponseHandler(data);
    }
  });

  return () => {
    foregroundSub.remove();
    responseSub.remove();
  };
}
