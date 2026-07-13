import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

export default function StudentQuickActionScreen({ navigation }: Props) {
  const { user } = useAuth();

  const actions = [
    { label: 'My Attendance', screen: 'attendance', icon: 'calendar-check', color: '#10B981', desc: 'View attendance report' },
    { label: 'Kids Activity', screen: 'activityFeed', icon: 'image-multiple', color: '#F59E0B', desc: 'View school activities' },
    { label: 'Timetable', screen: 'timetable', icon: 'calendar-clock', color: '#6366F1', desc: 'Daily school schedule' },
    { label: 'Live Camera', screen: 'liveCamera', icon: 'broadcast', color: '#F59E0B', desc: 'View classroom live feed' },
    { label: 'Emergency Contact', screen: 'emergencyContact', icon: 'phone-alert', color: '#EF4444', desc: 'Call guardians quickly' },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-12 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Student Access
              </Text>
              <Text className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
                Quick Actions
              </Text>
            </View>
            <View className="bg-amber-500 w-16 h-16 rounded-2xl items-center justify-center">
              <MaterialCommunityIcons name="flash" size={32} color="white" />
            </View>
          </View>
        </View>

        <View className="px-6">
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(action.screen)}
              className="mb-4 rounded-2xl overflow-hidden shadow-sm"
            >
              <View style={{ backgroundColor: action.color }} className="p-6 flex-row items-center">
                <View className="bg-white/20 w-14 h-14 rounded-xl items-center justify-center mr-4">
                  <MaterialCommunityIcons name={action.icon as any} size={28} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-white">{action.label}</Text>
                  <Text className="text-sm text-white/70 mt-1">{action.desc}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View className="h-40" />
      </ScrollView>
    </View>
  );
}
