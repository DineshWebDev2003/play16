import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

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

export default function AttendanceSelectionScreenV2({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const options = [
    {
      label: 'Student Attendance',
      screen: 'takeAttendance',
      icon: require('../../../assets/icons/student.png'),
      color: '#3B82F6',
      desc: 'Mark & manage student attendance records',
      tag: 'Kids',
    },
    {
      label: 'Staff Attendance',
      screen: 'teacherAttendanceReport',
      icon: require('../../../assets/icons/teacher.png'),
      color: '#EC4899',
      desc: 'View teacher & staff attendance logs',
      tag: 'Staff',
    },
  ];

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

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: Math.max(insets.top, 56), paddingBottom: 8 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2D28' }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: '#7A8A82' }}>
                {user?.role === 'master_admin' ? 'All Admin Access' : 'Admin Access'}
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#1F2D28', marginTop: 2, letterSpacing: -0.5 }}>Attendance</Text>
            </View>
            <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={require('../../../assets/icons/exam-results.png')} style={{ width: 46, height: 46 }} resizeMode="contain" />
            </View>
          </View>

          <View style={{ height: 28 }} />

          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2D28' }}>Choose a type</Text>
          <Text style={{ fontSize: 12, fontWeight: '400', color: '#7A8A82', marginTop: 4 }}>
            Select which attendance you want to manage
          </Text>

          <View style={{ height: 18 }} />

          {options.map((item) => {
            const tintBg = item.color + '1F';
            return (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.85}
                onPress={() => navigation.navigate(item.screen)}
                style={{ marginBottom: 16, borderRadius: BORDER_RADIUS, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 16 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 84, height: 84, borderRadius: 18, backgroundColor: tintBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Image source={item.icon} style={{ width: 64, height: 64 }} resizeMode="contain" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: '#1F2D28' }}>{item.label}</Text>
                      <View style={{ backgroundColor: tintBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginLeft: 6 }}>
                        <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: item.color }}>{item.tag}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#7A8A82', marginTop: 6, lineHeight: 16 }}>{item.desc}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: item.color, letterSpacing: 0.3 }}>Open</Text>
                      <Text style={{ fontSize: 14, color: item.color, marginLeft: 4 }}>→</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}
