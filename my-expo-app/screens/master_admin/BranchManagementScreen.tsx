import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumPopup from '../../components/PremiumPopup';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

export default function BranchManagementScreen({ navigation }: Props) {
  const { branches, addBranch, updateBranch, deleteBranch, users } = useAuth();
  const { colors, theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchShare, setBranchShare] = useState('70');

  const openAddModal = () => {
    setEditingBranch(null);
    setBranchName('');
    setBranchAddress('');
    setBranchShare('70');
    setShowModal(true);
  };

  const openEditModal = (branch: any) => {
    setEditingBranch(branch);
    setBranchName(branch.name);
    setBranchAddress(branch.address || '');
    setBranchShare((branch.share || 70).toString());
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBranch(null);
    setBranchName('');
    setBranchAddress('');
    setBranchShare('70');
  };

  const handleSave = async () => {
    if (!branchName.trim()) {
      Alert.alert('Error', 'Branch name is required');
      return;
    }
    const shareNum = parseFloat(branchShare);
    if (isNaN(shareNum) || shareNum < 0 || shareNum > 100) {
      Alert.alert('Error', 'Share must be between 0 and 100');
      return;
    }
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, { name: branchName.trim(), address: branchAddress.trim(), share: shareNum });
        Alert.alert('Success', 'Branch updated successfully');
      } else {
        await addBranch({ name: branchName.trim(), address: branchAddress.trim(), share: shareNum });
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
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme === 'dark' ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: '900', flex: 1, color: theme === 'dark' ? '#FFFFFF' : '#111827', letterSpacing: -0.5 }}>Branches</Text>
        <TouchableOpacity
          onPress={openAddModal}
          style={{ backgroundColor: '#F59E0B', width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
        {branches.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <MaterialCommunityIcons name="domain-off" size={60} color={theme === 'dark' ? '#9CA3AF' : '#9CA3AF'} />
            <Text style={{ fontSize: 18, fontWeight: '900', marginTop: 16, color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>No Branches Yet</Text>
            <Text style={{ fontSize: 14, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginTop: 8, textAlign: 'center' }}>Create your first branch to get started</Text>
          </View>
        ) : (
          branches.map((branch) => {
            const branchUsers = users.filter(u => u.branch_id === branch.id);
            const adminCount = branchUsers.filter(u => u.role === 'admin').length;
            const teacherCount = branchUsers.filter(u => u.role === 'teacher').length;
            const studentCount = branchUsers.filter(u => u.role === 'student').length;

            return (
              <View
                key={branch.id}
                style={{ marginBottom: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: theme === 'dark' ? '#2d2d24' : '#FFFFFF', elevation: 12 }}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={{ padding: 20 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>{branch.name}</Text>
                      {branch.address && (
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 }}>{branch.address}</Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity
                        onPress={() => openEditModal(branch)}
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
                      >
                        <MaterialCommunityIcons name="pencil" size={16} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteBranch(branch.id, branch.name)}
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={18} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
                <View style={{ padding: 20 }}>
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="percent" size={16} color="#F59E0B" />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#F59E0B', marginLeft: 6 }}>Admin Share: {branch.share || 70}%</Text>
                    </View>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Master: {100 - (branch.share || 70)}%</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {[
                      { label: 'Admins', value: adminCount, color: '#FDE047' },
                      { label: 'Teachers', value: teacherCount, color: '#34D399' },
                      { label: 'Students', value: studentCount, color: '#60A5FA' },
                    ].map((item) => (
                      <View key={item.label} style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 24, fontWeight: '900', color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>{item.value}</Text>
                        <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginTop: 4 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 128 }} />
      </ScrollView>

      <PremiumPopup
        visible={showModal}
        onClose={closeModal}
        title={editingBranch ? 'Edit Branch' : 'New Branch'}
        message=""
        type="action"
        icon="domain-plus"
        buttonText={editingBranch ? 'Update Branch' : 'Create Branch'}
        onButtonPress={handleSave}
      >
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <TextInput
            style={{
              backgroundColor: theme === 'dark' ? '#1c1c14' : '#F9FAFB',
              color: theme === 'dark' ? '#FFFFFF' : '#111827',
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 16,
              fontSize: 16,
              fontWeight: '700',
              borderWidth: 1,
              borderColor: theme === 'dark' ? '#3e3e34' : '#E5E7EB',
              marginBottom: 16,
            }}
            placeholder="Branch Name"
            placeholderTextColor={theme === 'dark' ? '#555' : '#A0AEC0'}
            value={branchName}
            onChangeText={setBranchName}
          />
          <TextInput
            style={{
              backgroundColor: theme === 'dark' ? '#1c1c14' : '#F9FAFB',
              color: theme === 'dark' ? '#FFFFFF' : '#111827',
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 16,
              fontSize: 16,
              fontWeight: '700',
              borderWidth: 1,
              borderColor: theme === 'dark' ? '#3e3e34' : '#E5E7EB',
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            placeholder="Address (optional)"
            placeholderTextColor={theme === 'dark' ? '#555' : '#A0AEC0'}
            value={branchAddress}
            onChangeText={setBranchAddress}
            multiline
          />
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Admin Share (%)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{
                  backgroundColor: theme === 'dark' ? '#1c1c14' : '#F9FAFB',
                  color: theme === 'dark' ? '#FFFFFF' : '#111827',
                  borderRadius: 16,
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  fontSize: 18,
                  fontWeight: '900',
                  borderWidth: 1,
                  borderColor: theme === 'dark' ? '#3e3e34' : '#E5E7EB',
                  flex: 1,
                }}
                placeholder="70"
                placeholderTextColor={theme === 'dark' ? '#555' : '#A0AEC0'}
                value={branchShare}
                onChangeText={setBranchShare}
                keyboardType="decimal-pad"
              />
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginLeft: 12 }}>% of income</Text>
            </View>
            <Text style={{ fontSize: 10, fontWeight: '600', color: theme === 'dark' ? '#555' : '#9CA3AF', marginTop: 6, letterSpacing: 0.5 }}>
              Master admin receives the remaining {branchShare ? `${(100 - parseFloat(branchShare || '70')).toFixed(0)}%` : '30%'}
            </Text>
          </View>
        </View>
      </PremiumPopup>
    </View>
  );
}
