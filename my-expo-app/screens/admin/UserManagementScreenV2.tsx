import React, { useState, memo, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  FlatList, ListRenderItem, ScrollView, Image, RefreshControl, StatusBar
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal from '../../components/StatusModal';
import ChoiceModal from '../../components/ChoiceModal';
import BranchFilter from '../../components/BranchFilter';

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }
interface Props { navigation: NavigationProps; }

const brandColor = '#F59E0B';
const studentColor = '#3B82F6';
const teacherColor = '#F59E0B';
const adminColor = '#7C3AED';
const STUDENT_CATEGORIES = ['Playschool', 'PreKG', 'Daycare'] as const;
type CategoryType = typeof STUDENT_CATEGORIES[number];

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

// ─── Mini DOB Picker ───────────────────────────────────────────────────────────
function MiniDatePicker({ value, onChange, theme }: { value: string; onChange: (v: string) => void; theme: string }) {
  const parts = value ? value.split('-') : ['', '', ''];
  const [day, setDay] = useState(parts[2] || '');
  const [month, setMonth] = useState(parts[1] || '');
  const [year, setYear] = useState(parts[0] || '');

  const commit = (d: string, m: string, y: string) => {
    if (d && m && y) onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  };

  const s: any = {
    borderWidth: 1.5, borderRadius: 12, paddingVertical: 12,
    textAlign: 'center', fontSize: 14, fontWeight: '700',
    color: theme === 'dark' ? '#fff' : '#111',
    backgroundColor: theme === 'dark' ? '#1e1e1c' : '#F9FAFB',
    borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
  };
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TextInput style={{ ...s, flex: 1 }} placeholder="DD" placeholderTextColor="#9CA3AF"
        keyboardType="numeric" maxLength={2} value={day}
        onChangeText={v => { setDay(v); commit(v, month, year); }} />
      <TextInput style={{ ...s, flex: 1.2 }} placeholder="MM" placeholderTextColor="#9CA3AF"
        keyboardType="numeric" maxLength={2} value={month}
        onChangeText={v => { setMonth(v); commit(day, v, year); }} />
      <TextInput style={{ ...s, flex: 2 }} placeholder="YYYY" placeholderTextColor="#9CA3AF"
        keyboardType="numeric" maxLength={4} value={year}
        onChangeText={v => { setYear(v); commit(day, month, v); }} />
    </View>
  );
}

