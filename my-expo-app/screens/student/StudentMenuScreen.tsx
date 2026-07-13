import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface StudentMenuScreenProps {
  navigation: NavigationProps;
}

export default function StudentMenuScreen({ navigation }: StudentMenuScreenProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'View and update your profile',
      icon: 'account-circle',
      color: 'bg-blue-500',
    },
    {
      id: 'guardian',
      title: 'Guardian Contacts',
      subtitle: 'Emergency contact information',
      icon: 'account-group',
      color: 'bg-green-500',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Activity and announcement alerts',
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
      subtitle: 'Get help and contact school',
      icon: 'help-circle-outline',
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="bg-white px-6 py-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-gray-900">My Account</Text>
            <Text className="text-gray-600">{user?.email}</Text>
          </View>
          <View className="bg-green-100 p-3 rounded-full">
            <MaterialCommunityIcons name="school" size={24} color="#10B981" />
          </View>
        </View>
      </View>

      {/* Student Info Card */}
      <View className="mx-6 mt-4 bg-white rounded-lg p-4 shadow-sm">
        <View className="flex-row items-center">
          <View className="bg-green-100 p-3 rounded-full mr-4">
            <MaterialCommunityIcons name="account" size={24} color="#10B981" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">{user?.name}</Text>
            <Text className="text-gray-600">Student</Text>
            <Text className="text-sm text-green-600 mt-1">ID: {user?.studentId}</Text>
          </View>
        </View>
      </View>

      {/* Attendance Status */}
      <View className="mx-6 mt-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white font-semibold">Today's Attendance</Text>
            <Text className="text-white text-2xl font-bold mt-1">Present</Text>
          </View>
          <MaterialCommunityIcons name="check-circle" size={40} color="white" />
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
      </ScrollView>
    </SafeAreaView>
  );
}
