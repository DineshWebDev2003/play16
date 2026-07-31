import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 14, fontWeight: '700', color: '#111827',
    backgroundColor: '#F9FAFB', borderColor: '#E5E7EB',
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-6">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 rounded-[14px] bg-gray-100 items-center justify-center">
              <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
            </TouchableOpacity>
            <View style={{ backgroundColor: '#CFFAFE' }} className="rounded-full px-3 py-1">
              <Text className="text-[9px] font-black uppercase tracking-[2px] text-cyan-700">Nanny Profile</Text>
            </View>
            <TouchableOpacity onPress={() => setShowLogoutModal(true)} className="w-12 h-12 rounded-[14px] bg-red-50 items-center justify-center">
              <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <Text className="text-3xl font-black tracking-tighter text-gray-900">My</Text>
          <Text className="text-xl font-black text-cyan-500 mt-[-4px]">Account</Text>

          {/* Avatar */}
          <View className="items-center mt-6">
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85} style={{ backgroundColor: '#06B6D4' }} className="w-28 h-28 rounded-[32px] items-center justify-center border-4 border-white shadow-xl overflow-hidden">
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name="baby-face-outline" size={52} color="white" />
              )}
              <View className="absolute -bottom-1 -right-1 bg-cyan-600 p-2 rounded-xl">
                <MaterialCommunityIcons name="camera" size={14} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-3">Tap to change photo</Text>
          </View>

          {/* Info card */}
          <View style={{ backgroundColor: '#06B6D4' }} className="rounded-[24px] p-5 mt-6">
            <View className="flex-row items-center">
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="w-12 h-12 rounded-2xl items-center justify-center mr-4">
                <MaterialCommunityIcons name="account-badge-outline" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-black">{user?.name}</Text>
                <Text className="text-white/70 text-xs font-bold mt-0.5">@{user?.username}</Text>
              </View>
            </View>
          </View>

          {/* Edit form */}
          <Text className="text-[9px] font-black uppercase tracking-[3px] text-gray-500 mt-8 mb-4">Edit Details</Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', padding: 18 }}>
            <Text className="text-[9px] font-black uppercase tracking-[2px] text-gray-400 mb-2">Name</Text>
            <TextInput style={inputStyle} placeholder="Your name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />

            <Text className="text-[9px] font-black uppercase tracking-[2px] text-gray-400 mb-2 mt-5">Email / Gmail</Text>
            <TextInput style={inputStyle} placeholder="email@example.com" placeholderTextColor="#9CA3AF" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />

            <Text className="text-[9px] font-black uppercase tracking-[2px] text-gray-400 mb-2 mt-5">New Password</Text>
            <TextInput style={inputStyle} placeholder="Leave blank to keep current" placeholderTextColor="#9CA3AF" secureTextEntry value={password} onChangeText={setPassword} />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={saving}
              onPress={handleSave}
              style={{ backgroundColor: saving ? '#67E8F9' : '#06B6D4' }}
              className="mt-6 rounded-2xl py-4 items-center flex-row justify-center"
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save-outline" size={20} color="white" />
                  <Text className="text-white font-black text-sm ml-2">Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowLogoutModal(true)}
            style={{ backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA' }}
            className="mt-6 rounded-2xl py-4 items-center flex-row justify-center"
          >
            <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
            <Text className="text-red-600 font-black text-sm ml-2">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <LogoutModal visible={showLogoutModal} onConfirm={logout} onCancel={() => setShowLogoutModal(false)} />
    </KeyboardAvoidingView>
  );
}