// ─── User Form (shared for Add & Edit) ─────────────────────────────────────────
function UserFormRaw({ theme, onSubmit, isSubmitting, initialData, isEdit }: {
  theme: string; onSubmit: (data: any) => void;
  isSubmitting: boolean; initialData?: Partial<User>; isEdit?: boolean;
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
    role: (initialData?.role === 'student' || initialData?.role === 'admin' ? initialData.role : 'teacher') as 'student' | 'teacher' | 'admin',
    gender: (initialData?.gender as 'Male' | 'Female') || 'Male',
    fees: initialData?.fees || '',
    fee_due_day: (initialData as any)?.fee_due_day || '5',
    branch_id: initialData?.branch_id || '',
  });
  const [showPassword, setShowPassword] = useState(false);

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
      role: (initialData?.role === 'student' || initialData?.role === 'admin' ? initialData.role : 'teacher') as 'student' | 'teacher' | 'admin',
      gender: (initialData?.gender as 'Male' | 'Female') || 'Male',
      fees: initialData?.fees || '',
      fee_due_day: (initialData as any)?.fee_due_day || '5',
      branch_id: initialData?.branch_id || '',
    });
  }, [initialData]);

  const set = useCallback((field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value })), []);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!formData.name.trim()) m.push('Name');
    if (!formData.username.trim()) m.push('Username');
    if (!formData.phone.trim()) m.push('Phone Number');
    if (!isEdit && !formData.password.trim()) m.push('Initial Password');
    if (formData.password && formData.password.length < 6) m.push('Password (min 6 chars)');
    return m;
  }, [formData, isEdit]);

  const isValid = missing.length === 0;

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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(user?.role === 'master_admin' ? ['student', 'teacher', 'admin'] : ['student', 'teacher'] as const).map(r => (
            <TouchableOpacity key={r} activeOpacity={isEdit ? 1 : 0.7}
              style={{ ...chip(formData.role === r, r === 'admin' ? adminColor : brandColor), opacity: isEdit ? 0.5 : 1 }}
              onPress={() => { if (!isEdit) { Keyboard.dismiss(); set('role', r); } }}>
              <Text style={{ fontWeight: '900', textTransform: 'capitalize', fontSize: 13,
                color: formData.role === r ? 'white' : (theme === 'dark' ? '#6B7280' : '#9CA3AF') }}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {branches.map(b => (
              <TouchableOpacity key={b.id} activeOpacity={0.7}
                style={{
                  paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
                  backgroundColor: formData.branch_id === b.id ? brandColor : (theme === 'dark' ? '#1e1e1c' : '#fff'),
                  borderWidth: 1.5,
                  borderColor: formData.branch_id === b.id ? brandColor : (theme === 'dark' ? '#3a3a38' : '#E5E7EB'),
                }}
                onPress={() => { Keyboard.dismiss(); set('branch_id', b.id); }}>
                <Text style={{ fontWeight: '900', fontSize: 12,
                  color: formData.branch_id === b.id ? 'white' : (theme === 'dark' ? '#D1D5DB' : '#6B7280') }}>
                  {b.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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

      {formData.role === 'student' && (
        <>
          <FieldRow icon="cake-variant" label="Date of Birth" theme={theme}>
            <MiniDatePicker value={formData.dateOfBirth} onChange={v => set('dateOfBirth', v)} theme={theme} />
            {formData.dateOfBirth ? (
              <Text style={{ fontSize: 11, color: brandColor, fontWeight: '700', marginTop: 4 }}>
                📅 {formData.dateOfBirth}
              </Text>
            ) : null}
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
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {STUDENT_CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} activeOpacity={0.7}
                  style={chip(formData.category === cat, '#EAB308')}
                  onPress={() => { Keyboard.dismiss(); set('category', cat); }}>
                  <Text style={{ fontSize: 10, fontWeight: '900',
                    color: formData.category === cat ? '#78350F' : (theme === 'dark' ? '#9CA3AF' : '#6B7280') }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FieldRow>

          <FieldRow icon="currency-inr" label="Fee Details" theme={theme}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#7C3AED', width: 48, height: 52, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>₹</Text>
                </View>
                <TextInput
                  style={{ ...inp, flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  placeholder="Amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={formData.fees ? formData.fees.toString() : ''}
                  onChangeText={v => set('fees', v)}
                />
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: brandColor, width: 48, height: 52, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="calendar-clock" size={20} color="#92400E" />
                </View>
                <TextInput
                  style={{ ...inp, flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  placeholder="Due Date"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={2}
                  value={formData.fee_due_day ? formData.fee_due_day.toString() : ''}
                  onChangeText={v => set('fee_due_day', v)}
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 9, color: brandColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                * Monthly Amount
              </Text>
              <Text style={{ fontSize: 9, color: '#FBBF24', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                Due Date (1-31)
              </Text>
            </View>
          </FieldRow>
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
const UserFormModal = memo(({ visible, onClose, onSubmit, isSubmitting, theme, initialData, isEdit }: any) => {
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#FFF8F0', paddingTop: insets.top }}>
        <StatusBar backgroundColor={isDark ? '#1c1c14' : '#FFF8F0'} barStyle={isDark ? 'light-content' : 'dark-content'} />
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
const UserCard = memo(({ user, theme, onEdit, onStatusToggle, onDelete, getRoleIcon, isSelecting, isSelected, onToggleSelect }: {
  user: User; theme: string;
  onEdit: (u: User) => void;
  onStatusToggle: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  getRoleIcon: (role: string) => string;
  isSelecting?: boolean; isSelected?: boolean; onToggleSelect?: (id: string) => void;
}) => {
  const isDark = theme === 'dark';
  const isActive = user.status === 'active';
  const branchName = user.branch?.name || '';
  const [showActions, setShowActions] = useState(false);

  const roleColor = user.role === 'student' ? studentColor : user.role === 'teacher' ? teacherColor : adminColor;

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
              backgroundColor: isActive ? (isDark ? '#064E3B' : '#F0FFF4') : (isDark ? '#7F1D1D' : '#FFF5F5'),
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
            }}>
              <Text style={{
                fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1,
                color: isActive ? (isDark ? '#6EE7B7' : '#065F46') : (isDark ? '#FCA5A5' : '#991B1B'),
              }}>
                {user.status}
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
            onPress={() => { setShowActions(false); onStatusToggle(user.id); }}
            style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }}>
              <MaterialCommunityIcons name={isActive ? 'account-cancel-outline' : 'account-check-outline'} size={16} color={isActive ? '#EF4444' : '#10B981'} />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 4 }}>
              {isActive ? 'Halt' : 'Live'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={user.role === 'admin'}
            onPress={() => { setShowActions(false); onDelete(user.id, user.name); }}
            style={{ flex: 1, alignItems: 'center', opacity: user.role === 'admin' ? 0.3 : 1 }}>
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

  const isMonsterAdmin = user?.username === 'monster';
  const MONSTER_PASSWORD = 'Monster@123';

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
      const maxId = users.filter(u => u.role === 'student' && u.studentId?.startsWith('tnhk'))
        .map(u => parseInt(u.studentId?.replace('tnhk', '') || '0'))
        .reduce((max, id) => Math.max(max, id), 0);
      const nextId = (maxId + 1).toString().padStart(3, '0');

      const payload: any = {};
      Object.entries({
        name: formData.name,
        username: formData.username || undefined,
        date_of_birth: formData.dateOfBirth && formData.role === 'student' ? formData.dateOfBirth : undefined,
        email: formData.email || undefined,
        phone: formData.phone,
        role: formData.role,
        gender: formData.gender,
        password: formData.password,
        status: 'active',
        branch_id: formData.branch_id || undefined,
        father_name: formData.role === 'student' ? formData.fatherName : undefined,
        mother_name: formData.role === 'student' ? formData.motherName : undefined,
        father_phone: formData.role === 'student' ? formData.fatherPhone : undefined,
        mother_phone: formData.role === 'student' ? formData.motherPhone : undefined,
        category: formData.role === 'student' ? formData.category : undefined,
        fees: formData.role === 'student' ? formData.fees : undefined,
        fee_due_day: formData.role === 'student' ? formData.fee_due_day : undefined,
      }).forEach(([k, v]) => { if (v !== undefined) payload[k] = v; });

      if (formData.role === 'student') payload.student_id = `tnhk${nextId}`;
      if (formData.role === 'teacher') payload.teacher_id = `tnhkt${(users.filter(u => u.role === 'teacher').length + 1).toString().padStart(3, '0')}`;

      await addUser(payload);
      setShowAddForm(false);
      setStatusModal({ visible: true, title: 'User Added! 🎉', message: `${formData.name} has been successfully registered in the system.`, type: 'success' });
    } catch (err: any) {
      console.log('Add User Error:', err?.response?.data || err.message);
      setStatusModal({ visible: true, title: 'System Error ⚠️', message: err?.response?.data?.message || 'Something went wrong while adding the user.', type: 'error' });
    } finally { setIsSubmitting(false); }
  }, [users, addUser, user]);

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
        father_name: formData.role === 'student' ? formData.fatherName : undefined,
        mother_name: formData.role === 'student' ? formData.motherName : undefined,
        father_phone: formData.role === 'student' ? formData.fatherPhone : undefined,
        mother_phone: formData.role === 'student' ? formData.motherPhone : undefined,
        category: formData.role === 'student' ? formData.category : undefined,
        fees: formData.role === 'student' ? formData.fees : undefined,
        fee_due_day: formData.role === 'student' ? formData.fee_due_day : undefined,
        date_of_birth: formData.role === 'student' && formData.dateOfBirth ? formData.dateOfBirth : undefined,
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
    const protectedSelected = selected.filter(u => u.role === 'admin');
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
    if (target?.role === 'admin') {
      setStatusModal({ visible: true, title: 'Protected Account 🛡️', message: 'The Master Administrator account is protected and cannot be deleted for security reasons.', type: 'info' });
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
    teachers: users.filter(u => u.role === 'teacher' && u.status === 'active').length,
    admins: users.filter(u => u.role === 'admin' && u.status === 'active').length,
  }), [users]);

  const displayedUsers = useMemo(() => {
    let list = (filter === 'all' ? users : users.filter(u => u.role === filter)).filter(u => u.role !== 'master_admin');
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
      />
    </View>
  ), [isDark, getRoleIcon, toggleUserStatus, handleDeleteUserPress, isSelecting, selectedIds, toggleSelect]);

  const stickyHeaderStyle = useAnimatedStyle(() => ({}));

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
      <StatusBar backgroundColor={isDark ? '#1c1c14' : '#F8F6F0'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* ── Sticky Header + Stats Cards ── */}
      <Animated.View style={[{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        backgroundColor: isDark ? '#1c1c14' : '#F8F6F0',
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
            <TouchableOpacity onPress={() => setFilter(prev => prev === 'student' ? 'all' : 'student')}
              activeOpacity={0.9}
              style={{
                flex: 1, borderRadius: 20, overflow: 'hidden', elevation: filter === 'student' ? 8 : 3,
                borderWidth: filter === 'student' ? 2 : 0, borderColor: brandColor,
              }}>
              <View style={{ padding: 14, backgroundColor: studentColor }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', padding: 8, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="school-outline" size={18} color="white" />
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.6)' }}>St</Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF' }}>{stats.students}</Text>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Students</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setFilter(prev => prev === 'teacher' ? 'all' : 'teacher')}
              activeOpacity={0.9}
              style={{
                flex: 1, borderRadius: 20, overflow: 'hidden', elevation: filter === 'teacher' ? 8 : 3,
                borderWidth: filter === 'teacher' ? 2 : 0, borderColor: brandColor,
              }}>
              <View style={{ padding: 14, backgroundColor: teacherColor }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', padding: 8, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="account-tie-outline" size={18} color="white" />
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.6)' }}>Te</Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF' }}>{stats.teachers}</Text>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Staff</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setFilter(prev => prev === 'admin' ? 'all' : 'admin')}
              activeOpacity={0.9}
              style={{
                flex: 1, borderRadius: 20, overflow: 'hidden', elevation: filter === 'admin' ? 8 : 3,
                borderWidth: filter === 'admin' ? 2 : 0, borderColor: brandColor,
              }}>
              <View style={{ padding: 14, backgroundColor: adminColor }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', padding: 8, borderRadius: 12 }}>
                    <MaterialCommunityIcons name="shield-account-outline" size={18} color="white" />
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.6)' }}>Ad</Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF' }}>{stats.admins}</Text>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Admins</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
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
                {search ? `"${search}"` : filter === 'all' ? 'All Members' : filter === 'student' ? 'Students' : filter === 'teacher' ? 'Faculty' : 'Admins'}
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
              {tab === 'all' ? 'ALL' : tab === 'student' ? 'STUDENTS' : tab === 'teacher' ? 'TEACHERS' : 'ADMINS'}
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
          backgroundColor: isDark ? '#1c1c14' : '#F8F6F0',
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
        isEdit={false}
      />

      <UserFormModal
        visible={!!editingUser}
        onClose={closeEdit}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        theme={isDark ? 'dark' : 'light'}
        initialData={editingUser}
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
