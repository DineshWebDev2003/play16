import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface RewardsScreenProps {
  navigation: NavigationProps;
}

export default function RewardsScreen({ navigation }: RewardsScreenProps) {
  const { user } = useAuth();
  const { colors, theme } = useTheme();

  const totalPoints = 850;
  const level = 5;
  const nextLevelPoints = 1000;
  const progressPercentage = (totalPoints / nextLevelPoints) * 100;

  const achievements = [
    { id: '1', title: 'Perfect Week', icon: 'star-circle', color: '#FFD700', earned: true, points: 100 },
    { id: '2', title: 'Homework Hero', icon: 'book-check', color: '#10B981', earned: true, points: 50 },
    { id: '3', title: 'Attendance Star', icon: 'calendar-star', color: '#3B82F6', earned: true, points: 75 },
    { id: '4', title: 'Good Behavior', icon: 'emoticon-happy', color: '#F59E0B', earned: true, points: 50 },
    { id: '5', title: 'Art Master', icon: 'palette', color: '#EC4899', earned: false, points: 100 },
    { id: '6', title: 'Sports Champion', icon: 'trophy', color: '#F59E0B', earned: false, points: 100 },
  ];

  const recentRewards = [
    { id: '1', title: 'Completed all homework', points: 50, date: 'Today', icon: 'check-circle' },
    { id: '2', title: 'Perfect attendance this week', points: 75, date: 'Yesterday', icon: 'calendar-check' },
    { id: '3', title: 'Helped a classmate', points: 25, date: '2 days ago', icon: 'hand-heart' },
  ];

  const prizes = [
    { id: '1', title: 'Extra Playtime', points: 200, icon: 'run', color: '#10B981', available: true },
    { id: '2', title: 'Sticker Pack', points: 150, icon: 'sticker-emoji', color: '#F59E0B', available: true },
    { id: '3', title: 'Homework Pass', points: 500, icon: 'book-off', color: '#F59E0B', available: true },
    { id: '4', title: 'Special Lunch', points: 300, icon: 'food', color: '#EC4899', available: false },
  ];

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      {/* Header */}
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
            <Text className="text-2xl font-bold text-purple-600">Rewards 🏆</Text>
          </View>
          <View className="bg-purple-600 w-16 h-16 rounded-3xl items-center justify-center shadow-lg border-4 border-purple-200">
            <MaterialCommunityIcons name="trophy-award" size={32} color="white" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Points & Level Card */}
        <View className={`${colors.surface} rounded-[32px] p-6 mb-6 border ${colors.border} shadow-lg`}>
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className={`text-sm ${colors.textSecondary} uppercase font-bold tracking-wider`}>
                Total Points
              </Text>
              <Text className={`text-6xl font-black text-purple-600 mt-2`}>{totalPoints}</Text>
            </View>
            <View className="items-center">
              <View className="bg-gradient-to-br from-yellow-400 to-orange-500 w-20 h-20 rounded-full items-center justify-center border-4 border-yellow-200">
                <Text className="text-white text-3xl font-black">{level}</Text>
              </View>
              <Text className={`text-xs ${colors.textTertiary} mt-2 font-bold`}>Level</Text>
            </View>
          </View>

          {/* Progress to Next Level */}
          <View className="mt-4">
            <View className="flex-row justify-between mb-2">
              <Text className={`text-xs ${colors.textSecondary} font-bold`}>Next Level Progress</Text>
              <Text className={`text-xs ${colors.textSecondary} font-bold`}>{totalPoints}/{nextLevelPoints}</Text>
            </View>
            <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} h-3 rounded-full overflow-hidden`}>
              <View 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              />
            </View>
          </View>
        </View>

        {/* Achievements */}
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
          Achievements
        </Text>
        <View className="flex-row flex-wrap justify-between mb-6">
          {achievements.map((achievement) => (
            <View 
              key={achievement.id}
              className={`${colors.surface} rounded-2xl p-4 mb-3 w-[48%] border ${colors.border} ${!achievement.earned && 'opacity-50'}`}
            >
              <View className={`${achievement.earned ? 'bg-yellow-100' : 'bg-gray-200'} w-14 h-14 rounded-full items-center justify-center mb-3`}>
                <MaterialCommunityIcons 
                  name={achievement.icon as any} 
                  size={28} 
                  color={achievement.earned ? achievement.color : '#9CA3AF'} 
                />
              </View>
              <Text className={`font-black ${colors.text} text-sm mb-1`}>{achievement.title}</Text>
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                <Text className={`text-xs ${colors.textSecondary} ml-1 font-bold`}>{achievement.points} pts</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Rewards */}
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
          Recent Rewards
        </Text>
        {recentRewards.map((reward) => (
          <View 
            key={reward.id}
            className={`${colors.surface} rounded-2xl p-4 mb-3 border ${colors.border}`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="bg-green-500 w-12 h-12 rounded-full items-center justify-center mr-4">
                  <MaterialCommunityIcons name={reward.icon as any} size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className={`font-black ${colors.text} text-base mb-1`}>{reward.title}</Text>
                  <Text className={`text-xs ${colors.textSecondary}`}>{reward.date}</Text>
                </View>
              </View>
              <View className="bg-purple-500/20 px-3 py-1 rounded-full">
                <Text className="text-purple-700 text-sm font-black">+{reward.points}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Prize Shop */}
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 mt-4 uppercase tracking-widest opacity-60`}>
          Prize Shop 🎁
        </Text>
        {prizes.map((prize) => (
          <TouchableOpacity
            key={prize.id}
            className={`${colors.surface} rounded-2xl p-5 mb-3 border ${colors.border} ${!prize.available && 'opacity-50'}`}
            activeOpacity={0.7}
            disabled={!prize.available}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className={`w-14 h-14 rounded-full items-center justify-center mr-4`} style={{ backgroundColor: prize.color + '20' }}>
                  <MaterialCommunityIcons name={prize.icon as any} size={28} color={prize.color} />
                </View>
                <View className="flex-1">
                  <Text className={`font-black ${colors.text} text-base mb-1`}>{prize.title}</Text>
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                    <Text className={`text-xs ${colors.textSecondary} ml-1 font-bold`}>{prize.points} points</Text>
                  </View>
                </View>
              </View>
              {prize.available ? (
                <View className="bg-purple-600 px-4 py-2 rounded-full">
                  <Text className="text-white text-xs font-black">Redeem</Text>
                </View>
              ) : (
                <View className="bg-gray-400 px-4 py-2 rounded-full">
                  <Text className="text-white text-xs font-black">Locked</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}
