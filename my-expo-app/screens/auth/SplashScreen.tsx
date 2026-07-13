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
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

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
      <Animated.Image
        source={require('../../assets/splash.png')}
        style={[styles.splash, splashStyle]}
        resizeMode="contain"
      />
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
    backgroundColor: '#FFFFFF',
  },
  splash: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
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
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
});

export default SplashScreen;
