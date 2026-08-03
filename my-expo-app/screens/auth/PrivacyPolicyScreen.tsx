import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PrivacyPolicyScreen = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  const primary = '#E91E63';

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Decorative background circles */}
      <View style={{ position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: '#FDF2F8', opacity: 0.9 }} />
      <View style={{ position: 'absolute', bottom: -100, left: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: '#FFF7ED', opacity: 0.8 }} />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 30 : 0),
        paddingBottom: 12,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, borderRadius: 20, backgroundColor: '#FFF0F5' }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827' }}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Banner */}
        <View style={{ alignItems: 'center', paddingHorizontal: 24, marginBottom: 24, marginTop: 8 }}>
          <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }}>
            <LinearGradient colors={[primary, '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="shield-check" size={42} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginTop: 14 }}>Your Privacy Matters</Text>
          <View style={{ backgroundColor: '#FFF0F5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: primary, letterSpacing: 1, textTransform: 'uppercase' }}>Last Updated: March 24, 2026</Text>
          </View>
        </View>

        {[
          {
            icon: 'information-outline',
            title: '1. Introduction',
            body: 'Welcome to TN HappyKids. We are committed to protecting the privacy of our students, parents, and teachers. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.',
          },
          {
            icon: 'database-outline',
            title: '2. Information We Collect',
            body: 'We collect information that is necessary for school management and communication:',
            bullets: [
              'User credentials (Username/Password) provided by the school.',
              'Student information including names, attendance records, and activity logs.',
              'Media files (Photos) uploaded by teachers to share classroom activities with parents.',
              'Device information for push notifications and app security.',
            ],
          },
          {
            icon: 'tune-variant',
            title: '3. How We Use Information',
            body: 'The information collected is used solely for school-related purposes:',
            bullets: [
              'To track student attendance and daily progress.',
              'To facilitate communication between school staff and parents.',
              'To provide secure access to school resources and updates.',
              'To send important notifications regarding school timing, holidays, or emergencies.',
            ],
          },
          {
            icon: 'lock-outline',
            title: '4. Data Security',
            body: 'We implement industry-standard security measures to protect your data. Access to student information is restricted to authorized school personnel and the respective parents only. All data is stored on secure servers with encryption.',
          },
          {
            icon: 'human-child',
            title: '5. Children\u2019s Privacy',
            body: 'CHK is a playschool management app. We do not allow children to create accounts or interact with the app directly. All data related to children is managed by adult teachers and parents. We conform to international standards regarding children\u2019s data privacy.',
          },
          {
            icon: 'link-variant',
            title: '6. Third-Party Services',
            body: 'We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. We only use trusted services for app functionality (like push notifications) which do not use your data for advertising.',
          },
          {
            icon: 'video-outline',
            title: '8. Live Streaming',
            body: 'Our application provides a highly secure live streaming feature for classrooms. This service is provided strictly for the following purposes:',
            bullets: [
              'To allow authorized parents only to observe their child\u2019s learning environment and classroom activities.',
              'To ensure transparency and student safety during school hours.',
            ],
            extra: 'Access to live streams is encrypted and requires valid parent credentials. Sharing stream access or recording student activities is strictly prohibited.',
          },
        ].map((section, i) => (
          <View key={i} style={{ paddingHorizontal: 24, marginBottom: 20 }}>
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#F5EDF0',
              padding: 18,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 1,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF0F5', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <MaterialCommunityIcons name={section.icon as any} size={18} color={primary} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', flex: 1 }}>{section.title}</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22 }}>{section.body}</Text>
              {section.bullets?.map((b, bi) => (
                <View key={bi} style={{ flexDirection: 'row', marginTop: 8, paddingRight: 10 }}>
                  <Text style={{ fontSize: 14, color: primary, marginRight: 10, fontWeight: '900' }}>•</Text>
                  <Text style={{ fontSize: 13.5, color: '#475569', lineHeight: 21, flex: 1 }}>{b}</Text>
                </View>
              ))}
              {section.extra ? (
                <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22, marginTop: 10 }}>{section.extra}</Text>
              ) : null}
            </View>
          </View>
        ))}

        {/* Contact Us */}
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <LinearGradient
            colors={[primary, '#D81B60', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, padding: 20, elevation: 4, shadowColor: primary, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialCommunityIcons name="phone-message" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>9. Contact Us</Text>
            </View>
            <Text style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.9)', lineHeight: 20 }}>
              If you have any questions regarding this Privacy Policy, you may contact the school office at:
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
              <Image source={require('../../assets/icon.png')} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} resizeMode="contain" />
              <View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#FFFFFF' }}>TN HappyKids</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>Phone: +91 89251 05109</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={{ padding: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F5EDF0', paddingBottom: Math.max(insets.bottom, 14) }}>
        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700' }}>© 2026 TN HappyKids. All Rights Reserved.</Text>
      </View>
    </View>
  );
};

export default PrivacyPolicyScreen;
