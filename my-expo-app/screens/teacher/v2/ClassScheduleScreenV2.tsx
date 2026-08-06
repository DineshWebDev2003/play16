import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
const BORDER_RADIUS = 22;

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

export default function ClassScheduleScreenV2({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const schedule = [
    { id: '1', time: '08:00 - 09:00', class: '10-A', subject: 'Mathematics', room: 'Room 101' },
    { id: '2', time: '09:00 - 10:00', class: '10-B', subject: 'Mathematics', room: 'Room 102' },
    { id: '3', time: '10:30 - 11:30', class: '9-A', subject: 'Algebra', room: 'Room 101' },
    { id: '4', time: '11:30 - 12:30', class: '9-B', subject: 'Algebra', room: 'Room 102' },
    { id: '5', time: '14:00 - 15:00', class: '8-A', subject: 'Basic Math', room: 'Room 103' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              width: 50, height: 50, borderRadius: 16,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <View style={{ backgroundColor: 'rgba(236,72,153,0.12)', width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('../../../assets/icons/education.png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>Class Schedule</Text>
            <Text style={{ color: '#DB2777', fontSize: 14, fontWeight: '800' }}>Today's Classes 📅</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={false} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: '600', letterSpacing: -0.3 }}>Today's Classes</Text>
          <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
            <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>5 Periods</Text>
          </View>
        </View>

        {schedule.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.6)',
              borderRadius: BORDER_RADIUS,
              padding: 18,
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ backgroundColor: 'rgba(236,72,153,0.12)', width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Image source={require('../../../assets/icons/maths.png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700', letterSpacing: -0.4 }}>{item.subject}</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>Class {item.class}</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 }}>
                <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '900' }}>{item.time}</Text>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: 'rgba(247,249,246,0.9)', marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(74,91,83,0.1)', width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                  <MaterialCommunityIcons name="map-marker" size={14} color={TEXT_SECONDARY} />
                </View>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: '600' }}>{item.room}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={TEXT_MUTED} style={{ marginRight: 5 }} />
                <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '700' }}>{item.time}</Text>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}
