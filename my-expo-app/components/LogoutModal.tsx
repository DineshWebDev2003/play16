import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';

interface LogoutModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutModal({ visible, onConfirm, onCancel }: LogoutModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Illustration & Icon */}
          <View style={styles.header}>
            <LinearGradient colors={['#FEE2E2', 'rgba(255,255,255,0)']} style={StyleSheet.absoluteFill} />
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="power" size={44} color="white" />
              <View style={styles.badge}>
                <MaterialCommunityIcons name="alert" size={12} color="#92400E" />
              </View>
            </View>
            <MaterialCommunityIcons name="logout" size={100} color={TEXT_PRIMARY} style={{ position: 'absolute', top: -12, left: -16, opacity: 0.06, transform: [{ rotate: '12deg' }] }} />
            <MaterialCommunityIcons name="door-open" size={100} color={TEXT_PRIMARY} style={{ position: 'absolute', bottom: -16, right: -16, opacity: 0.06, transform: [{ rotate: '-12deg' }] }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Signing Out? 🥺</Text>
            <Text style={styles.message}>
              Are you sure you want to leave the playground? We'll be waiting for your return! ✨
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity activeOpacity={0.9} onPress={onConfirm} style={styles.confirmBtn}>
              <LinearGradient colors={['#EF4444', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.confirmGradient}>
                <MaterialCommunityIcons name="power" size={22} color="white" />
                <Text style={styles.confirmText}>Yes, Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Stay in Playground</Text>
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
    width: '85%',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    elevation: 30,
  },
  header: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '6deg' }],
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#EF4444',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  badge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#F59E0B',
    padding: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
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
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 12,
  },
  confirmBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  confirmGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 15,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  cancelBtn: {
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(122,138,130,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: TEXT_MUTED,
    fontWeight: '900',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
