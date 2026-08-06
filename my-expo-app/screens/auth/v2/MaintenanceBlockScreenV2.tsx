import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Image, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';
const BRAND_PINK = '#DB2777';

interface Props {
  maintenanceMessage?: string;
  onLogout: () => void;
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

export default function MaintenanceBlockScreenV2({ maintenanceMessage, onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F9F6" />
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: Math.max(insets.top, 32), paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <View style={{
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.6)',
          borderRadius: 22,
          padding: 28,
          alignItems: 'center',
        }}>
          <Image
            source={require('../../../assets/images/maintance.gif')}
            style={{ width: 120, height: 120, marginBottom: 12, resizeMode: 'contain' }}
          />

          <Text style={{ fontSize: 22, fontWeight: '900', color: TEXT_PRIMARY, textAlign: 'center' }}>
            Under Maintenance
          </Text>

          <View style={{ marginTop: 6, backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: ACCENT, textAlign: 'center', letterSpacing: 0.5 }}>
              App Version {appVersion}
            </Text>
          </View>

          <Text style={{
            fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY,
            textAlign: 'center', marginTop: 12, lineHeight: 20,
          }}>
            Our team is working to improve things. Please check back in a little while.
          </Text>

          {maintenanceMessage ? (
            <View style={{
              marginTop: 16, padding: 14, borderRadius: 14, width: '100%',
              backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
            }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#B45309', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Message from admin
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400E', lineHeight: 19 }}>
                {maintenanceMessage}
              </Text>
            </View>
          ) : null}

          <View style={{
            marginTop: 20, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
            backgroundColor: 'rgba(247,249,246,0.9)',
            flexDirection: 'row', alignItems: 'center',
          }}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={ACCENT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: TEXT_MUTED }}>
              You will be able to log in once maintenance is complete.
            </Text>
          </View>

          <TouchableOpacity
            onPress={onLogout}
            activeOpacity={0.85}
            style={{
              marginTop: 20, height: 48, borderRadius: 14, width: '100%',
              backgroundColor: BRAND_PINK,
              alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
            }}
          >
            <MaterialCommunityIcons name="logout" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>
              LOG OUT
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
