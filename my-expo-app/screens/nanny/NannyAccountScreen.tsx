import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import LogoutModal from '../../components/LogoutModal';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

export default function NannyAccountScreen({ navigation }: Props) {
  const { user, updateProfile, updateAvatar, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handlePickImage = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera roll access is required to change your photo.');
        return;
      }
      await updateAvatar();
    } catch (err) {
      Alert.alert('Error', 'Could not update photo.');
    }
  }, [updateAvatar]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { name: name.trim() };
      if (email.trim()) payload.email = email.trim();
      if (password) payload.password = password;
      await updateProfile(payload);
      setPassword('');
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }, [name, email, password, updateProfile]);

  const inputStyle: any = {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontWeight: '700', color: '#111827',
    backgroundColor: '#F9FAFB', borderColor: '#E5E7EB',
  };

  const fieldStyle = {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#F3F4F6',
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={{ paddingTop: Math.max(insets.top, 50), paddingHorizontal: 24, paddingBottom: 24 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ backgroundColor: '#F3F4F6', width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#374151" />
          </TouchableOpacity>

          {/* ── Modern Header (matches Home) ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#6B7280' }}>
                TN HAPPYKIDS
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4, color: '#111827' }}>
                {user?.name?.split(' ')[0] || 'Nanny'}
              </Text>
              <View style={{ backgroundColor: '#CFFAFE', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="baby-face-outline" size={12} color="#0891B2" />
                <Text style={{ color: '#0891B2', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 6 }}>Nanny Console</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePickImage}
              style={{ backgroundColor: '#FDE047', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', transform: [{ rotate: '3deg' }], overflow: 'hidden' }}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name="baby-face-outline" size={36} color="#92400E" />
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#7C3AED', padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <MaterialCommunityIcons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Profile Hero Card (cyan gradient) ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ borderRadius: 16, overflow: 'hidden', elevation: 15 }}>
              <LinearGradient
                colors={['#06B6D4', '#0891B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <MaterialCommunityIcons name="account-badge-outline" size={20} color="white" />
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>Nanny Profile</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>Childcare Staff</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="shield-check" size={11} color="white" />
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginLeft: 4 }}>On Duty</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
                  <Text style={{ color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }} numberOfLines={1}>{user?.name || 'Nanny'}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginTop: 3 }}>@{user?.username || 'nanny'}</Text>
                </View>
                <View style={{ position: 'absolute', bottom: -14, right: -14, opacity: 0.1 }}>
                  <MaterialCommunityIcons name="share-variant" size={90} color="white" />
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* ── Edit Details ── */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5, color: '#111827' }}>Edit Details ⚙️</Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                <Text style={{ color: '#8B5CF6', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Account</Text>
              </View>
            </View>

            <View style={fieldStyle}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="account" size={22} color="#F59E0B" />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#6B7280' }}>Name</Text>
              </View>
              <TextInput style={inputStyle} placeholder="Your name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
            </View>

            <View style={[fieldStyle, { marginTop: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="email" size={22} color="#6366F1" />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#6B7280' }}>Email / Gmail</Text>
              </View>
              <TextInput style={inputStyle} placeholder="email@example.com" placeholderTextColor="#9CA3AF" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            </View>

            <View style={[fieldStyle, { marginTop: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialCommunityIcons name="lock" size={22} color="#10B981" />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#6B7280' }}>New Password</Text>
              </View>
              <TextInput style={inputStyle} placeholder="Leave blank to keep current" placeholderTextColor="#9CA3AF" secureTextEntry value={password} onChangeText={setPassword} />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={saving}
              onPress={handleSave}
              style={{ backgroundColor: saving ? '#67E8F9' : '#06B6D4', borderRadius: 16, marginTop: 20, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save-outline" size={20} color="white" />
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Out */}
          <View style={{ paddingVertical: 8 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setShowLogoutModal(true)}
              style={{ borderRadius: 16, overflow: 'hidden', elevation: 15 }}
            >
              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <MaterialCommunityIcons name="power" size={24} color="white" />
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Secure Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 96 }} />
        </View>
      </ScrollView>
      <LogoutModal visible={showLogoutModal} onConfirm={logout} onCancel={() => setShowLogoutModal(false)} />
    </View>
  );
}
