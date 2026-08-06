import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACTIVE = '#F59E0B';

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

interface GlassSelectV2Option {
  label: string;
  value: string;
  hint?: string;
  icon?: any;
}

interface GlassSelectV2Props {
  label: string;
  placeholder: string;
  value: string | null;
  options: GlassSelectV2Option[];
  onSelect: (value: string | null) => void;
  icon?: any;
  title: string;
  subtitle?: string;
  footerHint?: string;
  showAllOption?: boolean;
  allLabel?: string;
  allHint?: string;
}

export default function GlassSelectV2({
  label, placeholder, value, options, onSelect, icon,
  title, subtitle, footerHint, showAllOption, allLabel, allHint,
}: GlassSelectV2Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selected = value ? options.find(o => o.value === value) : undefined;
  const hasIcon = !!icon;

  return (
    <>
      <View style={{ marginBottom: 16 }}>
        {label ? (
          <Text style={styles.triggerLabel}>{label}</Text>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setOpen(true)}
          style={styles.trigger}
        >
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: selected ? TEXT_PRIMARY : '#9CA3AF' }}>
            {selected ? selected.label : placeholder}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={TEXT_MUTED} />
        </TouchableOpacity>
      </View>

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

            {/* Header */}
            <View style={{ paddingHorizontal: 22, paddingTop: 22, flexDirection: 'row', alignItems: 'center' }}>
              {hasIcon && (
                <View style={styles.iconTile}>
                  <Image source={icon} style={{ width: 44, height: 44 }} resizeMode="contain" />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: hasIcon ? 12 : 0 }}>
                <Text style={styles.sheetTitle}>{title}</Text>
                {subtitle ? <Text style={styles.sheetSub}>{subtitle}</Text> : null}
              </View>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={16} color={TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <ScrollView
              style={{ flexGrow: 0, maxHeight: 380 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 }}
              showsVerticalScrollIndicator={false}
            >
              {showAllOption && (
                <TouchableOpacity
                  key="__all__"
                  activeOpacity={0.8}
                  onPress={() => { onSelect(null); setOpen(false); }}
                  style={[
                    styles.option,
                    !value && { borderColor: ACTIVE + '55', backgroundColor: ACTIVE + '14' },
                  ]}
                >
                  {hasIcon && (
                    <View style={[styles.optionIcon, !value && { backgroundColor: ACTIVE }]}>
                      <Image source={icon} style={{ width: 30, height: 30, opacity: !value ? 1 : 0.85 }} resizeMode="contain" />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: hasIcon ? 12 : 0 }}>
                    <Text numberOfLines={1} style={styles.optionName}>{allLabel || 'All'}</Text>
                    {allHint ? <Text style={styles.optionHint}>{allHint}</Text> : null}
                  </View>
                  {!value && (
                    <View style={styles.check}>
                      <Text style={{ fontSize: 11, color: '#fff', fontWeight: '900' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {options.map((item) => {
                const isSelected = value === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    activeOpacity={0.8}
                    onPress={() => { onSelect(item.value); setOpen(false); }}
                    style={[
                      styles.option,
                      isSelected && { borderColor: ACTIVE + '55', backgroundColor: ACTIVE + '14' },
                    ]}
                  >
                    {hasIcon && (
                      <View style={[styles.optionIcon, isSelected && { backgroundColor: ACTIVE }]}>
                        <Image source={item.icon || icon} style={{ width: 30, height: 30, opacity: isSelected ? 1 : 0.85 }} resizeMode="contain" />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: hasIcon ? 12 : 0 }}>
                      <Text numberOfLines={1} style={styles.optionName}>{item.label}</Text>
                      {item.hint ? <Text style={styles.optionHint}>{item.hint}</Text> : null}
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
            {footerHint ? (
              <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20 }}>
                <Text style={styles.footerHint}>{footerHint}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  trigger: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(247,249,246,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
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
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  sheetSub: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MUTED,
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
    color: TEXT_PRIMARY,
  },
  optionHint: {
    fontSize: 10,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginTop: 2,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHint: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MUTED,
    letterSpacing: 0.3,
  },
});
