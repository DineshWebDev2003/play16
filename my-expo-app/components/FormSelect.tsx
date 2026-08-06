import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';

interface Option {
  label: string;
  value: string;
}

interface Props {
  value: string;
  options: Option[];
  onSelect: (value: string) => void;
  placeholder?: string;
  theme?: string;
}

export default function FormSelect({ value, options, onSelect, placeholder, theme }: Props) {
  const [open, setOpen] = useState(false);
  const isDark = theme === 'dark';
  const selected = options.find(o => o.value === value);

  const fieldBg = isDark ? '#1e1e1c' : 'rgba(255,255,255,0.92)';
  const fieldBorder = isDark ? '#3a3a38' : 'rgba(122,138,130,0.25)';
  const fieldText = isDark ? '#FFFFFF' : TEXT_PRIMARY;
  const sheetBg = isDark ? '#1c1c14' : 'rgba(255,255,255,0.97)';

  return (
    <>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: fieldBg,
          borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
          borderWidth: 1.5, borderColor: fieldBorder,
        }}>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '700',
          color: selected ? fieldText : TEXT_MUTED }}>
          {selected ? selected.label : placeholder || 'Select...'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={TEXT_MUTED} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}
            style={{
              backgroundColor: sheetBg,
              borderTopLeftRadius: 30, borderTopRightRadius: 30,
              paddingTop: 24, paddingBottom: 40, maxHeight: '60%',
            }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, marginBottom: 12 }} />
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFFFFF' : TEXT_PRIMARY }}>{placeholder || 'Select'}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={{ paddingHorizontal: 24 }}
              renderItem={({ item }) => {
                const isSelected = value === item.value;
                return (
                  <TouchableOpacity activeOpacity={0.7} onPress={() => { onSelect(item.value); setOpen(false); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16,
                      borderRadius: 16, marginBottom: 8,
                      backgroundColor: isSelected ? 'rgba(245,158,11,0.12)' : 'transparent',
                      borderWidth: 1, borderColor: isSelected ? 'rgba(245,158,11,0.25)' : 'transparent',
                    }}>
                    <Text style={{ flex: 1, fontSize: 16, fontWeight: '900',
                      color: isDark ? '#FFFFFF' : TEXT_PRIMARY }}>{item.label}</Text>
                    {isSelected && <MaterialCommunityIcons name="check-circle" size={22} color={ACCENT} />}
                  </TouchableOpacity>
                );
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
