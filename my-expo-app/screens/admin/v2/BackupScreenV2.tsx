import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const BORDER_RADIUS = 22;

const DATABASE_ICON = require('../../../assets/icons/database.png');

const BASE_URL = api.defaults.baseURL || 'https://play1.tnhappykids.in/api';

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

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

export default function BackupScreenV2({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const token = await AsyncStorage.getItem('auth_token');

      const getTodayDateString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      const filename = `school_backup_${getTodayDateString()}.zip`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadRes = await FileSystem.downloadAsync(
        `${BASE_URL}/backup/export`,
        fileUri,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (downloadRes.status === 200) {
        await Sharing.shareAsync(downloadRes.uri);
        Alert.alert('Success', 'Backup file generated and ready to save!');
      } else {
        throw new Error('Failed to download backup');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create backup. Please try again.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      Alert.alert(
        'Restore Data',
        'Warning: This will overwrite ALL current school data with the backup file. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Restore Now', style: 'destructive', onPress: () => processImport(result.assets[0]) },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const processImport = async (file: any) => {
    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append('backup_file', {
        uri: file.uri,
        name: file.name,
        type: 'application/zip',
      } as any);

      const response = await api.post('/backup/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data) {
        Alert.alert('Success', 'System restored successfully! The app will now reload.', [
          { text: 'OK', onPress: () => navigation.navigate('login') },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore backup. Ensure it is a valid school backup file.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ── Header ── */}
        <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>System</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Data Vault</Text>
            </View>
            <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={DATABASE_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
            </View>
          </View>
        </View>

        {/* ── Backup card ── */}
        <View style={{ marginTop: 28, marginHorizontal: 20 }}>
          <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 24, alignItems: 'center' }}>
            <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(245,158,11,0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={DATABASE_ICON} style={{ width: 58, height: 58 }} resizeMode="contain" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 16 }}>Backup Center</Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: TEXT_SECONDARY, textAlign: 'center', marginTop: 6, lineHeight: 19 }}>
              Export all student profiles, activity media, and financial records into a single secure file.
            </Text>

            <TouchableOpacity
              onPress={handleBackup}
              disabled={isBackingUp || isRestoring}
              activeOpacity={0.85}
              style={{ marginTop: 20, alignSelf: 'stretch', height: 56, borderRadius: 18, overflow: 'hidden' }}
            >
              <LinearGradient colors={isBackingUp ? ['#D1D5DB', '#9CA3AF'] : ['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                {isBackingUp ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="download-circle" size={22} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14, marginLeft: 8 }}>Export All Data</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Restore card ── */}
        <View style={{ marginTop: 20, marginHorizontal: 20 }}>
          <View style={{ borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="upload-network" size={26} color="#EF4444" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY }}>Restore System</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>Import a previous backup file</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleImport}
              disabled={isBackingUp || isRestoring}
              activeOpacity={0.85}
              style={{ marginTop: 18, alignSelf: 'stretch', height: 56, borderRadius: 18, overflow: 'hidden' }}
            >
              <LinearGradient colors={isRestoring ? ['#D1D5DB', '#9CA3AF'] : ['#EF4444', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                {isRestoring ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="restore" size={22} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14, marginLeft: 8 }}>Import Backup</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Security warning ── */}
        <View style={{ marginTop: 20, marginHorizontal: 20, borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', padding: 18, flexDirection: 'row', alignItems: 'flex-start' }}>
          <MaterialCommunityIcons name="alert-decagram" size={22} color="#EF4444" style={{ marginRight: 12, marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#DC2626', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 10 }}>Security Advisory</Text>
            <Text style={{ color: '#B91C1C', fontSize: 12, fontWeight: '600', marginTop: 6, lineHeight: 18 }}>
              Backup files contain sensitive student data. Store them in a secure physical location or encrypted drive.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
