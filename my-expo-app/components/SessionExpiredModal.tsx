import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SessionExpiredModalProps {
  visible: boolean;
  onLogin: () => void;
}

export default function SessionExpiredModal({ visible, onLogin }: SessionExpiredModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#1e1e1e', borderRadius: 32, padding: 32, width: '100%', maxWidth: 360, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <MaterialCommunityIcons name="shield-off-outline" size={40} color="#EF4444" />
          </View>
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
            Session Expired
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            Your session has timed out. Please log in again to continue.
          </Text>
          <TouchableOpacity
            onPress={onLogin}
            activeOpacity={0.8}
            style={{ backgroundColor: '#F59E0B', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 40, flexDirection: 'row', alignItems: 'center', marginTop: 28, width: '100%', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="login" size={20} color="#92400E" />
            <Text style={{ color: '#92400E', fontWeight: '900', fontSize: 15, marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Log In Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
