import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, TextInput, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api, { getMediaUrl } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'react-native';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

export default function TuitionStudyMaterialsScreen({ navigation }: Props) {
  const { user, fetchData } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isTeacher = user?.role === 'tuition_teacher';
  const [refreshing, setRefreshing] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<number[]>([]);
  const [showBatchPicker, setShowBatchPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  const loadMaterials = useCallback(async () => {
    try {
      const res = await api.get('/study-materials');
      const d = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      if (isTeacher) {
        setMaterials(d.filter((m: any) => m.created_by === user?.id));
      } else {
        const myBatchId = (user as any)?.batch_id;
        setMaterials(myBatchId ? d.filter((m: any) => m.batches?.some((b: any) => b.id === myBatchId || b === myBatchId)) : d);
      }
    } catch { setMaterials([]); }
  }, [user, isTeacher]);

  const loadBatches = useCallback(async () => {
    try {
      const res = await api.get('/batches');
      const d = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setBatches(d);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadMaterials(), loadBatches()]);
      setLoading(false);
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    await loadMaterials();
    setRefreshing(false);
  }, [fetchData, loadMaterials]);

  const pickFile = useCallback(async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'], multiple: true, copyToCacheDirectory: true });
    if (!r.canceled && r.assets) setFiles(prev => [...prev, ...r.assets.map(a => ({ uri: a.uri, name: a.name || `file_${Date.now()}`, type: a.mimeType || 'application/octet-stream', size: a.size || 0 }))]);
  }, []);
  const removeFile = useCallback((idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx)), []);

  const handleCreate = useCallback(async () => {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a title.'); return; }
    if (files.length === 0) { Alert.alert('Required', 'Please attach at least one file.'); return; }
    if (selectedBatches.length === 0) { Alert.alert('Required', 'Please select at least one class.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      fd.append('created_by', String(user?.id));
      selectedBatches.forEach(b => fd.append('batch_ids[]', String(b)));
      files.forEach(f => fd.append('files[]', { uri: f.uri, name: f.name, type: f.type } as any));
      await api.post('/study-materials', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await loadMaterials();
      setTitle('');
      setDescription('');
      setFiles([]);
      setSelectedBatches([]);
      setShowForm(false);
      setActiveTab('list');
      Alert.alert('Success', 'Study material created.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create.');
    }
    setSubmitting(false);
  }, [title, description, files, selectedBatches, user]);

  const handleDelete = useCallback((id: number) => {
    Alert.alert('Delete', 'Delete this study material?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/study-materials/${id}`);
          await loadMaterials();
        } catch { Alert.alert('Error', 'Failed to delete.'); }
      }},
    ]);
  }, [loadMaterials]);

  const formatSize = (b: number) => { if (b < 1024) return `${b}B`; if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`; return `${(b / 1048576).toFixed(1)}MB`; };

  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) return 'file-image';
    if (type?.includes('pdf')) return 'file-pdf-box';
    if (type?.includes('word') || type?.includes('document')) return 'file-word';
    if (type?.includes('presentation') || type?.includes('powerpoint')) return 'file-powerpoint';
    return 'file';
  };

  const getFileColor = (type: string) => {
    if (type?.startsWith('image/')) return '#8B5CF6';
    if (type?.includes('pdf')) return '#EF4444';
    if (type?.includes('word')) return '#3B82F6';
    if (type?.includes('powerpoint')) return '#F97316';
    return '#6B7280';
  };

  const toggleBatch = (id: number) => {
    setSelectedBatches(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#6B7280' : '#9CA3AF' }}>
            {isTeacher ? 'Tuition Teacher' : 'Tuition Student'}
          </Text>
          <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 2, color: isDark ? '#FFFFFF' : '#111827' }}>
            Study Materials
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 4 }}>
            {materials.length} material{materials.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={{ backgroundColor: '#F59E0B', width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="book-open-variant" size={32} color="white" />
        </View>
      </View>
    </View>
  );

  const renderBatchPicker = () => (
    <Modal transparent visible={showBatchPicker} onRequestClose={() => setShowBatchPicker(false)} animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowBatchPicker(false)} />
        <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%', paddingBottom: 40 }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>Select Classes</Text>
            <TouchableOpacity onPress={() => setShowBatchPicker(false)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
            {batches.map((b: any) => {
              const sel = selectedBatches.includes(b.id);
              return (
                <TouchableOpacity key={b.id} onPress={() => toggleBatch(b.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#2a2a28' : '#F3F4F6' }}>
                  <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: sel ? '#F59E0B' : (isDark ? '#6B7280' : '#D1D5DB'), backgroundColor: sel ? '#F59E0B' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {sel && <MaterialCommunityIcons name="check" size={16} color="white" />}
                  </View>
                  <View style={{ marginLeft: 14 }}>
                    <Text style={{ fontWeight: '800', fontSize: 15, color: isDark ? '#FFF' : '#111' }}>{b.name}</Text>
                    <Text style={{ fontWeight: '500', fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF' }}>{b.students_count || 0} students</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {batches.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <MaterialCommunityIcons name="alert-circle-outline" size={32} color={isDark ? '#6B7280' : '#9CA3AF'} />
                <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: '600', marginTop: 8 }}>No classes available</Text>
              </View>
            )}
          </ScrollView>
          <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
            <TouchableOpacity onPress={() => setShowBatchPicker(false)}
              style={{ backgroundColor: '#F59E0B', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Done ({selectedBatches.length} selected)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCreateForm = () => (
    <View style={{ paddingHorizontal: 24 }}>
      <View style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111', marginBottom: 16 }}>New Study Material</Text>

        <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Chapter 5 - Algebra Notes" placeholderTextColor="#9CA3AF"
          style={{ backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.04)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontWeight: '600', fontSize: 14, color: isDark ? '#D1D5DB' : '#374151', borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.15)', marginBottom: 14 }} />

        <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Description (optional)</Text>
        <TextInput value={description} onChangeText={setDescription} placeholder="Brief description of the material" placeholderTextColor="#9CA3AF" multiline numberOfLines={3} textAlignVertical="top"
          style={{ backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.04)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontWeight: '600', fontSize: 14, color: isDark ? '#D1D5DB' : '#374151', borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.15)', marginBottom: 14, minHeight: 80 }} />

        <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Assign to Classes</Text>
        <TouchableOpacity onPress={() => setShowBatchPicker(true)}
          style={{ backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.04)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.15)', flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <MaterialCommunityIcons name="google-classroom" size={18} color="#F59E0B" />
          <Text style={{ flex: 1, fontWeight: '600', fontSize: 14, color: selectedBatches.length > 0 ? (isDark ? '#D1D5DB' : '#374151') : '#9CA3AF', marginLeft: 10 }}>
            {selectedBatches.length > 0 ? `${selectedBatches.length} class${selectedBatches.length > 1 ? 'es' : ''} selected` : 'Select classes'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
        </TouchableOpacity>

        <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Files</Text>
        {files.map((f, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.04)', borderRadius: 12, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.1)' }}>
            <MaterialCommunityIcons name={getFileIcon(f.type)} size={18} color={getFileColor(f.type)} />
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: isDark ? '#D1D5DB' : '#374151', marginLeft: 8 }} numberOfLines={1}>{f.name}</Text>
            <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', marginRight: 8 }}>{formatSize(f.size)}</Text>
            <TouchableOpacity onPress={() => removeFile(i)}><MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" /></TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={pickFile}
          style={{ backgroundColor: isDark ? '#1e1e1c' : 'rgba(139,92,246,0.06)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(139,92,246,0.15)', borderStyle: 'dashed', marginBottom: 20 }}>
          <MaterialCommunityIcons name="file-plus" size={20} color="#8B5CF6" />
          <Text style={{ color: '#8B5CF6', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Add PDFs, Docs, Images...</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleCreate} disabled={submitting}
          style={{ backgroundColor: submitting ? '#D1D5DB' : '#F59E0B', paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
          {submitting ? <ActivityIndicator color="white" /> : <><MaterialCommunityIcons name="upload" size={20} color="white" /><Text style={{ color: 'white', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>Create Study Material</Text></>}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMaterialCard = (m: any) => (
    <TouchableOpacity key={m.id} activeOpacity={0.9}
      style={{ backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6', borderLeftWidth: 5, borderLeftColor: '#F59E0B' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="book-open-variant" size={22} color="#D97706" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontWeight: '900', fontSize: 16, color: isDark ? '#FFF' : '#111' }}>{m.title}</Text>
            {isTeacher && (
              <TouchableOpacity onPress={() => handleDelete(m.id)} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="delete" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
          {m.description ? <Text style={{ fontSize: 12, fontWeight: '500', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 4, lineHeight: 18 }}>{m.description}</Text> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12, flexWrap: 'wrap' }}>
            {m.batches?.map((b: any) => (
              <View key={b.id || b} style={{ backgroundColor: 'rgba(139,92,246,0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '800' }}>{b.name || `Class #${b}`}</Text>
              </View>
            ))}
          </View>
          {m.files && m.files.length > 0 && (
            <View style={{ marginTop: 10, gap: 6 }}>
              {m.files.map((f: any, idx: number) => (
                <TouchableOpacity key={idx}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.04)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.1)' }}>
                  <MaterialCommunityIcons name={getFileIcon(f.mime_type || f.type)} size={16} color={getFileColor(f.mime_type || f.type)} />
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: isDark ? '#D1D5DB' : '#374151', marginLeft: 8 }} numberOfLines={1}>{f.file_name || f.name || `File ${idx + 1}`}</Text>
                  {f.file_size ? <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', marginRight: 8 }}>{formatSize(f.file_size)}</Text> : null}
                  <MaterialCommunityIcons name="download" size={16} color="#F59E0B" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <MaterialCommunityIcons name="calendar" size={12} color={isDark ? '#6B7280' : '#9CA3AF'} />
            <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginLeft: 4 }}>
              {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recently'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFF8F0' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#F59E0B" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}>
        {renderHeader()}

        {isTeacher && (
          <View style={{ flexDirection: 'row', marginHorizontal: 24, marginBottom: 16, backgroundColor: isDark ? '#2a2a28' : '#F3F4F6', borderRadius: 14, padding: 4 }}>
            {['list', 'create'].map(tab => (
              <TouchableOpacity key={tab} onPress={() => { setActiveTab(tab as any); setShowForm(tab === 'create'); }}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: activeTab === tab ? (isDark ? '#3a3a38' : '#FFFFFF') : 'transparent', alignItems: 'center' }}>
                <Text style={{ fontWeight: '800', fontSize: 13, color: activeTab === tab ? (isDark ? '#FFF' : '#111') : (isDark ? '#6B7280' : '#9CA3AF') }}>
                  {tab === 'list' ? 'My Materials' : 'Create New'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!isTeacher && materials.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 60, marginHorizontal: 24, backgroundColor: isDark ? '#2a2a28' : '#F9FAFB', borderRadius: 24, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
            <MaterialCommunityIcons name="book-off" size={56} color={isDark ? '#4B5563' : '#9CA3AF'} />
            <Text style={{ fontWeight: '700', fontSize: 15, color: isDark ? '#D1D5DB' : '#6B7280', marginTop: 16 }}>No study materials yet</Text>
            <Text style={{ fontWeight: '500', fontSize: 12, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 6 }}>Your teacher hasn't shared any materials</Text>
          </View>
        )}

        {activeTab === 'create' && isTeacher && renderCreateForm()}
        {activeTab === 'list' && (
          <View style={{ paddingHorizontal: 24 }}>
            {materials.length === 0 && isTeacher && (
              <TouchableOpacity onPress={() => { setActiveTab('create'); setShowForm(true); }}
                style={{ alignItems: 'center', paddingVertical: 40, backgroundColor: isDark ? '#2a2a28' : '#FFFBEB', borderRadius: 24, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#FDE68A', borderStyle: 'dashed' }}>
                <MaterialCommunityIcons name="book-plus" size={48} color="#F59E0B" />
                <Text style={{ fontWeight: '800', fontSize: 16, color: isDark ? '#D1D5DB' : '#92400E', marginTop: 12 }}>Create your first material</Text>
                <Text style={{ fontWeight: '500', fontSize: 12, color: isDark ? '#6B7280' : '#B45309', marginTop: 4 }}>Upload PDFs, docs, and images for your classes</Text>
              </TouchableOpacity>
            )}
            {materials.map(renderMaterialCard)}
          </View>
        )}

        <View style={{ height: 128 }} />
      </ScrollView>
      {renderBatchPicker()}
    </SafeAreaView>
  );
}
