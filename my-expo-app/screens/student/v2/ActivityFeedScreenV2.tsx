import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image, Modal,
  Dimensions, FlatList, Animated, StyleSheet, StatusBar,
  Alert, Pressable, ActivityIndicator, TextInput,
  KeyboardAvoidingView, Platform, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PremiumPopup from '../../../components/PremiumPopup';
import GlassDropdown from '../../admin/v2/GlassDropdown';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAP = 1.5;
const COLUMN_WIDTH = (SCREEN_WIDTH - GAP * 4) / 3;

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;

const PAINT_ICON = require('../../../assets/icons/painting.png');

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

interface Student {
  id: string;
  name: string;
  avatar: string;
  studentId?: string;
}

interface Activity {
  id: string;
  type: 'image' | 'video';
  title: string;
  media: string;
  thumbnail: string;
  studentName: string;
  studentId: string;
  studentAvatar: string;
  timestamp: string;
  groupParticipants: Student[];
  layoutType: 'square' | 'tall';
  likesCount: number;
  comments: any[];
}

interface ActivityFeedScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
  route?: {
    params?: {
      id?: string | number;
      [key: string]: any;
    };
  };
}

const ReelItem = React.memo(({
  item,
  showReel,
  isActive,
  user,
  onDelete,
  onClose,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onComment,
  containerHeight
}: {
  item: Activity;
  showReel: boolean;
  isActive: boolean;
  user: any;
  onDelete: (id: string) => void;
  onClose: () => void;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onComment: (id: string) => void;
  containerHeight: number;
}) => {
  const videoRef = useRef<Video>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      const fileName = `${item.title.replace(/\s/g, '_')}_${item.id}${item.type === 'video' ? '.mp4' : '.jpg'}`;
      const dir = new FileSystem.Directory(FileSystem.Paths.cache, 'downloads');
      if (!dir.exists) dir.create({ intermediates: true });
      const target = new FileSystem.File(dir, fileName);
      const res = await FileSystem.File.downloadFileAsync(item.media, target, { idempotent: true });
      if (res?.uri) {
        await Sharing.shareAsync(res.uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to download media');
    }
  };

  useEffect(() => {
    if (isActive && showReel && !isPaused) {
      if (item.type === 'image') {
        const currentVal = (progress as any)._value || 0;
        animationRef.current = Animated.timing(progress, {
          toValue: 1,
          duration: 7000 * (1 - currentVal),
          useNativeDriver: false,
        });
        animationRef.current.start();
      }
    } else {
      if (animationRef.current) animationRef.current.stop();
      if (!isActive || !showReel) progress.setValue(0);
    }
  }, [isActive, showReel, isPaused, item.type]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) {
      if (status.error) { setVideoError(status.error); setIsVideoLoading(false); }
      return;
    }
    setIsVideoLoading(false);
    setVideoError(null);
    if (status.durationMillis) {
      progress.setValue(status.positionMillis / status.durationMillis);
    }
  };

  return (
    <View style={{ width: SCREEN_WIDTH, height: containerHeight, backgroundColor: '#0B1511' }}>
      <Image
        source={{ uri: item.thumbnail }}
        style={[StyleSheet.absoluteFill, { opacity: 0.35 }]}
        blurRadius={100}
      />
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={() => setIsPaused(true)}
        onPressOut={() => setIsPaused(false)}
        style={StyleSheet.absoluteFill}
      >
        {item.type === 'video' && isActive ? (
          <View style={StyleSheet.absoluteFill}>
            <Video
              ref={videoRef}
              source={{ uri: item.media }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={showReel && isActive && !isPaused}
              isLooping
              isMuted={!(showReel && isActive)}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              useNativeControls={false}
              posterSource={{ uri: item.thumbnail }}
              usePoster={true}
              posterStyle={{ resizeMode: 'contain' }}
            />
            {isVideoLoading && (
              <View style={StyleSheet.absoluteFill} className="items-center justify-center">
                <ActivityIndicator color="#F59E0B" size="large" />
              </View>
            )}
            {videoError && (
              <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-black/60 p-10">
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="text-white font-black text-center mt-4">Failed to load video</Text>
              </View>
            )}
          </View>
        ) : (
          <Image source={{ uri: item.thumbnail || item.media }} style={StyleSheet.absoluteFill} resizeMode="contain" />
        )}
      </TouchableOpacity>

      {!isPaused && (
        <>
          <View style={styles.topOverlay}>
            <View className="px-5 pt-4">
              <View className="h-[2px] bg-white/20 rounded-full overflow-hidden">
                <Animated.View
                  style={{
                    width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    height: '100%',
                    backgroundColor: '#10B981',
                  }}
                />
              </View>
            </View>
            <View className="flex-row items-center justify-between px-6 py-6">
              <View className="bg-black/60 px-4 py-1.5 rounded-full border border-white/20 flex-row items-center">
                <MaterialCommunityIcons name={item.type === 'video' ? 'video' : 'camera'} size={12} color="white" style={{ marginRight: 6 }} />
                <Text className="text-white font-bold text-[10px] tracking-[1px]">{item.type.toUpperCase()}</Text>
              </View>
              <View className="flex-row items-center">
                {(user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'master_admin') && (
                  <TouchableOpacity onPress={() => onDelete(item.id)} className="bg-red-500/60 w-11 h-11 rounded-full items-center justify-center border border-white/20 mr-3">
                    <MaterialCommunityIcons name="delete" size={24} color="white" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} className="bg-black/60 w-11 h-11 rounded-full items-center justify-center border border-white/20">
                  <MaterialCommunityIcons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.bottomOverlay}>
            <View className="flex-row items-center mb-4">
              <View className="bg-white w-12 h-12 rounded-full p-0.5 mr-3 border-2 border-[#10B981] overflow-hidden items-center justify-center">
                {item.studentAvatar ? (
                  <Image source={{ uri: item.studentAvatar }} className="w-full h-full rounded-full" />
                ) : (
                  <MaterialCommunityIcons name="account" size={28} color="#F59E0B" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-black mb-0.5" numberOfLines={1}>{item.studentName}</Text>
                <Text className="text-white/70 text-sm font-bold tracking-tight">ID: {item.studentId}</Text>
              </View>
            </View>
            <View className="bg-black/70 p-5 rounded-[28px] border border-white/10">
              <Text className="text-white font-black text-base mb-1 leading-5">{item.title}</Text>
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="clock-outline" size={12} color="#F59E0B" />
                <Text className="text-[#FBBF24]/90 text-[10px] ml-1.5 font-black uppercase tracking-widest">{item.timestamp}</Text>
              </View>
            </View>
          </View>

          <View style={styles.rightBar}>
            <TouchableOpacity onPress={onLike} className="items-center mb-4">
              <MaterialCommunityIcons name={isLiked ? "heart" : "heart-outline"} size={30} color={isLiked ? "#EF4444" : "white"} />
              <Text className="text-white text-[10px] font-bold mt-1">{item.likesCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onComment(item.id)} className="items-center mb-4">
              <MaterialCommunityIcons name="comment-outline" size={28} color="white" />
              <Text className="text-white text-[10px] font-bold mt-1">{item.comments?.length || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} className="items-center mb-4">
              <MaterialCommunityIcons name={isSaved ? "bookmark" : "bookmark-outline"} size={28} color={isSaved ? "#FBBF24" : "white"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDownload} className="items-center mb-4">
              <MaterialCommunityIcons name="download" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
});

const CommentModal = ({
  visible,
  onClose,
  activityId,
  comments,
}: {
  visible: boolean;
  onClose: () => void;
  activityId: string | null;
  comments: any[];
}) => {
  const [commentText, setCommentText] = useState('');
  const { addComment } = useAuth();

  const handleSend = async () => {
    if (commentText.trim() && activityId) {
      await addComment(activityId, commentText);
      setCommentText('');
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="bg-white rounded-t-[40px] p-8 border-t border-black/5 maxHeight-[80%]"
        >
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6 opacity-30" />
          <View className="flex-row items-center justify-between mb-8">
            <Text className="text-3xl font-black text-[#1F2D28]">Comments 💭</Text>
            <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
              <MaterialCommunityIcons name="close" size={20} color="#7A8A82" />
            </TouchableOpacity>
          </View>
          <ScrollView className="mb-6 space-y-6" showsVerticalScrollIndicator={false}>
            {comments.map(c => (
              <View key={c.id} className="flex-row items-start mb-6">
                <View className="bg-[#10B981]/20 w-10 h-10 rounded-full items-center justify-center mr-4 overflow-hidden">
                  {c.avatar ? (
                    <Image source={{ uri: c.avatar }} className="w-full h-full" />
                  ) : (
                    <Text className="text-[#059669] font-black">{c.user[0]}</Text>
                  )}
                </View>
                <View className="flex-1 bg-black/5 p-4 rounded-2xl">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-black text-sm text-[#1F2D28]">{c.user}</Text>
                    <Text className="text-[10px] text-gray-400">{c.time}</Text>
                  </View>
                  <Text className="text-[#4A5B53] text-sm leading-5">{c.text}</Text>
                </View>
              </View>
            ))}
            {comments.length === 0 && (
              <View className="py-10 items-center">
                <MaterialCommunityIcons name="comment-off-outline" size={48} color="#7A8A82" />
                <Text className="text-sm font-bold text-[#7A8A82] mt-2">No comments yet. Be the first!</Text>
              </View>
            )}
          </ScrollView>
          <View className="flex-row items-center bg-black/5 p-2 rounded-2xl border border-black/5 mb-4">
            <TextInput
              placeholder="Add a comment..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 px-4 py-3 font-bold text-[#1F2D28]"
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              className="bg-[#10B981] w-12 h-12 rounded-xl items-center justify-center"
              onPress={handleSend}
            >
              <MaterialCommunityIcons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default function ActivityFeedScreenV2({ navigation, route }: ActivityFeedScreenProps) {
  const { activities, users, user, deleteActivity, fetchData } = useAuth();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const [selectedInitialIndex, setSelectedInitialIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showReel, setShowReel] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isMyKidOnly, setIsMyKidOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState<Student[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const { likeActivity } = useAuth();
  const [reelHeight, setReelHeight] = useState(0);
  const [branchFilterId, setBranchFilterId] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedData = async () => {
      const saved = await AsyncStorage.getItem('saved_activities');
      const liked = await AsyncStorage.getItem('liked_activities');
      if (saved) setSavedIds(JSON.parse(saved));
      if (liked) setLikedIds(JSON.parse(liked));
    };
    loadSavedData();
  }, []);

  const toggleSave = useCallback(async (id: string) => {
    setSavedIds(prev => {
      const isSaved = prev.includes(id);
      const next = isSaved ? prev.filter(sid => sid !== id) : [...prev, id];
      AsyncStorage.setItem('saved_activities', JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleLike = useCallback(async (id: string) => {
    setLikedIds(prev => {
      const next = prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id];
      AsyncStorage.setItem('liked_activities', JSON.stringify(next));
      if (!prev.includes(id)) {
        likeActivity(id);
      }
      return next;
    });
  }, [likeActivity]);

  const gridActivities: Activity[] = useMemo(() => {
    let filtered = activities;

    if (branchFilterId) {
      filtered = filtered.filter(act => act.branch_id?.toString() === branchFilterId);
    }

    if (isMyKidOnly && user && user.role === 'student') {
      const userIdStr = user.id.toString();
      const altIdStr = user.studentId?.toString();
      filtered = filtered.filter(act =>
        act.studentIds?.some(id => {
          const idStr = id.toString();
          return idStr === userIdStr || (altIdStr && idStr === altIdStr);
        })
      );
    }

    if (activeTab === 'saved') {
      filtered = filtered.filter(a => savedIds.includes(a.id));
    }

    return filtered.map((act) => {
      const taggedStudents = users.filter(u => act.studentIds?.includes(u.id));
      const primaryStudent = taggedStudents.length > 0 ? taggedStudents[0] : null;
      return {
        id: act.id,
        type: (act.mediaType === 'video' ? 'video' : 'image') as 'image' | 'video',
        title: act.title,
        media: act.mediaUrl,
        thumbnail: act.thumbnailUrl || act.mediaUrl,
        studentName: primaryStudent ? primaryStudent.name : act.author,
        studentId: primaryStudent ? (primaryStudent.studentId || primaryStudent.id) : 'ADMIN',
        studentAvatar: primaryStudent?.avatar || '',
        timestamp: act.date,
        groupParticipants: taggedStudents.map(s => ({
          id: s.id,
          name: s.name,
          avatar: s.avatar || '',
          studentId: s.studentId || s.id,
        })),
        layoutType: 'square',
        likesCount: act.likesCount || 0,
        comments: act.comments || [],
      };
    });
  }, [activities, users, isMyKidOnly, user, savedIds, activeTab, branchFilterId]);

  useEffect(() => {
    if (route?.params?.id && gridActivities.length > 0) {
      const targetId = route.params.id.toString();
      const index = gridActivities.findIndex(a => a.id.toString() === targetId);
      if (index !== -1) {
        const timer = setTimeout(() => openReel(index), 300);
        return () => clearTimeout(timer);
      }
    }
  }, [route?.params?.id, gridActivities.length]);

  const openReel = useCallback((index: number) => {
    setSelectedInitialIndex(index);
    setActiveIndex(index);
    setShowReel(true);
  }, []);

  const closeReel = useCallback(() => setShowReel(false), []);

  const handleDelete = useCallback((activityId: string) => {
    Alert.alert('Delete Activity', 'Are you sure you want to delete this activity? 🗑️', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteActivity(activityId);
          if (success) closeReel();
        },
      },
    ]);
  }, [deleteActivity, closeReel]);

  const renderReelItem = useCallback(({ item, index }: { item: Activity, index: number }) => (
    <ReelItem
      item={item}
      showReel={showReel}
      isActive={activeIndex === index}
      user={user}
      onDelete={handleDelete}
      onClose={closeReel}
      isLiked={likedIds.includes(item.id)}
      isSaved={savedIds.includes(item.id)}
      onLike={() => toggleLike(item.id)}
      onSave={() => toggleSave(item.id)}
      onComment={(id) => { setActiveActivityId(id); setShowCommentModal(true); }}
      containerHeight={reelHeight}
    />
  ), [showReel, activeIndex, user, handleDelete, closeReel, likedIds, savedIds, toggleLike, toggleSave, reelHeight]);

  return (
    <View className="flex-1 bg-[#F7F9F6]">
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

      {/* Header */}
      <View style={{ paddingTop: Math.max(insets.top, 56) }} className="px-6 pb-4">
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
            <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Kids Activity</Text>
          </View>
          <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={PAINT_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
          </View>
        </View>

        <View className="flex-row items-center mt-4">
          <View style={{ flex: 1 }}>
            <GlassDropdown selectedBranchId={branchFilterId} onSelect={setBranchFilterId} showAll />
          </View>
          {user?.role === 'student' && (
            <TouchableOpacity
              onPress={() => setIsMyKidOnly(!isMyKidOnly)}
              activeOpacity={0.8}
              className="flex-row items-center px-4 py-3 rounded-2xl ml-3"
              style={{ backgroundColor: isMyKidOnly ? '#10B981' : 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: isMyKidOnly ? '#10B981' : 'rgba(255,255,255,0.6)' }}
            >
              <MaterialCommunityIcons name={isMyKidOnly ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={18} color={isMyKidOnly ? "white" : TEXT_MUTED} />
              <Text className="ml-2 font-black text-xs" style={{ color: isMyKidOnly ? 'white' : TEXT_MUTED }}>MY KID</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Selector Dropdown */}
      <View className="px-8 mb-6 mt-2 relative z-50">
        <TouchableOpacity
          onPress={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
          activeOpacity={0.9}
          className="flex-row items-center justify-between px-6 py-4 rounded-[22px]"
          style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: activeTab === 'posts' ? '#10B981' : '#F59E0B' }}>
              <MaterialCommunityIcons name={activeTab === 'posts' ? "grid" : "bookmark"} size={16} color="white" />
            </View>
            <Text className="font-black text-sm uppercase tracking-widest" style={{ color: TEXT_PRIMARY }}>
              {activeTab === 'posts' ? 'School Posts' : 'My Saved'}
            </Text>
          </View>
          <MaterialCommunityIcons name={isTabDropdownOpen ? "chevron-up" : "chevron-down"} size={24} color={TEXT_MUTED} />
        </TouchableOpacity>

        {isTabDropdownOpen && (
          <View className="absolute top-[72px] left-8 right-8 rounded-[28px] overflow-hidden z-50"
            style={{ backgroundColor: 'rgba(255,255,255,0.97)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', elevation: 12, shadowColor: '#0B1511', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }}
          >
            <TouchableOpacity
              onPress={() => { setActiveTab('posts'); setIsTabDropdownOpen(false); }}
              className="flex-row items-center px-6 py-5 border-b border-black/5"
              style={{ backgroundColor: activeTab === 'posts' ? 'rgba(16,185,129,0.06)' : 'transparent' }}
            >
              <MaterialCommunityIcons name="grid" size={20} color={activeTab === 'posts' ? '#059669' : TEXT_MUTED} />
              <Text className="ml-4 font-black" style={{ color: activeTab === 'posts' ? '#059669' : '#4A5B53' }}>School Highlights</Text>
              {activeTab === 'posts' && <MaterialCommunityIcons name="check" size={20} color="#10B981" style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setActiveTab('saved'); setIsTabDropdownOpen(false); }}
              className="flex-row items-center px-6 py-5"
              style={{ backgroundColor: activeTab === 'saved' ? 'rgba(245,158,11,0.06)' : 'transparent' }}
            >
              <MaterialCommunityIcons name="bookmark" size={20} color={activeTab === 'saved' ? '#F59E0B' : TEXT_MUTED} />
              <Text className="ml-4 font-black" style={{ color: activeTab === 'saved' ? '#D97706' : '#4A5B53' }}>Saved Moments</Text>
              {activeTab === 'saved' && <MaterialCommunityIcons name="check" size={20} color="#F59E0B" style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Instagram-style 3-column Grid */}
      <FlatList
        className="flex-1"
        showsVerticalScrollIndicator={false}
        data={gridActivities}
        numColumns={3}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: GAP, paddingBottom: 120 }}
        columnWrapperStyle={{ gap: GAP }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Image source={PAINT_ICON} style={{ width: 72, height: 72, opacity: 0.4 }} resizeMode="contain" />
            <Text className="text-lg font-bold text-[#7A8A82] mt-4">
              {activeTab === 'saved' ? "No saved highlights yet" : "No magical moments yet"}
            </Text>
          </View>
        }
        renderItem={({ item: activity }) => (
          <TouchableOpacity
            style={{ width: COLUMN_WIDTH, height: COLUMN_WIDTH, marginBottom: GAP }}
            activeOpacity={0.9}
            onPress={() => {
              const idx = gridActivities.findIndex(a => a.id === activity.id);
              if (idx !== -1) openReel(idx);
            }}
          >
            <View className="w-full h-full overflow-hidden rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
              <Image source={{ uri: activity.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              {activity.type === 'video' && (
                <View className="absolute inset-0 items-center justify-center">
                  <View className="bg-black/40 w-10 h-10 rounded-full items-center justify-center">
                    <MaterialCommunityIcons name="play" size={18} color="white" />
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={showReel} transparent={false} animationType="fade" onRequestClose={closeReel}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View
            style={{ flex: 1 }}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (h > 0) setReelHeight(h);
            }}
          >
            {reelHeight > 0 && (
              <FlatList
                data={gridActivities}
                renderItem={renderReelItem}
                keyExtractor={(item) => item.id}
                pagingEnabled
                horizontal={false}
                showsVerticalScrollIndicator={false}
                initialScrollIndex={selectedInitialIndex}
                getItemLayout={(data, index) => ({ length: reelHeight, offset: reelHeight * index, index })}
                removeClippedSubviews={false}
                initialNumToRender={5}
                windowSize={5}
                onScrollToIndexFailed={(info) => console.warn('Scroll failed:', info)}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.y / reelHeight);
                  setActiveIndex(index);
                }}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      <PremiumPopup
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title="Active Group"
        type="action"
        icon="account-group"
        buttonText="Great! Close"
        onButtonPress={() => setShowGroupModal(false)}
      >
        <View>
          {currentParticipants.length > 0 ? (
            currentParticipants.map((p) => (
              <View key={p.id} className="rounded-[22px] p-4 mb-4 flex-row items-center"
                style={{ backgroundColor: 'rgba(247,249,246,0.9)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)' }}>
                <View className="relative">
                  {p.avatar ? (
                    <Image source={{ uri: p.avatar }} className="w-14 h-14 rounded-[18px] border-2 border-white" />
                  ) : (
                    <View className="w-14 h-14 rounded-[18px] items-center justify-center border-2 border-white" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                      <MaterialCommunityIcons name="account-child" size={32} color="#F59E0B" />
                    </View>
                  )}
                  <View className="absolute -bottom-1 -right-1 bg-[#10B981] w-5 h-5 rounded-full border-2 border-white items-center justify-center">
                    <MaterialCommunityIcons name="check" size={12} color="white" />
                  </View>
                </View>
                <View className="ml-4 flex-1">
                  <Text className="font-black text-[#1F2D28] text-lg tracking-tight">{p.name}</Text>
                  <View className="bg-[#10B981]/10 self-start px-3 py-0.5 rounded-lg mt-1 border border-[#10B981]/20">
                    <Text className="text-[#059669] font-black text-[9px] uppercase tracking-widest">ID: {p.studentId || "N/A"}</Text>
                  </View>
                </View>
                <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.08)' }}>
                  <MaterialCommunityIcons name="star-face" size={22} color="#F59E0B" />
                </View>
              </View>
            ))
          ) : (
            <View className="py-10 items-center">
              <MaterialCommunityIcons name="account-off-outline" size={60} color={TEXT_MUTED} />
              <Text className="text-lg font-bold text-[#7A8A82] mt-4">No specific students tagged</Text>
            </View>
          )}
        </View>
      </PremiumPopup>

      <CommentModal
        visible={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        activityId={activeActivityId}
        comments={gridActivities.find(a => a.id === activeActivityId)?.comments || []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 10,
    zIndex: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 40,
    zIndex: 10,
  },
  rightBar: {
    position: 'absolute',
    right: 15,
    bottom: 60,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
