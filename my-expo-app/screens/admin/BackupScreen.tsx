import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get API base URL from the axios instance
const BASE_URL = api.defaults.baseURL || 'https://play1.tnhappykids.in/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface BackupScreenProps {
  navigation: NavigationProps;
}

export default function BackupScreen({ navigation }: BackupScreenProps) {
  const { colors, theme } = useTheme();
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
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (downloadRes.status === 200) {
        await Sharing.shareAsync(downloadRes.uri);
        Alert.alert('Success', 'Backup file generated and ready to save! 📂');
      } else {
        throw new Error('Failed to download backup');
      }
    } catch (error) {
      console.error(error);
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
        'Warning: This will overwrite ALL current school data with the backup file. Are you sure? ⚠️',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore Now',
            style: 'destructive',
            onPress: () => processImport(result.assets[0])
          }
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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        Alert.alert('Success', 'System restored successfully! The app will now reload. 🔄', [
          { text: 'OK', onPress: () => navigation.navigate('login') }
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to restore backup. Ensure it is a valid school backup file.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View className={`flex-1 ${colors.background}`}>
      {/* Consistent Header */}
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border}`}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Data</Text>
            <Text className="text-2xl font-bold text-brand-pink">Vault 🔐</Text>
          </View>
          <View className="bg-brand-yellow w-16 h-16 rounded-3xl items-center justify-center shadow-lg border-2 border-white rotate-3">
            <MaterialCommunityIcons name="shield-lock" size={32} color="#92400E" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Backup Action Card */}
        <View className={`${colors.surface} rounded-[32px] p-8 mb-6 border ${colors.border} shadow-xl`}>
          <View className="items-center mb-6">
            <View className="bg-brand-yellow/10 w-24 h-24 rounded-full items-center justify-center mb-4 border border-brand-yellow/30">
              <MaterialCommunityIcons name="cloud-download" size={50} color="#B45309" />
            </View>
            <Text className={`text-2xl font-black ${colors.text} mb-2`}>Backup Center</Text>
            <Text className={`text-sm ${colors.textSecondary} text-center leading-5`}>
              Export all student profiles, activity media, and financial records into a single secure file.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleBackup}
            disabled={isBackingUp || isRestoring}
            className={`${isBackingUp ? 'bg-gray-400' : 'bg-brand-yellow'} py-6 rounded-[28px] items-center shadow-lg shadow-amber-500/30 active:scale-95`}
          >
            <View className="flex-row items-center">
              {isBackingUp ? (
                <ActivityIndicator color="#92400E" />
              ) : (
                <>
                  <MaterialCommunityIcons name="download-circle" size={26} color="#92400E" />
                  <Text className="text-amber-900 font-black text-xl ml-3">Export All Data</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Restore Section */}
        <View className={`${colors.surface} rounded-[32px] p-8 mb-6 border ${colors.border} shadow-xl border-dashed`}>
          <View className="flex-row items-center mb-6">
            <View className="bg-brand-pink/10 p-4 rounded-2xl mr-4">
              <MaterialCommunityIcons name="upload-network" size={32} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className={`text-xl font-black ${colors.text}`}>Restore System</Text>
              <Text className={`text-xs ${colors.textSecondary}`}>Import a previous backup file</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleImport}
            disabled={isBackingUp || isRestoring}
            className={`${isRestoring ? 'bg-gray-400' : 'bg-brand-pink'} py-6 rounded-[28px] items-center shadow-lg shadow-pink-500/30 active:scale-95`}
          >
            <View className="flex-row items-center">
              {isRestoring ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="restore" size={26} color="white" />
                  <Text className="text-white font-black text-xl ml-3">Import Backup</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Security Warning */}
        <View className="bg-red-50 p-6 rounded-[24px] border border-red-100 mb-10 flex-row">
            <MaterialCommunityIcons name="alert-decagram" size={24} color="#EF4444" className="mr-3" />
            <View className="flex-1">
                <Text className="text-red-900 font-bold mb-1 uppercase text-[10px] tracking-widest">Security Advisory</Text>
                <Text className="text-red-700 text-xs leading-4">
                    Backup files contain sensitive student data. Store them in a secure physical location or encrypted drive.
                </Text>
            </View>
        </View>

        <View className="h-32" />
      </ScrollView>
    </View>
  );
}
