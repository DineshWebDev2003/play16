import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }
interface Attachment { uri: string; name: string; type: string; size: number; }
interface Batch { id: number; name: string; description?: string; students_count?: number; icon?: string; color?: string; }
interface Subject { id: number; name: string; batch_id: number | null; batch?: Batch | null; branch_id?: number; icon?: string; color?: string; }
interface AppUser { id: number; name: string; role: string; batch_id?: number | null; username?: string; }

const ICONS = ['book-education', 'book', 'bookmark', 'book-open-variant', 'book-plus', 'bookshelf', 'school', 'google-classroom', 'shape', 'shape-plus', 'star', 'star-outline', 'fire', 'flash', 'lightbulb', 'lightbulb-on', 'pencil', 'pen', 'abacus', 'calculator', 'sigma', 'function', 'math-compass', 'drawing', 'palette', 'music', 'microphone', 'chemistry', 'flask', 'earth', 'map', 'compass', 'basketball', 'football', 'swim', 'run', 'food-apple', 'food', 'heart', 'account-group', 'account-star', 'crown', 'diamond', 'trophy', 'medal', 'flag', 'rocket', 'airplane', 'car', 'bus', 'train', 'phone', 'cellphone', 'laptop', 'monitor', 'tablet', 'headphones', 'camera', 'video', 'filmstrip', 'gamepad', 'puzzle', 'toy-brick', 'robot', 'cloud', 'moon', 'weather-sunny', 'weather-night', 'flower', 'pine-tree', 'paw', 'cat', 'dog'];

const COLORS = ['#D97706', '#8B5CF6', '#EF4444', '#3B82F6', '#10B981', '#F97316', '#EC4899', '#06B6D4', '#84CC16', '#14B8A6', '#6366F1', '#F43F5E'];

