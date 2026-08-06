import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  FlatList, ListRenderItem, ScrollView, Image, RefreshControl, StatusBar,
  StyleSheet, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '../../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import GlassDropdown from './GlassDropdown';
import GlassSelectV2 from './GlassSelectV2';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';
const GREEN = '#10B981';
const RED = '#EF4444';
const brandColor = AMBER;
const teacherColor = '#8B5CF6';
const studentColor = '#10B981';

const TEAM_ICON = require('../../../assets/icons/team.png');
const TEACHER_ICON = require('../../../assets/icons/teacher.png');

interface Props {
  navigation: { navigate: (s: string, params?: any) => void; goBack: () => void };
}

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

function StatusPopup({ visible, title, message, type, onClose }: {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}) {
  const color = type === 'success' ? GREEN : type === 'error' ? RED : type === 'warning' ? AMBER : '#3B82F6';
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : type === 'warning' ? 'alert' : 'information-outline';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(31,45,40,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
        <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 24, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: color + '16', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name={icon as any} size={34} color={color} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 16, textAlign: 'center' }}>{title}</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: TEXT_SECONDARY, marginTop: 8, textAlign: 'center', lineHeight: 19 }}>{message}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={{ marginTop: 20, alignSelf: 'stretch', height: 50, borderRadius: 16, overflow: 'hidden' }}>
            <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#FFFFFF' }}>Okay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ChoicePopup({ visible, title, message, options, iconName, accentColor, onClose }: {
  visible: boolean;
  title: string;
  message: string;
  options: { label: string; type?: 'primary' | 'destructive'; onPress?: () => void }[];
  iconName: string;
  accentColor: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(31,45,40,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
        <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 24, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: accentColor + '16', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name={iconName as any} size={34} color={accentColor} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 16, textAlign: 'center' }}>{title}</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: TEXT_SECONDARY, marginTop: 8, textAlign: 'center', lineHeight: 19 }}>{message}</Text>
          <View style={{ alignSelf: 'stretch', marginTop: 20 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                activeOpacity={0.85}
                onPress={() => { onClose(); opt.onPress && opt.onPress(); }}
                style={{ height: 50, borderRadius: 16, overflow: 'hidden', marginBottom: 10 }}
              >
                <LinearGradient
                  colors={opt.type === 'destructive' ? ['#EF4444', '#DC2626'] : ['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#FFFFFF' }}>{opt.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={{ height: 50, borderRadius: 16, backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_SECONDARY }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

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

const inp: any = {
  borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
  fontSize: 14, fontWeight: '700',
  color: TEXT_PRIMARY,
  backgroundColor: 'rgba(247,249,246,0.95)',
  borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
};

function TuitionFormRaw({ onSubmit, isSubmitting, initialData, isEdit }: {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialData?: Partial<User>;
  isEdit?: boolean;
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

  return (
    <View style={{ paddingBottom: 40 }}>
      <GlassSelectV2
        label="Role"
        value={formData.role}
        placeholder="Select Role"
        options={[
          { label: 'Tuition Teacher', value: 'tuition_teacher' },
          { label: 'Tuition Student', value: 'tuition_student' },
        ]}
        onSelect={(val) => { Keyboard.dismiss(); set('role', val || 'tuition_student'); }}
        icon={TEACHER_ICON}
        title="Select Role"
        subtitle="Choose the member type"
      />

      <FieldRow icon="gender-male-female" label="Gender" required>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['Male', 'Female'] as const).map(g => (
            <TouchableOpacity key={g} activeOpacity={0.7}
              onPress={() => { Keyboard.dismiss(); set('gender', g); }}
              style={{
                flex: 1, paddingVertical: 13, borderRadius: 16, alignItems: 'center',
                backgroundColor: formData.gender === g ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.92)',
                borderWidth: 1, borderColor: formData.gender === g ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.6)',
              }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: formData.gender === g ? AMBER_DARK : TEXT_MUTED }}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </FieldRow>

      {user?.role === 'master_admin' && (
        <GlassSelectV2
          label="Branch"
          value={formData.branch_id || null}
          placeholder="Select Branch"
          options={branches.map(b => ({ label: b.name, value: b.id }))}
          onSelect={(val) => { Keyboard.dismiss(); set('branch_id', val || ''); }}
          icon={TEAM_ICON}
          title="Select Branch"
          subtitle="Assign to a branch"
        />
      )}

      <FieldRow icon="account" label="Name" required>
        <TextInput style={inp} placeholder="e.g. Rahul Sharma" placeholderTextColor="#9CA3AF"
          value={formData.name} onChangeText={v => set('name', v)} />
      </FieldRow>

      <FieldRow icon="at" label="Username" required>
        <TextInput style={inp} placeholder="e.g. rahul.tuition" placeholderTextColor="#9CA3AF"
          autoCapitalize="none" value={formData.username} onChangeText={v => set('username', v)} />
        <Text style={{ fontSize: 9, color: brandColor, marginTop: 4, fontWeight: '700' }}>
          * MUST BE UNIQUE FOR LOGIN
        </Text>
      </FieldRow>

      {formData.role === 'tuition_student' && (
        <>
          <FieldRow icon="cake-variant" label="Date of Birth">
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowDobPicker(true)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: 'rgba(247,249,246,0.95)', borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.6)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14,
              }}>
              <MaterialCommunityIcons name="calendar" size={20} color={AMBER_DARK} />
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
            <TextInput style={{ ...inp, marginBottom: 8 }} placeholder="Father's Name" placeholderTextColor="#9CA3AF"
              value={formData.fatherName} onChangeText={v => set('fatherName', v)} />
            <TextInput style={inp} placeholder="Father's Phone" placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad" maxLength={10} value={formData.fatherPhone}
              onChangeText={v => set('fatherPhone', v.replace(/[^0-9]/g, '').slice(0, 10))} />
          </FieldRow>

          <FieldRow icon="account-heart" label="Mother Details">
            <TextInput style={{ ...inp, marginBottom: 8 }} placeholder="Mother's Name" placeholderTextColor="#9CA3AF"
              value={formData.motherName} onChangeText={v => set('motherName', v)} />
            <TextInput style={inp} placeholder="Mother's Phone" placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad" maxLength={10} value={formData.motherPhone}
              onChangeText={v => set('motherPhone', v.replace(/[^0-9]/g, '').slice(0, 10))} />
          </FieldRow>

          <FieldRow icon="currency-inr" label="Fee Details">
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#7C3AED', width: 48, height: 52, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>₹</Text>
                </View>
                <TextInput
                  style={{ ...inp, flex: 1, height: 52, paddingVertical: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  placeholder="Amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={formData.fees ? formData.fees.toString() : ''}
                  onChangeText={v => set('fees', v)}
                />
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: brandColor, width: 48, height: 52, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="calendar-clock" size={20} color="#92400E" />
                </View>
                <TextInput
                  style={{ ...inp, flex: 1, height: 52, paddingVertical: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
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

      <FieldRow icon="email-outline" label="Email ID">
        <TextInput style={inp} placeholder="email@example.com" placeholderTextColor="#9CA3AF"
          keyboardType="email-address" autoCapitalize="none"
          value={formData.email} onChangeText={v => set('email', v)} />
      </FieldRow>

      <FieldRow icon="phone" label="Phone Number" required>
        <TextInput style={inp} placeholder="10-digit Number" placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad" maxLength={10} value={formData.phone}
          onChangeText={v => set('phone', v.replace(/[^0-9]/g, '').slice(0, 10))} />
      </FieldRow>

      <FieldRow icon="lock-outline" label={isEdit ? 'New Password' : 'Initial Password'} required={!isEdit}>
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
              color="#9CA3AF"
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
        style={{ height: 56, borderRadius: 18, overflow: 'hidden' }}
      >
        <LinearGradient colors={isSubmitting ? ['#D1D5DB', '#9CA3AF'] : (isValid ? ['#F59E0B', '#D97706'] : ['#FCA5A5', '#F87171'])} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name={isEdit ? 'content-save' : 'account-plus'} size={20} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 13, marginLeft: 8 }}>
                {isEdit ? 'Save Changes' : (isValid ? 'Register User' : 'Check Details ⚠️')}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const TuitionForm = memo(TuitionFormRaw);

const TuitionFormModal = memo(({ visible, onClose, onSubmit, isSubmitting, initialData, isEdit }: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialData?: Partial<User>;
  isEdit?: boolean;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#F7F9F6', paddingTop: insets.top }}>
        <StatusBar backgroundColor="#F7F9F6" barStyle="dark-content" />
        <AuroraBackground />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={onClose}
                style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="close" size={22} color={TEXT_PRIMARY} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Tuition</Text>
                <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: -0.5 }}>
                  {isEdit ? 'Update Profile' : 'Register User'}
                </Text>
              </View>
              <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={TEAM_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
              </View>
            </View>

            <View style={{ marginTop: 24 }}>
              <TuitionForm
                key={initialData?.id || 'new-form'}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                initialData={initialData}
                isEdit={isEdit}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

const TuitionUserCard = memo(({ user, onEdit, onStatusToggle, onDelete, getRoleIcon, isSelecting, isSelected, onToggleSelect }: {
  user: User;
  onEdit: (u: User) => void;
  onStatusToggle: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  getRoleIcon: (role: string) => string;
  isSelecting?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) => {
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
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: BORDER_RADIUS, marginBottom: 14,
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
        <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: roleColor }} />

        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 52, height: 52, borderRadius: 16,
            backgroundColor: roleColor + '1F',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: roleColor + '33',
            overflow: 'hidden',
          }}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <MaterialCommunityIcons name={getRoleIcon(user.role) as any} size={22} color={roleColor} />
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '800', fontSize: 15, color: TEXT_PRIMARY }} numberOfLines={1}>
                {user.name}
              </Text>
              <View style={{
                backgroundColor: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100,
              }}>
                <Text style={{
                  fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1,
                  color: isActive ? '#059669' : '#DC2626',
                }}>
                  {user.status}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_MUTED }}>
                @{user.username}
              </Text>
              <Text style={{ fontSize: 10, color: TEXT_MUTED, marginHorizontal: 4 }}>|</Text>
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: TEXT_MUTED }}>
                {user.studentId || user.teacherId || 'TT-000'}
              </Text>
              {!!branchName && (
                <>
                  <Text style={{ fontSize: 10, color: TEXT_MUTED, marginHorizontal: 4 }}>|</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_MUTED }}>{branchName}</Text>
                </>
              )}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 }}>
              <View style={{ backgroundColor: roleColor + '14', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 }}>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: roleColor }}>
                  {user.role === 'tuition_teacher' ? 'Tuition Teacher' : 'Tuition Student'}
                </Text>
              </View>
              {user.gender && (
                <View style={{ backgroundColor: 'rgba(247,249,246,0.95)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED }}>
                    {user.gender}
                  </Text>
                </View>
              )}
              {user.category && (
                <View style={{ backgroundColor: 'rgba(247,249,246,0.95)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED }}>
                    {user.category}
                  </Text>
                </View>
              )}
              {user.role === 'tuition_student' && user.fees && (
                <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', color: AMBER_DARK }}>
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
            <MaterialCommunityIcons name={showActions ? 'chevron-up' : 'dots-vertical'} size={18} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>
      </View>

      {showActions && (
        <View style={{
          flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(31,45,40,0.06)',
          backgroundColor: 'rgba(247,249,246,0.5)',
          paddingVertical: 10, paddingHorizontal: 16,
        }}>
          <TouchableOpacity onPress={() => { setShowActions(false); onEdit(user); }}
            style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={AMBER_DARK} />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginTop: 4 }}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setShowActions(false); onStatusToggle(user.id); }}
            style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isActive ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={isActive ? 'account-cancel-outline' : 'account-check-outline'} size={16} color={isActive ? '#EF4444' : '#10B981'} />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginTop: 4 }}>
              {isActive ? 'Halt' : 'Live'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isProtected}
            onPress={() => { setShowActions(false); onDelete(user.id, user.name); }}
            style={{ flex: 1, alignItems: 'center', opacity: isProtected ? 0.3 : 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#EF4444', marginTop: 4 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function ManageTuitionUsersScreenV2({ navigation }: Props) {
  const { user, users, branches, addUser, updateUser, deleteUser, toggleUserStatus, fetchData } = useAuth();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'tuition_teacher' | 'tuition_student'>('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState({ visible: false, title: '', message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [choiceModal, setChoiceModal] = useState({ visible: false, title: '', message: '', options: [] as { label: string; type?: 'primary' | 'destructive'; onPress?: () => void }[], iconName: '', accentColor: '' });
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
    <TuitionUserCard
      user={item}
      getRoleIcon={getRoleIcon}
      onStatusToggle={handleToggleStatus}
      onDelete={handleDeleteUserPress}
      onEdit={(u: User) => setEditingUser(u)}
      isSelecting={isSelecting}
      isSelected={selectedIds.has(item.id)}
      onToggleSelect={toggleSelect}
    />
  ), [getRoleIcon, handleToggleStatus, handleDeleteUserPress, isSelecting, selectedIds, toggleSelect]);

  const statCards: { key: 'tuition_teacher' | 'tuition_student'; label: string; icon: string; color: string; count: number }[] = [
    { key: 'tuition_teacher', label: 'Teachers', icon: 'account-tie-outline', color: teacherColor, count: stats.teachers },
    { key: 'tuition_student', label: 'Students', icon: 'school-outline', color: studentColor, count: stats.students },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <StatusBar backgroundColor="#F7F9F6" barStyle="dark-content" />

      <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => { if (isSelecting) { setIsSelecting(false); setSelectedIds(new Set()); } else { navigation.goBack(); } }} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name={isSelecting ? 'close' : 'arrow-left'} size={22} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Tuition</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Manage Users</Text>
          </View>
          <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={TEAM_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
          </View>
        </View>

        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
          {user?.role === 'master_admin' && (
            <View style={{ flex: 1 }}>
              <GlassDropdown selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} icon={TEAM_ICON} />
            </View>
          )}
          <View style={{ flexDirection: 'row', marginLeft: user?.role === 'master_admin' ? 10 : 0 }}>
            {isSelecting && selectedIds.size > 0 && (
              <TouchableOpacity onPress={handleBulkDelete} activeOpacity={0.85} style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FFFFFF" />
                <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#EF4444' }}>{selectedIds.size}</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => { setShowSearch(prev => { if (prev) setSearch(''); return !prev; }); }} activeOpacity={0.8} style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <MaterialCommunityIcons name={showSearch ? 'close' : 'magnify'} size={24} color={showSearch ? AMBER_DARK : TEXT_MUTED} />
            </TouchableOpacity>
            {!isSelecting && (
              <TouchableOpacity onPress={() => { setIsSelecting(true); setSelectedIds(new Set()); }} activeOpacity={0.8} style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <MaterialCommunityIcons name="checkbox-multiple-marked-outline" size={24} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
            {!isSelecting && (
              <TouchableOpacity onPress={() => { setShowAddForm(true); }} activeOpacity={0.85} style={{ width: 56, height: 56, borderRadius: 18, overflow: 'hidden' }}>
                <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="account-plus" size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

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

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          {statCards.map(card => (
            <TouchableOpacity key={card.key} onPress={() => setFilter(prev => prev === card.key ? 'all' : card.key)} activeOpacity={0.85}
              style={{
                flex: 1, borderRadius: BORDER_RADIUS, padding: 16,
                backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1,
                borderColor: filter === card.key ? card.color + '66' : 'rgba(255,255,255,0.6)',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: card.color + '1F', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name={card.icon as any} size={20} color={card.color} />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: card.color }}>{card.count}</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: TEXT_SECONDARY, marginTop: 8 }}>{card.label}</Text>
              <Text style={{ fontSize: 9, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>Active</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={displayedUsers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, marginTop: 24 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AMBER}
            colors={[AMBER]}
            progressBackgroundColor="#FFFFFF"
          />
        }
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', flex: 1, color: TEXT_PRIMARY }}>
              {search ? `"${search}"` : filter === 'all' ? 'All Tuition Users' : filter === 'tuition_teacher' ? 'Tuition Teachers' : 'Tuition Students'}
              <Text style={{ color: TEXT_MUTED, fontSize: 13 }}> ({displayedUsers.length})</Text>
            </Text>
            {(filter !== 'all' || search !== '') && (
              <TouchableOpacity onPress={() => { setFilter('all'); setSearch(''); }}
                style={{
                  backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
                  flexDirection: 'row', alignItems: 'center',
                }}>
                <MaterialCommunityIcons name="refresh" size={12} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 }}>CLEAR</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <Image source={TEAM_ICON} style={{ width: 80, height: 80, opacity: 0.25 }} resizeMode="contain" />
            <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED, marginTop: 16 }}>
              No tuition users found
            </Text>
          </View>
        }
      />

      <View style={{
        position: 'absolute', bottom: Math.max(insets.bottom, 10) + 4,
        left: 20, right: 20, zIndex: 11,
        borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.92)',
        padding: 6, flexDirection: 'row', gap: 6,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
        elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15, shadowRadius: 16,
      }}>
        {(['all', 'tuition_teacher', 'tuition_student'] as const).map(tab => (
          <TouchableOpacity key={tab} onPress={() => setFilter(tab)}
            style={{
              flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center', overflow: 'hidden',
            }}>
            <LinearGradient
              colors={filter === tab ? ['#F59E0B', '#D97706'] : ['transparent', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ ...StyleSheet.absoluteFillObject }}
            />
            <MaterialCommunityIcons
              name={tab === 'all' ? 'account-group-outline' : tab === 'tuition_teacher' ? 'account-tie-outline' : 'school-outline'}
              size={18} color={filter === tab ? '#FFFFFF' : TEXT_MUTED} />
            <Text style={{
              fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1,
              color: filter === tab ? '#FFFFFF' : TEXT_MUTED, marginTop: 2,
            }}>
              {tab === 'all' ? 'ALL' : tab === 'tuition_teacher' ? 'TEACHERS' : 'STUDENTS'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <StatusPopup
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />

      <ChoicePopup
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
        isEdit={false}
      />

      {editingUser && (
        <TuitionFormModal
          visible={!!editingUser}
          onClose={closeEdit}
          onSubmit={handleEditSubmit}
          isSubmitting={isSubmitting}
          initialData={editingUser}
          isEdit
        />
      )}
    </View>
  );
}
