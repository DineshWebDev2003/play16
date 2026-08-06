import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  FlatList, ListRenderItem, ScrollView, Image, RefreshControl, StatusBar, StyleSheet, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '../../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import GlassDropdown from './GlassDropdown';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const brandColor = '#F59E0B';
const brandDark = '#D97706';
const studentColor = '#3B82F6';
const teacherColor = '#F59E0B';
const adminColor = '#7C3AED';

const TEAM_ICON = require('../../../assets/icons/team.png');
const STUDENT_ICON = require('../../../assets/icons/student.png');
const TEACHER_ICON = require('../../../assets/icons/teacher.png');
const EDUCATION_ICON = require('../../../assets/icons/education.png');

const GLASS = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
};

const inputStyle: any = {
  borderWidth: 1,
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 14,
  fontWeight: '700',
  color: TEXT_PRIMARY,
  backgroundColor: 'rgba(247,249,246,0.95)',
  borderColor: 'rgba(255,255,255,0.6)',
};

const TUITION_CATEGORIES = ['Tuition'] as const;
const STUDENT_CATEGORIES = ['Playschool', 'PreKG', 'Daycare', 'LKG', 'UKG'] as const;
type CategoryType = typeof STUDENT_CATEGORIES[number] | typeof TUITION_CATEGORIES[number];

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}
interface Props {
  navigation: NavigationProps;
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
      <View style={{ position: 'absolute', top: -160, left: -160, width: 480, height: 480, borderRadius: 240, backgroundColor: '#DDF8D7', opacity: 0.28 }} />
      <View style={{ position: 'absolute', top: -140, left: SCREEN_WIDTH / 2 - 210, width: 420, height: 420, borderRadius: 210, backgroundColor: '#DDFBFF', opacity: 0.25 }} />
      <View style={{ position: 'absolute', bottom: -180, left: -180, width: 520, height: 520, borderRadius: 260, backgroundColor: '#F8FFD8', opacity: 0.24 }} />
      <View style={{ position: 'absolute', top: SCREEN_HEIGHT * 0.4 - 225, right: -180, width: 450, height: 450, borderRadius: 225, backgroundColor: '#EAF5FF', opacity: 0.18 }} />
    </View>
  );
}

