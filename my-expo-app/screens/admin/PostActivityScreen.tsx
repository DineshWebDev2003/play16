import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, Activity } from '../../contexts/AuthContext';
import PremiumPopup from '../../components/PremiumPopup';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

const StudentSelector = memo(({ students, onSelectionCountChange, selectedIdsRef }: {
  students: any[];
  onSelectionCountChange: (count: number) => void;
  selectedIdsRef: React.MutableRefObject<string[]>;
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    selectedIdsRef.current = [];
    return [];
  });
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (selectedIds.length > 0) {
      setSelectedIds([]);
    }
  }, [students]);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
    onSelectionCountChange(selectedIds.length);
  }, [selectedIds, onSelectionCountChange, selectedIdsRef]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(q) || (s.studentId && s.studentId.toLowerCase().includes(q)));
  }, [students, searchQuery]);

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  }, []);

  const displayText = selectedIds.length === 0
    ? 'Select students to tag'
    : selectedIds.length === 1
      ? `1 student selected`
      : `${selectedIds.length} students selected`;

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="bg-gray-50 rounded-2xl px-5 h-14 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          <View className="bg-amber-100 w-8 h-8 rounded-xl items-center justify-center mr-3">
            <MaterialCommunityIcons name="account-multiple" size={18} color="#D97706" />
          </View>
          <Text className={`font-bold text-base ${selectedIds.length === 0 ? 'text-gray-400' : 'text-gray-900'}`} numberOfLines={1}>
            {displayText}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={22} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal visible={showPicker} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 pt-6 pb-3 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-lg font-black text-gray-900">Tag Students</Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => setSelectedIds(filteredStudents.map(s => s.id))}
                  className="bg-amber-100 px-3 py-1.5 rounded-xl mr-3"
                >
                  <Text className="text-amber-700 font-bold text-xs">Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="px-6 pt-3 pb-2">
              <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 h-11">
                <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 font-bold text-gray-900 text-sm"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Type student name or ID..."
                  placeholderTextColor="#9CA3AF"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView className="flex-1 px-6 py-3">
              {filteredStudents.length === 0 ? (
                <View className="py-10 items-center">
                  <MaterialCommunityIcons name="account-search-outline" size={36} color="#D1D5DB" />
                  <Text className="text-gray-400 font-bold text-sm mt-2">No students found</Text>
                </View>
              ) : filteredStudents.map(student => {
                const isSelected = selectedIds.includes(student.id);
                return (
                  <TouchableOpacity
                    key={student.id}
                    onPress={() => toggle(student.id)}
                    className={`flex-row items-center py-4 px-3 rounded-2xl mb-1 ${isSelected ? 'bg-amber-50' : ''}`}
                  >
                    <View className="w-12 h-12 rounded-2xl overflow-hidden mr-4">
                      {student.avatar ? (
                        <Image source={{ uri: student.avatar }} className="w-full h-full" />
                      ) : (
                        <View className="flex-1 bg-gray-100 items-center justify-center">
                          <MaterialCommunityIcons name="account-child-circle" size={24} color="#D1D5DB" />
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900 text-base">{student.name}</Text>
                      <Text className="text-gray-400 text-xs font-bold">#{student.studentId}</Text>
                    </View>
                    <View className={`w-7 h-7 rounded-lg border-2 items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-gray-300'}`}>
                      {isSelected && <MaterialCommunityIcons name="check" size={18} color="white" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View className="px-6 py-4 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                className="bg-amber-500 py-4 rounded-2xl items-center"
              >
                <Text className="text-white font-black text-base">Done — {selectedIds.length} Selected</Text>
              </TouchableOpacity>
            </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Modal>
    </>
  );
}, (prevProps, nextProps) =>
  prevProps.students === nextProps.students &&
  prevProps.onSelectionCountChange === nextProps.onSelectionCountChange &&
  prevProps.selectedIdsRef === nextProps.selectedIdsRef
);

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface PostActivityScreenProps {
  navigation: NavigationProps;
}

export default function PostActivityScreen({ navigation }: PostActivityScreenProps) {
  const { users, user, addActivity, branches } = useAuth();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const selectedIdsRef = useRef<string[]>([]);

  const students = useMemo(() =>
    users.filter(u => u.role === 'student' && (!selectedBranchId || u.branch_id === selectedBranchId)),
    [users, selectedBranchId]
  );

  const onSelectionCountChange = useCallback((count: number) => {
    setSelectedCount(count);
  }, []);

  const handlePost = async () => {
    if (!title.trim() || selectedIdsRef.current.length === 0) {
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
        studentIds: selectedIdsRef.current,
        branch_id: selectedBranchId || undefined,
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
          <View style={{ paddingTop: Math.max(insets.top, 16) }} className="px-6 pb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className="mb-4 bg-gray-100 w-12 h-12 rounded-2xl items-center justify-center border border-gray-200 shadow-sm"
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="arrow-left" size={28} color="#000" />
                </TouchableOpacity>
                <Text className="text-4xl font-black text-gray-900 tracking-tighter">Post Activity</Text>
              </View>
              <View className="bg-amber-500 w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3">
                <MaterialCommunityIcons name="account-child-circle" size={42} color="white" />
              </View>
            </View>

            {user?.role === 'master_admin' && (
              <View style={{ marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowBranchPicker(true)}
                  className="bg-gray-100 rounded-2xl px-5 h-14 flex-row items-center justify-between border border-gray-200"
                >
                  <Text className={`font-bold text-base ${selectedBranchId ? 'text-gray-900' : 'text-gray-400'}`}>
                    {selectedBranchId ? (branches.find(b => b.id === selectedBranchId)?.name || 'Select Branch') : 'All Branches'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={22} color="#9CA3AF" />
                </TouchableOpacity>

                <Modal visible={showBranchPicker} transparent animationType="fade">
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowBranchPicker(false)}
                    className="flex-1 bg-black/50 items-center justify-center px-6"
                  >
                    <View className="bg-white w-full rounded-3xl overflow-hidden" style={{ elevation: 20 }}>
                      <View className="px-6 pt-6 pb-3 border-b border-gray-100">
                        <Text className="text-lg font-black text-gray-900">Select Branch</Text>
                      </View>
                      <ScrollView style={{ maxHeight: 320 }}>
                        <TouchableOpacity
                          onPress={() => { setSelectedBranchId(''); setShowBranchPicker(false); }}
                          className={`px-6 py-4 flex-row items-center ${selectedBranchId === '' ? 'bg-amber-50' : ''}`}
                        >
                          <MaterialCommunityIcons name="domain-off" size={20} color={selectedBranchId === '' ? '#D97706' : '#9CA3AF'} />
                          <Text className={`ml-3 font-bold text-base ${selectedBranchId === '' ? 'text-amber-600' : 'text-gray-900'}`}>All Branches</Text>
                          {selectedBranchId === '' && <MaterialCommunityIcons name="check" size={20} color="#D97706" style={{ marginLeft: 'auto' }} />}
                        </TouchableOpacity>
                        {branches.map(b => (
                          <TouchableOpacity
                            key={b.id}
                            onPress={() => { setSelectedBranchId(b.id); setShowBranchPicker(false); }}
                            className={`px-6 py-4 flex-row items-center border-t border-gray-50 ${selectedBranchId === b.id ? 'bg-amber-50' : ''}`}
                          >
                            <MaterialCommunityIcons name="domain" size={20} color={selectedBranchId === b.id ? '#D97706' : '#6B7280'} />
                            <Text className={`ml-3 font-bold text-base ${selectedBranchId === b.id ? 'text-amber-600' : 'text-gray-900'}`}>{b.name}</Text>
                            {selectedBranchId === b.id && <MaterialCommunityIcons name="check" size={20} color="#D97706" style={{ marginLeft: 'auto' }} />}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity
                        onPress={() => setShowBranchPicker(false)}
                        className="px-6 py-4 border-t border-gray-100"
                      >
                        <Text className="text-center font-bold text-gray-400">Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </View>
            )}

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
                  <Text className="text-amber-600 text-[8px] font-bold uppercase tracking-widest">{selectedCount} Selected</Text>
                </View>
              </View>

              <StudentSelector
                students={students}
                onSelectionCountChange={onSelectionCountChange}
                selectedIdsRef={selectedIdsRef}
              />
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
