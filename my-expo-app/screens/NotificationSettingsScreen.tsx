import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Switch, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

interface NotificationSettings {
  enabled: boolean;
  payment: boolean;
  attendance: boolean;
  activity: boolean;
}

export default function NotificationSettingsScreen({ navigation }: any) {
  const { user, updateNotificationSettings } = useAuth();
  const btnScale = useRef(new Animated.Value(1)).current;

  const defaultSettings = {
    enabled: true,
    payment: true,
    attendance: true,
    activity: true,
  };

  const [settings, setSettings] = useState<NotificationSettings>({
    ...defaultSettings,
    ...user?.notification_settings
  });
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (user?.notification_settings) {
      setSettings(prev => ({
        ...prev,
        ...user.notification_settings
      }));
    }
  }, [user?.notification_settings]);

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePressIn = () => {
    Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateNotificationSettings(settings);
      if (success) {
        Alert.alert('Saved', 'Your notification preferences have been updated.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const SettingItem = ({ icon, title, subtitle, value, onToggle, disabled = false }: any) => (
    <View className={`flex-row items-center justify-between p-4 mb-4 bg-white rounded-2xl border border-gray-100 ${disabled ? 'opacity-40' : ''}`}>
      <View className="flex-row items-center flex-1">
        <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4 bg-amber-50">
          <MaterialCommunityIcons name={icon} size={24} color="#D97706" />
        </View>
        <View className="flex-1">
          <Text className="font-black text-base text-gray-900 tracking-tight">{title}</Text>
          <Text className="text-xs font-bold text-gray-500 mt-0.5">{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#CBD5E1', true: '#F59E0B' }}
        thumbColor="#FFF"
      />
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-6 py-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-gray-100 w-11 h-11 rounded-2xl items-center justify-center"
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color="#374151" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-2xl font-black text-gray-900 tracking-tighter">Alert Centre</Text>
            <Text className="text-amber-500 text-[9px] font-black uppercase tracking-widest mt-1">Preferences</Text>
          </View>
          <View className="w-11" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10 }}>
          {/* Master Control Card */}
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => toggleSetting('enabled')}
            className="mb-8"
          >
            <View className={`p-6 rounded-3xl overflow-hidden ${settings.enabled ? 'bg-amber-500' : 'bg-gray-300'}`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-2xl font-black tracking-tighter">All Signals</Text>
                  <Text className="text-white/80 font-bold text-sm mt-1">
                    {settings.enabled ? 'Push notifications active' : 'Quiet mode enabled'}
                  </Text>
                </View>
                <Switch
                  value={settings.enabled}
                  onValueChange={() => toggleSetting('enabled')}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(255,255,255,0.4)' }}
                  thumbColor="#FFF"
                  style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                />
              </View>
            </View>
          </TouchableOpacity>

          <View className="flex-row items-center mb-4 px-1">
            <MaterialCommunityIcons name="tune-variant" size={14} color="#9CA3AF" />
            <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Custom Channels</Text>
          </View>

          <SettingItem
            icon="cash-check"
            title="School Fees"
            subtitle="Receipts and payment reminders"
            value={settings.payment}
            onToggle={() => toggleSetting('payment')}
            disabled={!settings.enabled}
          />

          <SettingItem
            icon="account-clock"
            title="Attendance"
            subtitle="Daily arrival and departure logs"
            value={settings.attendance}
            onToggle={() => toggleSetting('attendance')}
            disabled={!settings.enabled}
          />

          <SettingItem
            icon="star-face"
            title="Activity Feed"
            subtitle="New photos, likes and comments"
            value={settings.activity}
            onToggle={() => toggleSetting('activity')}
            disabled={!settings.enabled}
          />

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              className="mt-6 mb-12 bg-amber-500 py-5 rounded-3xl items-center justify-center"
              activeOpacity={0.8}
              onPress={handleSave}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="check-decagram" size={22} color="white" />
                  <Text className="text-white font-black text-lg ml-2 tracking-tight">Save Preferences</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
          <View className="h-32" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
