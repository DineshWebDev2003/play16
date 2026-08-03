import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, Modal, Platform, StyleSheet, PanResponder } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Pdf from 'react-native-pdf';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api, { getMediaUrl } from '../../services/api';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }
interface Attachment { uri: string; name: string; type: string; size: number; }
interface Batch { id: number; name: string; description?: string; students_count?: number; icon?: string; color?: string; branch_id?: number; }
interface Subject { id: number; name: string; batch_id: number | null; batch?: Batch | null; branch_id?: number; icon?: string; color?: string; }
interface AppUser { id: number; name: string; role: string; batch_id?: number | null; username?: string; studentId?: string; student_id?: string; }

const ICONS = ['book-education', 'book', 'bookmark', 'book-open-variant', 'book-plus', 'bookshelf', 'school', 'google-classroom', 'shape', 'shape-plus', 'star', 'star-outline', 'fire', 'flash', 'lightbulb', 'lightbulb-on', 'pencil', 'pen', 'abacus', 'calculator', 'sigma', 'function', 'math-compass', 'drawing', 'palette', 'music', 'microphone', 'chemistry', 'flask', 'earth', 'map', 'compass', 'basketball', 'football', 'swim', 'run', 'food-apple', 'food', 'heart', 'account-group', 'account-star', 'crown', 'diamond', 'trophy', 'medal', 'flag', 'rocket', 'airplane', 'car', 'bus', 'train', 'phone', 'cellphone', 'laptop', 'monitor', 'tablet', 'headphones', 'camera', 'video', 'filmstrip', 'gamepad', 'puzzle', 'toy-brick', 'robot', 'cloud', 'moon', 'weather-sunny', 'weather-night', 'flower', 'pine-tree', 'paw', 'cat', 'dog'];

const COLORS = ['#D97706', '#8B5CF6', '#EF4444', '#3B82F6', '#10B981', '#F97316', '#EC4899', '#06B6D4', '#84CC16', '#14B8A6', '#6366F1', '#F43F5E'];

const brand = '#F59E0B';
const brandDark = '#D97706';
const accent = '#8B5CF6';

// ── Zoomable Image (pinch + pan + double-tap) ──
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <GestureDetector gesture={all}>
        <Animated.View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, animStyle]}>
          <Image source={{ uri }} style={{ width: '100%', height: '90%' }} resizeMode="contain" />
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

// ── Reusable styled primitives (inline-style, gradient pattern) ──
const PickerHeader = ({ theme, title, onClose, right, accent }: {
  theme?: string; title: string; onClose: () => void; right?: React.ReactNode; accent?: string;
}) => (
  <LinearGradient
    colors={[accent || brand, accent ? (accent + '99') : brandDark]}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2 }}>
    <TouchableOpacity onPress={onClose} style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name="close" size={22} color="#fff" />
    </TouchableOpacity>
    <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff' }}>{title}</Text>
    {right ? right : <View style={{ width: 42 }} />}
  </LinearGradient>
);

const Survey = React.memo(({ label, value, onChange, placeholder, multiline, icon, isDark }: {
  label: string; value: string; onChange: (t: string) => void; placeholder: string; multiline?: boolean; icon: string; isDark: boolean;
}) => (
  <View style={{ marginBottom: 18 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <MaterialCommunityIcons name={icon as any} size={16} color={brand} />
      <Text style={{ fontSize: 12, fontWeight: '800', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#FBBF24' : '#B45309' }}>{label}</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: isDark ? '#2a2a24' : '#FDF6EC', borderRadius: 16, borderWidth: 2, borderColor: isDark ? '#3a3a34' : brand + '40', overflow: 'hidden' }}>
      <View style={{ backgroundColor: brand, width: 6, minHeight: 52 }} />
      <TextInput
        style={{ flex: 1, paddingHorizontal: 14, paddingVertical: multiline ? 14 : 15, fontSize: 14, fontWeight: '700', minHeight: multiline ? 140 : 52, color: isDark ? '#fff' : '#111', textAlignVertical: multiline ? 'top' as const : 'center' }}
        placeholder={placeholder} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
        value={value} onChangeText={onChange} multiline={multiline}
        {...(multiline ? { numberOfLines: 6 } : {})}
      />
    </View>
  </View>
));

const SurveyTag = React.memo(({ label, value, onChange, placeholder, multiline, icon, isDark }: {
  label: string; value: string; onChange: (t: string) => void; placeholder: string; multiline?: boolean; icon: string; isDark: boolean;
}) => (
  <View style={{ marginBottom: 18 }}>
    <Text style={{ fontSize: 11, fontWeight: '800', marginBottom: 6, marginLeft: 2, color: isDark ? '#D1D5DB' : '#6B7280' }}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2a2a24' : '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: isDark ? '#4B5563' : '#FDE68A', overflow: 'hidden' }}>
      <View style={{ width: 44, height: multiline ? 144 : 50, alignItems: 'center', justifyContent: 'center', backgroundColor: brand }}>
        <MaterialCommunityIcons name={icon as any} size={18} color="#fff" />
      </View>
      <TextInput
        style={{ flex: 1, paddingHorizontal: 14, paddingVertical: multiline ? 13 : 14, fontSize: 14, fontWeight: '700', minHeight: multiline ? 140 : 46, color: isDark ? '#fff' : '#111827', textAlignVertical: multiline ? 'top' as const : 'center' }}
        placeholder={placeholder} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
        value={value} onChangeText={onChange} multiline={multiline}
        {...(multiline ? { numberOfLines: 5 } : {})}
      />
    </View>
  </View>
));

const Chip = React.memo(({ label, active, onPress, isDark }: { label: string; active: boolean; onPress: () => void; isDark: boolean }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}
    style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, marginRight: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: active ? brand : (isDark ? '#2a2a24' : '#F3F4F6') }}>
    {active && <MaterialCommunityIcons name="check" size={14} color="#7c2d12" />}
    <Text style={{ fontWeight: '800', fontSize: 12, marginLeft: active ? 4 : 0, color: active ? '#7c2d12' : (isDark ? '#D1D5DB' : '#6B7280') }}>{label}</Text>
  </TouchableOpacity>
));

const Card = React.memo(({ children, isDark, className }: { children: React.ReactNode; isDark: boolean; className?: string }) => (
  <View style={{ backgroundColor: isDark ? '#24241e' : '#FFFFFF', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: isDark ? '#33332b' : '#FDE68A', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 }}>
    {children}
  </View>
));

const ActionBtn = React.memo(({ onPress, loading, title, icon }: {
  onPress: () => void; loading?: boolean; title: string; icon: string;
}) => (
  <LinearGradient colors={[brand, brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    style={{ borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: brand, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10 }}>
    <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.8}
      style={{ paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
      {loading ? <ActivityIndicator size="small" color="#fff" /> : (
        <><MaterialCommunityIcons name={icon as any} size={20} color="#fff" /><Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginLeft: 10 }}>{title}</Text></>
      )}
    </TouchableOpacity>
  </LinearGradient>
));

const PickerModal = React.memo(({ visible, onClose, title, children, isDark }: {
  visible: boolean; onClose: () => void; title?: string; children: React.ReactNode; isDark: boolean;
}) => (
  <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
    <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity activeOpacity={1} onPress={() => { }} style={{ width: '88%', maxWidth: 400, borderRadius: 26, overflow: 'hidden', backgroundColor: isDark ? '#24241e' : '#FFFFFF', elevation: 25 }}>
        {title && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isDark ? '#3a3a35' : '#F3F4F6', backgroundColor: isDark ? '#2a2a24' : '#FEF3C7' }}>
            <Text style={{ fontWeight: '900', fontSize: 16, color: isDark ? '#fff' : '#78350F' }}>{title}</Text>
          </View>
        )}
        {children}
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
));

