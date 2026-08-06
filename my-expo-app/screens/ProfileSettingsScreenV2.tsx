import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, TextInput, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const BORDER_RADIUS = 28;
const SECTION_GAP = 28;

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#10B981';

const ROLE_IMAGE_BY_ROLE: Record<string, any> = {
  master_admin: require('../assets/Avatar/master-admin.png'),
  admin: require('../assets/Avatar/school-admin.png'),
  teacher: require('../assets/Avatar/teacher.png'),
  student: require('../assets/Avatar/kids.png'),
  tuition_teacher: require('../assets/Avatar/tuition-teacher.png'),
  tuition_student: require('../assets/Avatar/tuitio-student.png'),
  nanny: require('../assets/Avatar/Nanny-avatrt.png'),
};

const ROLE_LABEL: Record<string, string> = {
  master_admin: 'Master Admin',
  admin: 'School Admin',
  teacher: 'Teacher',
  student: 'Student',
  tuition_teacher: 'Tuition Teacher',
  tuition_student: 'Tuition Student',
  nanny: 'Nanny',
};

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

// ─── Aurora Glass background ────────────────────────────────────────────────────
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

export default function ProfileSettingsScreenV2({ navigation }: Props) {
  const { user, updateAvatar, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await updateProfile({ name: name.trim() });
      setEditingName(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!email.trim()) return;
    setSavingEmail(true);
    try {
      await updateProfile({ email: email.trim() });
      setEditingEmail(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await updateProfile({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      } as any);
      Alert.alert('Success', 'Password updated successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'rgba(247,249,246,0.9)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '700' as const,
    color: TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  };

  const glassCard = {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: BORDER_RADIUS,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  };

  const role = user?.role || 'admin';
  const avatarSource = user?.avatar ? { uri: user.avatar } : (ROLE_IMAGE_BY_ROLE[role] || ROLE_IMAGE_BY_ROLE.admin);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
          {/* ── Header ── */}
          <View style={{ height: 52, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Account</Text>
              <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2 }}>
                Profile Settings
              </Text>
            </View>
          </View>

          <View style={{ height: SECTION_GAP }} />

          {/* ── Profile hero card ── */}
          <View style={glassCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={updateAvatar}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.92)',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  shadowColor: '#000000',
                  shadowOpacity: 0.1,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <Image source={avatarSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: ACCENT, padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                  <MaterialCommunityIcons name="camera" size={12} color="white" />
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: -0.5 }}>
                  {user?.name || 'User'}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: TEXT_SECONDARY, marginTop: 2 }}>
                  {user?.email || 'Not provided'}
                </Text>
                <View style={{ backgroundColor: 'rgba(16,185,129,0.12)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="shield-check" size={11} color={ACCENT} />
                  <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 5 }}>
                    {ROLE_LABEL[role] || 'User'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: SECTION_GAP }} />

          {/* ── Name ── */}
          <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 16 }}>Identity & Security</Text>

          <View style={glassCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(245, 158, 11, 0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="account" size={22} color="#F59E0B" />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED }}>Full Name</Text>
              </View>
              {!editingName && (
                <TouchableOpacity onPress={() => { setEditingName(true); setName(user?.name || ''); }}>
                  <MaterialCommunityIcons name="pencil" size={18} color="#F59E0B" />
                </TouchableOpacity>
              )}
            </View>
            {editingName ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput value={name} onChangeText={setName} style={{ ...inputStyle, flex: 1, fontSize: 18 }} autoFocus placeholder="Enter name" placeholderTextColor="#9CA3AF" />
                <TouchableOpacity onPress={handleSaveName} disabled={savingName} style={{ backgroundColor: '#F59E0B', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                  {savingName ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="check" size={22} color="white" />}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingName(false); setName(user?.name || ''); }} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
                  <MaterialCommunityIcons name="close" size={22} color={TEXT_PRIMARY} />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 4 }}>{user?.name || 'User'}</Text>
            )}
          </View>

          {/* Email */}
          <View style={[glassCard, { marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(99, 102, 241, 0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="email" size={22} color="#6366F1" />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED }}>Email</Text>
              </View>
              {!editingEmail && (
                <TouchableOpacity onPress={() => { setEditingEmail(true); setEmail(user?.email || ''); }}>
                  <MaterialCommunityIcons name="pencil" size={18} color="#6366F1" />
                </TouchableOpacity>
              )}
            </View>
            {editingEmail ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput value={email} onChangeText={setEmail} style={{ ...inputStyle, flex: 1, fontSize: 16 }} autoFocus placeholder="Enter email" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" />
                <TouchableOpacity onPress={handleSaveEmail} disabled={savingEmail} style={{ backgroundColor: '#6366F1', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                  {savingEmail ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="check" size={22} color="white" />}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingEmail(false); setEmail(user?.email || ''); }} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
                  <MaterialCommunityIcons name="close" size={22} color={TEXT_PRIMARY} />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginTop: 4 }}>{user?.email || 'Not provided'}</Text>
            )}
          </View>

          {/* Password */}
          <View style={[glassCard, { marginTop: 12 }]}>
            <TouchableOpacity onPress={() => setShowPasswordForm(!showPasswordForm)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(16, 185, 129, 0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="lock" size={22} color="#10B981" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY }}>Password</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>Update your login credentials</Text>
                </View>
              </View>
              <MaterialCommunityIcons name={showPasswordForm ? 'chevron-up' : 'chevron-down'} size={22} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            {showPasswordForm && (
              <View style={{ marginTop: 16 }}>
                <TextInput value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current Password" placeholderTextColor="#9CA3AF" secureTextEntry style={{ ...inputStyle, marginBottom: 12 }} />
                <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="New Password" placeholderTextColor="#9CA3AF" secureTextEntry style={{ ...inputStyle, marginBottom: 12 }} />
                <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm New Password" placeholderTextColor="#9CA3AF" secureTextEntry style={{ ...inputStyle, marginBottom: 16 }} />
                <TouchableOpacity onPress={handleChangePassword} disabled={savingPassword} style={{ backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Branch */}
          {user?.branch && (
            <View style={[glassCard, { marginTop: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(245, 158, 11, 0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="domain" size={22} color="#F59E0B" />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED }}>Branch</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginTop: 4 }}>{user.branch.name}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
