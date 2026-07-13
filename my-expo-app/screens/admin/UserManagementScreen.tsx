import React, { useState, memo, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  FlatList, ListRenderItem, ScrollView, Image, Animated, Easing, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal from '../../components/StatusModal';
import ChoiceModal from '../../components/ChoiceModal';
import BranchFilter from '../../components/BranchFilter';

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }
interface UserManagementScreenProps { navigation: NavigationProps; }

const STUDENT_CATEGORIES = ['Playschool', 'PreKG', 'Daycare'] as const;
type CategoryType = typeof STUDENT_CATEGORIES[number];

// ─── Shared field label ────────────────────────────────────────────────────────
function FieldRow({ icon, label, required = false, theme, children }: {
  icon: string; label: string; required?: boolean; theme: string; children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
        <View style={{
          width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
          backgroundColor: theme === 'dark' ? '#2a2a28' : '#F3F4F6', marginRight: 8,
        }}>
          <MaterialCommunityIcons name={icon as any} size={14} color="#F59E0B" />
        </View>
        <Text style={{
          fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
          color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        }}>
          {label}{required ? <Text style={{ color: '#F59E0B' }}> *</Text> : ' (opt)'}
        </Text>
      </View>
      {children}
    </View>
  );
}

// ─── Mini DOB picker ───────────────────────────────────────────────────────────
function MiniDatePicker({ value, onChange, theme }: { value: string; onChange: (v: string) => void; theme: string }) {
  const parts = value ? value.split('-') : ['', '', ''];
  const [day,   setDay]   = useState(parts[2] || '');
  const [month, setMonth] = useState(parts[1] || '');
  const [year,  setYear]  = useState(parts[0] || '');

  const commit = (d: string, m: string, y: string) => {
    if (d && m && y) onChange(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
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

// ─── Shared User Form (used for both Add and Edit) ─────────────────────────────
function UserFormRaw({ theme, onSubmit, isSubmitting, initialData, isEdit }: {
  theme: string; onSubmit: (data: any) => void;
  isSubmitting: boolean; initialData?: Partial<User>; isEdit?: boolean;
}) {
  const { user, branches } = useAuth();
  const [formData, setFormData] = useState({
    name:        initialData?.name        || '',
    username:    (initialData as any)?.username    || '',
    dateOfBirth: (initialData as any)?.date_of_birth || '',
    fatherName:  initialData?.fatherName || '',
    motherName:  initialData?.motherName || '',
    fatherPhone: initialData?.fatherPhone || '',
    motherPhone: initialData?.motherPhone || '',
    category:    (initialData?.category as CategoryType) || 'Playschool',
    email:       initialData?.email       || '',
    phone:       initialData?.phone       || '',
    password:    '',
    role:        initialData?.role === 'student' ? 'student' : 'teacher' as 'student' | 'teacher',
    gender:      (initialData?.gender as 'Male' | 'Female') || 'Male',
    fees:        initialData?.fees || '',
    fee_due_day: (initialData as any)?.fee_due_day || '5',
    branch_id:   initialData?.branch_id || '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Sync state if initialData changes (important for switching between edits)
  useEffect(() => {
    setFormData({
      name:        initialData?.name        || '',
      username:    (initialData as any)?.username    || '',
      dateOfBirth: (initialData as any)?.date_of_birth || '',
      fatherName:  initialData?.fatherName || '',
      motherName:  initialData?.motherName || '',
      fatherPhone: initialData?.fatherPhone || '',
      motherPhone: initialData?.motherPhone || '',
      category:    (initialData?.category as CategoryType) || 'Playschool',
      email:       initialData?.email       || '',
      phone:       initialData?.phone       || '',
      password:    '',
      role:        initialData?.role === 'student' ? 'student' : 'teacher' as 'student' | 'teacher',
      gender:      (initialData?.gender as 'Male' | 'Female') || 'Male',
      fees:        initialData?.fees || '',
      fee_due_day: (initialData as any)?.fee_due_day || '5',
      branch_id:   initialData?.branch_id || '',
    });
  }, [initialData]);

  const set = useCallback((field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value })), []);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!formData.name.trim())     m.push('Name');
    if (!formData.username.trim()) m.push('Username');
    if (!formData.phone.trim())    m.push('Phone Number');
    if (!isEdit && !formData.password.trim()) m.push('Initial Password');
    if (formData.password && formData.password.length < 6) m.push('Password (min 6 chars)');
    // Father and Mother name are now optional as per request
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

  const chip = (active: boolean, accent = '#F59E0B') => ({
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' as const,
    borderWidth: 1.5,
    backgroundColor: active ? accent : (theme === 'dark' ? '#1e1e1c' : '#fff'),
    borderColor: active ? accent : (theme === 'dark' ? '#3a3a38' : '#E5E7EB'),
  });

  return (
    <View style={{ paddingBottom: 40 }}>

      {/* Role — disabled in edit mode */}
      <FieldRow icon="badge-account-horizontal" label="Role" required theme={theme}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['student', 'teacher'] as const).map(r => (
            <TouchableOpacity key={r} activeOpacity={isEdit ? 1 : 0.7}
              style={{ ...chip(formData.role === r, '#F59E0B'), opacity: isEdit ? 0.5 : 1 }}
              onPress={() => { if (!isEdit) { Keyboard.dismiss(); set('role', r); } }}>
              <Text style={{ fontWeight: '900', textTransform: 'capitalize', fontSize: 13,
                color: formData.role === r ? 'white' : (theme === 'dark' ? '#6B7280' : '#9CA3AF') }}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </FieldRow>

      {/* Gender */}
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

      {/* Branch — only for master_admin */}
      {user?.role === 'master_admin' && (
        <FieldRow icon="domain" label="Branch" required theme={theme}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {branches.map(b => (
              <TouchableOpacity key={b.id} activeOpacity={0.7}
                style={{
                  paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
                  backgroundColor: formData.branch_id === b.id ? '#F59E0B' : (theme === 'dark' ? '#1e1e1c' : '#fff'),
                  borderWidth: 1.5,
                  borderColor: formData.branch_id === b.id ? '#F59E0B' : (theme === 'dark' ? '#3a3a38' : '#E5E7EB'),
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
        <Text style={{ fontSize: 9, color: '#F59E0B', marginTop: 4, fontWeight: '700' }}>
          * MUST BE UNIQUE FOR LOGIN
        </Text>
      </FieldRow>

      {/* Student-only */}
      {formData.role === 'student' && (
        <>
          <FieldRow icon="cake-variant" label="Date of Birth" theme={theme}>
            <MiniDatePicker value={formData.dateOfBirth} onChange={v => set('dateOfBirth', v)} theme={theme} />
            {formData.dateOfBirth ? (
              <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '700', marginTop: 4 }}>
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
               {/* Amount */}
               <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                  <View className="bg-brand-violet w-12 h-[52px] rounded-l-xl items-center justify-center">
                     <Text className="text-white font-black text-lg">₹</Text>
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

               {/* Due Day */}
               <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <View className="bg-brand-yellow w-12 h-[52px] rounded-l-xl items-center justify-center">
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
            <View className="flex-row justify-between mt-2">
               <Text style={{ fontSize: 9, color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
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
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} 
            />
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 9, color: formData.password.length > 0 && formData.password.length < 6 ? '#EF4444' : '#F59E0B', marginTop: 4, fontWeight: '700' }}>
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
          if (!isValid) {
            onSubmit(null); // Trigger validation popup in parent
            return;
          }
          if (!isSubmitting) onSubmit(formData); 
        }}
        style={{
          backgroundColor: isSubmitting ? '#D1D5DB' : (isValid ? '#F59E0B' : '#FCA5A5'),
          paddingVertical: 18, borderRadius: 22, alignItems: 'center',
          flexDirection: 'row', justifyContent: 'center',
          shadowColor: '#F59E0B', shadowOpacity: isValid ? 0.35 : 0,
          shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8,
        }}
      >
        {isSubmitting ? <ActivityIndicator color="white" /> : (
          <>
            <MaterialCommunityIcons name={isEdit ? 'content-save' : 'account-plus'} size={20}
              color="white" />
            <Text style={{ fontWeight: '900', fontSize: 16, marginLeft: 8,
              color: 'white' }}>
              {isEdit ? 'Save Changes' : (isValid ? 'Register Member' : 'Check Details ⚠️')}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const UserForm = memo(UserFormRaw);

// ─── Shared modal shell (used for both Add & Edit) ────────────────────────────
const UserFormModal = memo(({ visible, onClose, onSubmit, isSubmitting, theme, initialData, isEdit }: any) => (
  <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
    <View 
        className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-[#FFF8F0]'}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFF8F0' }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* ── Background Gradient & 3D Illustration ── */}
          
          {/* Header */}
          <View className="px-6 pt-12 pb-6 flex-row items-center justify-between">
            <View className="flex-1">
              <TouchableOpacity onPress={onClose} 
                className={`${theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-violet/20'} w-14 h-14 rounded-2xl items-center justify-center shadow-xl border mb-4`}
              >
                <MaterialCommunityIcons name="close" size={28} color={theme === 'dark' ? '#FFF' : '#F59E0B'} />
              </TouchableOpacity>
              <Text className="text-4xl font-black tracking-tighter" style={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>
                {isEdit ? 'Update' : 'Register'}
              </Text>
              <Text style={{ color: theme === 'dark' ? '#A78BFA' : '#7C3AED', fontSize: 22, fontWeight: '900', marginTop: -4 }}>
                {isEdit ? 'Profile ✏️' : 'New Member ✨'}
              </Text>
            </View>
            <View className="bg-brand-violet w-24 h-24 rounded-2xl items-center justify-center shadow-2xl border-4 rotate-3 overflow-hidden" style={{ borderColor: theme === 'dark' ? '#2d2d24' : '#FFFFFF' }}>
                <MaterialCommunityIcons name={isEdit ? "account-edit-outline" : "account-plus-outline"} size={48} color="white" />
            </View>
          </View>

          <View className="px-6">
            <UserForm
              key={initialData?.id || 'new-form'}
              theme={theme}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              initialData={initialData}
              isEdit={isEdit}
            />
          </View>
          <View className="h-32" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  </Modal>
));

// ─── User Card ────────────────────────────────────────────────────────────────
const UserItem = memo(({ user, isMenuOpen, onMenuToggle, getRoleIcon, onStatusToggle, onDelete, onEdit, theme }: any) => {
  const branchName = user.branch?.name || '';
  const cardBg = theme === 'dark' ? '#1e1e1e' : '#FFFFFF';
  const border = theme === 'dark' ? '#333' : '#E5E7EB';
  const subBg = theme === 'dark' ? '#2d2d24' : '#F3F4F6';
  const textMain = theme === 'dark' ? '#FFFFFF' : '#111827';
  const textSub = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const textMuted = theme === 'dark' ? '#6B7280' : '#9CA3AF';
  return (
  <View style={{ elevation: 4, backgroundColor: cardBg, borderColor: border, borderRadius: 12, overflow: 'hidden' }} className="mb-2 border">
    
    <View className="flex-row items-center px-3 py-2.5">
        <View style={{ backgroundColor: subBg, borderColor: border }} className="w-10 h-10 rounded-xl items-center justify-center border overflow-hidden">
            {user.avatar ? (
                <Image source={{ uri: user.avatar }} className="w-full h-full" resizeMode="cover" />
            ) : (
                <MaterialCommunityIcons name={getRoleIcon(user.role) as any} size={20} color={textMuted} />
            )}
        </View>

        <View className="ml-2.5 flex-1">
            <View className="flex-row items-center justify-between">
                <Text style={{ color: textMain }} className="text-sm font-bold" numberOfLines={1}>{user.name}</Text>
                <View style={{ backgroundColor: user.status === 'active' ? (theme === 'dark' ? '#064E3B' : '#F0FFF4') : (theme === 'dark' ? '#7F1D1D' : '#FFF5F5') }} className="px-1.5 py-0.5 rounded">
                    <Text style={{ color: user.status === 'active' ? (theme === 'dark' ? '#6EE7B7' : '#065F46') : (theme === 'dark' ? '#FCA5A5' : '#991B1B') }} className="text-[7px] font-bold uppercase tracking-wider">
                        {user.status}
                    </Text>
                </View>
            </View>
            
            <View className="flex-row items-center mt-0.5 flex-wrap">
                <Text className="text-[9px] font-bold lowercase" style={{ color: textSub }}>{user.username}</Text>
                <Text className="text-[9px] mx-1" style={{ color: textMuted }}>|</Text>
                <Text className="text-[9px] font-bold uppercase tracking-wider" style={{ color: textSub }}>
                    {user.studentId || user.teacherId || 'ADMIN'}
                </Text>
                {!!branchName && (
                  <>
                    <Text className="text-[9px] mx-1" style={{ color: textMuted }}>|</Text>
                    <Text className="text-[9px] font-bold" style={{ color: textSub }}>{branchName}</Text>
                  </>
                )}
            </View>

            <View className="flex-row flex-wrap items-center mt-1 gap-1">
                <View style={{ backgroundColor: subBg, borderColor: border }} className="px-1.5 py-0.5 rounded border">
                    <Text style={{ color: textSub }} className="text-[7px] font-bold uppercase">{user.role}</Text>
                </View>

                {user.gender && (
                  <View style={{ backgroundColor: subBg, borderColor: border }} className="px-1.5 py-0.5 rounded border">
                      <Text style={{ color: textSub }} className="text-[7px] font-bold uppercase">{user.gender}</Text>
                  </View>
                )}

                {user.role === 'student' && user.category && (
                    <View style={{ backgroundColor: subBg, borderColor: border }} className="px-1.5 py-0.5 rounded border">
                        <Text style={{ color: textSub }} className="text-[7px] font-bold uppercase">{user.category}</Text>
                    </View>
                )}

                {user.role === 'student' && user.fees && (
                    <View style={{ backgroundColor: subBg, borderColor: border }} className="px-1.5 py-0.5 rounded border">
                        <Text style={{ color: textSub }} className="text-[7px] font-bold">₹{user.fees}</Text>
                    </View>
                )}
            </View>
        </View>

        <TouchableOpacity onPress={onMenuToggle} className="p-1 ml-1">
            <MaterialCommunityIcons name={isMenuOpen ? "dots-horizontal" : "dots-vertical"} size={18} color={textMuted} />
        </TouchableOpacity>
    </View>

    {isMenuOpen && (
        <View style={{ borderTopColor: theme === 'dark' ? '#333' : '#F3F4F6', backgroundColor: theme === 'dark' ? '#2d2d24' : '#F9FAFB' }} className="flex-row justify-around py-2.5 border-t">
            <TouchableOpacity onPress={() => { onMenuToggle(); onEdit(user); }} className="items-center">
                <View style={{ backgroundColor: cardBg, borderColor: border }} className="w-9 h-9 rounded-xl items-center justify-center border">
                    <MaterialCommunityIcons name="pencil-outline" size={16} color={textMuted} />
                </View>
                <Text className="text-[8px] font-bold mt-1 uppercase tracking-wider" style={{ color: textSub }}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                disabled={user.role === 'admin'}
                onPress={() => { onMenuToggle(); onStatusToggle(user.id); }} 
                className={`items-center ${user.role === 'admin' ? 'opacity-30' : 'opacity-100'}`}
            >
                <View style={{ backgroundColor: cardBg, borderColor: border }} className="w-9 h-9 rounded-xl items-center justify-center border">
                    <MaterialCommunityIcons 
                        name={user.status === 'active' ? "account-cancel-outline" : "account-check-outline"} 
                        size={16} 
                        color={textMuted} 
                    />
                </View>
                <Text style={{ color: textSub }} className="text-[8px] font-bold mt-1 uppercase tracking-wider">
                    {user.status === 'active' ? 'Halt' : 'Live'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                disabled={user.role === 'admin'}
                onPress={() => { onMenuToggle(); onDelete(user.id, user.name); }} 
                className={`items-center ${user.role === 'admin' ? 'opacity-30' : 'opacity-100'}`}
            >
                <View style={{ backgroundColor: subBg, borderColor: border }} className="w-9 h-9 rounded-xl items-center justify-center border">
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={textMuted} />
                </View>
                <Text style={{ color: textSub }} className="text-[8px] font-bold mt-1 uppercase tracking-wider">Delete</Text>
            </TouchableOpacity>
        </View>
    )}
  </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UserManagementScreen({ navigation }: UserManagementScreenProps) {
  const { user, users, branches, addUser, updateUser, deleteUser, toggleUserStatus, fetchData } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error('Refresh Error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const [showAddForm,   setShowAddForm]   = useState(false);
  const [editingUser,   setEditingUser]   = useState<User | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [activeMenuId,  setActiveMenuId]  = useState<string | null>(null);
  const [filter,        setFilter]        = useState<'all' | 'student' | 'teacher'>('all');
  const [search,        setSearch]        = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState({ visible: false, title: '', message: '', type: 'error' as any });
  const [choiceModal, setChoiceModal] = useState({ visible: false, title: '', message: '', options: [] as any[], iconName: '', accentColor: '' });

  // ── Shake Animation Logic ──
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const shake = () => {
      // Create a sequence: slight left, slight right, back to center
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 60, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 60, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      ]).start();
    };

    const interval = setInterval(shake, 3000);
    return () => clearInterval(interval);
  }, [shakeAnim]);

  const closeAdd  = useCallback(() => setShowAddForm(false), []);
  const closeEdit = useCallback(() => setEditingUser(null), []);

  const toggleFilter = useCallback((role: 'student' | 'teacher') => {
    setFilter(prev => prev === role ? 'all' : role);
    setActiveMenuId(null);
  }, []);

  const getRoleIcon = useCallback((role: string) => {
    switch (role) {
      case 'admin':   return 'shield-account';
      case 'teacher': return 'account-tie';
      case 'student': return 'school';
      default:        return 'account';
    }
  }, []);

  // ── Add ──
  const handleAddSubmit = useCallback(async (formData: any) => {
    if (!formData) {
       setStatusModal({
         visible: true,
         title: 'Form Incomplete 📝',
         message: 'Please fill in all mandatory fields before saving.',
         type: 'info'
       });
       return;
    }
    setIsSubmitting(true);
    try {
      const maxId = users
        .filter(u => u.role === 'student' && u.studentId?.startsWith('tnhk'))
        .map(u => parseInt(u.studentId?.replace('tnhk', '') || '0'))
        .reduce((max, id) => Math.max(max, id), 0);
        
      const nextId = (maxId + 1).toString().padStart(3, '0');

      const payload: any = {};
      Object.entries({
        name:          formData.name,
        username:      formData.username   || undefined,
        date_of_birth: formData.dateOfBirth && formData.role === 'student' ? formData.dateOfBirth : undefined,
        email:         formData.email      || undefined,
        phone:         formData.phone,
        role:          formData.role,
        gender:        formData.gender,
        password:      formData.password,
        status:        'active',
        branch_id:     formData.branch_id || undefined,
        father_name:   formData.role === 'student' ? formData.fatherName : undefined,
        mother_name:   formData.role === 'student' ? formData.motherName : undefined,
        father_phone:  formData.role === 'student' ? formData.fatherPhone : undefined,
        mother_phone:  formData.role === 'student' ? formData.motherPhone : undefined,
        category:      formData.role === 'student' ? formData.category   : undefined,
        fees:          formData.role === 'student' ? formData.fees       : undefined,
        fee_due_day:   formData.role === 'student' ? formData.fee_due_day : undefined,
      }).forEach(([k, v]) => { if (v !== undefined) payload[k] = v; });

      // Handle custom logic after pruning
      if (formData.role === 'student') payload.student_id = `tnhk${nextId}`;
      if (formData.role === 'teacher') payload.teacher_id = `tnhkt${(users.filter(u => u.role === 'teacher').length + 1).toString().padStart(3,'0')}`;

      await addUser(payload);
      setShowAddForm(false);
      setStatusModal({
        visible: true,
        title: 'User Added! 🎉',
        message: `${formData.name} has been successfully registered in the system.`,
        type: 'success'
      });
    } catch (err: any) {
      console.log('Add User Error:', err?.response?.data || err.message);
      const errMsg = err?.response?.data?.message || 'Something went wrong while adding the user. Please try again.';
      setStatusModal({
        visible: true,
        title: 'System Error ⚠️',
        message: errMsg,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [users, addUser]);

  // ── Edit ──
  const handleEditSubmit = useCallback(async (formData: any) => {
    if (!formData) {
       setStatusModal({
         visible: true,
         title: 'Form Incomplete 📝',
         message: 'Please fill in all mandatory fields before saving.',
         type: 'info'
       });
       return;
    }
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const payload: any = {};
      Object.entries({
        name:          formData.name,
        username:      formData.username   || undefined,
        email:         formData.email      || undefined,
        phone:         formData.phone,
        gender:        formData.gender,
        branch_id:     formData.branch_id || undefined,
        father_name:   formData.role === 'student' ? formData.fatherName : undefined,
        mother_name:   formData.role === 'student' ? formData.motherName : undefined,
        father_phone:  formData.role === 'student' ? formData.fatherPhone : undefined,
        mother_phone:  formData.role === 'student' ? formData.motherPhone : undefined,
        category:      formData.role === 'student' ? formData.category   : undefined,
        fees:          formData.role === 'student' ? formData.fees       : undefined,
        fee_due_day:   formData.role === 'student' ? formData.fee_due_day : undefined,
        date_of_birth: formData.role === 'student' && formData.dateOfBirth ? formData.dateOfBirth : undefined,
      }).forEach(([k, v]) => { if (v !== undefined) payload[k] = v; });

      if (formData.password) payload.password = formData.password;
      await updateUser(editingUser.id, payload);
      setEditingUser(null);
      setStatusModal({
        visible: true,
        title: 'Changes Saved! ✅',
        message: 'The user profile has been updated successfully.',
        type: 'success'
      });
    } catch (err: any) {
      console.log('Edit User Error:', err?.response?.data || err.message);
      const errMsg = err?.response?.data?.message || 'Could not update user details. Please check your connection.';
      setStatusModal({
        visible: true,
        title: 'Update Failed ⚠️',
        message: errMsg,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editingUser, updateUser]);

  const handleDeleteUserPress = useCallback((userId: string, userName: string) => {
    const target = users.find(u => u.id === userId);
    if (target?.role === 'admin') {
        setStatusModal({
            visible: true,
            title: 'Protected Account 🛡️',
            message: 'The Master Administrator account is protected and cannot be deleted for security reasons.',
            type: 'info'
        });
        return;
    }

    setChoiceModal({
        visible: true,
        title: 'Delete User? 🔒',
        message: `Are you sure you want to permanently remove ${userName}? All associated data will be lost.`,
        iconName: 'account-remove',
        accentColor: '#EF4444',
        options: [
            { 
              label: 'Yes, Delete User', 
              type: 'destructive', 
              onPress: async () => {
                try {
                  await deleteUser(userId);
                  setStatusModal({
                    visible: true,
                    title: 'Deleted! ✅',
                    message: `User ${userName} has been successfully removed.`,
                    type: 'success'
                  });
                } catch (e) {
                  setStatusModal({
                    visible: true,
                    title: 'Error ⚠️',
                    message: 'Failed to delete user. Please try again.',
                    type: 'error'
                  });
                }
              }
            }
        ]
    });
  }, [deleteUser, users]);

  const stats = useMemo(() => ({
    students: users.filter(u => u.role === 'student' && u.status === 'active').length,
    teachers: users.filter(u => u.role === 'teacher' && u.status === 'active').length,
  }), [users]);

  // ── Search + Filter ──
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
    return list.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return 0;
    });
  }, [users, filter, search, selectedBranchId]);

  const ListHeader = useMemo(() => (
    <View style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFF8F0' }}>
      
      <View style={{ paddingTop: Math.max(insets.top, 12) }} className="px-5 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: theme === 'dark' ? '#2d2d24' : '#FFFFFF', borderColor: theme === 'dark' ? '#333' : '#E5E7EB' }}
              className="w-9 h-9 rounded-xl items-center justify-center border mb-2">
              <MaterialCommunityIcons name="arrow-left" size={20} color={theme === 'dark' ? '#FFF' : '#374151'} />
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: '900', color: theme === 'dark' ? '#FFFFFF' : '#111827', letterSpacing: -0.5 }}>Members</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Directory</Text>
          </View>
          <View style={{ backgroundColor: theme === 'dark' ? '#2d2d24' : '#FFFFFF', borderColor: theme === 'dark' ? '#333' : '#E5E7EB' }} className="w-14 h-14 rounded-xl items-center justify-center border">
             <MaterialCommunityIcons name="account-group-outline" size={26} color={theme === 'dark' ? '#CCC' : '#6B7280'} />
          </View>
        </View>
      </View>

      {/* Branch Picker */}
      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <BranchFilter
          selectedBranchId={selectedBranchId}
          onSelect={setSelectedBranchId}
        />
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <View style={{ backgroundColor: theme === 'dark' ? '#1e1e1e' : '#FFFFFF', borderColor: theme === 'dark' ? '#333' : '#E5E7EB' }} className="flex-row items-center rounded-xl px-3 py-2.5 border">
          <MaterialCommunityIcons name="account-search-outline" size={16} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} />
          <TextInput
            style={{
              flex: 1, marginLeft: 8, fontSize: 13, fontWeight: '600',
              color: theme === 'dark' ? '#FFF' : '#111',
            }}
            placeholder="Search by name, ID or email..."
            placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ backgroundColor: theme === 'dark' ? '#333' : '#F3F4F6' }} className="p-1 rounded-full">
              <MaterialCommunityIcons name="close" size={12} color={theme === 'dark' ? '#9CA3AF' : '#9CA3AF'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter stat cards */}
      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => toggleFilter('student')}
            style={{ borderColor: filter === 'student' ? '#111827' : theme === 'dark' ? '#333' : '#E5E7EB', elevation: filter === 'student' ? 4 : 1 }}
            className="flex-1 rounded-xl overflow-hidden border"
          >
            <View style={{ backgroundColor: theme === 'dark' ? '#1e1e1e' : '#FFFFFF' }} className="p-3">
                <View className="flex-row items-center justify-between mb-2">
                    <View style={{ backgroundColor: theme === 'dark' ? '#2d2d24' : '#F3F4F6' }} className="p-1.5 rounded-lg">
                        <MaterialCommunityIcons name="school-outline" size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    </View>
                    <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#D1D5DB' }} className="font-bold text-xs tracking-wider uppercase">St</Text>
                </View>
                <Text style={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }} className="text-xl font-bold">{stats.students}</Text>
                <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#9CA3AF' }} className="text-[8px] font-semibold uppercase tracking-wider mt-0.5">Total</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => toggleFilter('teacher')}
            style={{ borderColor: filter === 'teacher' ? '#111827' : theme === 'dark' ? '#333' : '#E5E7EB', elevation: filter === 'teacher' ? 4 : 1 }}
            className="flex-1 rounded-xl overflow-hidden border"
          >
            <View style={{ backgroundColor: theme === 'dark' ? '#1e1e1e' : '#FFFFFF' }} className="p-3">
                <View className="flex-row items-center justify-between mb-2">
                    <View style={{ backgroundColor: theme === 'dark' ? '#2d2d24' : '#F3F4F6' }} className="p-1.5 rounded-lg">
                        <MaterialCommunityIcons name="account-tie-outline" size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    </View>
                    <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#D1D5DB' }} className="font-bold text-xs tracking-wider uppercase">Te</Text>
                </View>
                <Text style={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }} className="text-xl font-bold">{stats.teachers}</Text>
                <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#9CA3AF' }} className="text-[8px] font-semibold uppercase tracking-wider mt-0.5">Staff</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

{/* Section label */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: '700', flex: 1, color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>
          {search ? `"${search}"` : filter === 'all' ? 'Registered Members' : filter === 'student' ? 'Students' : 'Faculty'}
          <Text style={{ color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontSize: 12 }}> ({displayedUsers.length})</Text>
        </Text>
        {(filter !== 'all' || search !== '') && (
          <TouchableOpacity onPress={() => { setFilter('all'); setSearch(''); }}
            style={{ backgroundColor: theme === 'dark' ? '#2d2d24' : '#FFFFFF', borderColor: theme === 'dark' ? '#333' : '#E5E7EB' }}
            className="px-2.5 py-1 rounded-full border">
            <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>CLEAR</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [stats.students, stats.teachers, filter, search, displayedUsers.length, selectedBranchId, theme]);

  const renderItem: ListRenderItem<User> = useCallback(({ item }) => (
    <View style={{ paddingHorizontal: 16 }}>
      <UserItem
        user={item}
        theme={theme}
        isMenuOpen={activeMenuId === item.id}
        onMenuToggle={() => setActiveMenuId(prev => prev === item.id ? null : item.id)}
        getRoleIcon={getRoleIcon}
        onStatusToggle={toggleUserStatus}
        onDelete={handleDeleteUserPress}
        onEdit={(u: User) => setEditingUser(u)}
      />
    </View>
  ), [activeMenuId, getRoleIcon, toggleUserStatus, handleDeleteUserPress, theme]);

  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFF8F0' }}>
        <FlatList
          data={displayedUsers}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={<View className="h-24" />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                colors={[theme === 'dark' ? '#F59E0B' : '#6B7280']}
                progressBackgroundColor={theme === 'dark' ? '#1e1e1e' : '#FFFFFF'}
            />
          }
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, opacity: 0.3 }}>
              <MaterialCommunityIcons name="account-search-outline" size={64} color={theme === 'dark' ? '#4B5563' : '#9CA3AF'} />
              <Text style={{ fontWeight: '700', marginTop: 12, fontSize: 13,
                color: theme === 'dark' ? '#6B7280' : '#6B7280' }}>
                No users found
              </Text>
            </View>
          }
        />

        {/* FAB - Add User */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setShowAddForm(true)}
          style={{
            position: 'absolute',
            bottom: Math.max(insets.bottom, 24),
            right: 24,
            zIndex: 99,
            backgroundColor: '#F59E0B',
            width: 60,
            height: 60,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 12,
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
          }}
        >
          <MaterialCommunityIcons name="plus" size={28} color="white" />
        </TouchableOpacity>

      {/* Add Modal */}
      <UserFormModal
        visible={showAddForm}
        onClose={closeAdd}
        onSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
        theme={theme}
        isEdit={false}
      />

      {/* Edit Modal */}
      <UserFormModal
        visible={!!editingUser}
        onClose={closeEdit}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        theme={theme}
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
