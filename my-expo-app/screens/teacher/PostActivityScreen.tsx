import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useAuth, Activity } from '../../contexts/AuthContext';
import PremiumPopup from '../../components/PremiumPopup';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface PostActivityScreenProps {
  navigation: NavigationProps;
}

export default function PostActivityScreen({ navigation }: PostActivityScreenProps) {
  const { users, user, addActivity } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const students = users.filter(u => u.role === 'student');

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id) 
        : [...prev, id]
    );
  };

  const pickMedia = async (type: 'image' | 'video') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload media!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setMediaUrl(`data:${type === 'image' ? 'image/jpeg' : 'video/mp4'};base64,${result.assets[0].base64}`);
      if (type === 'video') {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(result.assets[0].uri, { time: 0 });
          setThumbnailUrl(uri);
        } catch { setThumbnailUrl(null); }
      }
    }
  };

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please add a title for this activity!');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please write a description!');
      return;
    }
    setIsPosting(true);
    try {
      await addActivity({
        id: Date.now().toString(),
        title: title.trim(),
        content: description.trim(),
        type: mediaType,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        user_id: user?.id || '',
        user_name: user?.name || 'Teacher',
        user_avatar: user?.avatar,
        tagged_students: selectedStudentIds,
        target: 'student',
      });
      setIsPosting(false);
      setShowSuccessModal(true);
      setTitle('');
      setDescription('');
      setMediaUrl(null);
      setThumbnailUrl(null);
      setSelectedStudentIds([]);
    } catch (error) {
      setIsPosting(false);
      Alert.alert('Error', 'Failed to post activity. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pt-12 pb-4 flex-row items-center">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mr-4"
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#374151" />
            </TouchableOpacity>
            <Text className="text-2xl font-black text-gray-900 tracking-tight">Post Activity</Text>
          </View>

          <View className="px-6 pb-20">
            <View className="mb-5">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Title</Text>
              <TextInput
                className="bg-gray-50 rounded-2xl px-5 h-14 font-bold text-gray-900 text-base"
                placeholder="e.g. Garden Exploration"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tag Students</Text>
                <View className="bg-amber-50 px-2 py-1 rounded-lg">
                  <Text className="text-amber-600 text-[8px] font-bold uppercase tracking-widest">{selectedStudentIds.length} Tagged</Text>
                </View>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity 
                  onPress={() => {
                    if (selectedStudentIds.length === students.length) {
                      setSelectedStudentIds([]);
                    } else {
                      setSelectedStudentIds(students.map(s => s.id));
                    }
                  }}
                  className="items-center mr-4"
                >
                  <View className={`w-16 h-16 rounded-2xl items-center justify-center ${selectedStudentIds.length === students.length ? 'bg-amber-500' : 'bg-gray-100'}`}>
                    <MaterialCommunityIcons 
                      name={selectedStudentIds.length === students.length ? "minus" : "plus"} 
                      size={28} 
                      color={selectedStudentIds.length === students.length ? 'white' : '#9CA3AF'} 
                    />
                  </View>
                  <Text className={`text-[9px] font-bold mt-2 uppercase tracking-widest ${selectedStudentIds.length === students.length ? 'text-amber-500' : 'text-gray-400'}`}>
                    All
                  </Text>
                </TouchableOpacity>

                {students.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <TouchableOpacity 
                      key={student.id} 
                      onPress={() => toggleStudentSelection(student.id)}
                      className="items-center mr-5"
                    >
                      <View className={`w-20 h-20 rounded-3xl overflow-hidden ${isSelected ? 'ring-2 ring-amber-500' : ''}`}>
                        {student.avatar ? (
                          <Image source={{ uri: student.avatar }} className="w-full h-full" />
                        ) : (
                          <View className="flex-1 bg-gray-100 items-center justify-center">
                            <MaterialCommunityIcons name="account-child-circle" size={36} color="#D1D5DB" />
                          </View>
                        )}
                        {isSelected && (
                          <View className="absolute inset-0 bg-amber-500/40 items-center justify-center">
                            <View className="bg-white p-1.5 rounded-full">
                              <MaterialCommunityIcons name="check-bold" size={14} color="#D97706" />
                            </View>
                          </View>
                        )}
                      </View>
                      <Text className={`text-[10px] font-bold mt-2 text-center w-20 ${isSelected ? 'text-amber-500' : 'text-gray-900'}`} numberOfLines={1}>
                        {student.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View className="mb-6">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Description</Text>
              <TextInput
                className="bg-gray-50 rounded-2xl p-5 font-bold text-gray-900 text-base min-h-[120px]"
                placeholder="Write something wonderful about this activity..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View className="mb-6">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Add Media</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity 
                  onPress={() => pickMedia('image')}
                  activeOpacity={0.9}
                  className={`flex-1 rounded-2xl py-4 items-center justify-center ${mediaType === 'image' && mediaUrl ? 'bg-amber-50' : 'bg-gray-50'}`}
                >
                  <MaterialCommunityIcons name="image-plus" size={24} color={mediaType === 'image' && mediaUrl ? '#D97706' : '#9CA3AF'} />
                  <Text className={`text-[10px] font-bold mt-1 ${mediaType === 'image' && mediaUrl ? 'text-amber-600' : 'text-gray-400'}`}>PHOTO</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => pickMedia('video')}
                  activeOpacity={0.9}
                  className={`flex-1 rounded-2xl py-4 items-center justify-center ${mediaType === 'video' && mediaUrl ? 'bg-blue-50' : 'bg-gray-50'}`}
                >
                  <MaterialCommunityIcons name="video-plus" size={24} color={mediaType === 'video' && mediaUrl ? '#3B82F6' : '#9CA3AF'} />
                  <Text className={`text-[10px] font-bold mt-1 ${mediaType === 'video' && mediaUrl ? 'text-blue-600' : 'text-gray-400'}`}>VIDEO</Text>
                </TouchableOpacity>
              </View>
              {mediaUrl && (
                <View className="mt-3 rounded-2xl overflow-hidden relative">
                  <Image source={{ uri: thumbnailUrl || mediaUrl }} className="w-full h-48" resizeMode="cover" />
                  {mediaType === 'video' && (
                    <View className="absolute inset-0 items-center justify-center">
                      <MaterialCommunityIcons name="play-circle-outline" size={56} color="white" />
                    </View>
                  )}
                  <TouchableOpacity 
                    onPress={() => {setMediaUrl(null); setThumbnailUrl(null);}}
                    className="absolute top-3 right-3 bg-black/60 w-8 h-8 rounded-full items-center justify-center"
                  >
                    <MaterialCommunityIcons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={handlePost}
              activeOpacity={0.9}
              disabled={isPosting}
              className="rounded-2xl bg-amber-500 py-5 flex-row items-center justify-center"
            >
              {isPosting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={22} color="white" />
                  <Text className="text-white font-bold text-base ml-3">Publish Activity</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PremiumPopup
        visible={showSuccessModal}
        type="success"
        title="Post Live! 🌟"
        message="Your school activity has been published. Parents and kids will be thrilled to see today's updates! ✨"
        buttonText="Return to Feed"
        onClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}
