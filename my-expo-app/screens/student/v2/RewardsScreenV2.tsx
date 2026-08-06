import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';
const BORDER_RADIUS = 28;

const GLASS_CARD = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
  borderRadius: 22,
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

export default function RewardsScreenV2({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const totalPoints = 850;
  const level = 5;
  const nextLevelPoints = 1000;
  const progressPercentage = (totalPoints / nextLevelPoints) * 100;

  const achievements = [
    { id: '1', title: 'Perfect Week', icon: 'star-circle', color: '#FFD700', earned: true, points: 100 },
    { id: '2', title: 'Homework Hero', icon: 'book-check', color: '#10B981', earned: true, points: 50 },
    { id: '3', title: 'Attendance Star', icon: 'calendar-star', color: '#3B82F6', earned: true, points: 75 },
    { id: '4', title: 'Good Behavior', icon: 'emoticon-happy', color: '#F59E0B', earned: true, points: 50 },
    { id: '5', title: 'Art Master', icon: 'palette', color: '#EC4899', earned: false, points: 100 },
    { id: '6', title: 'Sports Champion', icon: 'trophy', color: '#F59E0B', earned: false, points: 100 },
  ];

  const recentRewards = [
    { id: '1', title: 'Completed all homework', points: 50, date: 'Today', icon: 'check-circle' },
    { id: '2', title: 'Perfect attendance this week', points: 75, date: 'Yesterday', icon: 'calendar-check' },
    { id: '3', title: 'Helped a classmate', points: 25, date: '2 days ago', icon: 'hand-heart' },
  ];

  const prizes = [
    { id: '1', title: 'Extra Playtime', points: 200, icon: 'run', color: '#10B981', available: true },
    { id: '2', title: 'Sticker Pack', points: 150, icon: 'sticker-emoji', color: '#F59E0B', available: true },
    { id: '3', title: 'Homework Pass', points: 500, icon: 'book-off', color: '#F59E0B', available: true },
    { id: '4', title: 'Special Lunch', points: 300, icon: 'food', color: '#EC4899', available: false },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <View style={{ paddingTop: Math.max(insets.top, 20) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={{
                backgroundColor: 'rgba(255,255,255,0.92)',
                width: 50, height: 50, borderRadius: 16,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="trophy-award" size={26} color={ACCENT} />
            </View>
          </View>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>My Rewards</Text>
            <Text style={{ color: '#DB2777', fontSize: 14, fontWeight: '800' }}>Achievements & Prizes 🏆</Text>
          </View>

          <View style={[GLASS_CARD, { padding: 20, marginBottom: 24 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Image source={require('../../../assets/icons/wallet.png')} style={{ width: 18, height: 18 }} resizeMode="contain" />
                  <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 6 }}>
                    Total Points
                  </Text>
                </View>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 52, fontWeight: '800', letterSpacing: -1 }}>{totalPoints}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <LinearGradient
                  colors={['#FBBF24', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900' }}>{level}</Text>
                </LinearGradient>
                <Text style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 6 }}>Level</Text>
              </View>
            </View>

            <View style={{ marginTop: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Next Level Progress
                </Text>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 11, fontWeight: '800' }}>{totalPoints}/{nextLevelPoints}</Text>
              </View>
              <View style={{ height: 10, backgroundColor: 'rgba(247,249,246,0.95)', borderRadius: 5, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#A855F7', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: `${progressPercentage}%`, height: '100%', borderRadius: 5 }}
                />
              </View>
            </View>
          </View>

          <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 16 }}>Achievements</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[GLASS_CARD, { width: '48%', padding: 16, marginBottom: 14, opacity: achievement.earned ? 1 : 0.5 }]}
              >
                <View
                  style={{
                    backgroundColor: achievement.earned ? 'rgba(245,158,11,0.15)' : 'rgba(154,169,163,0.15)',
                    width: 52, height: 52, borderRadius: 26,
                    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                  }}
                >
                  <MaterialCommunityIcons
                    name={achievement.icon as any}
                    size={26}
                    color={achievement.earned ? achievement.color : '#9CA3AF'}
                  />
                </View>
                <Text numberOfLines={1} style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: '800' }}>{achievement.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
                  <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', marginLeft: 4 }}>{achievement.points} pts</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginTop: 10, marginBottom: 16 }}>Recent Rewards</Text>
          {recentRewards.map((reward) => (
            <View
              key={reward.id}
              style={[GLASS_CARD, { padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ backgroundColor: 'rgba(16,185,129,0.15)', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name={reward.icon as any} size={22} color="#10B981" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: TEXT_PRIMARY, fontSize: 15, fontWeight: '700' }}>{reward.title}</Text>
                  <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '600', marginTop: 2 }}>{reward.date}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 }}>
                <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '900' }}>+{reward.points}</Text>
              </View>
            </View>
          ))}

          <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginTop: 16, marginBottom: 16 }}>Prize Shop 🎁</Text>
          {prizes.map((prize) => (
            <TouchableOpacity
              key={prize.id}
              activeOpacity={0.7}
              disabled={!prize.available}
              style={[GLASS_CARD, { padding: 18, marginBottom: 12, opacity: prize.available ? 1 : 0.5 }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ backgroundColor: prize.color + '20', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name={prize.icon as any} size={26} color={prize.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' }}>{prize.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
                      <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', marginLeft: 4 }}>{prize.points} points</Text>
                    </View>
                  </View>
                </View>
                {prize.available ? (
                  <View style={{ backgroundColor: ACCENT, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>Redeem</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: 'rgba(154,169,163,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>Locked</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
