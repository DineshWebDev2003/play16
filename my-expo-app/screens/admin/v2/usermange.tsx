import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal, FlatList, ListRenderItem,
  RefreshControl, KeyboardAvoidingView, Platform, Keyboard, Image, StyleSheet, Dimensions, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '../../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassSelectV2 from './GlassSelectV2';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;

const TEAM_ICON = require('../../../assets/icons/team.png');
const STUDENT_ICON = require('../../../assets/icons/student.png');
const TEACHER_ICON = require('../../../assets/icons/teacher.png');
const EDUCATION_ICON = require('../../../assets/icons/education.png');
const KINDERGARTEN_ICON = require('../../../assets/icons/kindergarten.png');

const ROLE_COLORS: Record<string, string> = {
  student: '#3B82F6',
  teacher: '#F59E0B',
  nanny: '#06B6D4',
  admin: '#7C3AED',
};

const brandColor = '#F59E0B';
const TUITION_CATEGORIES = ['Tuition'] as const;
const STUDENT_CATEGORIES = ['Playschool', 'PreKG', 'Daycare', 'LKG', 'UKG'] as const;
type CategoryType = typeof STUDENT_CATEGORIES[number] | typeof TUITION_CATEGORIES[number];

const ROLE_AVATARS = [
  { label: 'Master Admin', plural: 'Master Admins', role: 'master_admin', image: require('../../../assets/Avatar/master-admin.png') },
  { label: 'School Admin', plural: 'Admins', role: 'admin', image: require('../../../assets/Avatar/school-admin.png') },
  { label: 'Teacher', plural: 'Teachers', role: 'teacher', image: require('../../../assets/Avatar/teacher.png') },
  { label: 'Kids', plural: 'Students', role: 'student', image: require('../../../assets/Avatar/kids.png') },
  { label: 'Tuition Teacher', plural: 'Tuition Teachers', role: 'tuition_teacher', image: require('../../../assets/Avatar/teacher.png') },
  { label: 'Tuition Student', plural: 'Tuition Students', role: 'tuition_student', image: require('../../../assets/Avatar/tuitio-student.png') },
  { label: 'Nanny', plural: 'Nannies', role: 'nanny', image: require('../../../assets/Avatar/Nanny-avatrt.png') },
];

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

// ─── Aurora Glass background layer ─────────────────────────────────────────────
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

