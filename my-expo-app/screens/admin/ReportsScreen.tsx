import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import BranchFilter from '../../components/BranchFilter';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface ReportsScreenProps {
  navigation: NavigationProps;
}

const BG_LIGHT = '#F3F4F6';
const BG_DARK = '#0d0d0a';
const CARD_LIGHT = '#FFFFFF';
const CARD_DARK = '#1a1a18';

const COLORS: Record<string, string> = {
  'bg-pink-500': '#EC4899', 'bg-purple-500': '#A855F7', 'bg-indigo-500': '#6366F1',
  'bg-blue-500': '#3B82F6', 'bg-cyan-500': '#06B6D4', 'bg-teal-500': '#14B8A6',
  'bg-green-500': '#22C55E', 'bg-yellow-500': '#EAB308', 'bg-orange-500': '#F97316',
  'bg-red-500': '#EF4444', 'bg-rose-500': '#F43F5E', 'bg-fuchsia-500': '#D946EF',
  'bg-violet-500': '#8B5CF6', 'bg-sky-500': '#0EA5E9', 'bg-emerald-500': '#10B981',
  'bg-lime-500': '#84CC16', 'bg-amber-500': '#F59E0B', 'bg-brand-pink': '#DB2777',
};

function MiniStatCard({ icon, value, label, color }: any) {
  return (
    <View style={{ backgroundColor: color, borderRadius: 20, width: '31%', marginBottom: 12 }}>
      <View style={{ padding: 12, alignItems: 'center' }}>
        <MaterialCommunityIcons name={icon || 'chart-line'} size={18} color="#FFF" />
        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 4 }}>{value}</Text>
        <Text style={{ color: '#FFF', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginTop: 2 }}>{label}</Text>
      </View>
    </View>
  );
}

export default function ReportsScreen({ navigation }: ReportsScreenProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';
  const isMaster = user?.role === 'master_admin';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedBranchId) params.append('branch_id', selectedBranchId);
    const q = params.toString();
    api.get(`/reports${q ? `?${q}` : ''}`).then(res => {
      setReportData(res.data.overview || []);
      setRecentActivity(res.data.recentActivity || []);
    }).catch(err => {
      console.error('Failed to fetch reports:', err);
    }).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  }, [selectedBranchId]);

  const onRefresh = () => { setRefreshing(true); fetchReports(selectedBranchId); };

  const miniCards = reportData.filter((r: any) => !r.title?.toLowerCase().includes('attendance'));
  const attendanceCard = reportData.find((r: any) => r.title?.toLowerCase().includes('attendance'));

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? BG_DARK : BG_LIGHT }}>
      {/* Header */}
      <View style={{ paddingTop: Math.max(insets.top, 16) }} className="px-5 pb-4">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: isDark ? '#25251d' : CARD_LIGHT,
              width: 44, height: 44, borderRadius: 14,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: isDark ? '#333' : '#F59E0B20',
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={isDark ? '#FFF' : '#F59E0B'} />
          </TouchableOpacity>
          <View style={{ backgroundColor: '#F59E0B', width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: isDark ? '#333' : '#FFF' }}>
            <MaterialCommunityIcons name="chart-pie" size={26} color="white" />
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <View>
            <Text style={{ color: isDark ? '#FFF' : '#111' }} className="text-3xl font-black tracking-tighter">Reports</Text>
            <Text style={{ color: '#DB2777' }} className="text-base font-black">School Intelligence</Text>
          </View>
          {isMaster && (
            <View style={{ minWidth: 120 }}>
              <BranchFilter selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} />
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={{ color: isDark ? '#FFF' : '#111' }} className="mt-4 font-black uppercase text-[10px] tracking-[4px]">Loading...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
        >
          {/* Mini stat cards — 3-col grid */}
          {miniCards.length > 0 && (
            <View className="flex-row flex-wrap justify-between" style={{ marginTop: 4 }}>
              {miniCards.map((r: any) => (
                <MiniStatCard
                  key={r.id}
                  icon={r.icon}
                  value={r.value}
                  label={r.title}
                  color={COLORS[r.color] || '#F59E0B'}
                />
              ))}
            </View>
          )}

          {/* Attendance card */}
          {attendanceCard && (
            <View style={{ backgroundColor: '#1E3A5F', borderRadius: 28, marginTop: 16, marginBottom: 8, overflow: 'hidden' }}>
              <View style={{ padding: 20 }}>
                <View className="flex-row items-center justify-between mb-4">
                  <View style={{ backgroundColor: '#2B4A6F', width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="account-multiple-check" size={26} color="#FFF" />
                  </View>
                  {attendanceCard.subtitle && (
                    <View style={{ backgroundColor: '#2B4A6F', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 }}>
                      <Text style={{ color: '#F59E0B', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>{attendanceCard.subtitle}</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-end justify-between mb-4">
                  <View>
                    <Text style={{ color: '#FFF' }} className="text-[10px] font-black uppercase tracking-[3px] mb-1">{attendanceCard.title}</Text>
                    <View className="flex-row items-baseline">
                      <Text style={{ color: '#FFF' }} className="text-5xl font-black tracking-tighter">{attendanceCard.value}</Text>
                      {attendanceCard.change && (
                        <Text style={{ color: '#22C55E', fontSize: 16, fontWeight: '900', marginLeft: 8 }}>{attendanceCard.change}</Text>
                      )}
                    </View>
                  </View>
                </View>
                <View style={{ height: 8, backgroundColor: '#2B4A6F', borderRadius: 4 }}>
                  <View style={{ width: typeof attendanceCard.value === 'number' ? `${attendanceCard.value}%` : '85%', height: '100%', backgroundColor: '#22C55E', borderRadius: 4 }} />
                </View>
              </View>
            </View>
          )}

          {/* Recent Activity */}
          <View style={{ marginTop: 20 }}>
            <View className="flex-row items-center justify-between mb-4 px-1">
              <Text style={{ color: isDark ? '#FFF' : '#111' }} className="text-lg font-black tracking-tighter">Recent Activity</Text>
              <MaterialCommunityIcons name="history" size={18} color={isDark ? '#FFF' : '#111'} />
            </View>
            <View style={{
              backgroundColor: isDark ? CARD_DARK : CARD_LIGHT,
              borderRadius: 28, padding: 20,
              borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB',
            }}>
              {recentActivity.length > 0 ? (
                recentActivity.map((a: any, i: number) => {
                  const cardColor = COLORS[a.color] || '#F59E0B';
                  return (
                    <TouchableOpacity key={i} activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        marginBottom: i !== recentActivity.length - 1 ? 16 : 0,
                        borderRadius: 16, padding: 12,
                      }}
                    >
                      <View style={{ backgroundColor: cardColor, width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <MaterialCommunityIcons name={a.icon || 'star-outline'} size={20} color="white" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: isDark ? '#FFF' : '#111', fontSize: 14, fontWeight: '900' }}>{a.title}</Text>
                        <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 12, fontWeight: '700', marginTop: 2 }}>{a.description}</Text>
                        <Text style={{ color: cardColor, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 }}>{a.time}</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? '#FFF' : '#111'} style={{ alignSelf: 'center' }} />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View className="items-center py-10">
                  <MaterialCommunityIcons name="radar" size={40} color={isDark ? '#FFF' : '#111'} />
                  <Text style={{ color: isDark ? '#FFF' : '#111' }} className="mt-3 font-black uppercase tracking-widest text-[9px]">No Activity</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
