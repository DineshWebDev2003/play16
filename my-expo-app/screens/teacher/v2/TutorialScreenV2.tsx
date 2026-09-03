import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const BORDER_RADIUS = 22;
const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';

const APPS = [
  {
    name: 'Caprics for Schools',
    packageName: 'com.todquest.caprics.school',
    color: '#3B82F6',
    image: require('../../../assets/icons/education.png'),
    storeUrl: 'https://play.google.com/store/apps/details?id=com.todquest.caprics.school&pcampaignid=web_share',
  },
  {
    name: 'Caprics for Students',
    packageName: 'com.todquest.caprics.student',
    color: '#10B981',
    image: require('../../../assets/icons/student.png'),
    storeUrl: 'https://play.google.com/store/apps/details?id=com.todquest.caprics.student&pcampaignid=web_share',
  },
];

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

function AppCard({ app }: { app: typeof APPS[0] }) {
  const tintBg = app.color + '1F';

  const handlePress = async () => {
    try {
      await Linking.openURL(app.storeUrl);
    } catch {
      // fallback to market:// if Linking fails
      try {
        await Linking.openURL(`market://details?id=${app.packageName}`);
      } catch {
        // last resort - do nothing
      }
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={{
        width: '100%',
        marginBottom: 20,
        borderRadius: BORDER_RADIUS,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={[tintBg, 'rgba(255,255,255,0.92)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.8)',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: app.color,
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Image source={app.image} style={{ width: 44, height: 44 }} resizeMode="contain" />
          </View>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: TEXT_PRIMARY }}>
              {app.name}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: app.color + '15',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 100,
              }}>
                <MaterialCommunityIcons name="play" size={14} color={app.color} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: app.color, marginLeft: 4, letterSpacing: 0.5 }}>
                  OPEN PLAY STORE
                </Text>
              </View>
            </View>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={24} color={TEXT_MUTED} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function TutorialScreenV2({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
          {/* ── Header ── */}
          <View style={{ height: 52, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.6)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Learning Room</Text>
              <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2 }}>
                Our Apps
              </Text>
            </View>
          </View>

          <View style={{ height: 16 }} />

          {/* ── App cards ── */}
          {APPS.map((app) => (
            <AppCard key={app.packageName} app={app} />
          ))}

          <View style={{ height: 140 }} />
        </View>
      </ScrollView>
    </View>
  );
}