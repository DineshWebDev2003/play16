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
    { label: 'My Fees', screen: 'myFees', icon: 'cash-multiple', color: '#8B5CF6', desc: 'View fee details & payments' },
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

        <View className="px-6 flex-row flex-wrap justify-between">
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={() => navigation.navigate(action.screen)}
              style={{ width: '48%', marginBottom: 16 }}
              className="rounded-2xl shadow-lg"
            >
              <View style={{ backgroundColor: action.color, borderRadius: 16, padding: 20, minHeight: 150, justifyContent: 'space-between' }}>
                <View className="flex-row justify-between items-start">
                  <View className="bg-white/20 p-2.5 rounded-2xl">
                    <MaterialCommunityIcons name={action.icon as any} size={24} color="white" />
                  </View>
                </View>
                <View>
                  <Text className="text-white text-lg font-black tracking-tight">{action.label}</Text>
                  <Text className="text-white/60 text-[10px] font-bold mt-0.5 uppercase tracking-widest">{action.desc}</Text>
                </View>
                <View className="absolute -bottom-4 -right-4 opacity-10">
                  <MaterialCommunityIcons name={action.icon as any} size={70} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View className="h-40" />
      </ScrollView>
    </View>
  );
}
