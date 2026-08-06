import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Image, Dimensions, StyleSheet, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProps;
}

const BORDER_RADIUS = 28;
const TEXT_PRIMARY = '#1F2D28';
const TEXT_SECONDARY = '#4A5B53';
const TEXT_MUTED = '#7A8A82';
const ACCENT = '#F59E0B';
const PINK = '#DB2777';

const ICON_EXAM_RESULTS = require('../../../assets/icons/exam-results.png');
const ICON_CALENDAR = require('../../../assets/icons/calendar.png');
const ICON_NOTEBOOK = require('../../../assets/icons/note-book.png');

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

export default function ViewSubmissionsScreenV2({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  const batches = ['All Classes', 'Morning Batch', 'Evening Batch', 'Weekend Batch'];

  const onDateChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F9F6' }}>
      <AuroraBackground />

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
          <View style={{ backgroundColor: 'rgba(219,39,119,0.12)', width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={ICON_EXAM_RESULTS} style={{ width: 32, height: 32 }} resizeMode="contain" />
          </View>
        </View>
        <View>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>View</Text>
          <Text style={{ color: PINK, fontSize: 14, fontWeight: '800' }}>Submissions</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={false} tintColor="#F59E0B" colors={['#F59E0B']} />}
      >
        <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: BORDER_RADIUS, padding: 18, marginTop: 4, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ backgroundColor: 'rgba(219,39,119,0.12)', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Image source={ICON_CALENDAR} style={{ width: 22, height: 22 }} resizeMode="contain" />
            </View>
            <View>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' }}>Filter Submissions</Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '600', marginTop: 2 }}>Select date and class</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowDatePicker(true)}
            style={{
              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
              backgroundColor: 'rgba(247,249,246,0.7)', borderRadius: 18,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
              height: 52, marginBottom: 12,
            }}
          >
            <MaterialCommunityIcons name="calendar" size={18} color={PINK} />
            <Text style={{ flex: 1, fontWeight: '700', fontSize: 14, marginLeft: 10, color: TEXT_PRIMARY }}>{formatDate(selectedDate)}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={TEXT_MUTED} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
              backgroundColor: 'rgba(247,249,246,0.7)', borderRadius: 18,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
              height: 52,
            }}
          >
            <MaterialCommunityIcons name="google-classroom" size={18} color={PINK} />
            <Text style={{ flex: 1, fontWeight: '700', fontSize: 14, marginLeft: 10, color: selectedBatch ? TEXT_PRIMARY : TEXT_MUTED }}>
              {selectedBatch || 'Select Class'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} />
        )}

        <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: BORDER_RADIUS, padding: 24, alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(219,39,119,0.12)', width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Image source={ICON_NOTEBOOK} style={{ width: 40, height: 40 }} resizeMode="contain" />
          </View>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: '800' }}>No Submissions Yet</Text>
          <Text style={{ color: TEXT_MUTED, fontSize: 13, fontWeight: '600', marginTop: 8, textAlign: 'center', maxWidth: 280, lineHeight: 19 }}>
            Submissions will appear here once students start submitting their homework.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
