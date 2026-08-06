import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, Animated, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const TEXT_SECONDARY = '#4A5B53';
const ACCENT = '#F59E0B';
const PINK = '#DB2777';

interface Slide {
  icon: any;
  title: string;
  subtitle: string;
  color: string;
}

const SLIDES: Slide[] = [
  {
    icon: require('../../../assets/icons/education.png'),
    title: 'Welcome to TN HappyKids',
    subtitle: 'A complete preschool & tuition management app for parents, teachers and administrators — all in one place.',
    color: '#E91E63',
  },
  {
    icon: require('../../../assets/icons/calendar.png'),
    title: 'Track Everything',
    subtitle: 'Live attendance, homework, activities, fees and timetables — every update reaches you instantly.',
    color: '#F59E0B',
  },
  {
    icon: require('../../../assets/icons/lock.png'),
    title: 'Stay Connected & Secure',
    subtitle: 'Instant announcements, parent-teacher chats and secure role-based access for every account.',
    color: '#8B5CF6',
  },
  {
    icon: require('../../../assets/icons/family.png'),
    title: 'Made for Your Family',
    subtitle: 'Separate experiences for students, parents, teachers, nannies and admins — simple and powerful.',
    color: '#10B981',
  },
];

interface Props {
  onFinish: () => void;
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

export default function OnboardingScreenV2({ onFinish }: Props) {
  const [current, setCurrent] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const insets = useSafeAreaInsets();

  const setSlide = (index: number) => {
    setCurrent(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleFinish = () => {
    onFinish();
  };

  const renderItem = ({ item, index }: { item: Slide; index: number }) => (
    <View style={{ width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
        <View
          style={{
            width: 220, height: 220, borderRadius: 28,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.92)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
            shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6,
          }}
        >
          <View style={{
            width: 160, height: 160, borderRadius: 36,
            backgroundColor: item.color + '1F',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Image source={item.icon} style={{ width: 96, height: 96 }} resizeMode="contain" />
          </View>
          <View style={{
            position: 'absolute', top: 14, right: 14,
            width: 42, height: 42, borderRadius: 21,
            backgroundColor: 'rgba(219,39,119,0.1)',
            borderWidth: 1, borderColor: 'rgba(219,39,119,0.2)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <MaterialCommunityIcons name="star" size={20} color={PINK} />
          </View>
        </View>
      </View>

      <Text style={{
        fontSize: 26, fontWeight: '900', color: TEXT_PRIMARY,
        textAlign: 'center', letterSpacing: -0.5, lineHeight: 34,
      }}>
        {item.title}
      </Text>

      <Text style={{
        fontSize: 15, fontWeight: '600', color: TEXT_MUTED,
        textAlign: 'center', marginTop: 14, lineHeight: 23,
      }}>
        {item.subtitle}
      </Text>
    </View>
  );

  const dots = SLIDES.map((_, index) => {
    const widthAnim = scrollX.interpolate({
      inputRange: [((index - 1) * SCREEN_WIDTH), (index * SCREEN_WIDTH), ((index + 1) * SCREEN_WIDTH)],
      outputRange: [8, 32, 8],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange: [((index - 1) * SCREEN_WIDTH), (index * SCREEN_WIDTH), ((index + 1) * SCREEN_WIDTH)],
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });
    const dotColor = scrollX.interpolate({
      inputRange: [((index - 1) * SCREEN_WIDTH), (index * SCREEN_WIDTH), ((index + 1) * SCREEN_WIDTH)],
      outputRange: ['#D1D5DB', SLIDES[index].color, '#D1D5DB'],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View
        key={index}
        style={{ height: 8, borderRadius: 4, marginHorizontal: 4, width: widthAnim, opacity, backgroundColor: dotColor }}
      />
    );
  });

  const isLast = current === SLIDES.length - 1;
  const activeColor = SLIDES[current]?.color || '#E91E63';

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <StatusBar style="dark" backgroundColor="#F7F9F6" />
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 }}>
          <Image source={require('../../../assets/hk-removebg-preview.png')} style={{ width: 90, height: 34 }} resizeMode="contain" />
          <TouchableOpacity
            onPress={handleFinish}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '800', color: TEXT_MUTED, letterSpacing: 1 }}>
              SKIP
            </Text>
          </TouchableOpacity>
        </View>

        <Animated.FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(_, index) => String(index)}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrent(index);
          }}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
          style={{ flex: 1, marginTop: 24 }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          {dots}
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16) }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={isLast ? handleFinish : () => setSlide(current + 1)}
            style={{ height: 58, borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: activeColor, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}
          >
            <LinearGradient
              colors={[activeColor, activeColor + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>
                {isLast ? 'GET STARTED' : 'NEXT'}
              </Text>
              <MaterialCommunityIcons name={isLast ? 'rocket' : 'arrow-right'} size={20} color="#FFFFFF" style={{ marginLeft: 10 }} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_MUTED }}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={handleFinish} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: activeColor, marginLeft: 4 }}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
