import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface BranchFilterProps {
  selectedBranchId: string | null;
  onSelect: (branchId: string | null) => void;
}

export default function BranchFilter({ selectedBranchId, onSelect }: BranchFilterProps) {
  const { branches, user } = useAuth();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  if (user?.role !== 'master_admin') return null;

  const selectedName = selectedBranchId
    ? branches.find(b => b.id === selectedBranchId)?.name || 'Unknown'
    : 'Global';

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
        style={{
          backgroundColor: theme === 'dark' ? '#1e1e1e' : '#F3F4F6',
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme === 'dark' ? '#262626' : '#E5E7EB',
        }}
      >
        <MaterialCommunityIcons name="domain" size={16} color="#F59E0B" />
        <Text style={{ fontSize: 12, fontWeight: '900', marginLeft: 8, color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>
          {selectedName}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF',
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              paddingTop: 24,
              paddingBottom: 40,
              maxHeight: '60%',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, backgroundColor: theme === 'dark' ? '#525252' : '#D1D5DB', borderRadius: 2, marginBottom: 16 }} />
              <Text style={{ fontSize: 18, fontWeight: '900', color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>Filter by Branch</Text>
            </View>
            <FlatList
              data={[{ id: 'all', name: 'All Branches' } as any, ...branches]}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 24 }}
              renderItem={({ item }) => {
                const isAll = item.id === 'all';
                const isSelected = isAll ? !selectedBranchId : selectedBranchId === item.id;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelect(isAll ? null : item.id);
                      setOpen(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                      borderRadius: 16,
                      marginBottom: 8,
                      backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                      borderWidth: 1,
                      borderColor: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    }}
                  >
                    <View style={{ backgroundColor: isSelected ? '#F59E0B' : theme === 'dark' ? '#262626' : '#F3F4F6', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <MaterialCommunityIcons name={isAll ? 'layers-triple-outline' : 'domain'} size={22} color={isSelected ? 'white' : theme === 'dark' ? '#D1D5DB' : '#6B7280'} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>{item.name}</Text>
                    {isSelected && <MaterialCommunityIcons name="check-circle" size={22} color="#F59E0B" style={{ marginLeft: 'auto' }} />}
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
