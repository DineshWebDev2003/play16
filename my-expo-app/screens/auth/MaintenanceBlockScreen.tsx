import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  maintenanceMessage?: string;
  onLogout?: () => void;
}

export default function MaintenanceBlockScreen({ maintenanceMessage, onLogout }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const bg = isDark ? '#1c1c14' : '#F8F6F0';
  const cardBg = isDark ? '#2d2d24' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{
          width: '100%',
          backgroundColor: cardBg,
          borderRadius: 24,
          padding: 28,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: isDark ? '#333' : '#E5E7EB',
          elevation: 4,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
        }}>
          <Image
            source={require('../../assets/images/maintance.gif')}
            style={{ width: 120, height: 120, marginBottom: 12, resizeMode: 'contain' }}
          />

          <Text style={{ fontSize: 22, fontWeight: '900', color: textPrimary, textAlign: 'center' }}>
            Under Maintenance
          </Text>

          <Text style={{
            fontSize: 12, fontWeight: '700', color: '#F59E0B',
            textAlign: 'center', marginTop: 6, letterSpacing: 0.5,
          }}>
            App Version {appVersion}
          </Text>

          <Text style={{
            fontSize: 13, fontWeight: '600', color: textSecondary,
            textAlign: 'center', marginTop: 12, lineHeight: 20,
          }}>
            Our team is working to improve things. Please check back in a little while.
          </Text>

          {maintenanceMessage ? (
            <View style={{
              marginTop: 16, padding: 14, borderRadius: 14, width: '100%',
              backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#B45309', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Message from admin
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400E', lineHeight: 19 }}>
                {maintenanceMessage}
              </Text>
            </View>
          ) : null}

          <View style={{
            marginTop: 20, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
            backgroundColor: isDark ? '#262626' : '#F3F4F6',
            flexDirection: 'row', alignItems: 'center',
          }}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: textSecondary }}>
              You will be able to log in once maintenance is complete.
            </Text>
          </View>

          {onLogout ? (
            <TouchableOpacity
              onPress={onLogout}
              activeOpacity={0.85}
              style={{
                marginTop: 20, height: 48, borderRadius: 14, width: '100%',
                backgroundColor: '#E11D48',
                alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
              }}
            >
              <MaterialCommunityIcons name="logout" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>
                LOG OUT
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
