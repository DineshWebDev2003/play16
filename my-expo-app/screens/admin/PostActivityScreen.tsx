import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, Activity } from '../../contexts/AuthContext';
import PremiumPopup from '../../components/PremiumPopup';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const students = users.filter(u => u.role === 'student');

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id) 
        : [...prev, id]
    );
  };

  const handlePost = async () => {
    if (!title.trim() || selectedStudentIds.length === 0) {
      Alert.alert('Error', 'Please fill in all fields and select at least one student.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const newActivity: Activity = {
        id: Date.now().toString(),
        title,
        description,
        mediaType,
        mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop',
        thumbnailUrl: thumbnailUrl || undefined,
        studentIds: selectedStudentIds,
        date: (() => {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
        author: user?.name || 'Admin',
        likesCount: 0,
        comments: [],
      };

      await addActivity(newActivity);
      setUploadProgress(100);
      clearInterval(progressInterval);
      
      setTimeout(() => {
        setIsUploading(false);
        setShowSuccessModal(true);
      }, 500);
    } catch (error: any) {
      setIsUploading(false);
      clearInterval(progressInterval);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to post activity. Please try again.';
      Alert.alert('Upload Error', errorMsg);
    }
  };

  const pickMedia = async (type: 'image' | 'video') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload media!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: type === 'image',
      quality: 0.5,
      base64: type === 'image',
      videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaType(type);
      const asset = result.assets[0];
      setMediaUrl(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      
      if (type === 'video') {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(result.assets[0].uri, { time: 500 });
          setThumbnailUrl(uri);
        } catch { setThumbnailUrl(null); }
      } else {
        setThumbnailUrl(null);
      }
    }
  };

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pt-12 pb-6 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mr-4"
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color="#374151" />
              </TouchableOpacity>
              <Text className="text-2xl font-black text-gray-900 tracking-tight">Post Activity</Text>
            </View>
            <MaterialCommunityIcons name="creation" size={26} color="#D97706" />
          </View>

          <View className="px-6 pb-20">
            <View className="mb-6">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Title</Text>
              <TextInput
                className="bg-gray-50 rounded-2xl px-5 h-14 font-bold text-gray-900 text-base"
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Creative Arts Festival"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tag Students</Text>
                <View className="bg-amber-50 px-2 py-1 rounded-lg">
                  <Text className="text-amber-600 text-[8px] font-bold uppercase tracking-widest">{selectedStudentIds.length} Selected</Text>
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
                value={description}
                onChangeText={setDescription}
                placeholder="Capture the magic of today's learning journey..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
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
                  <MaterialCommunityIcons name="camera-plus-outline" size={24} color={mediaType === 'image' && mediaUrl ? '#D97706' : '#9CA3AF'} />
                  <Text className={`text-[10px] font-bold mt-1 ${mediaType === 'image' && mediaUrl ? 'text-amber-600' : 'text-gray-400'}`}>PHOTO</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => pickMedia('video')}
                  activeOpacity={0.9}
                  className={`flex-1 rounded-2xl py-4 items-center justify-center ${mediaType === 'video' && mediaUrl ? 'bg-blue-50' : 'bg-gray-50'}`}
                >
                  <MaterialCommunityIcons name="video-plus-outline" size={24} color={mediaType === 'video' && mediaUrl ? '#3B82F6' : '#9CA3AF'} />
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
              disabled={isUploading}
              className="rounded-2xl bg-amber-500 py-5 flex-row items-center justify-center"
            >
              {isUploading ? (
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

      <Modal visible={isUploading} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-8">
          <View className="bg-white w-full rounded-3xl p-8 items-center">
            <ActivityIndicator size="large" color="#D97706" />
            <Text className="text-lg font-black text-gray-900 mt-6">Publishing Story</Text>
            <Text className="text-sm text-gray-500 text-center mt-2 mb-6">Preparing your magical moments for the school gallery...</Text>
            <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <View style={{ width: `${uploadProgress}%` }} className="h-full bg-amber-500 rounded-full" />
            </View>
            <View className="flex-row items-center justify-between w-full mb-6">
              <Text className="text-amber-600 font-bold text-[10px] uppercase tracking-widest">{uploadProgress}%</Text>
              <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">FINALIZING...</Text>
            </View>
            <TouchableOpacity onPress={() => setIsUploading(false)} className="bg-gray-100 px-8 py-3 rounded-xl">
              <Text className="text-gray-500 font-bold uppercase tracking-widest text-xs">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PremiumPopup
        visible={showSuccessModal}
        type="success"
        title="Post Live!"
        message="Your activity has been published to the school gallery!"
        buttonText="Back"
        onClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}
