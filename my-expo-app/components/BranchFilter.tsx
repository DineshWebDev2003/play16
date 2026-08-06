import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';

interface BranchFilterProps {
  selectedBranchId: string | null;
  onSelect: (branchId: string | null) => void;
}

export default function BranchFilter({ selectedBranchId, onSelect }: BranchFilterProps) {
  const { branches, user } = useAuth();
  const [open, setOpen] = useState(false);

  if (user?.role !== 'master_admin' && user?.role !== 'admin') return null;

  const isSchoolAdmin = user?.role === 'admin';
  const adminBranchId = isSchoolAdmin ? user?.branch_id : null;

  const effectiveBranchId = isSchoolAdmin ? adminBranchId : selectedBranchId;

  const selectedName = effectiveBranchId
    ? branches.find(b => b.id === effectiveBranchId)?.name || 'Unknown'
    : 'Global';

  const pillStyle = {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  };

  if (isSchoolAdmin) {
    return (
      <View style={[pillStyle, { opacity: 0.8 }]}>
        <MaterialCommunityIcons name="domain" size={16} color={ACCENT} />
        <Text style={{ fontSize: 12, fontWeight: '900', marginLeft: 8, color: TEXT_PRIMARY }}>
          {selectedName}
        </Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
        style={pillStyle}
      >
        <MaterialCommunityIcons name="domain" size={16} color={ACCENT} />
        <Text style={{ fontSize: 12, fontWeight: '900', marginLeft: 8, color: TEXT_PRIMARY }}>
          {selectedName}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={16} color={TEXT_MUTED} style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: 'rgba(255,255,255,0.97)',
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              paddingTop: 24,
              paddingBottom: 40,
              maxHeight: '60%',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, marginBottom: 16 }} />
              <Text style={{ fontSize: 18, fontWeight: '900', color: TEXT_PRIMARY }}>Filter by Branch</Text>
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
                      backgroundColor: isSelected ? 'rgba(245,158,11,0.12)' : 'transparent',
                      borderWidth: 1,
                      borderColor: isSelected ? 'rgba(245,158,11,0.25)' : 'transparent',
                    }}
                  >
                    <View style={{ backgroundColor: isSelected ? ACCENT : '#F3F4F6', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <MaterialCommunityIcons name={isAll ? 'layers-triple-outline' : 'domain'} size={22} color={isSelected ? 'white' : TEXT_MUTED} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: TEXT_PRIMARY }}>{item.name}</Text>
                    {isSelected && <MaterialCommunityIcons name="check-circle" size={22} color={ACCENT} style={{ marginLeft: 'auto' }} />}
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
