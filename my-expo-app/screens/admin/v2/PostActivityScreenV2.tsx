import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, Activity } from '../../../contexts/AuthContext';
import PremiumPopup from '../../../components/PremiumPopup';
import GlassDropdown from './GlassDropdown';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;
const GREEN = ['#10B981', '#059669'] as [string, string];

const PAINT_ICON = require('../../../assets/icons/painting.png');
const FAMILY_ICON = require('../../../assets/icons/family.png');
const PLAYER_ICON = require('../../../assets/icons/player.png');

// ─── Soft radial glow (layered gradients ≈ blurred radial) ─────────────────────
function RadialGlow({ size, color, opacity, style }: {
  size: number;
  color: string;
  opacity: number;
  style?: any;
}) {
  const layers = [0, 45, 90, 135];
  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, opacity },
        style,
      ]}
    >
      {layers.map((deg) => (
        <LinearGradient
          key={deg}
          colors={[color, 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${deg}deg` }] }]}
        />
      ))}
    </View>
  );
}

const inputStyle = {
  backgroundColor: 'rgba(247,249,246,0.9)',
  borderRadius: 16,
  paddingHorizontal: 20,
  paddingVertical: 16,
  fontSize: 15,
  fontWeight: '700' as const,
  color: TEXT_PRIMARY,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
};

const StudentSelector = memo(({ students, onSelectionCountChange, selectedIdsRef }: {
  students: any[];
  onSelectionCountChange: (count: number) => void;
  selectedIdsRef: React.MutableRefObject<string[]>;
}) => {
  const insets = useSafeAreaInsets();
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
      ? '1 student selected'
      : `${selectedIds.length} students selected`;

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={inputStyle}
      >
        <View className="flex-row items-center flex-1">
          <View className="bg-amber-100 w-9 h-9 rounded-xl items-center justify-center mr-3">
            <MaterialCommunityIcons name="account-multiple" size={18} color="#D97706" />
          </View>
          <Text className={`font-bold text-base flex-1 ${selectedIds.length === 0 ? 'text-gray-400' : 'text-[#1F2D28]'}`} numberOfLines={1}>
            {displayText}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={22} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <Modal visible={showPicker} animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
          {/* Aurora Glass background */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <RadialGlow size={420} color="#DDF8D7" opacity={0.28} style={{ top: -160, left: -160 }} />
            <RadialGlow size={420} color="#DDFBFF" opacity={0.25} style={{ top: -140, left: SCREEN_WIDTH / 2 - 210 }} />
            <RadialGlow size={460} color="#F8FFD8" opacity={0.24} style={{ bottom: -180, left: -180 }} />
          </View>

          <View style={{ flex: 1, paddingTop: Math.max(insets?.top || 0, 56) }} className="px-6 pb-6">
            <View className="flex-row items-center mb-6">
              <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={FAMILY_ICON} style={{ width: 44, height: 44 }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.4 }}>Tag Students</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 1 }}>
                  {selectedIds.length} selected
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedIds(filteredStudents.map(s => s.id))} style={{ marginRight: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.14)' }}>
                <Text style={{ color: '#D97706', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPicker(false)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={20} color={TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 48, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
              <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 font-bold text-sm"
                style={{ color: TEXT_PRIMARY }}
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

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {filteredStudents.length === 0 ? (
                <View className="py-10 items-center">
                  <MaterialCommunityIcons name="account-search-outline" size={40} color="#D1D5DB" />
                  <Text className="text-gray-400 font-bold text-sm mt-2">No students found</Text>
                </View>
              ) : filteredStudents.map(student => {
                const isSelected = selectedIds.includes(student.id);
                return (
                  <TouchableOpacity
                    key={student.id}
                    onPress={() => toggle(student.id)}
                    activeOpacity={0.85}
                    className="flex-row items-center px-4 py-3 mb-3"
                    style={{
                      borderRadius: 18,
                      backgroundColor: isSelected ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.92)',
                      borderWidth: 1,
                      borderColor: isSelected ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <View className="w-12 h-12 rounded-[14px] overflow-hidden mr-3">
                      {student.avatar ? (
                        <Image source={{ uri: student.avatar }} className="w-full h-full" />
                      ) : (
                        <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                          <MaterialCommunityIcons name="account-child-circle" size={24} color="#10B981" />
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-base" style={{ color: TEXT_PRIMARY }}>{student.name}</Text>
                      <Text className="text-xs font-bold text-gray-400">#{student.studentId}</Text>
                    </View>
                    <View
                      className="w-7 h-7 rounded-lg border-2 items-center justify-center"
                      style={{ borderColor: isSelected ? '#10B981' : '#D1D5DB', backgroundColor: isSelected ? '#10B981' : 'transparent' }}
                    >
                      {isSelected && <MaterialCommunityIcons name="check" size={18} color="white" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View className="py-4">
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                className="items-center justify-center py-4"
                style={{ borderRadius: 18, backgroundColor: '#F59E0B' }}
              >
                <Text className="text-white font-black text-base">Done — {selectedIds.length} Selected</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

export default function PostActivityScreenV2({ navigation }: PostActivityScreenProps) {
  const { users, user, addActivity } = useAuth();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
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
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      {/* ── Aurora Glass background ── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <RadialGlow size={480} color="#DDF8D7" opacity={0.28} style={{ top: -160, left: -160 }} />
        <RadialGlow size={420} color="#DDFBFF" opacity={0.25} style={{ top: -140, left: SCREEN_WIDTH / 2 - 210 }} />
        <RadialGlow size={520} color="#F8FFD8" opacity={0.24} style={{ bottom: -180, left: -180 }} />
        <RadialGlow size={450} color="#EAF5FF" opacity={0.18} style={{ top: SCREEN_HEIGHT * 0.4 - 225, right: -180 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View style={{ paddingTop: Math.max(insets.top, 56) }} className="px-6 pb-6">
            {/* Header */}
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
                style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color={TEXT_PRIMARY} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>School Gallery</Text>
                <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Post Activity</Text>
              </View>
              <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={PAINT_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
              </View>
            </View>

            {/* Branch dropdown */}
            {user?.role === 'master_admin' && (
              <View style={{ marginTop: 20 }}>
                <GlassDropdown
                  selectedBranchId={selectedBranchId || null}
                  onSelect={(id) => setSelectedBranchId(id || '')}
                />
              </View>
            )}
          </View>

          <View className="px-6 pb-20">
            <View className="mb-6">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Title</Text>
              <TextInput
                style={inputStyle}
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
                style={{ ...inputStyle, minHeight: 130, textAlignVertical: 'top' }}
                value={description}
                onChangeText={setDescription}
                placeholder="Capture the magic of today's learning journey..."
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>

            <View className="mb-6">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Add Media</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => pickMedia('image')}
                  activeOpacity={0.9}
                  className="flex-1 rounded-[18px] py-4 items-center justify-center"
                  style={{ backgroundColor: mediaType === 'image' && mediaUrl ? 'rgba(245,158,11,0.12)' : 'rgba(247,249,246,0.9)', borderWidth: 1, borderColor: mediaType === 'image' && mediaUrl ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.6)' }}
                >
                  <Image source={FAMILY_ICON} style={{ width: 44, height: 44 }} resizeMode="contain" />
                  <Text className={`text-[10px] font-bold mt-1 ${mediaType === 'image' && mediaUrl ? 'text-amber-600' : 'text-gray-400'}`}>PHOTO</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => pickMedia('video')}
                  activeOpacity={0.9}
                  className="flex-1 rounded-[18px] py-4 items-center justify-center"
                  style={{ backgroundColor: mediaType === 'video' && mediaUrl ? 'rgba(16,185,129,0.12)' : 'rgba(247,249,246,0.9)', borderWidth: 1, borderColor: mediaType === 'video' && mediaUrl ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.6)' }}
                >
                  <Image source={PLAYER_ICON} style={{ width: 44, height: 44 }} resizeMode="contain" />
                  <Text className={`text-[10px] font-bold mt-1 ${mediaType === 'video' && mediaUrl ? 'text-green-600' : 'text-gray-400'}`}>VIDEO</Text>
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
                    onPress={() => { setMediaUrl(null); setThumbnailUrl(null); }}
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
              style={{ borderRadius: 18, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={GREEN}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-5 flex-row items-center justify-center"
              >
                {isUploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={22} color="white" />
                    <Text className="text-white font-bold text-base ml-3">Publish Activity</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isUploading} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-8">
          <View className="bg-white w-full rounded-[28px] p-8 items-center">
            <ActivityIndicator size="large" color="#059669" />
            <Text className="text-lg font-black text-[#1F2D28] mt-6">Publishing Story</Text>
            <Text className="text-sm text-gray-500 text-center mt-2 mb-6">Preparing your magical moments for the school gallery...</Text>
            <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <View style={{ width: `${uploadProgress}%` }} className="h-full bg-green-500 rounded-full" />
            </View>
            <View className="flex-row items-center justify-between w-full mb-6">
              <Text className="text-green-600 font-bold text-[10px] uppercase tracking-widest">{uploadProgress}%</Text>
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
