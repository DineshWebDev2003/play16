import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';

interface StatusModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'error' | 'success' | 'warning';
  onClose: () => void;
  buttonText?: string;
}

export default function StatusModal({
  visible,
  title,
  message,
  type = 'error',
  onClose,
  buttonText = 'Okay, Got it!'
}: StatusModalProps) {
  const getStatusConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle',
          color: '#10B981',
          bgGradient: ['#D1FAE5', 'rgba(255,255,255,0)'],
          buttonGradient: ['#10B981', '#059669'],
          shadowColor: '#10B981'
        };
      case 'warning':
        return {
          icon: 'alert-circle',
          color: '#F59E0B',
          bgGradient: ['#FEF3C7', 'rgba(255,255,255,0)'],
          buttonGradient: ['#F59E0B', '#D97706'],
          shadowColor: '#F59E0B'
        };
      default: // error
        return {
          icon: 'close-circle',
          color: '#EF4444',
          bgGradient: ['#FEE2E2', 'rgba(255,255,255,0)'],
          buttonGradient: ['#EF4444', '#B91C1C'],
          shadowColor: '#EF4444'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              borderColor: config.color,
              shadowColor: config.shadowColor,
              shadowOpacity: 0.5,
              shadowRadius: 20,
            }
          ]}
        >
          {/* Header Area */}
          <View style={styles.header}>
            <LinearGradient
              colors={config.bgGradient as any}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.iconBox, { backgroundColor: config.color }]}>
              <MaterialCommunityIcons name={config.icon as any} size={44} color="white" />
            </View>
            <MaterialCommunityIcons name="security" size={100} color={TEXT_PRIMARY} style={{ position: 'absolute', top: -14, left: -14, opacity: 0.05, transform: [{ rotate: '12deg' }] }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>
              {message}
            </Text>
          </View>

          {/* Action Button */}
          <View style={styles.actionWrap}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onClose}
              style={styles.actionBtn}
            >
              <LinearGradient
                colors={config.buttonGradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>{buttonText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '78%',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    elevation: 30,
  },
  header: {
    height: 140,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '6deg' }],
    borderWidth: 4,
    borderColor: 'white',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 19,
    opacity: 0.85,
  },
  actionWrap: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  actionBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 8,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonGradient: {
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
