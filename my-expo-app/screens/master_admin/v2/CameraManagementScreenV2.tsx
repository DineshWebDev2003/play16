import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, useWindowDimensions, Image, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import PremiumPopup from '../../../components/PremiumPopup';
import api from '../../../services/api';
import BranchFilter from '../../../components/BranchFilter';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const TEXT_SECONDARY = '#4A5B53';
const BORDER_RADIUS = 28;
const GRID_RADIUS = 22;

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

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

interface Camera {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
  branch_id?: string;
  branch?: { id: string; name: string };
}

export default function CameraManagementScreenV2({ navigation }: Props) {
  const { user, branches } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cameraName, setCameraName] = useState('');
  const [cameraUrl, setCameraUrl] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [branchFilterId, setBranchFilterId] = useState<string | null>(null);

  const fetchCameras = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (branchFilterId) params.append('branch_id', branchFilterId);
      const res = await api.get(`/cameras?${params.toString()}`);
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setCameras(data.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        url: c.url,
        status: c.status || 'offline',
        branch_id: c.branch_id?.toString(),
        branch: c.branch,
      })));
    } catch (e) {
      console.error('Failed to fetch cameras:', e);
    }
  }, [branchFilterId]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCameras();
    setRefreshing(false);
  }, [fetchCameras]);

  const handleSave = async () => {
    if (!cameraName.trim() || !cameraUrl.trim()) {
      Alert.alert('Error', 'Name and URL are required');
      return;
    }
    if (!selectedBranchId) {
      Alert.alert('Error', 'Please select a branch for this camera');
      return;
    }
    try {
      const payload: any = { name: cameraName.trim(), url: cameraUrl.trim(), branch_id: selectedBranchId };
      if (editingCamera) {
        await api.put(`/cameras/${editingCamera.id}`, payload);
      } else {
        await api.post('/cameras', payload);
      }
      setShowAddModal(false);
      setCameraName('');
      setCameraUrl('');
      setSelectedBranchId('');
      setEditingCamera(null);
      await fetchCameras();
    } catch (e) {
      Alert.alert('Error', 'Failed to save camera');
    }
  };

  const handleEdit = (camera: Camera) => {
    setEditingCamera(camera);
    setCameraName(camera.name);
    setCameraUrl(camera.url);
    setSelectedBranchId(camera.branch_id || '');
    setShowAddModal(true);
  };

  const handleDelete = (cameraId: string) => {
    Alert.alert('Delete Camera', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/cameras/${cameraId}`);
            await fetchCameras();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete camera');
          }
        }
      }
    ]);
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

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20 }}>
          {/* ── Compact back-button header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>CCTV · Live Streams</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Cameras</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <BranchFilter selectedBranchId={branchFilterId} onSelect={setBranchFilterId} />
              <TouchableOpacity
                onPress={() => {
                  setEditingCamera(null);
                  setCameraName('');
                  setCameraUrl('');
                  setSelectedBranchId('');
                  setShowAddModal(true);
                }}
                style={{ backgroundColor: '#F59E0B', width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
              >
                <MaterialCommunityIcons name="plus" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 28 }} />

          {cameras.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <View style={{ width: 110, height: 110, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Image source={CCTV_ICON} style={{ width: 90, height: 90, opacity: 0.85 }} resizeMode="contain" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY }}>No Cameras</Text>
              <Text style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, textAlign: 'center' }}>Tap + to add a camera stream</Text>
            </View>
          ) : (
            cameras.map((camera) => (
              <TouchableOpacity key={camera.id} activeOpacity={0.9}
                onPress={() => navigation.navigate('liveCamera', { cameraId: camera.id, cameraName: camera.name, cameraUrl: camera.url })}>
                <View style={{ marginBottom: 24 }}>
                  {/* TV Frame Container */}
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    borderRadius: BORDER_RADIUS,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: camera.status === 'online' ? '#F59E0B' : 'rgba(255,255,255,0.6)',
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                  }}>
                    {/* Screen Area */}
                    <View style={{
                      backgroundColor: '#0d0d0d',
                      borderRadius: 18,
                      overflow: 'hidden',
                      aspectRatio: 16 / 9,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      {camera.status === 'online' ? (
                        <WebView
                          source={{ uri: camera.url }}
                          style={{ width: '100%', height: (screenWidth - 56) * 9 / 16, backgroundColor: '#000' }}
                          javaScriptEnabled
                          domStorageEnabled
                          allowsInlineMediaPlayback
                          mediaPlaybackRequiresUserAction={false}
                          scrollEnabled={false}
                          bounces={false}
                          showsVerticalScrollIndicator={false}
                          showsHorizontalScrollIndicator={false}
                          injectedJavaScript={`
                            setTimeout(() => {
                              document.querySelectorAll('video').forEach(v => {
                                v.muted = true;
                                v.playsInline = true;
                                v.autoplay = true;
                                v.play().catch(() => {});
                              });
                            }, 500);
                            true;
                          `}
                        />
                      ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialCommunityIcons name="video-off-outline" size={36} color="#444" />
                          <Text style={{ color: '#555', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 6 }}>Offline</Text>
                        </View>
                      )}

                      {/* Power LED */}
                      <View style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: camera.status === 'online' ? '#22C55E' : '#EF4444',
                      }} />
                    </View>

                    {/* TV Brand Bar */}
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 6,
                      paddingTop: 12,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                          <Image source={CCTV_ICON} style={{ width: 22, height: 22 }} resizeMode="contain" />
                        </View>
                        <Text numberOfLines={1} style={{ color: TEXT_PRIMARY, fontSize: 12, fontWeight: '700', flex: 1 }}>
                          {camera.name}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity onPress={() => handleEdit(camera)} style={{ backgroundColor: 'rgba(245,158,11,0.12)', width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialCommunityIcons name="pencil" size={14} color="#F59E0B" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(camera.id)} style={{ backgroundColor: 'rgba(239,68,68,0.1)', width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialCommunityIcons name="delete-outline" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* TV Stand / Legs */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 60, marginTop: 10 }}>
                      <View style={{ width: 12, height: 8, backgroundColor: '#2a2a2a', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
                      <View style={{ width: 12, height: 8, backgroundColor: '#2a2a2a', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
                    </View>

                    {/* Status bar below TV */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(247,249,246,0.95)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: camera.status === 'online' ? '#22C55E' : '#EF4444', marginRight: 6 }} />
                        <Text style={{ fontSize: 9, fontWeight: '900', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1 }}>
                          {camera.status === 'online' ? 'Live' : 'Offline'}
                        </Text>
                      </View>
                      {camera.branch && (
                        <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 }}>
                          <Text numberOfLines={1} style={{ fontSize: 9, fontWeight: '900', color: '#D97706' }}>{camera.branch.name}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* ── Bottom spacer 40 ── */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <PremiumPopup
        visible={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingCamera(null); }}
        title={editingCamera ? 'Edit Camera' : 'Add Camera'}
        message=""
        type="action"
        icon="camera-plus"
        buttonText={editingCamera ? 'Update Camera' : 'Add Camera'}
        onButtonPress={handleSave}
      >
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <TextInput
            style={{ backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY, borderWidth: 1, borderColor: 'rgba(226,232,240,0.9)', marginBottom: 16 }}
            placeholder="Camera Name"
            placeholderTextColor="#A0AEC0"
            value={cameraName}
            onChangeText={setCameraName}
          />
          <TextInput
            style={{ backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY, borderWidth: 1, borderColor: 'rgba(226,232,240,0.9)', marginBottom: 16 }}
            placeholder="Camera URL/Stream URL"
            placeholderTextColor="#A0AEC0"
            value={cameraUrl}
            onChangeText={setCameraUrl}
          />
          {user?.role === 'master_admin' && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', marginBottom: 10, color: selectedBranchId ? '#D97706' : '#EF4444' }}>
                {selectedBranchId ? 'Assigned Branch' : '* Branch selection required'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {branches.map((branch) => (
                  <TouchableOpacity
                    key={branch.id}
                    onPress={() => setSelectedBranchId(branch.id)}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginRight: 8, backgroundColor: selectedBranchId === branch.id ? '#F59E0B' : 'rgba(247,249,246,0.9)', borderWidth: 1, borderColor: selectedBranchId === branch.id ? '#F59E0B' : 'rgba(226,232,240,0.9)' }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: selectedBranchId === branch.id ? '#FFFFFF' : TEXT_SECONDARY }}>{branch.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {!selectedBranchId && (
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1, marginTop: 6, marginLeft: 4 }}>Tap a branch above to assign</Text>
              )}
            </View>
          )}
        </View>
      </PremiumPopup>
    </View>
  );
}
