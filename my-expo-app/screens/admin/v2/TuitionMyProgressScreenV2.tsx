import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../../contexts/AuthContext';
import api, { getMediaUrl } from '../../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';

const TEST = '#8B5CF6';
const PROGRESS = '#F59E0B';

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

const REPORT_ICON = require('../../../assets/icons/exam-results.png');

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

interface Attachment { path?: string; uri?: string; name?: string; type?: string; size?: number; }

const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseYMD = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const formatDisplay = (ymd: string) => {
  try { return parseYMD(ymd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ymd; }
};

const formatSize = (b: number) => { if (b < 1024) return `${b}B`; if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`; return `${(b / 1048576).toFixed(1)}MB`; };

export default function TuitionMyProgressScreenV2({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'test' | 'progress'>('test');
  const [preview, setPreview] = useState<{ uri: string; name: string; type: string } | null>(null);

  const themeColor = tab === 'test' ? TEST : PROGRESS;
  const themeSoft = tab === 'test' ? 'rgba(139,92,246,' : 'rgba(245,158,11,';

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get(`/progress?student_id=${user.id}`);
      const d: any[] = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setRecords(d);
    } catch {}
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = records.filter(r => r.type === tab);
  const sorted = [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const byDate = new Map<string, any[]>();
  sorted.forEach(r => {
    const k = r.date || '';
    if (!byDate.has(k)) byDate.set(k, []);
    byDate.get(k)!.push(r);
  });

  const openFile = (a: Attachment) => {
    const uri = getMediaUrl((a as any).file_url || (a as any).url || a.path || a.uri) || '';
    const name = a.name || 'attachment';
    const type = a.type || 'application/octet-stream';
    setPreview({ uri, name, type });
  };
  const hasImgExt = (s: string) => !!s.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)$/i);
  const isPdf = (a: { uri?: string; name?: string; type?: string }) =>
    /\.pdf$/i.test(a.name || '') || (a.type || '').includes('pdf');
  const isImg = (a: { uri?: string; name?: string; type?: string }) =>
    (a.type || '').startsWith('image/') || hasImgExt(a.uri || '') || hasImgExt(a.name || '');

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F9F6', alignItems: 'center', justifyContent: 'center' }}>
        <AuroraBackground />
        <ActivityIndicator size="large" color={themeColor} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: Math.max(insets.top, 56) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: TEXT_MUTED }}>Tuition</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 2, letterSpacing: -0.5 }}>My Progress</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 }}>Test marks, grades & test papers</Text>
            </View>
            <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={REPORT_ICON} style={{ width: 46, height: 46 }} resizeMode="contain" />
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 18, padding: 5 }}>
            {(['test', 'progress'] as const).map(m => {
              const c = m === 'test' ? TEST : PROGRESS;
              const active = tab === m;
              return (
                <TouchableOpacity key={m} activeOpacity={0.8} onPress={() => setTab(m)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: active ? c : 'transparent' }}>
                  <MaterialCommunityIcons name={m === 'test' ? 'clipboard-check-outline' : 'chart-line'} size={18} color={active ? 'white' : '#6B7280'} />
                  <Text style={{ fontWeight: '900', fontSize: 14, marginLeft: 8, color: active ? 'white' : '#6B7280' }}>
                    {m === 'test' ? 'Test Marks' : 'Progress'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {byDate.size === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
              <MaterialCommunityIcons name="file-chart-outline" size={52} color="#CBD5E1" />
              <Text style={{ color: TEXT_MUTED, fontWeight: '800', fontSize: 15, marginTop: 16 }}>
                No {tab === 'test' ? 'test marks' : 'progress'} yet
              </Text>
              <Text style={{ color: '#B0B7C3', fontSize: 12, marginTop: 4 }}>Your teacher hasn't posted anything</Text>
            </View>
          ) : (
            Array.from(byDate.entries()).map(([date, items]) => (
              <View key={date} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <MaterialCommunityIcons name="calendar-blank" size={16} color={themeColor} />
                  <Text style={{ fontSize: 13, fontWeight: '900', color: TEXT_PRIMARY, marginLeft: 6 }}>{formatDisplay(date)}</Text>
                  <View style={{ marginLeft: 'auto', backgroundColor: themeSoft + '0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: themeColor }}>{items.length} record{items.length !== 1 ? 's' : ''}</Text>
                  </View>
                </View>

                {items.map((h) => {
                  const atts: Attachment[] = h.attachments || [];
                  return (
                    <View key={h.id} style={{ borderRadius: 22, padding: 16, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: themeSoft + '0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <MaterialCommunityIcons name="book-open-variant" size={19} color={themeColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '900', fontSize: 15, color: TEXT_PRIMARY }}>{h.subject?.name || h.subject || 'Subject'}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 1 }}>{formatDisplay(h.date)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontWeight: '900', fontSize: 18, color: themeColor }}>
                            {h.marks != null && h.marks !== '' ? `${h.marks}${h.max_marks != null && h.max_marks !== '' ? '/' + h.max_marks : ''}` : (h.grade || '—')}
                          </Text>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_MUTED }}>{h.marks != null && h.marks !== '' ? 'MARKS' : 'STATUS'}</Text>
                        </View>
                      </View>

                      {h.grade && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <MaterialCommunityIcons name="school" size={14} color={themeColor} />
                          <Text style={{ fontSize: 12, fontWeight: '800', color: TEXT_SECONDARY, marginLeft: 6 }}>Grade: <Text style={{ color: themeColor }}>{h.grade}</Text></Text>
                        </View>
                      )}

                      {h.comments ? (
                        <View style={{ flexDirection: 'row', backgroundColor: themeSoft + '0.06)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                          <MaterialCommunityIcons name="comment-text" size={15} color={themeColor} style={{ marginTop: 1 }} />
                          <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_SECONDARY, marginLeft: 8, lineHeight: 18, flex: 1 }}>{h.comments}</Text>
                        </View>
                      ) : null}

                      {atts.length > 0 && (
                        <View style={{ marginTop: 2 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: TEXT_SECONDARY, marginBottom: 8 }}>TEST PAPER ({atts.length})</Text>
                          {atts.map((a, idx) => {
                            const fileName = a.name || 'paper';
                            const pdf = isPdf(a);
                            const img = isImg(a);
                            const icon = pdf ? 'file-pdf-box' : (img ? 'file-image' : 'file');
                            const col = pdf ? '#EF4444' : (img ? '#8B5CF6' : '#6B7280');
                            return (
                              <TouchableOpacity key={idx} activeOpacity={0.7} onPress={() => openFile(a)}
                                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: '#F3F4F6' }}>
                                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: col + '18', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                  <MaterialCommunityIcons name={icon as any} size={18} color={col} />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY }} numberOfLines={1}>{fileName}</Text>
                                  {a.size ? <Text style={{ fontSize: 9, fontWeight: '600', color: TEXT_MUTED, marginTop: 1 }}>{formatSize(a.size)}</Text> : null}
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: themeSoft + '0.12)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 }}>
                                  <MaterialCommunityIcons name="eye" size={14} color={themeColor} />
                                  <Text style={{ fontSize: 10, fontWeight: '800', color: themeColor, marginLeft: 4 }}>VIEW</Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal transparent visible={!!preview} onRequestClose={() => setPreview(null)} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Math.max(insets.top, 12) }}>
            <TouchableOpacity onPress={() => setPreview(null)} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, flex: 1, marginHorizontal: 12 }} numberOfLines={1}>{preview?.name}</Text>
            <TouchableOpacity onPress={() => setPreview(null)} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            {preview ? (
              isImg(preview) ? (
                <Image source={{ uri: preview.uri }} resizeMode="contain" style={{ flex: 1 }} />
              ) : (
                <WebView source={{ uri: preview.uri }} style={{ flex: 1 }} />
              )
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="file-outline" size={56} color="#6B7280" />
                <Text style={{ color: '#9CA3AF' }}>No file</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
