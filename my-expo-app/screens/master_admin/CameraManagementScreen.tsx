import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import PremiumPopup from '../../components/PremiumPopup';
import api from '../../services/api';
import BranchFilter from '../../components/BranchFilter';

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

export default function CameraManagementScreen({ navigation }: Props) {
  const { user, branches } = useAuth();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
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
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFF8F0' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: isDark ? '#2d2d24' : '#FFFFFF', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={isDark ? '#FFF' : '#374151'} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', flex: 1, marginLeft: 12, color: isDark ? '#FFFFFF' : '#111827', letterSpacing: -0.5 }}>Cameras</Text>
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
            style={{ backgroundColor: '#F59E0B', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
          >
            <MaterialCommunityIcons name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        {cameras.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 100 }}>
            <View style={{ width: 100, height: 80, borderRadius: 12, backgroundColor: isDark ? '#2d2d24' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: isDark ? '#333' : '#E5E7EB', marginBottom: 20 }}>
              <MaterialCommunityIcons name="camera-off" size={36} color={isDark ? '#6B7280' : '#9CA3AF'} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827' }}>No Cameras</Text>
            <Text style={{ fontSize: 13, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 6, textAlign: 'center' }}>Tap + to add a camera stream</Text>
          </View>
        ) : (
          cameras.map((camera) => (
            <TouchableOpacity key={camera.id} activeOpacity={0.9}
              onPress={() => navigation.navigate('liveCamera', { cameraId: camera.id, cameraName: camera.name, cameraUrl: camera.url })}>
              <View style={{ marginBottom: 24 }}>
              {/* TV Frame Container */}
              <View style={{
                backgroundColor: isDark ? '#1a1a1a' : '#1a1a1a',
                borderRadius: 16,
                padding: 8,
                borderWidth: 3,
                borderColor: camera.status === 'online' ? '#F59E0B' : (isDark ? '#333' : '#555'),
                elevation: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              }}>
                {/* Screen Area */}
                <View style={{
                  backgroundColor: isDark ? '#0d0d0d' : '#111',
                  borderRadius: 10,
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
                  paddingHorizontal: 4,
                  paddingTop: 8,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: '#999', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {camera.name}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleEdit(camera)} style={{ backgroundColor: '#333', width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="pencil" size={14} color="#F59E0B" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(camera.id)} style={{ backgroundColor: '#333', width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="delete-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* TV Stand / Legs */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 60, marginTop: 6 }}>
                  <View style={{ width: 12, height: 10, backgroundColor: isDark ? '#2a2a2a' : '#2a2a2a', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
                  <View style={{ width: 12, height: 10, backgroundColor: isDark ? '#2a2a2a' : '#2a2a2a', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
                </View>
              </View>

              {/* Status bar below TV */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: camera.status === 'online' ? '#22C55E' : '#EF4444', marginRight: 6 }} />
                  <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {camera.status === 'online' ? 'Live' : 'Offline'}
                  </Text>
                </View>
                {camera.branch && (
                  <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF' }}>{camera.branch.name}</Text>
                )}
              </View>
            </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 120 }} />
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
        <View className="px-4 mb-4">
          <TextInput
            className={`${isDark ? 'bg-[#1c1c14] text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl px-5 py-4 text-base font-bold border ${isDark ? 'border-[#3e3e34]' : 'border-gray-200'} mb-4`}
            placeholder="Camera Name"
            placeholderTextColor={isDark ? '#555' : '#A0AEC0'}
            value={cameraName}
            onChangeText={setCameraName}
          />
          <TextInput
            className={`${isDark ? 'bg-[#1c1c14] text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl px-5 py-4 text-base font-bold border ${isDark ? 'border-[#3e3e34]' : 'border-gray-200'} mb-4`}
            placeholder="Camera URL/Stream URL"
            placeholderTextColor={isDark ? '#555' : '#A0AEC0'}
            value={cameraUrl}
            onChangeText={setCameraUrl}
          />
          {user?.role === 'master_admin' && (
            <View className="mb-4">
              <Text className={`text-xs font-bold mb-2 ${selectedBranchId ? 'text-brand-pink' : 'text-red-500'}`}>
                {selectedBranchId ? 'Assigned Branch' : '* Branch selection required'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {branches.map((branch) => (
                  <TouchableOpacity
                    key={branch.id}
                    onPress={() => setSelectedBranchId(branch.id)}
                    className={`px-4 py-2 rounded-full mr-2 ${selectedBranchId === branch.id ? 'bg-brand-pink' : isDark ? 'bg-[#1c1c14]' : 'bg-gray-100'}`}
                  >
                    <Text className={`text-xs font-bold ${selectedBranchId === branch.id ? 'text-white' : colors.text}`}>{branch.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {!selectedBranchId && (
                <Text className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1 ml-1">Tap a branch above to assign</Text>
              )}
            </View>
          )}
        </View>
      </PremiumPopup>

      {/* ── Navigate to legacy live monitor screen ── */}
    </View>
  );
}
