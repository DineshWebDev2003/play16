import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Platform, Image, StyleSheet, Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../../contexts/AuthContext';
import api, { getMediaUrl } from '../../../services/api';
import { WebView } from 'react-native-webview';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';

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

function AuroraBackground() {
  return (
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
  );
}

const GRADING_ICON = require('../../../assets/icons/exam-results.png');

const ZoomableImage = ({ uri }: { uri: string }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const isZoomed = useSharedValue(false);

  const pinch = Gesture.Pinch()
    .onStart((e) => { savedScale.value = scale.value; })
    .onUpdate((e) => { scale.value = Math.max(1, Math.min(6, savedScale.value * e.scale)); })
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
    .onStart(() => { savedTranslateX.value = translateX.value; savedTranslateY.value = translateY.value; })
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => { savedTranslateX.value = translateX.value; savedTranslateY.value = translateY.value; });

  const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd(() => {
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

  const zoomPan = Gesture.Simultaneous(pinch, pan);
  const all = Gesture.Race(doubleTap, zoomPan);

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
        <Animated.View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, animStyle]}>
          <Image source={{ uri }} style={{ width: '100%', height: '90%' }} resizeMode="contain" />
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

interface Batch { id: number; name: string; students_count?: number; }
interface Subject { id: number; name: string; batch_id: number | null; icon?: string; color?: string; }

