import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';

const CONTACT_COLORS: Record<string, string> = {
  'bg-blue-500': '#3B82F6',
  'bg-pink-500': '#EC4899',
  'bg-indigo-600': '#4F46E5',
  'bg-yellow-600': '#CA8A04',
};

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

export default function EmergencyContactScreenV2({ navigation }: Props) {
  const { user, branches } = useAuth();
  const insets = useSafeAreaInsets();

  const branch = branches?.find((b: any) => b.id === user?.branch_id) || user?.branch;
  const settings = (branch as any)?.settings || {};

  const emergencyContacts = [
    {
      id: '1',
      name: 'Father',
      relation: 'Parent',
      phone: user?.fatherPhone || '',
      icon: 'account-tie',
      color: 'bg-blue-500',
    },
    {
      id: '2',
      name: 'Mother',
      relation: 'Parent',
      phone: user?.motherPhone || '',
      icon: 'account-heart',
      color: 'bg-pink-500',
    },
    {
      id: 'correspondent',
      name: 'Correspondent',
      relation: 'Management',
      phone: settings.correspondent_phone || '',
      icon: 'account-star',
      color: 'bg-indigo-600',
    },
    {
      id: '3',
      name: 'School Office',
      relation: 'Administration',
      phone: settings.school_office_phone || '',
      icon: 'office-building',
      color: 'bg-yellow-600',
    },
  ];

  const handleCall = (phone: string, name: string) => {
    if (!phone) {
      Alert.alert('Info', `No phone number updated for ${name}.`);
      return;
    }
    Alert.alert(
      'Make Call',
      `Do you want to call ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phone}`);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              width: 50,
              height: 50,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.6)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <View style={{ backgroundColor: '#EF4444', width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="phone-alert" size={26} color="#FFFFFF" />
          </View>
        </View>
        <View>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>Emergency</Text>
          <Text style={{ color: '#DB2777', fontSize: 14, fontWeight: '800' }}>Contacts 🚨</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 18 }}>
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '900', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 2 }}>
            Quick Dial 📞
          </Text>
        </View>

        {emergencyContacts.map((contact) => {
          const accent = CONTACT_COLORS[contact.color] || ACCENT;
          return (
            <TouchableOpacity
              key={contact.id}
              onPress={() => handleCall(contact.phone, contact.name)}
              activeOpacity={0.7}
              style={{
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.6)',
                borderRadius: 22,
                padding: 18,
                marginBottom: 14,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ backgroundColor: accent + '1F', width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <MaterialCommunityIcons name={contact.icon as any} size={26} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginBottom: 2 }}>{contact.name}</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>{contact.relation}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="phone" size={13} color={TEXT_MUTED} />
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: '700', marginLeft: 6 }}>{contact.phone || 'Not updated'}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={TEXT_MUTED} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