const Input = React.memo(({ label, value, onChange, placeholder, multiline, icon, isDark }: {
  label: string; value: string; onChange: (t: string) => void; placeholder: string; multiline?: boolean; icon: string; isDark: boolean;
}) => (
  <View className="mb-5">
    <View className="flex-row items-center mb-2">
      <MaterialCommunityIcons name={icon as any} size={16} color="#D97706" />
      <Text className={`text-xs font-bold ml-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{label}</Text>
    </View>
    <TextInput
      className={`${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-amber-50 border-amber-200 text-gray-900'} border-2 rounded-2xl px-5 font-semibold ${multiline ? 'py-4 min-h-[150px]' : 'py-5'}`}
      placeholder={placeholder} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
      value={value} onChangeText={onChange} multiline={multiline}
      {...(multiline ? { numberOfLines: 6, textAlignVertical: 'top' as const } : {})}
    />
  </View>
));

const Chip = React.memo(({ label, active, onPress, isDark }: { label: string; active: boolean; onPress: () => void; isDark: boolean }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}
    className={`px-4 py-2.5 rounded-xl mr-2 flex-row items-center ${active ? 'bg-amber-400' : isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
    {active && <MaterialCommunityIcons name="check" size={14} color="#92400E" />}
    <Text className={`font-bold text-xs ${active ? 'text-amber-900' : isDark ? 'text-gray-300' : 'text-gray-600'}`}>{label}</Text>
  </TouchableOpacity>
));

const Card = React.memo(({ children, isDark, className }: { children: React.ReactNode; isDark: boolean; className?: string }) => (
  <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-amber-200'} rounded-3xl p-5 border-2 ${className || ''}`}>
    {children}
  </View>
));

const ActionBtn = React.memo(({ onPress, loading, title, icon }: {
  onPress: () => void; loading?: boolean; title: string; icon: string;
}) => (
  <TouchableOpacity onPress={onPress} disabled={loading}
    className="py-4 rounded-2xl items-center flex-row justify-center bg-amber-400" activeOpacity={0.7}>
    {loading ? <ActivityIndicator size="small" color="#92400E" /> : (
      <><MaterialCommunityIcons name={icon as any} size={20} color="#92400E" /><Text className="text-amber-900 font-black text-base ml-2.5">{title}</Text></>
    )}
  </TouchableOpacity>
));

const PickerModal = React.memo(({ visible, onClose, title, children, isDark }: {
  visible: boolean; onClose: () => void; title?: string; children: React.ReactNode; isDark: boolean;
}) => (
  <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
    <TouchableOpacity activeOpacity={1} onPress={onClose} className="flex-1 bg-black/40" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}} className={`w-[88%] max-w-sm rounded-3xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`} style={{ elevation: 25 }}>
        {title && (
          <View className={`px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <Text className={`font-black text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</Text>
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
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <View className="flex-row items-center justify-between px-6 py-4 border-b" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
        <TouchableOpacity onPress={onClose} className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
          <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
        </TouchableOpacity>
        <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{title || 'Pick an Icon'}</Text>
        <View className="w-10" />
      </View>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap gap-3 justify-center pb-8">
          {ICONS.map(ico => (
            <TouchableOpacity key={ico} activeOpacity={0.7} onPress={() => { onSelect(ico); onClose(); }}
              className={`w-14 h-14 rounded-2xl items-center justify-center ${selected === ico ? 'bg-amber-400' : isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <MaterialCommunityIcons name={ico as any} size={26} color={selected === ico ? '#92400E' : isDark ? '#D1D5DB' : '#6B7280'} />
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
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <View className="flex-row items-center justify-between px-6 py-4 border-b" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
        <TouchableOpacity onPress={onClose} className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
          <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
        </TouchableOpacity>
        <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{title || 'Pick a Color'}</Text>
        <View className="w-10" />
      </View>
      <View className="flex-1 px-6 pt-6">
        {/* Preview */}
        <View className={`items-center py-10 rounded-3xl mb-8 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <MaterialCommunityIcons name={(icon || 'palette') as any} size={56} color={selected} />
          <Text className="text-lg font-black mt-3" style={{ color: selected }}>{selected}</Text>
        </View>
        {/* Color grid */}
        <View className="flex-row flex-wrap gap-3 justify-center pb-8">
          {COLORS.map(c => (
            <TouchableOpacity key={c} activeOpacity={0.7} onPress={() => onSelect(c)}
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: c, borderWidth: selected === c ? 4 : 0, borderColor: selected === c ? (isDark ? '#FFF' : '#000') : 'transparent', transform: selected === c ? [{ scale: 1.1 }] : [] }}>
              {selected === c && <MaterialCommunityIcons name="check" size={24} color={isDark ? '#FFF' : '#FFF'} />}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={onClose}
          className="py-4 rounded-2xl items-center justify-center bg-amber-400 mt-4" activeOpacity={0.7}>
          <Text className="text-amber-900 font-black text-base">Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </Modal>
);

// ── Main Screen ──
export default function PostHomeworkScreen({ navigation }: Props) {
  const { user } = useAuth();
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
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showHomeworkStudentPicker, setShowHomeworkStudentPicker] = useState(false);

  // Subject form state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectBatchId, setNewSubjectBatchId] = useState<number | null>(null);
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
    setNewSubjectName(''); setNewSubjectBatchId(null); setNewSubjectIcon('book-education'); setNewSubjectColor('#D97706'); setEditingSubject(null);
  }, []);

  const handleSaveSubject = useCallback(async () => {
    if (!newSubjectName.trim()) { Alert.alert('Required', 'Subject name is required.'); return; }
    setCreatingSubject(true);
    try {
      const p: any = { name: newSubjectName.trim(), icon: newSubjectIcon, color: newSubjectColor };
      if (newSubjectBatchId) p.batch_id = newSubjectBatchId;
      if (user?.branch_id) p.branch_id = user.branch_id;
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
    setNewSubjectName(s.name); setNewSubjectBatchId(s.batch_id); setNewSubjectIcon(s.icon || 'book-education'); setNewSubjectColor(s.color || '#D97706'); setEditingSubject(s);
  }, []);

  // ── Batch CRUD ──
  const resetBatchForm = useCallback(() => {
    setNewBatchName(''); setNewBatchDesc(''); setNewBatchIcon('google-classroom'); setNewBatchColor('#8B5CF6'); setEditingBatch(null);
  }, []);

  const handleSaveBatch = useCallback(async () => {
    if (!newBatchName.trim()) { Alert.alert('Required', 'Batch name is required.'); return; }
    setCreatingBatch(true);
    try {
      const p: any = { name: newBatchName.trim(), icon: newBatchIcon, color: newBatchColor };
      if (newBatchDesc.trim()) p.description = newBatchDesc.trim();
      if (user?.branch_id) p.branch_id = user.branch_id;
      if (editingBatch) { await api.put(`/batches/${editingBatch.id}`, p); } else { await api.post('/batches', p); }
      resetBatchForm(); await loadBatches();
      Alert.alert('Success', editingBatch ? 'Class updated.' : 'Class created.');
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed.'); }
    setCreatingBatch(false);
  }, [newBatchName, newBatchDesc, newBatchIcon, newBatchColor, editingBatch, user, loadBatches, resetBatchForm]);

  const deleteBatch = useCallback(async (id: number) => {
    Alert.alert('Delete Class', 'Students will be unassigned. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/batches/${id}`); await loadBatches(); if (editingBatch?.id === id) resetBatchForm(); if (selectedManageBatch?.id === id) setSelectedManageBatch(null); } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed.'); }
      }},
    ]);
  }, [loadBatches, editingBatch, resetBatchForm, selectedManageBatch]);

  const startEditBatch = useCallback((b: Batch) => {
    setNewBatchName(b.name); setNewBatchDesc(b.description || ''); setNewBatchIcon(b.icon || 'google-classroom'); setNewBatchColor(b.color || '#8B5CF6'); setEditingBatch(b);
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
    if (!r.canceled) setAttachments(prev => [...prev, ...r.assets.map(a => ({ uri: a.uri, name: a.fileName || `img_${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg', size: a.fileSize || 0 }))]);
  }, []);
  const pickDocument = useCallback(async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], multiple: true, copyToCacheDirectory: true });
    if (!r.canceled && r.assets) setAttachments(prev => [...prev, ...r.assets.map(a => ({ uri: a.uri, name: a.name || `file_${Date.now()}`, type: a.mimeType || 'application/octet-stream', size: a.size || 0 }))]);
  }, []);
  const removeAttachment = useCallback((idx: number) => setAttachments(prev => prev.filter((_, i) => i !== idx)), []);
  const formatSize = (b: number) => { if (b < 1024) return `${b}B`; if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`; return `${(b / 1048576).toFixed(1)}MB`; };

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
  const batchStudents = selectedManageBatch ? allStudents.filter(s => s.batch_id === selectedManageBatch.id) : [];
  const unassignedStudents = selectedManageBatch ? allStudents.filter(s => !s.batch_id || s.batch_id !== selectedManageBatch.id) : [];

  // ── Full-screen Icon Picker ──
  const tabs = [
    { key: 'post' as const, label: 'Post', icon: 'send-circle' as any },
    { key: 'subjects' as const, label: 'Subjects', icon: 'book-education' as any },
    { key: 'classes' as const, label: 'Classes', icon: 'google-classroom' as any },
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      {/* Consistent Header */}
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4 bg-white border-2 border-amber-200 w-12 h-12 rounded-2xl items-center justify-center" activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={28} color="#000" />
            </TouchableOpacity>
            <Text className="text-4xl font-black text-gray-900 tracking-tighter">My</Text>
            <Text className="text-2xl font-bold text-amber-400">
              {tab === 'post' ? 'Homework' : tab === 'subjects' ? 'Subjects' : 'Classes'}
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={() => {
            if (tab === 'post') setShowCreateModal('post');
            else if (tab === 'subjects') setShowCreateModal('subject');
            else if (tab === 'classes') setShowCreateModal('batch');
          }} className="bg-pink-500 w-16 h-16 rounded-3xl items-center justify-center">
            <MaterialCommunityIcons name={tab === 'post' ? 'plus-circle' : tab === 'subjects' ? 'book-plus' : 'plus-circle-outline'} size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 relative">
        {/* ═══════════════════════  SUBJECTS TAB  ═══════════════════════ */}
      {tab === 'subjects' && (
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...(Platform.OS === 'ios' ? { automaticallyAdjustKeyboardInsets: true } : {})}>
          {subjects.length === 0 ? (
            <View className="py-16 items-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 mt-4">
              <MaterialCommunityIcons name="book-off" size={52} color="#D1D5DB" />
              <Text className="text-gray-400 font-bold text-base mt-4">No subjects yet</Text>
              <Text className="text-gray-400 text-xs mt-1">Tap + to create your first subject</Text>
            </View>
          ) : (
            <View className="mb-12 mt-4">
              <View className="flex-row items-center mb-4 px-1">
                <MaterialCommunityIcons name="bookshelf" size={22} color="#D97706" />
                <Text className={`text-xl font-black ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Saved Subjects</Text>
                <View className="ml-auto bg-amber-100 rounded-full px-3 py-1">
                  <Text className="text-amber-700 font-black text-xs">{subjects.length}</Text>
                </View>
              </View>
              {subjects.map((s) => (
                <View key={s.id} className="bg-amber-50 rounded-2xl mb-3 overflow-hidden"
                  style={{ borderLeftWidth: 5, borderLeftColor: s.color || '#D97706' }}>
                  <View className="flex-row items-center px-4 py-5">
                    <View className="w-11 h-11 rounded-2xl items-center justify-center mr-5" style={{ backgroundColor: s.color || '#D97706' }}>
                      <MaterialCommunityIcons name={(s.icon || 'book-education') as any} size={22} color="white" />
                    </View>
                    <TouchableOpacity className="flex-1" activeOpacity={0.7} onPress={() => startEditSubject(s)}>
                      <Text className={`font-black text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.name}</Text>
                      <Text className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.batch?.name || 'No class mapped'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteSubject(s.id)} className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center">
                      <MaterialCommunityIcons name="trash-can" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ═══════════════════════  CLASSES TAB  ═══════════════════════ */}
      {tab === 'classes' && (
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...(Platform.OS === 'ios' ? { automaticallyAdjustKeyboardInsets: true } : {})}>
          <View className="mb-8 mt-4">
            <View className="flex-row items-center mb-4 px-1">
              <MaterialCommunityIcons name="google-classroom" size={22} color="#D97706" />
              <Text className={`text-xl font-black ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>All Classes</Text>
              <View className="ml-auto bg-amber-100 rounded-full px-3 py-1">
                <Text className="text-amber-700 font-black text-xs">{batches.length}</Text>
              </View>
            </View>
            {batches.length === 0 ? (
              <View className="py-16 items-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <MaterialCommunityIcons name="shape-outline" size={52} color="#D1D5DB" />
                <Text className="text-gray-400 font-bold text-base mt-4">No classes yet</Text>
                <Text className="text-gray-400 text-xs mt-1">Tap + to create your first class</Text>
              </View>
            ) : batches.map(b => {
              const studentCount = allStudents.filter(s => s.batch_id === b.id).length;
              return (
                <View key={b.id} className="bg-amber-50 rounded-2xl mb-4 overflow-hidden"
                  style={{ borderLeftWidth: 6, borderLeftColor: b.color || '#8B5CF6' }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => { startEditBatch(b); setShowCreateModal('batch'); }}
                    className="flex-row items-center px-5 py-5">
                    <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: (b.color || '#8B5CF6') + '20' }}>
                      <MaterialCommunityIcons name={(b.icon || 'google-classroom') as any} size={26} color={b.color || '#8B5CF6'} />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-black text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{b.name}</Text>
                      <Text className={`text-xs font-bold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{studentCount} students</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteBatch(b.id)} className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center">
                      <MaterialCommunityIcons name="trash-can" size={18} color="#EF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedManageBatch(b)} className="w-9 h-9 rounded-xl bg-purple-50 items-center justify-center ml-2">
                      <MaterialCommunityIcons name="account-details" size={18} color="#8B5CF6" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ═══════════════════════  POST TAB  ═══════════════════════ */}
      {tab === 'post' && (
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...(Platform.OS === 'ios' ? { automaticallyAdjustKeyboardInsets: true } : {})}>
          <View className="mb-8 mt-4">
            <View className="flex-row items-center mb-4 px-1">
              <MaterialCommunityIcons name="book-plus" size={22} color="#D97706" />
              <Text className={`text-xl font-black ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Homework Posts</Text>
              <View className="ml-auto bg-amber-100 rounded-full px-3 py-1">
                <Text className="text-amber-700 font-black text-xs">{homeworks.length}</Text>
              </View>
            </View>
            {loadingHomeworks ? (
              <View className="py-20 items-center">
                <ActivityIndicator size="large" color="#D97706" />
              </View>
            ) : homeworks.length === 0 ? (
              <View className="py-16 items-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <MaterialCommunityIcons name="book-off" size={52} color="#D1D5DB" />
                <Text className="text-gray-400 font-bold text-base mt-4">No homework posted yet</Text>
                <Text className="text-gray-400 text-xs mt-1">Tap + to post your first homework</Text>
              </View>
            ) : homeworks.map(h => (
              <View key={h.id} className="bg-amber-50 rounded-2xl mb-3 overflow-hidden"
                style={{ borderLeftWidth: 5, borderLeftColor: h.subject?.color || '#D97706' }}>
                <View className="px-5 py-4">
                  <View className="flex-row items-center mb-2">
                    <View className="w-8 h-8 rounded-xl items-center justify-center mr-2.5" style={{ backgroundColor: (h.subject?.color || '#D97706') + '20' }}>
                      <MaterialCommunityIcons name={(h.subject?.icon || 'book-education') as any} size={16} color={h.subject?.color || '#D97706'} />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-black text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{h.title}</Text>
                      <Text className={`text-[11px] font-bold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{h.subject?.name} · {h.batch?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteHomework(h.id)} className="w-8 h-8 rounded-xl bg-red-50 items-center justify-center">
                      <MaterialCommunityIcons name="trash-can" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  {h.description ? (
                    <Text className={`text-xs font-semibold leading-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} numberOfLines={2}>{h.description}</Text>
                  ) : null}
                  <View className="flex-row items-center mt-3 gap-3">
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="calendar" size={13} color="#EF4444" />
                      <Text className="text-[11px] font-bold text-red-500 ml-1">{h.due_date || 'No due date'}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="paperclip" size={13} color="#8B5CF6" />
                      <Text className="text-[11px] font-bold text-purple-400 ml-1">{h.attachments?.length || 0}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── FULL-SCREEN CLASS PICKER ── */}
      <Modal transparent visible={showClassPicker} onRequestClose={() => setShowClassPicker(false)} animationType="slide">
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between px-6 py-4 border-b-2" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity onPress={() => setShowClassPicker(false)} className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
              <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
            </TouchableOpacity>
            <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Select Class</Text>
            <TouchableOpacity onPress={() => { setSelectedBatch(null); setShowClassPicker(false); }} className="px-4 py-2 rounded-xl bg-amber-100">
              <Text className="text-amber-700 font-black text-xs">All</Text>
            </TouchableOpacity>
          </View>
          {batches.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <MaterialCommunityIcons name="google-classroom" size={48} color="#9CA3AF" />
              <Text className="text-gray-400 font-bold text-sm mt-3">No classes available</Text>
            </View>
          ) : (
            <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
              {batches.map(b => {
                const active = selectedBatch === b.id;
                const studentCount = allStudents.filter(s => s.batch_id === b.id).length;
                return (
                  <TouchableOpacity key={b.id} activeOpacity={0.7} onPress={() => { setSelectedBatch(b.id); setShowClassPicker(false); }}
                    className={`flex-row items-center p-4 rounded-2xl mb-3 ${active ? 'bg-amber-400' : isDark ? 'bg-gray-800' : 'bg-white'}`}
                    style={{ borderWidth: 2, borderColor: active ? '#D97706' : isDark ? '#4B5563' : '#F3F4F6' }}>
                    <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: b.color || '#8B5CF6' }}>
                      <MaterialCommunityIcons name={(b.icon || 'google-classroom') as any} size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-black text-base ${active ? 'text-amber-900' : isDark ? 'text-white' : 'text-gray-900'}`}>{b.name}</Text>
                      <Text className={`text-xs font-bold mt-0.5 ${active ? 'text-amber-800' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>{studentCount} students</Text>
                    </View>
                    {active && <MaterialCommunityIcons name="check-circle" size={24} color="#92400E" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ── FULL-SCREEN STUDENT PICKER (homework assignment) ── */}
      <Modal transparent visible={showHomeworkStudentPicker} onRequestClose={() => setShowHomeworkStudentPicker(false)} animationType="slide">
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between px-6 py-4 border-b-2" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity onPress={() => setShowHomeworkStudentPicker(false)} className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
              <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
            </TouchableOpacity>
            <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Assign to Students</Text>
            <TouchableOpacity onPress={() => { setSelectedStudents([]); setShowHomeworkStudentPicker(false); }} className="px-4 py-2 rounded-xl bg-amber-100">
              <Text className="text-amber-700 font-black text-xs">Clear</Text>
            </TouchableOpacity>
          </View>
          {allStudents.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <MaterialCommunityIcons name="account-off" size={48} color="#9CA3AF" />
              <Text className="text-gray-400 font-bold text-sm mt-3">No students available</Text>
              <Text className="text-gray-400 text-xs mt-1">Create tuition students in Manage Users</Text>
            </View>
          ) : (
            <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
              <View className="mb-3">
                <Text className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedStudents.length > 0 ? `${selectedStudents.length} selected` : 'Tap students to assign this homework to them'}
                </Text>
              </View>
              {allStudents.map(st => {
                const active = selectedStudents.includes(st.id);
                const batch = batches.find(b => b.id === st.batch_id);
                return (
                  <TouchableOpacity key={st.id} activeOpacity={0.7} onPress={() => toggleStudent(st.id)}
                    className={`flex-row items-center p-4 rounded-2xl mb-3 ${active ? 'bg-amber-400' : isDark ? 'bg-gray-800' : 'bg-white'}`}
                    style={{ borderWidth: 2, borderColor: active ? '#D97706' : isDark ? '#4B5563' : '#F3F4F6' }}>
                    <View className="w-11 h-11 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: active ? '#92400E' : '#8B5CF6' }}>
                      <MaterialCommunityIcons name="account" size={22} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-black text-base ${active ? 'text-amber-900' : isDark ? 'text-white' : 'text-gray-900'}`}>{st.name}</Text>
                      <Text className={`text-xs font-bold mt-0.5 ${active ? 'text-amber-800' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {batch?.name || 'No class'}
                      </Text>
                    </View>
                    <View className={`w-6 h-6 rounded-lg items-center justify-center ${active ? 'bg-white' : isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {active && <MaterialCommunityIcons name="check" size={16} color="#D97706" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity onPress={() => setShowHomeworkStudentPicker(false)} activeOpacity={0.7}
                className="py-4 rounded-2xl items-center bg-amber-400 mt-2 mb-8" >
                <Text className="text-amber-900 font-black text-base">Done ({selectedStudents.length} selected)</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ── FULL-SCREEN LINK TO CLASS ── */}
      <Modal transparent visible={showNewBatchPicker} onRequestClose={() => setShowNewBatchPicker(false)} animationType="slide">
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between px-6 py-4 border-b-2" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity onPress={() => setShowNewBatchPicker(false)} className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
              <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
            </TouchableOpacity>
            <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Link to Class</Text>
            <TouchableOpacity onPress={() => { setNewSubjectBatchId(null); setShowNewBatchPicker(false); }} className="px-4 py-2 rounded-xl bg-amber-100">
              <Text className="text-amber-700 font-black text-xs">None</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
            {batches.length === 0 ? (
              <View className="py-20 items-center">
                <MaterialCommunityIcons name="google-classroom" size={48} color="#9CA3AF" />
                <Text className="text-gray-400 font-bold text-sm mt-3">No classes available</Text>
              </View>
            ) : batches.map(b => {
              const active = newSubjectBatchId === b.id;
              return (
                <TouchableOpacity key={b.id} activeOpacity={0.7} onPress={() => { setNewSubjectBatchId(b.id); setShowNewBatchPicker(false); }}
                  className={`flex-row items-center p-4 rounded-2xl mb-3 ${active ? 'bg-amber-400' : isDark ? 'bg-gray-800' : 'bg-white'}`}
                  style={{ borderWidth: 2, borderColor: active ? '#D97706' : isDark ? '#4B5563' : '#F3F4F6' }}>
                  <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: b.color || '#8B5CF6' }}>
                    <MaterialCommunityIcons name={(b.icon || 'google-classroom') as any} size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-black text-base ${active ? 'text-amber-900' : isDark ? 'text-white' : 'text-gray-900'}`}>{b.name}</Text>
                  </View>
                  {active && <MaterialCommunityIcons name="check-circle" size={24} color="#92400E" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── FULL-SCREEN SUBJECT PICKER ── */}
      <Modal transparent visible={showSubjectPicker} onRequestClose={() => setShowSubjectPicker(false)} animationType="slide">
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between px-6 py-4 border-b-2" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity onPress={() => setShowSubjectPicker(false)} className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
              <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
            </TouchableOpacity>
            <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Pick a Subject</Text>
            <TouchableOpacity onPress={() => { setSelectedSubjectId(null); setShowSubjectPicker(false); }} className="px-4 py-2 rounded-xl bg-amber-100">
              <Text className="text-amber-700 font-black text-xs">All</Text>
            </TouchableOpacity>
          </View>
          {subjects.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <MaterialCommunityIcons name="book-off" size={48} color="#9CA3AF" />
              <Text className="text-gray-400 font-bold text-sm mt-3">No subjects yet</Text>
              <Text className="text-gray-400 text-xs mt-1">Create one in Subjects tab</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1" contentContainerClassName="px-4 py-6 items-start">
              <View className="flex-row gap-4">
                {subjects.map(s => {
                  const active = selectedSubjectId === s.id;
                  return (
                    <TouchableOpacity key={s.id} activeOpacity={0.7} onPress={() => { setSelectedSubjectId(s.id); setShowSubjectPicker(false); }}
                      className={`p-5 rounded-3xl ${active ? 'bg-amber-400' : isDark ? 'bg-gray-800' : 'bg-white'}`}
                      style={{ width: 200, borderWidth: 2, borderColor: active ? '#D97706' : isDark ? '#4B5563' : '#F3F4F6' }}>
                      <View className="w-14 h-14 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: (s.color || '#D97706') + '30' }}>
                        <MaterialCommunityIcons name={(s.icon || 'book-education') as any} size={28} color={s.color || '#D97706'} />
                      </View>
                      <Text className={`font-black text-base mb-2 ${active ? 'text-amber-900' : isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={2}>{s.name}</Text>
                      {s.batch && (
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons name="shape" size={14} color={active ? '#92400E' : '#8B5CF6'} />
                          <Text className={`text-xs font-bold ml-1.5 ${active ? 'text-amber-800' : 'text-purple-500'}`}>{s.batch.name}</Text>
                        </View>
                      )}
                      {active && (
                        <View className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white items-center justify-center">
                          <MaterialCommunityIcons name="check" size={18} color="#D97706" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      <PickerModal visible={showStudentPicker} onClose={() => setShowStudentPicker(false)} title={`Add to ${selectedManageBatch?.name || ''}`} isDark={isDark}>
        {unassignedStudents.length === 0 ? (
          <View className="px-5 py-8 items-center">
            <MaterialCommunityIcons name="account-check" size={36} color="#10B981" />
            <Text className="text-gray-400 font-bold text-sm mt-3">All students assigned</Text>
          </View>
        ) : (
          <ScrollView bounces={false} style={{ maxHeight: 350 }}>
            {unassignedStudents.map(st => (
              <TouchableOpacity key={st.id} activeOpacity={0.7} onPress={() => { assignStudentToBatch(st.id); setShowStudentPicker(false); }}
                className="flex-row items-center px-5 py-4 border-b border-gray-50">
                <View className="w-9 h-9 rounded-xl bg-purple-100 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="account-plus" size={18} color="#8B5CF6" />
                </View>
                <Text className={`flex-1 font-bold text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{st.name}</Text>
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
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between px-6 py-4 border-b-2" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity onPress={() => setShowCreateModal(null)} className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
              <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
            </TouchableOpacity>
            <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>New Homework</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...(Platform.OS === 'ios' ? { automaticallyAdjustKeyboardInsets: true } : {})}>
            <Card isDark={isDark} className="mb-4">
              <View className="flex-row items-center mb-4">
                <View className="w-9 h-9 rounded-xl bg-amber-100 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="book-plus" size={18} color="#D97706" />
                </View>
                <View>
                  <Text className={`font-black text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Class & Subject</Text>
                  <Text className={`text-[11px] font-semibold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Select where to assign this homework</Text>
                </View>
              </View>
              {isTuitionTeacher && (
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowClassPicker(true)}
                  className={`flex-row items-center px-4 py-4 rounded-2xl mb-3 ${selectedBatch ? 'bg-amber-400' : isDark ? 'bg-gray-800' : 'bg-amber-50'}`}
                  style={{ borderWidth: 2, borderColor: selectedBatch ? '#D97706' : isDark ? '#4B5563' : '#E5E7EB' }}>
                  <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: selectedBatch ? '#92400E20' : (isDark ? '#374151' : '#FEF3C7') }}>
                    <MaterialCommunityIcons name="google-classroom" size={18} color={selectedBatch ? '#92400E' : '#D97706'} />
                  </View>
                  <Text className={`flex-1 font-bold text-sm ml-1.5 ${selectedBatch ? 'text-amber-900' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedBatch ? batches.find(b => b.id === selectedBatch)?.name || 'Select' : 'Select Class'}
                  </Text>
                  {selectedBatch ? (
                    <TouchableOpacity onPress={() => { setSelectedBatch(null); setSelectedSubjectId(null); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <MaterialCommunityIcons name="close-circle" size={20} color="#92400E" />
                    </TouchableOpacity>
                  ) : (
                    <MaterialCommunityIcons name="chevron-down" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowSubjectPicker(true)}
                className={`flex-row items-center px-4 py-4 rounded-2xl ${selectedSubjectId ? 'bg-amber-400' : isDark ? 'bg-gray-800' : 'bg-amber-50'}`}
                style={{ borderWidth: 2, borderColor: selectedSubjectId ? '#D97706' : isDark ? '#4B5563' : '#E5E7EB' }}>
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: selectedSubjectId ? '#92400E20' : (isDark ? '#374151' : '#FEF3C7') }}>
                  <MaterialCommunityIcons name="book-education" size={18} color={selectedSubjectId ? '#92400E' : '#D97706'} />
                </View>
                <View className="flex-1 ml-1.5">
                  <Text className={`font-bold text-sm ${selectedSubjectId ? 'text-amber-900' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedSubjectObj ? selectedSubjectObj.name : 'Select Subject'}
                  </Text>
                  {selectedSubjectObj?.batch && (
                    <Text className="text-[11px] font-semibold text-purple-500 mt-0.5">{selectedSubjectObj.batch.name}</Text>
                  )}
                </View>
                {selectedSubjectId ? (
                  <TouchableOpacity onPress={() => { setSelectedSubjectId(null); setSelectedBatch(null); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#92400E" />
                  </TouchableOpacity>
                ) : (
                  <MaterialCommunityIcons name="chevron-down" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                )}
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowHomeworkStudentPicker(true)}
                className={`flex-row items-center px-4 py-4 rounded-2xl mt-3 ${selectedStudents.length > 0 ? 'bg-amber-400' : isDark ? 'bg-gray-800' : 'bg-amber-50'}`}
                style={{ borderWidth: 2, borderColor: selectedStudents.length > 0 ? '#D97706' : isDark ? '#4B5563' : '#E5E7EB' }}>
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: selectedStudents.length > 0 ? '#92400E20' : (isDark ? '#374151' : '#FEF3C7') }}>
                  <MaterialCommunityIcons name="account-multiple" size={18} color={selectedStudents.length > 0 ? '#92400E' : '#8B5CF6'} />
                </View>
                <View className="flex-1 ml-1.5">
                  <Text className={`font-bold text-sm ${selectedStudents.length > 0 ? 'text-amber-900' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedStudents.length > 0 ? `${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''} assigned` : 'Assign to Students (optional)'}
                  </Text>
                  {selectedStudents.length > 0 && (
                    <Text className="text-[11px] font-semibold text-amber-800 mt-0.5" numberOfLines={1}>
                      {selectedStudents.map(id => allStudents.find(s => s.id === id)?.name || `#${id}`).join(', ')}
                    </Text>
                  )}
                </View>
                <MaterialCommunityIcons name="chevron-down" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
              </TouchableOpacity>
            </Card>

            <Card isDark={isDark} className="mb-4">
              <View className="flex-row items-center mb-4">
                <View className="w-9 h-9 rounded-xl bg-amber-100 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="file-document-outline" size={18} color="#D97706" />
                </View>
                <View>
                  <Text className={`font-black text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Homework Details</Text>
                  <Text className={`text-[11px] font-semibold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Title, description & due date</Text>
                </View>
              </View>
              <View className="mb-4">
                <Text className={`text-[11px] font-bold mb-1.5 ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>TITLE <Text className="text-red-500">*</Text></Text>
                <View className={`flex-row items-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-amber-50 border-amber-200'} border-2 rounded-2xl px-4`} style={{ height: 52 }}>
                  <MaterialCommunityIcons name="format-text" size={18} color="#D97706" />
                  <TextInput className={`flex-1 font-bold text-base ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`} placeholder="e.g. Chapter 5: Algebra Basics" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} value={title} onChangeText={setTitle} />
                </View>
              </View>
              <View className="mb-4">
                <Text className={`text-[11px] font-bold mb-1.5 ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>DESCRIPTION <Text className="text-red-500">*</Text></Text>
                <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-amber-50 border-amber-200'} border-2 rounded-2xl px-4 pt-3.5`}>
                  <TextInput className={`font-semibold text-sm leading-5 pb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`} placeholder="Describe the assignment in detail..." placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} multiline numberOfLines={5} textAlignVertical="top" value={description} onChangeText={setDescription} />
                </View>
              </View>
              <View>
                <Text className={`text-[11px] font-bold mb-1.5 ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>DUE DATE <Text className="text-red-500">*</Text></Text>
                <View className={`flex-row items-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-amber-50 border-amber-200'} border-2 rounded-2xl px-4`} style={{ height: 52 }}>
                  <MaterialCommunityIcons name="calendar" size={18} color="#D97706" />
                  <TextInput className={`flex-1 font-bold text-sm ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`} placeholder="e.g. 2026-08-15 or Tomorrow" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} value={dueDate} onChangeText={setDueDate} />
                </View>
              </View>
            </Card>

            <Card isDark={isDark} className="mb-4">
              <View className="flex-row items-center mb-4">
                <View className="w-9 h-9 rounded-xl bg-amber-100 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="attachment" size={18} color="#D97706" />
                </View>
                <View className="flex-1">
                  <Text className={`font-black text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Attachments</Text>
                  <Text className={`text-[11px] font-semibold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{attachments.length > 0 ? `${attachments.length} file(s) selected` : 'Add images or PDFs'}</Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={pickImage} className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center" activeOpacity={0.7}>
                    <MaterialCommunityIcons name="image-plus" size={20} color="#8B5CF6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={pickDocument} className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center" activeOpacity={0.7}>
                    <MaterialCommunityIcons name="file-pdf-box" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
              </View>
              {attachments.length > 0 ? (
                <View>
                  {attachments.map((a, idx) => (
                    <View key={idx} className={`flex-row items-center py-3 px-3.5 rounded-2xl mb-2 ${isDark ? 'bg-gray-800' : 'bg-amber-50'}`} style={{ borderWidth: 2, borderColor: isDark ? '#4B5563' : '#E5E7EB' }}>
                      <View className="w-8 h-8 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: a.type.includes('pdf') ? '#FEE2E2' : '#F3E8FF' }}>
                        <MaterialCommunityIcons name={a.type.includes('pdf') ? 'file-pdf-box' : 'file-image'} size={16} color={a.type.includes('pdf') ? '#EF4444' : '#8B5CF6'} />
                      </View>
                      <Text className={`flex-1 text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`} numberOfLines={1}>{a.name}</Text>
                      <Text className={`text-[10px] font-semibold mr-2.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatSize(a.size)}</Text>
                      <TouchableOpacity onPress={() => removeAttachment(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="py-6 items-center">
                  <MaterialCommunityIcons name="cloud-upload-outline" size={36} color={isDark ? '#4B5563' : '#D1D5DB'} />
                  <Text className={`text-xs font-semibold mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Tap the icons above to attach files</Text>
                </View>
              )}
            </Card>

            <TouchableOpacity onPress={() => { handlePost(); setShowCreateModal(null); }} disabled={submitting}
              className="py-4 rounded-2xl items-center flex-row justify-center mb-10"
              style={{ backgroundColor: '#D97706' }} activeOpacity={0.8}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <><MaterialCommunityIcons name="send" size={22} color="#FFF" /><Text className="text-white font-black text-base ml-2.5">Post Homework</Text></>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── CREATE SUBJECT MODAL ── */}
      <Modal transparent visible={showCreateModal === 'subject'} onRequestClose={() => setShowCreateModal(null)} animationType="slide">
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between px-6 py-4 border-b-2" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity onPress={() => { resetSubjectForm(); setShowCreateModal(null); }} className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
              <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
            </TouchableOpacity>
            <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{editingSubject ? 'Edit Subject' : 'New Subject'}</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...(Platform.OS === 'ios' ? { automaticallyAdjustKeyboardInsets: true } : {})}>
            <Card isDark={isDark} className="mb-5">
              <View className="flex-row items-center mb-1">
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: newSubjectColor }}>
                  <MaterialCommunityIcons name={newSubjectIcon as any} size={20} color="white" />
                </View>
                <View>
                  <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{editingSubject ? 'Edit Subject' : 'New Subject'}</Text>
                  <Text className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{editingSubject ? 'Update subject details' : 'Map it to a class for quick posting'}</Text>
                </View>
              </View>
              <View className="h-px bg-amber-200 my-4" />
              <Input label="Subject Name" icon="book" value={newSubjectName} onChange={setNewSubjectName} placeholder="e.g. Mathematics" isDark={isDark} />
              <View className="mb-5">
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons name="shape" size={16} color="#D97706" />
                  <Text className={`text-xs font-bold ml-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Link to Class</Text>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowNewBatchPicker(true)}
                  className={`flex-row items-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-amber-50 border-amber-200'} border-2 rounded-2xl px-5 py-5`}>
                  <MaterialCommunityIcons name="google-classroom" size={18} color="#D97706" />
                  <Text className={`flex-1 font-semibold text-sm mx-3 ${newSubjectBatchId ? (isDark ? 'text-white' : 'text-gray-900') : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {newSubjectBatchId ? batches.find(b => b.id === newSubjectBatchId)?.name || 'Select' : 'None (optional)'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <View className="mb-5">
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons name="palette" size={16} color="#D97706" />
                  <Text className={`text-xs font-bold ml-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Icon & Color</Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowSubjectIconPicker(true)}
                    className="w-14 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: newSubjectColor }}>
                    <MaterialCommunityIcons name={newSubjectIcon as any} size={28} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowSubjectColorPicker(true)}
                    className="flex-1 flex-row items-center py-4 px-4 rounded-2xl border-2 border-dashed" style={{ borderColor: isDark ? '#4B5563' : '#D1D5DB' }}>
                    <View className="w-8 h-8 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: newSubjectColor }}>
                      <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                    </View>
                    <Text className={`flex-1 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Pick Color</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <ActionBtn onPress={() => { handleSaveSubject(); setShowCreateModal(null); }} loading={creatingSubject} title={editingSubject ? 'Update' : 'Create'} icon={editingSubject ? 'content-save' : 'plus-circle'} />
                </View>
                {editingSubject && (
                  <TouchableOpacity onPress={resetSubjectForm} className="w-14 items-center justify-center rounded-2xl bg-gray-200" activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── CREATE BATCH MODAL ── */}
      <Modal transparent visible={showCreateModal === 'batch'} onRequestClose={() => setShowCreateModal(null)} animationType="slide">
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between px-6 py-4 border-b-2" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity onPress={() => { resetBatchForm(); setShowCreateModal(null); }} className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
              <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
            </TouchableOpacity>
            <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{editingBatch ? 'Edit Class' : 'New Class'}</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...(Platform.OS === 'ios' ? { automaticallyAdjustKeyboardInsets: true } : {})}>
            <Card isDark={isDark} className="mb-5">
              <View className="flex-row items-center mb-1">
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: newBatchColor }}>
                  <MaterialCommunityIcons name={newBatchIcon as any} size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{editingBatch ? 'Edit Class' : 'New Class'}</Text>
                  <Text className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{editingBatch ? 'Update class details' : 'Create a batch and add students'}</Text>
                </View>
                {editingBatch && (
                  <TouchableOpacity onPress={resetBatchForm} className="w-9 h-9 rounded-xl bg-gray-200 items-center justify-center">
                    <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
              <View className="h-px bg-amber-200 my-4" />
              <Input label="Class Name" icon="google-classroom" value={newBatchName} onChange={setNewBatchName} placeholder="e.g. Morning Batch A" isDark={isDark} />
              <Input label="Description" icon="text-long" value={newBatchDesc} onChange={setNewBatchDesc} placeholder="Optional description" isDark={isDark} />
              <View className="mb-5">
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons name="palette" size={16} color="#D97706" />
                  <Text className={`text-xs font-bold ml-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Icon & Color</Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowBatchIconPicker(true)}
                    className="w-14 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: newBatchColor }}>
                    <MaterialCommunityIcons name={newBatchIcon as any} size={28} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowBatchColorPicker(true)}
                    className="flex-1 flex-row items-center py-4 px-4 rounded-2xl border-2 border-dashed" style={{ borderColor: isDark ? '#4B5563' : '#D1D5DB' }}>
                    <View className="w-8 h-8 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: newBatchColor }}>
                      <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                    </View>
                    <Text className={`flex-1 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Pick Color</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <ActionBtn onPress={() => { handleSaveBatch(); setShowCreateModal(null); }} loading={creatingBatch} title={editingBatch ? 'Update' : 'Create'} icon={editingBatch ? 'content-save' : 'plus-circle'} />
                </View>
                {editingBatch && (
                  <TouchableOpacity onPress={resetBatchForm} className="w-14 items-center justify-center rounded-2xl bg-gray-200" activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── MANAGE BATCH STUDENTS MODAL ── */}
      <Modal transparent visible={!!selectedManageBatch} onRequestClose={() => setSelectedManageBatch(null)} animationType="slide">
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row items-center justify-between px-6 py-4 border-b-2" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity onPress={() => setSelectedManageBatch(null)} className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
              <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
            </TouchableOpacity>
            <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedManageBatch?.name || 'Manage Class'}</Text>
            <View style={{ width: 40 }} />
          </View>
          <View className="flex-1 px-6 pt-4">
            <View className="flex-row items-center mb-4">
              <MaterialCommunityIcons name="account-group" size={22} color="#8B5CF6" />
              <Text className={`text-base font-black ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Students ({batchStudents.length})</Text>
            </View>
            {batchStudents.length === 0 ? (
              <View className="py-12 items-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <MaterialCommunityIcons name="account-off" size={48} color="#D1D5DB" />
                <Text className={`text-gray-400 font-bold text-sm mt-3 ${isDark ? 'text-gray-300' : ''}`}>No students in this class</Text>
                <Text className="text-gray-400 text-xs mt-1">Tap + to add students</Text>
              </View>
            ) : (
              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {batchStudents.map(st => (
                  <View key={st.id} className={`flex-row items-center px-4 py-3 rounded-2xl mb-2 ${isDark ? 'bg-gray-800' : 'bg-amber-50'}`}>
                    <View className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center mr-3">
                      <MaterialCommunityIcons name="account" size={20} color="#8B5CF6" />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{st.name}</Text>
                      <Text className={`text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ID: {st.id}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { removeStudentFromBatch(st.id); }} className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center">
                      <MaterialCommunityIcons name="account-remove" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowStudentPicker(true)}
              className="mb-6 mt-4 bg-purple-500 py-4 rounded-2xl flex-row items-center justify-center">
              <MaterialCommunityIcons name="account-plus" size={20} color="white" />
              <Text className="text-white font-black text-sm ml-2">Add Student</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── Bottom Tab Bar ── */}
      <View className="flex-row items-center px-6 py-3 border-t-2 border-amber-200 bg-white">
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity key={t.key} activeOpacity={0.7} onPress={() => setTab(t.key)}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${active ? 'bg-amber-400' : ''}`}>
              <MaterialCommunityIcons name={t.icon} size={18} color={active ? '#92400E' : '#9CA3AF'} />
              <Text className={`font-bold text-xs ml-1.5 ${active ? 'text-amber-900' : 'text-gray-500'}`}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
    </SafeAreaView>
  );
}
