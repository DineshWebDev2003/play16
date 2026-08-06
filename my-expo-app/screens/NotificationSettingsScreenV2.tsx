import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Switch, ActivityIndicator, Alert, Image, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const TEXT_SECONDARY = '#4A5B53';
const BORDER_RADIUS = 28;
const GRID_RADIUS = 22;

const BELL_ICON = require('../assets/icons/bell (1).png');
const WALLET_ICON = require('../assets/icons/wallet.png');
const CALENDAR_ICON = require('../assets/icons/calendar.png');
const PLAYER_ICON = require('../assets/icons/player.png');

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

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

interface NotificationSettings {
  enabled: boolean;
  payment: boolean;
  attendance: boolean;
  activity: boolean;
}

export default function NotificationSettingsScreenV2({ navigation }: Props) {
  const { user, updateNotificationSettings } = useAuth();
  const insets = useSafeAreaInsets();
  const btnScale = useRef(new Animated.Value(1)).current;

  const defaultSettings = {
    enabled: true,
    payment: true,
    attendance: true,
    activity: true,
  };

  const [settings, setSettings] = useState<NotificationSettings>({
    ...defaultSettings,
    ...user?.notification_settings
  });
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (user?.notification_settings) {
      setSettings(prev => ({
        ...prev,
        ...user.notification_settings
      }));
    }
  }, [user?.notification_settings]);

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePressIn = () => {
    Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateNotificationSettings(settings);
      if (success) {
        Alert.alert('Saved', 'Your notification preferences have been updated.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const SettingItem = ({ icon, title, subtitle, value, onToggle, disabled = false }: any) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 16, borderRadius: GRID_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', opacity: disabled ? 0.4 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: 'rgba(245,158,11,0.12)' }}>
          <Image source={icon} style={{ width: 36, height: 36 }} resizeMode="contain" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 }}>{title}</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#CBD5E1', true: '#F59E0B' }}
        thumbColor="#FFF"
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      {/* ── Aurora Glass background ── */}
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

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20 }}>
          {/* ── Compact back-button header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Preferences</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>Alert Centre</Text>
            </View>
          </View>

          <View style={{ height: 28 }} />

          {/* Master Control Card */}
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => toggleSetting('enabled')}
            style={{ marginBottom: 28 }}
          >
            <View style={{ padding: 22, borderRadius: BORDER_RADIUS, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: settings.enabled ? 'rgba(245,158,11,0.14)' : 'rgba(247,249,246,0.9)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Image source={BELL_ICON} style={{ width: 44, height: 44 }} resizeMode="contain" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 }}>All Signals</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_SECONDARY, marginTop: 4 }}>
                      {settings.enabled ? 'Push notifications active' : 'Quiet mode enabled'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.enabled}
                  onValueChange={() => toggleSetting('enabled')}
                  trackColor={{ false: '#CBD5E1', true: '#F59E0B' }}
                  thumbColor="#FFF"
                  style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                />
              </View>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 }}>
            <MaterialCommunityIcons name="tune-variant" size={14} color="#9CA3AF" />
            <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: TEXT_MUTED, marginLeft: 8 }}>Custom Channels</Text>
          </View>

          <SettingItem
            icon={WALLET_ICON}
            title="School Fees"
            subtitle="Receipts and payment reminders"
            value={settings.payment}
            onToggle={() => toggleSetting('payment')}
            disabled={!settings.enabled}
          />

          <SettingItem
            icon={CALENDAR_ICON}
            title="Attendance"
            subtitle="Daily arrival and departure logs"
            value={settings.attendance}
            onToggle={() => toggleSetting('attendance')}
            disabled={!settings.enabled}
          />

          <SettingItem
            icon={PLAYER_ICON}
            title="Activity Feed"
            subtitle="New photos, likes and comments"
            value={settings.activity}
            onToggle={() => toggleSetting('activity')}
            disabled={!settings.enabled}
          />

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={{ marginTop: 24, marginBottom: 24, backgroundColor: '#F59E0B', paddingVertical: 20, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 }}
              activeOpacity={0.8}
              onPress={handleSave}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="check-decagram" size={22} color="white" />
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', marginLeft: 8, letterSpacing: -0.3 }}>Save Preferences</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── Bottom spacer 40 ── */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}
