import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

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
  const { theme, colors } = useTheme();

  const getStatusConfig = () => {
    switch(type) {
      case 'success':
        return {
          icon: 'check-circle',
          color: '#10B981',
          bgGradient: ['#D1FAE5', '#FFFFFF'],
          darkBgGradient: ['#065f4633', 'transparent'],
          buttonGradient: ['#10B981', '#059669'],
          shadowColor: '#10B981'
        };
      case 'warning':
        return {
          icon: 'alert-circle',
          color: '#F59E0B',
          bgGradient: ['#FEF3C7', '#FFFFFF'],
          darkBgGradient: ['#92400e33', 'transparent'],
          buttonGradient: ['#F59E0B', '#D97706'],
          shadowColor: '#F59E0B'
        };
      default: // error
        return {
          icon: 'close-circle',
          color: '#EF4444',
          bgGradient: ['#FEE2E2', '#FFFFFF'],
          darkBgGradient: ['#ef444433', 'transparent'],
          buttonGradient: ['#EF4444', '#B91C1C'],
          shadowColor: '#EF4444'
        };
    }
  };

  const config = getStatusConfig();
  const isDark = theme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View 
          className={`${isDark ? 'bg-[#1c1c14]' : 'bg-white'} rounded-[48px] w-[75%] overflow-hidden border-4 shadow-2xl`}
          style={{ 
            elevation: 30, 
            borderColor: config.color,
            shadowColor: config.shadowColor,
            shadowOpacity: 0.5,
            shadowRadius: 20
          }}
        >
          {/* Header Area */}
          <View style={{ height: 140, position: 'relative', overflow: 'hidden' }}>
             <LinearGradient
               colors={isDark ? config.darkBgGradient : config.bgGradient}
               className="absolute inset-0"
             />
             <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                <View 
                  className="w-24 h-24 rounded-[32px] items-center justify-center shadow-xl rotate-6 border-4 border-white relative"
                  style={{ backgroundColor: config.color }}
                >
                   <MaterialCommunityIcons name={config.icon as any} size={60} color="white" />
                </View>
             </View>
             
             {/* Decorative Background Icons */}
             <View style={{ position: 'absolute', top: -10, left: -10, opacity: 0.05, transform: [{ rotate: '12deg' }] }}>
                <MaterialCommunityIcons name="security" size={120} color={colors.text} />
             </View>
          </View>

          {/* Content */}
          <View className="p-8 items-center">
            <Text className={`text-3xl font-black ${colors.text} tracking-tighter text-center`}>{title}</Text>
            <Text className={`text-sm ${colors.textSecondary} font-bold text-center mt-3 leading-5 opacity-70`}>
              {message}
            </Text>
          </View>

          {/* Action Button */}
          <View className="px-8 pb-10">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onClose}
              style={{ elevation: 10 }}
              className="rounded-[28px] overflow-hidden shadow-lg"
            >
              <LinearGradient
                colors={config.buttonGradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-5 items-center justify-center"
              >
                <Text className="text-white font-black text-lg uppercase tracking-widest">{buttonText}</Text>
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
});
