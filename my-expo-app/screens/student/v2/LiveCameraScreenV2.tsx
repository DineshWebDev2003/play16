import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Modal, TextInput, ActivityIndicator, FlatList, StatusBar, RefreshControl, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Video, ResizeMode, Audio } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import GlassDropdown from '../../admin/v2/GlassDropdown';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;

const CCTV_ICON = require('../../../assets/icons/cctv-camera.png');

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

interface Camera {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
  icon?: string;
  branch_id?: string;
}

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}
interface Props { navigation: NavigationProps; route?: any; }

const CameraCard = memo(({ camera, onSelect, onEdit, onDelete, isAdmin, branches }: any) => {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showVideoFallback, setShowVideoFallback] = useState(false);
  const branchName = camera.branch_id ? branches?.find((b: any) => b.id?.toString() === camera.branch_id?.toString())?.name : '';

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
      style={{ marginBottom: 20 }}
    >
      {/* Glass container */}
      <View style={{
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: BORDER_RADIUS,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        padding: 12,
      }}>
        {/* Screen Area */}
        <View style={{
          backgroundColor: '#0f1512',
          borderRadius: 16, overflow: 'hidden',
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
                  source={{ uri: camera.url, overrideFileExtension: 'm3u8' } as any}
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
              <MaterialCommunityIcons name="video-off-outline" size={36} color="#3A4A42" />
              <Text style={{ color: '#6B7B73', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 6 }}>Camera Offline</Text>
            </View>
          )}

          {/* Power LED */}
          <View style={{
            position: 'absolute', top: 10, right: 10,
            width: 10, height: 10, borderRadius: 5,
            backgroundColor: camera.status === 'online' ? '#22C55E' : '#EF4444',
            borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
          }} />

          {/* LIVE badge */}
          {camera.status === 'online' && (
            <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(239,68,68,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', marginRight: 5 }} />
              <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>Live</Text>
            </View>
          )}
        </View>

        {/* Info bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingTop: 12 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY }} numberOfLines={1}>{camera.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: camera.status === 'online' ? '#22C55E' : '#EF4444', marginRight: 6 }} />
              <Text style={{ fontSize: 9, fontWeight: '900', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1 }}>
                {camera.status === 'online' ? 'Live Stream' : 'Offline'}
              </Text>
              {!!branchName && (
                <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, marginLeft: 8 }}>
                  <Text style={{ color: '#D97706', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{branchName}</Text>
                </View>
              )}
            </View>
          </View>
          {isAdmin && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => onEdit(camera)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="pencil" size={16} color="#D97706" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(camera.id)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="delete-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function LiveCameraScreenV2({ navigation, route }: Props) {
  const { user, branches } = useAuth();
  const insets = useSafeAreaInsets();
  const isAdmin = user?.role === 'admin' || user?.role === 'master_admin';
  const isMasterAdmin = user?.role === 'master_admin';

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
  const hasInteracted = React.useRef(false);

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

  const resetTimer = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setControlsVisible(true);
    controlsTimer.current = setTimeout(() => {
      setControlsVisible(false);
      setShowMenu(false);
    }, 3000);
  }, []);

  const handleScreenTap = useCallback(() => {
    hasInteracted.current = true;
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setControlsVisible((v) => !v);
  }, []);

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

  const getTwitchEmbedUrl = (url: string) => {
    let channel = '';
    if (url.includes('channel=')) {
      const match = url.match(/[?&]channel=([a-zA-Z0-9_]+)/i);
      if (match) channel = match[1];
    }
    if (!channel && url.includes('twitch.tv/')) {
      if (!url.includes('player.twitch.tv')) {
        const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
        if (match) channel = match[1];
      }
    }
    if (!channel) {
      const segments = url.split('/');
      const lastSegment = segments[segments.length - 1];
      channel = lastSegment.split(/[?#]/)[0];
    }
    const domains = ['play1.tnhappykids.in', 'localhost', '127.0.0.1'];
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
    const isTwitchStream = camera.url.toLowerCase().includes('twitch.tv');
    setIsTwitch(isTwitchStream);
    const isYoutubeStream = camera.url.toLowerCase().includes('youtube.com') || camera.url.toLowerCase().includes('youtu.be');
    setIsYoutube(isYoutubeStream);
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
    const isRotated = rotation === 90;
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar hidden={true} />
        <TouchableOpacity activeOpacity={1} onPress={handleScreenTap} style={{ flex: 1 }}>
          {/* Streaming surface */}
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <View style={{ flex: 1, transform: [{ rotate: `${rotation}deg` }] }}>
              {isTwitch ? (
                <WebView
                  source={{ uri: getTwitchEmbedUrl(selectedCamera.url), headers: { 'Referer': 'https://play1.tnhappykids.in' } }}
                  style={{ flex: 1, backgroundColor: 'black' }}
                  pointerEvents="none"
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsFullscreenVideo={true}
                  mediaPlaybackRequiresUserAction={false}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0a1a' }]}>
                      <MaterialCommunityIcons name="twitch" size={80} color="#9146FF" />
                      <Text style={{ color: '#9146FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 5, marginTop: 24 }}>Twitch Loading</Text>
                      <Text style={{ color: 'rgba(145,70,255,0.6)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 }}>Connecting to Secure Feed...</Text>
                    </View>
                  )}
                  onLoadEnd={() => setIsStreamReady(true)}
                  onHttpError={(syntheticEvent) => { console.warn('WebView HTTP error: ', syntheticEvent.nativeEvent); }}
                  onError={(syntheticEvent) => { console.warn('WebView error: ', syntheticEvent.nativeEvent); }}
                />
              ) : isYoutube ? (
                <WebView
                  source={{ uri: getYoutubeEmbedUrl(selectedCamera.url), headers: { 'Referer': 'https://play1.tnhappykids.in' } }}
                  style={{ flex: 1, backgroundColor: 'black' }}
                  pointerEvents="none"
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsFullscreenVideo={true}
                  mediaPlaybackRequiresUserAction={false}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#160606' }]}>
                      <MaterialCommunityIcons name="youtube" size={80} color="#FF0000" />
                      <Text style={{ color: '#FF0000', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 5, marginTop: 24 }}>YouTube Live</Text>
                      <Text style={{ color: 'rgba(255,0,0,0.6)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 }}>Establishing Stream...</Text>
                    </View>
                  )}
                  onLoadEnd={() => setIsStreamReady(true)}
                />
              ) : isM3U8 ? (
                <View style={{ flex: 1 }}>
                  <Video
                    key={selectedCamera.url}
                    source={{ uri: selectedCamera.url, overrideFileExtension: 'm3u8' } as any}
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
                    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }]}>
                      <MaterialCommunityIcons name="video" size={80} color="#F59E0B" />
                      <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 5, marginTop: 24 }}>Secure Feed</Text>
                      <Text style={{ color: 'rgba(245,158,11,0.6)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 }}>Connecting to Video Server...</Text>
                      <ActivityIndicator color="#F59E0B" size="small" style={{ marginTop: 20 }} />
                    </View>
                  )}
                </View>
              ) : (
                <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#EF4444" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', marginTop: 16, fontSize: 16 }}>Invalid Stream Source</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Glass control overlay ── */}
          {controlsVisible ? (
            <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              {/* Top scrim for readability */}
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.28)' }]} />

              {/* Top bar — frosted glass */}
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 44 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(31,45,40,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 22, padding: 8 }}>
                  <TouchableOpacity onPress={() => closeViewer()} style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 }} numberOfLines={1}>{selectedCamera.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' }} />
                      <Text style={{ color: '#22C55E', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 }}>Live</Text>
                      <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 8 }} />
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>{isRotated ? 'Landscape' : 'Portrait'}</Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => closeViewer()} style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(239,68,68,0.75)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom control dock — floating frosted glass */}
              <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(31,45,40,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 28, paddingVertical: 12, paddingHorizontal: 20 }}>
                  <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: isMuted ? 'rgba(255,255,255,0.14)' : 'rgba(16,185,129,0.85)', borderWidth: 1, borderColor: isMuted ? 'rgba(255,255,255,0.25)' : 'rgba(16,185,129,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name={isMuted ? 'volume-off' : 'volume-high'} size={26} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setRotation(rotation === 0 ? 90 : 0)} style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: isRotated ? 'rgba(245,158,11,0.95)' : 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: isRotated ? 'rgba(245,158,11,0.8)' : 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name={isRotated ? 'phone-rotate-portrait' : 'phone-rotate-landscape'} size={26} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                  <TouchableOpacity onPress={() => closeViewer()} style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(239,68,68,0.8)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="fullscreen-exit" size={26} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    );
  }

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

      <View style={{ flex: 1 }}>
        <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20, paddingBottom: 8 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>TN HAPPYKIDS</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Live</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 6 }} />
                <Text style={{ color: '#EF4444', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>Monitoring</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openModal()}
              style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Image source={CCTV_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          {(isMasterAdmin || isAdmin) && (
            <View style={{ marginTop: 20 }}>
              <GlassDropdown selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: TEXT_MUTED }}>Camera Infrastructure</Text>
            {isAdmin && (
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
                style={{ padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}
              >
                <MaterialCommunityIcons name="refresh" size={22} color="#F59E0B" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          {isLoading ? (
            <ActivityIndicator color="#F59E0B" size="large" style={{ marginTop: 40 }} />
          ) : !isAccessible ? (
            <ScrollView
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#F59E0B']} />}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 4 }}
            >
              <View className="items-center justify-center">
                <View style={{ width: '100%', borderRadius: 24, overflow: 'hidden', elevation: 15 }}>
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 24 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="shield-lock-outline" size={36} color="white" />
                      </View>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FCA5A5', marginRight: 6 }} />
                        <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>Restricted</Text>
                      </View>
                    </View>
                    <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', letterSpacing: -1 }}>Access Restricted</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', lineHeight: 20, marginTop: 10 }}>
                      {attendanceError || "To ensure the safety of all children, camera access is only permitted while your child is actively present inside the school premises."}
                    </Text>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: 16, borderRadius: 16, marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="information-outline" size={24} color="white" />
                      <Text style={{ flex: 1, marginLeft: 12, color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, lineHeight: 16 }}>
                        Access window: Between Clock-In and Clock-Out protocol execution.
                      </Text>
                    </View>
                    <View style={{ position: 'absolute', bottom: -16, right: -16, opacity: 0.1 }}>
                      <MaterialCommunityIcons name="cctv" size={110} color="white" />
                    </View>
                  </LinearGradient>
                </View>

                <TouchableOpacity
                  onPress={() => fetchCameras()}
                  activeOpacity={0.9}
                  style={{ width: '100%', borderRadius: 18, overflow: 'hidden', marginTop: 20, elevation: 8 }}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  >
                    <MaterialCommunityIcons name="refresh" size={18} color="white" />
                    <Text style={{ color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 11, marginLeft: 8 }}>Verify Status Again</Text>
                  </LinearGradient>
                </TouchableOpacity>
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
                  isAdmin={isAdmin}
                  branches={branches}
                  onSelect={handleCameraSelect}
                  onEdit={openModal}
                  onDelete={handleDeleteCamera}
                />
              )}
              ListEmptyComponent={
                <View className="items-center justify-center py-20">
                  <Image source={CCTV_ICON} style={{ width: 64, height: 64, opacity: 0.3 }} resizeMode="contain" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_MUTED, marginTop: 12 }}>No cameras configured</Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      {/* Camera form modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(31,45,40,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', overflow: 'hidden' }}>
            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={CCTV_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY }}>{editingCamera ? 'Update Feed' : 'Register Feed'}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>Live Camera Configuration</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(247,249,246,0.95)', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="close" size={22} color={TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 24 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED }}>Room Name</Text>
                <TextInput
                  style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY }}
                  placeholder="e.g. Activity Room"
                  placeholderTextColor="#9CA3AF"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED }}>Streaming URL</Text>
                <TextInput
                  style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY }}
                  placeholder="M3U8, Twitch or YouTube Live URL"
                  placeholderTextColor="#9CA3AF"
                  value={formData.url}
                  onChangeText={(text) => setFormData({ ...formData, url: text })}
                />
              </View>

              {isMasterAdmin && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED }}>Assigned Branch</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {branches.map((branch: any) => (
                      <TouchableOpacity
                        key={branch.id}
                        onPress={() => setFormData({ ...formData, branch_id: branch.id })}
                        style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100, marginRight: 8, backgroundColor: formData.branch_id === branch.id ? 'rgba(245,158,11,0.15)' : 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: formData.branch_id === branch.id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.6)' }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '800', color: formData.branch_id === branch.id ? '#D97706' : TEXT_SECONDARY }}>{branch.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED }}>Channel State</Text>
                <View style={{ flexDirection: 'row', backgroundColor: 'rgba(247,249,246,0.95)', padding: 4, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                  {['online', 'offline'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setFormData({ ...formData, status: s as any })}
                      style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: formData.status === s ? 'rgba(245,158,11,0.15)' : 'transparent' }}
                    >
                      <Text style={{ fontWeight: '900', textTransform: 'uppercase', fontSize: 10, letterSpacing: 2, color: formData.status === s ? '#D97706' : TEXT_MUTED }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSaveCamera}
                disabled={isActionLoading}
                activeOpacity={0.85}
                style={{ marginTop: 24, height: 56, borderRadius: 18, overflow: 'hidden' }}
              >
                <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  {isActionLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="cloud-upload-outline" size={22} color="white" />
                      <Text style={{ color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginLeft: 8, fontSize: 13 }}>Save Config</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {isActionLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(31,45,40,0.2)', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      )}
    </View>
  );
}