const IconPicker = ({ visible, onClose, onSelect, selected, title, isDark }: {
  visible: boolean; onClose: () => void; onSelect: (icon: string) => void; selected: string; title?: string; isDark: boolean;
}) => (
  <Modal transparent visible={visible} onRequestClose={onClose} animationType="slide">
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isDark ? '#3a3a35' : '#F3F4F6' }}>
        <TouchableOpacity onPress={onClose} style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '900', color: isDark ? '#FFF' : '#111827' }}>{title || 'Pick an Icon'}</Text>
        <View style={{ width: 42 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingBottom: 20 }}>
          {ICONS.map(ico => (
            <TouchableOpacity key={ico} activeOpacity={0.7} onPress={() => { onSelect(ico); onClose(); }}
              style={{ width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: selected === ico ? brand : (isDark ? '#2a2a24' : '#F3F4F6') }}>
              <MaterialCommunityIcons name={ico as any} size={26} color={selected === ico ? '#fff' : (isDark ? '#D1D5DB' : '#6B7280')} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

const ColorPicker = ({ visible, onClose, onSelect, selected, title, icon, isDark }: {
  visible: boolean; onClose: () => void; onSelect: (c: string) => void; selected: string; title?: string; icon?: string; isDark: boolean;
}) => (
  <Modal transparent visible={visible} onRequestClose={onClose} animationType="slide">
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#F3F4F6' }}>
        <TouchableOpacity onPress={onClose} style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827' }}>{title || 'Pick a Color'}</Text>
        <View style={{ width: 42 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingVertical: 28, borderRadius: 24, marginBottom: 24, backgroundColor: isDark ? '#24241e' : '#F9FAFB' }}>
          <MaterialCommunityIcons name={(icon || 'palette') as any} size={56} color={selected} />
          <Text style={{ fontSize: 16, fontWeight: '900', marginTop: 12, color: selected }}>{selected}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingBottom: 20 }}>
          {COLORS.map(c => (
            <TouchableOpacity key={c} activeOpacity={0.7} onPress={() => onSelect(c)}
              style={{ width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: c, borderWidth: selected === c ? 4 : 0, borderColor: isDark ? '#FFF' : '#000', transform: selected === c ? [{ scale: 1.1 }] : [] }}>
              {selected === c && <MaterialCommunityIcons name="check" size={24} color="#FFF" />}
            </TouchableOpacity>
          ))}
        </View>
        <LinearGradient colors={[brand, brandDark]} style={{ borderRadius: 16, marginTop: 12 }}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Done</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

// ── Main Screen ──
export default function PostHomeworkScreen({ navigation }: Props) {
  const { user, branches } = useAuth();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<'post' | 'subjects' | 'classes'>('post');
  const [showCreateModal, setShowCreateModal] = useState<'post' | 'subject' | 'batch' | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'remote' | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const pdfRef = useRef<any>(null);
  const seekBarWidth = useRef(0);
  const pdfTotalPagesRef = useRef(pdfTotalPages);
  useEffect(() => { pdfTotalPagesRef.current = pdfTotalPages; }, [pdfTotalPages]);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showHomeworkStudentPicker, setShowHomeworkStudentPicker] = useState(false);

  // Subject form state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectBatchId, setNewSubjectBatchId] = useState<number | null>(null);
  const [newSubjectBranchId, setNewSubjectBranchId] = useState<number | null>(null);
  const [newSubjectIcon, setNewSubjectIcon] = useState('book-education');
  const [newSubjectColor, setNewSubjectColor] = useState('#D97706');
  const [showNewBatchPicker, setShowNewBatchPicker] = useState(false);
  const [showSubjectIconPicker, setShowSubjectIconPicker] = useState(false);
  const [showSubjectColorPicker, setShowSubjectColorPicker] = useState(false);
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Batch form state
  const [allStudents, setAllStudents] = useState<AppUser[]>([]);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchDesc, setNewBatchDesc] = useState('');
  const [newBatchBranchId, setNewBatchBranchId] = useState<number | null>(null);
  const [newBatchIcon, setNewBatchIcon] = useState('google-classroom');
  const [newBatchColor, setNewBatchColor] = useState('#8B5CF6');
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [selectedManageBatch, setSelectedManageBatch] = useState<Batch | null>(null);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showBatchIconPicker, setShowBatchIconPicker] = useState(false);
  const [showBatchColorPicker, setShowBatchColorPicker] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const isTuitionTeacher = user?.role === 'tuition_teacher';

  const loadBatches = useCallback(async () => {
    try { const res = await api.get('/batches'); const d: Batch[] = res.data?.data || (Array.isArray(res.data) ? res.data : []); setBatches(d); } catch {}
  }, []);
  const loadSubjects = useCallback(async () => {
    try { const res = await api.get('/subjects'); const d: Subject[] = res.data?.data || (Array.isArray(res.data) ? res.data : []); setSubjects(d); } catch {}
  }, []);
  const loadStudents = useCallback(async () => {
    try { const res = await api.get('/users?role=tuition_student'); const d: AppUser[] = res.data?.data || (Array.isArray(res.data) ? res.data : []); setAllStudents(d); } catch {}
  }, []);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loadingHomeworks, setLoadingHomeworks] = useState(false);
  const loadHomeworks = useCallback(async () => {
    setLoadingHomeworks(true);
    try { const res = await api.get('/homework'); const d = res.data?.data || (Array.isArray(res.data) ? res.data : []); setHomeworks(d); } catch {}
    setLoadingHomeworks(false);
  }, []);

  useEffect(() => { loadBatches(); loadSubjects(); loadStudents(); loadHomeworks(); }, []);

  useEffect(() => {
    if (selectedSubjectId) { const f = subjects.find(s => s.id === selectedSubjectId); if (f) { setSubject(f.name); setSelectedBatch(f.batch_id); } }
    else if (!selectedSubjectId) setSubject('');
  }, [selectedSubjectId, subjects]);

  // ── Subject CRUD ──
  const resetSubjectForm = useCallback(() => {
    setNewSubjectName(''); setNewSubjectBatchId(null); setNewSubjectBranchId(null); setNewSubjectIcon('book-education'); setNewSubjectColor('#D97706'); setEditingSubject(null);
  }, []);

  const handleSaveSubject = useCallback(async () => {
    if (!newSubjectName.trim()) { Alert.alert('Required', 'Subject name is required.'); return; }
    setCreatingSubject(true);
    try {
      const p: any = { name: newSubjectName.trim(), icon: newSubjectIcon, color: newSubjectColor };
      if (newSubjectBatchId) p.batch_id = newSubjectBatchId;
      if (user?.role === 'master_admin') {
        if (!newSubjectBranchId) { Alert.alert('Required', 'Please select a branch.'); setCreatingSubject(false); return; }
        p.branch_id = newSubjectBranchId;
      } else if (user?.branch_id) {
        p.branch_id = user.branch_id;
      }
      if (editingSubject) { await api.put(`/subjects/${editingSubject.id}`, p); } else { await api.post('/subjects', p); }
      resetSubjectForm(); await loadSubjects();
      Alert.alert('Success', editingSubject ? 'Subject updated.' : 'Subject created.');
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed.'); }
    setCreatingSubject(false);
  }, [newSubjectName, newSubjectBatchId, newSubjectIcon, newSubjectColor, editingSubject, user, loadSubjects, resetSubjectForm]);

  const deleteSubject = useCallback(async (id: number) => {
    Alert.alert('Delete Subject', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/subjects/${id}`); await loadSubjects(); if (editingSubject?.id === id) resetSubjectForm(); } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed.'); }
      }},
    ]);
  }, [loadSubjects, editingSubject, resetSubjectForm]);

  const startEditSubject = useCallback((s: Subject) => {
    setNewSubjectName(s.name); setNewSubjectBatchId(s.batch_id); setNewSubjectBranchId(s.branch_id ?? null); setNewSubjectIcon(s.icon || 'book-education'); setNewSubjectColor(s.color || '#D97706'); setEditingSubject(s);
  }, []);

  // ── Batch CRUD ──
  const resetBatchForm = useCallback(() => {
    setNewBatchName(''); setNewBatchDesc(''); setNewBatchBranchId(null); setNewBatchIcon('google-classroom'); setNewBatchColor('#8B5CF6'); setEditingBatch(null);
  }, []);

  const handleSaveBatch = useCallback(async () => {
    if (!newBatchName.trim()) { Alert.alert('Required', 'Batch name is required.'); return; }
    if (user?.role === 'master_admin' && !newBatchBranchId) { Alert.alert('Required', 'Please select a branch.'); return; }
    setCreatingBatch(true);
    try {
      const p: any = { name: newBatchName.trim(), icon: newBatchIcon, color: newBatchColor };
      if (newBatchDesc.trim()) p.description = newBatchDesc.trim();
      if (user?.role === 'master_admin') p.branch_id = newBatchBranchId;
      else if (user?.branch_id) p.branch_id = user.branch_id;
      if (editingBatch) { await api.put(`/batches/${editingBatch.id}`, p); } else { await api.post('/batches', p); }
      resetBatchForm(); await loadBatches();
      Alert.alert('Success', editingBatch ? 'Class updated.' : 'Class created.');
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed.'); }
    setCreatingBatch(false);
  }, [newBatchName, newBatchDesc, newBatchIcon, newBatchColor, newBatchBranchId, editingBatch, user, loadBatches, resetBatchForm]);

  const deleteBatch = useCallback(async (id: number) => {
    Alert.alert('Delete Class', 'Students will be unassigned. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/batches/${id}`); await loadBatches(); if (editingBatch?.id === id) resetBatchForm(); if (selectedManageBatch?.id === id) setSelectedManageBatch(null); } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed.'); }
      }},
    ]);
  }, [loadBatches, editingBatch, resetBatchForm, selectedManageBatch]);

  const startEditBatch = useCallback((b: Batch) => {
    setNewBatchName(b.name); setNewBatchDesc(b.description || ''); setNewBatchBranchId(b.branch_id ?? null); setNewBatchIcon(b.icon || 'google-classroom'); setNewBatchColor(b.color || '#8B5CF6'); setEditingBatch(b);
  }, []);

  // ── Student assignment ──
  const assignStudentToBatch = useCallback(async (studentId: number) => {
    setAssigningStudent(true);
    try { await api.put(`/users/${studentId}`, { batch_id: selectedManageBatch!.id }); await loadStudents(); } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed.'); }
    setAssigningStudent(false);
  }, [selectedManageBatch, loadStudents]);

  const removeStudentFromBatch = useCallback(async (studentId: number) => {
    setAssigningStudent(true);
    try { await api.put(`/users/${studentId}`, { batch_id: null }); await loadStudents(); } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed.'); }
    setAssigningStudent(false);
  }, [loadStudents]);

  const deleteHomework = useCallback(async (id: number) => {
    Alert.alert('Delete Homework', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/homework/${id}`); await loadHomeworks(); } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed.'); }
      }},
    ]);
  }, [loadHomeworks]);

  const toggleStudent = useCallback((id: number) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }, []);

  // ── Attachments ──
  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Denied', 'Need camera roll access.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsMultipleSelection: true });
    if (!r.canceled) setAttachments(prev => [...prev, ...r.assets.map(a => ({ uri: a.uri, name: a.fileName || `img_${Date.now()}.jpg`, type: a.mimeType || 'image-jpeg'.replace('-', '/'), size: a.fileSize || 0 }))]);
  }, []);
  const pickDocument = useCallback(async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], multiple: true, copyToCacheDirectory: true });
    if (!r.canceled && r.assets) setAttachments(prev => [...prev, ...r.assets.map(a => ({ uri: a.uri, name: a.name || `file_${Date.now()}`, type: a.mimeType || 'application/octet-stream', size: a.size || 0 }))]);
  }, []);
  const removeAttachment = useCallback((idx: number) => setAttachments(prev => prev.filter((_, i) => i !== idx)), []);
  const formatSize = (b: number) => { if (b < 1024) return `${b}B`; if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`; return `${(b / 1048576).toFixed(1)}MB`; };

  const closePreview = useCallback(() => {
    setPreviewAttachment(null);
    setPreviewType(null);
    setPreviewUri(null);
    setPdfUri(null);
    setPdfLoading(false);
    setPdfCurrentPage(1);
    setPdfTotalPages(0);
  }, []);

  const handleDownloadAttachment = useCallback(async (a: Attachment) => {
    if (!a.uri) return;
    try {
      const fileName = a.name || `attachment_${Date.now()}`;
      const dir = new FileSystem.Directory(FileSystem.Paths.cache, 'downloads');
      if (!dir.exists) dir.create({ intermediates: true });
      const target = new FileSystem.File(dir, fileName);
      const res = await FileSystem.File.downloadFileAsync(a.uri, target, { idempotent: true });
      if (res?.uri) {
        await Sharing.shareAsync(res.uri, { mimeType: a.type || undefined, dialogTitle: fileName });
      }
    } catch (e: any) {
      console.error('Homework download failed', e?.message, e);
      Alert.alert('Error', 'Failed to download file.');
    }
  }, []);

  const openAttachment = useCallback((a: Attachment) => {
    if (!a.uri) { Alert.alert('Error', 'File not available.'); return; }
    const isPdf = (a.type || '').includes('pdf') || /\.pdf$/i.test(a.name || '');
    const isImage = (a.type || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(a.name || '');

    if (!isPdf && !isImage) {
      Alert.alert(a.name || 'File', 'Preview is not supported for this file type. Download it instead.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => handleDownloadAttachment(a) },
      ]);
      return;
    }

    setPreviewAttachment(a);

    if (Platform.OS === 'web') {
      setPreviewType(isImage ? 'image' : 'remote');
      setPreviewUri(a.uri);
      setPdfLoading(false);
      return;
    }

    if (isImage) {
      setPreviewType('image');
      setPreviewUri(a.uri);
      setPdfLoading(false);
      return;
    }

    setPreviewType('pdf');
    setPdfLoading(true);
    setPdfUri(null);
    (async () => {
      try {
        const dir = new FileSystem.Directory(FileSystem.Paths.cache, 'pdfview');
        if (!dir.exists) dir.create({ intermediates: true });
        const target = new FileSystem.File(dir, `hw_${Date.now()}.pdf`);
        const res = await FileSystem.File.downloadFileAsync(a.uri, target, { idempotent: true });
        if (res?.uri) setPdfUri(res.uri);
        else throw new Error('Download failed');
      } catch (e: any) {
        console.error('Homework pdf download failed', e?.message, e);
        setPdfLoading(false);
        Alert.alert('Error', `Failed to load PDF. ${e?.message || ''}`);
      }
    })();
  }, [handleDownloadAttachment]);

  const pageFromX = useCallback((x: number): number | null => {
    const total = pdfTotalPagesRef.current;
    if (!total || !seekBarWidth.current) return null;
    const ratio = Math.min(Math.max(x / seekBarWidth.current, 0), 1);
    return Math.max(1, Math.min(Math.round(ratio * (total - 1)) + 1, total));
  }, []);
  const handleSeekDrag = useCallback((x: number) => {
    const page = pageFromX(x); if (page) setPdfCurrentPage(page);
  }, [pageFromX]);
  const handleSeekEnd = useCallback((x: number) => {
    const page = pageFromX(x); if (page) { setPdfCurrentPage(page); if (pdfRef.current?.setPage) pdfRef.current.setPage(page); }
  }, [pageFromX]);
  const seekPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleSeekDrag(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => handleSeekDrag(evt.nativeEvent.locationX),
      onPanResponderRelease: (evt) => handleSeekEnd(evt.nativeEvent.locationX),
      onPanResponderTerminate: (evt) => handleSeekEnd(evt.nativeEvent.locationX),
    })
  ).current;

  const handlePost = useCallback(async () => {
    if (!title || !description || !dueDate) { Alert.alert('Missing Fields', 'Title, description, and due date are required.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title); fd.append('description', description); fd.append('subject', subject || title);
      fd.append('class_name', selectedBatch ? batches.find(b => b.id === selectedBatch)?.name || '' : '');
      fd.append('due_date', dueDate); fd.append('teacher_id', user?.id?.toString() || '');
      if (selectedBatch) fd.append('batch_id', selectedBatch.toString());
      selectedStudents.forEach(id => fd.append('student_ids[]', id.toString()));
      attachments.forEach(a => { const p = a.uri.split('.'); const e = p[p.length - 1]; fd.append('attachment_files[]', { uri: a.uri, name: a.name, type: a.type || (e === 'pdf' ? 'application/pdf' : 'image/jpeg') } as any); });
      await api.post('/homework', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success!', 'Homework posted.'); setTitle(''); setDescription(''); setSubject(''); setSelectedSubjectId(null); setDueDate(''); setSelectedBatch(null); setSelectedStudents([]); setAttachments([]);
      navigation.goBack();
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed.'); }
    setSubmitting(false);
  }, [title, description, subject, dueDate, selectedBatch, selectedStudents, attachments, user, batches, navigation]);

  const selectedSubjectObj = subjects.find(s => s.id === selectedSubjectId);
  const sameBatch = (s: AppUser, batchId: number | null | undefined) => !!batchId && String(s.batch_id) === String(batchId);
  const batchStudents = selectedManageBatch ? allStudents.filter(s => sameBatch(s, selectedManageBatch.id)) : [];
  const unassignedStudents = selectedManageBatch ? allStudents.filter(s => !sameBatch(s, selectedManageBatch.id)) : [];

  // ── Full-screen Icon Picker ──
  const tabs = [
    { key: 'post' as const, label: 'Post', icon: 'send-circle' as any },
    { key: 'subjects' as const, label: 'Subjects', icon: 'book-education' as any },
    { key: 'classes' as const, label: 'Classes', icon: 'google-classroom' as any },
  ];

  const tabTitle = tab === 'post' ? 'Homework' : tab === 'subjects' ? 'Subjects' : 'Classes';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* ── Study-Materials-style Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: isDark ? '#262620' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={isDark ? '#D1D5DB' : '#374151'} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#6B7280' : '#9CA3AF' }}>
              {user?.role === 'tuition_teacher' ? 'Tuition Teacher' : 'Teacher'}
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginTop: 2, color: isDark ? '#FFFFFF' : '#111827' }}>
              {tabTitle}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>
              {tab === 'post' ? `${homeworks.length} posted` : tab === 'subjects' ? `${subjects.length} saved` : `${batches.length} classes`}
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.9} onPress={() => {
            if (tab === 'post') setShowCreateModal('post');
            else if (tab === 'subjects') setShowCreateModal('subject');
            else if (tab === 'classes') setShowCreateModal('batch');
          }}
            style={{ backgroundColor: brand, width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 4 }}>
            <MaterialCommunityIcons name={tab === 'post' ? 'send' : tab === 'subjects' ? 'book-plus' : 'plus'} size={28} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...(Platform.OS === 'ios' ? { automaticallyAdjustKeyboardInsets: true } : {})}>
          {/* Segment tabs */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 6 }}>
            <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#24241e' : '#FFFFFF', borderRadius: 18, padding: 5, borderWidth: 1, borderColor: isDark ? '#3a3a32' : '#FDE68A', elevation: 3 }}>
              {tabs.map(t => {
                const active = tab === t.key;
                return (
                  <TouchableOpacity key={t.key} activeOpacity={0.7} onPress={() => setTab(t.key)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 14 }}>
                    {active && <LinearGradient colors={[brand, brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 14 }} />}
                    <MaterialCommunityIcons name={t.icon} size={18} color={active ? '#fff' : (isDark ? '#9CA3AF' : '#9CA3AF')} />
                    <Text style={{ fontWeight: '900', fontSize: 12, marginLeft: 6, color: active ? '#fff' : (isDark ? '#D1D5DB' : '#6B7280') }}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ═════ SUBJECTS TAB ═════ */}
          {tab === 'subjects' && (
            <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
              {subjects.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48, backgroundColor: isDark ? '#24241e' : '#FFFFFF', borderRadius: 28, borderWidth: 2, borderColor: isDark ? '#35352d' : '#FDE68A', borderStyle: 'dashed' }}>
                  <MaterialCommunityIcons name="book-off" size={52} color="#D1D5DB" />
                  <Text style={{ color: '#9CA3AF', fontWeight: '800', fontSize: 16, marginTop: 16 }}>No subjects yet</Text>
                  <Text style={{ color: '#B0B7C3', fontSize: 12, marginTop: 4 }}>Tap + to create your first subject</Text>
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 2 }}>
                    <MaterialCommunityIcons name="bookshelf" size={20} color={brand} />
                    <Text style={{ fontSize: 16, fontWeight: '900', marginLeft: 8, color: isDark ? '#fff' : '#1F2937' }}>Saved Subjects</Text>
                  </View>
                  {subjects.map((s) => (
                    <TouchableOpacity key={s.id} activeOpacity={0.85} onPress={() => startEditSubject(s)}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6', backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: (s.color || '#D97706') + '22' }}>
                          <MaterialCommunityIcons name={(s.icon || 'book-education') as any} size={21} color={s.color || '#D97706'} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '800', fontSize: 14, color: isDark ? '#fff' : '#111827' }}>{s.name}</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', marginTop: 2, color: isDark ? '#9CA3AF' : '#6B7280' }}>{s.batch?.name || 'No class mapped'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => deleteSubject(s.id)} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                          <MaterialCommunityIcons name="trash-can" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ═══════ CLASSES TAB ═════ */}
          {tab === 'classes' && (
            <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                <MaterialCommunityIcons name="google-classroom" size={20} color={brand} />
                <Text style={{ fontSize: 16, fontWeight: '900', marginLeft: 8, color: isDark ? '#fff' : '#1F2937' }}>All Classes</Text>
              </View>
              {batches.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48, backgroundColor: '#F3F4F6', borderRadius: 28, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed' }}>
                  <MaterialCommunityIcons name="shape-outline" size={52} color="#D1D5DB" />
                  <Text style={{ color: '#9CA3AF', fontWeight: '800', fontSize: 16, marginTop: 16 }}>No classes yet</Text>
                  <Text style={{ color: '#B0B7C3', fontSize: 12, marginTop: 4 }}>Tap + to create your first class</Text>
                </View>
              ) : batches.map(b => {
                const studentCount = allStudents.filter(s => String(s.batch_id) === String(b.id)).length;
                return (
                  <View key={b.id}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6', backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: (b.color || '#8B5CF6') + '22' }}>
                          <MaterialCommunityIcons name={(b.icon || 'google-classroom') as any} size={21} color={b.color || '#8B5CF6'} />
                        </View>
                        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => { startEditBatch(b); setShowCreateModal('batch'); }}>
                          <Text style={{ fontWeight: '800', fontSize: 14, color: isDark ? '#fff' : '#111827' }}>{b.name}</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', marginTop: 2, color: isDark ? '#9CA3AF' : '#6B7280' }}>{studentCount} students</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedManageBatch(b)} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                          <MaterialCommunityIcons name="account-details" size={16} color="#8B5CF6" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteBatch(b.id)} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialCommunityIcons name="trash-can" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                );
              })}
            </View>
          )}

          {/* ═══════ POST TAB ═════ */}
          {tab === 'post' && (
            <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                <MaterialCommunityIcons name="book-plus" size={20} color={brand} />
                <Text style={{ fontSize: 16, fontWeight: '900', marginLeft: 8, color: isDark ? '#fff' : '#1F2937' }}>Homework Posts</Text>
              </View>
              {loadingHomeworks ? (
                <ActivityIndicator size="large" color={brand} style={{ paddingVertical: 48 }} />
              ) : homeworks.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48, backgroundColor: '#F3F4F6', borderRadius: 28, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed' }}>
                  <MaterialCommunityIcons name="book-off" size={52} color="#D1D5DB" />
                  <Text style={{ color: '#9CA3AF', fontWeight: '800', fontSize: 16, marginTop: 16 }}>No homework posted yet</Text>
                  <Text style={{ color: '#B0B7C3', fontSize: 12, marginTop: 4 }}>Tap + to post your first homework</Text>
                </View>
              ) : homeworks.map(h => (
                <View key={h.id} style={{ borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6', backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: (h.subject?.color || '#D97706') + '22' }}>
                      <MaterialCommunityIcons name={(h.subject?.icon || 'book-education') as any} size={20} color={h.subject?.color || '#D97706'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '800', fontSize: 14, color: isDark ? '#fff' : '#111827' }}>{h.title}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', marginTop: 2, color: isDark ? '#9CA3AF' : '#6B7280' }}>{h.subject?.name || 'General'}{h.batch?.name ? ` · ${h.batch.name}` : ''}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteHomework(h.id)} style={{ width: 32, height: 32, borderRadius: 11, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                      <MaterialCommunityIcons name="trash-can" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ height: 1, backgroundColor: isDark ? '#3a3a38' : '#F3F4F6', marginHorizontal: 14 }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                      <MaterialCommunityIcons name="calendar" size={13} color="#EF4444" />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#F87171', marginLeft: 4 }}>{h.due_date || 'No due date'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="paperclip" size={13} color="#8B5CF6" />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#A78BFA', marginLeft: 4 }}>{h.attachments?.length || 0} file{(h.attachments?.length || 0) === 1 ? '' : 's'}</Text>
                    </View>
                  </View>
                  {(h.attachments || []).length > 0 && (
                    <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
                      {(h.attachments as any[]).map((a: any, idx: number) => {
                        const mediaUrl = getMediaUrl(a.path || a.uri);
                        const isPdf = (a.type || '').includes('pdf') || /\.pdf$/i.test(a.name || '');
                        const isImage = (a.type || '').includes('image') || /\.(png|jpe?g|gif|webp)$/i.test(a.name || '');
                        return (
                          <TouchableOpacity key={idx} activeOpacity={0.7} onPress={() => openAttachment({ uri: mediaUrl || a.path || a.uri, name: a.name || 'attachment', type: a.type || (isPdf ? 'application/pdf' : 'image/jpeg'), size: a.size || 0 })}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 9, borderRadius: 12, marginTop: 8, backgroundColor: isDark ? '#262620' : '#F9FAFB', borderWidth: 1, borderColor: isDark ? '#3a3a35' : '#F3F4F6' }}>
                            <View style={{ width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: isPdf ? '#FEE2E2' : (isImage ? '#F3E8FF' : '#DBEAFE') }}>
                              <MaterialCommunityIcons name={isPdf ? 'file-pdf-box' : (isImage ? 'file-image' : 'file-outline')} size={15} color={isPdf ? '#EF4444' : (isImage ? '#8B5CF6' : '#3B82F6')} />
                            </View>
                            <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: isDark ? '#E5E7EB' : '#374151' }} numberOfLines={1}>{a.name || 'attachment'}</Text>
                            <MaterialCommunityIcons name="eye-outline" size={17} color="#8B5CF6" />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ── FULL-SCREEN CLASS PICKER ── */}
      <Modal transparent visible={showClassPicker} onRequestClose={() => setShowClassPicker(false)} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
          <PickerHeader title="Select Class" onClose={() => setShowClassPicker(false)}
            right={<TouchableOpacity onPress={() => { setSelectedBatch(null); setShowClassPicker(false); }} style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12 }}><Text style={{ color: '#fff', fontWeight: '900', fontSize: 11 }}>All</Text></TouchableOpacity>} />
          {batches.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="google-classroom" size={48} color="#9CA3AF" />
              <Text style={{ color: '#9CA3AF', fontWeight: '800', fontSize: 14, marginTop: 12 }}>No classes available</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              {batches.map(b => {
                const active = selectedBatch === b.id;
                const studentCount = allStudents.filter(s => s.batch_id === b.id).length;
                return (
                  <TouchableOpacity key={b.id} activeOpacity={0.7} onPress={() => { setSelectedBatch(b.id); setShowClassPicker(false); }}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, marginBottom: 12, borderWidth: 2, borderColor: active ? brandDark : (isDark ? '#4B5563' : '#F3F4F6'), overflow: 'hidden' }}>
                    {active && <LinearGradient colors={[brand, brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
                    <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: active ? 'rgba(255,255,255,0.25)' : (b.color || '#8B5CF6') }}>
                      <MaterialCommunityIcons name={(b.icon || 'google-classroom') as any} size={22} color={active ? '#fff' : 'white'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '900', fontSize: 15, color: active ? '#fff' : (isDark ? '#fff' : '#111827') }}>{b.name}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#fff' : (isDark ? '#9CA3AF' : '#6B7280') }}>{studentCount} students</Text>
                    </View>
                    {active && <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ── FULL-SCREEN STUDENT PICKER (homework assignment) ── */}
      <Modal transparent visible={showHomeworkStudentPicker} onRequestClose={() => setShowHomeworkStudentPicker(false)} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
          <PickerHeader title="Assign to Students" onClose={() => setShowHomeworkStudentPicker(false)}
            accent={selectedStudents.length > 0 ? brandDark : ''}
            right={<TouchableOpacity onPress={() => { setSelectedStudents([]); setShowHomeworkStudentPicker(false); }} style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12 }}><Text style={{ color: '#fff', fontWeight: '900', fontSize: 11 }}>Clear</Text></TouchableOpacity>} />
          {allStudents.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
              <MaterialCommunityIcons name="account-off" size={48} color="#9CA3AF" />
              <Text style={{ color: '#9CA3AF', fontWeight: '800', fontSize: 14, marginTop: 12 }}>No students available</Text>
              <Text style={{ color: '#B0B7C3', fontSize: 12, marginTop: 4, textAlign: 'center' }}>Create tuition students in Manage Users</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 12 }}>
                {selectedStudents.length > 0 ? `${selectedStudents.length} selected` : 'Tap students to assign this homework to them'}
              </Text>
              {allStudents.map(st => {
                const active = selectedStudents.includes(st.id);
                const batch = batches.find(b => b.id === st.batch_id);
                return (
                  <TouchableOpacity key={st.id} activeOpacity={0.7} onPress={() => toggleStudent(st.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, marginBottom: 10, borderWidth: 2, borderColor: active ? brandDark : (isDark ? '#4B5563' : '#F3F4F6'), overflow: 'hidden' }}>
                    {active && <LinearGradient colors={[brand, brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
                    <View style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#8B5CF6' }}>
                      <MaterialCommunityIcons name="account" size={20} color="white" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '900', fontSize: 15, color: active ? '#fff' : (isDark ? '#fff' : '#111827') }}>{st.name}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#fff' : (isDark ? '#9CA3AF' : '#6B7280') }}>{batch?.name || 'No class'}</Text>
                    </View>
                    <View style={{ width: 24, height: 24, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? '#fff' : (isDark ? '#374151' : '#F3F4F6') }}>
                      {active && <MaterialCommunityIcons name="check" size={16} color={brandDark} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
              <ActionBtn onPress={() => setShowHomeworkStudentPicker(false)} title={`Done (${selectedStudents.length} selected)`} icon="check" />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ── FULL-SCREEN LINK TO CLASS ── */}
      <Modal transparent visible={showNewBatchPicker} onRequestClose={() => setShowNewBatchPicker(false)} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
          <PickerHeader title="Link to Class" onClose={() => setShowNewBatchPicker(false)}
            right={<TouchableOpacity onPress={() => { setNewSubjectBatchId(null); setShowNewBatchPicker(false); }} style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12 }}><Text style={{ color: '#fff', fontWeight: '900', fontSize: 11 }}>None</Text></TouchableOpacity>} />
          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            {batches.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <MaterialCommunityIcons name="google-classroom" size={48} color="#9CA3AF" />
                <Text style={{ color: '#9CA3AF', fontWeight: '800', fontSize: 14, marginTop: 12 }}>No classes available</Text>
              </View>
            ) : batches.map(b => {
              const active = newSubjectBatchId === b.id;
              return (
                <TouchableOpacity key={b.id} activeOpacity={0.7} onPress={() => { setNewSubjectBatchId(b.id); setShowNewBatchPicker(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, marginBottom: 12, borderWidth: 2, borderColor: active ? brandDark : (isDark ? '#4B5563' : '#F3F4F6'), overflow: 'hidden' }}>
                  {active && <LinearGradient colors={[brand, brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
                  <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: active ? 'rgba(255,255,255,0.25)' : (b.color || '#8B5CF6') }}>
                    <MaterialCommunityIcons name={(b.icon || 'google-classroom') as any} size={22} color="white" />
                  </View>
                  <Text style={{ flex: 1, fontWeight: '900', fontSize: 15, color: active ? '#fff' : (isDark ? '#fff' : '#111827') }}>{b.name}</Text>
                  {active && <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── FULL-SCREEN SUBJECT PICKER ── */}
      <Modal transparent visible={showSubjectPicker} onRequestClose={() => setShowSubjectPicker(false)} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isDark ? '#3a3a35' : '#F3F4F6' }}>
            <TouchableOpacity onPress={() => setShowSubjectPicker(false)} style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: isDark ? '#262620' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="close" size={22} color={isDark ? '#D1D5DB' : '#374151'} />
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: '900', color: isDark ? '#FFF' : '#111827' }}>Pick a Subject</Text>
            <TouchableOpacity onPress={() => { setSelectedSubjectId(null); setShowSubjectPicker(false); }} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, backgroundColor: isDark ? '#2a2a24' : '#FDE68A' }}>
              <Text style={{ color: isDark ? '#FBBF24' : '#B45309', fontWeight: '900', fontSize: 11 }}>ALL</Text>
            </TouchableOpacity>
          </View>
          {subjects.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="book-off" size={48} color="#9CA3AF" />
              <Text style={{ color: '#9CA3AF', fontWeight: '800', fontSize: 14, marginTop: 12 }}>No subjects yet</Text>
              <Text style={{ color: '#B0B7C3', fontSize: 12, marginTop: 4 }}>Create one in Subjects tab</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingHorizontal: 4, color: isDark ? '#6B7280' : '#9CA3AF' }}>{subjects.length} subjects</Text>
              {subjects.map(s => {
                const active = selectedSubjectId === s.id;
                return (
                  <TouchableOpacity key={s.id} activeOpacity={0.85} onPress={() => { setSelectedSubjectId(s.id); setShowSubjectPicker(false); }}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, marginBottom: 12, borderWidth: 2, borderColor: active ? brandDark : (isDark ? '#3a3a38' : '#F3F4F6'), backgroundColor: isDark ? '#262620' : '#FFFFFF', overflow: 'hidden', elevation: active ? 4 : 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }}>
                    {active && <LinearGradient colors={[brand, brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
                    <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: active ? 'rgba(255,255,255,0.25)' : (s.color || '#D97706') + '22' }}>
                      <MaterialCommunityIcons name={(s.icon || 'book-education') as any} size={24} color={active ? '#fff' : (s.color || '#D97706')} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '800', fontSize: 15, color: active ? '#fff' : (isDark ? '#fff' : '#111827') }} numberOfLines={1}>{s.name}</Text>
                      {s.batch ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <MaterialCommunityIcons name="shape" size={13} color={active ? '#FFF' : '#8B5CF6'} />
                          <Text style={{ fontSize: 11, fontWeight: '800', marginLeft: 5, color: active ? '#fff' : '#8B5CF6' }} numberOfLines={1}>{s.batch.name}</Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11, fontWeight: '600', marginTop: 4, color: active ? 'rgba(255,255,255,0.85)' : (isDark ? '#6B7280' : '#9CA3AF') }}>No class mapped</Text>
                      )}
                    </View>
                    {active ? (
                      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="check" size={18} color={brandDark} />
                      </View>
                    ) : (
                      <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? '#4B5563' : '#D1D5DB'} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      <PickerModal visible={showStudentPicker} onClose={() => setShowStudentPicker(false)} title={`Add to ${selectedManageBatch?.name || ''}`} isDark={isDark}>
        {unassignedStudents.length === 0 ? (
          <View style={{ paddingHorizontal: 20, paddingVertical: 32, alignItems: 'center' }}>
            <MaterialCommunityIcons name="account-check" size={36} color="#10B981" />
            <Text style={{ color: '#9CA3AF', fontWeight: '700', fontSize: 14, marginTop: 12 }}>All students assigned</Text>
          </View>
        ) : (
          <ScrollView bounces={false} style={{ maxHeight: 350 }}>
            {unassignedStudents.map(st => (
              <TouchableOpacity key={st.id} activeOpacity={0.7} onPress={() => { assignStudentToBatch(st.id); setShowStudentPicker(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="account-plus" size={18} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: isDark ? '#E5E7EB' : '#374151' }}>{st.name}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280' }}>ID: {st.student_id || st.studentId || st.id}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </PickerModal>

      {/* Icon Pickers */}
      <IconPicker isDark={isDark} visible={showSubjectIconPicker} onClose={() => setShowSubjectIconPicker(false)} onSelect={setNewSubjectIcon} selected={newSubjectIcon} title="Pick Subject Icon" />
      <IconPicker isDark={isDark} visible={showBatchIconPicker} onClose={() => setShowBatchIconPicker(false)} onSelect={setNewBatchIcon} selected={newBatchIcon} title="Pick Class Icon" />
      <ColorPicker isDark={isDark} visible={showSubjectColorPicker} onClose={() => setShowSubjectColorPicker(false)} onSelect={setNewSubjectColor} selected={newSubjectColor} title="Subject Color" icon={newSubjectIcon} />
      <ColorPicker isDark={isDark} visible={showBatchColorPicker} onClose={() => setShowBatchColorPicker(false)} onSelect={setNewBatchColor} selected={newBatchColor} title="Class Color" icon={newBatchIcon} />

      {/* ── CREATE HOMEWORK MODAL ── */}
      <Modal transparent visible={showCreateModal === 'post'} onRequestClose={() => setShowCreateModal(null)} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
          <PickerHeader title="New Homework" onClose={() => setShowCreateModal(null)} />
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...(Platform.OS === 'ios' ? { automaticallyAdjustKeyboardInsets: true } : {})}>
            <Card isDark={isDark} className="mb-4">
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="book-plus" size={20} color={brandDark} />
                </View>
                <View>
                  <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#fff' : '#111827' }}>Class & Subject</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', marginTop: 1, color: isDark ? '#9CA3AF' : '#6B7280' }}>Select where to assign this homework</Text>
                </View>
              </View>
              {isTuitionTeacher && (
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowClassPicker(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 16, marginBottom: 12, borderWidth: 2, borderColor: selectedBatch ? brandDark : (isDark ? '#4B5563' : '#FDE68A'), backgroundColor: isDark ? '#262620' : '#FFFFFF', overflow: 'hidden' }}>
                  {selectedBatch && <LinearGradient colors={[brand, brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
                  <View style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: selectedBatch ? 'rgba(255,255,255,0.25)' : '#FEF3C7' }}>
                    <MaterialCommunityIcons name="google-classroom" size={18} color={selectedBatch ? '#fff' : brand} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', fontSize: 14, color: selectedBatch ? '#fff' : (isDark ? '#F' : '#1F2937') }} numberOfLines={1}>
                      {selectedBatch ? batches.find(b => b.id === selectedBatch)?.name || 'Select' : 'Select Class'}
                    </Text>
                  </View>
                  {selectedBatch ? (
                    <MaterialCommunityIcons name="close-circle" size={20} color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name="chevron-down" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowSubjectPicker(true)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 16, borderWidth: 2, borderColor: selectedSubjectId ? brandDark : (isDark ? '#4B5563' : '#FDE68A'), backgroundColor: selectedSubjectId ? '#FFF' : (isDark ? '#2a2a24' : '#FFFFFF'), overflow: 'hidden' }}>
                {selectedSubjectId && <LinearGradient colors={[brand, brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
                <View style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: selectedSubjectId ? 'rgba(255,255,255,0.25)' : (isDark ? '#2a2a24' : '#FEF3C7') }}>
                  <MaterialCommunityIcons name="book-education" size={18} color={selectedSubjectId ? '#fff' : brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', fontSize: 14, color: selectedSubjectId ? '#fff' : '#1F2937' }} numberOfLines={1}>
                    {selectedSubjectObj ? selectedSubjectObj.name : 'Select Subject'}
                  </Text>
                  {selectedSubjectObj?.batch && (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: selectedSubjectId ? '#fff' : '#8B5CF6', marginTop: 1 }}>{selectedSubjectObj.batch.name}</Text>
                  )}
                </View>
                {selectedSubjectId ? (
                  <MaterialCommunityIcons name="close-circle" size={20} color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="chevron-down" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                )}
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowHomeworkStudentPicker(true)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 16, marginTop: 14, borderWidth: 2, borderColor: selectedStudents.length > 0 ? brandDark : (isDark ? '#4B5563' : '#FDE68A'), backgroundColor: isDark ? '#24241e' : '#FFFFFF', overflow: 'hidden' }}>
                {selectedStudents.length > 0 && <LinearGradient colors={[brand, brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
                <View style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: selectedStudents.length > 0 ? 'rgba(255,255,255,0.25)' : '#EDE9FE' }}>
                  <MaterialCommunityIcons name="account-multiple" size={18} color={selectedStudents.length > 0 ? '#fff' : '#8B5CF6'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', fontSize: 14, color: selectedStudents.length > 0 ? '#fff' : (isDark ? '#fff' : '#1F2937') }}>
                    {selectedStudents.length > 0 ? `${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''} assigned` : 'Assign to Students (optional)'}
                  </Text>
                  {selectedStudents.length > 0 && (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff', marginTop: 1 }} numberOfLines={1}>
                      {selectedStudents.map(id => allStudents.find(s => s.id === id)?.name || `#${id}`).join(', ')}
                    </Text>
                  )}
                </View>
                <MaterialCommunityIcons name="chevron-down" size={20} color={selectedStudents.length > 0 ? '#fff' : (isDark ? '#6B7280' : '#9CA3AF')} />
              </TouchableOpacity>
            </Card>

            <Card isDark={isDark} className="mb-4">
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="file-document-outline" size={20} color={brandDark} />
                </View>
                <View>
                  <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#fff' : '#111827' }}>Homework Details</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', marginTop: 1, color: isDark ? '#9CA3AF' : '#6B7280' }}>Title, description & due date</Text>
                </View>
              </View>
              <SurveyTag label="Title *" icon="format-text" value={title} onChange={setTitle} placeholder="e.g. Chapter 5: Algebra Basics" isDark={isDark} />
              <SurveyTag label="DESCRIPTION *" icon="text-long" value={description} onChange={setDescription} placeholder="Describe the assignment in detail..." multiline isDark={isDark} />
              <SurveyTag label="DUE DATE *" icon="calendar" value={dueDate} onChange={setDueDate} placeholder="e.g. 2026-08-15 or Tomorrow" isDark={isDark} />
            </Card>

            <Card isDark={isDark} className="mb-4">
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="attachment" size={20} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#fff' : '#111827' }}>Attachments</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', marginTop: 1, color: isDark ? '#9CA3AF' : '#6B7280' }}>{attachments.length > 0 ? `${attachments.length} file(s) selected` : 'Add images or PDFs'}</Text>
                </View>
                <TouchableOpacity onPress={pickImage} style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="image-plus" size={20} color="#8B5CF6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={pickDocument} style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginLeft: 10 }} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="file-pdf-box" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
              {attachments.length > 0 ? (
                attachments.map((a, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, marginTop: 8, backgroundColor: isDark ? '#2a2a24' : '#F9FAFB', borderWidth: 1, borderColor: isDark ? '#3a3a35' : '#FDE68A' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: a.type.includes('pdf') ? '#FEE2E2' : '#F3E8FF' }}>
                      <MaterialCommunityIcons name={a.type.includes('pdf') ? 'file-pdf-box' : 'file-image'} size={16} color={a.type.includes('pdf') ? '#EF4444' : '#8B5CF6'} />
                    </View>
                    <Text style={{ flex: 1, fontSize: 12, fontWeight: '800', color: isDark ? '#E5E7EB' : '#374151' }} numberOfLines={1}>{a.name}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', marginRight: 10, color: isDark ? '#6B7280' : '#9CA3AF' }}>{formatSize(a.size)}</Text>
                    <TouchableOpacity onPress={() => removeAttachment(idx)}>
                      <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <MaterialCommunityIcons name="cloud-upload-outline" size={36} color={isDark ? '#4B5563' : '#D1D5DB'} />
                  <Text style={{ fontSize: 12, fontWeight: '600', marginTop: 6, color: isDark ? '#6B7280' : '#9CA3AF' }}>Tap the icons above to attach files</Text>
                </View>
              )}
            </Card>

            <ActionBtn onPress={() => { handlePost(); setShowCreateModal(null); }} loading={submitting} title="Post Homework" icon="send" />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── CREATE SUBJECT MODAL ── */}
      <Modal transparent visible={showCreateModal === 'subject'} onRequestClose={() => setShowCreateModal(null)} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
          <PickerHeader title={editingSubject ? 'Edit Subject' : 'New Subject'} onClose={() => { resetSubjectForm(); setShowCreateModal(null); }} />
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...(Platform.OS === 'ios' ? { automaticallyAdjustKeyboardInsets: true } : {})}>
            <Card isDark={isDark} className="mb-5">
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: newSubjectColor }}>
                  <MaterialCommunityIcons name={newSubjectIcon as any} size={20} color="white" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#fff' : '#111827' }}>{editingSubject ? 'Edit Subject' : 'New Subject'}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#9CA3AF' : '#6B7280' }}>{editingSubject ? 'Update subject details' : 'Map it to a class for quick posting'}</Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: isDark ? '#3a3a32' : '#FDE68A', marginBottom: 16 }} />
              <Survey label="Subject Name" icon="book" value={newSubjectName} onChange={setNewSubjectName} placeholder="e.g. Mathematics" isDark={isDark} />
              {user?.role === 'master_admin' ? (
                <View style={{ marginBottom: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons name="office-building" size={16} color={brand} />
                    <Text style={{ fontSize: 12, fontWeight: '800', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#FBBF24' : '#B45309' }}>Branch</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {branches.length === 0 ? (
                      <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#9CA3AF' : '#6B7280', paddingVertical: 10 }}>No branches available yet. Create one in Branch Management first.</Text>
                    ) : branches.map((br: any) => {
                      const active = newSubjectBranchId === Number(br.id);
                      return (
                        <TouchableOpacity key={br.id} activeOpacity={0.8} onPress={() => setNewSubjectBranchId(Number(br.id))}
                          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginRight: 8, borderWidth: 2, borderColor: active ? brand : (isDark ? '#4B5563' : '#E5E7EB'), backgroundColor: active ? brand : (isDark ? '#24241e' : '#FFFFFF') }}>
                          <MaterialCommunityIcons name={active ? 'check-circle' : 'office-building'} size={16} color={active ? '#fff' : (isDark ? '#D1D5DB' : '#6B7280')} style={{ marginRight: 6 }} />
                          <Text style={{ fontWeight: '800', fontSize: 13, color: active ? '#fff' : (isDark ? '#D1D5DB' : '#374151') }}>{br.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
              <View style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="shape" size={16} color={brand} />
                  <Text style={{ fontSize: 12, fontWeight: '800', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#FBBF24' : '#B45309' }}>Link to Class</Text>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowNewBatchPicker(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#24241e' : '#FFFFFF', borderWidth: 2, borderColor: isDark ? '#4B5563' : '#FDE68A', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <MaterialCommunityIcons name="google-classroom" size={18} color={brand} />
                  <Text style={{ flex: 1, fontWeight: '700', fontSize: 13, marginHorizontal: 10, color: newSubjectBatchId ? (isDark ? '#fff' : '#111827') : (isDark ? '#6B7280' : '#9CA3AF') }}>
                    {newSubjectBatchId ? batches.find(b => b.id === newSubjectBatchId)?.name || 'Select' : 'None (optional)'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <View style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="palette" size={16} color={brand} />
                  <Text style={{ fontSize: 12, fontWeight: '800', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#FBBF24' : '#B45309' }}>Icon & Color</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowSubjectIconPicker(true)} style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: newSubjectColor }}>
                    <MaterialCommunityIcons name={newSubjectIcon as any} size={26} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowSubjectColorPicker(true)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 2, borderColor: isDark ? '#4B5563' : '#E5E7EB', borderStyle: 'dashed', backgroundColor: isDark ? '#24241e' : '#FFFFFF' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: newSubjectColor }}>
                      <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                    </View>
                    <Text style={{ flex: 1, fontWeight: '800', fontSize: 13, color: isDark ? '#D1D5DB' : '#4B5563' }}>Pick Color</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <ActionBtn onPress={() => { handleSaveSubject(); setShowCreateModal(null); }} loading={creatingSubject} title={editingSubject ? 'Update' : 'Create'} icon={editingSubject ? 'content-save' : 'plus-circle'} />
                </View>
                {editingSubject && (
                  <TouchableOpacity onPress={resetSubjectForm} style={{ width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#9CA3AF' }} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── CREATE BATCH MODAL ── */}
      <Modal transparent visible={showCreateModal === 'batch'} onRequestClose={() => setShowCreateModal(null)} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
          <PickerHeader title={editingBatch ? 'Edit Class' : 'New Class'} onClose={() => { resetBatchForm(); setShowCreateModal(null); }} />
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...(Platform.OS === 'ios' ? { automaticallyAdjustKeyboardInsets: true } : {})}>
            <Card isDark={isDark} className="mb-5">
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: newBatchColor }}>
                  <MaterialCommunityIcons name={newBatchIcon as any} size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#fff' : '#111827' }}>{editingBatch ? 'Edit Class' : 'New Class'}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#9CA3AF' : '#6B7280' }}>{editingBatch ? 'Update class details' : 'Create a batch and add students'}</Text>
                </View>
                {editingBatch && (
                  <TouchableOpacity onPress={resetBatchForm} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ height: 1, backgroundColor: isDark ? '#3a3a32' : '#FDE68A', marginBottom: 16 }} />
              <Survey label="Class Name" icon="google-classroom" value={newBatchName} onChange={setNewBatchName} placeholder="e.g. Morning Batch A" isDark={isDark} />
              <Survey label="Description" icon="text-long" value={newBatchDesc} onChange={setNewBatchDesc} placeholder="Optional description" isDark={isDark} />
              {user?.role === 'master_admin' ? (
                <View style={{ marginBottom: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons name="office-building" size={16} color={brand} />
                    <Text style={{ fontSize: 12, fontWeight: '800', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#FBBF24' : '#B45309' }}>Branch</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {branches.length === 0 ? (
                      <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#9CA3AF' : '#6B7280', paddingVertical: 10 }}>No branches available yet. Create one in Branch Management first.</Text>
                    ) : branches.map((br: any) => {
                      const active = newBatchBranchId === Number(br.id);
                      return (
                        <TouchableOpacity key={br.id} activeOpacity={0.8} onPress={() => setNewBatchBranchId(Number(br.id))}
                          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginRight: 8, borderWidth: 2, borderColor: active ? brand : (isDark ? '#4B5563' : '#E5E7EB'), backgroundColor: active ? brand : (isDark ? '#24241e' : '#FFFFFF') }}>
                          <MaterialCommunityIcons name={active ? 'check-circle' : 'office-building'} size={16} color={active ? '#fff' : (isDark ? '#D1D5DB' : '#6B7280')} style={{ marginRight: 6 }} />
                          <Text style={{ fontWeight: '800', fontSize: 13, color: active ? '#fff' : (isDark ? '#D1D5DB' : '#374151') }}>{br.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
              <View style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="palette" size={16} color={brand} />
                  <Text style={{ fontSize: 12, fontWeight: '800', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#FBBF24' : '#B45309' }}>Icon & Color</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowBatchIconPicker(true)} style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: newBatchColor }}>
                    <MaterialCommunityIcons name={newBatchIcon as any} size={26} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowBatchColorPicker(true)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 2, borderColor: isDark ? '#4B5563' : '#E5E7EB', borderStyle: 'dashed', backgroundColor: isDark ? '#24241e' : '#FFFFFF' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: newBatchColor }}>
                      <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                    </View>
                    <Text style={{ flex: 1, fontWeight: '800', fontSize: 13, color: isDark ? '#D1D5DB' : '#4B5563' }}>Pick Color</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <ActionBtn onPress={() => { handleSaveBatch(); setShowCreateModal(null); }} loading={creatingBatch} title={editingBatch ? 'Update' : 'Create'} icon={editingBatch ? 'content-save' : 'plus-circle'} />
                </View>
                {editingBatch && (
                  <TouchableOpacity onPress={resetBatchForm} style={{ width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#9CA3AF' }} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── MANAGE BATCH STUDENTS MODAL ── */}
      <Modal transparent visible={!!selectedManageBatch} onRequestClose={() => setSelectedManageBatch(null)} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
          <PickerHeader title={selectedManageBatch?.name || 'Manage Class'} onClose={() => setSelectedManageBatch(null)} />
          <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <MaterialCommunityIcons name="account-group" size={20} color="#8B5CF6" />
              <Text style={{ fontSize: 16, fontWeight: '900', marginLeft: 8, color: isDark ? '#fff' : '#111827' }}>Students ({batchStudents.length})</Text>
            </View>
            {batchStudents.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 44, backgroundColor: '#F9FAFB', borderRadius: 24, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed' }}>
                <MaterialCommunityIcons name="account-off" size={48} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', fontWeight: '700', fontSize: 14, marginTop: 12 }}>No students in this class</Text>
                <Text style={{ color: '#B0B7C3', fontSize: 12, marginTop: 4 }}>Tap + to add students</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {batchStudents.map(st => (
                  <View key={st.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, marginBottom: 10, backgroundColor: isDark ? '#24241e' : '#FDF6EC', borderWidth: 1, borderColor: isDark ? '#3a3a35' : '#FDE68A' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <MaterialCommunityIcons name="account" size={18} color="#8B5CF6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '800', fontSize: 14, color: isDark ? '#fff' : '#1F2937' }}>{st.name}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280' }}>ID: {st.student_id || st.studentId || st.id}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { removeStudentFromBatch(st.id); }} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="account-remove" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowStudentPicker(true)}
              style={{ marginTop: 16, marginBottom: 24, borderRadius: 18, overflow: 'hidden', elevation: 6, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10 }}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => setShowStudentPicker(true)} style={{ paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="account-plus" size={20} color="white" />
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 14, marginLeft: 8 }}>Add Student</Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── ATTACHMENT PREVIEW MODAL ── */}
      <Modal transparent visible={!!previewAttachment} onRequestClose={closePreview} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
            <TouchableOpacity onPress={closePreview} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontWeight: '900', fontSize: 15, color: '#FFF' }} numberOfLines={1}>{previewAttachment?.name}</Text>
              <Text style={{ fontWeight: '600', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                {previewType === 'pdf' ? 'PDF Preview' : previewType === 'image' ? 'Image Preview' : 'File Preview'}
                {previewAttachment?.size ? ` • ${formatSize(previewAttachment.size)}` : ''}
              </Text>
            </View>
            {previewAttachment?.uri && (
              <TouchableOpacity onPress={() => previewAttachment && handleDownloadAttachment(previewAttachment)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                <MaterialCommunityIcons name="download" size={22} color="white" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={closePreview} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            {previewType === 'image' && previewUri ? (
              <ZoomableImage uri={previewUri} />
            ) : null}
            {previewType === 'remote' && previewUri ? (
              <WebView source={{ uri: previewUri }} style={{ flex: 1, backgroundColor: '#000' }} />
            ) : null}
            {previewType === 'pdf' && pdfUri ? (
              <Pdf
                ref={pdfRef}
                source={{ uri: pdfUri }}
                style={{ flex: 1, backgroundColor: '#000' }}
                trustAllCerts
                horizontal
                enablePaging
                onLoadComplete={(numberOfPages: number, path: string) => {
                  setPdfTotalPages(numberOfPages);
                  setPdfCurrentPage(1);
                  setPdfLoading(false);
                }}
                onPageChanged={(page: number, total: number) => setPdfCurrentPage(page)}
                onError={(error: any) => {
                  setPdfLoading(false);
                  Alert.alert('Error', `Failed to load PDF. ${error?.message || 'Unknown error'}`, [
                    { text: 'Close', style: 'cancel' },
                    { text: 'Open with another app', onPress: () => { if (pdfUri) Sharing.shareAsync(pdfUri, { mimeType: 'application/pdf', dialogTitle: previewAttachment?.name || 'Open PDF' }).catch(() => {}); } },
                  ]);
                }}
              />
            ) : null}
            {previewType === 'pdf' && pdfTotalPages > 0 && (
              <View style={{ position: 'absolute', left: 16, right: 16, bottom: 24, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 }}>
                <View
                  onLayout={(e) => { seekBarWidth.current = e.nativeEvent.layout.width; }}
                  {...seekPanResponder.panHandlers}
                  style={{ height: 36, justifyContent: 'center' }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: '#F59E0B', width: `${(pdfCurrentPage / pdfTotalPages) * 100}%` }} />
                  </View>
                  <View
                    style={{
                      position: 'absolute',
                      left: Math.max(0, Math.min(seekBarWidth.current - 24, (pdfCurrentPage / pdfTotalPages) * seekBarWidth.current - 12)),
                      width: 24, height: 24, borderRadius: 12, backgroundColor: '#F59E0B', borderWidth: 3, borderColor: '#FFF',
                      shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 4,
                    }}
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Page {pdfCurrentPage}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 11 }}>of {pdfTotalPages}</Text>
                </View>
              </View>
            )}
            {previewType === 'pdf' && pdfLoading && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 12, marginTop: 12 }}>Loading PDF...</Text>
              </View>
            )}
            {previewAttachment && !previewType && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="file-outline" size={56} color="#6B7280" />
                <Text style={{ color: '#9CA3AF', fontWeight: '600', fontSize: 13, marginTop: 12 }}>Preview not available</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}