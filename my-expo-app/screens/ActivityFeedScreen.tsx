import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, Activity } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface ActivityFeedScreenProps {
  navigation: NavigationProps;
}

const { width } = Dimensions.get('window');

export default function ActivityFeedScreen({ navigation }: ActivityFeedScreenProps) {
  const { activities, user, users } = useAuth();
  const { colors, theme } = useTheme();
  
  const [filterMyKid, setFilterMyKid] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Add real sync logic if available in useAuth
    setTimeout(() => setIsRefreshing(false), 1500);
  }, []);

  useEffect(() => {
     onRefresh();
  }, [onRefresh]);

  // Filter logic: If "My Kid" is on, show activities only for the current student's ID
  const displayActivities = filterMyKid && user?.role === 'student'
    ? activities.filter(act => act.studentIds.includes(user.id))
    : activities;

  const getStudentInfo = (id: string) => {
    return users.find(u => u.id === id);
  };

  const renderActivityCard = (activity: Activity) => (
    <View key={activity.id} className={`${colors.surface} rounded-[40px] mb-8 shadow-xl border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-50'} overflow-hidden`}>
      {/* Feed Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-brand-pink items-center justify-center mr-3">
             <MaterialCommunityIcons name="account-tie" size={24} color="white" />
          </View>
          <View>
            <Text className={`font-black ${colors.text}`}>{activity.author}</Text>
            <Text className={`text-[10px] ${colors.textTertiary} font-bold uppercase tracking-widest`}>{activity.date}</Text>
          </View>
        </View>
        <TouchableOpacity className="p-2">
          <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Media Content */}
      <View className="relative">
        <Image 
          source={{ uri: activity.thumbnailUrl || activity.mediaUrl }} 
          className="w-full h-80"
          resizeMode="cover"
        />
        {activity.mediaType === 'video' && (
          <View className="absolute inset-0 bg-black/20 items-center justify-center">
            <View className="bg-white/30 p-4 rounded-full">
              <MaterialCommunityIcons name="play" size={48} color="white" />
            </View>
          </View>
        )}
        <View className="absolute bottom-4 left-4 flex-row">
           <View className="bg-white/90 px-4 py-1.5 rounded-full flex-row items-center">
              <MaterialCommunityIcons name={activity.mediaType === 'video' ? "video-outline" : "image-outline"} size={14} color="#000" />
              <Text className="text-[10px] font-black ml-1 text-black uppercase tracking-widest">{activity.mediaType}</Text>
           </View>
        </View>
      </View>

      {/* Interaction Bar */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50">
        <View className="flex-row items-center">
          <TouchableOpacity className="flex-row items-center mr-6">
            <MaterialCommunityIcons name="heart-outline" size={24} color={colors.textSecondary} />
            <Text className={`ml-1 font-bold ${colors.textSecondary}`}>24</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center">
            <MaterialCommunityIcons name="comment-outline" size={24} color={colors.textSecondary} />
            <Text className={`ml-1 font-bold ${colors.textSecondary}`}>8</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <MaterialCommunityIcons name="bookmark-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Description & Tags */}
      <View className="px-6 py-4">
        <Text className={`text-xl font-black ${colors.text} mb-2`}>{activity.title}</Text>
        <Text className={`text-sm ${colors.textSecondary} leading-5 mb-4`}>{activity.description}</Text>
        
        {/* Tagged Students */}
        <View className="flex-row flex-wrap items-center">
          <Text className={`text-[10px] font-black uppercase text-brand-pink mr-2 tracking-widest`}>In this post:</Text>
          <View className="flex-row">
            {activity.studentIds.map((sid, index) => {
              const student = getStudentInfo(sid);
              if (!student) return null;
              return (
                <View key={sid} className={`w-8 h-8 rounded-full border-2 border-white -ml-${index === 0 ? '0' : '2'} bg-brand-pink/10 items-center justify-center shadow-sm overflow-hidden`} style={{ marginLeft: index === 0 ? 0 : -10 }}>
                  {student.studentPhoto ? (
                    <Image source={{ uri: student.studentPhoto }} className="w-full h-full" />
                  ) : (
                    <Text className="text-[10px] font-black text-brand-pink">{student.name[0]}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Kids</Text>
            <Text className="text-2xl font-bold text-brand-pink tracking-tight">Activity Feed ✨</Text>
          </View>
          <View className="bg-brand-pink w-14 h-14 rounded-2xl items-center justify-center shadow-lg border-2 border-white">
            <MaterialCommunityIcons name="camera-iris" size={32} color="white" />
          </View>
        </View>

        {/* Filter Toggle (Only for Students/Parents) */}
        {user?.role === 'student' && (
          <View className={`${colors.surface} p-4 rounded-3xl border ${colors.border} flex-row items-center justify-between shadow-sm`}>
            <View className="flex-row items-center">
              <View className="bg-brand-yellow/20 p-2 rounded-xl mr-3">
                 <MaterialCommunityIcons name="heart-multiple" size={20} color="#92400E" />
              </View>
              <View>
                <Text className={`font-black ${colors.text}`}>My Kid Only</Text>
                <Text className={`text-[8px] ${colors.textTertiary} uppercase font-bold tracking-widest`}>Show tagged posts only</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setFilterMyKid(!filterMyKid)}
              className={`w-14 h-8 rounded-full items-center justify-center p-1 ${filterMyKid ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <View className={`w-6 h-6 rounded-full bg-white shadow-sm ${filterMyKid ? 'ml-auto' : 'mr-auto'}`} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        className="flex-1 px-6" 
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl 
                refreshing={isRefreshing} 
                onRefresh={onRefresh}
                colors={['#F59E0B']}
                tintColor={theme === 'dark' ? '#FFF' : '#F59E0B'}
            />
        }
    >
        <View className="pb-20 pt-4">
          {displayActivities.length > 0 ? (
            displayActivities.map(renderActivityCard)
          ) : (
            <View className="items-center justify-center py-20">
              <View className="bg-gray-100 p-8 rounded-full mb-6">
                <MaterialCommunityIcons name="camera-off-outline" size={64} color="#9CA3AF" />
              </View>
              <Text className={`text-xl font-black ${colors.text} text-center`}>No activities yet</Text>
              <Text className={`text-sm ${colors.textSecondary} text-center mt-2 px-10`}>Check back later to see updates from the classroom!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
