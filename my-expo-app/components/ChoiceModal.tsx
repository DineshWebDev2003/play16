import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

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
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

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
          gradient: isDark ? ['#334155', '#1e293b'] : ['#F1F5F9', '#E2E8F0'],
          textColor: colors.text,
          iconColor: colors.textTertiary
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
          className={`${isDark ? 'bg-[#1c1c14]' : 'bg-white'} rounded-[48px] w-[82%] overflow-hidden border-4 border-brand-pink shadow-2xl`}
          style={{ elevation: 30, shadowColor: accentColor }}
        >
          {/* Header Decorative Area */}
          <View style={{ height: 120, position: 'relative', overflow: 'hidden' }}>
            <LinearGradient
              colors={isDark ? ['#f472b622', 'transparent'] : ['#FDF2F8', '#FFFFFF']}
              className="absolute inset-0"
            />
            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
               <View 
                style={{ backgroundColor: accentColor }}
                className="w-20 h-20 rounded-[28px] items-center justify-center shadow-xl rotate-3 border-4 border-white"
               >
                  <MaterialCommunityIcons name={iconName as any} size={44} color="white" />
               </View>
            </View>
            <View style={{ position: 'absolute', top: -10, left: -10, opacity: 0.05, transform: [{ rotate: '15deg' }] }}>
               <MaterialCommunityIcons name="gesture-tap" size={100} color={colors.text} />
            </View>
          </View>

          {/* Content */}
          <View className="px-8 pt-6 pb-4 items-center">
            <Text className={`text-2xl font-black ${colors.text} tracking-tighter text-center`}>{title}</Text>
            {message && (
              <Text className={`text-xs ${colors.textSecondary} font-bold text-center mt-2 leading-4 opacity-70`}>
                {message}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View className="px-8 pb-10 gap-3">
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
                  className="rounded-[24px] overflow-hidden shadow-sm"
                >
                  <LinearGradient
                    colors={btnStyle.gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="py-4 flex-row items-center justify-center"
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
              className={`mt-2 py-3 rounded-[20px] border border-dashed ${isDark ? 'border-white/10' : 'border-gray-200'} items-center`}
            >
              <Text className={`font-black text-[10px] uppercase tracking-widest ${colors.textTertiary}`}>Cancel</Text>
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