function GlassSelect({ value, options, onSelect, placeholder }: {
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setOpen(true)}
        style={{ ...inputStyle, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: selected ? TEXT_PRIMARY : '#9CA3AF' }}>
          {selected ? selected.label : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={TEXT_MUTED} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(31,45,40,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 400, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY }}>{placeholder}</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen(false)}
                style={{ width: 34, height: 34, borderRadius: 12, ...GLASS, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, color: TEXT_PRIMARY, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
              {options.map(o => {
                const active = o.value === value;
                return (
                  <TouchableOpacity key={o.value} activeOpacity={0.8}
                    onPress={() => { onSelect(o.value); setOpen(false); }}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderRadius: 16, marginBottom: 6, backgroundColor: active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: active ? 'rgba(245,158,11,0.4)' : 'rgba(31,45,40,0.08)' }}>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: active ? '#D97706' : TEXT_PRIMARY }}>{o.label}</Text>
                    {active && <MaterialCommunityIcons name="check" size={18} color="#D97706" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function StatusPopup({ visible, title, message, type, onClose }: {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) {
  const config = {
    success: { icon: 'check-circle', color: '#10B981' },
    error: { icon: 'alert-circle', color: '#EF4444' },
    info: { icon: 'information-outline', color: '#3B82F6' },
  } as const;
  const c = config[type] || config.info;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(31,45,40,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 380, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', padding: 24, alignItems: 'center' }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: c.color, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <MaterialCommunityIcons name={c.icon as any} size={28} color="white" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, textAlign: 'center', letterSpacing: -0.3 }}>{title}</Text>
          {!!message && (
            <Text style={{ fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY, textAlign: 'center', marginTop: 8, lineHeight: 19 }}>{message}</Text>
          )}
          <TouchableOpacity activeOpacity={0.85} onPress={onClose}
            style={{ marginTop: 20, height: 48, borderRadius: 16, overflow: 'hidden', alignSelf: 'stretch' }}>
            <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>OK</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface ChoiceOption {
  label: string;
  onPress: () => void;
  type?: 'destructive' | 'primary' | 'secondary' | 'warning';
}

function ChoicePopup({ visible, title, message, options, iconName, accentColor, onClose }: {
  visible: boolean;
  title: string;
  message: string;
  options: ChoiceOption[];
  iconName: string;
  accentColor: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(31,45,40,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 380, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', padding: 24, alignItems: 'center' }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <MaterialCommunityIcons name={iconName as any} size={28} color="white" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, textAlign: 'center', letterSpacing: -0.3 }}>{title}</Text>
          {!!message && (
            <Text style={{ fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY, textAlign: 'center', marginTop: 8, lineHeight: 19 }}>{message}</Text>
          )}
          <View style={{ alignSelf: 'stretch', marginTop: 20, gap: 10 }}>
            {options.map((opt, i) => (
              <TouchableOpacity key={i} activeOpacity={0.85}
                onPress={() => { opt.onPress(); onClose(); }}
                style={{ height: 48, borderRadius: 16, overflow: 'hidden' }}>
                <LinearGradient
                  colors={opt.type === 'destructive' ? ['#EF4444', '#B91C1C'] : ['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{opt.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
            <TouchableOpacity activeOpacity={0.7} onPress={onClose}
              style={{ height: 44, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(31,45,40,0.1)', backgroundColor: 'rgba(247,249,246,0.95)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: TEXT_MUTED, fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FieldRow({ icon, label, required = false, children }: {
  icon: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
        <View style={{ width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.14)', marginRight: 8 }}>
          <MaterialCommunityIcons name={icon as any} size={14} color="#D97706" />
        </View>
        <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED }}>
          {label}{required ? <Text style={{ color: '#D97706' }}> *</Text> : ' (opt)'}
        </Text>
      </View>
      {children}
    </View>
  );
}

function UserFormRaw({ onSubmit, isSubmitting, initialData, isEdit, payToActive }: {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialData?: Partial<User>;
  isEdit?: boolean;
  payToActive?: boolean;
}) {
  const { user, branches } = useAuth();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    username: (initialData as any)?.username || '',
    dateOfBirth: (initialData as any)?.date_of_birth || '',
    fatherName: initialData?.fatherName || '',
    motherName: initialData?.motherName || '',
    fatherPhone: initialData?.fatherPhone || '',
    motherPhone: initialData?.motherPhone || '',
    category: (initialData?.category as CategoryType) || 'Playschool',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    password: '',
    role: (initialData?.role as string) || 'student',
    gender: (initialData?.gender as 'Male' | 'Female') || 'Male',
    fees: initialData?.fees || '',
    monthly_fee: (initialData as any)?.monthly_fee || '',
    fee_due_day: (initialData as any)?.fee_due_day || '5',
    branch_id: initialData?.branch_id || (user?.role === 'admin' ? user?.branch_id : '') || '',
    batch_id: (initialData as any)?.batch_id || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/batches');
        setBatches(res.data?.data || (Array.isArray(res.data) ? res.data : []));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    setFormData({
      name: initialData?.name || '',
      username: (initialData as any)?.username || '',
      dateOfBirth: (initialData as any)?.date_of_birth || '',
      fatherName: initialData?.fatherName || '',
      motherName: initialData?.motherName || '',
      fatherPhone: initialData?.fatherPhone || '',
      motherPhone: initialData?.motherPhone || '',
      category: (initialData?.category as CategoryType) || 'Playschool',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      password: '',
      role: (initialData?.role as string) || 'student',
      gender: (initialData?.gender as 'Male' | 'Female') || 'Male',
      fees: initialData?.fees || '',
      monthly_fee: (initialData as any)?.monthly_fee || '',
      fee_due_day: (initialData as any)?.fee_due_day || '5',
      branch_id: initialData?.branch_id || (user?.role === 'admin' ? user?.branch_id : '') || '',
      batch_id: (initialData as any)?.batch_id || '',
    });
  }, [initialData, user?.role, user?.branch_id]);

  const set = useCallback((field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value })), []);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!formData.name.trim()) m.push('Name');
    if (!formData.username.trim()) m.push('Username');
    if (!formData.phone.trim()) m.push('Phone Number');
    if (!isEdit && !formData.password.trim()) m.push('Initial Password');
    if (formData.password && formData.password.length < 6) m.push('Password (min 6 chars)');
    if (payToActive && (formData.role === 'student' || formData.role === 'tuition_student') && !formData.fees?.toString().trim()) m.push('Admission Fee');
    if ((formData.role === 'student' || formData.role === 'tuition_student') && !formData.monthly_fee?.toString().trim()) m.push('Monthly Fee');
    if ((formData.role === 'student' || formData.role === 'tuition_student') && !formData.fee_due_day?.toString().trim()) m.push('Fee Due Date');
    if ((formData.role === 'student' || formData.role === 'tuition_student') && parseInt(formData.fee_due_day as any, 10) > 28) m.push('Fee Due Date (max 28)');
    return m;
  }, [formData, isEdit, payToActive]);

  const isValid = missing.length === 0;

  const dueDayInvalid = (formData.role === 'student' || formData.role === 'tuition_student') &&
    !!formData.fee_due_day?.toString().trim() &&
    (parseInt(formData.fee_due_day as any, 10) > 28 || parseInt(formData.fee_due_day as any, 10) < 1);

  const chip = (active: boolean) => ({
    flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' as const,
    borderWidth: 1,
    backgroundColor: active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.92)',
    borderColor: active ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.6)',
  });

  return (
    <View style={{ paddingBottom: 40 }}>
      <FieldRow icon="badge-account-horizontal" label="Role" required>
        <GlassSelect
          value={formData.role}
          options={[
            ...(user?.role === 'master_admin' ? [{ label: 'Admin', value: 'admin' }] : []),
            { label: 'Student', value: 'student' },
            { label: 'Teacher', value: 'teacher' },
            { label: 'Nanny', value: 'nanny' },
          ]}
          onSelect={(val) => {
            set('role', val);
            if (val === 'tuition_student' || val === 'tuition_teacher') {
              set('category', 'Tuition');
            }
          }}
          placeholder="Select Role"
        />
        {formData.role === 'admin' && formData.branch_id && user?.role === 'master_admin' && (
          <Text style={{ fontSize: 9, color: adminColor, fontWeight: '700', marginTop: 4 }}>
            * Max 3 admins per branch
          </Text>
        )}
      </FieldRow>

      <FieldRow icon="gender-male-female" label="Gender" required>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['Male', 'Female'] as const).map(g => (
            <TouchableOpacity key={g} activeOpacity={0.7}
              style={chip(formData.gender === g)}
              onPress={() => { Keyboard.dismiss(); set('gender', g); }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: formData.gender === g ? '#D97706' : TEXT_MUTED }}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </FieldRow>

      {user?.role === 'master_admin' && (
        <FieldRow icon="domain" label="Branch" required>
          <GlassSelect
            value={formData.branch_id}
            options={branches.map(b => ({ label: b.name, value: b.id }))}
            onSelect={(val) => { Keyboard.dismiss(); set('branch_id', val); }}
            placeholder="Select Branch"
          />
        </FieldRow>
      )}

      <FieldRow icon="account" label="Name" required>
        <TextInput style={inputStyle} placeholder="e.g. Rahul Sharma" placeholderTextColor="#9CA3AF"
          value={formData.name} onChangeText={v => set('name', v)} />
      </FieldRow>

      <FieldRow icon="at" label="Username" required>
        <TextInput style={inputStyle} placeholder="e.g. rahul_s" placeholderTextColor="#9CA3AF"
          autoCapitalize="none" value={formData.username} onChangeText={v => set('username', v)} />
        <Text style={{ fontSize: 9, color: '#D97706', marginTop: 4, fontWeight: '700' }}>
          * MUST BE UNIQUE FOR LOGIN
        </Text>
      </FieldRow>

      {(formData.role === 'student' || formData.role === 'tuition_student') && (
        <>
          <FieldRow icon="cake-variant" label="Date of Birth">
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowDobPicker(true)}
              style={{ flexDirection: 'row', alignItems: 'center', ...inputStyle }}>
              <MaterialCommunityIcons name="calendar" size={20} color="#D97706" />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: formData.dateOfBirth ? TEXT_PRIMARY : '#9CA3AF', marginLeft: 10 }}>
                {formData.dateOfBirth || 'Select date of birth'}
              </Text>
              {formData.dateOfBirth ? (
                <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, dateOfBirth: '' }))}>
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
                    setFormData(prev => ({ ...prev, dateOfBirth: `${y}-${m}-${d}` }));
                  }
                }}
              />
            )}
          </FieldRow>

          <FieldRow icon="account-tie" label="Father Details">
            <TextInput style={{ ...inputStyle, marginBottom: 8 }} placeholder="Father's Name" placeholderTextColor="#9CA3AF"
              value={formData.fatherName} onChangeText={v => set('fatherName', v)} />
            <TextInput style={inputStyle} placeholder="Father's Phone" placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad" maxLength={10} value={formData.fatherPhone}
              onChangeText={v => set('fatherPhone', v.replace(/[^0-9]/g, '').slice(0, 10))} />
          </FieldRow>

          <FieldRow icon="account-heart" label="Mother Details">
            <TextInput style={{ ...inputStyle, marginBottom: 8 }} placeholder="Mother's Name" placeholderTextColor="#9CA3AF"
              value={formData.motherName} onChangeText={v => set('motherName', v)} />
            <TextInput style={inputStyle} placeholder="Mother's Phone" placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad" maxLength={10} value={formData.motherPhone}
              onChangeText={v => set('motherPhone', v.replace(/[^0-9]/g, '').slice(0, 10))} />
          </FieldRow>

          <FieldRow icon="shape" label="Category" required>
            <GlassSelect
              value={formData.category}
              options={(formData.role === 'tuition_student' || formData.role === 'tuition_teacher' ? TUITION_CATEGORIES : STUDENT_CATEGORIES).map(cat => ({ label: cat, value: cat }))}
              onSelect={(val) => { Keyboard.dismiss(); set('category', val); }}
              placeholder="Select Category"
            />
          </FieldRow>

          {formData.role === 'tuition_student' && batches.length > 0 && (
            <FieldRow icon="tag" label="Batch">
              <GlassSelect
                value={formData.batch_id ? formData.batch_id.toString() : ''}
                options={batches.map((b: any) => ({ label: b.name, value: b.id?.toString() }))}
                onSelect={(val: string) => { Keyboard.dismiss(); set('batch_id', val); }}
                placeholder="Select Batch"
              />
            </FieldRow>
          )}

          {(formData.role === 'student' || formData.role === 'tuition_student') && (
            <FieldRow icon="currency-inr" label="Monthly Fee" required>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#2563EB', width: 48, height: 52, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>₹</Text>
                  </View>
                  <TextInput
                    style={{ ...inputStyle, flex: 1, height: 52, paddingVertical: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                    placeholder="Monthly Amount"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formData.monthly_fee ? formData.monthly_fee.toString() : ''}
                    onChangeText={v => set('monthly_fee', v)}
                  />
                </View>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#FBBF24', width: 48, height: 52, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="calendar-clock" size={20} color="#92400E" />
                  </View>
                  <TextInput
                    style={{
                      ...inputStyle,
                      flex: 1,
                      height: 52,
                      paddingVertical: 0,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderColor: dueDayInvalid ? '#EF4444' : 'rgba(255,255,255,0.6)',
                    }}
                    placeholder="Due Date"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    maxLength={2}
                    value={formData.fee_due_day ? formData.fee_due_day.toString() : ''}
                    onChangeText={v => set('fee_due_day', v.replace(/\D/g, '').slice(0, 2))}
                  />
                </View>
              </View>
              {dueDayInvalid && (
                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700', marginTop: 4 }}>
                  Due Date must be between 1 and 28.
                </Text>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: dueDayInvalid ? 2 : 6 }}>
                <Text style={{ fontSize: 9, color: '#2563EB', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                  * Monthly Fee (required)
                </Text>
                <Text style={{ fontSize: 9, color: dueDayInvalid ? '#EF4444' : '#FBBF24', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Due Date (1-28)
                </Text>
              </View>
            </FieldRow>
          )}

          {(formData.role === 'student' || formData.role === 'tuition_student') && (
            <FieldRow icon="currency-inr" label="Admission Fee" required={payToActive}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#7C3AED', width: 48, height: 52, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>₹</Text>
                </View>
                <TextInput
                  style={{ ...inputStyle, flex: 1, height: 52, paddingVertical: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  placeholder="Admission Amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={formData.fees ? formData.fees.toString() : ''}
                  onChangeText={v => set('fees', v)}
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 9, color: '#7C3AED', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {payToActive ? '* Admission Fee (required when Pay-to-Active is ON)' : 'Admission Fee'}
                </Text>
                <Text style={{ fontSize: 9, color: TEXT_MUTED, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                  No due date
                </Text>
              </View>
            </FieldRow>
          )}
        </>
      )}

      <FieldRow icon="email-outline" label="Email ID">
        <TextInput style={inputStyle} placeholder="email@example.com" placeholderTextColor="#9CA3AF"
          keyboardType="email-address" autoCapitalize="none"
          value={formData.email} onChangeText={v => set('email', v)} />
      </FieldRow>

      <FieldRow icon="phone" label="Phone Number" required>
        <TextInput style={inputStyle} placeholder="10-digit Number" placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad" maxLength={10} value={formData.phone}
          onChangeText={v => set('phone', v.replace(/[^0-9]/g, '').slice(0, 10))} />
      </FieldRow>

      <FieldRow icon="lock-outline" label={isEdit ? 'New Password' : 'Initial Password'} required={!isEdit}>
        <View style={{ position: 'relative', justifyContent: 'center' }}>
          <TextInput
            style={{ ...inputStyle, paddingRight: 50 }}
            placeholder={isEdit ? 'Leave blank to keep current' : '********'}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            maxLength={20}
            value={formData.password}
            onChangeText={v => set('password', v)}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 15, padding: 5 }}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 9, color: formData.password.length > 0 && formData.password.length < 6 ? '#EF4444' : '#D97706', marginTop: 4, fontWeight: '700' }}>
          * MUST BE AT LEAST 6 CHARACTERS
        </Text>
      </FieldRow>

      {missing.length > 0 && (
        <View style={{
          backgroundColor: '#FEF2F2', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA',
          padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
        }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700', marginLeft: 8 }}>
            {missing.join(' · ')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isSubmitting}
        onPress={() => {
          if (!isValid) { onSubmit(null); return; }
          if (!isSubmitting) onSubmit(formData);
        }}
        style={{ marginTop: 4, height: 56, borderRadius: 18, overflow: 'hidden' }}
      >
        <LinearGradient
          colors={isValid ? ['#F59E0B', '#D97706'] : ['#FCA5A5', '#EF4444']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
        >
          {isSubmitting ? <ActivityIndicator color="white" /> : (
            <>
              <MaterialCommunityIcons name={isEdit ? 'content-save' : 'account-plus'} size={20} color="white" />
              <Text style={{ fontWeight: '900', fontSize: 15, marginLeft: 8, color: 'white', textTransform: 'uppercase', letterSpacing: 1 }}>
                {isEdit ? 'Save Changes' : (isValid ? 'Register Member' : 'Check Details ⚠️')}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const UserForm = memo(UserFormRaw);

const UserFormModal = memo(({ visible, onClose, onSubmit, isSubmitting, initialData, isEdit, payToActive }: any) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
        <AuroraBackground />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 48 }}>
          <View style={{ paddingHorizontal: 20, paddingTop: Math.max(insets.top, 20) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={onClose} activeOpacity={0.8}
                style={{ width: 44, height: 44, borderRadius: 22, ...GLASS, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED }}>
                  {isEdit ? 'Update Member' : 'New Member'}
                </Text>
                <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: -0.5, marginTop: 2 }}>
                  {isEdit ? 'Edit Profile' : 'Register Member'}
                </Text>
              </View>
              <View style={{ width: 54, height: 54, borderRadius: 18, ...GLASS, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={TEAM_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
              </View>
            </View>
          </View>
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <UserForm
              key={initialData?.id || 'new-form'}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              initialData={initialData}
              isEdit={isEdit}
              payToActive={payToActive}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const UserCard = memo(({ user, onEdit, onStatusToggle, onDelete, isSelecting, isSelected, onToggleSelect, canToggle }: {
  user: User;
  onEdit: (u: User) => void;
  onStatusToggle: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  isSelecting?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  canToggle?: boolean;
}) => {
  const isActive = user.status === 'active';
  const isPendingPayment = user.status === 'pending_payment';
  const isStudent = user.role === 'student' || user.role === 'tuition_student';
  const branchName = user.branch?.name || '';
  const [showActions, setShowActions] = useState(false);

  const roleColor = user.role === 'student' ? studentColor : user.role === 'teacher' ? teacherColor : user.role === 'nanny' ? '#06B6D4' : adminColor;
  const avatarSource = isStudent ? STUDENT_ICON : (user.role === 'teacher' || user.role === 'nanny') ? TEACHER_ICON : EDUCATION_ICON;

  const handlePress = () => {
    if (isSelecting) {
      onToggleSelect?.(user.id);
    } else {
      setShowActions(!showActions);
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={handlePress}
      style={{
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 22,
        marginBottom: 12,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? roleColor : 'rgba(255,255,255,0.6)',
        overflow: 'hidden',
      }}>
      <View style={{ flexDirection: 'row' }}>
        {isSelecting && (
          <View style={{ justifyContent: 'center', paddingLeft: 12 }}>
            <View style={{
              width: 24, height: 24, borderRadius: 12, borderWidth: 2,
              borderColor: isSelected ? roleColor : '#9CA3AF',
              backgroundColor: isSelected ? roleColor : 'transparent',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {isSelected && <MaterialCommunityIcons name="check" size={16} color="white" />}
            </View>
          </View>
        )}
        <View style={{ width: 6, backgroundColor: roleColor }} />
        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 48, height: 48, borderRadius: 16,
            backgroundColor: 'rgba(247,249,246,0.95)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
            overflow: 'hidden',
          }}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Image source={avatarSource} style={{ width: 30, height: 30 }} resizeMode="contain" />
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '900', fontSize: 15, color: TEXT_PRIMARY }} numberOfLines={1}>
                {user.name}
              </Text>
              <View style={{
                backgroundColor: isActive ? '#F0FFF4' : isPendingPayment ? '#FEF3C7' : '#FFF5F5',
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
              }}>
                <Text style={{
                  fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1,
                  color: isActive ? '#065F46' : isPendingPayment ? '#B45309' : '#991B1B',
                }}>
                  {isPendingPayment ? 'Awaiting Payment' : (isActive ? 'Active' : 'Disabled')}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_SECONDARY }}>
                @{user.username}
              </Text>
              <Text style={{ fontSize: 10, color: TEXT_MUTED, marginHorizontal: 4 }}>|</Text>
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: TEXT_SECONDARY }}>
                {user.studentId || user.teacherId || 'ADMIN'}
              </Text>
              {!!branchName && (
                <>
                  <Text style={{ fontSize: 10, color: TEXT_MUTED, marginHorizontal: 4 }}>|</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_SECONDARY }}>{branchName}</Text>
                </>
              )}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 }}>
              <View style={{
                backgroundColor: 'rgba(247,249,246,0.95)',
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
              }}>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_SECONDARY }}>
                  {user.role}
                </Text>
              </View>
              {user.gender && (
                <View style={{
                  backgroundColor: 'rgba(247,249,246,0.95)',
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
                }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_SECONDARY }}>
                    {user.gender}
                  </Text>
                </View>
              )}
              {user.role === 'student' && user.category && (
                <View style={{
                  backgroundColor: 'rgba(247,249,246,0.95)',
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
                }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_SECONDARY }}>
                    {user.category}
                  </Text>
                </View>
              )}
              {(user as any).batch_id && (
                <View style={{
                  backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                  borderWidth: 1, borderColor: '#DDD6FE',
                }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', color: '#7C3AED' }}>
                    Batch #{(user as any).batch_id}
                  </Text>
                </View>
              )}
              {user.role === 'student' && user.fees && (
                <View style={{
                  backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                  borderWidth: 1, borderColor: '#FDE68A',
                }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', color: '#D97706' }}>
                    ₹{user.fees}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity onPress={() => setShowActions(!showActions)}
            style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: 'rgba(247,249,246,0.95)',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
            }}>
            <MaterialCommunityIcons name={showActions ? 'chevron-up' : 'dots-vertical'} size={18} color={TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
      </View>

      {showActions && (
        <View style={{
          flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(31,45,40,0.06)',
          backgroundColor: 'rgba(247,249,246,0.6)',
          paddingVertical: 10, paddingHorizontal: 16,
        }}>
          <TouchableOpacity onPress={() => { setShowActions(false); onEdit(user); }}
            style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, ...GLASS, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color="#D97706" />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginTop: 4 }}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isStudent || !canToggle}
            onPress={() => { setShowActions(false); onStatusToggle(user.id); }}
            style={{ flex: 1, alignItems: 'center', opacity: (isStudent || !canToggle) ? 0.4 : 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, ...GLASS, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={isStudent ? 'lock-outline' : (isActive ? 'account-cancel-outline' : 'account-check-outline')} size={16} color={isStudent ? '#D97706' : (isActive ? '#EF4444' : '#10B981')} />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginTop: 4 }}>
              {isStudent ? 'Pay to Live' : (isActive ? 'Disable' : 'Enable')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={user.role === 'admin' || user.role === 'master_admin'}
            onPress={() => { setShowActions(false); onDelete(user.id, user.name); }}
            style={{ flex: 1, alignItems: 'center', opacity: (user.role === 'admin' || user.role === 'master_admin') ? 0.3 : 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FECACA' }}>
              <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#EF4444', marginTop: 4 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function UserManagementScreenV3({ navigation }: Props) {
  const { user, users, branches, addUser, updateUser, deleteUser, toggleUserStatus, fetchData } = useAuth();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState({ visible: false, title: '', message: '', type: 'error' as any });
  const [choiceModal, setChoiceModal] = useState({ visible: false, title: '', message: '', options: [] as any[], iconName: '', accentColor: '' });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showMonsterPanel, setShowMonsterPanel] = useState(false);
  const [payToActive, setPayToActive] = useState(false);

  const isMonsterAdmin = user?.username === 'monster';
  const isSchoolAdmin = user?.role === 'admin';
  const isMaster = user?.role === 'master_admin';

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('payToActive');
        if (stored !== null) setPayToActive(stored === 'true');
      } catch {}
    })();
  }, []);

  const togglePayToActive = useCallback(() => {
    setPayToActive(prev => {
      const next = !prev;
      AsyncStorage.setItem('payToActive', String(next)).catch(() => {});
      return next;
    });
  }, []);

  useEffect(() => {
    if (isSchoolAdmin && user?.branch_id) {
      setSelectedBranchId(user.branch_id);
    }
  }, [isSchoolAdmin, user?.branch_id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchData(); } catch (e) { console.error('Refresh Error:', e); }
    finally { setRefreshing(false); }
  }, [fetchData]);

  const closeAdd = useCallback(() => setShowAddForm(false), []);
  const closeEdit = useCallback(() => setEditingUser(null), []);

  const handleBackPress = useCallback(() => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectedIds(new Set());
    } else {
      navigation.goBack();
    }
  }, [isSelecting, navigation]);

  const handleAddSubmit = useCallback(async (formData: any) => {
    if (!formData) {
      setStatusModal({ visible: true, title: 'Form Incomplete 📝', message: 'Please fill in all mandatory fields before saving.', type: 'info' });
      return;
    }
    if (formData.role === 'admin' && user?.role === 'master_admin') {
      const branchId = formData.branch_id;
      if (!branchId) {
        setStatusModal({ visible: true, title: 'Branch Required 🏫', message: 'Please select a branch for the admin account.', type: 'info' });
        setIsSubmitting(false);
        return;
      }
      const existingAdmins = users.filter(u => u.role === 'admin' && u.branch_id === branchId && u.status === 'active').length;
      if (existingAdmins >= 3) {
        setStatusModal({ visible: true, title: 'Admin Limit Reached 🚫', message: `This branch already has ${existingAdmins} active admins. Maximum 3 allowed per branch.`, type: 'error' });
        setIsSubmitting(false);
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const branch = branches.find(b => b.id?.toString() === formData.branch_id?.toString());
      const SCHOOL_CODE = 'TNHK';
      const isStudentRole = formData.role === 'student' || formData.role === 'tuition_student';
      const isTeacherRole = formData.role === 'teacher' || formData.role === 'tuition_teacher';

      let branchCode: string = 'XX';
      if (branch) {
        const letters = branch.name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
        const collides = branches.some(b =>
          b.id?.toString() !== branch.id?.toString() &&
          b.name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() === letters
        );
        branchCode = collides ? branch.id.toString() : letters;
      }

      const roleToken = formData.role === 'tuition_student' || formData.role === 'tuition_teacher' ? 'TU' : formData.role === 'student' ? 'S' : 'T';
      const prefix = `${SCHOOL_CODE}${roleToken}${branchCode}`;

      const branchRoleUsers = users.filter(u =>
        u.branch_id?.toString() === formData.branch_id?.toString() &&
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
        name: formData.name,
        username: formData.username || undefined,
        date_of_birth: formData.dateOfBirth && formData.role === 'student' || formData.role === 'tuition_student' ? formData.dateOfBirth : undefined,
        email: formData.email || undefined,
        phone: formData.phone,
        role: formData.role,
        gender: formData.gender,
        password: formData.password,
        status: (payToActive && (formData.role === 'student' || formData.role === 'tuition_student')) ? 'pending_payment' : 'active',
        pay_to_active: payToActive && (formData.role === 'student' || formData.role === 'tuition_student') ? true : undefined,
        branch_id: formData.branch_id || undefined,
        father_name: formData.role === 'student' || formData.role === 'tuition_student' ? formData.fatherName : undefined,
        mother_name: formData.role === 'student' || formData.role === 'tuition_student' ? formData.motherName : undefined,
        father_phone: formData.role === 'student' || formData.role === 'tuition_student' ? formData.fatherPhone : undefined,
        mother_phone: formData.role === 'student' || formData.role === 'tuition_student' ? formData.motherPhone : undefined,
        category: formData.role === 'student' || formData.role === 'tuition_student' ? formData.category : undefined,
        fees: formData.role === 'student' || formData.role === 'tuition_student' ? formData.fees : undefined,
        monthly_fee: formData.role === 'student' || formData.role === 'tuition_student' ? formData.monthly_fee : undefined,
        fee_due_day: formData.role === 'student' || formData.role === 'tuition_student' ? formData.fee_due_day : undefined,
        batch_id: formData.batch_id ? formData.batch_id : undefined,
      }).forEach(([k, v]) => { if (v !== undefined) payload[k] = v; });

      if (isStudentRole) payload.student_id = `${prefix}${nextSeq}`;
      if (isTeacherRole) payload.teacher_id = `${prefix}${nextSeq}`;

      await addUser(payload);
      setShowAddForm(false);
      setStatusModal({ visible: true, title: 'User Added! 🎉', message: `${formData.name} has been successfully registered in the system.`, type: 'success' });
    } catch (err: any) {
      console.log('Add User Error:', err?.response?.data || err.message);
      setStatusModal({ visible: true, title: 'System Error ⚠️', message: err?.response?.data?.message || 'Something went wrong while adding the user.', type: 'error' });
    } finally { setIsSubmitting(false); }
  }, [users, addUser, user, payToActive]);

  const handleEditSubmit = useCallback(async (formData: any) => {
    if (!formData) {
      setStatusModal({ visible: true, title: 'Form Incomplete 📝', message: 'Please fill in all mandatory fields before saving.', type: 'info' });
      return;
    }
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const payload: any = {};
      Object.entries({
        name: formData.name,
        username: formData.username || undefined,
        email: formData.email || undefined,
        phone: formData.phone,
        gender: formData.gender,
        branch_id: formData.branch_id || undefined,
        father_name: formData.role === 'student' || formData.role === 'tuition_student' ? formData.fatherName : undefined,
        mother_name: formData.role === 'student' || formData.role === 'tuition_student' ? formData.motherName : undefined,
        father_phone: formData.role === 'student' || formData.role === 'tuition_student' ? formData.fatherPhone : undefined,
        mother_phone: formData.role === 'student' || formData.role === 'tuition_student' ? formData.motherPhone : undefined,
        category: formData.role === 'student' || formData.role === 'tuition_student' ? formData.category : undefined,
        fees: formData.role === 'student' || formData.role === 'tuition_student' ? formData.fees : undefined,
        monthly_fee: formData.role === 'student' || formData.role === 'tuition_student' ? formData.monthly_fee : undefined,
        fee_due_day: formData.role === 'student' || formData.role === 'tuition_student' ? formData.fee_due_day : undefined,
        date_of_birth: formData.role === 'student' || formData.role === 'tuition_student' && formData.dateOfBirth ? formData.dateOfBirth : undefined,
        batch_id: formData.batch_id ? formData.batch_id : undefined,
      }).forEach(([k, v]) => { if (v !== undefined) payload[k] = v; });

      if (formData.password) payload.password = formData.password;
      await updateUser(editingUser.id, payload);
      setEditingUser(null);
      setStatusModal({ visible: true, title: 'Changes Saved! ✅', message: 'The user profile has been updated successfully.', type: 'success' });
    } catch (err: any) {
      console.log('Edit User Error:', err?.response?.data || err.message);
      setStatusModal({ visible: true, title: 'Update Failed ⚠️', message: err?.response?.data?.message || 'Could not update user details.', type: 'error' });
    } finally { setIsSubmitting(false); }
  }, [editingUser, updateUser]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    const selected = users.filter(u => selectedIds.has(u.id));
    const protectedSelected = selected.filter(u => u.role === 'admin' || u.role === 'master_admin');
    if (protectedSelected.length > 0) {
      setStatusModal({ visible: true, title: 'Protected Account 🛡️', message: 'Master Administrator accounts are protected and cannot be deleted.', type: 'info' });
      return;
    }
    setChoiceModal({
      visible: true, title: `Delete ${selectedIds.size} Users? 🔒`, message: `Are you sure you want to permanently remove ${selectedIds.size} selected users?`,
      iconName: 'account-remove', accentColor: '#EF4444',
      options: [{
        label: 'Yes, Delete All', type: 'destructive' as any,
        onPress: async () => {
          let success = 0, fail = 0;
          for (const id of selectedIds) {
            try { await deleteUser(id); success++; } catch { fail++; }
          }
          setSelectedIds(new Set());
          setIsSelecting(false);
          setStatusModal({ visible: true, title: `${success} Deleted ✅`, message: fail > 0 ? `${success} removed, ${fail} failed.` : `Successfully removed ${success} users.`, type: 'success' });
        }
      }]
    });
  }, [selectedIds, users, deleteUser]);

  const handleDeleteUserPress = useCallback((userId: string, userName: string) => {
    const target = users.find(u => u.id === userId);
    if (target?.role === 'admin' || target?.role === 'master_admin') {
      setStatusModal({ visible: true, title: 'Protected Account 🛡️', message: 'Administrator accounts are protected and cannot be deleted for security reasons.', type: 'info' });
      return;
    }
    setChoiceModal({
      visible: true, title: 'Delete User? 🔒', message: `Are you sure you want to permanently remove ${userName}?`,
      iconName: 'account-remove', accentColor: '#EF4444',
      options: [{
        label: 'Yes, Delete User', type: 'destructive' as any,
        onPress: async () => {
          try {
            await deleteUser(userId);
            setStatusModal({ visible: true, title: 'Deleted! ✅', message: `User ${userName} has been successfully removed.`, type: 'success' });
          } catch (e) {
            setStatusModal({ visible: true, title: 'Error ⚠️', message: 'Failed to delete user. Please try again.', type: 'error' });
          }
        }
      }]
    });
  }, [deleteUser, users]);

  const stats = useMemo(() => ({
    students: users.filter(u => u.role === 'student' && u.status === 'active').length,
    teachers: users.filter(u => (u.role === 'teacher' || u.role === 'nanny') && u.status === 'active').length,
    admins: users.filter(u => u.role === 'admin' && u.status === 'active').length,
  }), [users]);

  const displayedUsers = useMemo(() => {
    let list = (filter === 'all' ? users : filter === 'teacher' ? users.filter(u => u.role === 'teacher' || u.role === 'nanny') : users.filter(u => u.role === filter)).filter(u => u.role !== 'master_admin' && u.role !== 'tuition_teacher' && u.role !== 'tuition_student');
    if (selectedBranchId) {
      list = list.filter(u => u.branch_id === selectedBranchId);
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
    if (isSelecting && user?.id) {
      list = list.filter(u => u.id !== user.id);
    }
    return list.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return 0;
    });
  }, [users, filter, search, selectedBranchId, isSelecting, user?.id]);

  const renderItem: ListRenderItem<User> = useCallback(({ item }) => (
    <View style={{ paddingHorizontal: 20 }}>
      <UserCard
        user={item}
        onStatusToggle={toggleUserStatus}
        onDelete={handleDeleteUserPress}
        onEdit={(u: User) => setEditingUser(u)}
        isSelecting={isSelecting}
        isSelected={selectedIds.has(item.id)}
        onToggleSelect={toggleSelect}
        canToggle={isMaster || isSchoolAdmin}
      />
    </View>
  ), [toggleUserStatus, handleDeleteUserPress, isSelecting, selectedIds, toggleSelect, isMaster, isSchoolAdmin]);

  const headerLabel = search ? `"${search}"` : filter === 'all' ? 'All Members' : filter === 'student' ? 'Students' : filter === 'teacher' ? 'Staff' : 'Admins';

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <StatusBar backgroundColor="#F7F9F6" barStyle="dark-content" />
      <AuroraBackground />

      {/* Sticky Header */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: Math.max(insets.top, 20) }}>
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={handleBackPress} activeOpacity={0.8}
              style={{ width: 44, height: 44, borderRadius: 22, ...GLASS, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: -0.5, marginTop: 2 }}>
                Members
              </Text>
            </View>
            <View style={{ width: 54, height: 54, borderRadius: 18, ...GLASS, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={TEAM_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
            </View>
          </View>

          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {isMaster && (
              <View style={{ flex: 1 }}>
                <GlassDropdown selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} />
              </View>
            )}
            {!isMaster && <View style={{ flex: 1 }} />}
            {isSelecting && selectedIds.size > 0 && (
              <TouchableOpacity onPress={handleBulkDelete} activeOpacity={0.85}
                style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: 'white' }}>{selectedIds.size}</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('alumni')} activeOpacity={0.85}
              style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="account-star-outline" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowSearch(prev => { if (prev) setSearch(''); return !prev; }); }} activeOpacity={0.85}
              style={{ width: 46, height: 46, borderRadius: 14, ...GLASS, alignItems: 'center', justifyContent: 'center', backgroundColor: showSearch ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.92)', borderColor: showSearch ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.6)' }}>
              <MaterialCommunityIcons name={showSearch ? 'close' : 'magnify'} size={22} color={showSearch ? '#D97706' : TEXT_MUTED} />
            </TouchableOpacity>
            {!isSelecting && isMaster && (
              <TouchableOpacity onPress={() => { setIsSelecting(true); setSelectedIds(new Set()); }} activeOpacity={0.85}
                style={{ width: 46, height: 46, borderRadius: 14, ...GLASS, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="checkbox-multiple-marked-outline" size={22} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>

          {showSearch && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', marginTop: 10,
              ...inputStyle, paddingVertical: 12,
            }}>
              <MaterialCommunityIcons name="account-search-outline" size={18} color={TEXT_MUTED} />
              <TextInput
                style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, paddingVertical: 0 }}
                placeholder="Search by name, ID or email..."
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search !== '' && (
                <TouchableOpacity onPress={() => setSearch('')}
                  style={{ backgroundColor: 'rgba(247,249,246,0.95)', padding: 6, borderRadius: 10 }}>
                  <MaterialCommunityIcons name="close" size={14} color={TEXT_MUTED} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {[
              { key: 'student', label: 'Students', short: 'St', icon: 'school-outline', color: studentColor, count: stats.students },
              { key: 'teacher', label: 'Staff', short: 'Te', icon: 'account-tie-outline', color: teacherColor, count: stats.teachers },
              { key: 'admin', label: 'Admins', short: 'Ad', icon: 'shield-account-outline', color: adminColor, count: stats.admins },
            ].map(card => (
              <TouchableOpacity key={card.key}
                onPress={() => setFilter(prev => prev === card.key ? 'all' : card.key as 'all' | 'student' | 'teacher' | 'admin')}
                activeOpacity={0.9}
                style={{
                  flex: 1, padding: 14, borderRadius: 22, borderWidth: 1,
                  backgroundColor: filter === card.key ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.92)',
                  borderColor: filter === card.key ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.6)',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 11, backgroundColor: card.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name={card.icon as any} size={17} color={card.color} />
                  </View>
                  <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED }}>{card.short}</Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: filter === card.key ? '#D97706' : TEXT_PRIMARY }}>{card.count}</Text>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginTop: 2 }}>{card.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isMaster && (
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', ...GLASS, borderRadius: 18, padding: 14,
              borderColor: payToActive ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.6)',
            }}>
              <View style={{ backgroundColor: payToActive ? brandColor : 'rgba(245,158,11,0.14)', width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="cash-lock" size={20} color={payToActive ? '#FFFFFF' : '#D97706'} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: TEXT_PRIMARY }}>Pay to Active</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: TEXT_SECONDARY, marginTop: 2 }}>
                  {payToActive ? 'ON - New students must pay admission fee before access' : 'OFF - New students get instant access'}
                </Text>
              </View>
              <TouchableOpacity onPress={togglePayToActive}
                style={{
                  width: 50, height: 28, borderRadius: 14,
                  backgroundColor: payToActive ? brandColor : 'rgba(122,138,130,0.35)',
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
      </View>

      {/* Main Scrollable Content */}
      <FlatList
        data={displayedUsers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20) + 340,
          paddingBottom: 140,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6B7280"
            colors={[brandColor]}
            progressBackgroundColor="#FFFFFF"
          />
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', flex: 1, color: TEXT_PRIMARY }}>
                {headerLabel}
                <Text style={{ color: TEXT_MUTED, fontSize: 13 }}> ({displayedUsers.length})</Text>
              </Text>
              {(filter !== 'all' || search !== '') && (
                <TouchableOpacity onPress={() => { setFilter('all'); setSearch(''); }}
                  style={{
                    backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
                    borderWidth: 1, borderColor: '#FECACA', flexDirection: 'row', alignItems: 'center',
                  }}>
                  <MaterialCommunityIcons name="refresh" size={12} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 }}>CLEAR</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 80, opacity: 0.4 }}>
            <MaterialCommunityIcons name="account-search-outline" size={72} color={TEXT_MUTED} />
            <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED, marginTop: 16 }}>
              No users found
            </Text>
          </View>
        }
      />

      {/* Bottom Tab Filter Bar */}
      <View style={{
        position: 'absolute', bottom: Math.max(insets.bottom, 10) + 4,
        left: 20, right: 20, zIndex: 11,
        borderRadius: 22, ...GLASS,
        padding: 6, flexDirection: 'row', gap: 6,
      }}>
        {(['all', 'student', 'teacher', 'admin'] as const).map(tab => (
          <TouchableOpacity key={tab} onPress={() => setFilter(tab)}
            style={{
              flex: 1, backgroundColor: filter === tab ? 'rgba(245,158,11,0.15)' : 'transparent',
              borderRadius: 16, paddingVertical: 10, alignItems: 'center',
            }}>
            <MaterialCommunityIcons
              name={tab === 'all' ? 'account-group-outline' : tab === 'student' ? 'school-outline' : tab === 'teacher' ? 'account-tie-outline' : 'shield-account-outline'}
              size={18} color={filter === tab ? '#D97706' : TEXT_MUTED} />
            <Text style={{
              fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1,
              color: filter === tab ? '#D97706' : TEXT_MUTED, marginTop: 2,
            }}>
              {tab === 'all' ? 'ALL' : tab === 'student' ? 'STUDENTS' : tab === 'teacher' ? 'STAFF' : 'ADMINS'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Monster Admin Panel */}
      {isMonsterAdmin && (
        <View style={{
          position: 'absolute', top: Math.max(insets.top, 20) + 160, right: 20, zIndex: 99,
        }}>
          <TouchableOpacity onPress={() => setShowMonsterPanel(!showMonsterPanel)}
            style={{ backgroundColor: '#DC2626', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', elevation: 8 }}>
            <MaterialCommunityIcons name="shield-lock" size={22} color="white" />
          </TouchableOpacity>
          {showMonsterPanel && (
            <View style={{
              position: 'absolute', top: 52, right: 0, width: 240,
              ...GLASS, borderRadius: 20, padding: 16, borderColor: '#DC2626',
            }}>
              <Text style={{ fontWeight: '900', fontSize: 14, color: '#DC2626', marginBottom: 12 }}>Monster Control</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: TEXT_PRIMARY }}>Maintenance Mode</Text>
                <TouchableOpacity
                  onPress={() => setMaintenanceMode(!maintenanceMode)}
                  style={{
                    width: 50, height: 28, borderRadius: 14,
                    backgroundColor: maintenanceMode ? '#DC2626' : 'rgba(122,138,130,0.35)',
                    justifyContent: 'center', paddingHorizontal: 3,
                  }}>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11, backgroundColor: 'white',
                    alignSelf: maintenanceMode ? 'flex-end' : 'flex-start',
                  }} />
                </TouchableOpacity>
              </View>
              {maintenanceMode && (
                <Text style={{ fontSize: 10, color: '#DC2626', fontWeight: '700', marginTop: 8 }}>
                  ON - All users blocked
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Maintenance Mode Overlay */}
      {maintenanceMode && user?.role !== 'super_admin' && user?.username !== 'monster' && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          backgroundColor: '#F7F9F6',
          justifyContent: 'center', alignItems: 'center', padding: 40,
        }}>
          <MaterialCommunityIcons name="shield-off-outline" size={80} color="#DC2626" />
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#DC2626', marginTop: 20, textAlign: 'center' }}>Maintenance Mode</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: TEXT_MUTED, marginTop: 12, textAlign: 'center' }}>
            The system is currently under maintenance. Please try again later.
          </Text>
        </View>
      )}

      {/* FAB - Add User */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setShowAddForm(true)}
        style={{
          position: 'absolute', bottom: Math.max(insets.bottom, 10) + 95,
          right: 20, zIndex: 99,
          width: 60, height: 60, borderRadius: 20, overflow: 'hidden', elevation: 12,
        }}>
        <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="account-plus-outline" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modals */}
      <UserFormModal
        visible={showAddForm}
        onClose={closeAdd}
        onSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
        payToActive={payToActive}
        isEdit={false}
      />

      <UserFormModal
        visible={!!editingUser}
        onClose={closeEdit}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        initialData={editingUser}
        payToActive={payToActive}
        isEdit={true}
      />

      <ChoicePopup
        visible={choiceModal.visible}
        title={choiceModal.title}
        message={choiceModal.message}
        options={choiceModal.options}
        onClose={() => setChoiceModal(prev => ({ ...prev, visible: false }))}
        iconName={choiceModal.iconName}
        accentColor={choiceModal.accentColor}
      />

      <StatusPopup
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
