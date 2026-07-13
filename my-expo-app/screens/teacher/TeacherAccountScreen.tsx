import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Linking, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogoutModal from '../../components/LogoutModal';


interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TeacherAccountScreenProps {
  navigation: NavigationProps;
}

export default function TeacherAccountScreen({ navigation }: TeacherAccountScreenProps) {
  const { user, logout, updateAvatar, fetchData: refreshAuth } = useAuth();
  const { colors } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshAuth();
    setIsRefreshing(false);
  }, [refreshAuth]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const menuItems = [
    { id: 'profile', title: 'Profile Settings', subtitle: 'Update your profile information', icon: 'account-cog' },
    { id: 'notifications', title: 'Notifications', subtitle: 'Manage notification settings', icon: 'bell-outline' },
    { id: 'settings', title: 'App Settings', subtitle: 'Configure app preferences', icon: 'cog-outline' },
    { id: 'support', title: 'Support & Help', subtitle: 'Get help and contact support', icon: 'help-circle-outline' },
    { id: 'about', title: 'About', subtitle: 'App version and information', icon: 'information-outline' },
  ];

  const handleLogout = () => setShowLogoutModal(true);
  const insets = useSafeAreaInsets();

  return (
    <View className={`flex-1 ${colors.background}`}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#F59E0B']} tintColor="#F59E0B" />
        }
      >
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className={`text-3xl font-black ${colors.text} tracking-tight`}>My</Text>
            <Text className="text-lg font-bold text-amber-500 mt-[-2px]">Profile</Text>
            <View className="bg-amber-50 dark:bg-amber-900/30 self-start px-3 py-1 rounded-full mt-2 flex-row items-center">
                <MaterialCommunityIcons name="star-circle" size={12} color="#D97706" />
                <Text className="text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-widest ml-1.5">Faculty</Text>
            </View>
          </View>
          <TouchableOpacity
            className="bg-amber-100 dark:bg-gray-700 w-16 h-16 rounded-2xl items-center justify-center relative overflow-hidden"
            onPress={updateAvatar}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} className="w-full h-full" />
            ) : (
              <MaterialCommunityIcons name="account" size={32} color="#D97706" />
            )}
            <View className="absolute -bottom-1 -right-1 bg-amber-500 p-1.5 rounded-lg">
              <MaterialCommunityIcons name="camera" size={12} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-6 pb-6">
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('profile')}
            className="bg-brand-pink rounded-3xl p-8 shadow-sm"
        >
            <View className="flex-row items-center">
                <View className="bg-white/20 p-4 rounded-2xl mr-5">
                    <MaterialCommunityIcons name="card-account-details-outline" size={32} color="white" />
                </View>
                <View className="flex-1">
                    <Text className="text-2xl font-black text-white">{user?.name}</Text>
                    <Text className="text-sm text-white/80 font-bold mt-1">{user?.email || 'Not provided'}</Text>
                    <View className="bg-white/20 px-4 py-2 rounded-full self-start mt-3">
                        <Text className="text-white text-[10px] font-bold uppercase tracking-widest">ID: {user?.teacherId || '#T-001'}</Text>
                    </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
            </View>
        </TouchableOpacity>
      </View>

      <View className="px-6 pb-6">
        <Text className={`text-sm font-bold ${colors.text} mb-4 px-1`}>Settings & Tools</Text>

        <View className={`${colors.surface} rounded-3xl shadow-sm overflow-hidden`}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              className={`p-4 flex-row items-center justify-between ${index !== menuItems.length - 1 ? `border-b ${colors.border}` : ''}`}
              onPress={() => {
                if (item.id === 'profile') {
                  navigation.navigate('profile');
                } else if (item.id === 'notifications') {
                  navigation.navigate('notificationSettings');
                } else if (item.id === 'about') {
                  Linking.openURL('https://tnhappykids.in').catch(err =>
                    Alert.alert('Error', 'Could not open website')
                  );
                } else {
                  Alert.alert('Coming Soon', `${item.title} screen is coming soon!`);
                }
              }}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl mr-4">
                  <MaterialCommunityIcons name={item.icon as any} size={20} color="#9CA3AF" />
                </View>
                <View className="flex-1">
                  <Text className={`text-base font-bold ${colors.text}`}>{item.title}</Text>
                  <Text className={`text-[11px] ${colors.textTertiary} font-bold mt-0.5`}>{item.subtitle}</Text>
                </View>
              </View>

              <MaterialCommunityIcons name="chevron-right" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleLogout}
          className="mt-6 bg-red-500 rounded-2xl p-4 flex-row items-center justify-center"
        >
            <MaterialCommunityIcons name="power" size={20} color="white" />
            <Text className="text-white font-bold text-base ml-3">Sign Out</Text>
        </TouchableOpacity>
        <View className="h-32" />
      </View>
    </ScrollView>
    <LogoutModal visible={showLogoutModal} onConfirm={logout} onCancel={() => setShowLogoutModal(false)} />
    </View>
  );
}
