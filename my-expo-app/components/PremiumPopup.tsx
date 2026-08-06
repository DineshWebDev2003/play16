import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions, Pressable, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const TEXT_BODY = '#4A5B53';

interface PremiumPopupProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'info' | 'action';
  icon?: string;
  accentColor?: string;
  children?: React.ReactNode;
  buttonText?: string;
  onButtonPress?: () => void;
  showCloseButton?: boolean;
}

export default function PremiumPopup({
  visible,
  onClose,
  title,
  message,
  type = 'info',
  icon,
  accentColor,
  children,
  buttonText,
  onButtonPress,
  showCloseButton = true
}: PremiumPopupProps) {
  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 400, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
      translateY.value = withTiming(0, { duration: 450, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
    } else {
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(40, { duration: 250 });
    }
  }, [visible]);

  const config = {
    success: {
      defaultIcon: 'check-decagram',
      color: '#10B981',
      gradient: ['#10B981', '#059669'],
      bgGradient: ['#D1FAE5', 'rgba(255,255,255,0)']
    },
    error: {
      defaultIcon: 'alert-decagram',
      color: '#EF4444',
      gradient: ['#EF4444', '#B91C1C'],
      bgGradient: ['#FEE2E2', 'rgba(255,255,255,0)']
    },
    action: {
      defaultIcon: 'gesture-tap',
      color: '#F472B6',
      gradient: ['#F472B6', '#BE185D'],
      bgGradient: ['#FDF2F8', 'rgba(255,255,255,0)']
    },
    info: {
      defaultIcon: 'information-variant',
      color: '#3B82F6',
      gradient: ['#3B82F6', '#1E40AF'],
      bgGradient: ['#EFF6FF', 'rgba(255,255,255,0)']
    }
  };

  const activeConfig = config[type];
  const mainColor = accentColor || activeConfig.color;
  const mainGradient = accentColor ? [mainColor, mainColor + 'DD'] : activeConfig.gradient;

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value }
    ],
    opacity: opacity.value
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderColor: mainColor + '40',
              elevation: 30,
              shadowColor: mainColor
            },
            animatedContainerStyle
          ]}
        >
          {/* Header Graphic */}
          <View style={styles.headerGraphic}>
            <LinearGradient
              colors={activeConfig.bgGradient as any}
              style={StyleSheet.absoluteFill}
            />

            {/* Mesh-like Decorative Circles */}
            <View style={[styles.glow, { backgroundColor: mainColor + '20', top: -50, left: -50 }]} />
            <View style={[styles.glow, { backgroundColor: mainColor + '10', bottom: -50, right: -50 }]} />

            <View style={styles.iconContainer}>
              <LinearGradient
                colors={mainGradient as any}
                style={styles.iconGradient}
              >
                <MaterialCommunityIcons
                  name={(icon || activeConfig.defaultIcon) as any}
                  size={48}
                  color="white"
                />
              </LinearGradient>
              {/* Icon Ring */}
              <View style={[styles.iconRing, { borderColor: mainColor + '30' }]} />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {message && (
              <Text style={styles.message}>
                {message}
              </Text>
            )}

            {children && (
              <View style={styles.childrenContainer}>
                {children}
              </View>
            )}

            {/* Main Action Button */}
            {buttonText && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onButtonPress || onClose}
                style={styles.mainButton}
              >
                <LinearGradient
                  colors={mainGradient as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>{buttonText}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {showCloseButton && !buttonText && (
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeLabel}
              >
                <Text style={styles.closeText}>DISMISS</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerGraphic: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  iconContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    transform: [{ rotate: '6deg' }],
  },
  iconRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 34,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    color: TEXT_PRIMARY,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    opacity: 0.85,
    color: TEXT_BODY,
  },
  childrenContainer: {
    width: '100%',
    marginTop: 24,
  },
  mainButton: {
    width: '100%',
    marginTop: 32,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginRight: 8,
  },
  closeLabel: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(247,249,246,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(122,138,130,0.2)',
  },
  closeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: TEXT_MUTED,
  },
});
