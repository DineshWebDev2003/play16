import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, TextInput, Image, Platform, PanResponder, BackHandler } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api, { getMediaUrl } from '../../services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

type SortKey = 'name' | 'date' | 'size';
type ViewMode = 'list' | 'grid';

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'name', label: 'Name', icon: 'sort-alphabetical-ascending' },
  { key: 'date', label: 'Date', icon: 'sort-calendar-descending' },
  { key: 'size', label: 'Size', icon: 'sort-numeric-descending' },
];

export default function TuitionStudyMaterialsScreen({ navigation }: Props) {
  const { user, fetchData } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const canManage = user?.role === 'master_admin' || user?.role === 'admin' || user?.role === 'tuition_teacher';
  const isStudent = user?.role === 'tuition_student';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [path, setPath] = useState<{ id: number | null; name: string }[]>([]);

  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [batches, setBatches] = useState<any[]>([]);
  const [filterBatch, setFilterBatch] = useState<number | null>(null);
  const [selectedBatches, setSelectedBatches] = useState<number[]>([]);

  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBatchPicker, setShowBatchPicker] = useState(false);
  const [batchPickerMode, setBatchPickerMode] = useState<'assign' | 'filter' | 'edit'>('assign');
  const [editingBatchesMaterial, setEditingBatchesMaterial] = useState<any>(null);

  const [folderName, setFolderName] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [uploadFiles, setUploadFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const [activeMenu, setActiveMenu] = useState<{ kind: 'folder' | 'material'; id: number; name: string } | null>(null);
  const [renameModal, setRenameModal] = useState<{ kind: 'folder' | 'material'; id: number; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameFileNameValue, setRenameFileNameValue] = useState('');
  const [viewingNote, setViewingNote] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [pdfViewer, setPdfViewer] = useState<any>(null);
  const [previewType, setPreviewType] = useState<'pdf' | 'image' | 'remote' | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);

  const pdfRef = useRef<any>(null);
  const seekBarWidth = useRef(0);
  const pdfTotalPagesRef = useRef(pdfTotalPages);

  useEffect(() => { pdfTotalPagesRef.current = pdfTotalPages; }, [pdfTotalPages]);

  const pageFromX = useCallback((x: number): number | null => {
    const total = pdfTotalPagesRef.current;
    if (!total || !seekBarWidth.current) return null;
    const ratio = Math.min(Math.max(x / seekBarWidth.current, 0), 1);
    return Math.max(1, Math.min(Math.round(ratio * (total - 1)) + 1, total));
  }, []);

  const handleSeekDrag = useCallback((x: number) => {
    const page = pageFromX(x);
    if (!page) return;
    setPdfCurrentPage(page);
  }, [pageFromX]);

  const handleSeekEnd = useCallback((x: number) => {
    const page = pageFromX(x);
    if (!page) return;
    console.log('[StudyMaterials] seek commit to page', page);
    setPdfCurrentPage(page);
    if (pdfRef.current?.setPage) pdfRef.current.setPage(page);
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

  const loadBatches = useCallback(async () => {
    try {
      const res = await api.get('/batches');
      const d = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setBatches(d);
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    try {
      const params: any = { sort_by: sortBy, order: sortDir };
      if (currentFolderId) params.folder_id = currentFolderId;
      if (isStudent) {
        const myBatch = (user as any)?.batch_id;
        if (myBatch) params.batch_id = myBatch;
      } else if (filterBatch) {
        params.batch_id = filterBatch;
      }
      const res = await api.get('/study-materials', { params });
      setFolders(res.data?.folders || []);
      setMaterials(res.data?.materials || []);
    } catch {}
  }, [sortBy, sortDir, currentFolderId, filterBatch, isStudent, user]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadData(), loadBatches()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { loadData(); }, [sortBy, sortDir, currentFolderId, filterBatch]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pdfViewer) { closePreview(); return true; }
      if (viewingNote) { setViewingNote(null); return true; }
      if (showBatchPicker) { dismissBatchPicker(); return true; }
      if (showCreateSheet) { setShowCreateSheet(false); return true; }
      if (showFolderModal) { setShowFolderModal(false); return true; }
      if (showNoteModal) { setShowNoteModal(false); return true; }
      if (showUploadModal) { setShowUploadModal(false); return true; }
      if (activeMenu) { setActiveMenu(null); return true; }
      if (renameModal) { setRenameModal(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [pdfViewer, viewingNote, showBatchPicker, showCreateSheet, showFolderModal, showNoteModal, showUploadModal, activeMenu, renameModal, closePreview, dismissBatchPicker]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    await loadData();
    setRefreshing(false);
  }, [fetchData, loadData]);

  const openFolder = (f: any) => {
    setPath(prev => [...prev, { id: f.id, name: f.name }]);
    setCurrentFolderId(f.id);
  };

  const goToPath = (idx: number) => {
    const p = path.slice(0, idx);
    setPath(p);
    setCurrentFolderId(p.length > 0 ? p[p.length - 1].id : null);
  };

  const handleCreateFolder = useCallback(async () => {
    if (!folderName.trim()) { Alert.alert('Required', 'Please enter a folder name.'); return; }
    try {
      await api.post('/study-materials/folders', { name: folderName.trim(), parent_id: currentFolderId });
      setFolderName('');
      setShowFolderModal(false);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create folder.');
    }
  }, [folderName, currentFolderId, loadData]);

  const pickFiles = useCallback(async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain'],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (!r.canceled && r.assets) {
      setUploadFiles(prev => [...prev, ...r.assets.map(a => ({ uri: a.uri, name: a.name || `file_${Date.now()}`, type: a.mimeType || 'application/octet-stream', size: a.size || 0 }))]);
    }
  }, []);

  const removeUploadFile = useCallback((idx: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleUpload = useCallback(async () => {
    if (uploadFiles.length === 0) { Alert.alert('Required', 'Please attach at least one file.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('type', 'file');
      if (currentFolderId) fd.append('folder_id', String(currentFolderId));
      selectedBatches.forEach(b => fd.append('batch_ids[]', String(b)));
      uploadFiles.forEach(f => fd.append('file[]', { uri: f.uri, name: f.name, type: f.type } as any));
      await api.post('/study-materials', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadFiles([]);
      setSelectedBatches([]);
      setShowUploadModal(false);
      await loadData();
      Alert.alert('Success', 'Files uploaded.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to upload files.');
    }
    setUploading(false);
  }, [uploadFiles, selectedBatches, currentFolderId, loadData]);

  const handleCreateNote = useCallback(async () => {
    if (!noteTitle.trim()) { Alert.alert('Required', 'Please enter a note title.'); return; }
    if (!noteContent.trim()) { Alert.alert('Required', 'Please enter note content.'); return; }
    try {
      await api.post('/study-materials', {
        title: noteTitle.trim(),
        content: noteContent.trim(),
        type: 'note',
        folder_id: currentFolderId,
        batch_ids: selectedBatches,
      });
      setNoteTitle('');
      setNoteContent('');
      setSelectedBatches([]);
      setShowNoteModal(false);
      await loadData();
      Alert.alert('Success', 'Note created.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create note.');
    }
  }, [noteTitle, noteContent, selectedBatches, currentFolderId, loadData]);

  const handleRename = useCallback(async () => {
    if (!renameModal || !renameValue.trim()) return;
    try {
      const payload: any = { kind: renameModal.kind, name: renameValue.trim() };
      if (renameModal.kind === 'material') {
        const fn = renameFileNameValue.trim();
        if (fn) payload.file_name = fn;
      }
      await api.put(`/study-materials/rename/${renameModal.id}`, payload);
      setRenameModal(null);
      setRenameValue('');
      setRenameFileNameValue('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to rename.');
    }
  }, [renameModal, renameValue, renameFileNameValue, loadData]);

  const openRename = useCallback((item: { kind: 'folder' | 'material'; id: number; name: string }) => {
    setRenameValue(item.name);
    if (item.kind === 'material') {
      const mat = materials.find(m => m.id === item.id);
      setRenameFileNameValue(mat?.file_name || '');
    } else {
      setRenameFileNameValue('');
    }
    setRenameModal(item);
    setActiveMenu(null);
  }, [materials]);

  const openAssignClasses = useCallback((m: any) => {
    setSelectedBatches(Array.isArray(m.batch_ids) ? m.batch_ids.map(Number) : []);
    setEditingBatchesMaterial(m);
    setBatchPickerMode('edit');
    setActiveMenu(null);
    setShowBatchPicker(true);
  }, []);

  const handleSaveBatches = useCallback(async () => {
    if (!editingBatchesMaterial) return;
    try {
      await api.put(`/study-materials/${editingBatchesMaterial.id}/batches`, { batch_ids: selectedBatches });
      setShowBatchPicker(false);
      setEditingBatchesMaterial(null);
      setSelectedBatches([]);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update classes.');
    }
  }, [editingBatchesMaterial, selectedBatches, loadData]);

  const dismissBatchPicker = useCallback(() => {
    setShowBatchPicker(false);
    if (batchPickerMode === 'edit') {
      setEditingBatchesMaterial(null);
      setSelectedBatches([]);
    }
  }, [batchPickerMode]);

  const confirmDelete = useCallback((item: { kind: 'folder' | 'material'; id: number; name: string }) => {
    Alert.alert('Delete', `Delete "${item.name}"? ${item.kind === 'folder' ? 'All files and sub-folders inside will also be deleted.' : ''}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          if (item.kind === 'folder') {
            await api.delete(`/study-materials/folders/${item.id}`);
          } else {
            await api.delete(`/study-materials/${item.id}`);
          }
          await loadData();
        } catch (err: any) {
          Alert.alert('Error', err?.response?.data?.message || 'Failed to delete.');
        }
      }},
    ]);
  }, [loadData]);

  const handleDownload = useCallback(async (m: any) => {
    if (!m.file_path) return;
    setDownloadingId(m.id);
    try {
      const fileName = m.file_name || `material_${m.id}`;
      const fileUrl = getMediaUrl(m.file_path);
      if (!fileUrl) throw new Error('No file url');
      const dir = new FileSystem.Directory(FileSystem.Paths.cache, 'downloads');
      if (!dir.exists) dir.create({ intermediates: true });
      const target = new FileSystem.File(dir, fileName);
      console.log('[StudyMaterials] downloading file', { id: m.id, fileName, fileUrl, target: target.uri });
      const res = await FileSystem.File.downloadFileAsync(fileUrl, target, { idempotent: true });
      console.log('[StudyMaterials] file downloaded', { uri: res?.uri });
      if (res?.uri) {
        await Sharing.shareAsync(res.uri, { mimeType: m.mime_type || undefined, dialogTitle: m.title });
        console.log('[StudyMaterials] share sheet opened');
      }
    } catch (e: any) {
      console.error('[StudyMaterials] download failed', e?.message, e);
      Alert.alert('Error', 'Failed to download file.');
    }
    setDownloadingId(null);
  }, []);

  const closePreview = useCallback(() => {
    console.log('[StudyMaterials] closePreview');
    setPdfViewer(null);
    setPreviewType(null);
    setPdfUri(null);
    setRemoteUrl(null);
    setPdfLoading(false);
    setPdfCurrentPage(1);
    setPdfTotalPages(0);
  }, []);

  const openPreview = useCallback((m: any) => {
    if (!m.file_path) return;
    const fileUrl = getMediaUrl(m.file_path);
    if (!fileUrl) { Alert.alert('Error', 'File not available.'); return; }

    const mime = (m.mime_type || '').toLowerCase();
    const isPdf = mime.includes('pdf') || /\.pdf$/i.test(m.file_name || '');
    const isImage = mime.startsWith('image/');

    console.log('[StudyMaterials] openPreview', { id: m.id, title: m.title, file_name: m.file_name, mime_type: m.mime_type, file_path: m.file_path, fileUrl, isPdf, isImage });

    if (!isPdf && !isImage) {
      console.log('[StudyMaterials] not previewable -> offer download');
      Alert.alert(m.title || 'File', 'Preview is not supported for this file type. Download it instead.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => handleDownload(m) },
      ]);
      return;
    }

    setPdfViewer(m);

    if (Platform.OS === 'web') {
      console.log('[StudyMaterials] web -> using remote url preview', { previewType: isImage ? 'image' : 'remote', fileUrl });
      setPreviewType(isImage ? 'image' : 'remote');
      setRemoteUrl(fileUrl);
      setPdfLoading(false);
      return;
    }

    if (isImage) {
      console.log('[StudyMaterials] image preview', { fileUrl });
      setPreviewType('image');
      setRemoteUrl(fileUrl);
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
        const target = new FileSystem.File(dir, `material_${m.id}.pdf`);
        console.log('[StudyMaterials] downloading pdf to cache', { url: fileUrl, target: target.uri });
        const res = await FileSystem.File.downloadFileAsync(fileUrl, target, { idempotent: true });
        console.log('[StudyMaterials] pdf downloaded', { uri: res?.uri });
        if (res?.uri) setPdfUri(res.uri);
        else throw new Error('Download failed');
      } catch (e: any) {
        console.error('[StudyMaterials] pdf download failed', e?.message, e);
        setPdfLoading(false);
        Alert.alert('Error', `Failed to load PDF. ${e?.message || ''}`);
      }
    })();
  }, [handleDownload]);

  const toggleBatch = (id: number) => {
    setSelectedBatches(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const formatSize = (b: number) => { if (!b) return ''; if (b < 1024) return `${b}B`; if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`; return `${(b / 1048576).toFixed(1)}MB`; };
  const formatDate = (d?: string) => { if (!d) return ''; return new Date(d).toLocaleDateString(); };

  const getFileIcon = (type?: string) => {
    if (type?.startsWith('image/')) return 'file-image';
    if (type?.includes('pdf')) return 'file-pdf-box';
    if (type?.includes('word')) return 'file-word';
    if (type?.includes('excel') || type?.includes('spreadsheet')) return 'file-excel';
    if (type?.includes('presentation') || type?.includes('powerpoint')) return 'file-powerpoint';
    return 'file';
  };
  const getFileColor = (type?: string) => {
    if (type?.startsWith('image/')) return '#8B5CF6';
    if (type?.includes('pdf')) return '#EF4444';
    if (type?.includes('word')) return '#3B82F6';
    if (type?.includes('excel')) return '#22C55E';
    if (type?.includes('powerpoint')) return '#F97316';
    return '#6B7280';
  };

  const batchName = (id: number) => batches.find(b => b.id === id)?.name || `Class #${id}`;
  const batchCount = (ids: number[]) => (ids || []).length;

  const renderSortBar = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 12, gap: 8, flexWrap: 'wrap' }}>
      <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#2a2a28' : '#F3F4F6', borderRadius: 12, padding: 4, gap: 4 }}>
        {SORT_OPTIONS.map(o => (
          <TouchableOpacity key={o.key} onPress={() => { if (sortBy === o.key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); } else { setSortBy(o.key); } }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, backgroundColor: sortBy === o.key ? (isDark ? '#3a3a38' : '#FFFFFF') : 'transparent' }}>
            <MaterialCommunityIcons name={o.icon as any} size={13} color={sortBy === o.key ? '#F59E0B' : (isDark ? '#6B7280' : '#9CA3AF')} />
            <Text style={{ fontWeight: '800', fontSize: 11, marginLeft: 4, color: sortBy === o.key ? (isDark ? '#FFF' : '#111') : (isDark ? '#6B7280' : '#9CA3AF') }}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
        style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? '#2a2a28' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'} size={16} color="#F59E0B" />
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#2a2a28' : '#F3F4F6', borderRadius: 12, padding: 4, gap: 4 }}>
        {([{ key: 'grid' as ViewMode, icon: 'view-grid-outline' }, { key: 'list' as ViewMode, icon: 'view-agenda-outline' }]).map(o => (
          <TouchableOpacity key={o.key} onPress={() => setViewMode(o.key)}
            style={{ width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: viewMode === o.key ? (isDark ? '#3a3a38' : '#FFFFFF') : 'transparent' }}>
            <MaterialCommunityIcons name={o.icon as any} size={15} color={viewMode === o.key ? '#F59E0B' : (isDark ? '#6B7280' : '#9CA3AF')} />
          </TouchableOpacity>
        ))}
      </View>
      {!isStudent && (
        <TouchableOpacity onPress={() => { setBatchPickerMode('filter'); setShowBatchPicker(true); }}
          style={{ flex: 1, minWidth: 120, flexDirection: 'row', alignItems: 'center', height: 34, borderRadius: 10, backgroundColor: isDark ? '#2a2a28' : '#F3F4F6', paddingHorizontal: 10 }}>
          <MaterialCommunityIcons name="google-classroom" size={14} color="#8B5CF6" />
          <Text style={{ flex: 1, fontWeight: '700', fontSize: 11, color: isDark ? '#D1D5DB' : '#374151', marginLeft: 5 }} numberOfLines={1}>
            {filterBatch ? batchName(filterBatch) : 'All Classes'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color={isDark ? '#6B7280' : '#9CA3AF'} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPath = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 24, paddingBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => goToPath(0)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="folder-home" size={15} color="#F59E0B" />
          <Text style={{ fontWeight: '800', fontSize: 12, color: isDark ? '#D1D5DB' : '#6B7280', marginLeft: 4 }}>My Drive</Text>
        </TouchableOpacity>
        {path.map((p, i) => (
          <React.Fragment key={i}>
            <MaterialCommunityIcons name="chevron-right" size={14} color={isDark ? '#4B5563' : '#D1D5DB'} style={{ marginHorizontal: 4 }} />
            <TouchableOpacity onPress={() => goToPath(i + 1)}>
              <Text style={{ fontWeight: '800', fontSize: 12, color: i === path.length - 1 ? '#F59E0B' : (isDark ? '#D1D5DB' : '#6B7280') }} numberOfLines={1}>{p.name}</Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </ScrollView>
  );

  const renderFolderCard = (f: any) => (
    <TouchableOpacity key={f.id} activeOpacity={0.85} onPress={() => openFolder(f)} onLongPress={() => canManage && setActiveMenu({ kind: 'folder', id: f.id, name: f.name })}
      style={{ width: '48%', marginBottom: 12, backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.14)', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name="folder" size={26} color="#F59E0B" />
      </View>
      <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#FFF' : '#111', marginTop: 10 }} numberOfLines={1}>{f.name}</Text>
      <Text style={{ fontWeight: '600', fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 3 }}>Folder</Text>
    </TouchableOpacity>
  );

  const renderFolderRow = (f: any) => (
    <TouchableOpacity key={f.id} activeOpacity={0.85} onPress={() => openFolder(f)} onLongPress={() => canManage && setActiveMenu({ kind: 'folder', id: f.id, name: f.name })}
      style={{ marginBottom: 10, backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="folder" size={22} color="#F59E0B" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#FFF' : '#111' }} numberOfLines={1}>{f.name}</Text>
          <Text style={{ fontWeight: '600', fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 3 }}>Folder</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? '#4B5563' : '#D1D5DB'} />
      </View>
    </TouchableOpacity>
  );

  const renderMaterialCard = (m: any) => {
    const isNote = m.type === 'note';
    const icon = isNote ? 'notebook-outline' : getFileIcon(m.mime_type);
    const color = isNote ? '#8B5CF6' : getFileColor(m.mime_type);
    return (
      <TouchableOpacity key={m.id} activeOpacity={0.85}
        onPress={() => { if (isNote) setViewingNote(m); else if (m.file_path) openPreview(m); }}
        onLongPress={() => canManage && setActiveMenu({ kind: 'material', id: m.id, name: m.title })}
        style={{ marginBottom: 10, backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name={icon as any} size={22} color={color} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#FFF' : '#111' }} numberOfLines={1}>{m.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF' }}>
                {isNote ? 'Note' : (m.file_name || 'File')}{isNote && m.content ? ' • ' + m.content.length + ' chars' : ''}
                {!isNote && m.file_size ? ` • ${formatSize(m.file_size)}` : ''} • {formatDate(m.created_at)}
              </Text>
              {batchCount(m.batch_ids) > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
                  <MaterialCommunityIcons name="google-classroom" size={11} color="#8B5CF6" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#8B5CF6', marginLeft: 2 }}>{batchCount(m.batch_ids)} class{batchCount(m.batch_ids) > 1 ? 'es' : ''}</Text>
                </View>
              )}
            </View>
          </View>
          {canManage && (
            <TouchableOpacity onPress={() => setActiveMenu({ kind: 'material', id: m.id, name: m.title })} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: isDark ? '#3a3a38' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="dots-vertical" size={16} color={isDark ? '#D1D5DB' : '#6B7280'} />
            </TouchableOpacity>
          )}
          {!isNote && m.file_path && (
            <TouchableOpacity onPress={() => handleDownload(m)} style={{ marginLeft: 6, width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              {downloadingId === m.id ? <ActivityIndicator size="small" color="#F59E0B" /> : <MaterialCommunityIcons name="download" size={16} color="#F59E0B" />}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMaterialGridCard = (m: any) => {
    const isNote = m.type === 'note';
    const icon = isNote ? 'notebook-outline' : getFileIcon(m.mime_type);
    const color = isNote ? '#8B5CF6' : getFileColor(m.mime_type);
    return (
      <TouchableOpacity key={m.id} activeOpacity={0.85}
        onPress={() => { if (isNote) setViewingNote(m); else if (m.file_path) openPreview(m); }}
        onLongPress={() => canManage && setActiveMenu({ kind: 'material', id: m.id, name: m.title })}
        style={{ width: '48%', marginBottom: 12, backgroundColor: isDark ? '#2a2a28' : '#FFFFFF', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        <Text style={{ fontWeight: '900', fontSize: 13, color: isDark ? '#FFF' : '#111', marginTop: 10 }} numberOfLines={1}>{m.title}</Text>
        <Text style={{ fontWeight: '600', fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 3 }} numberOfLines={1}>
          {isNote ? 'Note' : (m.file_name || 'File')}{!isNote && m.file_size ? ` • ${formatSize(m.file_size)}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          {batchCount(m.batch_ids) > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <MaterialCommunityIcons name="google-classroom" size={10} color="#8B5CF6" />
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#8B5CF6', marginLeft: 2 }}>{batchCount(m.batch_ids)}</Text>
            </View>
          )}
          {!isNote && m.file_path && (
            <TouchableOpacity onPress={() => handleDownload(m)} style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              {downloadingId === m.id ? <ActivityIndicator size="small" color="#F59E0B" /> : <MaterialCommunityIcons name="download" size={13} color="#F59E0B" />}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderBatchPicker = () => (
    <Modal transparent visible={showBatchPicker} onRequestClose={dismissBatchPicker} animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={dismissBatchPicker} />
        <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%', paddingBottom: 40 }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>
              {batchPickerMode === 'filter' ? 'Filter by Class' : batchPickerMode === 'edit' ? 'Assign Classes' : 'Select Classes'}
            </Text>
            <TouchableOpacity onPress={dismissBatchPicker} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
            {batchPickerMode === 'filter' && (
              <TouchableOpacity onPress={() => { setFilterBatch(null); setShowBatchPicker(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#2a2a28' : '#F3F4F6' }}>
                <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: !filterBatch ? '#F59E0B' : (isDark ? '#6B7280' : '#D1D5DB'), backgroundColor: !filterBatch ? '#F59E0B' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {!filterBatch && <MaterialCommunityIcons name="check" size={16} color="white" />}
                </View>
                <Text style={{ marginLeft: 14, fontWeight: '800', fontSize: 15, color: isDark ? '#FFF' : '#111' }}>All Classes</Text>
              </TouchableOpacity>
            )}
            {batches.map((b: any) => {
              const sel = batchPickerMode === 'filter' ? filterBatch === b.id : selectedBatches.includes(b.id);
              return (
                <TouchableOpacity key={b.id} onPress={() => {
                  if (batchPickerMode === 'filter') { setFilterBatch(sel ? null : b.id); setShowBatchPicker(false); }
                  else toggleBatch(b.id);
                }}
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
          {(batchPickerMode === 'assign' || batchPickerMode === 'edit') && (
            <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
              <TouchableOpacity onPress={() => {
                if (batchPickerMode === 'edit') handleSaveBatches();
                else setShowBatchPicker(false);
              }}
                style={{ backgroundColor: '#F59E0B', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>
                  {batchPickerMode === 'edit' ? `Save Classes (${selectedBatches.length})` : `Done (${selectedBatches.length} selected)`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderCreateSheet = () => (
    <Modal transparent visible={showCreateSheet} onRequestClose={() => setShowCreateSheet(false)} animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowCreateSheet(false)} />
        <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111' }}>New</Text>
          </View>
          {[
            { icon: 'folder-plus', label: 'New Folder', desc: 'Create a folder to organize files', color: '#F59E0B', action: () => { setShowCreateSheet(false); setShowFolderModal(true); } },
            { icon: 'file-upload', label: 'Upload Files', desc: 'Add PDFs, docs, images, sheets', color: '#8B5CF6', action: () => { setShowCreateSheet(false); setUploadFiles([]); setShowUploadModal(true); } },
            { icon: 'note-plus', label: 'Add Note', desc: 'Write a text note', color: '#22C55E', action: () => { setShowCreateSheet(false); setShowNoteModal(true); } },
          ].map((opt, i) => (
            <TouchableOpacity key={i} onPress={opt.action} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: isDark ? '#2a2a28' : '#F9FAFB' }}>
              <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${opt.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={opt.icon as any} size={22} color={opt.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '800', fontSize: 15, color: isDark ? '#FFF' : '#111' }}>{opt.label}</Text>
                <Text style={{ fontWeight: '500', fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>{opt.desc}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? '#4B5563' : '#D1D5DB'} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const renderInput = (value: string, onChange: (t: string) => void, placeholder: string, multiline = false) => (
    <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#9CA3AF" multiline={multiline} numberOfLines={multiline ? 5 : 1} textAlignVertical={multiline ? 'top' : 'center'}
      style={{ backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.04)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontWeight: '600', fontSize: 14, color: isDark ? '#D1D5DB' : '#374151', borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.15)', minHeight: multiline ? 100 : 50 }} />
  );

  const renderClassRow = () => (
    <TouchableOpacity onPress={() => { setBatchPickerMode('assign'); setShowBatchPicker(true); }}
      style={{ backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.04)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.15)', flexDirection: 'row', alignItems: 'center' }}>
      <MaterialCommunityIcons name="google-classroom" size={18} color="#F59E0B" />
      <Text style={{ flex: 1, fontWeight: '600', fontSize: 14, color: selectedBatches.length > 0 ? (isDark ? '#D1D5DB' : '#374151') : '#9CA3AF', marginLeft: 10 }}>
        {selectedBatches.length > 0 ? `${selectedBatches.length} class${selectedBatches.length > 1 ? 'es' : ''} selected` : 'Select classes (optional)'}
      </Text>
      <MaterialCommunityIcons name="chevron-down" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
    </TouchableOpacity>
  );

  const renderFolderModal = () => (
    <Modal transparent visible={showFolderModal} onRequestClose={() => setShowFolderModal(false)} animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111', marginBottom: 16 }}>New Folder</Text>
          {renderInput(folderName, setFolderName, 'Folder name')}
          <TouchableOpacity onPress={handleCreateFolder} style={{ backgroundColor: '#F59E0B', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 16 }}>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Create Folder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderNoteModal = () => (
    <Modal transparent visible={showNoteModal} onRequestClose={() => setShowNoteModal(false)} animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111', marginBottom: 16 }}>Add Note</Text>
          <View style={{ gap: 12 }}>
            {renderInput(noteTitle, setNoteTitle, 'Note title')}
            {renderInput(noteContent, setNoteContent, 'Write your note...', true)}
            {renderClassRow()}
          </View>
          <TouchableOpacity onPress={handleCreateNote} style={{ backgroundColor: '#22C55E', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 16 }}>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Create Note</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderUploadModal = () => (
    <Modal transparent visible={showUploadModal} onRequestClose={() => setShowUploadModal(false)} animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111', marginBottom: 16 }}>Upload Files</Text>
          {uploadFiles.map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e1e1c' : 'rgba(245,158,11,0.04)', borderRadius: 12, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(245,158,11,0.1)' }}>
              <MaterialCommunityIcons name={getFileIcon(f.type) as any} size={18} color={getFileColor(f.type)} />
              <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: isDark ? '#D1D5DB' : '#374151', marginLeft: 8 }} numberOfLines={1}>{f.name}</Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', marginRight: 8 }}>{formatSize(f.size)}</Text>
              <TouchableOpacity onPress={() => removeUploadFile(i)}><MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" /></TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={pickFiles}
            style={{ backgroundColor: isDark ? '#1e1e1c' : 'rgba(139,92,246,0.06)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#3a3a38' : 'rgba(139,92,246,0.15)', borderStyle: 'dashed', marginVertical: 12 }}>
            <MaterialCommunityIcons name="file-plus" size={20} color="#8B5CF6" />
            <Text style={{ color: '#8B5CF6', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Add PDFs, Docs, Images...</Text>
          </TouchableOpacity>
          {renderClassRow()}
          <TouchableOpacity onPress={handleUpload} disabled={uploading || uploadFiles.length === 0}
            style={{ backgroundColor: uploading ? '#D1D5DB' : '#F59E0B', paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
            {uploading ? <ActivityIndicator color="white" /> : <><MaterialCommunityIcons name="upload" size={20} color="white" /><Text style={{ color: 'white', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>Upload {uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}</Text></>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderItemMenu = () => (
    <Modal transparent visible={!!activeMenu} onRequestClose={() => setActiveMenu(null)} animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderRadius: 24, padding: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: '900', color: isDark ? '#FFF' : '#111', marginBottom: 4 }}>{activeMenu?.name}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginBottom: 16 }}>{activeMenu?.kind === 'folder' ? 'Folder' : 'Material'}</Text>
          {activeMenu?.kind === 'material' && (
            <TouchableOpacity onPress={() => { const m = materials.find(x => x.id === activeMenu.id); if (m) openAssignClasses(m); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#2a2a28' : '#F3F4F6' }}>
              <MaterialCommunityIcons name="google-classroom" size={18} color="#8B5CF6" />
              <Text style={{ fontWeight: '700', fontSize: 14, color: isDark ? '#FFF' : '#111', marginLeft: 12 }}>Assign Classes</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => { if (activeMenu) openRename(activeMenu); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#2a2a28' : '#F3F4F6' }}>
            <MaterialCommunityIcons name="pencil" size={18} color="#3B82F6" />
            <Text style={{ fontWeight: '700', fontSize: 14, color: isDark ? '#FFF' : '#111', marginLeft: 12 }}>Rename</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { if (activeMenu) confirmDelete(activeMenu); setActiveMenu(null); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
            <MaterialCommunityIcons name="delete" size={18} color="#EF4444" />
            <Text style={{ fontWeight: '700', fontSize: 14, color: '#EF4444', marginLeft: 12 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderRenameModal = () => (
    <Modal transparent visible={!!renameModal} onRequestClose={() => setRenameModal(null)} animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderRadius: 24, padding: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: '900', color: isDark ? '#FFF' : '#111', marginBottom: 16 }}>
            {renameModal?.kind === 'folder' ? 'Rename Folder' : 'Rename'}
          </Text>
          <View style={{ gap: 12 }}>
            {renderInput(renameValue, setRenameValue, renameModal?.kind === 'folder' ? 'New name' : 'Title')}
            {renameModal?.kind === 'material' && (
              <>
                {renderInput(renameFileNameValue, setRenameFileNameValue, 'File name (optional)')}
                <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: -6 }}>
                  Leave blank to keep the original file name.
                </Text>
              </>
            )}
          </View>
          <TouchableOpacity onPress={handleRename} style={{ backgroundColor: '#F59E0B', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 16 }}>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderNoteView = () => (
    <Modal transparent visible={!!viewingNote} onRequestClose={() => setViewingNote(null)} animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: isDark ? '#1c1c14' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', padding: 24, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#111', flex: 1 }} numberOfLines={1}>{viewingNote?.title}</Text>
            <TouchableOpacity onPress={() => setViewingNote(null)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: isDark ? '#D1D5DB' : '#374151', lineHeight: 22 }}>{viewingNote?.content}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderPdfViewer = () => (
    <Modal visible={!!pdfViewer} onRequestClose={closePreview} animationType="slide">
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 }}>
          <TouchableOpacity onPress={closePreview} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: '900', fontSize: 15, color: '#FFF' }} numberOfLines={1}>{pdfViewer?.title || pdfViewer?.file_name}</Text>
            <Text style={{ fontWeight: '600', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {previewType === 'pdf' ? 'PDF Preview' : previewType === 'image' ? 'Image Preview' : 'File Preview'}
              {pdfViewer?.file_size ? ` • ${formatSize(pdfViewer.file_size)}` : ''}
              {pdfViewer?.file_name ? ` • ${pdfViewer.file_name}` : ''}
            </Text>
          </View>
          {pdfViewer?.file_path && (
            <TouchableOpacity onPress={() => handleDownload(pdfViewer)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="download" size={22} color="white" />
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flex: 1 }}>
          {previewType === 'image' && remoteUrl ? (
            <Image source={{ uri: remoteUrl }} resizeMode="contain" style={{ flex: 1, backgroundColor: '#000' }} />
          ) : null}
          {previewType === 'remote' && remoteUrl ? (
            <WebView source={{ uri: remoteUrl }} style={{ flex: 1, backgroundColor: '#000' }} />
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
                console.log('[StudyMaterials] PDF render complete', { numberOfPages, path });
                setPdfTotalPages(numberOfPages);
                setPdfCurrentPage(1);
                setPdfLoading(false);
              }}
              onLoadProgress={(progress: number) => console.log('[StudyMaterials] PDF render progress', progress)}
              onPageChanged={(page: number, total: number) => {
                console.log('[StudyMaterials] page changed', { page, total });
                setPdfCurrentPage(page);
              }}
              onError={(error: any) => {
                console.error('[StudyMaterials] PDF render error', error?.message, error);
                setPdfLoading(false);
                Alert.alert('Error', `Failed to load PDF. ${error?.message || 'Unknown error'}`, [
                  { text: 'Close', style: 'cancel' },
                  { text: 'Open with another app', onPress: () => {
                    if (pdfUri) Sharing.shareAsync(pdfUri, { mimeType: 'application/pdf', dialogTitle: pdfViewer?.title || 'Open PDF' }).catch(() => {});
                  }},
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
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#F59E0B',
                    borderWidth: 3,
                    borderColor: '#FFF',
                    shadowColor: '#000',
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 4,
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
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFF8F0' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#F59E0B" /></View>
      </SafeAreaView>
    );
  }

  const isEmpty = folders.length === 0 && materials.length === 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#6B7280' : '#9CA3AF' }}>
                {canManage ? 'School Admin' : 'Student'}
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 2, color: isDark ? '#FFFFFF' : '#111827' }}>
                Study Materials
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 4 }}>
                {folders.length + materials.length} item{folders.length + materials.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={{ backgroundColor: '#F59E0B', width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="google-drive" size={32} color="white" />
            </View>
          </View>
        </View>

        {renderPath()}
        {renderSortBar()}

        {folders.length > 0 && (
          <View style={{ paddingHorizontal: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#6B7280' : '#9CA3AF' }}>Folders</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#F59E0B' }}>{folders.length}</Text>
            </View>
            {viewMode === 'grid' ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                {folders.map(renderFolderCard)}
              </View>
            ) : (
              folders.map(renderFolderRow)
            )}
          </View>
        )}

        <View style={{ paddingHorizontal: 24, marginTop: folders.length > 0 ? 6 : 0 }}>
          {materials.length > 0 && (
            <Text style={{ fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#6B7280' : '#9CA3AF', marginBottom: 10 }}>Files & Notes</Text>
          )}
          {viewMode === 'grid' ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              {materials.map(renderMaterialGridCard)}
            </View>
          ) : (
            materials.map(renderMaterialCard)
          )}
        </View>

        {isEmpty && (
          <View style={{ alignItems: 'center', paddingVertical: 50, marginHorizontal: 24, backgroundColor: isDark ? '#2a2a28' : '#F9FAFB', borderRadius: 24, borderWidth: 1, borderColor: isDark ? '#3a3a38' : '#F3F4F6' }}>
            <MaterialCommunityIcons name="folder-open-outline" size={56} color={isDark ? '#4B5563' : '#9CA3AF'} />
            <Text style={{ fontWeight: '700', fontSize: 15, color: isDark ? '#D1D5DB' : '#6B7280', marginTop: 16 }}>
              {canManage ? 'This folder is empty' : 'No materials yet'}
            </Text>
            <Text style={{ fontWeight: '500', fontSize: 12, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 6 }}>
              {canManage ? 'Tap + to create a folder, upload files, or add a note' : 'Your teacher hasn\'t shared any materials'}
            </Text>
            {canManage && (
              <TouchableOpacity onPress={() => setShowCreateSheet(true)}
                style={{ marginTop: 16, backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="plus" size={18} color="white" />
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 13, marginLeft: 4 }}>Create</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {canManage && (
        <TouchableOpacity onPress={() => setShowCreateSheet(true)} activeOpacity={0.9}
          style={{ position: 'absolute', right: 20, bottom: 28, width: 60, height: 60, borderRadius: 20, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
          <MaterialCommunityIcons name="plus" size={30} color="white" />
        </TouchableOpacity>
      )}

      {renderCreateSheet()}
      {renderBatchPicker()}
      {renderFolderModal()}
      {renderNoteModal()}
      {renderUploadModal()}
      {renderItemMenu()}
      {renderRenameModal()}
      {renderNoteView()}
      {renderPdfViewer()}
    </SafeAreaView>
  );
}
