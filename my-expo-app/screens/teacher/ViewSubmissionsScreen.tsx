import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface ViewSubmissionsScreenProps {
  navigation: NavigationProps;
}

export default function ViewSubmissionsScreen({ navigation }: ViewSubmissionsScreenProps) {
  const { colors, theme } = useTheme();

  const submissions = [
    { id: '1', student: 'John Doe', homework: 'Math Chapter 5', status: 'submitted', grade: 'A', date: '2024-02-15' },
    { id: '2', student: 'Jane Smith', homework: 'Math Chapter 5', status: 'submitted', grade: 'B+', date: '2024-02-14' },
    { id: '3', student: 'Mike Johnson', homework: 'Math Chapter 5', status: 'pending', grade: '-', date: '-' },
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
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>View</Text>
            <Text className="text-2xl font-bold text-brand-pink">Submissions 📋</Text>
          </View>
          <View className="bg-pink-600 w-16 h-16 rounded-3xl items-center justify-center">
            <MaterialCommunityIcons name="clipboard-check" size={32} color="white" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {submissions.map((sub) => (
          <View key={sub.id} className={`${colors.surface} rounded-2xl p-5 mb-4 border ${colors.border}`}>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <Text className={`font-black ${colors.text} text-base mb-1`}>{sub.student}</Text>
                <Text className={`text-xs ${colors.textSecondary}`}>{sub.homework}</Text>
              </View>
              <View className={`${sub.status === 'submitted' ? 'bg-green-500' : 'bg-orange-500'} px-3 py-1 rounded-full`}>
                <Text className="text-white text-xs font-black uppercase">{sub.status}</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className={`text-sm ${colors.textTertiary}`}>Grade: {sub.grade}</Text>
              <Text className={`text-xs ${colors.textTertiary}`}>{sub.date}</Text>
            </View>
          </View>
        ))}
        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}
