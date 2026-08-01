import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, TextInput, FlatList, Dimensions, Animated as RNAnimated, NativeSyntheticEvent, NativeScrollEvent, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api, { getMediaUrl } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

export default function HomeworkScreen({ navigation }: Props) {
  const { user, fetchData } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitModal, setSubmitModal] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [submitFiles, setSubmitFiles] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new RNAnimated.Value(0)).current;
  const [imgViewIdx, setImgViewIdx] = useState<number>(-1);
  const [imgViewList, setImgViewList] = useState<any[]>([]);
  const [viewItem, setViewItem] = useState<any>(null);

  const loadHomeworks = useCallback(async () => {
    try {
      const res = await api.get('/homework');
      const d = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const myBatchId = (user as any)?.batch_id;
      const myUserId = user?.id;
      setHomeworks(myBatchId || myUserId ? d.filter((h: any) =>
        !h.batch_id && (!h.student_ids || h.student_ids.length === 0) ||
        (myBatchId && h.batch_id === myBatchId) ||
        (myUserId && Array.isArray(h.student_ids) && h.student_ids.includes(myUserId))
      ) : d);
    } catch {}
  }, [user]);

  const loadSubmissions = useCallback(async () => {
    try {
      const all: Record<string, any> = {};
      for (const h of homeworks) {
        try {
          const res = await api.get(`/homework/${h.id}/submissions`);
          const subs: any[] = res.data?.data || (Array.isArray(res.data) ? res.data : []);
          const mine = subs.find((s: any) => s.student_id === user?.id);
          if (mine) all[h.id] = mine;
        } catch {}
      }
      setSubmissions(all);
    } catch {}
  }, [homeworks, user]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadHomeworks();
      setLoading(false);
    })();
  }, []);

  useEffect(() => { if (homeworks.length > 0 && user) loadSubmissions(); }, [homeworks.length > 0]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    await loadHomeworks();
    setRefreshing(false);
  }, [fetchData, loadHomeworks]);

  const onScroll = RNAnimated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    setCurrentIndex(idx);
  }, []);

  const pickSubmitImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Denied', 'Need camera roll access.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsMultipleSelection: true });
    if (!r.canceled) setSubmitFiles(prev => [...prev, ...r.assets.map(a => ({ uri: a.uri, name: a.fileName || `img_${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg', size: a.fileSize || 0 }))]);
  }, []);
  const pickSubmitDoc = useCallback(async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], multiple: true, copyToCacheDirectory: true });
    if (!r.canceled && r.assets) setSubmitFiles(prev => [...prev, ...r.assets.map(a => ({ uri: a.uri, name: a.name || `file_${Date.now()}`, type: a.mimeType || 'application/octet-stream', size: a.size || 0 }))]);
  }, []);
  const removeSubmitFile = useCallback((idx: number) => setSubmitFiles(prev => prev.filter((_, i) => i !== idx)), []);

  const handleSubmit = useCallback(async () => {
    if (!submitModal || submitFiles.length === 0) { Alert.alert('Required', 'Please attach at least one file.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('homework_id', submitModal.id.toString());
      fd.append('student_id', user?.id?.toString() || '');
      if (comment.trim()) fd.append('comment', comment.trim());
      submitFiles.forEach(f => { const p = f.uri.split('.'); const e = p[p.length - 1]; fd.append('files[]', { uri: f.uri, name: f.name, type: f.type || (e === 'pdf' ? 'application/pdf' : 'image/jpeg') } as any); });
      await api.post(`/homework/${submitModal.id}/submit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await loadHomeworks();
      await loadSubmissions();
      setSubmitModal(null);
      setSubmitFiles([]);
      setComment('');
      Alert.alert('Success', 'Homework submitted.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit.');
    }
    setSubmitting(false);
  }, [submitModal, submitFiles, comment, user, loadHomeworks, loadSubmissions]);

  const formatSize = (b: number) => { if (b < 1024) return `${b}B`; if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`; return `${(b / 1048576).toFixed(1)}MB`; };
  const getUrl = (a: any) => a.file_url || a.url || a.path || a.file || '';
  const getName = (a: any) => a.file_name || a.name || a.original_name || '';
  const hasImageExt = (s: string) => !!s.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)$/i);

  const renderAttachCarousel = (attachments: any[]) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <View style={{ marginTop: 12, marginBottom: 8, gap: 6 }}>
        {attachments.map((d: any, idx: number) => {
          const name = getName(d);
          const ext = name.split('.').pop()?.toLowerCase() || 'file';
          const isImg = d.mime_type?.startsWith('image/') || hasImageExt(getUrl(d)) || hasImageExt(name);
          const icon = isImg ? 'file-image' : ext === 'pdf' ? 'file-pdf-box' : ext.match(/docx?|word/) ? 'file-word' : ext.match(/xlsx?|excel/) ? 'file-excel' : 'file';
          const col = isImg ? '#8B5CF6' : ext === 'pdf' ? '#EF4444' : ext.match(/docx?|word/) ? '#3B82F6' : ext.match(/xlsx?|excel/) ? '#10B981' : '#6B7280';
          return (
            <TouchableOpacity key={idx}
              onPress={() => {
                if (isImg) { setImgViewIdx(0); setImgViewList([d]); }
                else setViewItem(d);
              }}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: isDark ? '#2a2a28' : 'rgba(245,158,11,0.04)',
                borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
                borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.12)',
              }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: col + '18', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={icon as any} size={18} color={col} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#D1D5DB' : '#374151' }} numberOfLines={1}>{name}</Text>
                {d.file_size && <Text style={{ fontSize: 9, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 1 }}>{formatSize(d.file_size)}</Text>}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color={isDark ? '#6B7280' : '#9CA3AF'} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderHomeworkCard = ({ item: h, index }: { item: any; index: number }) => {
    const sub = submissions[h.id];
    return (
      <View style={{ width: CARD_WIDTH, paddingRight: 0 }}>
        <View style={{
          backgroundColor: isDark ? '#1c1c14' : '#FFFFFF',
          borderRadius: 24, overflow: 'hidden',
          borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6',
          height: Dimensions.get('window').height - 240,
        }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Posted By Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: isDark ? '#2a2a28' : '#F9FAFB' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FDE047', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {h.teacher?.avatar ? (
                    <Image source={{ uri: h.teacher.avatar }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <MaterialCommunityIcons name="school" size={22} color="#92400E" />
                  )}
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>{h.teacher?.name || 'Teacher'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#D97706', backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' }}>
                      {h.subject?.name || 'General'}
                    </Text>
                    <Text style={{ fontSize: 9, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginLeft: 8 }}>#{h.id}</Text>
                  </View>
                </View>
                {sub && (
                  <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                    <Text style={{ color: '#065F46', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {sub.status || 'Done'}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="calendar" size={12} color="#EF4444" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444', marginLeft: 4 }}>Due: {h.due_date || 'N/A'}</Text>
                </View>
                {h.batch?.name && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="google-classroom" size={12} color="#8B5CF6" />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#8B5CF6', marginLeft: 4 }}>{h.batch.name}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Title & Description */}
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.3, lineHeight: 26, color: isDark ? '#FFF' : '#111' }}>
                {h.title}
              </Text>
              {h.description ? (
                <Text style={{ fontSize: 13, fontWeight: '500', lineHeight: 20, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 10 }}>
                  {h.description}
                </Text>
              ) : null}
            </View>

            {/* Attachments Carousel */}
            {h.attachments && h.attachments.length > 0 && (
              <View style={{ paddingHorizontal: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 4 }}>
                  <MaterialCommunityIcons name="paperclip" size={14} color="#8B5CF6" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#8B5CF6', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Attachments ({h.attachments.length})
                  </Text>
                </View>
                {renderAttachCarousel(h.attachments)}
              </View>
            )}

            {/* Submission Section */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              {sub ? (
                <View style={{ backgroundColor: isDark ? '#0a2a1a' : '#DCFCE7', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDark ? '#10B981' : '#A7F3D0' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="check-circle" size={22} color="#10B981" />
                    <Text style={{ color: '#065F46', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>Submitted</Text>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 10, gap: 16 }}>
                    {sub.grade && (
                      <View style={{ backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 }}>
                        <Text style={{ color: '#065F46', fontWeight: '800', fontSize: 12 }}>Grade</Text>
                        <Text style={{ color: '#065F46', fontWeight: '900', fontSize: 16 }}>{sub.grade}</Text>
                      </View>
                    )}
                    {sub.marks && (
                      <View style={{ backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 }}>
                        <Text style={{ color: '#065F46', fontWeight: '800', fontSize: 12 }}>Marks</Text>
                        <Text style={{ color: '#065F46', fontWeight: '900', fontSize: 16 }}>{sub.marks}</Text>
                      </View>
                    )}
                  </View>
                  {sub.feedback && (
                    <View style={{ marginTop: 10, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 12, padding: 12 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#065F46', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Feedback</Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#065F46', lineHeight: 18 }}>{sub.feedback}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity onPress={() => { setSubmitModal(h); setSubmitFiles([]); setComment(''); }}
                  style={{
                    backgroundColor: '#10B981', borderRadius: 16, paddingVertical: 16,
                    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
                    shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
                  }} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="upload" size={22} color="white" />
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>Upload My Homework</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderSubmitModal = () => {
    if (!submitModal) return null;
    const sub = submissions[submitModal.id];
    return (
      <Modal transparent visible={!!submitModal} onRequestClose={() => { setSubmitModal(null); setSubmitFiles([]); setComment(''); }} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => { setSubmitModal(null); setSubmitFiles([]); setComment(''); }} />
          <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', paddingBottom: 40 }}>
            <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111', flex: 1 }}>Submit Homework</Text>
              <TouchableOpacity onPress={() => { setSubmitModal(null); setSubmitFiles([]); setComment(''); }} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ color: '#D97706', fontSize: 10, fontWeight: '800' }}>{submitModal.subject?.name || 'General'}</Text>
                </View>
                <Text style={{ fontSize: 9, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginLeft: 8 }}>#{submitModal.id}</Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>{submitModal.title}</Text>
              {submitModal.description ? <Text style={{ fontSize: 13, fontWeight: '500', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 8 }}>{submitModal.description}</Text> : null}

              {sub ? (
                <View style={{ backgroundColor: '#DCFCE7', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#A7F3D0' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                    <Text style={{ color: '#065F46', fontWeight: '900', fontSize: 14, marginLeft: 8 }}>Already Submitted</Text>
                  </View>
                  <Text style={{ color: '#065F46', fontWeight: '600', fontSize: 12, marginTop: 4 }}>Status: {sub.status || 'submitted'}</Text>
                  {sub.grade ? <Text style={{ color: '#065F46', fontWeight: '700', fontSize: 13, marginTop: 4 }}>Grade: {sub.grade}</Text> : null}
                  {sub.marks ? <Text style={{ color: '#065F46', fontWeight: '700', fontSize: 13 }}>Marks: {sub.marks}</Text> : null}
                  {sub.feedback ? <Text style={{ color: '#065F46', fontWeight: '500', fontSize: 12, marginTop: 4 }}>Feedback: {sub.feedback}</Text> : null}
                </View>
              ) : (
                <>
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Attachments</Text>
                    {submitFiles.map((f, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2a2a28' : 'rgba(245,158,11,0.08)', borderRadius: 12, padding: 10, marginBottom: 6 }}>
                        <MaterialCommunityIcons name="file" size={18} color="#F59E0B" />
                        <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: isDark ? '#D1D5DB' : '#374151', marginLeft: 8 }} numberOfLines={1}>{f.name}</Text>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', marginRight: 8 }}>{formatSize(f.size)}</Text>
                        <TouchableOpacity onPress={() => removeSubmitFile(i)}><MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" /></TouchableOpacity>
                      </View>
                    ))}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      <TouchableOpacity onPress={pickSubmitImage} style={{ flex: 1, backgroundColor: isDark ? '#2a2a28' : '#F3F4F6', borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#E5E7EB' }}>
                        <MaterialCommunityIcons name="image" size={18} color="#8B5CF6" />
                        <Text style={{ color: '#8B5CF6', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Gallery</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={pickSubmitDoc} style={{ flex: 1, backgroundColor: isDark ? '#2a2a28' : '#F3F4F6', borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#E5E7EB' }}>
                        <MaterialCommunityIcons name="file-document" size={18} color="#3B82F6" />
                        <Text style={{ color: '#3B82F6', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Document</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Comment (optional)</Text>
                    <View style={{ backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.05)', borderRadius: 14, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.2)', paddingHorizontal: 14, paddingTop: 12 }}>
                      <TextInput value={comment} onChangeText={setComment} placeholder="Add a note..." placeholderTextColor="#9CA3AF" multiline numberOfLines={3} textAlignVertical="top" style={{ fontWeight: '600', fontSize: 14, lineHeight: 20, paddingBottom: 12, color: isDark ? '#D1D5DB' : '#374151' }} />
                    </View>
                  </View>

                  <TouchableOpacity onPress={handleSubmit} disabled={submitting}
                    style={{ backgroundColor: submitting ? '#D1D5DB' : '#10B981', paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                    {submitting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <><MaterialCommunityIcons name="send" size={20} color="white" /><Text style={{ color: 'white', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>Submit Homework</Text></>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const ZoomableImage = ({ uri, onClose }: { uri: string; onClose: () => void }) => {
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const isZoomed = useSharedValue(false);

    const pinch = Gesture.Pinch()
      .onStart((e) => {
        savedScale.value = scale.value;
      })
      .onUpdate((e) => {
        scale.value = Math.max(1, Math.min(5, savedScale.value * e.scale));
      })
      .onEnd(() => {
        savedScale.value = scale.value;
        isZoomed.value = scale.value > 1;
        if (scale.value <= 1) {
          scale.value = withSpring(1);
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
          savedScale.value = 1;
          isZoomed.value = false;
        }
      });

    const pan = Gesture.Pan()
      .minPointers(2)
      .onStart(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      })
      .onUpdate((e) => {
        if (scale.value > 1) {
          translateX.value = savedTranslateX.value + e.translationX;
          translateY.value = savedTranslateY.value + e.translationY;
        }
      })
      .onEnd(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        if (scale.value > 1) {
          scale.value = withSpring(1);
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          savedScale.value = 1;
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
          isZoomed.value = false;
        } else {
          scale.value = withSpring(3);
          savedScale.value = 3;
          isZoomed.value = true;
        }
      });

    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .onEnd(() => {
        if (!isZoomed.value) onClose();
      });

    const composed = Gesture.Exclusive(doubleTap, singleTap);
    const zoomPan = Gesture.Simultaneous(pinch, pan);
    const all = Gesture.Race(composed, zoomPan);

    const animStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GestureDetector gesture={all}>
          <Animated.View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }, animStyle]}>
            <Image
              source={{ uri }}
              style={{ width: '100%', height: '85%', borderRadius: 8 }}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    );
  };

  const renderFileViewer = () => {
    const isImage = (a: any) => {
      if (a.mime_type?.startsWith('image/')) return true;
      if (hasImageExt(getUrl(a))) return true;
      if (hasImageExt(getName(a))) return true;
      return false;
    };

    if (imgViewIdx >= 0 && imgViewList.length > 0) {
      const current = imgViewList[imgViewIdx];
      const uri = getMediaUrl(getUrl(current));
      const close = () => { setImgViewIdx(-1); setImgViewList([]); };
      return (
        <Modal transparent visible={true} onRequestClose={close} animationType="fade">
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <View style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
              <TouchableOpacity onPress={close} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
              </TouchableOpacity>
              {imgViewList.length > 1 && (
                <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 }}>
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>{imgViewIdx + 1} / {imgViewList.length}</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => { if (uri) Linking.openURL(uri); }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="download" size={22} color="white" />
              </TouchableOpacity>
            </View>

            <ZoomableImage uri={uri} onClose={close} />

            {imgViewList.length > 1 && (
              <View style={{ position: 'absolute', bottom: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
                <TouchableOpacity onPress={() => { setImgViewIdx(prev => Math.max(0, prev - 1)); }}
                  style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: imgViewIdx === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
                  disabled={imgViewIdx === 0}>
                  <MaterialCommunityIcons name="chevron-left" size={26} color={imgViewIdx === 0 ? 'rgba(255,255,255,0.2)' : 'white'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setImgViewIdx(prev => Math.min(imgViewList.length - 1, prev + 1)); }}
                  style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: imgViewIdx === imgViewList.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
                  disabled={imgViewIdx === imgViewList.length - 1}>
                  <MaterialCommunityIcons name="chevron-right" size={26} color={imgViewIdx === imgViewList.length - 1 ? 'rgba(255,255,255,0.2)' : 'white'} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>
      );
    }

    if (viewItem) {
      const uri = getMediaUrl(getUrl(viewItem));
      const name = getName(viewItem);
      const ext = name.split('.').pop()?.toLowerCase() || '';
      const icon = ext === 'pdf' ? 'file-pdf-box' : ext.match(/docx?|word/) ? 'file-word' : ext.match(/xlsx?|excel/) ? 'file-excel' : 'file';
      const col = ext === 'pdf' ? '#EF4444' : ext.match(/docx?|word/) ? '#3B82F6' : ext.match(/xlsx?|excel/) ? '#10B981' : '#8B5CF6';
      return (
        <Modal transparent visible={true} onRequestClose={() => setViewItem(null)} animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }}>
            <TouchableOpacity onPress={() => setViewItem(null)} style={{ position: 'absolute', top: 50, left: 16, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
              <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%' }}>
                <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: col + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <MaterialCommunityIcons name={icon as any} size={36} color={col} />
                </View>
                <Text style={{ fontWeight: '900', fontSize: 16, color: isDark ? '#FFF' : '#111', textAlign: 'center' }} numberOfLines={2}>{name}</Text>
                {viewItem.file_size && <Text style={{ fontWeight: '600', fontSize: 12, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 6 }}>{formatSize(viewItem.file_size)}</Text>}
                <View style={{ marginTop: 8, backgroundColor: col + '15', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontWeight: '800', fontSize: 10, color: col, textTransform: 'uppercase', letterSpacing: 1 }}>.{ext}</Text>
                </View>
                <TouchableOpacity onPress={() => { if (uri) Linking.openURL(uri); }}
                  style={{ backgroundColor: col, paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 24, width: '100%' }}>
                  <MaterialCommunityIcons name="download" size={20} color="white" />
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>Download & Open</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFF8F0' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#6B7280' : '#9CA3AF' }}>
              TN HAPPYKIDS
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '900', letterSpacing: -1, marginTop: 2, color: isDark ? '#FFFFFF' : '#111827' }}>
              Homework
            </Text>
          </View>
          <View style={{ backgroundColor: '#FDE047', width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF', overflow: 'hidden' }}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <MaterialCommunityIcons name="book-open-page-variant" size={28} color="#92400E" />
            )}
          </View>
        </View>
        {/* Page Dots */}
        {homeworks.length > 1 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6 }}>
            {homeworks.map((_, idx) => (
              <TouchableOpacity key={idx} onPress={() => flatRef.current?.scrollToIndex({ index: idx, animated: true })}>
                <View style={{
                  width: currentIndex === idx ? 24 : 8, height: 8, borderRadius: 4,
                  backgroundColor: currentIndex === idx ? '#F59E0B' : (isDark ? '#4B5563' : '#D1D5DB'),
                }} />
              </TouchableOpacity>
            ))}
            <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', marginLeft: 8 }}>
              {currentIndex + 1}/{homeworks.length}
            </Text>
          </View>
        )}
      </View>

      {homeworks.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: isDark ? '#2a2a28' : '#F9FAFB', borderRadius: 24, padding: 48, alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
            <MaterialCommunityIcons name="book-off" size={56} color={isDark ? '#4B5563' : '#9CA3AF'} />
            <Text style={{ fontWeight: '800', fontSize: 16, color: isDark ? '#D1D5DB' : '#6B7280', marginTop: 16 }}>No homework assigned</Text>
            <Text style={{ fontWeight: '500', fontSize: 13, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 4 }}>Check back later</Text>
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={homeworks}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH}
          decelerationRate="fast"
          keyExtractor={(item) => String(item.id)}
          renderItem={renderHomeworkCard}
          onScroll={onScroll}
          onMomentumScrollEnd={onMomentumEnd}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          getItemLayout={(_, index) => ({ offset: CARD_WIDTH * index, length: CARD_WIDTH, index })}
        />
      )}

      {renderSubmitModal()}
      {renderFileViewer()}
    </SafeAreaView>
  );
}
