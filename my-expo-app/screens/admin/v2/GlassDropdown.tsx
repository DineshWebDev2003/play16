import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const KINDERGARTEN_ICON = require('../../../assets/icons/kindergarten.png');

// ─── Soft radial glow (layered gradients ≈ blurred radial) ─────────────────────
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

interface GlassDropdownProps {
  selectedBranchId: string | null;
  onSelect: (branchId: string | null) => void;
  icon?: any;
  showAll?: boolean;
  hideAll?: boolean;
}

export default function GlassDropdown({ selectedBranchId, onSelect, icon, showAll, hideAll }: GlassDropdownProps) {
  const { branches, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const dropdownIcon = icon || KINDERGARTEN_ICON;

  if (user?.role !== 'master_admin' && user?.role !== 'admin') return null;

  const isSchoolAdmin = user?.role === 'admin' && !showAll;
  const adminBranchId = isSchoolAdmin ? user?.branch_id : null;
  const effectiveBranchId = isSchoolAdmin ? adminBranchId : selectedBranchId;

  const selectedName = effectiveBranchId
    ? branches.find(b => b.id === effectiveBranchId)?.name || 'Unknown'
    : hideAll
      ? 'Select a branch'
      : 'All Branches';

  const options = isSchoolAdmin
    ? [{ id: adminBranchId as string, name: selectedName }]
    : hideAll
      ? (branches as any[])
      : [{ id: 'all', name: 'All Branches' } as any, ...branches];

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
        style={styles.trigger}
      >
        <View style={styles.triggerIcon}>
          <Image source={dropdownIcon} style={{ width: 36, height: 36 }} resizeMode="contain" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.triggerLabel}>Viewing Branch</Text>
          <Text numberOfLines={1} style={styles.triggerValue}>
            {selectedName}
          </Text>
        </View>
        <View style={styles.chevron}>
          <Text style={{ fontSize: 13, color: '#4A5B53', fontWeight: '900' }}>▼</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
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
                <Image source={dropdownIcon} style={{ width: 44, height: 44 }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sheetTitle}>Select Branch</Text>
                <Text style={styles.sheetSub}>Filter everything by location</Text>
              </View>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen(false)} style={styles.closeBtn}>
                <Text style={{ fontSize: 15, color: '#1F2D28', fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Options */}
            <ScrollView
              style={{ flexGrow: 0, maxHeight: 380 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 }}
              showsVerticalScrollIndicator={false}
            >
              {options.map((item) => {
                const isAll = item.id === 'all';
                const isSelected = isAll ? !effectiveBranchId : effectiveBranchId === item.id;
                const activeColor = '#F59E0B';
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      onSelect(isAll ? null : item.id);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      isSelected && { borderColor: activeColor + '55', backgroundColor: activeColor + '14' },
                    ]}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        isSelected && { backgroundColor: activeColor },
                      ]}
                    >
                      <Image
                        source={dropdownIcon}
                        style={{ width: 30, height: 30, opacity: isSelected ? 1 : 0.85 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text numberOfLines={1} style={styles.optionName}>{item.name}</Text>
                      <Text style={styles.optionHint}>
                        {isAll ? `${branches.length} branches combined` : 'Manage this branch'}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.check}>
                        <Text style={{ fontSize: 11, color: '#fff', fontWeight: '900' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Footer hint */}
            <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20 }}>
              <Text style={styles.footerHint}>
                Selected branch is applied to all management views below.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    padding: 14,
    width: '100%',
  },
  triggerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#7A8A82',
  },
  triggerValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2D28',
    marginTop: 3,
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(247,249,246,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2D28',
    letterSpacing: -0.3,
  },
  sheetSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A8A82',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(31,45,40,0.08)',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(247,249,246,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2D28',
  },
  optionHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7A8A82',
    marginTop: 2,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHint: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#7A8A82',
    letterSpacing: 0.3,
  },
});