const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseYMD = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const formatDisplay = (ymd: string) => {
  try {
    return parseYMD(ymd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return ymd;
  }
};

export default function TuitionPostProgressScreenV2({ navigation }: Props) {
  const { user, users } = useAuth();
  const insets = useSafeAreaInsets();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentPicker, setShowStudentPicker] = useState(false);

  const [mode, setMode] = useState<'progress' | 'test'>('progress');
  const [date, setDate] = useState(toYMD(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [marks, setMarks] = useState<Record<string, string>>({});
  const [maxMarks, setMaxMarks] = useState<Record<string, string>>({});
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [comments, setComments] = useState('');
  const [subjectFiles, setSubjectFiles] = useState<Record<string, { uri: string; name: string; type: string; size: number }[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ uri: string; name: string; type: string } | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const tuitionStudents = useMemo(() =>
    users.filter((u: any) =>
      u.role === 'tuition_student' &&
      u.status === 'active' &&
      (!user?.branch_id || u.branch_id === user.branch_id)
    ),
  [users, user?.branch_id]);

  const classStudents = useMemo(() =>
    selectedBatchId ? tuitionStudents.filter(s => Number(s.batch_id) === selectedBatchId) : tuitionStudents,
  [tuitionStudents, selectedBatchId]);

  const classSubjects = useMemo(() =>
    selectedBatchId ? subjects.filter(s => s.batch_id === selectedBatchId) : [],
  [subjects, selectedBatchId]);

  const selectedBatch = batches.find(b => b.id === selectedBatchId) || null;

  const themeColor = mode === 'progress' ? '#F59E0B' : '#8B5CF6';
  const themeSoft = (mode === 'progress' ? 'rgba(245,158,11,' : 'rgba(139,92,246,');

  useEffect(() => {
    (async () => {
      try {
        const [bRes, sRes] = await Promise.all([
          api.get('/batches').catch(() => ({ data: [] })),
          api.get('/subjects').catch(() => ({ data: [] })),
        ]);
        const bData: any[] = bRes.data?.data || (Array.isArray(bRes.data) ? bRes.data : []);
        const sData: any[] = sRes.data?.data || (Array.isArray(sRes.data) ? sRes.data : []);
        setBatches(bData);
        setSubjects(sData);
      } catch {}
      setLoadingMeta(false);
    })();
  }, []);

  const fetchHistory = useCallback(async (studentId: number, targetDate: string, targetMode: string) => {
    if (!studentId) { setHistory([]); return; }
    setLoadingHistory(true);
    try {
      const res = await api.get(`/progress?student_id=${studentId}&date=${targetDate}&type=${targetMode}`);
      const list: any[] = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setHistory(list);

      const m: Record<string, string> = {};
      const g: Record<string, string> = {};
      const mx: Record<string, string> = {};
      list.forEach((r: any) => {
        const key = r.subject_id ? String(r.subject_id) : r.subject;
        if (r.marks != null && r.marks !== '') m[key] = String(r.marks);
        if (r.max_marks != null && r.max_marks !== '') mx[key] = String(r.max_marks);
        if (r.grade) g[key] = r.grade;
      });
      setMarks(m);
      setMaxMarks(mx);
      setGrades(g);
      setComments(list[0]?.comments || '');
    } catch {}
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchHistory(Number(selectedStudent.id), date, mode);
    } else {
      setHistory([]);
      setMarks({});
      setMaxMarks({});
      setGrades({});
      setComments('');
    }
  }, [selectedStudent?.id, date, mode]);

  const handleSubmit = async () => {
    if (!selectedStudent) { Alert.alert('Required', 'Select a student.'); return; }
    if (classSubjects.length === 0) { Alert.alert('No subjects', 'This class has no subjects mapped yet.'); return; }
    setSubmitting(true);
    try {
      const hasFiles = Object.values(subjectFiles).some((arr: any[]) => arr && arr.length > 0);
      const payload: any = {
        student_id: selectedStudent.id,
        date,
        type: mode,
        comments,
        entries: classSubjects.map((s) => {
          const entry: any = {
            subject_id: s.id,
            subject: s.name,
            marks: marks[String(s.id)] || null,
            max_marks: maxMarks[String(s.id)] || null,
            grade: grades[String(s.id)] || null,
          };
          return entry;
        }),
      };

      if (hasFiles) {
        const fd = new FormData();
        fd.append('student_id', String(selectedStudent.id));
        fd.append('date', date);
        fd.append('type', mode);
        fd.append('comments', comments);
        classSubjects.forEach((s, idx: any) => {
          fd.append(`entries[${idx}][subject_id]`, String(s.id));
          fd.append(`entries[${idx}][subject]`, s.name);
          fd.append(`entries[${idx}][marks]`, String(marks[String(s.id)] || ''));
          fd.append(`entries[${idx}][max_marks]`, String(maxMarks[String(s.id)] || ''));
          fd.append(`entries[${idx}][grade]`, String(grades[String(s.id)] || ''));
          const files = subjectFiles[String(s.id)] || [];
          files.forEach((f: any) => {
            const p = f.uri.split('.');
            const e = p[p.length - 1];
            fd.append(`entries[${idx}][attachment_files][]`, { uri: f.uri, name: f.name || `test_${Date.now()}.jpg`, type: f.type || (e === 'pdf' ? 'application/pdf' : 'image/jpeg') } as any);
          });
        });
        await api.post('/progress', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/progress', payload);
      }
      Alert.alert('Success', mode === 'progress' ? 'Progress posted.' : 'Test marks posted.');
      await fetchHistory(Number(selectedStudent.id), date, mode);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to post progress.');
    }
    setSubmitting(false);
  };

  const pickCameraImagesPerSubject = useCallback(async (subjectId: number) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission denied', 'Camera access needed to take test paper photos.'); return; }
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsMultipleSelection: true });
    if (!r.canceled) {
      const key = String(subjectId);
      setSubjectFiles(prev => ({ ...prev, [key]: [...(prev[key] || []), ...r.assets.map(a => ({ uri: a.uri, name: a.fileName || `camera_${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg', size: a.fileSize || 0 }))] }));
    }
  }, []);

  const pickGalleryPerSubject = useCallback(async (subjectId: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission denied', 'Need camera roll access.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsMultipleSelection: true });
    if (!r.canceled) {
      const key = String(subjectId);
      setSubjectFiles(prev => ({ ...prev, [key]: [...(prev[key] || []), ...r.assets.map(a => ({ uri: a.uri, name: a.fileName || `img_${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg', size: a.fileSize || 0 }))] }));
    }
  }, []);

  const pickFilesPerSubject = useCallback(async (subjectId: string) => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], multiple: true, copyToCacheDirectory: true });
    if (!r.canceled && r.assets && r.assets.length) {
      const key = String(subjectId);
      setSubjectFiles(prev => ({ ...prev, [key]: [...(prev[key] || []), ...r.assets.map(a => ({ uri: a.uri, name: a.name || `file_${Date.now()}`, type: a.mimeType || 'application/octet-stream', size: a.size || 0 }))] }));
    }
  }, []);

  const showPaperPicker = useCallback((subjectId: string) => {
    Alert.alert('Attach Test Paper', 'Capture with camera, upload images, or a PDF.', [
      { text: 'Camera', onPress: () => { const n = Number(subjectId); if (isFinite(n)) pickCameraImagesPerSubject(n); } },
      { text: 'Photo Library', onPress: () => pickGalleryPerSubject(subjectId) },
      { text: 'PDF / File', onPress: () => pickFilesPerSubject(subjectId) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [pickCameraImagesPerSubject, pickGalleryPerSubject, pickFilesPerSubject]);

  const openHistoryFile = (a: any) => {
    const uri = getMediaUrl(a.path || a.file_url || a.url || a.uri) || '';
    setPreviewFile({ uri, name: a.name || a.file_name || 'paper', type: a.type || 'application/octet-stream' });
  };

  const sectionCard = (children: React.ReactNode, icon: string, title: string, subtitle: string, color?: string) => {
    const c = color || themeColor;
    const soft = (c + '22');
    return (
      <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 22, padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: soft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <MaterialCommunityIcons name={icon as any} size={18} color={c} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: TEXT_PRIMARY }}>{title}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED }}>{subtitle}</Text>
          </View>
        </View>
        {children}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: Math.max(insets.top, 56) }}>

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 8 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Tuition</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Post Marks</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>Record progress & test results</Text>
            </View>
            <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={GRADING_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
            </View>
          </View>

          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 18, padding: 5, marginBottom: 16 }}>
            {(['progress', 'test'] as const).map(m => {
              const c = m === 'progress' ? '#F59E0B' : '#8B5CF6';
              const active = mode === m;
              return (
                <TouchableOpacity key={m} activeOpacity={0.8} onPress={() => setMode(m)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: active ? c : 'transparent' }}>
                  <MaterialCommunityIcons name={m === 'progress' ? 'chart-line' : 'clipboard-check-outline'} size={18} color={active ? 'white' : '#6B7280'} />
                  <Text style={{ fontWeight: '900', fontSize: 14, marginLeft: 8, color: active ? 'white' : '#6B7280' }}>
                    {m === 'progress' ? 'Progress' : 'Test Marks'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {sectionCard(
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => { setSelectedBatchId(null); setSelectedStudent(null); }}
                style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 2, backgroundColor: selectedBatchId === null ? themeColor : '#FFFFFF', borderColor: selectedBatchId === null ? themeColor : '#E5E7EB' }}>
                <Text style={{ fontWeight: '800', fontSize: 13, color: selectedBatchId === null ? 'white' : TEXT_SECONDARY }}>All Classes</Text>
              </TouchableOpacity>
              {batches.map(b => (
                <TouchableOpacity key={b.id} activeOpacity={0.8} onPress={() => { setSelectedBatchId(b.id); setSelectedStudent(null); }}
                  style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 2, backgroundColor: selectedBatchId === b.id ? themeColor : '#FFFFFF', borderColor: selectedBatchId === b.id ? themeColor : '#E5E7EB' }}>
                  <Text style={{ fontWeight: '800', fontSize: 13, color: selectedBatchId === b.id ? 'white' : TEXT_SECONDARY }}>{b.name}</Text>
                </TouchableOpacity>
              ))}
              {batches.length === 0 && !loadingMeta && (
                <Text style={{ fontWeight: '600', fontSize: 13, color: TEXT_MUTED, paddingVertical: 12 }}>No classes available</Text>
              )}
            </ScrollView>,
            'google-classroom', 'Select Class',
            selectedBatch ? `${classStudents.length} students in ${selectedBatch.name}` : 'Choose a class to list its students'
          )}

          {sectionCard(
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowStudentPicker(true)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, borderWidth: 2, backgroundColor: selectedStudent ? themeColor : (themeSoft + '0.05)'), borderColor: selectedStudent ? themeColor : (themeSoft + '0.2)') }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: selectedStudent ? 'rgba(255,255,255,0.2)' : (themeSoft + '0.15)'), alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <MaterialCommunityIcons name="account" size={20} color={selectedStudent ? 'white' : themeColor} />
              </View>
              <Text style={{ flex: 1, fontWeight: '700', fontSize: 14, color: selectedStudent ? 'white' : TEXT_SECONDARY }}>
                {selectedStudent ? selectedStudent.name : classStudents.length ? 'Tap to select student' : 'Select a class first'}
              </Text>
              {selectedStudent ? (
                <TouchableOpacity onPress={() => setSelectedStudent(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="white" />
                </TouchableOpacity>
              ) : (
                <MaterialCommunityIcons name="chevron-down" size={20} color={TEXT_MUTED} />
              )}
            </TouchableOpacity>,
            'account-school', 'Select Student',
            selectedStudent ? `Student ID: ${selectedStudent.studentId || selectedStudent.username || 'N/A'}` : 'Pick the student to post marks for'
          )}

          {sectionCard(
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowDatePicker(true)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 2, backgroundColor: themeSoft + '0.05)', borderColor: themeSoft + '0.2)' }}>
              <MaterialCommunityIcons name="calendar-blank" size={20} color={themeColor} />
              <Text style={{ flex: 1, fontWeight: '800', fontSize: 15, color: TEXT_PRIMARY, marginLeft: 12 }}>{formatDisplay(date)}</Text>
              <View style={{ backgroundColor: themeColor, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 11 }}>CHANGE</Text>
              </View>
            </TouchableOpacity>,
            'calendar-edit', 'Select Date',
            'Auto-picks today. Change to view or post for another date.'
          )}

          {selectedStudent && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 22, padding: 20, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: themeSoft + '0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name={mode === 'progress' ? 'chart-line' : 'numeric'} size={18} color={themeColor} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: TEXT_PRIMARY }}>
                      {mode === 'progress' ? 'Subject Status' : 'Subject Marks & Grades'}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED }}>
                      {mode === 'progress'
                        ? 'Pick a status for each subject'
                        : selectedBatch ? `${selectedBatch.name} subjects only` : 'Enter marks or grade per subject'}
                    </Text>
                  </View>
                </View>
                {loadingHistory && <ActivityIndicator size="small" color={themeColor} />}
              </View>

              {classSubjects.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="book-off-outline" size={40} color="#CBD5E1" />
                  <Text style={{ color: TEXT_MUTED, fontWeight: '700', fontSize: 13, marginTop: 8 }}>No subjects mapped to this class yet</Text>
                </View>
              ) : (
                classSubjects.map(s => (
                  <View key={s.id} style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: themeSoft + '0.05)', borderWidth: 2, borderColor: themeSoft + '0.15)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: themeColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <MaterialCommunityIcons name={s.icon ? (s.icon as any) : 'book'} size={16} color="white" />
                      </View>
                      <Text style={{ fontWeight: '900', fontSize: 14, color: TEXT_PRIMARY, flex: 1 }}>{s.name}</Text>
                      {history.find(h => String(h.subject_id) === String(s.id)) && (
                        <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                          <Text style={{ color: '#059669', fontWeight: '800', fontSize: 10 }}>POSTED</Text>
                        </View>
                      )}
                    </View>
                    {mode === 'progress' ? (
                      <View>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_SECONDARY, marginBottom: 6, marginLeft: 2 }}>ON-TRACK STATUS</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {['Excellent', 'Good', 'Average', 'Needs Work'].map(st => {
                            const g = grades[String(s.id)];
                            const selected = g === st;
                            return (
                              <TouchableOpacity key={st} activeOpacity={0.7} onPress={() => setGrades(prev => ({ ...prev, [String(s.id)]: selected ? '' : st }))}
                                style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 2, borderColor: selected ? themeColor : '#E5E7EB', backgroundColor: selected ? themeSoft + '0.12)' : '#FFFFFF' }}>
                                <Text style={{ fontWeight: '800', fontSize: 12, color: selected ? themeColor : '#6B7280' }}>{st}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={{ flexDirection: 'row' }}>
                          <View style={{ flex: 1, marginRight: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_SECONDARY, marginBottom: 4, marginLeft: 4 }}>MARKS</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: themeSoft + '0.2)', borderRadius: 16, paddingHorizontal: 14, height: 48 }}>
                              <MaterialCommunityIcons name="numeric" size={16} color={themeColor} />
                              <TextInput style={{ flex: 1, fontWeight: '700', fontSize: 15, marginLeft: 8, color: TEXT_PRIMARY }}
                                value={marks[String(s.id)] || ''} onChangeText={t => setMarks(prev => ({ ...prev, [String(s.id)]: t }))}
                                placeholder="e.g. 85" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
                            </View>
                          </View>
                          <View style={{ flex: 1, marginLeft: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_SECONDARY, marginBottom: 4, marginLeft: 4 }}>OUT OF</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: themeSoft + '0.2)', borderRadius: 16, paddingHorizontal: 14, height: 48 }}>
                              <MaterialCommunityIcons name="lastpass" size={20} color={themeColor} />
                              <TextInput style={{ flex: 1, fontWeight: '700', fontSize: 15, marginLeft: 8, color: TEXT_PRIMARY }}
                                value={maxMarks[String(s.id)] || ''} onChangeText={t => setMaxMarks(prev => ({ ...prev, [String(s.id)]: t }))}
                                placeholder="e.g. 100" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
                            </View>
                          </View>
                        </View>
                        <View style={{ marginTop: 12 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_SECONDARY, marginBottom: 4, marginLeft: 4 }}>GRADE</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: themeSoft + '0.2)', borderRadius: 16, paddingHorizontal: 14, height: 48 }}>
                            <MaterialCommunityIcons name="school" size={20} color={themeColor} />
                            <TextInput style={{ flex: 1, fontWeight: '700', fontSize: 15, marginLeft: 8, color: TEXT_PRIMARY }}
                              value={grades[String(s.id)] || ''} onChangeText={t => setGrades(prev => ({ ...prev, [String(s.id)]: t }))}
                              placeholder="e.g. A+" placeholderTextColor="#9CA3AF" />
                          </View>
                        </View>
                        <View style={{ marginTop: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_SECONDARY, marginLeft: 2 }}>TEST PAPER</Text>
                            <TouchableOpacity activeOpacity={0.7} onPress={() => showPaperPicker(String(s.id))}
                              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: themeSoft + '0.15)' }}>
                              <MaterialCommunityIcons name="camera-plus" size={15} color={themeColor} />
                              <Text style={{ fontWeight: '800', fontSize: 11, color: themeColor, marginLeft: 4 }}>Add Paper</Text>
                            </TouchableOpacity>
                          </View>
                          {(subjectFiles[String(s.id)] || []).length === 0 ? (
                            <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginLeft: 2 }}>
                              Attach the paper (photos or PDF) so the student can view it
                            </Text>
                          ) : (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                              {(subjectFiles[String(s.id)] || []).map((f: any, fi: number) => {
                                const isPdf = f.type.includes('pdf') || /\.pdf$/i.test(f.name);
                                return (
                                  <View key={fi} style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: themeSoft + '0.2)' }}>
                                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.7} onPress={() => setPreviewFile({ uri: f.uri, name: f.name, type: f.type })}>
                                      {isPdf ? (
                                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                          <MaterialCommunityIcons name="file-pdf-box" size={26} color="#EF4444" />
                                        </View>
                                      ) : (
                                        <Image source={{ uri: f.uri }} style={{ flex: 1 }} resizeMode="cover" />
                                      )}
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setSubjectFiles(prev => ({ ...prev, [String(s.id)]: (prev[String(s.id)] || []).filter((_: any, x: number) => x !== fi) }))}
                                      style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                                      <MaterialCommunityIcons name="close" size={12} color="#fff" />
                                    </TouchableOpacity>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {selectedStudent && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 22, padding: 20, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: themeSoft + '0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="comment-text" size={18} color={themeColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: TEXT_PRIMARY }}>Comments</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED }}>Overall remarks (optional)</Text>
                </View>
              </View>
              <View style={{ backgroundColor: themeSoft + '0.05)', borderWidth: 2, borderColor: themeSoft + '0.15)', borderRadius: 16, paddingHorizontal: 16, paddingTop: 14 }}>
                <TextInput style={{ fontWeight: '600', fontSize: 14, lineHeight: 20, paddingBottom: 12, color: TEXT_SECONDARY }}
                  placeholder="Write your remarks about the student's progress..." placeholderTextColor="#9CA3AF"
                  multiline numberOfLines={4} textAlignVertical="top" value={comments} onChangeText={setComments} />
              </View>
            </View>
          )}

          {selectedStudent && (
            <TouchableOpacity onPress={handleSubmit} disabled={submitting}
              style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 20, backgroundColor: themeColor, elevation: 3 }} activeOpacity={0.8}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <><MaterialCommunityIcons name="send" size={22} color="#FFF" /><Text style={{ color: 'white', fontWeight: '900', fontSize: 16, marginLeft: 10 }}>
                  {mode === 'progress' ? 'Save Progress' : 'Post Test Marks'}
                </Text></>
              )}
            </TouchableOpacity>
          )}

          {selectedStudent && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 22, padding: 20, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: themeSoft + '0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="history" size={18} color={themeColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: TEXT_PRIMARY }}>
                    {mode === 'progress' ? 'Progress' : 'Test'} History
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED }}>
                    {selectedStudent.name} · {formatDisplay(date)}
                  </Text>
                </View>
                {loadingHistory && <ActivityIndicator size="small" color={themeColor} />}
              </View>

              {history.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="file-chart-outline" size={40} color="#CBD5E1" />
                  <Text style={{ color: TEXT_MUTED, fontWeight: '700', fontSize: 13, marginTop: 8 }}>
                    No {mode === 'progress' ? 'progress' : 'test marks'} posted for this date
                  </Text>
                </View>
              ) : (
                history.map((h: any) => {
                  const atts: any[] = h.attachments || [];
                  return (
                    <View key={h.id}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: atts.length > 0 ? 0 : 1, borderBottomColor: '#F1F5F9' }}>
                        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: themeSoft + '0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <MaterialCommunityIcons name={mode === 'progress' ? 'chart-line' : 'clipboard-text'} size={16} color={themeColor} />
                        </View>
                        <Text style={{ flex: 1, fontWeight: '800', fontSize: 14, color: TEXT_PRIMARY }}>{h.subject?.name || h.subject || 'Subject'}</Text>
                        <View style={{ marginRight: 12, alignItems: 'flex-end' }}>
                          <Text style={{ fontWeight: '900', fontSize: 15, color: TEXT_PRIMARY }}>
                            {h.marks != null && h.marks !== '' ? `${h.marks}${h.max_marks != null && h.max_marks !== '' ? '/' + h.max_marks : ''}` : (h.grade || '—')}
                          </Text>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_MUTED }}>{h.marks != null && h.marks !== '' ? 'MARKS' : 'STATUS'}</Text>
                        </View>
                        <View style={{ backgroundColor: themeSoft + '0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, minWidth: 46, alignItems: 'center' }}>
                          <Text style={{ fontWeight: '900', fontSize: 14, color: themeColor }}>{h.grade || '—'}</Text>
                        </View>
                      </View>
                      {atts.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          {atts.map((a: any, ai: number) => {
                            const fileName = a.name || a.file_name || 'paper';
                            const pdf = /\.pdf$/i.test(fileName) || (a.type || '').includes('pdf');
                            const img = (a.type || '').startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(fileName);
                            const col = pdf ? '#EF4444' : (img ? '#8B5CF6' : '#6B7280');
                            return (
                              <TouchableOpacity key={ai} activeOpacity={0.8} onPress={() => openHistoryFile(a)}
                                style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: col + '33', alignItems: 'center', justifyContent: 'center' }}>
                                {img ? (
                                  <Image source={{ uri: getMediaUrl(a.path || a.file_url || a.url || a.uri) || '' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                ) : (
                                  <>
                                    <MaterialCommunityIcons name={pdf ? 'file-pdf-box' : 'file'} size={26} color={col} />
                                    <Text style={{ fontSize: 8, fontWeight: '700', color: col, marginTop: 2 }} numberOfLines={1}>{fileName.split('.').pop()?.toUpperCase()}</Text>
                                  </>
                                )}
                                <View style={{ position: 'absolute', right: 2, bottom: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                                  <MaterialCommunityIcons name="eye" size={11} color="#fff" />
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal transparent visible={showStudentPicker} onRequestClose={() => setShowStudentPicker(false)} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowStudentPicker(false)} />
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: TEXT_PRIMARY }}>
                Select Student{selectedBatch ? ` · ${selectedBatch.name}` : ''}
              </Text>
              <TouchableOpacity onPress={() => setShowStudentPicker(false)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {classStudents.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="account-group-outline" size={48} color="#CBD5E1" />
                  <Text style={{ color: TEXT_MUTED, fontWeight: '700', fontSize: 14, marginTop: 12 }}>
                    {selectedBatchId ? 'No students in this class' : 'No students available'}
                  </Text>
                </View>
              ) : classStudents.map(st => (
                <TouchableOpacity key={st.id} activeOpacity={0.7} onPress={() => { setSelectedStudent(st); setShowStudentPicker(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8, backgroundColor: themeSoft + '0.05)', borderWidth: 2, borderColor: selectedStudent?.id === st.id ? themeColor : (themeSoft + '0.15)') }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: themeColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name="school" size={20} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900', fontSize: 14, color: TEXT_PRIMARY }}>{st.name}</Text>
                    <Text style={{ fontWeight: '700', fontSize: 12, color: TEXT_MUTED }}>
                      @{st.username}{st.studentId ? ` · ID ${st.studentId}` : ''}
                    </Text>
                  </View>
                  {selectedStudent?.id === st.id && <MaterialCommunityIcons name="check-circle" size={20} color={themeColor} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={parseYMD(date)}
          mode="date"
          maximumDate={new Date()}
          onChange={(e: any, d?: Date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (e.type === 'set' && d) setDate(toYMD(d));
          }}
        />
      )}

      <Modal transparent visible={!!previewFile} onRequestClose={() => setPreviewFile(null)} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Math.max(insets.top, 12) }}>
            <TouchableOpacity onPress={() => setPreviewFile(null)} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, flex: 1, marginHorizontal: 12 }} numberOfLines={1}>{previewFile?.name}</Text>
            <TouchableOpacity onPress={() => setPreviewFile(null)} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            {previewFile ? (
              (previewFile.type.includes('image') || previewFile.uri.startsWith('data:image') || /\.(png|jpe?g|gif|webp)$/i.test(previewFile.uri)) ? (
                <ZoomableImage uri={previewFile.uri} />
              ) : (
                <WebView source={{ uri: previewFile.uri }} style={{ flex: 1 }} />
              )
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="file-outline" size={56} color="#6B7280" />
                <Text style={{ color: '#9CA3AF' }}>No file selected</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
