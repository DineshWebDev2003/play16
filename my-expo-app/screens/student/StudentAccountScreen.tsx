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

interface StudentAccountScreenProps {
  navigation: NavigationProps;
}

export default function StudentAccountScreen({ navigation }: StudentAccountScreenProps) {
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
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'View and update your profile',
      icon: 'account-circle',
    },
    {
      id: 'guardian',
      title: 'Guardian Contacts',
      subtitle: 'Emergency contact information',
      icon: 'account-group',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Activity and announcement alerts',
      icon: 'bell-outline',
    },
    {
      id: 'about',
      title: 'About Us',
      subtitle: 'Visit our school website',
      icon: 'information-outline',
    },
  ];

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const insets = useSafeAreaInsets();

  return (
    <View className={`flex-1 ${colors.background}`}>
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl 
                refreshing={isRefreshing} 
                onRefresh={onRefresh}
                colors={['#F59E0B']}
                tintColor="#F59E0B"
            />
        }
      >
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Settings
            </Text>
            <Text className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
              {user?.name || 'My'} Account
            </Text>
            <View className="bg-amber-50 dark:bg-amber-900/30 self-start px-3 py-1 rounded-full mt-2">
                <Text className="text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-widest">Logged in as {user?.role || 'Student'}</Text>
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
            <View className="absolute -bottom-1 -right-1 bg-amber-500 p-1 rounded-lg">
              <MaterialCommunityIcons name="camera" size={10} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      <View className="px-6 pb-4">
        <TouchableOpacity
          activeOpacity={0.97}
          onPress={() => navigation.navigate('profile')}
          className="bg-brand-pink rounded-3xl p-6 shadow-sm"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="mb-2">
                <View className="flex-row items-center pb-2 mb-1">
                  <MaterialCommunityIcons name="at" size={12} color="rgba(255,255,255,0.7)" />
                  <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest ml-1">{user?.username || 'user_id'}</Text>
                </View>
              </View>
              <Text className="text-2xl font-black text-white tracking-tight">{user?.name || 'Explorer'}</Text>
              <Text className="text-sm text-white/80 font-bold mt-1">{user?.email || 'Not provided'}</Text>
              
              <View className="flex-row items-center mt-4">
                <View className="bg-white/20 px-3 py-1.5 rounded-xl flex-row items-center">
                  <MaterialCommunityIcons name="card-account-details-star" size={14} color="white" />
                  <Text className="text-white text-xs font-bold ml-2">{user?.studentId || '#S-001'}</Text>
                </View>
              </View>
            </View>
            
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center">
              <MaterialCommunityIcons name="school" size={32} color="white" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View className="px-6 pb-6">
        <Text className="text-sm font-bold text-gray-900 dark:text-white mb-4 px-1">Settings</Text>

        <View className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              className={`p-4 flex-row items-center justify-between ${index !== menuItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
              onPress={() => {
                if (item.id === 'profile') {
                  navigation.navigate('profile');
                } else if (item.id === 'guardian') {
                  navigation.navigate('emergencyContact');
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
                  <MaterialCommunityIcons 
                    name={item.icon as any} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 dark:text-white">{item.title}</Text>
                  <Text className="text-[11px] text-gray-400 dark:text-gray-500 font-bold mt-0.5">{item.subtitle}</Text>
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
    <LogoutModal 
      visible={showLogoutModal} 
      onConfirm={logout} 
      onCancel={() => setShowLogoutModal(false)} 
    />
    </View>
  );
}
