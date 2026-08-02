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
import FormSelect from '../../components/FormSelect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal from '../../components/StatusModal';
import ChoiceModal from '../../components/ChoiceModal';
import api from '../../services/api';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import BranchFilter from '../../components/BranchFilter';

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }
interface Props { navigation: NavigationProps; }

const brandColor = '#F59E0B';
const teacherColor = '#8B5CF6';
const studentColor = '#10B981';

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

// ─── Tuition Form ──────────────────────────────────────────────────────────────
function TuitionFormRaw({ theme, onSubmit, isSubmitting, initialData, isEdit }: {
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
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    password: '',
    role: (initialData?.role as string) || 'tuition_student',
    gender: (initialData?.gender as 'Male' | 'Female') || 'Male',
    fees: initialData?.fees || '',
    fee_due_day: (initialData as any)?.fee_due_day || '5',
    branch_id: initialData?.branch_id || (user?.role === 'admin' ? user?.branch_id : '') || '',
    category: 'Tuition',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

  useEffect(() => {
    setFormData({
      name: initialData?.name || '',
      username: (initialData as any)?.username || '',
      dateOfBirth: (initialData as any)?.date_of_birth || '',
      fatherName: initialData?.fatherName || '',
      motherName: initialData?.motherName || '',
      fatherPhone: initialData?.fatherPhone || '',
      motherPhone: initialData?.motherPhone || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      password: '',
      role: (initialData?.role as string) || 'tuition_student',
      gender: (initialData?.gender as 'Male' | 'Female') || 'Male',
      fees: initialData?.fees || '',
      fee_due_day: (initialData as any)?.fee_due_day || '5',
      branch_id: initialData?.branch_id || (user?.role === 'admin' ? user?.branch_id : '') || '',
      category: 'Tuition',
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
        <FormSelect
          value={formData.role}
          options={[
            { label: 'Tuition Teacher', value: 'tuition_teacher' },
            { label: 'Tuition Student', value: 'tuition_student' },
          ]}
          onSelect={(val) => { set('role', val); }}
          placeholder="Select Role"
          theme={theme}
        />
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
        <TextInput style={inp} placeholder="e.g. rahul.tuition" placeholderTextColor="#9CA3AF"
          autoCapitalize="none" value={formData.username} onChangeText={v => set('username', v)} />
        <Text style={{ fontSize: 9, color: brandColor, marginTop: 4, fontWeight: '700' }}>
          * MUST BE UNIQUE FOR LOGIN
        </Text>
      </FieldRow>

      {formData.role === 'tuition_student' && (
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
              {isEdit ? 'Save Changes' : (isValid ? 'Register User' : 'Check Details ⚠️')}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const TuitionForm = memo(TuitionFormRaw);

// ─── Tuition Form Modal ─────────────────────────────────────────────────────────
const TuitionFormModal = memo(({ visible, onClose, onSubmit, isSubmitting, theme, initialData, isEdit }: any) => {
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
                    {isEdit ? 'Profile ✏️' : 'New Tuition User ✨'}
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
              <TuitionForm
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

// ─── Tuition User Card ──────────────────────────────────────────────────────────
const TuitionUserCard = memo(({ user, theme, onEdit, onStatusToggle, onDelete, getRoleIcon, isSelecting, isSelected, onToggleSelect }: {
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

  const roleColor = user.role === 'tuition_teacher' ? teacherColor : studentColor;

  const handlePress = () => {
    if (isSelecting) {
      onToggleSelect?.(user.id);
    } else {
      setShowActions(!showActions);
    }
  };

  const isProtected = user.role === 'admin' || user.role === 'master_admin';

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
                {user.studentId || user.teacherId || 'TT-000'}
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
                  {user.role === 'tuition_teacher' ? 'Tuition Teacher' : 'Tuition Student'}
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
              {user.category && (
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
              {user.role === 'tuition_student' && user.fees && (
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
            disabled={isProtected}
            onPress={() => { setShowActions(false); onDelete(user.id, user.name); }}
            style={{ flex: 1, alignItems: 'center', opacity: isProtected ? 0.3 : 1 }}>
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
export default function ManageTuitionUsersScreen({ navigation }: Props) {
  const { user, users, branches, addUser, updateUser, deleteUser, toggleUserStatus, fetchData } = useAuth();
  const { theme: appTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = appTheme === 'dark';
  const scrollY = useSharedValue(0);

  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'tuition_teacher' | 'tuition_student'>('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState({ visible: false, title: '', message: '', type: 'error' as any });
  const [choiceModal, setChoiceModal] = useState({ visible: false, title: '', message: '', options: [] as any[], iconName: '', accentColor: '' });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSchoolAdmin = user?.role === 'admin';

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
      case 'tuition_teacher': return 'account-tie';
      case 'tuition_student': return 'school';
      default: return 'account';
    }
  }, []);

  // ── Add ──
  const handleAddSubmit = useCallback(async (formData: any) => {
    if (!formData) {
      setStatusModal({ visible: true, title: 'Form Incomplete 📝', message: 'Please fill in all mandatory fields before saving.', type: 'info' });
      return;
    }
    setIsSubmitting(true);
    try {
      const branch = branches.find(b => b.id?.toString() === formData.branch_id?.toString());
      const branchPrefix = branch ? branch.name.charAt(0).toUpperCase() : 'X';
      const roleLetter = formData.role === 'tuition_teacher' ? 't' : 's';
      const prefix = `${branchPrefix}${roleLetter}`;
      const sameRoleUsers = users.filter(u => u.role === formData.role);
      const maxSeq = sameRoleUsers
        .map(u => {
          const id = u.studentId || u.teacherId || '';
          const num = id.replace(prefix, '');
          return parseInt(num, 10) || 0;
        })
        .reduce((max, n) => Math.max(max, n), 0);
      const nextSeq = (maxSeq + 1).toString().padStart(3, '0');

      const payload: any = {};
      const fields: [string, any][] = [
        ['name', formData.name],
        ['username', formData.username || undefined],
        ['email', formData.email || undefined],
        ['phone', formData.phone],
        ['role', formData.role],
        ['gender', formData.gender],
        ['password', formData.password],
        ['status', 'active'],
        ['branch_id', formData.branch_id || undefined],
        ['category', 'Tuition'],
      ];
      if (formData.role === 'tuition_student') {
        fields.push(['date_of_birth', formData.dateOfBirth || undefined]);
        fields.push(['father_name', formData.fatherName || undefined]);
        fields.push(['mother_name', formData.motherName || undefined]);
        fields.push(['father_phone', formData.fatherPhone || undefined]);
        fields.push(['mother_phone', formData.motherPhone || undefined]);
        fields.push(['fees', formData.fees || undefined]);
        fields.push(['fee_due_day', formData.fee_due_day || undefined]);
      }
      fields.forEach(([k, v]) => { if (v !== undefined) payload[k] = v; });
      if (formData.role === 'tuition_student') payload.student_id = `${prefix}${nextSeq}`;
      if (formData.role === 'tuition_teacher') payload.teacher_id = `${prefix}${nextSeq}`;

      await addUser(payload);
      setStatusModal({ visible: true, title: 'Tuition User Created ✅', message: `${formData.role === 'tuition_teacher' ? 'Tuition Teacher' : 'Tuition Student'} has been registered successfully.`, type: 'success' });
      setShowAddForm(false);
    } catch (err: any) {
      setStatusModal({ visible: true, title: 'Creation Failed ⚠️', message: err?.response?.data?.message || err?.message || 'Could not create user.', type: 'error' });
    }
    setIsSubmitting(false);
  }, [addUser, branches, users]);

  // ── Edit ──
  const handleEditSubmit = useCallback(async (formData: any) => {
    if (!formData || !editingUser) {
      setStatusModal({ visible: true, title: 'Form Incomplete 📝', message: 'Please fill in all mandatory fields before saving.', type: 'info' });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {};
      const fields: [string, any][] = [
        ['name', formData.name || undefined],
        ['username', formData.username || undefined],
        ['email', formData.email || undefined],
        ['phone', formData.phone || undefined],
        ['gender', formData.gender || undefined],
        ['category', 'Tuition'],
      ];
      if (formData.role === 'tuition_student') {
        fields.push(['date_of_birth', formData.dateOfBirth || undefined]);
        fields.push(['father_name', formData.fatherName || undefined]);
        fields.push(['mother_name', formData.motherName || undefined]);
        fields.push(['father_phone', formData.fatherPhone || undefined]);
        fields.push(['mother_phone', formData.motherPhone || undefined]);
        fields.push(['fees', formData.fees || undefined]);
        fields.push(['fee_due_day', formData.fee_due_day || undefined]);
      }
      fields.forEach(([k, v]) => { if (v !== undefined) payload[k] = v; });
      if (formData.password) payload.password = formData.password;

      await updateUser(editingUser.id, payload);
      setEditingUser(null);
      setStatusModal({ visible: true, title: 'Changes Saved! ✅', message: 'The user profile has been updated successfully.', type: 'success' });
    } catch (err: any) {
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
      setStatusModal({ visible: true, title: 'Protected Account 🛡️', message: 'Administrator accounts are protected and cannot be deleted.', type: 'info' });
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
      visible: true, title: `Delete ${userName}? 🔒`, message: `Are you sure you want to permanently remove "${userName}"? This action cannot be undone.`,
      iconName: 'account-remove', accentColor: '#EF4444',
      options: [{
        label: 'Yes, Delete', type: 'destructive' as any,
        onPress: async () => {
          try {
            await deleteUser(userId);
            setStatusModal({ visible: true, title: 'Deleted! ✅', message: `${userName} has been removed.`, type: 'success' });
          } catch (err: any) {
            setStatusModal({ visible: true, title: 'Delete Failed ⚠️', message: err?.response?.data?.message || 'Could not delete user.', type: 'error' });
          }
        }
      }]
    });
  }, [deleteUser]);

  const handleToggleStatus = useCallback(async (userId: string) => {
    try {
      await toggleUserStatus(userId);
      setStatusModal({ visible: true, title: 'Status Updated ✅', message: 'User status has been changed.', type: 'success' });
    } catch (err: any) {
      setStatusModal({ visible: true, title: 'Status Update Failed ⚠️', message: err?.response?.data?.message || 'Could not update status.', type: 'error' });
    }
  }, [toggleUserStatus]);

  const tuitionUsers = useMemo(() =>
    users.filter(u => u.role === 'tuition_teacher' || u.role === 'tuition_student'),
  [users]);

  const stats = useMemo(() => {
    const scoped = selectedBranchId
      ? tuitionUsers.filter(u => u.branch_id === selectedBranchId)
      : tuitionUsers;
    return {
      teachers: scoped.filter(u => u.role === 'tuition_teacher' && u.status === 'active').length,
      students: scoped.filter(u => u.role === 'tuition_student' && u.status === 'active').length,
      total: scoped.length,
    };
  }, [tuitionUsers, selectedBranchId]);

  const displayedUsers = useMemo(() => {
    let list = (filter === 'all' ? tuitionUsers : tuitionUsers.filter(u => u.role === filter));
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
  }, [tuitionUsers, filter, search, selectedBranchId, isSelecting, user?.id]);

  const renderItem: ListRenderItem<User> = useCallback(({ item }) => (
    <View style={{ paddingHorizontal: 24 }}>
      <TuitionUserCard
        user={item}
        theme={isDark ? 'dark' : 'light'}
        getRoleIcon={getRoleIcon}
        onStatusToggle={handleToggleStatus}
        onDelete={handleDeleteUserPress}
        onEdit={(u: User) => setEditingUser(u)}
        isSelecting={isSelecting}
        isSelected={selectedIds.has(item.id)}
        onToggleSelect={toggleSelect}
      />
    </View>
  ), [isDark, getRoleIcon, handleToggleStatus, handleDeleteUserPress, isSelecting, selectedIds, toggleSelect]);

  const stickyHeaderStyle = useAnimatedStyle(() => ({}));

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c14' : '#F8F6F0' }}>
      <StatusBar backgroundColor={isDark ? '#1c1c14' : '#F8F6F0'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        backgroundColor: isDark ? '#1c1c14' : '#F8F6F0',
        paddingTop: Math.max(insets.top, 20),
      }, stickyHeaderStyle]}>
        <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 34, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#111827' }}>
                Tuition
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>
                Members
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
              {!isSelecting && (
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
              {!isSelecting && (
                <TouchableOpacity onPress={() => { setShowAddForm(true); }}
                  style={{
                    backgroundColor: '#7C3AED', width: 50, height: 50, borderRadius: 16,
                    alignItems: 'center', justifyContent: 'center', elevation: 6,
                    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3, shadowRadius: 8,
                  }}>
                  <MaterialCommunityIcons name="account-plus" size={24} color="white" />
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
            {[
              { key: 'tuition_teacher', label: 'Teachers', short: 'Te', icon: 'account-tie-outline', color: teacherColor, count: stats.teachers },
              { key: 'tuition_student', label: 'Students', short: 'St', icon: 'school-outline', color: studentColor, count: stats.students },
            ].map(card => (
              <TouchableOpacity key={card.key} onPress={() => setFilter(prev => prev === card.key ? 'all' : card.key)}
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
      </Animated.View>

      <Animated.FlatList
        data={displayedUsers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollY.value = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20) + 230,
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
                {search ? `"${search}"` : filter === 'all' ? 'All Tuition Users' : filter === 'tuition_teacher' ? 'Tuition Teachers' : 'Tuition Students'}
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
              No tuition users found
            </Text>
          </View>
        }
      />

      <View style={{
        position: 'absolute', bottom: Math.max(insets.bottom, 10) + 4,
        left: 24, right: 24, zIndex: 11,
        borderRadius: 20, backgroundColor: isDark ? '#2d2d24' : '#FFFFFF',
        padding: 6, flexDirection: 'row', gap: 6,
        borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
        elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15, shadowRadius: 16,
      }}>
        {(['all', 'tuition_teacher', 'tuition_student'] as const).map(tab => (
          <TouchableOpacity key={tab} onPress={() => setFilter(tab)}
            style={{
              flex: 1, backgroundColor: filter === tab ? brandColor : 'transparent',
              borderRadius: 14, paddingVertical: 10, alignItems: 'center',
            }}>
            <MaterialCommunityIcons
              name={tab === 'all' ? 'account-group-outline' : tab === 'tuition_teacher' ? 'account-tie-outline' : 'school-outline'}
              size={18} color={filter === tab ? '#FFFFFF' : (isDark ? '#CCC' : '#6B7280')} />
            <Text style={{
              fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1,
              color: filter === tab ? '#FFFFFF' : (isDark ? '#CCC' : '#6B7280'), marginTop: 2,
            }}>
              {tab === 'all' ? 'ALL' : tab === 'tuition_teacher' ? 'TEACHERS' : 'STUDENTS'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />

      <ChoiceModal
        visible={choiceModal.visible}
        title={choiceModal.title}
        message={choiceModal.message}
        iconName={choiceModal.iconName}
        accentColor={choiceModal.accentColor}
        options={choiceModal.options}
        onClose={() => setChoiceModal(prev => ({ ...prev, visible: false }))}
      />

      <TuitionFormModal
        visible={showAddForm}
        onClose={closeAdd}
        onSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
        theme={isDark ? 'dark' : 'light'}
        isEdit={false}
      />

      {editingUser && (
        <TuitionFormModal
          visible={!!editingUser}
          onClose={closeEdit}
          onSubmit={handleEditSubmit}
          isSubmitting={isSubmitting}
          theme={isDark ? 'dark' : 'light'}
          initialData={editingUser}
          isEdit
        />
      )}
    </View>
  );
}
