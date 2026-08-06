import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Image, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';
const ACCENT_DARK = '#D97706';

const KINDERGARTEN_ICON = require('../../../assets/icons/kindergarten.png');

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

interface BranchFormPopupProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  editing?: { name: string; address?: string; share?: number } | null;
  onSave: (data: { name: string; address: string; share: number }) => void;
}

export default function BranchFormPopup({ visible, onClose, title, editing, onSave }: BranchFormPopupProps) {
  const insets = useSafeAreaInsets();
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchShare, setBranchShare] = useState('70');

  useEffect(() => {
    if (visible) {
      setBranchName(editing?.name || '');
      setBranchAddress(editing?.address || '');
      setBranchShare((editing?.share || 70).toString());
    }
  }, [visible, editing]);

  const shareNum = parseFloat(branchShare);
  const validShare = !isNaN(shareNum) && shareNum >= 0 && shareNum <= 100;

  const handleSave = () => {
    if (!branchName.trim()) return;
    const num = validShare ? shareNum : 70;
    onSave({ name: branchName.trim(), address: branchAddress.trim(), share: num });
  };

  const inputStyle = {
    backgroundColor: 'rgba(247,249,246,0.9)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '700' as const,
    color: TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { marginTop: Math.max(insets.top, 24), marginBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          {/* Aurora glass inside popup */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
            />
            <RadialGlow size={240} color="#DDF8D7" opacity={0.3} style={{ top: -90, left: -80 }} />
            <RadialGlow size={260} color="#DDFBFF" opacity={0.28} style={{ bottom: -100, right: -90 }} />
          </View>

          {/* Header with kindergarten icon */}
          <View style={{ paddingHorizontal: 22, paddingTop: 22, flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.iconTile}>
              <Image source={KINDERGARTEN_ICON} style={{ width: 44, height: 44 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.4 }}>{title}</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: TEXT_MUTED, marginTop: 1 }}>
                Manage this branch in the network
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 22, marginTop: 20 }}>
            <Text style={styles.label}>Branch Name</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. Little Stars Academy"
              placeholderTextColor="#A0AEC0"
              value={branchName}
              onChangeText={setBranchName}
            />
            <Text style={[styles.label, { marginTop: 16 }]}>Address (optional)</Text>
            <TextInput
              style={{ ...inputStyle, minHeight: 76, textAlignVertical: 'top' }}
              placeholder="Street, city, area"
              placeholderTextColor="#A0AEC0"
              value={branchAddress}
              onChangeText={setBranchAddress}
              multiline
            />
            <Text style={[styles.label, { marginTop: 16 }]}>Admin Share (%)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{ ...inputStyle, flex: 1, fontSize: 18, fontWeight: '900' }}
                placeholder="70"
                placeholderTextColor="#A0AEC0"
                value={branchShare}
                onChangeText={setBranchShare}
                keyboardType="decimal-pad"
              />
              <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT_MUTED, marginLeft: 12 }}>% of income</Text>
            </View>
            <Text style={styles.hint}>
              Master admin receives the remaining {validShare ? `${(100 - shareNum).toFixed(0)}%` : '30%'}
            </Text>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 22, paddingTop: 24, paddingBottom: 22 }}>
            <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.cancelBtn}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT_MUTED }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSave}
              style={{ flex: 1, marginLeft: 12, borderRadius: 18, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={[ACCENT, ACCENT_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 18 }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.3 }}>
                  {editing ? 'Update Branch' : 'Create Branch'}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,20,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: SCREEN_WIDTH - 40,
    maxWidth: 440,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },
  iconTile: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: TEXT_MUTED,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hint: {
    fontSize: 10,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  cancelBtn: {
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(31,45,40,0.12)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
