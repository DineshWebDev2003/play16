import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PrivacyPolicyScreen = ({ navigation }: { navigation: any }) => {

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={['#FDF2F8', '#FFFFFF']}
          style={styles.banner}
        >
          <MaterialCommunityIcons name="shield-check" size={48} color="#F59E0B" />
          <Text style={styles.bannerTitle}>Your Privacy Matters</Text>
          <Text style={styles.bannerSubtitle}>Last Updated: March 24, 2026</Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.text}>
            Welcome to CHK (Chithode Happykids). We are committed to protecting the privacy of our students, parents, and teachers. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.text}>
            We collect information that is necessary for school management and communication:
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>User credentials (Username/Password) provided by the school.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Student information including names, attendance records, and activity logs.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Media files (Photos) uploaded by teachers to share classroom activities with parents.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Device information for push notifications and app security.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Information</Text>
          <Text style={styles.text}>
            The information collected is used solely for school-related purposes:
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>To track student attendance and daily progress.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>To facilitate communication between school staff and parents.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>To provide secure access to school resources and updates.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>To send important notifications regarding school timing, holidays, or emergencies.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.text}>
            We implement industry-standard security measures to protect your data. Access to student information is restricted to authorized school personnel and the respective parents only. All data is stored on secure servers with encryption.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Children's Privacy</Text>
          <Text style={styles.text}>
            CHK is a playschool management app. We do not allow children to create accounts or interact with the app directly. All data related to children is managed by adult teachers and parents. We conform to international standards regarding children's data privacy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Third-Party Services</Text>
          <Text style={styles.text}>
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. We only use trusted services for app functionality (like push notifications) which do not use your data for advertising.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Live Streaming</Text>
          <Text style={styles.text}>
            Our application provides a highly secure live streaming feature for classrooms. This service is provided strictly for the following purposes:
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>To allow authorized parents only to observe their child's learning environment and classroom activities.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>To ensure transparency and student safety during school hours.</Text>
          </View>
          <Text style={[styles.text, { marginTop: 8 }]}>
            Access to live streams is encrypted and requires valid parent credentials. Sharing stream access or recording student activities is strictly prohibited.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions regarding this Privacy Policy, you may contact the school office at:
          </Text>
          <Text style={[styles.text, { fontWeight: '700', color: '#F59E0B', marginTop: 8 }]}>
            Chithode Happykids PlaySchool
          </Text>
          <Text style={styles.text}>Phone: +91 97877 51430</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Acceptable Use Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Chithode Happykids. All Rights Reserved.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginTop: Platform.OS === 'android' ? 30 : 0,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  banner: {
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E1B4B',
    marginTop: 12,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginTop: 8,
    paddingRight: 20,
  },
  bullet: {
    fontSize: 15,
    color: '#F59E0B',
    marginRight: 10,
    fontWeight: '900',
  },
  bulletText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    flex: 1,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  }
});

export default PrivacyPolicyScreen;
