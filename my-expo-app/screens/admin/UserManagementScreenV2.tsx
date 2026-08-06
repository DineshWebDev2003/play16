import React, { useState, memo, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  FlatList, ListRenderItem, ScrollView, Image, RefreshControl, StatusBar, StyleSheet, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import FormSelect from '../../components/FormSelect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import StatusModal from '../../components/StatusModal';
import ChoiceModal from '../../components/ChoiceModal';
import BranchFilter from '../../components/BranchFilter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }
interface Props { navigation: NavigationProps; }

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// ─── Aurora Glass background layer (matches other V2 screens) ──────────────────
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

const brandColor = '#F59E0B';
const studentColor = '#3B82F6';
const teacherColor = '#F59E0B';
const adminColor = '#7C3AED';
const TUITION_CATEGORIES = ['Tuition'] as const;
const STUDENT_CATEGORIES = ['Playschool', 'PreKG', 'Daycare', 'LKG', 'UKG'] as const;
type CategoryType = typeof STUDENT_CATEGORIES[number] | typeof TUITION_CATEGORIES[number];

// ─── Shared Field Label ────────────────────────────────────────────────────────
function FieldRow({ icon, label, required = false, theme, children }: {
  icon: string; label: string; required?: boolean; theme: string; children: React.ReactNode;
}) {
  const isDark = theme === 'dark';
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
        <View style={{ width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#2a2a28' : '#F3F4F6', marginRight: 8 }}>
          <MaterialCommunityIcons name={icon as any} size={14} color={brandColor} />
        </View>
        <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: isDark ? '#9CA3AF' : '#6B7280' }}>
          {label}{required ? <Text style={{ color: brandColor }}> *</Text> : ' (opt)'}
        </Text>
      </View>
      {children}
    </View>
  );
}

