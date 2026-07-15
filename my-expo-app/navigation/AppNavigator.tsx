import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, BackHandler, Alert, ActivityIndicator, Animated, Easing, Dimensions, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, savePushToken } from '../services/notifications';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminQuickActionScreen from '../screens/admin/AdminQuickActionScreen';
import AdminAccountScreen from '../screens/admin/AdminAccountScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import UserManagementScreenV2 from '../screens/admin/UserManagementScreenV2';
import FeesManagementScreen from '../screens/admin/FeesManagementScreen';
import AnnouncementsScreen from '../screens/admin/AnnouncementsScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import BackupScreen from '../screens/admin/BackupScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';
import StudentListScreen from '../screens/admin/StudentListScreen';
import StudentDetailScreen from '../screens/admin/StudentDetailScreen';
import IncomeExpenseScreen from '../screens/admin/IncomeExpenseScreen';
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentQuickActionScreen from '../screens/student/StudentQuickActionScreen';
import StudentAccountScreen from '../screens/student/StudentAccountScreen';
import AttendanceScreen from '../screens/student/AttendanceScreen';
import ActivityFeedScreen from '../screens/student/ActivityFeedScreen';
import LiveCameraScreen from '../screens/student/LiveCameraScreen';
import HomeworkScreen from '../screens/student/HomeworkScreen';
import TimetableScreen from '../screens/student/TimetableScreen';
import EmergencyContactScreen from '../screens/student/EmergencyContactScreen';
import MyFeesScreen from '../screens/student/MyFeesScreen';
import RewardsScreen from '../screens/student/RewardsScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import TeacherHomeScreen from '../screens/teacher/TeacherHomeScreen';
import TeacherQuickActionScreen from '../screens/teacher/TeacherQuickActionScreen';
import TeacherAccountScreen from '../screens/teacher/TeacherAccountScreen';
import PostHomeworkScreen from '../screens/teacher/PostHomeworkScreen';
import TakeAttendanceScreen from '../screens/teacher/TakeAttendanceScreen';
import PostActivityScreen from '../screens/admin/PostActivityScreen';
import ViewSubmissionsScreen from '../screens/teacher/ViewSubmissionsScreen';
import ClassScheduleScreen from '../screens/teacher/ClassScheduleScreen';
import ParentMessagesScreen from '../screens/teacher/ParentMessagesScreen';
import MyAttendanceScreen from '../screens/teacher/MyAttendanceScreen';
import StudentAttendanceReportScreen from '../screens/teacher/StudentAttendanceReportScreen';
import TeacherAttendanceReportScreen from '../screens/admin/TeacherAttendanceReportScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import PrivacyPolicyScreen from '../screens/auth/PrivacyPolicyScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
// Master Admin screens
import BranchManagementScreen from '../screens/master_admin/BranchManagementScreen';
import CameraManagementScreen from '../screens/master_admin/CameraManagementScreen';
import SuperAdminHomeScreen from '../screens/master_admin/SuperAdminHomeScreen';
import SuperAdminQuickActionScreen from '../screens/master_admin/SuperAdminQuickActionScreen';
import SuperAdminAccountScreen from '../screens/master_admin/SuperAdminAccountScreen';
import AttendanceSelectionScreen from '../screens/master_admin/AttendanceSelectionScreen';
import StudentInfoScreen from '../screens/master_admin/StudentInfoScreen';

type ScreenType = 'login' | 'privacyPolicy' | 'home' | 'quickAction' | 'account' | 'userManagement' | 'userManagementV2' | 'feesManagement' | 'announcements' | 'reports' | 'backup' | 'settings' | 'attendance' | 'activityFeed' | 'liveCamera' | 'homework' | 'emergencyContact' | 'myFees' | 'rewards' | 'profile' | 'timetable' | 'postHomework' | 'takeAttendance' | 'postActivity' | 'viewSubmissions' | 'classSchedule' | 'parentMessages' | 'studentList' | 'studentDetail' | 'incomeExpense' | 'myAttendance' | 'studentAttendanceReport' | 'teacherAttendanceReport' | 'notificationSettings' | 'branchManagement' | 'cameraManagement' | 'studentInfo';

