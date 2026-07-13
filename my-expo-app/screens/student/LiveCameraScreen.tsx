import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Modal, TextInput, ActivityIndicator, FlatList, StatusBar, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Video, ResizeMode, Audio } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import BranchFilter from '../../components/BranchFilter';

const CAMERA_ICONS = ['youtube', 'twitch', 'video', 'eye', 'security'];

interface Camera {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
  icon?: string;
  branch_id?: string;
}

const CameraCard = memo(({ camera, onSelect, onEdit, onDelete, isAdmin, colors, theme, branches }: any) => {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showVideoFallback, setShowVideoFallback] = useState(false);
  const branchName = camera.branch_id ? branches?.find((b: any) => b.id === camera.branch_id)?.name : '';

  const isHLS = camera.url.includes('.m3u8') || camera.url.includes('/hls/') || camera.url.includes(':3000');
  const isRTSP = camera.url.startsWith('rtsp://') || camera.url.startsWith('rtmp://');
  const isTwitch = camera.url.includes('twitch.tv');
  const isYoutube = camera.url.includes('youtube.com') || camera.url.includes('youtu.be');

  useEffect(() => {
    if (isHLS && !loadError) {
      const t = setTimeout(() => { if (!isReady) setShowVideoFallback(true); }, 8000);
      return () => clearTimeout(t);
    }
  }, [isHLS, isReady, loadError]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onSelect(camera)}
      disabled={camera.status === 'offline'}
      style={{ marginBottom: 24 }}
    >
      {/* TV Frame Container */}
      <View style={{
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#1a1a1a',
        borderRadius: 16, padding: 8,
        borderWidth: 3,
        borderColor: camera.status === 'online' ? '#F59E0B' : (theme === 'dark' ? '#333' : '#555'),
        elevation: 12, shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12,
      }}>
        {/* Screen Area */}
        <View style={{
          backgroundColor: theme === 'dark' ? '#0d0d0d' : '#111',
          borderRadius: 10, overflow: 'hidden',
          aspectRatio: 16 / 9,
          justifyContent: 'center', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {camera.status === 'online' ? (
            <>
              {isTwitch ? (
                <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#9146FF' }}>
                  <MaterialCommunityIcons name="twitch" size={40} color="white" />
                  <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 6 }}>Twitch</Text>
                  <View style={{ position: 'absolute', bottom: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                    <Text style={{ color: '#FFF', fontSize: 7, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Tap to View</Text>
                  </View>
                </View>
              ) : isYoutube ? (
                <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF0000' }}>
                  <MaterialCommunityIcons name="youtube" size={40} color="white" />
                  <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 6 }}>YouTube</Text>
                  <View style={{ position: 'absolute', bottom: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                    <Text style={{ color: '#FFF', fontSize: 7, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Tap to View</Text>
                  </View>
                </View>
              ) : isHLS && !showVideoFallback ? (
                <Video
                  key={camera.url}
                  source={{ uri: camera.url, overrideFileExtension: 'm3u8' }}
                  rate={1.0} volume={0} isMuted={true}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={true} isLooping={true}
                  style={{ flex: 1, width: '100%', backgroundColor: '#000' }}
                  onPlaybackStatusUpdate={(status: any) => {
                    if (status.isLoaded) setIsReady(true);
                    if (status.error) { setLoadError(status.error); setShowVideoFallback(true); }
                  }}
                  onError={(error) => { setLoadError(error); setShowVideoFallback(true); }}
                />
              ) : isRTSP ? (
                <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d' }}>
                  <MaterialCommunityIcons name="remote-tv" size={36} color="#F59E0B" />
                  <Text style={{ color: '#F59E0B', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 6 }}>Camera Feed</Text>
                  <Text style={{ color: '#666', fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Tap to View</Text>
                </View>
              ) : (
                <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d' }}>
                  <MaterialCommunityIcons name="video-wireless" size={36} color="#F59E0B" />
                  <Text style={{ color: '#F59E0B', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 6 }}>Camera Feed</Text>
                  <Text style={{ color: '#666', fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Tap to View</Text>
                </View>
              )}

              {isHLS && !isReady && !loadError && !showVideoFallback && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                  <ActivityIndicator color="#F59E0B" size="small" />
                </View>
              )}

              {loadError && isHLS && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 16 }}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 9, marginTop: 4, textAlign: 'center', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {loadError.toString().includes('403') ? 'Access Denied' : 'Stream Error'}
                  </Text>
                  <Text style={{ color: '#999', fontSize: 7, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Tap to view in player</Text>
                </View>
              )}
            </>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="video-off-outline" size={36} color="#444" />
              <Text style={{ color: '#555', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 6 }}>Offline</Text>
            </View>
          )}

          {/* Power LED */}
          <View style={{
            position: 'absolute', top: 8, right: 8,
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: camera.status === 'online' ? '#22C55E' : '#EF4444',
          }} />
        </View>

        {/* TV Brand Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#999', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }} numberOfLines={1}>
              {camera.name}
            </Text>
            {!!branchName && (
              <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 }}>
                <Text style={{ color: '#FFF', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{branchName}</Text>
              </View>
            )}
          </View>
          {isAdmin && (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity onPress={() => onEdit(camera)} style={{ backgroundColor: '#333', width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="pencil" size={14} color="#F59E0B" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(camera.id)} style={{ backgroundColor: '#333', width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="delete-outline" size={14} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* TV Stand / Legs */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 60, marginTop: 6 }}>
          <View style={{ width: 12, height: 10, backgroundColor: theme === 'dark' ? '#2a2a2a' : '#2a2a2a', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
          <View style={{ width: 12, height: 10, backgroundColor: theme === 'dark' ? '#2a2a2a' : '#2a2a2a', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
        </View>
      </View>

      {/* Status bar below TV */}
      <View style={{ marginTop: 6, paddingHorizontal: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: camera.status === 'online' ? '#22C55E' : '#EF4444', marginRight: 6 }} />
            <Text style={{ fontSize: 9, fontWeight: '700', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              {camera.status === 'online' ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function LiveCameraScreen({ navigation, route }: any) {
  const { colors, theme } = useTheme();
  const { user, branches } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'master_admin'; 

  const [branchFilterId, setBranchFilterId] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isAccessible, setIsAccessible] = useState<boolean | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCamera, setEditingCamera] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', url: '', status: 'online' as 'online' | 'offline', icon: 'video', branch_id: '' });
  const [rotation, setRotation] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isTwitch, setIsTwitch] = useState(false);
  const [isYoutube, setIsYoutube] = useState(false);
  const [isM3U8, setIsM3U8] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const controlsTimer = React.useRef<NodeJS.Timeout | null>(null);

  const getYoutubeEmbedUrl = (urlString: string) => {
    let videoId = '';
    try {
      if (urlString.includes('youtu.be/')) {
        videoId = urlString.split('youtu.be/')[1].split(/[?#]/)[0];
      } else if (urlString.includes('youtube.com/live/')) {
        videoId = urlString.split('youtube.com/live/')[1].split(/[?#]/)[0];
      } else if (urlString.includes('v=')) {
        videoId = urlString.split('v=')[1].split(/[&?#]/)[0];
      }
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&showinfo=0&rel=0&modestbranding=1&origin=https://play1.tnhappykids.in&enablejsapi=1&widget_referrer=https://play1.tnhappykids.in`;
    } catch (e) {
      return urlString;
    }
  };

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.warn(e);
      }
    };
    setupAudio();
    resetTimer();
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [resetTimer]);

  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT).catch(() => {});
    };
  }, []);

  const resetTimer = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setControlsVisible(true);
    controlsTimer.current = setTimeout(() => {
      setControlsVisible(false);
      setShowMenu(false);
    }, 3000);
  }, []);

  const getTwitchEmbedUrl = (url: string) => {
    let channel = '';
    
    // Case 1: Full player URL with channel parameter
    if (url.includes('channel=')) {
      const match = url.match(/[?&]channel=([a-zA-Z0-9_]+)/i);
      if (match) channel = match[1];
    } 
    
    // Case 2: Standard twitch.tv/channelname
    if (!channel && url.includes('twitch.tv/')) {
       if (!url.includes('player.twitch.tv')) {
         const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
         if (match) channel = match[1];
       }
    }

    // Case 3: Fallback to last path segment
    if (!channel) {
       const segments = url.split('/');
       const lastSegment = segments[segments.length - 1];
       channel = lastSegment.split(/[?#]/)[0];
    }

    // Parent domain is MANDATORY for Twitch embeds. 
    // We include both the production domain and common development hostnames.
    const domains = [
      'play1.tnhappykids.in',
      'localhost',
      '127.0.0.1'
    ];
    const parentParams = domains.map(d => `parent=${d}`).join('&');
    
    return `https://player.twitch.tv/?channel=${channel}&${parentParams}&autoplay=true&muted=true&migration=true`;
  };

  const checkAccess = useCallback(async () => {
    if (user?.role !== 'student') {
      setIsAccessible(true);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/attendance?student_id=${user.id}&user_role=${user.role}`);
      const records = res.data || [];
      const todayRecord = records.find((r: any) => r.date === today);

      if (!todayRecord || (todayRecord.status !== 'present' && todayRecord.status !== 'late')) {
        setIsAccessible(false);
        setAttendanceError("To ensure privacy, camera access is only available when your child is marked as 'Present' at school.");
        return;
      }

      if (todayRecord.out_time && todayRecord.out_time.trim() !== '') {
        setIsAccessible(false);
        setAttendanceError("Your child has clocked out and left the school. Access is restricted for privacy once the child leaves the premises.");
        return;
      }

      const now = new Date();
      const parseTime = (timeStr: string) => {
        if (!timeStr || timeStr.trim() === '') return null;
        const parts = timeStr.split(' ');
        if (parts.length < 2) return null;
        const [time, modifier] = parts;
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        const d = new Date(now);
        d.setHours(hours, minutes, 0, 0);
        return d;
      };

      const inTime = parseTime(todayRecord.in_time);
      if (inTime && now < inTime) {
        setIsAccessible(false);
        setAttendanceError("School has not started for your child yet. Please check back after clock-in.");
        return;
      }

      setIsAccessible(true);
    } catch (error) {
      console.error('Access check error:', error);
      setIsAccessible(true);
    }
  }, [user]);

  const fetchCameras = useCallback(async (showIndicator = true) => {
    try {
      if (showIndicator) setIsLoading(true);
      await checkAccess();
      const params = new URLSearchParams();
      if (branchFilterId) params.append('branch_id', branchFilterId);
      const response = await api.get(`/cameras?${params.toString()}`);
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setCameras(data.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        url: c.url,
        status: c.status || 'offline',
        branch_id: c.branch_id?.toString(),
      })));
    } catch (error) {
      console.error('Error fetching cameras:', error);
      Alert.alert('Error', 'Failed to load cameras');
    } finally {
      if (showIndicator) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [checkAccess, branchFilterId]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchCameras(false);
  }, [fetchCameras]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const handleSaveCamera = useCallback(async () => {
    if (!formData.name || !formData.url) {
      Alert.alert('Required', 'Please fill in all fields');
      return;
    }

    try {
      setIsActionLoading(true);
      if (editingCamera) {
        await api.put(`/cameras/${editingCamera.id}`, formData);
      } else {
        await api.post('/cameras', formData);
      }
      setModalVisible(false);
      fetchCameras();
      Alert.alert('Success', 'Camera saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save camera');
    } finally {
      setIsActionLoading(false);
    }
  }, [formData, editingCamera, fetchCameras]);

  const handleDeleteCamera = useCallback((id: string) => {
    Alert.alert('Delete Camera', 'Are you sure you want to remove this camera feed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setIsActionLoading(true);
          await api.delete(`/cameras/${id}`);
          fetchCameras();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete camera');
        } finally {
          setIsActionLoading(false);
        }
      }}
    ]);
  }, [fetchCameras]);

  const handleCameraSelect = useCallback((camera: Camera) => {
    if (camera.status === 'offline') {
      Alert.alert('Camera Offline', 'This camera is currently not available.');
      return;
    }
     setSelectedCamera(camera);
     
     // Detect Twitch
     const isTwitchStream = camera.url.toLowerCase().includes('twitch.tv');
     setIsTwitch(isTwitchStream);
     
     // Detect Youtube
     const isYoutubeStream = camera.url.toLowerCase().includes('youtube.com') || camera.url.toLowerCase().includes('youtu.be');
     setIsYoutube(isYoutubeStream);

     // Detect M3U8
     const isM3U8Stream = camera.url.toLowerCase().includes('.m3u8') || camera.url.toLowerCase().includes('/hls/') || camera.url.toLowerCase().includes(':3000');
     setIsM3U8(isM3U8Stream);
     
     if (!isTwitchStream && !isYoutubeStream && !isM3U8Stream) {
       Alert.alert('Unsupported Source', 'Only Twitch, YouTube, and HLS (.m3u8) streams are currently supported.');
       return;
     }

      setShowWebView(true);
      setIsStreamReady(false);
      setRotation(0);
      setIsMuted(true);
      setControlsVisible(true);
      resetTimer();
      try { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE); } catch (_) {}
   }, [resetTimer]);

  const openModal = useCallback((camera: any = null) => {
    if (camera) {
      setEditingCamera(camera);
      setFormData({ name: camera.name, url: camera.url, status: camera.status, icon: camera.icon || 'video', branch_id: camera.branch_id || '' });
    } else {
      setEditingCamera(null);
      const defaultBranch = user?.role === 'admin' ? user.branch_id || '' : '';
      setFormData({ name: '', url: '', status: 'online', icon: 'video', branch_id: defaultBranch });
    }
    setModalVisible(true);
  }, [user]);

    if (showWebView && selectedCamera) {
      const closeViewer = () => {
        setShowWebView(false);
        try { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT); } catch (_) {}
      };
      return (
        <View className="flex-1 bg-black">
          <StatusBar hidden={true} />
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={resetTimer}
            className="flex-1 relative"
          >
            {/* Controls overlay (fixed, not rotated) */}
            {controlsVisible && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
                {/* Top Controls: Back + Name */}
                <View style={{ position: 'absolute', top: 20, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity onPress={() => closeViewer()}
                    className="bg-black/60 backdrop-blur-md w-12 h-12 rounded-2xl items-center justify-center border border-white/20">
                    <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                  </TouchableOpacity>
                  <View className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex-row items-center h-12 flex-1">
                    <View className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse" />
                    <Text className="text-white font-black text-[10px] uppercase tracking-[1px] flex-1">{selectedCamera.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => closeViewer()}
                    className="bg-red-500/80 w-10 h-10 rounded-2xl items-center justify-center border border-red-400/30">
                    <MaterialCommunityIcons name="close" size={22} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Bottom Controls: Mute + Rotate */}
                <View style={{ position: 'absolute', bottom: 48, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <TouchableOpacity onPress={() => setIsMuted(!isMuted)}
                    className="bg-white/10 backdrop-blur-md w-14 h-14 rounded-[20px] items-center justify-center border border-white/20">
                    <MaterialCommunityIcons name={isMuted ? "volume-off" : "volume-high"} size={26} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setRotation(rotation === 0 ? 90 : 0)}
                    className="bg-[#F59E0B] w-14 h-14 rounded-[20px] items-center justify-center border-2 border-white/20 shadow-xl elevation-8">
                    <MaterialCommunityIcons name={rotation === 0 ? "phone-rotate-landscape" : "phone-rotate-portrait"} size={26} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => closeViewer()}
                    className="bg-white/10 backdrop-blur-md w-14 h-14 rounded-[20px] items-center justify-center border border-white/20">
                    <MaterialCommunityIcons name="fullscreen-exit" size={26} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Video container - fills full screen, rotates if needed */}
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <View style={{ flex: 1, transform: [{ rotate: `${rotation}deg` }] }}>
                {isTwitch ? (
                  <WebView
                  source={{ 
                    uri: getTwitchEmbedUrl(selectedCamera.url),
                    headers: { 'Referer': 'https://play1.tnhappykids.in' }
                  }}
                  style={{ flex: 1, backgroundColor: 'black' }}
                  pointerEvents="none"
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsFullscreenVideo={true}
                  mediaPlaybackRequiresUserAction={false}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View className="absolute inset-0 items-center justify-center bg-[#9146FF]/10">
                      <MaterialCommunityIcons name="twitch" size={80} color="#9146FF" />
                      <Text className="text-[#9146FF] text-xs font-black uppercase tracking-[5px] mt-6">Twitch Loading</Text>
                      <Text className="text-[#9146FF]/60 text-[10px] font-bold uppercase tracking-[2px] mt-2">Connecting to Secure Feed...</Text>
                    </View>
                  )}
                  onLoadEnd={() => setIsStreamReady(true)}
                  onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView HTTP error: ', nativeEvent);
                  }}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView error: ', nativeEvent);
                  }}
                />
              ) : isYoutube ? (
                <WebView
                  source={{ 
                    uri: getYoutubeEmbedUrl(selectedCamera.url),
                    headers: { 'Referer': 'https://play1.tnhappykids.in' }
                  }}
                  style={{ flex: 1, backgroundColor: 'black' }}
                  pointerEvents="none"
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsFullscreenVideo={true}
                  mediaPlaybackRequiresUserAction={false}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View className="absolute inset-0 items-center justify-center bg-[#FF0000]/10">
                      <MaterialCommunityIcons name="youtube" size={80} color="#FF0000" />
                      <Text className="text-[#FF0000] text-xs font-black uppercase tracking-[5px] mt-6">YouTube Live</Text>
                      <Text className="text-[#FF0000]/60 text-[10px] font-bold uppercase tracking-[2px] mt-2">Establishing Stream...</Text>
                    </View>
                  )}
                  onLoadEnd={() => setIsStreamReady(true)}
                />
              ) : isM3U8 ? (
                <View className="flex-1">
                  <Video
                     key={selectedCamera.url}
                     source={{ 
                       uri: selectedCamera.url,
                       overrideFileExtension: 'm3u8'
                     }}
                     rate={1.0}
                     volume={isMuted ? 0.0 : 1.0}
                     isMuted={isMuted}
                     resizeMode={ResizeMode.CONTAIN}
                     shouldPlay={true}
                     isLooping={true}
                     useNativeControls={false}
                     pointerEvents="none"
                     style={{ flex: 1 }}
                     onLoadStart={() => setIsStreamReady(false)}
                     onLoad={() => setIsStreamReady(true)}
                     onPlaybackStatusUpdate={(status: any) => {
                       if (!status.isLoaded && status.error) {
                         Alert.alert('Playback Error', status.error.toString());
                       }
                     }}
                     onError={(err) => Alert.alert('Video Engine Error', err.toString())}
                   />
                   {!isStreamReady && (
                     <View className="absolute inset-0 items-center justify-center bg-black">
                        <MaterialCommunityIcons name="video" size={80} color="#F59E0B" />
                        <Text className="text-brand-pink text-xs font-black uppercase tracking-[5px] mt-6">Secure Feed</Text>
                        <Text className="text-brand-pink/60 text-[10px] font-bold uppercase tracking-[2px] mt-2">Connecting to Video Server...</Text>
                        <ActivityIndicator color="#F59E0B" size="small" style={{ marginTop: 20 }} />
                     </View>
                   )}
                 </View>
              ) : (
                <View className="flex-1 items-center justify-center bg-black">
                   <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#EF4444" />
                   <Text className="text-white font-black mt-4">Invalid Stream Source</Text>
                </View>
              )}
            </View>
          </View>

          </TouchableOpacity>
        </View>
      );
    }

  const insets = useSafeAreaInsets();

  return (
    <View className={`flex-1 ${colors.background}`}>
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-5xl font-black ${colors.text} tracking-tighter`}>Live</Text>
            <Text className="text-2xl font-bold text-brand-pink tracking-tight">Monitoring 📹</Text>
          </View>
          <View className="flex-row items-center gap-3">
            {isAdmin && (
              <TouchableOpacity 
                onPress={() => openModal()}
                className="bg-brand-pink w-14 h-14 rounded-3xl items-center justify-center shadow-2xl border-4 border-white -rotate-6"
              >
                <MaterialCommunityIcons name="plus" size={28} color="white" />
              </TouchableOpacity>
            )}
            <View className="bg-brand-yellow w-16 h-16 rounded-3xl items-center justify-center shadow-2xl border-4 border-white -rotate-6">
              <MaterialCommunityIcons name="video" size={32} color="#92400E" />
            </View>
          </View>
        </View>
        <View className="mt-4">
          <BranchFilter selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
        </View>
      </View>

      <View className="flex-1 px-6">
        <View className="flex-row items-center justify-between mb-6 mt-4">
            <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary}`}>Camera Infrastructure</Text>
            {isAdmin && (
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity 
                        onPress={async () => {
                            try {
                                setIsActionLoading(true);
                                await api.post('/cameras/refresh');
                                await fetchCameras();
                                Alert.alert('Success', 'Camera streams refreshed successfully');
                            } catch (error) {
                                console.error('Refresh failed:', error);
                                Alert.alert('Error', 'Failed to refresh camera streams');
                            } finally {
                                setIsActionLoading(false);
                            }
                        }}
                        className={`p-3 rounded-2xl border ${colors.border} ${theme === 'dark' ? 'bg-white/5' : 'bg-white shadow-sm'}`}
                    >
                        <MaterialCommunityIcons name="refresh" size={24} color="#F59E0B" />
                    </TouchableOpacity>
                </View>
            )}
        </View>

        {isLoading ? (
            <ActivityIndicator color="#F59E0B" size="large" style={{ marginTop: 40 }} />
        ) : !isAccessible ? (
            <ScrollView 
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#F59E0B']} />}
                contentContainerStyle={{ flex: 1, justifyContent: 'center' }}
            >
                <View className="items-center justify-center p-8">
                    <View className="w-full bg-white dark:bg-white/5 p-10 rounded-[50px] items-center border border-brand-pink/20 shadow-2xl">
                        <View className="bg-brand-pink/10 w-32 h-32 rounded-full items-center justify-center mb-8 border-4 border-white dark:border-white/5">
                            <MaterialCommunityIcons name="shield-lock-outline" size={64} color="#F59E0B" />
                        </View>
                        <Text className={`text-4xl font-black ${colors.text} text-center tracking-tighter mb-4`}>Access Restricted</Text>
                        <Text className={`text-center font-bold leading-7 ${colors.textSecondary} mb-10`}>
                            {attendanceError || "To ensure the safety of all children, camera access is only permitted while your child is actively present inside the school premises."}
                        </Text>
                        
                        <View className="w-full bg-brand-yellow/10 p-6 rounded-3xl border border-brand-yellow/20 flex-row items-center mb-10">
                            <MaterialCommunityIcons name="information-outline" size={24} color="#D97706" />
                            <Text className="flex-1 ml-4 text-[11px] font-black text-brand-yellow-800 uppercase tracking-widest leading-4">
                                Access window: Between Clock-In and Clock-Out protocol execution.
                            </Text>
                        </View>

                        <TouchableOpacity 
                            onPress={() => fetchCameras()}
                            className="bg-brand-pink w-full h-18 rounded-3xl items-center justify-center shadow-lg shadow-pink-200"
                        >
                            <Text className="text-white font-black uppercase tracking-[3px] text-xs">Verify Status Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        ) : (
            <FlatList
                data={cameras}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#F59E0B']} tintColor="#F59E0B" />}
                ListFooterComponent={<View className="h-32" />}
                renderItem={({ item }) => (
                    <CameraCard 
                        camera={item} 
                        colors={colors} 
                        theme={theme} 
                        isAdmin={isAdmin}
                        branches={branches}
                        onSelect={handleCameraSelect}
                        onEdit={openModal}
                        onDelete={handleDeleteCamera}
                    />
                )}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <MaterialCommunityIcons name="video-off-outline" size={60} color={colors.textTertiary} />
                        <Text className={`mt-4 ${colors.textTertiary} font-bold text-lg`}>No cameras configured</Text>
                    </View>
                }
            />
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center px-8">
            <View className={`${colors.surface} rounded-[48px] border ${colors.border} overflow-hidden shadow-2xl shadow-black`}>
                <ScrollView 
                    contentContainerStyle={{ padding: 32 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-row justify-between items-center mb-8">
                        <View>
                            <Text className={`text-3xl font-black ${colors.text} tracking-tighter`}>{editingCamera ? 'Update' : 'Register'}</Text>
                            <Text className="text-xl font-bold text-brand-pink mt-[-4px]">Live Feed 🔭</Text>
                        </View>
                        <TouchableOpacity onPress={() => setModalVisible(false)} className={`w-12 h-12 rounded-2xl items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'} border border-white/5`}>
                            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View className="mb-6">
                        <Text className={`text-[10px] font-black mb-3 uppercase tracking-[3px] ${colors.textTertiary}`}>Room Name</Text>
                        <TextInput 
                            className={`p-5 rounded-[24px] border ${colors.border} ${colors.text} font-bold bg-gray-50/50 dark:bg-black/20`}
                            placeholder="e.g. Activity Room"
                            placeholderTextColor="#9CA3AF"
                            value={formData.name}
                            onChangeText={(text) => setFormData({...formData, name: text})}
                        />
                    </View>

                    <View className="mb-6">
                        <Text className={`text-[10px] font-black mb-3 uppercase tracking-[3px] ${colors.textTertiary}`}>Streaming URL</Text>
                        <TextInput 
                            className={`p-5 rounded-[24px] border ${colors.border} ${colors.text} font-bold bg-gray-50/50 dark:bg-black/20`}
                            placeholder="M3U8, Twitch or YouTube Live URL"
                            placeholderTextColor="#9CA3AF"
                            value={formData.url}
                            onChangeText={(text) => setFormData({...formData, url: text})}
                        />
                    </View>

                    {user?.role === 'master_admin' && (
                      <View className="mb-6">
                        <Text className={`text-[10px] font-black mb-3 uppercase tracking-[3px] ${colors.textTertiary}`}>Assigned Branch</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {branches.map((branch: any) => (
                            <TouchableOpacity
                              key={branch.id}
                              onPress={() => setFormData({...formData, branch_id: branch.id})}
                              className={`px-5 py-3 rounded-full mr-2 ${formData.branch_id === branch.id ? 'bg-brand-pink' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}
                            >
                              <Text className={`text-xs font-bold ${formData.branch_id === branch.id ? 'text-white' : colors.text}`}>{branch.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    <View className="mb-10">
                        <Text className={`text-[10px] font-black mb-5 uppercase tracking-[3px] ${colors.textTertiary}`}>Channel State</Text>
                        <View className="flex-row bg-gray-50/50 dark:bg-black/30 p-2 rounded-[28px] border border-gray-100 dark:border-white/10">
                            {['online', 'offline'].map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    onPress={() => setFormData({...formData, status: s as any})}
                                    className={`flex-1 py-4 rounded-[20px] items-center ${formData.status === s ? 'bg-brand-pink' : ''}`}
                                >
                                    <Text className={`font-black uppercase text-[10px] tracking-[2px] ${formData.status === s ? 'text-white' : colors.textTertiary}`}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity 
                        onPress={handleSaveCamera}
                        disabled={isActionLoading}
                        className="h-20 rounded-[32px] items-center justify-center shadow-2xl shadow-pink-500/30 relative overflow-hidden"
                    >
                        <LinearGradient
                            colors={['#F59E0B', '#DB2777']}
                            className="absolute inset-0"
                        />
                        {isActionLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="cloud-upload-outline" size={24} color="white" />
                                <Text className="text-white font-black tracking-[4px] uppercase ml-3 text-sm">Save Config</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
      </Modal>

      {isActionLoading && (
          <View className="absolute inset-0 bg-black/20 items-center justify-center z-[100]">
              <ActivityIndicator size="large" color="#F59E0B" />
          </View>
      )}
    </View>
  );
}