// ─── User Form (shared for Add & Edit) ─────────────────────────────────────────
function UserFormRaw({ theme, onSubmit, isSubmitting, initialData, isEdit, payToActive }: {
  theme: string; onSubmit: (data: any) => void;
  isSubmitting: boolean; initialData?: Partial<User>; isEdit?: boolean; payToActive?: boolean;
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

  const inp: any = {
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 14, fontWeight: '700',
    color: theme === 'dark' ? '#fff' : '#111',
    backgroundColor: theme === 'dark' ? '#1e1e1c' : '#F9FAFB',
    borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
  };

  const chip = (active: boolean, accent = brandColor) => ({
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' as const,
    borderWidth: 1.5,
    backgroundColor: active ? accent : (theme === 'dark' ? '#1e1e1c' : '#fff'),
    borderColor: active ? accent : (theme === 'dark' ? '#3a3a38' : '#E5E7EB'),
  });

  return (
    <View style={{ paddingBottom: 40 }}>
      <FieldRow icon="badge-account-horizontal" label="Role" required theme={theme}>
        <FormSelect
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
          theme={theme}
        />
        {formData.role === 'admin' && formData.branch_id && user?.role === 'master_admin' && (
          <Text style={{ fontSize: 9, color: adminColor, fontWeight: '700', marginTop: 4 }}>
            * Max 3 admins per branch
          </Text>
        )}
      </FieldRow>

      <FieldRow icon="gender-male-female" label="Gender" required theme={theme}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['Male', 'Female'] as const).map(g => (
            <TouchableOpacity key={g} activeOpacity={0.7}
              style={chip(formData.gender === g)}
              onPress={() => { Keyboard.dismiss(); set('gender', g); }}>
              <Text style={{ fontSize: 12, fontWeight: '900',
                color: formData.gender === g ? 'white' : (theme === 'dark' ? '#9CA3AF' : '#6B7280') }}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </FieldRow>

      {user?.role === 'master_admin' && (
        <FieldRow icon="domain" label="Branch" required theme={theme}>
          <FormSelect
            value={formData.branch_id}
            options={branches.map(b => ({ label: b.name, value: b.id }))}
            onSelect={(val) => { Keyboard.dismiss(); set('branch_id', val); }}
            placeholder="Select Branch"
            theme={theme}
          />
        </FieldRow>
      )}

      <FieldRow icon="account" label="Name" required theme={theme}>
        <TextInput style={inp} placeholder="e.g. Rahul Sharma" placeholderTextColor="#9CA3AF"
          value={formData.name} onChangeText={v => set('name', v)} />
      </FieldRow>

      <FieldRow icon="at" label="Username" required theme={theme}>
        <TextInput style={inp} placeholder="e.g. rahul_s" placeholderTextColor="#9CA3AF"
          autoCapitalize="none" value={formData.username} onChangeText={v => set('username', v)} />
        <Text style={{ fontSize: 9, color: brandColor, marginTop: 4, fontWeight: '700' }}>
          * MUST BE UNIQUE FOR LOGIN
        </Text>
      </FieldRow>

      {(formData.role === 'student' || formData.role === 'tuition_student') && (
        <>
          <FieldRow icon="cake-variant" label="Date of Birth" theme={theme}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowDobPicker(true)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: theme === 'dark' ? '#1e1e1c' : '#F9FAFB',
                borderWidth: 1.5, borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
                borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
              }}>
              <MaterialCommunityIcons name="calendar" size={20} color="#D97706" />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: formData.dateOfBirth ? (theme === 'dark' ? '#fff' : '#111') : '#9CA3AF', marginLeft: 10 }}>
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

          <FieldRow icon="account-tie" label="Father Details" theme={theme}>
            <TextInput style={{ ...inp, marginBottom: 8 }} placeholder="Father's Name" placeholderTextColor="#9CA3AF"
              value={formData.fatherName} onChangeText={v => set('fatherName', v)} />
            <TextInput style={inp} placeholder="Father's Phone" placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad" maxLength={10} value={formData.fatherPhone}
              onChangeText={v => set('fatherPhone', v.replace(/[^0-9]/g, '').slice(0, 10))} />
          </FieldRow>

          <FieldRow icon="account-heart" label="Mother Details" theme={theme}>
            <TextInput style={{ ...inp, marginBottom: 8 }} placeholder="Mother's Name" placeholderTextColor="#9CA3AF"
              value={formData.motherName} onChangeText={v => set('motherName', v)} />
            <TextInput style={inp} placeholder="Mother's Phone" placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad" maxLength={10} value={formData.motherPhone}
              onChangeText={v => set('motherPhone', v.replace(/[^0-9]/g, '').slice(0, 10))} />
          </FieldRow>

          <FieldRow icon="shape" label="Category" required theme={theme}>
            <FormSelect
              value={formData.category}
              options={(formData.role === 'tuition_student' || formData.role === 'tuition_teacher' ? TUITION_CATEGORIES : STUDENT_CATEGORIES).map(cat => ({ label: cat, value: cat }))}
              onSelect={(val) => { Keyboard.dismiss(); set('category', val); }}
              placeholder="Select Category"
              theme={theme}
            />
          </FieldRow>

          {formData.role === 'tuition_student' && batches.length > 0 && (
            <FieldRow icon="tag" label="Batch" theme={theme}>
              <FormSelect
                value={formData.batch_id ? formData.batch_id.toString() : ''}
                options={batches.map((b: any) => ({ label: b.name, value: b.id?.toString() }))}
                onSelect={(val: string) => { Keyboard.dismiss(); set('batch_id', val); }}
                placeholder="Select Batch"
                theme={theme}
              />
            </FieldRow>
          )}

          {(formData.role === 'student' || formData.role === 'tuition_student') && (
            <FieldRow icon="currency-inr" label="Monthly Fee" required theme={theme}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#2563EB', width: 48, height: 52, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>₹</Text>
                  </View>
                  <TextInput
                    style={{ ...inp, flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
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
                      ...inp,
                      flex: 1,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderColor: dueDayInvalid ? '#EF4444' : (theme === 'dark' ? '#3a3a38' : '#E5E7EB'),
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
            <FieldRow icon="currency-inr" label="Admission Fee" required={payToActive} theme={theme}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#7C3AED', width: 48, height: 52, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>₹</Text>
                </View>
                <TextInput
                  style={{ ...inp, flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
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
                <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                  No due date
                </Text>
              </View>
            </FieldRow>
          )}
        </>
      )}

      <FieldRow icon="email-outline" label="Email ID" theme={theme}>
        <TextInput style={inp} placeholder="email@example.com" placeholderTextColor="#9CA3AF"
          keyboardType="email-address" autoCapitalize="none"
          value={formData.email} onChangeText={v => set('email', v)} />
      </FieldRow>

      <FieldRow icon="phone" label="Phone Number" required theme={theme}>
        <TextInput style={inp} placeholder="10-digit Number" placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad" maxLength={10} value={formData.phone}
          onChangeText={v => set('phone', v.replace(/[^0-9]/g, '').slice(0, 10))} />
      </FieldRow>

      <FieldRow icon="lock-outline" label={isEdit ? 'New Password' : 'Initial Password'} required={!isEdit} theme={theme}>
        <View style={{ position: 'relative', justifyContent: 'center' }}>
          <TextInput
            style={{ ...inp, paddingRight: 50 }}
            placeholder={isEdit ? 'Leave blank to keep current' : '••••••••'}
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
              color={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 9, color: formData.password.length > 0 && formData.password.length < 6 ? '#EF4444' : brandColor, marginTop: 4, fontWeight: '700' }}>
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
        onPress={() => {
          if (!isValid) { onSubmit(null); return; }
          if (!isSubmitting) onSubmit(formData);
        }}
        style={{
          backgroundColor: isSubmitting ? '#D1D5DB' : (isValid ? brandColor : '#FCA5A5'),
          paddingVertical: 18, borderRadius: 22, alignItems: 'center',
          flexDirection: 'row', justifyContent: 'center',
          shadowColor: brandColor, shadowOpacity: isValid ? 0.35 : 0,
          shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8,
        }}
      >
        {isSubmitting ? <ActivityIndicator color="white" /> : (
          <>
            <MaterialCommunityIcons name={isEdit ? 'content-save' : 'account-plus'} size={20} color="white" />
            <Text style={{ fontWeight: '900', fontSize: 16, marginLeft: 8, color: 'white' }}>
              {isEdit ? 'Save Changes' : (isValid ? 'Register Member' : 'Check Details ⚠️')}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const UserForm = memo(UserFormRaw);

// ─── User Form Modal ───────────────────────────────────────────────────────────
const UserFormModal = memo(({ visible, onClose, onSubmit, isSubmitting, theme, initialData, isEdit, payToActive }: any) => {
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#F7F9F6', paddingTop: insets.top }}>
        <AuroraBackground />
        <StatusBar backgroundColor="#F7F9F6" barStyle={isDark ? 'light-content' : 'dark-content'} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={onClose}
                  style={{
                    backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
                    borderRadius: 16, width: 50, height: 50, alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB', marginBottom: 16, elevation: 4,
                  }}>
                  <MaterialCommunityIcons name="close" size={24} color={isDark ? '#FFF' : '#111'} />
                </TouchableOpacity>
                <Text style={{ fontSize: 34, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>
                  {isEdit ? 'Update' : 'Register'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <MaterialCommunityIcons name={isEdit ? 'account-edit-outline' : 'account-plus-outline'} size={22} color={brandColor} />
                  <Text style={{ fontSize: 18, fontWeight: '900', color: brandColor, marginLeft: 6 }}>
                    {isEdit ? 'Profile ✏️' : 'New Member ✨'}
                  </Text>
                </View>
              </View>
              <View style={{
                backgroundColor: '#7C3AED', width: 90, height: 90, borderRadius: 20,
                alignItems: 'center', justifyContent: 'center', elevation: 8,
                borderWidth: 4, borderColor: isDark ? '#2d2d24' : '#FFFFFF',
                transform: [{ rotate: '3deg' }],
              }}>
                <MaterialCommunityIcons name={isEdit ? 'account-edit-outline' : 'account-plus-outline'} size={44} color="white" />
              </View>
            </View>

            <View style={{ paddingHorizontal: 24 }}>
              <UserForm
                key={initialData?.id || 'new-form'}
                theme={theme}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                initialData={initialData}
                isEdit={isEdit}
                payToActive={payToActive}
              />
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

// ─── User Card ─────────────────────────────────────────────────────────────────
const UserCard = memo(({ user, theme, onEdit, onStatusToggle, onDelete, getRoleIcon, isSelecting, isSelected, onToggleSelect, canToggle }: {
  user: User; theme: string;
  onEdit: (u: User) => void;
  onStatusToggle: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  getRoleIcon: (role: string) => string;
  isSelecting?: boolean; isSelected?: boolean; onToggleSelect?: (id: string) => void;
  canToggle?: boolean;
}) => {
  const isDark = theme === 'dark';
  const isActive = user.status === 'active';
  const isPendingPayment = user.status === 'pending_payment';
  const isStudent = user.role === 'student' || user.role === 'tuition_student';
  const branchName = user.branch?.name || '';
  const [showActions, setShowActions] = useState(false);

  const roleColor = user.role === 'student' ? studentColor : user.role === 'teacher' ? teacherColor : user.role === 'nanny' ? '#06B6D4' : adminColor;

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
        backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
        borderRadius: 20, marginBottom: 10, elevation: 4,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? roleColor : (isDark ? '#262626' : '#F3F4F6'),
        overflow: 'hidden',
      }}>
      <View style={{ flexDirection: 'row' }}>
        {isSelecting && (
          <View style={{ justifyContent: 'center', paddingLeft: 12 }}>
            <View style={{
              width: 24, height: 24, borderRadius: 12, borderWidth: 2,
              borderColor: isSelected ? roleColor : (isDark ? '#6B7280' : '#9CA3AF'),
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
          backgroundColor: isDark ? '#2d2d24' : '#F3F4F6',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
          overflow: 'hidden',
        }}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name={getRoleIcon(user.role) as any} size={22} color={isDark ? '#9CA3AF' : '#6B7280'} />
          )}
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '900', fontSize: 15, color: isDark ? '#FFFFFF' : '#111827' }} numberOfLines={1}>
              {user.name}
            </Text>
            <View style={{
              backgroundColor: isActive ? (isDark ? '#064E3B' : '#F0FFF4') : isPendingPayment ? '#FEF3C7' : (isDark ? '#7F1D1D' : '#FFF5F5'),
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
            }}>
              <Text style={{
                fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1,
                color: isActive ? (isDark ? '#6EE7B7' : '#065F46') : isPendingPayment ? '#B45309' : (isDark ? '#FCA5A5' : '#991B1B'),
              }}>
                {isPendingPayment ? 'Awaiting Payment' : (isActive ? 'Active' : 'Disabled')}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280' }}>
              @{user.username}
            </Text>
            <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', marginHorizontal: 4 }}>|</Text>
            <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280' }}>
              {user.studentId || user.teacherId || 'ADMIN'}
            </Text>
            {!!branchName && (
              <>
                <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', marginHorizontal: 4 }}>|</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280' }}>{branchName}</Text>
              </>
            )}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 }}>
            <View style={{
              backgroundColor: isDark ? '#2d2d24' : '#F3F4F6',
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
              borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
            }}>
              <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#D1D5DB' : '#6B7280' }}>
                {user.role}
              </Text>
            </View>
            {user.gender && (
              <View style={{
                backgroundColor: isDark ? '#2d2d24' : '#F3F4F6',
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
              }}>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#D1D5DB' : '#6B7280' }}>
                  {user.gender}
                </Text>
              </View>
            )}
            {user.role === 'student' && user.category && (
              <View style={{
                backgroundColor: isDark ? '#2d2d24' : '#F3F4F6',
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
              }}>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#D1D5DB' : '#6B7280' }}>
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
                  Batch #{ (user as any).batch_id }
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
            backgroundColor: isDark ? '#2d2d24' : '#F3F4F6',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
          }}>
          <MaterialCommunityIcons name={showActions ? 'chevron-up' : 'dots-vertical'} size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
      </View>
      </View>

      {showActions && (
        <View style={{
          flexDirection: 'row', borderTopWidth: 1, borderTopColor: isDark ? '#262626' : '#F3F4F6',
          backgroundColor: isDark ? '#2d2d24' : '#F9FAFB',
          paddingVertical: 10, paddingHorizontal: 16,
        }}>
          <TouchableOpacity onPress={() => { setShowActions(false); onEdit(user); }}
            style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={brandColor} />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 4 }}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isStudent || !canToggle}
            onPress={() => { setShowActions(false); onStatusToggle(user.id); }}
            style={{ flex: 1, alignItems: 'center', opacity: (isStudent || !canToggle) ? 0.4 : 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }}>
              <MaterialCommunityIcons name={isStudent ? 'lock-outline' : (isActive ? 'account-cancel-outline' : 'account-check-outline')} size={16} color={isStudent ? '#D97706' : (isActive ? '#EF4444' : '#10B981')} />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 4 }}>
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

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function UserManagementScreenV2({ navigation }: Props) {
  const { user, users, branches, addUser, updateUser, deleteUser, toggleUserStatus, fetchData } = useAuth();
  const { theme: appTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = appTheme === 'dark';
  const scrollY = useSharedValue(0);

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
  const [monsterPass, setMonsterPass] = useState('');
  const [payToActive, setPayToActive] = useState(false);

  const isMonsterAdmin = user?.username === 'monster';
  const MONSTER_PASSWORD = 'Monster@123';
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

  const getRoleIcon = useCallback((role: string) => {
    switch (role) {
      case 'admin': return 'shield-account';
      case 'teacher': return 'account-tie';
      case 'student': return 'school';
      case 'nanny': return 'baby-face-outline';
      default: return 'account';
    }
  }, []);

  // ── Add ──
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

  // ── Edit ──
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
    <View style={{ paddingHorizontal: 24 }}>
      <UserCard
        user={item}
        theme={isDark ? 'dark' : 'light'}
        getRoleIcon={getRoleIcon}
        onStatusToggle={toggleUserStatus}
        onDelete={handleDeleteUserPress}
        onEdit={(u: User) => setEditingUser(u)}
        isSelecting={isSelecting}
        isSelected={selectedIds.has(item.id)}
        onToggleSelect={toggleSelect}
        canToggle={isMaster || isSchoolAdmin}
      />
    </View>
  ), [isDark, getRoleIcon, toggleUserStatus, handleDeleteUserPress, isSelecting, selectedIds, toggleSelect, isMaster, isSchoolAdmin]);

  const stickyHeaderStyle = useAnimatedStyle(() => ({}));

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      {/* ── Aurora Glass background ── */}
      <AuroraBackground />
      <StatusBar backgroundColor="#F7F9F6" barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* ── Sticky Header + Stats Cards ── */}
      <Animated.View style={[{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        backgroundColor: 'transparent',
        paddingTop: Math.max(insets.top, 20),
      }, stickyHeaderStyle]}>
        <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 34, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>
                Members
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>
                Directory
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {isSelecting && selectedIds.size > 0 && (
                <TouchableOpacity onPress={handleBulkDelete}
                  style={{
                    backgroundColor: '#EF4444', width: 50, height: 50, borderRadius: 16,
                    alignItems: 'center', justifyContent: 'center', elevation: 6,
                    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3, shadowRadius: 8,
                  }}>
                  <MaterialCommunityIcons name="trash-can-outline" size={22} color="white" />
                  <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#EF4444' }}>{selectedIds.size}</Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => { if (isSelecting) { setIsSelecting(false); setSelectedIds(new Set()); } else { navigation.goBack(); } }}
                style={{
                  backgroundColor: isSelecting ? (isDark ? '#2d2d24' : '#E5E7EB') : brandColor,
                  width: 50, height: 50, borderRadius: 16,
                  alignItems: 'center', justifyContent: 'center', elevation: 4,
                  borderWidth: isSelecting ? 1 : 0,
                  borderColor: isSelecting ? (isDark ? '#444' : '#D1D5DB') : 'transparent',
                }}>
                <MaterialCommunityIcons name={isSelecting ? 'close' : 'arrow-left'} size={24} color={isSelecting ? (isDark ? '#FFF' : '#374151') : 'white'} />
              </TouchableOpacity>
              {!isSelecting && user?.role === 'master_admin' && (
                <TouchableOpacity onPress={() => { setIsSelecting(true); setSelectedIds(new Set()); }}
                  style={{
                    backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
                    width: 50, height: 50, borderRadius: 16,
                    alignItems: 'center', justifyContent: 'center', elevation: 4,
                    borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
                  }}>
                  <MaterialCommunityIcons name="checkbox-multiple-marked-outline" size={22} color={isDark ? '#CCC' : '#6B7280'} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <BranchFilter selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} />
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('alumni')}
              style={{
                backgroundColor: '#7C3AED', width: 46, height: 46, borderRadius: 14,
                alignItems: 'center', justifyContent: 'center', elevation: 2,
              }}>
              <MaterialCommunityIcons name="account-star-outline" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowSearch(prev => { if (prev) setSearch(''); return !prev; }); }}
              style={{
                backgroundColor: showSearch ? brandColor : (isDark ? '#1e1e1e' : '#FFFFFF'),
                width: 46, height: 46, borderRadius: 14,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: showSearch ? brandColor : (isDark ? '#333' : '#E5E7EB'),
                elevation: 2,
              }}>
              <MaterialCommunityIcons name={showSearch ? 'close' : 'magnify'} size={22} color={showSearch ? 'white' : (isDark ? '#CCC' : '#6B7280')} />
            </TouchableOpacity>
          </View>
          {showSearch && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', marginTop: 10,
              backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
              borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
              borderWidth: 1, borderColor: isDark ? '#262626' : '#F3F4F6',
              elevation: 4,
            }}>
              <MaterialCommunityIcons name="account-search-outline" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
              <TextInput
                style={{
                  flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600',
                  color: isDark ? '#FFF' : '#111',
                }}
                placeholder="Search by name, ID or email..."
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search !== '' && (
                <TouchableOpacity onPress={() => setSearch('')}
                  style={{ backgroundColor: isDark ? '#333' : '#F3F4F6', padding: 6, borderRadius: 10 }}>
                  <MaterialCommunityIcons name="close" size={14} color={isDark ? '#9CA3AF' : '#9CA3AF'} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        <View style={{ paddingHorizontal: 24, paddingBottom: 4, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
            {[
              { key: 'student', label: 'Students', short: 'St', icon: 'school-outline', color: studentColor, count: stats.students },
              { key: 'teacher', label: 'Staff', short: 'Te', icon: 'account-tie-outline', color: teacherColor, count: stats.teachers },
              { key: 'admin', label: 'Admins', short: 'Ad', icon: 'shield-account-outline', color: adminColor, count: stats.admins },
            ].map(card => (
              <TouchableOpacity key={card.key} onPress={() => setFilter(prev => prev === card.key ? 'all' : card.key as 'all' | 'student' | 'teacher' | 'admin')}
                activeOpacity={0.9}
                style={{
                  flex: 1, borderRadius: 20, overflow: 'hidden',
                  elevation: 8, borderWidth: 2,
                  borderColor: filter === card.key ? '#FFFFFF' : 'transparent',
                }}>
                <View style={{ padding: 14, backgroundColor: card.color }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', padding: 8, borderRadius: 12 }}>
                      <MaterialCommunityIcons name={card.icon as any} size={18} color="white" />
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.6)' }}>{card.short}</Text>
                  </View>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF' }}>{card.count}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{card.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {isMaster && (
          <View style={{ paddingHorizontal: 24, paddingBottom: 10 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: payToActive ? '#FEF3C7' : (isDark ? '#1e1e1e' : '#FFFFFF'),
              borderRadius: 18, padding: 14,
              borderWidth: 1, borderColor: payToActive ? '#F59E0B' : (isDark ? '#333' : '#E5E7EB'),
              elevation: 3,
            }}>
              <View style={{ backgroundColor: payToActive ? brandColor : (isDark ? '#333' : '#F3F4F6'), width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="cash-lock" size={20} color={payToActive ? '#FFFFFF' : (isDark ? '#CCC' : '#6B7280')} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: isDark ? '#FFF' : '#111827' }}>Pay to Active</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>
                  {payToActive ? 'ON - New students must pay admission fee before access' : 'OFF - New students get instant access'}
                </Text>
              </View>
              <TouchableOpacity onPress={togglePayToActive}
                style={{
                  width: 50, height: 28, borderRadius: 14,
                  backgroundColor: payToActive ? brandColor : (isDark ? '#333' : '#E5E7EB'),
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
      </Animated.View>

      {/* ── Main Scrollable Content ── */}
      <Animated.FlatList
        data={displayedUsers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollY.value = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20) + 300,
          paddingBottom: 140,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#9CA3AF' : '#6B7280'}
            colors={[brandColor]}
            progressBackgroundColor={isDark ? '#1e1e1e' : '#FFFFFF'}
          />
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', flex: 1, color: isDark ? '#FFFFFF' : '#111827' }}>
                {search ? `"${search}"` : filter === 'all' ? 'All Members' : filter === 'student' ? 'Students' : filter === 'teacher' ? 'Staff' : 'Admins'}
                <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontSize: 13 }}> ({displayedUsers.length})</Text>
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
            <MaterialCommunityIcons name="account-search-outline" size={72} color={isDark ? '#4B5563' : '#9CA3AF'} />
            <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 16 }}>
              No users found
            </Text>
          </View>
        }
      />

      {/* ── Bottom Tab Filter Bar ── */}
      <View style={{
        position: 'absolute', bottom: Math.max(insets.bottom, 10) + 4,
        left: 24, right: 24, zIndex: 11,
        borderRadius: 20, backgroundColor: isDark ? '#2d2d24' : '#FFFFFF',
        padding: 6, flexDirection: 'row', gap: 6,
        borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
        elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15, shadowRadius: 16,
      }}>
        {(['all', 'student', 'teacher', 'admin'] as const).map(tab => (
          <TouchableOpacity key={tab} onPress={() => setFilter(tab)}
            style={{
              flex: 1, backgroundColor: filter === tab ? brandColor : 'transparent',
              borderRadius: 14, paddingVertical: 10, alignItems: 'center',
            }}>
            <MaterialCommunityIcons
              name={tab === 'all' ? 'account-group-outline' : tab === 'student' ? 'school-outline' : tab === 'teacher' ? 'account-tie-outline' : 'shield-account-outline'}
              size={18} color={filter === tab ? '#FFFFFF' : (isDark ? '#CCC' : '#6B7280')} />
            <Text style={{
              fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1,
              color: filter === tab ? '#FFFFFF' : (isDark ? '#CCC' : '#6B7280'), marginTop: 2,
            }}>
              {tab === 'all' ? 'ALL' : tab === 'student' ? 'STUDENTS' : tab === 'teacher' ? 'STAFF' : 'ADMINS'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Monster Admin Panel ── */}
      {isMonsterAdmin && (
        <View style={{
          position: 'absolute', top: Math.max(insets.top, 20) + 160, right: 24, zIndex: 99,
        }}>
          <TouchableOpacity onPress={() => setShowMonsterPanel(!showMonsterPanel)}
            style={{ backgroundColor: '#DC2626', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', elevation: 8 }}>
            <MaterialCommunityIcons name="shield-lock" size={22} color="white" />
          </TouchableOpacity>
          {showMonsterPanel && (
            <View style={{
              position: 'absolute', top: 52, right: 0, width: 240,
              backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderRadius: 20, padding: 16,
              borderWidth: 1, borderColor: '#DC2626', elevation: 16,
            }}>
              <Text style={{ fontWeight: '900', fontSize: 14, color: '#DC2626', marginBottom: 12 }}>Monster Control</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: isDark ? '#FFF' : '#111' }}>Maintenance Mode</Text>
                <TouchableOpacity
                  onPress={() => setMaintenanceMode(!maintenanceMode)}
                  style={{
                    width: 50, height: 28, borderRadius: 14,
                    backgroundColor: maintenanceMode ? '#DC2626' : (isDark ? '#333' : '#E5E7EB'),
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

      {/* ── Maintenance Mode Overlay ── */}
      {maintenanceMode && user?.role !== 'super_admin' && user?.username !== 'monster' && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          backgroundColor: '#F7F9F6',
          justifyContent: 'center', alignItems: 'center', padding: 40,
        }}>
          <MaterialCommunityIcons name="shield-off-outline" size={80} color="#DC2626" />
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#DC2626', marginTop: 20, textAlign: 'center' }}>Maintenance Mode</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 12, textAlign: 'center' }}>
            The system is currently under maintenance. Please try again later.
          </Text>
        </View>
      )}

      {/* ── FAB - Add User ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setShowAddForm(true)}
        style={{
          position: 'absolute', bottom: Math.max(insets.bottom, 10) + 95,
          right: 24, zIndex: 99,
          backgroundColor: brandColor, width: 60, height: 60, borderRadius: 20,
          alignItems: 'center', justifyContent: 'center', elevation: 12,
          shadowColor: brandColor, shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4, shadowRadius: 12,
        }}>
        <MaterialCommunityIcons name="account-plus-outline" size={28} color="white" />
      </TouchableOpacity>

      {/* ── Modals ── */}
      <UserFormModal
        visible={showAddForm}
        onClose={closeAdd}
        onSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
        theme={isDark ? 'dark' : 'light'}
        payToActive={payToActive}
        isEdit={false}
      />

      <UserFormModal
        visible={!!editingUser}
        onClose={closeEdit}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        theme={isDark ? 'dark' : 'light'}
        initialData={editingUser}
        payToActive={payToActive}
        isEdit={true}
      />

      <ChoiceModal
        visible={choiceModal.visible}
        title={choiceModal.title}
        message={choiceModal.message}
        options={choiceModal.options}
        onClose={() => setChoiceModal(prev => ({ ...prev, visible: false }))}
        iconName={choiceModal.iconName}
        accentColor={choiceModal.accentColor}
      />

      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
