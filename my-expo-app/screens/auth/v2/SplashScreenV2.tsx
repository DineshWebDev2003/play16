import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';

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

const SplashScreen = () => {
  const splashOpacity = useSharedValue(0);
  const brandOpacity = useSharedValue(0);
  const dotScale = useSharedValue(1);

  useEffect(() => {
    splashOpacity.value = withTiming(1, { duration: 500 });
    brandOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    dotScale.value = withDelay(1000, withRepeat(
      withSequence(
        withTiming(1.3, { duration: 400 }),
        withTiming(1, { duration: 400 })
      ),
      -1, true
    ));
  }, []);

  const splashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <AuroraBackground />
      <View style={styles.logoBadge}>
        <Animated.Image
          source={require('../../../assets/splash.png')}
          style={[styles.splash, splashStyle]}
          resizeMode="contain"
        />
      </View>
      <Animated.Text style={[styles.title, brandStyle]}>TN HappyKids</Animated.Text>
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} style={[styles.dot, i === 1 && dotStyle]} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9F6',
  },
  logoBadge: {
    width: 150,
    height: 150,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  splash: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: 36,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
    marginTop: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
    opacity: 0.3,
  },
});

export default SplashScreen;
