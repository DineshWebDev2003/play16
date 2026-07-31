import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

  return (
    <>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: isDark ? '#1e1e1c' : '#F9FAFB',
          borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
          borderWidth: 1.5, borderColor: isDark ? '#3a3a38' : '#E5E7EB',
        }}>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '700',
          color: selected ? (isDark ? '#fff' : '#111') : '#9CA3AF' }}>
          {selected ? selected.label : placeholder || 'Select...'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}
            style={{
              backgroundColor: isDark ? '#1c1c14' : '#FFFFFF',
              borderTopLeftRadius: 30, borderTopRightRadius: 30,
              paddingTop: 24, paddingBottom: 40, maxHeight: '60%',
            }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, backgroundColor: isDark ? '#525252' : '#D1D5DB', borderRadius: 2, marginBottom: 12 }} />
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827' }}>{placeholder || 'Select'}</Text>
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
                      backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                      borderWidth: 1, borderColor: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    }}>
                    <Text style={{ flex: 1, fontSize: 16, fontWeight: '900',
                      color: isDark ? '#FFFFFF' : '#111827' }}>{item.label}</Text>
                    {isSelected && <MaterialCommunityIcons name="check-circle" size={22} color="#F59E0B" />}
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
