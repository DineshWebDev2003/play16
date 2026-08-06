import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../services/api';
import BranchFilter from '../../../components/BranchFilter';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface ReportsScreenProps {
  navigation: NavigationProps;
}

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';
const BORDER_RADIUS = 28;

const COLORS: Record<string, string> = {
  'bg-pink-500': '#EC4899', 'bg-purple-500': '#A855F7', 'bg-indigo-500': '#6366F1',
  'bg-blue-500': '#3B82F6', 'bg-cyan-500': '#06B6D4', 'bg-teal-500': '#14B8A6',
  'bg-green-500': '#22C55E', 'bg-yellow-500': '#EAB308', 'bg-orange-500': '#F97316',
  'bg-red-500': '#EF4444', 'bg-rose-500': '#F43F5E', 'bg-fuchsia-500': '#D946EF',
  'bg-violet-500': '#8B5CF6', 'bg-sky-500': '#0EA5E9', 'bg-emerald-500': '#10B981',
  'bg-lime-500': '#84CC16', 'bg-amber-500': '#F59E0B', 'bg-brand-pink': '#DB2777',
};

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

// ─── Aurora Glass background ────────────────────────────────────────────────────
function AuroraBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#F7F9F6', '#F2FAF5', '#EEFDFC', '#F7F9F6']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <RadialGlow size={480} color="#DDF8D7" opacity={0.28} style={{ top: -160, left: -160 }} />
      <RadialGlow size={420} color="#DDFBFF" opacity={0.25} style={{ top: -140, left: SCREEN_WIDTH / 2 - 210 }} />
      <RadialGlow size={520} color="#F8FFD8" opacity={0.24} style={{ bottom: -180, left: -180 }} />
      <RadialGlow size={450} color="#EAF5FF" opacity={0.18} style={{ top: SCREEN_HEIGHT * 0.4 - 225, right: -180 }} />
    </View>
  );
}

function MiniStatCard({ icon, value, label, color }: any) {
  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 20, width: '31%', marginBottom: 12 }}>
      <View style={{ padding: 12, alignItems: 'center' }}>
        <View style={{ backgroundColor: color + '1F', width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
          <MaterialCommunityIcons name={icon || 'chart-line'} size={18} color={color} />
        </View>
        <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: '900' }}>{value}</Text>
        <Text style={{ color: TEXT_MUTED, fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginTop: 2 }}>{label}</Text>
      </View>
    </View>
  );
}

export default function ReportsScreenV2({ navigation }: ReportsScreenProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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

  const onRefresh = () => { setRefreshing(true); setSelectedBranchId(prev => prev); };

  const miniCards = reportData.filter((r: any) => !r.title?.toLowerCase().includes('attendance'));
  const attendanceCard = reportData.find((r: any) => r.title?.toLowerCase().includes('attendance'));

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

      {/* Header */}
      <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              width: 50, height: 50, borderRadius: 16,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="chart-pie" size={26} color={ACCENT} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>Reports</Text>
            <Text style={{ color: '#DB2777', fontSize: 14, fontWeight: '800' }}>School Intelligence</Text>
          </View>
          {isMaster && (
            <View style={{ minWidth: 120 }}>
              <BranchFilter selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} />
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={{ color: TEXT_SECONDARY, marginTop: 16, fontWeight: '900', textTransform: 'uppercase', fontSize: 10, letterSpacing: 4 }}>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />}
        >
          {/* Mini stat cards — 3-col grid */}
          {miniCards.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 4 }}>
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
            <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: BORDER_RADIUS, marginTop: 16, marginBottom: 8, overflow: 'hidden' }}>
              <LinearGradient
                colors={['#1E3A5F', '#1E3A5F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 2 }}
              >
                <View style={{ backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: BORDER_RADIUS - 2, padding: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ backgroundColor: 'rgba(30,58,95,0.1)', width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="account-multiple-check" size={26} color="#1E3A5F" />
                    </View>
                    {attendanceCard.subtitle && (
                      <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 }}>
                        <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>{attendanceCard.subtitle}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View>
                      <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 4 }}>{attendanceCard.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={{ color: TEXT_PRIMARY, fontSize: 42, fontWeight: '700', letterSpacing: -1 }}>{attendanceCard.value}</Text>
                        {attendanceCard.change && (
                          <Text style={{ color: '#22C55E', fontSize: 16, fontWeight: '900', marginLeft: 8 }}>{attendanceCard.change}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={{ height: 8, backgroundColor: 'rgba(247,249,246,0.9)', borderRadius: 4 }}>
                    <View style={{ width: typeof attendanceCard.value === 'number' ? `${attendanceCard.value}%` : '85%', height: '100%', backgroundColor: '#22C55E', borderRadius: 4 }} />
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Recent Activity */}
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: '600', letterSpacing: -0.3 }}>Recent Activity</Text>
              <MaterialCommunityIcons name="history" size={18} color={TEXT_SECONDARY} />
            </View>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: BORDER_RADIUS, padding: 16,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
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
                        backgroundColor: 'rgba(247,249,246,0.6)',
                      }}
                    >
                      <View style={{ backgroundColor: cardColor + '1F', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <MaterialCommunityIcons name={a.icon || 'star-outline'} size={20} color={cardColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: '700' }}>{a.title}</Text>
                        <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '600', marginTop: 2 }}>{a.description}</Text>
                        <Text style={{ color: cardColor, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 }}>{a.time}</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={TEXT_MUTED} style={{ alignSelf: 'center' }} />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <MaterialCommunityIcons name="radar" size={40} color={TEXT_MUTED} />
                  <Text style={{ color: TEXT_MUTED, marginTop: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 9 }}>No Activity</Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}
