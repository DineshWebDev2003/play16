import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const TEXT_TERTIARY = '#A0AAA4';

interface ChoiceOption {
  label: string;
  onPress: () => void;
  icon?: string;
  type?: 'primary' | 'secondary' | 'destructive' | 'warning';
}

interface ChoiceModalProps {
  visible: boolean;
  title: string;
  message?: string;
  options: ChoiceOption[];
  onClose: () => void;
  iconName?: string;
  accentColor?: string;
}

export default function ChoiceModal({
  visible,
  title,
  message,
  options,
  onClose,
  iconName = 'help-circle-outline',
  accentColor = '#F472B6'
}: ChoiceModalProps) {
  const getButtonStyles = (type?: string) => {
    switch (type) {
      case 'destructive':
        return {
          gradient: ['#EF4444', '#B91C1C'],
          textColor: 'white',
          iconColor: 'white'
        };
      case 'warning':
        return {
          gradient: ['#F59E0B', '#D97706'],
          textColor: 'white',
          iconColor: 'white'
        };
      case 'secondary':
        return {
          gradient: ['#F1F5F9', '#E2E8F0'],
          textColor: TEXT_PRIMARY,
          iconColor: TEXT_TERTIARY
        };
      default: // primary
        return {
          gradient: [accentColor, '#DB2777'],
          textColor: 'white',
          iconColor: 'white'
        };
    }
  };

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
            { shadowColor: accentColor }
          ]}
        >
          {/* Header Decorative Area */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#FDF2F8', 'rgba(255,255,255,0)']}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[styles.iconBox, { backgroundColor: accentColor }]}
            >
              <MaterialCommunityIcons name={iconName as any} size={40} color="white" />
            </View>
            <MaterialCommunityIcons name="gesture-tap" size={90} color={TEXT_PRIMARY} style={{ position: 'absolute', top: -12, left: -12, opacity: 0.05, transform: [{ rotate: '15deg' }] }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {message && (
              <Text style={styles.message}>
                {message}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {options.map((option, index) => {
              const btnStyle = getButtonStyles(option.type);
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onPress={() => {
                    option.onPress();
                    onClose();
                  }}
                  style={styles.optionBtn}
                >
                  <LinearGradient
                    colors={btnStyle.gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionGradient}
                  >
                    {option.icon && (
                      <MaterialCommunityIcons name={option.icon as any} size={18} color={btnStyle.iconColor} style={{ marginRight: 8 }} />
                    )}
                    <Text
                      style={{ color: btnStyle.textColor }}
                      className="font-black text-sm uppercase tracking-widest"
                    >
                      {option.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Cancel</Text>
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
    height: 120,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '3deg' }],
    borderWidth: 4,
    borderColor: 'white',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 17,
    opacity: 0.85,
  },
  actions: {
    paddingHorizontal: 24,
    paddingVertical: 22,
    gap: 10,
  },
  optionBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  optionGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(122,138,130,0.3)',
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '900',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: TEXT_TERTIARY,
  },
});
