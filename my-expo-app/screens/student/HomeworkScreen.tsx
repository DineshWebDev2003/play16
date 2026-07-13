import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface HomeworkScreenProps {
  navigation: NavigationProps;
}

export default function HomeworkScreen({ navigation }: HomeworkScreenProps) {
  const { colors, theme } = useTheme();

  const homeworkList = [
    {
      id: '1',
      subject: 'Mathematics',
      title: 'Chapter 5 - Algebra',
      description: 'Complete exercises 1-10 on page 45',
      dueDate: '2024-02-20',
      status: 'pending',
      priority: 'high',
    },
    {
      id: '2',
      subject: 'Science',
      title: 'Lab Report',
      description: 'Write a report on the photosynthesis experiment',
      dueDate: '2024-02-22',
      status: 'pending',
      priority: 'medium',
    },
    {
      id: '3',
      subject: 'English',
      title: 'Essay Writing',
      description: 'Write a 500-word essay on "My Future Goals"',
      dueDate: '2024-02-18',
      status: 'completed',
      priority: 'low',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      {/* Consistent Header */}
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
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>My</Text>
            <Text className="text-2xl font-bold text-brand-pink">Homework 📚</Text>
          </View>
          <View className="bg-brand-pink w-16 h-16 rounded-3xl items-center justify-center">
            <MaterialCommunityIcons name="book-open-page-variant" size={32} color="white" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
          Assignments 📝
        </Text>

        {homeworkList.map((homework) => (
          <View 
            key={homework.id} 
            className={`${colors.surface} rounded-2xl p-5 mb-4 border ${colors.border}`}
          >
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <View className={`${getPriorityColor(homework.priority)} px-3 py-1 rounded-full mr-2`}>
                    <Text className="text-white text-xs font-black uppercase">{homework.priority}</Text>
                  </View>
                  {homework.status === 'completed' && (
                    <View className="bg-green-500/10 px-3 py-1 rounded-full">
                      <Text className="text-green-600 text-xs font-black uppercase">✓ Done</Text>
                    </View>
                  )}
                </View>
                <Text className={`text-xs ${colors.textSecondary} mb-1 uppercase tracking-wider`}>
                  {homework.subject}
                </Text>
                <Text className={`text-lg font-black ${colors.text} mb-2`}>{homework.title}</Text>
                <Text className={`text-sm ${colors.textSecondary} mb-3`}>{homework.description}</Text>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="calendar" size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <Text className={`text-xs ${colors.textTertiary} ml-2`}>Due: {homework.dueDate}</Text>
                </View>
              </View>
            </View>

            {homework.status === 'pending' && (
              <TouchableOpacity
                className="bg-brand-yellow py-3 rounded-2xl items-center mt-2"
                activeOpacity={0.7}
              >
                <Text className="text-amber-900 font-black text-sm">Mark as Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}