export default function AppNavigator() {
  const { user, announcements, isLoading } = useAuth();
  const { theme, colors } = useTheme();
  
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [navigationStack, setNavigationStack] = useState<ScreenType[]>(['login']);
  const [params, setParams] = useState<any>(null);
  const [isHomeBlinking, setIsHomeBlinking] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useCallback((screen: ScreenType, resetOrParams: boolean | any = false, screenParams: any = null) => {
    setCurrentScreen(screen);
    const finalParams = typeof resetOrParams === 'object' ? resetOrParams : screenParams;
    setParams(finalParams);
    
    if (resetOrParams === true) {
      setNavigationStack([screen]);
    } else {
      setNavigationStack(prev => [...prev, screen]);
    }
  }, []);

  const goBack = useCallback(() => {
    let handled = false;
    setNavigationStack(prev => {
      if (prev.length > 1) {
        const newStack = [...prev];
        newStack.pop();
        const previousScreen = newStack[newStack.length - 1];
        setCurrentScreen(previousScreen);
        handled = true;
        return newStack;
      }
      return prev;
    });
    return handled;
  }, []);

  const navigation = useMemo(() => ({ navigate, goBack }), [navigate, goBack]);

  // Handle Push Notification Navigation
  useEffect(() => {
    // Handling when notification is tapped
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.screen) {
        // Short delay to ensure navigation state is ready
        setTimeout(() => {
          navigate(data.screen as ScreenType, data.params || null);
        }, 500);
      }
    });

    // Handling when notification is received while app is foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      // You can show a custom alert or just let the system handle it
      console.log('Notification received in foreground:', notification.request.content.title);
    });

    return () => {
      responseListener.remove();
      notificationListener.remove();
    };
  }, [navigate]);


  const insets = useSafeAreaInsets();
  
  // Redirect logic with splash transition
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        if (currentScreen !== 'login' && currentScreen !== 'privacyPolicy') {
          // Trigger logout splash transition
          setIsTransitioning(true);
          setTimeout(() => {
            setCurrentScreen('login');
            setNavigationStack(['login']);
            setIsTransitioning(false);
          }, 2000); // 2 seconds splash for logout
        }
      } else if (currentScreen === 'login') {
        // Register push notification token on login
        (async () => {
          try {
            const token = await registerForPushNotificationsAsync();
            if (token) {
              await savePushToken(token);
            }
          } catch (e) {
            console.log('Push token registration failed:', e);
          }
        })();
        // Trigger login splash transition
        setIsTransitioning(true);
        setTimeout(() => {
            navigate('home', true);
            setIsTransitioning(false);
        }, 2000); // 2 seconds splash for login
      }
    }
  }, [user, isLoading, currentScreen, navigate]);

  // Handle hardware back button — always go back, never close app
  useEffect(() => {
    const backAction = () => {
      if (currentScreen !== 'login' && !['home', 'quickAction', 'account'].includes(currentScreen)) {
        goBack();
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentScreen, goBack]);

  // ── Tab Animation Animations ──
  const homeScale = useRef(new Animated.Value(1)).current;
  const homeY = useRef(new Animated.Value(0)).current;
  const quickScale = useRef(new Animated.Value(1)).current;
  const quickRotate = useRef(new Animated.Value(0)).current;
  const quickY = useRef(new Animated.Value(0)).current;
  const accountScale = useRef(new Animated.Value(1)).current;
  const accountY = useRef(new Animated.Value(0)).current;
  const homeActive = useRef(new Animated.Value(0)).current;
  const quickActive = useRef(new Animated.Value(0)).current;
  const accountActive = useRef(new Animated.Value(0)).current;

  // Map screens to their parent tabs for consistent highlighting
  const tabMapping: Record<string, string> = {
    home: 'home',
    activityFeed: 'home',
    timetable: 'home',
    attendance: 'home',
    liveCamera: 'home',
    homework: 'home',
    emergencyContact: 'home',
    myFees: 'home',
    rewards: 'home',
    profile: 'account',
    quickAction: 'quickAction',
    account: 'account',
    // Admin screens
    userManagement: 'quickAction',
    userManagementV2: 'quickAction',
    feesManagement: 'quickAction',
    announcements: 'quickAction',
    reports: 'quickAction',
    backup: 'quickAction',
    postActivity: 'quickAction',
    studentList: 'quickAction',
    studentDetail: 'quickAction',
    incomeExpense: 'quickAction',
    branchManagement: 'quickAction',
    cameraManagement: 'quickAction',
    studentInfo: 'quickAction',
    // Teacher screens
    postHomework: 'quickAction',
    takeAttendance: 'quickAction',
    viewSubmissions: 'home',
    classSchedule: 'home', 
    parentMessages: 'account',
    myAttendance: 'quickAction',
    studentAttendanceReport: 'quickAction',
    teacherAttendanceReport: 'quickAction'
  };

  const isTabScreen = ['home', 'quickAction', 'account'].includes(currentScreen) && !!user;
  const activeTab = tabMapping[currentScreen] || 'home';

  useEffect(() => {
    if (!isTabScreen) return;
    
    const animateActive = (val: Animated.Value, active: boolean) => {
      Animated.spring(val, {
        toValue: active ? 1 : 0,
        useNativeDriver: true,
        friction: 8,
        tension: 50
      }).start();
    };

    animateActive(homeActive, activeTab === 'home');
    animateActive(quickActive, activeTab === 'quickAction');
    animateActive(accountActive, activeTab === 'account');
  }, [activeTab, isTabScreen]);


  const renderInnerContent = () => {
    const activeTab = currentScreen === 'login' ? 'home' : currentScreen;
    switch (activeTab) {
      case 'privacyPolicy':
        return <PrivacyPolicyScreen navigation={navigation} />;
      case 'home':
        return (
          <>
            {user?.role === 'master_admin' && <SuperAdminHomeScreen navigation={navigation} />}
            {user?.role === 'admin' && <AdminHomeScreen navigation={navigation} />}
            {user?.role === 'student' && <StudentHomeScreen navigation={navigation} />}
            {user?.role === 'teacher' && <TeacherHomeScreen navigation={navigation} />}
          </>
        );
      case 'quickAction':
        return (
          <>
            {user?.role === 'master_admin' && <SuperAdminQuickActionScreen navigation={navigation} />}
            {user?.role === 'admin' && <AdminQuickActionScreen navigation={navigation} />}
            {user?.role === 'student' && <StudentQuickActionScreen navigation={navigation} />}
            {user?.role === 'teacher' && <TeacherQuickActionScreen navigation={navigation} />}
          </>
        );
      case 'account':
        return (
          <>
            {user?.role === 'master_admin' && <SuperAdminAccountScreen navigation={navigation} />}
            {user?.role === 'admin' && <AdminAccountScreen navigation={navigation} />}
            {user?.role === 'student' && <StudentAccountScreen navigation={navigation} />}
            {user?.role === 'teacher' && <TeacherAccountScreen navigation={navigation} />}
          </>
        );
      case 'userManagement': return <UserManagementScreen navigation={navigation} />;
      case 'userManagementV2': return <UserManagementScreenV2 navigation={navigation} />;
      case 'feesManagement': return <FeesManagementScreen navigation={navigation} />;
      case 'announcements': return <AnnouncementsScreen navigation={navigation} />;
      case 'reports': return <ReportsScreen navigation={navigation} />;
      case 'backup': return <BackupScreen navigation={navigation} />;
      case 'settings': return <SettingsScreen navigation={navigation} />;
      case 'studentList': return <StudentListScreen navigation={navigation} />;
      case 'studentDetail': return <StudentDetailScreen navigation={navigation} route={{ params }} />;
      case 'attendance': return <AttendanceScreen navigation={navigation} />;
      case 'activityFeed': return <ActivityFeedScreen navigation={navigation} route={{ params }} />;
      case 'liveCamera': return <LiveCameraScreen navigation={navigation} />;
      case 'timetable': return <TimetableScreen navigation={navigation} />;
      case 'homework': return <HomeworkScreen navigation={navigation} />;
      case 'emergencyContact': return <EmergencyContactScreen navigation={navigation} />;
      case 'myFees': return <MyFeesScreen navigation={navigation} />;
      case 'myAttendance': return <MyAttendanceScreen navigation={navigation} />;
      case 'studentAttendanceReport': return <StudentAttendanceReportScreen navigation={navigation} />;
      case 'teacherAttendanceReport': return <TeacherAttendanceReportScreen navigation={navigation} />;
      case 'rewards': return <RewardsScreen navigation={navigation} />;
      case 'profile': return <ProfileScreen navigation={navigation} route={{ params }} />;
      case 'postHomework': return <PostHomeworkScreen navigation={navigation} />;
      case 'attendanceSelection': return <AttendanceSelectionScreen navigation={navigation} />;
      case 'takeAttendance': return <TakeAttendanceScreen navigation={navigation} />;
      case 'postActivity': return <PostActivityScreen navigation={navigation} />;
      case 'viewSubmissions': return <ViewSubmissionsScreen navigation={navigation} />;
      case 'classSchedule': return <ClassScheduleScreen navigation={navigation} />;
      case 'parentMessages': return <ParentMessagesScreen navigation={navigation} />;
      case 'incomeExpense': return <IncomeExpenseScreen navigation={navigation} />;
      case 'branchManagement': return <BranchManagementScreen navigation={navigation} />;
      case 'cameraManagement': return <CameraManagementScreen navigation={navigation} />;
      case 'studentInfo': return <StudentInfoScreen navigation={navigation} />;
      case 'notificationSettings': return <NotificationSettingsScreen navigation={navigation} />;
      default: return <AdminHomeScreen navigation={{ navigate, goBack }} />;
    }
  };

  if (isLoading || isTransitioning) {
    return <SplashScreen />;
  }

  if (!user) {
    if (currentScreen === 'privacyPolicy') {
        return <PrivacyPolicyScreen navigation={navigation} />;
    }
    return (
        <LoginScreen 
            onLogin={() => navigate('home', true)} 
            onOpenPrivacy={() => navigate('privacyPolicy')}
        />
    );
  }


  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      {isTabScreen ? (
        <View className="flex-1">
          {renderInnerContent()}
          {/* ── High-Security Centered Tab Dock ── */}
          <View 
            style={{ 
              position: 'absolute',
              bottom: Math.max(insets.bottom, 20), 
              left: 20,
              right: 20,
              height: 80,
              zIndex: 1000,
            }}
          >
            {/* New Premium Sliding Pill Dock */}
            <View 
              style={{
                backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                borderRadius: 30,
                height: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 15 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
                elevation: 20,
                borderWidth: 1,
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              }}
            >
                <View className="flex-1 flex-row items-center justify-around h-full">
                  {['home', 'quickAction', 'account'].map((tab) => {
                    const isActive = activeTab === tab;
                    
                    const getTabIcon = () => {
                      if (tab === 'home') return isActive ? 'home-variant' : 'home-variant-outline';
                      if (tab === 'quickAction') return 'plus-circle'; 
                      if (tab === 'account') return isActive ? 'account-circle' : 'account-circle-outline';
                      return 'help';
                    };

                    const getTabColor = () => {
                      if (!isActive) return theme === 'dark' ? '#525252' : '#9ca3af';
                      if (tab === 'home') return '#F59E0B';
                      if (tab === 'quickAction') return '#F59E0B';
                      if (tab === 'account') return '#F59E0B';
                      return '#F59E0B';
                    };

                    const getTabLabel = () => {
                      if (tab === 'home') return 'HOME';
                      if (tab === 'quickAction') return 'ACTIONS';
                      if (tab === 'account') return 'PROFILE';
                      return '';
                    };

                    return (
                      <TouchableOpacity
                        key={tab}
                        activeOpacity={0.7}
                        onPress={() => navigate(tab as ScreenType, true)}
                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}
                      >
                         <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialCommunityIcons 
                              name={getTabIcon() as any} 
                              size={26} 
                              color={getTabColor()} 
                              style={{ opacity: isActive ? 1 : 0.6 }}
                            />
                            <Text style={{ 
                              color: getTabColor(), 
                              fontSize: 8, 
                              fontWeight: isActive ? '900' : '700', 
                              marginTop: 4,
                              letterSpacing: 2,
                              opacity: isActive ? 1 : 0.6
                            }}>
                              {getTabLabel()}
                            </Text>
                         </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-1">
          {renderInnerContent()}
        </View>
      )}

    </View>
  );
}