// ─── Status popup ──────────────────────────────────────────────────────────────
function StatusPopup({ visible, title, message, type, onClose }: {
  visible: boolean; title: string; message: string; type: 'success' | 'error' | 'info'; onClose: () => void;
}) {
  const color = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6';
  const icon = type === 'success' ? 'check-circle-outline' : type === 'error' ? 'alert-circle-outline' : 'information-outline';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(31,45,40,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
        <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 24, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: color + '1F', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name={icon} size={32} color={color} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 16, textAlign: 'center' }}>{title}</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: TEXT_SECONDARY, marginTop: 8, textAlign: 'center', lineHeight: 19 }}>{message}</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={{ marginTop: 20, alignSelf: 'stretch', height: 50, borderRadius: 16, overflow: 'hidden' }}
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 12 }}>Okay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Confirm popup ─────────────────────────────────────────────────────────────
function ConfirmPopup({ visible, title, message, onCancel, onConfirm }: {
  visible: boolean; title: string; message: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(31,45,40,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
        <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 24, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="trash-can-outline" size={32} color="#EF4444" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 16, textAlign: 'center' }}>{title}</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: TEXT_SECONDARY, marginTop: 8, textAlign: 'center', lineHeight: 19 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, alignSelf: 'stretch' }}>
            <TouchableOpacity onPress={onCancel} activeOpacity={0.8} style={{ flex: 1, height: 50, borderRadius: 16, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_SECONDARY }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} activeOpacity={0.85} style={{ flex: 1, height: 50, borderRadius: 16, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#FFFFFF' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── User card ─────────────────────────────────────────────────────────────────
const ROLE_ICONS: Record<string, any> = {
  student: STUDENT_ICON,
  teacher: TEACHER_ICON,
  nanny: KINDERGARTEN_ICON,
  admin: EDUCATION_ICON,
};

const UserCard = React.memo(({ user, branchName, onEdit, onToggle, onDelete }: {
  user: User; branchName: string;
  onEdit: (u: User) => void;
  onToggle: (id: string) => void;
  onDelete: (u: User) => void;
}) => {
  const [showActions, setShowActions] = useState(false);
  const isActive = user.status === 'active';
  const roleColor = ROLE_COLORS[user.role] || '#4A5B53';
  const isStudent = user.role === 'student' || user.role === 'tuition_student';

  return (
    <View style={{ marginBottom: 14, borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', overflow: 'hidden' }}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => setShowActions(!showActions)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: roleColor }} />
          <View style={{ width: 52, height: 52, borderRadius: 16, marginLeft: 12, backgroundColor: roleColor + '1F', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Image source={ROLE_ICONS[user.role] || EDUCATION_ICON} style={{ width: 44, height: 44 }} resizeMode="contain" />
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY }} numberOfLines={1}>{user.name}</Text>
              <View style={{ backgroundColor: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 }}>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isActive ? '#059669' : '#DC2626' }}>
                  {isActive ? 'Active' : 'Disabled'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_MUTED }}>@{user.username}</Text>
              <Text style={{ fontSize: 10, color: TEXT_MUTED, marginHorizontal: 4 }}>|</Text>
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: TEXT_MUTED }}>{user.studentId || user.teacherId || 'ADMIN'}</Text>
              {!!branchName && (
                <>
                  <Text style={{ fontSize: 10, color: TEXT_MUTED, marginHorizontal: 4 }}>|</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_MUTED }}>{branchName}</Text>
                </>
              )}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 }}>
              <View style={{ backgroundColor: roleColor + '14', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 }}>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: roleColor }}>{user.role}</Text>
              </View>
              {user.gender && (
                <View style={{ backgroundColor: 'rgba(247,249,246,0.95)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED }}>{user.gender}</Text>
                </View>
              )}
              {user.role === 'student' && user.category && (
                <View style={{ backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#3B82F6' }}>{user.category}</Text>
                </View>
              )}
              {user.role === 'student' && !!user.fees && (
                <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', color: '#D97706' }}>₹{user.fees}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(247,249,246,0.95)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name={showActions ? 'chevron-up' : 'dots-vertical'} size={18} color={TEXT_MUTED} />
          </View>
        </View>
      </TouchableOpacity>

      {showActions && (
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(31,45,40,0.06)', backgroundColor: 'rgba(247,249,246,0.5)', paddingVertical: 10, paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => { setShowActions(false); onEdit(user); }} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color="#D97706" />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginTop: 4 }}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity disabled={isStudent} onPress={() => { setShowActions(false); onToggle(user.id); }} style={{ flex: 1, alignItems: 'center', opacity: isStudent ? 0.4 : 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isActive ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={isStudent ? 'lock-outline' : (isActive ? 'account-cancel-outline' : 'account-check-outline')} size={16} color={isStudent ? '#D97706' : (isActive ? '#EF4444' : '#10B981')} />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginTop: 4 }}>
              {isStudent ? 'Pay to Live' : (isActive ? 'Disable' : 'Enable')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity disabled={user.role === 'admin' || user.role === 'master_admin'} onPress={() => { setShowActions(false); onDelete(user); }} style={{ flex: 1, alignItems: 'center', opacity: (user.role === 'admin' || user.role === 'master_admin') ? 0.3 : 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#EF4444', marginTop: 4 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

// ─── Shared field label ────────────────────────────────────────────────────────
function FieldRow({ icon, label, required = false, children }: {
  icon: string; label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
        <View style={{ width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', marginRight: 8 }}>
          <MaterialCommunityIcons name={icon as any} size={14} color={brandColor} />
        </View>
        <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED }}>
          {label}{required ? <Text style={{ color: brandColor }}> *</Text> : ' (opt)'}
        </Text>
      </View>
      {children}
    </View>
  );
}

// ─── Add/Edit form modal ───────────────────────────────────────────────────────
function UserFormModal({ visible, onClose, initial, isEdit, onSave, isSubmitting, payToActive }: {
  visible: boolean; onClose: () => void; initial?: User | null; isEdit: boolean;
  onSave: (data: any) => void; isSubmitting: boolean; payToActive?: boolean;
}) {
  const { user, branches } = useAuth();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    name: '', username: '', dateOfBirth: '', fatherName: '', motherName: '',
    fatherPhone: '', motherPhone: '', category: 'Playschool' as CategoryType,
    email: '', phone: '', password: '', role: 'student', gender: 'Male' as 'Male' | 'Female',
    fees: '', monthly_fee: '', fee_due_day: '5', branch_id: '', batch_id: '',
    studentIdProof: '', fatherIdProof: '', motherIdProof: '', guardianIdProof: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [pendingIdProofField, setPendingIdProofField] = useState<string | null>(null);
  const [previewIdProof, setPreviewIdProof] = useState<{ field: string; label: string; uri: string } | null>(null);

  const handleIdProofResult = (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets[0].base64 && pendingIdProofField) {
      set(pendingIdProofField, `data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const launchCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permission to capture ID proofs!');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.4,
        base64: true,
      });
      handleIdProofResult(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const launchLibraryPicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload ID proofs!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.4,
        base64: true,
      });
      handleIdProofResult(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickIdProof = (field: string) => {
    setPendingIdProofField(field);
  };

  const idProofItems = [
    { field: 'studentIdProof', label: 'Student ID Proof', color: '#3B82F6', uri: formData.studentIdProof },
    { field: 'fatherIdProof', label: 'Father ID Proof', color: '#F59E0B', uri: formData.fatherIdProof },
    { field: 'motherIdProof', label: 'Mother ID Proof', color: '#10B981', uri: formData.motherIdProof },
    { field: 'guardianIdProof', label: 'Guardian ID Proof', color: '#7C3AED', uri: formData.guardianIdProof },
  ];
  const uploadedIdProofCount = idProofItems.filter(i => !!i.uri).length;

  const openIdProofPreview = (field: string) => {
    const item = idProofItems.find(i => i.field === field);
    if (item?.uri) setPreviewIdProof({ field: item.field, label: item.label, uri: item.uri });
  };

  const renderIdProofCard = (field: string, label: string, icon: string, color: string, uri?: string) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => pickIdProof(field)}
      style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: uri ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.6)',
        borderRadius: 16, padding: 10, marginBottom: 10,
      }}
    >
      <View style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', backgroundColor: color + '1A', alignItems: 'center', justifyContent: 'center' }}>
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name="card-account-details-outline" size={26} color={color} />
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: TEXT_PRIMARY }}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: uri ? '#10B981' : '#D1D5DB', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="check" size={9} color="#FFFFFF" />
          </View>
          <Text style={{ fontSize: 9, fontWeight: '700', color: uri ? '#059669' : TEXT_MUTED, marginLeft: 5 }}>
            {uri ? 'Uploaded' : 'Not uploaded'}
          </Text>
        </View>
      </View>
      {uri && (
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); openIdProofPreview(field); }}
          style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}
        >
          <MaterialCommunityIcons name="eye-outline" size={17} color="#3B82F6" />
        </TouchableOpacity>
      )}
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: uri ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={uri ? 'check-circle-outline' : 'camera-plus-outline'} size={15} color={uri ? '#059669' : '#D97706'} />
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    if (!visible) return;
    setFormData({
      name: initial?.name || '',
      username: (initial as any)?.username || '',
      dateOfBirth: (initial as any)?.date_of_birth || '',
      fatherName: (initial as any)?.father_name || initial?.fatherName || '',
      motherName: (initial as any)?.mother_name || initial?.motherName || '',
      fatherPhone: (initial as any)?.father_phone || initial?.fatherPhone || '',
      motherPhone: (initial as any)?.mother_phone || initial?.motherPhone || '',
      category: ((initial as any)?.category as CategoryType) || 'Playschool',
      email: initial?.email || '',
      phone: initial?.phone || '',
      password: '',
      role: (initial?.role as string) || 'student',
      gender: (initial?.gender as 'Male' | 'Female') || 'Male',
      fees: (initial as any)?.fees?.toString() || '',
      monthly_fee: (initial as any)?.monthly_fee?.toString() || '',
      fee_due_day: ((initial as any)?.fee_due_day?.toString()) || '5',
      branch_id: initial?.branch_id?.toString() || (user?.role === 'admin' ? user?.branch_id?.toString() || '' : ''),
      batch_id: (initial as any)?.batch_id?.toString() || '',
      studentIdProof: initial?.studentIdProof || (initial as any)?.student_id_proof || '',
      fatherIdProof: initial?.fatherIdProof || (initial as any)?.father_id_proof || '',
      motherIdProof: initial?.motherIdProof || (initial as any)?.mother_id_proof || '',
      guardianIdProof: initial?.guardianIdProof || (initial as any)?.guardian_id_proof || '',
    });
  }, [visible, initial, user]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/batches');
        setBatches(res.data?.data || (Array.isArray(res.data) ? res.data : []));
      } catch {}
    })();
  }, []);

  const set = useCallback((field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value })), []);

  const isStudentRole = formData.role === 'student' || formData.role === 'tuition_student';

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!formData.name.trim()) m.push('Name');
    if (!formData.username.trim()) m.push('Username');
    if (!formData.phone.trim()) m.push('Phone Number');
    if (!isEdit && !formData.password.trim()) m.push('Initial Password');
    if (formData.password && formData.password.length < 6) m.push('Password (min 6 chars)');
    if (isStudentRole && !formData.monthly_fee?.toString().trim()) m.push('Monthly Fee');
    if (isStudentRole && !formData.fee_due_day?.toString().trim()) m.push('Fee Due Date');
    if (isStudentRole && parseInt(formData.fee_due_day as any, 10) > 28) m.push('Fee Due Date (max 28)');
    if (isStudentRole && payToActive && !formData.fees?.toString().trim()) m.push('Admission Fee');
    return m;
  }, [formData, isEdit, isStudentRole, payToActive]);

  const isValid = missing.length === 0;

  const dueDayInvalid = isStudentRole &&
    !!formData.fee_due_day?.toString().trim() &&
    (parseInt(formData.fee_due_day as any, 10) > 28 || parseInt(formData.fee_due_day as any, 10) < 1);

  const inp = { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontWeight: '700' as const, color: TEXT_PRIMARY, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' };
  const rowInp = { ...inp, flex: 1, height: 52, paddingVertical: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#F7F9F6', paddingTop: insets.top }}>
        <AuroraBackground />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={onClose} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={22} color={TEXT_PRIMARY} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Directory</Text>
                <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: -0.5 }}>{isEdit ? 'Update Member' : 'Register Member'}</Text>
              </View>
              <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={TEAM_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
              </View>
            </View>

            <View style={{ marginTop: 24 }}>
              <GlassSelectV2
                label="Role"
                value={formData.role}
                placeholder="Select Role"
                options={[
                  ...(user?.role === 'master_admin' ? [{ label: 'Admin', value: 'admin' }] : []),
                  { label: 'Student', value: 'student' },
                  { label: 'Teacher', value: 'teacher' },
                  { label: 'Nanny', value: 'nanny' },
                ]}
                onSelect={(v) => { Keyboard.dismiss(); set('role', v || 'student'); }}
                icon={TEAM_ICON}
                title="Select Role"
                subtitle="Choose the member type"
              />

              <FieldRow icon="gender-male-female" label="Gender" required>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['Male', 'Female'] as const).map(g => (
                    <TouchableOpacity key={g} activeOpacity={0.7} onPress={() => { Keyboard.dismiss(); set('gender', g); }}
                      style={{ flex: 1, paddingVertical: 13, borderRadius: 16, alignItems: 'center', backgroundColor: formData.gender === g ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: formData.gender === g ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.6)' }}>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: formData.gender === g ? '#D97706' : TEXT_MUTED }}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </FieldRow>

              {user?.role === 'master_admin' && (
                <GlassSelectV2
                  label="Branch"
                  value={formData.branch_id || null}
                  placeholder="Select Branch"
                  options={branches.map(b => ({ label: b.name, value: b.id?.toString() }))}
                  onSelect={(v) => { Keyboard.dismiss(); set('branch_id', v || ''); }}
                  icon={KINDERGARTEN_ICON}
                  title="Select Branch"
                  subtitle="Assign to a branch"
                />
              )}

              <FieldRow icon="account" label="Name" required>
                <TextInput style={inp} placeholder="e.g. Rahul Sharma" placeholderTextColor="#9CA3AF" value={formData.name} onChangeText={v => set('name', v)} />
              </FieldRow>

              <FieldRow icon="at" label="Username" required>
                <TextInput style={inp} placeholder="e.g. rahul_s" placeholderTextColor="#9CA3AF" autoCapitalize="none" value={formData.username} onChangeText={v => set('username', v)} />
                <Text style={{ fontSize: 9, color: brandColor, marginTop: 4, fontWeight: '700' }}>* MUST BE UNIQUE FOR LOGIN</Text>
              </FieldRow>

              {isStudentRole && (
                <>
                  <FieldRow icon="cake-variant" label="Date of Birth">
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setShowDobPicker(true)}
                      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }}>
                      <MaterialCommunityIcons name="calendar" size={20} color="#D97706" />
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: formData.dateOfBirth ? TEXT_PRIMARY : '#9CA3AF', marginLeft: 10 }}>
                        {formData.dateOfBirth || 'Select date of birth'}
                      </Text>
                      {formData.dateOfBirth ? (
                        <TouchableOpacity onPress={() => set('dateOfBirth', '')}>
                          <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      ) : null}
                    </TouchableOpacity>
                    {showDobPicker && (
                      <DateTimePicker
                        value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date(2015, 0, 1)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        maximumDate={new Date()}
                        onChange={(_event: DateTimePickerEvent, date?: Date) => {
                          setShowDobPicker(Platform.OS === 'ios');
                          if (date) {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            set('dateOfBirth', `${y}-${m}-${d}`);
                          }
                        }}
                      />
                    )}
                  </FieldRow>

                  <FieldRow icon="account-tie" label="Father Details">
                    <TextInput style={{ ...inp, marginBottom: 8 }} placeholder="Father's Name" placeholderTextColor="#9CA3AF" value={formData.fatherName} onChangeText={v => set('fatherName', v)} />
                    <TextInput style={inp} placeholder="Father's Phone" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" maxLength={10} value={formData.fatherPhone} onChangeText={v => set('fatherPhone', v.replace(/[^0-9]/g, '').slice(0, 10))} />
                  </FieldRow>

                  <FieldRow icon="account-heart" label="Mother Details">
                    <TextInput style={{ ...inp, marginBottom: 8 }} placeholder="Mother's Name" placeholderTextColor="#9CA3AF" value={formData.motherName} onChangeText={v => set('motherName', v)} />
                    <TextInput style={inp} placeholder="Mother's Phone" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" maxLength={10} value={formData.motherPhone} onChangeText={v => set('motherPhone', v.replace(/[^0-9]/g, '').slice(0, 10))} />
                  </FieldRow>

                  <GlassSelectV2
                    label="Category"
                    value={formData.category}
                    placeholder="Select Category"
                    options={(formData.role === 'tuition_student' || formData.role === 'tuition_teacher' ? TUITION_CATEGORIES : STUDENT_CATEGORIES).map(cat => ({ label: cat, value: cat }))}
                    onSelect={(v) => { Keyboard.dismiss(); set('category', v || 'Playschool'); }}
                    icon={EDUCATION_ICON}
                    title="Select Category"
                    subtitle="Student category"
                  />

                  {formData.role === 'tuition_student' && batches.length > 0 && (
                    <GlassSelectV2
                      label="Batch"
                      value={formData.batch_id ? formData.batch_id.toString() : null}
                      placeholder="Select Batch"
                      options={batches.map((b: any) => ({ label: b.name, value: b.id?.toString() }))}
                      onSelect={(v) => { Keyboard.dismiss(); set('batch_id', v || ''); }}
                      icon={KINDERGARTEN_ICON}
                      title="Select Batch"
                      subtitle="Assign tuition batch"
                    />
                  )}

                  <FieldRow icon="currency-inr" label="Monthly Fee" required>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#2563EB', width: 48, height: 52, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>₹</Text>
                        </View>
                        <TextInput style={rowInp} placeholder="Monthly Amount" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={formData.monthly_fee ? formData.monthly_fee.toString() : ''} onChangeText={v => set('monthly_fee', v)} />
                      </View>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#FBBF24', width: 48, height: 52, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialCommunityIcons name="calendar-clock" size={20} color="#92400E" />
                        </View>
                        <TextInput style={{ ...rowInp, borderColor: dueDayInvalid ? '#EF4444' : 'rgba(255,255,255,0.6)' }} placeholder="Due Date" placeholderTextColor="#9CA3AF" keyboardType="numeric" maxLength={2} value={formData.fee_due_day ? formData.fee_due_day.toString() : ''} onChangeText={v => set('fee_due_day', v.replace(/\D/g, '').slice(0, 2))} />
                      </View>
                    </View>
                    {dueDayInvalid && (
                      <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700', marginTop: 4 }}>Due Date must be between 1 and 28.</Text>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: dueDayInvalid ? 2 : 6 }}>
                      <Text style={{ fontSize: 9, color: '#2563EB', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>* Monthly Fee (required)</Text>
                      <Text style={{ fontSize: 9, color: dueDayInvalid ? '#EF4444' : '#FBBF24', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Due Date (1-28)</Text>
                    </View>
                  </FieldRow>

                  <FieldRow icon="currency-inr" label="Admission Fee" required={!!(payToActive && isStudentRole)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ backgroundColor: '#7C3AED', width: 48, height: 52, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>₹</Text>
                      </View>
                      <TextInput style={{ ...rowInp, borderRadius: 16, borderColor: (payToActive && isStudentRole && !formData.fees?.toString().trim()) ? '#EF4444' : undefined }} placeholder="Admission Amount" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={formData.fees ? formData.fees.toString() : ''} onChangeText={v => set('fees', v)} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text style={{ fontSize: 9, color: (payToActive && isStudentRole) ? '#EF4444' : '#7C3AED', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {(payToActive && isStudentRole) ? '* Admission Fee (required when Pay-to-Active is ON)' : 'Admission Fee'}
                      </Text>
                      <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>No due date</Text>
                    </View>
                  </FieldRow>

                  <FieldRow icon="card-account-details-outline" label="ID Proofs (Aadhar / ID Cards)">
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: TEXT_SECONDARY }}>
                        {uploadedIdProofCount === 4 ? 'All 4 ID proofs uploaded' : `${uploadedIdProofCount} of 4 ID proofs uploaded`}
                      </Text>
                      <View style={{ flexDirection: 'row', marginLeft: 'auto', gap: 4 }}>
                        {idProofItems.map((it) => (
                          <View key={it.field} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: it.uri ? '#10B981' : '#D1D5DB' }} />
                        ))}
                      </View>
                    </View>
                    {renderIdProofCard('studentIdProof', 'Student ID Proof', 'school', '#3B82F6', formData.studentIdProof)}
                    {renderIdProofCard('fatherIdProof', 'Father ID Proof', 'account-tie', '#F59E0B', formData.fatherIdProof)}
                    {renderIdProofCard('motherIdProof', 'Mother ID Proof', 'account-heart', '#10B981', formData.motherIdProof)}
                    {renderIdProofCard('guardianIdProof', 'Guardian ID Proof', 'account-group', '#7C3AED', formData.guardianIdProof)}
                    <Text style={{ fontSize: 9, color: TEXT_MUTED, fontWeight: '600', marginTop: 2, lineHeight: 14 }}>
                      Upload Aadhar / Government ID for student and guardians. Tap the eye icon to preview.
                    </Text>
                  </FieldRow>
                </>
              )}

              <FieldRow icon="email-outline" label="Email ID">
                <TextInput style={inp} placeholder="email@example.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={v => set('email', v)} />
              </FieldRow>

              <FieldRow icon="phone" label="Phone Number" required>
                <TextInput style={inp} placeholder="10-digit Number" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" maxLength={10} value={formData.phone} onChangeText={v => set('phone', v.replace(/[^0-9]/g, '').slice(0, 10))} />
              </FieldRow>

              <FieldRow icon="lock-outline" label={isEdit ? 'New Password' : 'Initial Password'} required={!isEdit}>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TextInput style={{ ...inp, paddingRight: 50 }} placeholder={isEdit ? 'Leave blank to keep current' : '••••••••'} placeholderTextColor="#9CA3AF" secureTextEntry={!showPassword} maxLength={20} value={formData.password} onChangeText={v => set('password', v)} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 15, padding: 5 }}>
                    <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 9, color: formData.password.length > 0 && formData.password.length < 6 ? '#EF4444' : brandColor, marginTop: 4, fontWeight: '700' }}>* MUST BE AT LEAST 6 CHARACTERS</Text>
              </FieldRow>

              {missing.length > 0 && (
                <View style={{ backgroundColor: '#FEF2F2', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700', marginLeft: 8 }}>{missing.join(' · ')}</Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  if (!isValid) { onSave(null); return; }
                  if (!isSubmitting) onSave(formData);
                }}
                style={{ height: 56, borderRadius: 18, overflow: 'hidden' }}
              >
                <LinearGradient colors={isSubmitting ? ['#D1D5DB', '#9CA3AF'] : (isValid ? ['#F59E0B', '#D97706'] : ['#FCA5A5', '#F87171'])} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name={isEdit ? 'content-save' : 'account-plus'} size={20} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 13, marginLeft: 8 }}>
                        {isEdit ? 'Save Changes' : (isValid ? 'Register Member' : 'Check Details ⚠️')}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* ── ID Proof upload chooser popup ── */}
      <Modal visible={!!pendingIdProofField} transparent animationType="fade" onRequestClose={() => setPendingIdProofField(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,20,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ width: '100%', maxWidth: 400, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', padding: 20 }}>
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.14)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
              <MaterialCommunityIcons name="card-account-details-outline" size={28} color="#D97706" />
            </View>
            <Text style={{ fontSize: 19, fontWeight: '900', color: TEXT_PRIMARY, textAlign: 'center', marginTop: 14 }}>
              Upload ID Proof
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, textAlign: 'center', marginTop: 5, lineHeight: 16 }}>
              {idProofItems.find(i => i.field === pendingIdProofField)?.label || 'Select the document to upload'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { setPendingIdProofField(null); launchCameraCapture(); }}
                style={{ flex: 1, borderRadius: 18, backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)', paddingVertical: 18, alignItems: 'center' }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="camera" size={24} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#2563EB', marginTop: 10 }}>Take Photo</Text>
                <Text style={{ fontSize: 9, fontWeight: '600', color: TEXT_MUTED, marginTop: 3 }}>Capture with camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { setPendingIdProofField(null); launchLibraryPicker(); }}
                style={{ flex: 1, borderRadius: 18, backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', paddingVertical: 18, alignItems: 'center' }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="folder-image" size={24} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#059669', marginTop: 10 }}>From Library</Text>
                <Text style={{ fontSize: 9, fontWeight: '600', color: TEXT_MUTED, marginTop: 3 }}>Choose existing photo</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPendingIdProofField(null)}
              style={{ marginTop: 14, height: 48, borderRadius: 16, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_SECONDARY }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ID Proof preview popup ── */}
      <Modal visible={!!previewIdProof} transparent animationType="fade" onRequestClose={() => setPreviewIdProof(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,20,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ width: '100%', maxWidth: 400, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', padding: 20, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#3B82F6" />
            </View>
            <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED, marginTop: 12 }}>
              ID Proof Preview
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color: TEXT_PRIMARY, marginTop: 4, textAlign: 'center' }}>
              {previewIdProof?.label}
            </Text>
            <View style={{ width: '100%', height: 280, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(247,249,246,0.9)', marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
              {previewIdProof?.uri && (
                <Image source={{ uri: previewIdProof.uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="check" size={9} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669', marginLeft: 6 }}>Uploaded successfully</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPreviewIdProof(null)}
              style={{ marginTop: 18, alignSelf: 'stretch', height: 50, borderRadius: 16, overflow: 'hidden' }}
            >
              <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 12 }}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
interface NavigationProps { navigate: (screen: string, params?: any) => void; goBack: () => void; }
interface Props { navigation: NavigationProps; route?: { params?: any }; }

export default function UserMange({ navigation, route }: Props) {
  const { user, users, branches, addUser, updateUser, deleteUser, toggleUserStatus, fetchData } = useAuth();
  const insets = useSafeAreaInsets();
  const isMasterAdmin = user?.role === 'master_admin';

  const [refreshing, setRefreshing] = useState(false);
  const [payToActive, setPayToActive] = useState(false);
  const [filter, setFilter] = useState<'all' | 'master_admin' | 'admin' | 'teacher' | 'student' | 'tuition_teacher' | 'tuition_student' | 'nanny'>('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(isMasterAdmin ? null : (user?.branch_id?.toString() || null));
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [statusPopup, setStatusPopup] = useState({ visible: false, title: '', message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  useEffect(() => {
    if (!isMasterAdmin && user?.branch_id) {
      setSelectedBranchId(user.branch_id?.toString());
    }
  }, [isMasterAdmin, user?.branch_id]);

  useEffect(() => {
    (async () => {
      try {
        // Backend is the source of truth; AsyncStorage is only a cache.
        const res = await api.get('/settings/pay-to-active');
        const backendValue = res.data?.pay_to_active;
        if (typeof backendValue === 'boolean') {
          setPayToActive(backendValue);
          AsyncStorage.setItem('payToActive', String(backendValue)).catch(() => {});
          return;
        }
      } catch {}
      try {
        const stored = await AsyncStorage.getItem('payToActive');
        if (stored !== null) setPayToActive(stored === 'true');
      } catch {}
    })();
  }, []);

  const togglePayToActive = useCallback(async () => {
    if (!isMasterAdmin) return;
    const next = !payToActive;
    setPayToActive(next);
    AsyncStorage.setItem('payToActive', String(next)).catch(() => {});
    try {
      await api.post('/settings/pay-to-active', { value: next });
    } catch {
      // Never fail silently: revert the switch and inform the admin.
      setPayToActive(!next);
      AsyncStorage.setItem('payToActive', String(!next)).catch(() => {});
      setStatusPopup({ visible: true, title: 'Error', message: 'Could not save the Pay to Active setting. Please try again.', type: 'error' });
    }
  }, [payToActive, isMasterAdmin]);

  useEffect(() => {
    const role = route?.params?.role;
    if (role && (role === 'master_admin' || role === 'admin' || role === 'teacher' || role === 'student' || role === 'tuition_teacher' || role === 'tuition_student' || role === 'nanny')) {
      setFilter(role);
    }
  }, [route?.params?.role]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchData(); } catch (e) { console.error('Refresh Error:', e); }
    finally { setRefreshing(false); }
  }, [fetchData]);

  const displayedUsers = useMemo(() => {
    let list = filter === 'all'
      ? users.filter(u => u.role !== 'master_admin' && u.role !== 'tuition_teacher' && u.role !== 'tuition_student')
      : users.filter(u => u.role === filter);
    if (selectedBranchId) {
      list = list.filter(u => u.branch_id?.toString() === selectedBranchId);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        (u.studentId && u.studentId.toLowerCase().includes(q)) ||
        (u.teacherId && u.teacherId.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return 0;
    });
  }, [users, filter, search, selectedBranchId]);

  const handleSave = useCallback(async (data: any) => {
    if (!data) {
      setStatusPopup({ visible: true, title: 'Form Incomplete', message: 'Please fill in all mandatory fields before saving.', type: 'info' });
      return;
    }

    if (editingUser) {
      setIsSubmitting(true);
      try {
        const isStudentRole = data.role === 'student' || data.role === 'tuition_student';
        const payload: any = {};
        Object.entries({
          name: data.name,
          username: data.username || undefined,
          email: data.email || undefined,
          phone: data.phone,
          gender: data.gender,
          branch_id: data.branch_id || undefined,
          father_name: isStudentRole ? data.fatherName : undefined,
          mother_name: isStudentRole ? data.motherName : undefined,
          father_phone: isStudentRole ? data.fatherPhone : undefined,
          mother_phone: isStudentRole ? data.motherPhone : undefined,
          category: isStudentRole ? data.category : undefined,
          fees: isStudentRole ? data.fees : undefined,
          monthly_fee: isStudentRole ? data.monthly_fee : undefined,
          fee_due_day: isStudentRole ? data.fee_due_day : undefined,
          date_of_birth: isStudentRole && data.dateOfBirth ? data.dateOfBirth : undefined,
          batch_id: data.batch_id ? data.batch_id : undefined,
          student_id_proof: isStudentRole && data.studentIdProof ? data.studentIdProof : undefined,
          father_id_proof: isStudentRole && data.fatherIdProof ? data.fatherIdProof : undefined,
          mother_id_proof: isStudentRole && data.motherIdProof ? data.motherIdProof : undefined,
          guardian_id_proof: isStudentRole && data.guardianIdProof ? data.guardianIdProof : undefined,
        }).forEach(([k, v]) => { if (v !== undefined) payload[k] = v; });
        if (data.password) payload.password = data.password;
        await updateUser(editingUser.id, payload);
        setShowForm(false);
        setEditingUser(null);
        setStatusPopup({ visible: true, title: 'Changes Saved!', message: `${data.name} has been updated.`, type: 'success' });
      } catch (err: any) {
        setStatusPopup({ visible: true, title: 'System Error', message: err?.response?.data?.message || 'Something went wrong. Please try again.', type: 'error' });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (data.role === 'admin' && isMasterAdmin) {
      const branchId = data.branch_id;
      if (!branchId) {
        setStatusPopup({ visible: true, title: 'Branch Required', message: 'Please select a branch for the admin account.', type: 'info' });
        return;
      }
      const existingAdmins = users.filter(u => u.role === 'admin' && u.branch_id === branchId && u.status === 'active').length;
      if (existingAdmins >= 3) {
        setStatusPopup({ visible: true, title: 'Admin Limit Reached', message: `This branch already has ${existingAdmins} active admins. Maximum 3 allowed per branch.`, type: 'error' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const branch = branches.find(b => b.id?.toString() === data.branch_id?.toString());
      const SCHOOL_CODE = 'TNHK';
      const isStudentRole = data.role === 'student' || data.role === 'tuition_student';
      const isTeacherRole = data.role === 'teacher' || data.role === 'tuition_teacher';

      let branchCode: string = 'XX';
      if (branch) {
        const letters = branch.name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
        const collides = branches.some(b =>
          b.id?.toString() !== branch.id?.toString() &&
          b.name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() === letters
        );
        branchCode = collides ? branch.id.toString() : letters;
      }

      const roleToken = data.role === 'tuition_student' || data.role === 'tuition_teacher' ? 'TU' : data.role === 'student' ? 'S' : 'T';
      const prefix = `${SCHOOL_CODE}${roleToken}${branchCode}`;

      const branchRoleUsers = users.filter(u =>
        u.branch_id?.toString() === data.branch_id?.toString() &&
        (isStudentRole ? (u.role === 'student' || u.role === 'tuition_student') : (u.role === 'teacher' || u.role === 'tuition_teacher'))
      );
      const maxSeq = branchRoleUsers
        .map(u => {
          const id = u.studentId || u.teacherId || '';
          if (!id.startsWith(prefix)) return 0;
          return parseInt(id.slice(prefix.length), 10) || 0;
        })
        .reduce((max, n) => Math.max(max, n), 0);
      const nextSeq = (maxSeq + 1).toString().padStart(3, '0');

      const payload: any = {};
      Object.entries({
        name: data.name,
        username: data.username || undefined,
        date_of_birth: isStudentRole && data.dateOfBirth ? data.dateOfBirth : undefined,
        email: data.email || undefined,
        phone: data.phone,
        role: data.role,
        gender: data.gender,
        password: data.password,
        status: (payToActive && isStudentRole) ? 'pending_payment' : 'active',
        pay_to_active: (payToActive && isStudentRole) ? true : undefined,
        branch_id: data.branch_id || undefined,
        father_name: isStudentRole ? data.fatherName : undefined,
        mother_name: isStudentRole ? data.motherName : undefined,
        father_phone: isStudentRole ? data.fatherPhone : undefined,
        mother_phone: isStudentRole ? data.motherPhone : undefined,
        category: isStudentRole ? data.category : undefined,
        fees: isStudentRole ? data.fees : undefined,
        monthly_fee: isStudentRole ? data.monthly_fee : undefined,
        fee_due_day: isStudentRole ? data.fee_due_day : undefined,
        batch_id: data.batch_id ? data.batch_id : undefined,
        student_id_proof: isStudentRole && data.studentIdProof ? data.studentIdProof : undefined,
        father_id_proof: isStudentRole && data.fatherIdProof ? data.fatherIdProof : undefined,
        mother_id_proof: isStudentRole && data.motherIdProof ? data.motherIdProof : undefined,
        guardian_id_proof: isStudentRole && data.guardianIdProof ? data.guardianIdProof : undefined,
      }).forEach(([k, v]) => { if (v !== undefined) payload[k] = v; });

      if (isStudentRole) payload.student_id = `${prefix}${nextSeq}`;
      if (isTeacherRole) payload.teacher_id = `${prefix}${nextSeq}`;

      await addUser(payload);
      setShowForm(false);
      setStatusPopup({ visible: true, title: 'User Added!', message: `${data.name} has been registered.`, type: 'success' });
    } catch (err: any) {
      setStatusPopup({ visible: true, title: 'System Error', message: err?.response?.data?.message || 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [editingUser, isMasterAdmin, users, branches, addUser, updateUser, payToActive]);

  const handleDelete = useCallback(async (target: User) => {
    if (target.role === 'admin' || target.role === 'master_admin') {
      setStatusPopup({ visible: true, title: 'Protected Account', message: 'Administrator accounts cannot be deleted for security reasons.', type: 'info' });
      setConfirmDelete(null);
      return;
    }
    setConfirmDelete(null);
    try {
      await deleteUser(target.id);
      setStatusPopup({ visible: true, title: 'Deleted!', message: `${target.name} has been removed.`, type: 'success' });
    } catch {
      setStatusPopup({ visible: true, title: 'Error', message: 'Failed to delete user. Please try again.', type: 'error' });
    }
  }, [deleteUser]);

  const openEdit = useCallback(async (u: User) => {
    setIsLoadingUser(true);
    try {
      const res = await api.get(`/users/${u.id}`);
      const raw = res.data?.data && !Array.isArray(res.data.data) ? res.data.data : res.data;
      const full = {
        ...u,
        studentIdProof: (raw as any)?.student_id_proof || '',
        fatherIdProof: (raw as any)?.father_id_proof || '',
        motherIdProof: (raw as any)?.mother_id_proof || '',
        guardianIdProof: (raw as any)?.guardian_id_proof || '',
      };
      setEditingUser(full);
      setShowForm(true);
    } catch (e) {
      setEditingUser(u);
      setShowForm(true);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const renderItem: ListRenderItem<User> = useCallback(({ item }) => {
    const branch = branches.find(b => b.id?.toString() === item.branch_id?.toString());
    return (
      <UserCard
        user={item}
        branchName={branch?.name || ''}
        onEdit={openEdit}
        onToggle={toggleUserStatus}
        onDelete={(u) => setConfirmDelete(u)}
      />
    );
  }, [branches, toggleUserStatus, openEdit]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      {/* ── Header ── */}
      <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Directory</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>User Management</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => { setShowSearch(prev => { if (prev) setSearch(''); return !prev; }); }} style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={showSearch ? 'close' : 'magnify'} size={24} color={showSearch ? '#D97706' : TEXT_PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEditingUser(null); setShowForm(true); }} style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={TEAM_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </View>

        {isMasterAdmin && (
          <View style={{ marginTop: 20 }}>
            <GlassSelectV2
              label="Branch"
              value={selectedBranchId}
              placeholder="All Branches"
              options={branches.map(b => ({ label: b.name, value: b.id?.toString(), hint: 'Manage this branch' }))}
              onSelect={setSelectedBranchId}
              icon={KINDERGARTEN_ICON}
              title="Select Branch"
              subtitle="Filter everything by location"
              footerHint="Selected branch is applied to all management views below."
              showAllOption
              allLabel="All Branches"
              allHint={`${branches.length} branches combined`}
            />
          </View>
        )}

        {isMasterAdmin && (
          <View style={{ marginTop: 14 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: payToActive ? brandColor : '#1F2D28',
              borderRadius: 18, padding: 14,
              borderWidth: 1, borderColor: payToActive ? brandColor : '#1F2D28',
              elevation: 3,
            }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="cash-lock" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFFFFF' }}>Pay to Active</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                  {payToActive ? 'ON - New students must pay admission fee before access' : 'OFF - New students get instant access'}
                </Text>
              </View>
              <TouchableOpacity onPress={togglePayToActive}
                style={{
                  width: 50, height: 28, borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.35)',
                  justifyContent: 'center', paddingHorizontal: 3,
                }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11, backgroundColor: 'white',
                  alignSelf: payToActive ? 'flex-end' : 'flex-start',
                }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Circular avatar list (64px, gap 18) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 22, marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {ROLE_AVATARS.map((role, i) => {
            const active = filter === role.role;
            return (
              <TouchableOpacity key={role.label} activeOpacity={0.8} onPress={() => setFilter(prev => prev === role.role ? 'all' : role.role as typeof filter)}
                style={{ alignItems: 'center', marginRight: i < ROLE_AVATARS.length - 1 ? 20 : 0 }}>
                <View
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    backgroundColor: '#E3EBE7',
                    borderWidth: 3,
                    borderColor: active ? '#F59E0B' : '#FFFFFF',
                    shadowColor: '#000000',
                    shadowOpacity: active ? 0.18 : 0.05,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Image source={role.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: active ? '800' : '600',
                    color: active ? '#D97706' : TEXT_MUTED,
                    maxWidth: 90,
                  }}
                >
                  {role.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {showSearch && (
          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 50, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
            <MaterialCommunityIcons name="account-search-outline" size={20} color={TEXT_MUTED} />
            <TextInput
              style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY }}
              placeholder="Search by name, ID or email..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search !== '' && (
              <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close-circle" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>
        )}

      </View>

      {/* ── List ── */}
      <FlatList
        data={displayedUsers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, marginTop: 24 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" colors={['#10B981']} />}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>
              {search ? `"${search}"` : ROLE_AVATARS.find(r => r.role === filter)?.plural || 'All Members'}
              <Text style={{ color: TEXT_MUTED, fontSize: 13 }}> ({displayedUsers.length})</Text>
            </Text>
            {(filter !== 'all' || search !== '') && (
              <TouchableOpacity onPress={() => { setFilter('all'); setSearch(''); }} style={{ marginLeft: 'auto', backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                <Text style={{ color: '#EF4444', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Image source={TEAM_ICON} style={{ width: 80, height: 80, opacity: 0.25 }} resizeMode="contain" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_MUTED, marginTop: 16 }}>No users found</Text>
          </View>
        }
      />

      {/* Modals */}
      <UserFormModal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingUser(null); }}
        initial={editingUser}
        isEdit={!!editingUser}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        payToActive={payToActive}
      />

      <StatusPopup
        visible={statusPopup.visible}
        title={statusPopup.title}
        message={statusPopup.message}
        type={statusPopup.type}
        onClose={() => setStatusPopup(prev => ({ ...prev, visible: false }))}
      />

      <ConfirmPopup
        visible={!!confirmDelete}
        title="Delete User?"
        message={confirmDelete ? `Are you sure you want to permanently remove ${confirmDelete.name}?` : ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </View>
  );
}
