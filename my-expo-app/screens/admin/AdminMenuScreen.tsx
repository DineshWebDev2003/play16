import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface AdminMenuScreenProps {
  navigation: NavigationProps;
}

export default function AdminMenuScreen({ navigation }: AdminMenuScreenProps) {
  const { user, logout } = useAuth();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile Settings',
      subtitle: 'Update your profile information',
      icon: 'account-cog',
      color: 'bg-blue-500',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage notification settings',
      icon: 'bell-outline',
      color: 'bg-yellow-500',
    },
    {
      id: 'settings',
      title: 'App Settings',
      subtitle: 'Configure app preferences',
      icon: 'cog-outline',
      color: 'bg-gray-500',
    },
    {
      id: 'support',
      title: 'Support & Help',
      subtitle: 'Get help and contact support',
      icon: 'help-circle-outline',
      color: 'bg-green-500',
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      icon: 'information-outline',
      color: 'bg-purple-500',
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  return (
    <View 
        className={`flex-1 ${colors.background}`} 
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
      {/* Header */}
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className={`${colors.surface} px-6 pb-4 shadow-sm border-b ${colors.border}`}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-xl font-black ${colors.text}`}>Account</Text>
            <Text className={`${colors.textSecondary} font-bold`}>{user?.email}</Text>
          </View>
          <View className="bg-brand-pink/10 p-3 rounded-2xl">
            <MaterialCommunityIcons name="shield-account" size={24} color="#F59E0B" />
          </View>
        </View>
      </View>

      {/* User Info Card */}
      <View className={`mx-6 mt-4 ${colors.surface} rounded-[28px] p-6 shadow-sm border ${colors.border}`}>
        <View className="flex-row items-center">
          <View className="bg-brand-yellow/20 p-4 rounded-2xl mr-4 border border-brand-yellow/30">
            <MaterialCommunityIcons name="account" size={32} color="#92400E" />
          </View>
          <View className="flex-1">
            <Text className={`text-lg font-black ${colors.text}`}>{user?.name}</Text>
            <Text className={`${colors.textSecondary} font-bold capitalize`}>{user?.role}</Text>
            <Text className="text-xs font-black text-brand-pink mt-1 uppercase tracking-widest">Administrator Access</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView className="flex-1 px-6 mt-6">
        <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary} mb-4 ml-1`}>Security & Settings</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            className={`${colors.surface} p-5 rounded-[24px] shadow-sm mb-4 flex-row items-center border ${colors.border}`}
            onPress={() => {
              console.log(`Navigate to ${item.id}`);
            }}
          >
            <View className={`${item.color} p-3 rounded-xl mr-4`}>
              <MaterialCommunityIcons name={item.icon as any} size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className={`font-black ${colors.text}`}>{item.title}</Text>
              <Text className={`text-xs ${colors.textSecondary} font-bold`}>{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme === 'dark' ? '#3e3e34' : '#E5E7EB'} />
          </TouchableOpacity>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-red-500 p-5 rounded-[24px] shadow-lg mb-10 mt-6 flex-row items-center justify-center"
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color="white" />
          <Text className="text-white font-black ml-2 uppercase tracking-widest">Sign Out</Text>
        </TouchableOpacity>
        <View className="h-32" />
      </ScrollView>
    </View>
  );
}
