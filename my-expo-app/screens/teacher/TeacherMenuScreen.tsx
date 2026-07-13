import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TeacherMenuScreenProps {
  navigation: NavigationProps;
}

export default function TeacherMenuScreen({ navigation }: TeacherMenuScreenProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'Update your teacher profile',
      icon: 'account-circle',
      color: 'bg-orange-500',
    },
    {
      id: 'schedule',
      title: 'My Schedule',
      subtitle: 'View your class timetable',
      icon: 'calendar-clock',
      color: 'bg-blue-500',
    },
    {
      id: 'students',
      title: 'Student Management',
      subtitle: 'Manage student records',
      icon: 'account-group',
      color: 'bg-green-500',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Activity and parent alerts',
      icon: 'bell-outline',
      color: 'bg-yellow-500',
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and privacy',
      icon: 'cog-outline',
      color: 'bg-gray-500',
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact admin',
      icon: 'help-circle-outline',
      color: 'bg-purple-500',
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Please enter logout remarks before logging out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: () => {
            // TODO: Show remarks modal before logout
            logout();
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="bg-white px-6 py-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-gray-900">Teacher Account</Text>
            <Text className="text-gray-600">{user?.email}</Text>
          </View>
          <View className="bg-orange-100 p-3 rounded-full">
            <MaterialCommunityIcons name="account-tie" size={24} color="#F59E0B" />
          </View>
        </View>
      </View>

      {/* Teacher Info Card */}
      <View className="mx-6 mt-4 bg-white rounded-lg p-4 shadow-sm">
        <View className="flex-row items-center">
          <View className="bg-orange-100 p-3 rounded-full mr-4">
            <MaterialCommunityIcons name="account" size={24} color="#F59E0B" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">{user?.name}</Text>
            <Text className="text-gray-600">Teacher</Text>
            <Text className="text-sm text-orange-600 mt-1">Class: Nursery A</Text>
          </View>
        </View>
      </View>

      {/* Teaching Stats */}
      <View className="mx-6 mt-4 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-lg p-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white font-semibold">Teaching Stats</Text>
            <Text className="text-white text-2xl font-bold mt-1">25 Students</Text>
            <Text className="text-white text-sm opacity-90">5 Activities Posted</Text>
          </View>
          <MaterialCommunityIcons name="school" size={40} color="white" />
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView className="flex-1 px-6 mt-4">
        <Text className="text-lg font-semibold text-gray-900 mb-4">Settings</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            className="bg-white p-4 rounded-lg shadow-sm mb-3 flex-row items-center"
            onPress={() => {
              // TODO: Navigate to specific screen
              console.log(`Navigate to ${item.id}`);
            }}
          >
            <View className={`${item.color} p-3 rounded-lg mr-4`}>
              <MaterialCommunityIcons name={item.icon as any} size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">{item.title}</Text>
              <Text className="text-sm text-gray-600">{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-red-500 p-4 rounded-lg shadow-sm mb-8 mt-6 flex-row items-center justify-center"
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Logout</Text>
        </TouchableOpacity>
        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}
