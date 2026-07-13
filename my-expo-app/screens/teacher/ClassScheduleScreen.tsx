import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface ClassScheduleScreenProps {
  navigation: NavigationProps;
}

export default function ClassScheduleScreen({ navigation }: ClassScheduleScreenProps) {
  const { colors, theme } = useTheme();

  const schedule = [
    { id: '1', time: '08:00 - 09:00', class: '10-A', subject: 'Mathematics', room: 'Room 101' },
    { id: '2', time: '09:00 - 10:00', class: '10-B', subject: 'Mathematics', room: 'Room 102' },
    { id: '3', time: '10:30 - 11:30', class: '9-A', subject: 'Algebra', room: 'Room 101' },
    { id: '4', time: '11:30 - 12:30', class: '9-B', subject: 'Algebra', room: 'Room 102' },
    { id: '5', time: '14:00 - 15:00', class: '8-A', subject: 'Basic Math', room: 'Room 103' },
  ];

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border}`}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Class</Text>
            <Text className="text-2xl font-bold text-brand-pink">Schedule 📅</Text>
          </View>
          <View className="bg-brand-yellow w-16 h-16 rounded-3xl items-center justify-center">
            <MaterialCommunityIcons name="calendar-clock" size={32} color="#92400E" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
          Today's Classes
        </Text>

        {schedule.map((item) => (
          <View key={item.id} className={`${colors.surface} rounded-2xl p-5 mb-4 border ${colors.border}`}>
            <View className="flex-row items-center mb-3">
              <View className="bg-brand-pink p-3 rounded-2xl mr-4">
                <MaterialCommunityIcons name="clock-outline" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className={`font-black ${colors.text} text-lg mb-1`}>{item.subject}</Text>
                <Text className={`text-xs ${colors.textSecondary}`}>Class {item.class}</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="map-marker" size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text className={`text-sm ${colors.textTertiary} ml-2`}>{item.room}</Text>
              </View>
              <Text className={`text-sm ${colors.textTertiary} font-bold`}>{item.time}</Text>
            </View>
          </View>
        ))}
        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}
