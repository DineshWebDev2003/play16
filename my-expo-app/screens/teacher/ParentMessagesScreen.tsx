import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface ParentMessagesScreenProps {
  navigation: NavigationProps;
}

export default function ParentMessagesScreen({ navigation }: ParentMessagesScreenProps) {
  const { colors, theme } = useTheme();
  const [showCompose, setShowCompose] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedParent, setSelectedParent] = useState('');

  const parents = [
    { id: '1', name: 'Mr. John Doe', student: 'John Doe Jr.', lastMessage: 'Thank you for the update' },
    { id: '2', name: 'Mrs. Jane Smith', student: 'Sarah Smith', lastMessage: 'When is the next exam?' },
    { id: '3', name: 'Mr. Mike Johnson', student: 'Emily Johnson', lastMessage: 'Received' },
  ];

  const handleSend = () => {
    if (!message) {
      Alert.alert('Empty Message', 'Please type a message');
      return;
    }
    Alert.alert('Success', 'Message sent successfully!');
    setMessage('');
    setShowCompose(false);
  };

  if (showCompose) {
    return (
      <SafeAreaView className={`flex-1 ${colors.background}`}>
        <View className={`${colors.surface} px-6 py-4 flex-row items-center border-b ${colors.border}`}>
          <TouchableOpacity 
            onPress={() => setShowCompose(false)} 
            className="p-2 -ml-2" 
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme === 'dark' ? '#FFF' : '#374151'} />
          </TouchableOpacity>
          <Text className={`text-xl font-black ${colors.text} ml-2`}>New Message</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-6" keyboardShouldPersistTaps="always">
          <View className={`${colors.surface} rounded-[32px] p-6 border ${colors.border}`}>
            <View className="mb-4">
              <Text className={`${colors.textSecondary} font-bold text-xs mb-2 uppercase`}>Select Parent</Text>
              {parents.map((parent) => (
                <TouchableOpacity
                  key={parent.id}
                  onPress={() => setSelectedParent(parent.id)}
                  className={`${selectedParent === parent.id ? 'bg-brand-pink' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-xl mb-2`}
                  activeOpacity={0.7}
                >
                  <Text className={`font-bold ${selectedParent === parent.id ? 'text-white' : colors.text}`}>
                    {parent.name} ({parent.student})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="mb-6">
              <Text className={`${colors.textSecondary} font-bold text-xs mb-2 uppercase`}>Message</Text>
              <TextInput
                className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100 text-gray-900'} border rounded-2xl px-4 py-3 font-bold`}
                placeholder="Type your message..."
                placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              className="bg-brand-pink py-4 rounded-2xl items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white font-black text-base">Send Message</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Parent</Text>
            <Text className="text-2xl font-bold text-brand-pink">Messages 💬</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCompose(true)}
            className="bg-gray-600 w-16 h-16 rounded-3xl items-center justify-center"
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="message-plus" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {parents.map((parent) => (
          <TouchableOpacity
            key={parent.id}
            className={`${colors.surface} rounded-2xl p-5 mb-4 border ${colors.border}`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="bg-brand-pink/10 p-3 rounded-full mr-4">
                <MaterialCommunityIcons name="account" size={24} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className={`font-black ${colors.text} text-base mb-1`}>{parent.name}</Text>
                <Text className={`text-xs ${colors.textSecondary} mb-2`}>Parent of {parent.student}</Text>
                <Text className={`text-sm ${colors.textTertiary}`}>{parent.lastMessage}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </View>
          </TouchableOpacity>
        ))}
        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}
