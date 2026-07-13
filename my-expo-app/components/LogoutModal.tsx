import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface LogoutModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutModal({ visible, onConfirm, onCancel }: LogoutModalProps) {
  const { theme, colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View 
          className={`${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'} rounded-[48px] w-[85%] overflow-hidden border-4 border-brand-violet shadow-2xl`}
          style={{ elevation: 30 }}
        >
          {/* Header Illustration & Icon */}
          <View className="relative h-44 overflow-hidden">
             <LinearGradient
               colors={theme === 'dark' ? ['#ef444433', 'transparent'] : ['#FDE2E2', '#FFFFFF']}
               className="absolute inset-0"
             />
             <View className="absolute inset-0 items-center justify-center">
                <View className="bg-red-500 w-24 h-24 rounded-[32px] items-center justify-center shadow-xl rotate-6 border-4 border-white relative">
                   <MaterialCommunityIcons name="power" size={60} color="white" />
                   <View className="absolute -bottom-2 -right-2 bg-brand-yellow p-2 rounded-xl border-2 border-white">
                      <MaterialCommunityIcons name="alert" size={16} color="#92400E" />
                   </View>
                </View>
             </View>
             
             {/* Decorative Background Icons */}
             <View className="absolute -top-10 -left-10 opacity-10 rotate-12">
                <MaterialCommunityIcons name="logout" size={120} color={colors.text} />
             </View>
             <View className="absolute -bottom-10 -right-10 opacity-10 -rotate-12">
                <MaterialCommunityIcons name="door-open" size={120} color={colors.text} />
             </View>
          </View>

          {/* Content */}
          <View className="p-8 items-center">
            <Text className={`text-3xl font-black ${colors.text} tracking-tighter text-center`}>Signing Out? 🥺</Text>
            <Text className={`text-sm ${colors.textSecondary} font-bold text-center mt-3 leading-5 opacity-70`}>
              Are you sure you want to leave the playground? We'll be waiting for your return! ✨
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="px-8 pb-10 gap-4">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onConfirm}
              style={{ elevation: 10 }}
              className="rounded-[28px] overflow-hidden shadow-lg shadow-red-500/40"
            >
              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-5 flex-row items-center justify-center"
              >
                <MaterialCommunityIcons name="power" size={24} color="white" />
                <Text className="text-white font-black text-lg ml-3 uppercase tracking-widest">Yes, Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onCancel}
              className={`py-5 rounded-[28px] border-2 ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'} flex-row items-center justify-center`}
            >
              <Text className={`font-black text-base uppercase tracking-widest ${colors.textSecondary}`}>Stay in Playground</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Soft Glow */}
          <View className="absolute -bottom-10 left-0 right-0 h-2 bg-brand-pink/20 blur-xl" />
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
