import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

interface Slide {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'school',
    title: 'Welcome to TN HappyKids',
    subtitle: 'A complete preschool & tuition management app for parents, teachers and administrators — all in one place.',
    color: '#E91E63',
  },
  {
    icon: 'calendar-check',
    title: 'Track Everything',
    subtitle: 'Live attendance, homework, activities, fees and timetables — every update reaches you instantly.',
    color: '#F59E0B',
  },
  {
    icon: 'message-text-lock',
    title: 'Stay Connected & Secure',
    subtitle: 'Instant announcements, parent-teacher chats and secure role-based access for every account.',
    color: '#8B5CF6',
  },
  {
    icon: 'account-group',
    title: 'Made for Your Family',
    subtitle: 'Separate experiences for students, parents, teachers, nannies and admins — simple and powerful.',
    color: '#10B981',
  },
];

interface Props {
  onFinish: () => void;
}

export default function OnboardingScreen({ onFinish }: Props) {
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
    <View style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
        <Animated.View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: 200, height: 200, borderRadius: 100,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <LinearGradient
              colors={[item.color, item.color + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 200, height: 200, borderRadius: 100,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <View style={{
                width: 160, height: 160, borderRadius: 80,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <MaterialCommunityIcons name={item.icon as any} size={72} color="#FFFFFF" />
              </View>
            </LinearGradient>
            <View style={{
              position: 'absolute', top: -6, right: -6,
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
              shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6,
            }}>
              <MaterialCommunityIcons name="star" size={22} color={item.color} />
            </View>
          </View>
        </Animated.View>
      </View>

      <Text style={{
        fontSize: 26, fontWeight: '900', color: '#111827',
        textAlign: 'center', letterSpacing: -0.5, lineHeight: 34,
      }}>
        {item.title}
      </Text>

      <Text style={{
        fontSize: 15, fontWeight: '600', color: '#6B7280',
        textAlign: 'center', marginTop: 14, lineHeight: 23,
      }}>
        {item.subtitle}
      </Text>
    </View>
  );

  const dots = SLIDES.map((_, index) => {
    const widthAnim = scrollX.interpolate({
      inputRange: [((index - 1) * width), (index * width), ((index + 1) * width)],
      outputRange: [8, 32, 8],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange: [((index - 1) * width), (index * width), ((index + 1) * width)],
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });
    const dotColor = scrollX.interpolate({
      inputRange: [((index - 1) * width), (index * width), ((index + 1) * width)],
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
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 }}>
          <Image source={require('../../assets/hk-removebg-preview.png')} style={{ width: 90, height: 34 }} resizeMode="contain" />
          <TouchableOpacity onPress={handleFinish} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.5 }}>
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
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrent(index);
          }}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
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
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF' }}>
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
