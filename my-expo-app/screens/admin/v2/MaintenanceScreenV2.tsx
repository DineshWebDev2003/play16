import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
  Modal, Switch, TextInput, StyleSheet, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { fetchMaintenanceStatus } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props { navigation: { navigate: (s: string) => void; goBack: () => void } }

const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';
const BORDER_RADIUS = 22;

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

export default function MaintenanceScreenV2({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<string | null>(null);
  const [termVisible, setTermVisible] = useState(false);
  const [termTitle, setTermTitle] = useState('');
  const [termLines, setTermLines] = useState<string[]>([]);
  const [termOk, setTermOk] = useState(false);
  const [maintenanceOn, setMaintenanceOn] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  React.useEffect(() => {
    (async () => {
      const status = await fetchMaintenanceStatus();
      setMaintenanceOn(!!status.enabled);
      setMaintenanceMsg(status.message || '');
    })();
  }, []);

  const showTerminal = (title: string, raw: string, ok: boolean) => {
    setTermTitle(title);
    setTermOk(ok);
    setTermLines([
      '$ php artisan ' + title.toLowerCase(),
      '',
      ...String(raw || '').split(/\r?\n/).map(l => l.trimEnd()),
      '',
      ok ? '✓ command finished successfully.' : '✗ command exited with an error.',
    ]);
    setTermVisible(true);
  };

  const runMigrate = async () => {
    setBusy('migrate');
    setTermLines(['$ php artisan migrate --force', '', 'Running...']);
    setTermVisible(true);
    setTermTitle('migrate --force');
    try {
      const res = await api.post('/maintenance/migrate');
      showTerminal('migrate --force', res.data?.output || res.data?.message || 'No output.', true);
    } catch (e: any) {
      showTerminal('migrate --force', e?.response?.data?.message || e?.message || 'Could not run migrations.', false);
    } finally {
      setBusy(null);
    }
  };

  const runStorageCheck = async () => {
    setBusy('storage');
    setTermLines(['$ php artisan storage:link', '', 'Checking...']);
    setTermVisible(true);
    setTermTitle('storage:link');
    try {
      const res = await api.get('/maintenance/storage-check');
      showTerminal('storage:link', res.data?.message || 'Check complete.', res.data?.linked === true);
    } catch (e: any) {
      showTerminal('storage:link', e?.response?.data?.message || e?.message || 'Storage check failed.', false);
    } finally {
      setBusy(null);
    }
  };

  const runStorageFix = async () => {
    setBusy('storage-fix');
    setTermLines(['$ php artisan storage:fix', '', 'Repairing public/storage...']);
    setTermVisible(true);
    setTermTitle('storage:fix');
    try {
      const res = await api.post('/maintenance/storage-fix');
      const msg = res.data?.message || 'Storage fixed.';
      const removed = res.data?.removed === true;
      showTerminal('storage:fix', msg, removed);
    } catch (e: any) {
      showTerminal('storage:fix', e?.response?.data?.message || e?.message || 'Storage fix failed.', false);
    } finally {
      setBusy(null);
    }
  };

  const toggleMaintenance = async (value: boolean) => {
    setBusy('maintenance');
    try {
      const res = await api.post('/maintenance/toggle', {
        enabled: value,
        message: maintenanceMsg,
      });
      setMaintenanceOn(value);
      Alert.alert('Maintenance Mode', res.data?.message || 'Updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Could not update maintenance mode.');
    } finally {
      setBusy(null);
    }
  };

  const card = (icon: string, title: string, desc: string, color: string, action: string, onPress: () => void, buttonLabel: string) => (
    <View style={{
      marginBottom: 16, borderRadius: BORDER_RADIUS, padding: 20,
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ backgroundColor: color + '1A', width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: TEXT_PRIMARY }}>{title}</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 3, lineHeight: 16 }}>{desc}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onPress}
        disabled={busy !== null}
        activeOpacity={0.85}
        style={{ marginTop: 16, height: 46, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
      >
        {busy === action ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>{buttonLabel}</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Math.max(insets.top, 20), paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={{ marginLeft: 12, fontSize: 18, fontWeight: '900', color: TEXT_PRIMARY }}>System Maintenance</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16, borderRadius: 18, marginBottom: 18, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' }}>
          <Text style={{ fontSize: 11, fontWeight: '900', color: '#B45309', textTransform: 'uppercase', letterSpacing: 1 }}>For hosts without terminal/SSH access</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_SECONDARY, marginTop: 6, lineHeight: 17 }}>
            You can run migrations and fix storage linking straight from the app — no command line needed. These actions are master-admin only and open a terminal window showing the result.
          </Text>
        </View>

        {user?.role === 'master_admin' && (
          <View style={{
            marginBottom: 16, borderRadius: BORDER_RADIUS, padding: 20,
            backgroundColor: maintenanceOn ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.92)',
            borderWidth: 1, borderColor: maintenanceOn ? 'rgba(220,38,38,0.35)' : 'rgba(255,255,255,0.6)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: maintenanceOn ? '#DC2626' : '#10B981', width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={maintenanceOn ? 'progress-wrench' : 'shield-check'} size={24} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: TEXT_PRIMARY }}>Maintenance Mode</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginTop: 3 }}>
                  {maintenanceOn ? 'ON — all other users are blocked with the maintenance popup.' : 'OFF — everyone can use the app normally.'}
                </Text>
              </View>
              <Switch
                value={maintenanceOn}
                onValueChange={toggleMaintenance}
                disabled={busy !== null}
                trackColor={{ false: '#D1D5DB', true: '#DC2626' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TextInput
              value={maintenanceMsg}
              onChangeText={setMaintenanceMsg}
              placeholder="Optional message shown to users (e.g. 'Back by 6 PM')"
              placeholderTextColor={TEXT_MUTED}
              multiline
              style={{
                marginTop: 14, minHeight: 64, borderRadius: 12, padding: 12,
                backgroundColor: 'rgba(247,249,246,0.9)',
                color: TEXT_PRIMARY, fontSize: 13, fontWeight: '600',
                borderWidth: 1, borderColor: 'rgba(122,138,130,0.25)',
                textAlignVertical: 'top',
              }}
            />
          </View>
        )}

        {card('database-sync', 'Run Database Migrations', 'Apply any pending database schema changes (equivalent to php artisan migrate --force).', '#7C3AED', 'migrate', runMigrate, 'RUN MIGRATIONS')}
        {card('folder-check', 'Check / Fix Storage Link', 'Verify uploaded files are reachable. Attempts to create public/storage. Files also auto-serve via the web route without a link.', '#0D9488', 'storage', runStorageCheck, 'CHECK STORAGE')}
        {card('broken-image', 'Fix Image 403 Errors', 'If uploaded images return 403, removes the stale public/storage entry so the web route streams files from disk. Safe; no files are deleted.', '#DC2626', 'storage-fix', runStorageFix, 'FIX STORAGE')}
      </ScrollView>

      <Modal visible={termVisible} transparent animationType="fade" onRequestClose={() => setTermVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{
            width: '100%', maxHeight: '85%',
            backgroundColor: '#0D1117', borderRadius: 16, overflow: 'hidden',
            borderWidth: 1, borderColor: termOk ? '#238636' : '#F85149',
          }}>
            {/* Title bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#161B22' }}>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF5F56', marginRight: 6 }} />
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFBD2E', marginRight: 6 }} />
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#27C93F' }} />
              </View>
              <Text style={{ color: '#C9D1D9', fontSize: 12, fontFamily: 'monospace', marginLeft: 12, fontWeight: '700' }}>
                {termOk ? 'bash — success' : 'bash — error'}
              </Text>
              <View style={{ flex: 1 }} />
              {busy !== null && <ActivityIndicator color="#F59E0B" size="small" />}
              <TouchableOpacity onPress={() => setTermVisible(false)} style={{ marginLeft: 12, padding: 2 }}>
                <Text style={{ color: '#8B949E', fontSize: 16, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Terminal body */}
            <ScrollView
              showsVerticalScrollIndicator
              style={{ backgroundColor: '#0D1117', maxHeight: 360, padding: 14 }}
            >
              {termLines.map((line, i) => {
                const isCmd = line.startsWith('$ ');
                const isOk = line.startsWith('✓');
                const isErr = line.startsWith('✗');
                return (
                  <Text key={i} style={{
                    color: isErr ? '#F85149' : isOk ? '#3FB950' : isCmd ? '#58A6FF' : '#C9D1D9',
                    fontFamily: 'monospace', fontSize: 12, lineHeight: 18,
                  }}>
                    {line}
                  </Text>
                );
              })}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: '#3FB950', fontFamily: 'monospace', fontSize: 12 }}>➜&nbsp;</Text>
                <Text style={{ color: '#58A6FF', fontFamily: 'monospace', fontSize: 12 }}>~</Text>
                <Text style={{ backgroundColor: '#C9D1D9', width: 8, height: 14, marginLeft: 4 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
