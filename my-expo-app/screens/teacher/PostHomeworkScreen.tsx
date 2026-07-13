import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface PostHomeworkScreenProps {
  navigation: NavigationProps;
}

export default function PostHomeworkScreen({ navigation }: PostHomeworkScreenProps) {
  const { colors, theme } = useTheme();
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('10-A');

  const classes = ['10-A', '10-B', '9-A', '9-B', '8-A'];

  const handlePost = () => {
    if (!subject || !title || !description) {
      Alert.alert('Missing Fields', 'Please fill all required fields');
      return;
    }
    Alert.alert('Success', 'Homework posted successfully!');
    setSubject('');
    setTitle('');
    setDescription('');
    setDueDate('');
  };

  return (
    <SafeAreaView edges={['top']} className={`flex-1 ${colors.background}`}>
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
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Post</Text>
            <Text className="text-2xl font-bold text-brand-pink">Homework 📝</Text>
          </View>
          <View className="bg-brand-yellow w-16 h-16 rounded-3xl items-center justify-center">
            <MaterialCommunityIcons name="book-plus" size={32} color="#92400E" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
        <View className={`${colors.surface} rounded-[32px] p-6 border ${colors.border}`}>
          <View className="mb-4">
            <Text className={`${colors.textSecondary} font-bold text-xs mb-2 uppercase`}>Select Class</Text>
            <View className="flex-row flex-wrap">
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls}
                  onPress={() => setSelectedClass(cls)}
                  className={`${selectedClass === cls ? 'bg-brand-yellow' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-2 rounded-xl mr-2 mb-2`}
                  activeOpacity={0.7}
                >
                  <Text className={`font-bold ${selectedClass === cls ? 'text-amber-900' : colors.text}`}>{cls}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-4">
            <Text className={`${colors.textSecondary} font-bold text-xs mb-2 uppercase`}>Subject *</Text>
            <TextInput
              className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100 text-gray-900'} border rounded-2xl px-4 py-3 font-bold`}
              placeholder="e.g. Mathematics"
              placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View className="mb-4">
            <Text className={`${colors.textSecondary} font-bold text-xs mb-2 uppercase`}>Title *</Text>
            <TextInput
              className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100 text-gray-900'} border rounded-2xl px-4 py-3 font-bold`}
              placeholder="e.g. Chapter 5 - Algebra"
              placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View className="mb-4">
            <Text className={`${colors.textSecondary} font-bold text-xs mb-2 uppercase`}>Description *</Text>
            <TextInput
              className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100 text-gray-900'} border rounded-2xl px-4 py-3 font-bold`}
              placeholder="Describe the assignment..."
              placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View className="mb-6">
            <Text className={`${colors.textSecondary} font-bold text-xs mb-2 uppercase`}>Due Date</Text>
            <TextInput
              className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100 text-gray-900'} border rounded-2xl px-4 py-3 font-bold`}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>

          <TouchableOpacity
            onPress={handlePost}
            className="bg-brand-yellow py-4 rounded-2xl items-center"
            activeOpacity={0.7}
          >
            <Text className="text-amber-900 font-black text-base">Post Homework</Text>
          </TouchableOpacity>
        </View>
        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}
