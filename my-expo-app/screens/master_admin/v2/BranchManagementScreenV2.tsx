import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BranchFormPopup from './BranchFormPopup';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const TEXT_PRIMARY = '#1F2D28';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';

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

const KINDERGARTEN_ICON = require('../../../assets/icons/kindergarten.png');

export default function BranchManagementScreenV2({ navigation }: Props) {
  const { branches, addBranch, updateBranch, deleteBranch, users } = useAuth();
  const insets = useSafeAreaInsets();

  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

  const openAddModal = () => {
    setEditingBranch(null);
    setShowModal(true);
  };

  const openEditModal = (branch: any) => {
    setEditingBranch(branch);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBranch(null);
  };

  const handleSave = async (data: { name: string; address: string; share: number }) => {
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, { name: data.name, address: data.address, share: data.share });
        Alert.alert('Success', 'Branch updated successfully');
      } else {
        await addBranch({ name: data.name, address: data.address, share: data.share });
        Alert.alert('Success', 'Branch created successfully');
      }
      closeModal();
    } catch (e) {
      Alert.alert('Error', editingBranch ? 'Failed to update branch' : 'Failed to create branch');
    }
  };

  const handleDeleteBranch = (branchId: string, branchName: string) => {
    const userCount = users.filter(u => u.branch_id === branchId).length;
    Alert.alert(
      'Delete Branch',
      `Delete "${branchName}"? This will affect ${userCount} users in this branch.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBranch(branchId);
              Alert.alert('Deleted', 'Branch removed successfully');
            } catch (e) {
              Alert.alert('Error', 'Failed to delete branch');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      {/* ── Aurora Glass background ── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <RadialGlow size={480} color="#DDF8D7" opacity={0.28} style={{ top: -160, left: -160 }} />
        <RadialGlow
          size={420}
          color="#DDFBFF"
          opacity={0.25}
          style={{ top: -140, left: SCREEN_WIDTH / 2 - 210 }}
        />
        <RadialGlow size={520} color="#F8FFD8" opacity={0.24} style={{ bottom: -180, left: -180 }} />
        <RadialGlow
          size={450}
          color="#EAF5FF"
          opacity={0.18}
          style={{ top: SCREEN_HEIGHT * 0.4 - 225, right: -180 }}
        />
      </View>

      {/* ── Header ── */}
      <View style={{ paddingTop: Math.max(insets.top, 56), paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '700', flex: 1, marginLeft: 14, color: TEXT_PRIMARY, letterSpacing: -0.5 }}>
            Branches
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openAddModal}
            style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="plus" size={24} color={ACCENT} />
          </TouchableOpacity>
        </View>

        {/* ── Section title with kindergarten icon ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 28 }}>
          <View style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={KINDERGARTEN_ICON} style={{ width: 44, height: 44 }} resizeMode="contain" />
          </View>
          <View style={{ marginLeft: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY }}>Branch Network</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: TEXT_MUTED, marginTop: 1 }}>
              {branches.length} {branches.length === 1 ? 'branch' : 'branches'} across the network
            </Text>
          </View>
        </View>

        <View style={{ height: 18 }} />
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        {branches.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              <Image source={KINDERGARTEN_ICON} style={{ width: 90, height: 90 }} resizeMode="contain" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16, color: TEXT_PRIMARY }}>No Branches Yet</Text>
            <Text style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 8, textAlign: 'center' }}>Create your first branch to get started</Text>
          </View>
        ) : (
          branches.map((branch) => {
            const branchUsers = users.filter(u => u.branch_id === branch.id);
            const adminCount = branchUsers.filter(u => u.role === 'admin').length;
            const teacherCount = branchUsers.filter(u => u.role === 'teacher').length;
            const studentCount = branchUsers.filter(u => u.role === 'student').length;
            const share = branch.share || 70;

            return (
              <View
                key={branch.id}
                style={{
                  marginBottom: 16,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.92)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.6)',
                  overflow: 'hidden',
                }}
              >
                <View style={{ padding: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={KINDERGARTEN_ICON} style={{ width: 60, height: 60 }} resizeMode="contain" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: -0.3 }}>
                        {branch.name}
                      </Text>
                      {branch.address ? (
                        <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '500', color: TEXT_MUTED, marginTop: 3 }}>
                          {branch.address}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => openEditModal(branch)}
                        style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
                      >
                        <MaterialCommunityIcons name="pencil" size={16} color="#F59E0B" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleDeleteBranch(branch.id, branch.name)}
                        style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ marginTop: 14, backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 14, padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="percent" size={14} color={ACCENT} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT, marginLeft: 6 }}>Admin Share: {share}%</Text>
                      </View>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: TEXT_MUTED }}>Master: {100 - share}%</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                      {[
                        { label: 'Admins', value: adminCount, color: '#F59E0B' },
                        { label: 'Teachers', value: teacherCount, color: '#10B981' },
                        { label: 'Students', value: studentCount, color: '#3B82F6' },
                      ].map((item) => (
                        <View key={item.label} style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={{ fontSize: 22, fontWeight: '700', color: item.color }}>{item.value}</Text>
                          <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: TEXT_MUTED, marginTop: 4 }}>{item.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 128 }} />
      </ScrollView>

      <BranchFormPopup
        visible={showModal}
        onClose={closeModal}
        title={editingBranch ? 'Edit Branch' : 'New Branch'}
        editing={editingBranch}
        onSave={handleSave}
      />
    </View>
  );
}
