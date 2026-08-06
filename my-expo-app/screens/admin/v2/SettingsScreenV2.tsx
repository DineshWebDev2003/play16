import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, TextInput, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface SettingsScreenProps {
  navigation: NavigationProps;
}

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';
const BORDER_RADIUS = 22;

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

export default function SettingsScreenV2({ navigation }: SettingsScreenProps) {
  const { user, updateNotificationSettings, updateBranchSettings, branches } = useAuth() as any;
  const insets = useSafeAreaInsets();

  const [emailAlerts, setEmailAlerts] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  const pushEnabled = user?.notification_settings?.enabled ?? true;

  const isAdminOrMaster = user?.role === 'admin';

  const currentBranch = branches?.find((b: any) => b.id === user?.branch_id);

  const [correspondentPhone, setCorrespondentPhone] = useState('');
  const [schoolOfficePhone, setSchoolOfficePhone] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    if (currentBranch?.settings) {
      setCorrespondentPhone(currentBranch.settings.correspondent_phone || '');
      setSchoolOfficePhone(currentBranch.settings.school_office_phone || '');
    }
  }, [currentBranch]);

  const handlePushToggle = async () => {
    const newSettings = {
      ...user?.notification_settings,
      enabled: !pushEnabled
    };
    await updateNotificationSettings(newSettings);
  };

  const handleSaveContactSettings = async () => {
    if (!currentBranch) {
      Alert.alert('Error', 'No branch associated with your account.');
      return;
    }
    setSavingContact(true);
    const result = await updateBranchSettings(currentBranch.id, {
      correspondent_phone: correspondentPhone.trim(),
      school_office_phone: schoolOfficePhone.trim(),
    });
    setSavingContact(false);
    if (result) {
      Alert.alert('Saved', 'Contact numbers updated successfully.');
    } else {
      Alert.alert('Error', 'Failed to save contact numbers.');
    }
  };

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        {
          id: 'pushNotifications',
          icon: 'bell',
          label: 'Push Notifications',
          value: pushEnabled,
          onToggle: handlePushToggle,
        },
        {
          id: 'emailAlerts',
          icon: 'email',
          label: 'Email Alerts',
          value: emailAlerts,
          onToggle: () => setEmailAlerts(!emailAlerts),
        },
      ],
    },
    {
      title: 'Data Management',
      items: [
        {
          id: 'autoBackup',
          icon: 'backup-restore',
          label: 'Auto Backup',
          value: autoBackup,
          onToggle: () => setAutoBackup(!autoBackup),
        },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20 }}>
          {/* ── Header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ backgroundColor: 'rgba(255,255,255,0.92)', width: 50, height: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
              </TouchableOpacity>
              <Text style={{ fontSize: 26, fontWeight: '700', letterSpacing: -0.5, color: TEXT_PRIMARY }}>System</Text>
              <Text style={{ fontSize: 20, fontWeight: '600', color: '#DB2777', marginTop: 2 }}>Settings ⚙️</Text>
              <View style={{ backgroundColor: 'rgba(219,39,119,0.12)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, marginTop: 10 }}>
                <Text style={{ color: '#DB2777', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Configurations</Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="cog-outline" size={42} color={ACCENT} />
            </View>
          </View>

          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_SECONDARY, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 }}>
                {section.title}
              </Text>

              <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: BORDER_RADIUS, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', overflow: 'hidden' }}>
                {section.items.map((item, itemIndex) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
                      borderBottomWidth: itemIndex !== section.items.length - 1 ? 1 : 0,
                      borderBottomColor: 'rgba(247,249,246,1)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', padding: 12, borderRadius: 16, marginRight: 14 }}>
                        <MaterialCommunityIcons name={item.icon as any} size={22} color={ACCENT} />
                      </View>
                      <Text style={{ fontWeight: '700', color: TEXT_PRIMARY, fontSize: 15 }}>{item.label}</Text>
                    </View>
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#D1D5DB', true: '#F59E0B' }}
                      thumbColor={item.value ? '#FFFFFF' : '#F3F4F6'}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}

          {isAdminOrMaster && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_SECONDARY, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 }}>
                Contact Numbers ☎️
              </Text>

              <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: BORDER_RADIUS, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 16 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: TEXT_SECONDARY, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Correspondent Phone
                  </Text>
                  <TextInput
                    value={correspondentPhone}
                    onChangeText={setCorrespondentPhone}
                    placeholder="Enter correspondent phone number"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="phone-pad"
                    style={{ backgroundColor: 'rgba(247,249,246,0.9)', color: TEXT_PRIMARY, padding: 16, borderRadius: 14, fontWeight: '700', fontSize: 15 }}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: TEXT_SECONDARY, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    School Office Phone
                  </Text>
                  <TextInput
                    value={schoolOfficePhone}
                    onChangeText={setSchoolOfficePhone}
                    placeholder="Enter school office phone number"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="phone-pad"
                    style={{ backgroundColor: 'rgba(247,249,246,0.9)', color: TEXT_PRIMARY, padding: 16, borderRadius: 14, fontWeight: '700', fontSize: 15 }}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSaveContactSettings}
                  disabled={savingContact}
                  style={{ backgroundColor: ACCENT, padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                  activeOpacity={0.7}
                >
                  {savingContact ? (
                    <ActivityIndicator color="#92400E" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="content-save" size={20} color="#92400E" />
                      <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 15, marginLeft: 8 }}>Save Contact Numbers</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_SECONDARY, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 }}>
              About
            </Text>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: BORDER_RADIUS, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: TEXT_SECONDARY, fontWeight: '700' }}>Version</Text>
                <Text style={{ color: TEXT_PRIMARY, fontWeight: '800' }}>1.0.0</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: TEXT_SECONDARY, fontWeight: '700' }}>School Name</Text>
                <Text style={{ color: TEXT_PRIMARY, fontWeight: '800' }}>TN HappyKids</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: TEXT_SECONDARY, fontWeight: '700' }}>License</Text>
                <Text style={{ color: TEXT_PRIMARY, fontWeight: '800' }}>Premium</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => Alert.alert('Coming Soon', 'Help & Support is coming soon! ✨')}
            style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: BORDER_RADIUS, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(59,130,246,0.12)', padding: 12, borderRadius: 16, marginRight: 14 }}>
                <MaterialCommunityIcons name="help-circle" size={22} color="#3B82F6" />
              </View>
              <Text style={{ fontWeight: '700', color: TEXT_PRIMARY, fontSize: 15 }}>Help & Support</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={TEXT_MUTED} />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}
