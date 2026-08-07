import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, BackHandler, Alert, ActivityIndicator, Animated, Easing, Dimensions, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import SessionExpiredModal from '../components/SessionExpiredModal';
import { setOnUnauthorized, fetchMaintenanceStatus } from '../services/api';
import MaintenanceBlockScreenV2 from '../screens/auth/v2/MaintenanceBlockScreenV2';

// Import screens
import LoginScreenV2 from '../screens/auth/v2/LoginScreenV2';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminHomeScreenV2 from '../screens/admin/v2/AdminHomeScreenV2';
import AdminQuickActionScreen from '../screens/admin/AdminQuickActionScreen';
import AdminQuickActionScreenV2 from '../screens/admin/v2/AdminQuickActionScreenV2';
import AdminAccountScreen from '../screens/admin/AdminAccountScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import UserManagementScreenV2 from '../screens/admin/UserManagementScreenV2';
import AlumniScreenV2 from '../screens/admin/v2/AlumniScreenV2';
import FeesManagementScreenV2 from '../screens/admin/v2/FeesManagementScreenV2';
import AnnouncementsScreenV2 from '../screens/admin/v2/AnnouncementsScreenV2';
import ReportsScreenV2 from '../screens/admin/v2/ReportsScreenV2';
import SettingsScreenV2 from '../screens/admin/v2/SettingsScreenV2';
import StudentListScreenV2 from '../screens/admin/v2/StudentListScreenV2';
import StudentDetailScreenV2 from '../screens/admin/v2/StudentDetailScreenV2';
import IncomeExpenseScreenV2 from '../screens/admin/v2/IncomeExpenseScreenV2';
import UserMange from '../screens/admin/v2/usermange';
import PettyCashScreenV2 from '../screens/admin/v2/PettyCashScreenV2';
import BackupScreenV2 from '../screens/admin/v2/BackupScreenV2';
import TakeAttendanceScreenV2 from '../screens/admin/v2/TakeAttendanceScreenV2';
import TeacherAttendanceReportScreenV2 from '../screens/admin/v2/TeacherAttendanceReportScreenV2';
import NannyAttendanceReportScreenV2 from '../screens/admin/v2/NannyAttendanceReportScreenV2';
import StudentHomeScreenV2 from '../screens/student/v2/StudentHomeScreenV2';
import StudentQuickActionScreenV2 from '../screens/student/v2/StudentQuickActionScreenV2';
import StudentAccountScreen from '../screens/student/StudentAccountScreen';
import AttendanceScreenV2 from '../screens/student/v2/AttendanceScreenV2';
import ActivityFeedScreenV2 from '../screens/student/v2/ActivityFeedScreenV2';
import LiveCameraScreenV2 from '../screens/student/v2/LiveCameraScreenV2';
import HomeworkScreenV2 from '../screens/student/v2/HomeworkScreenV2';
import TimetableScreenV2 from '../screens/admin/v2/TimetableScreenV2';
import EmergencyContactScreenV2 from '../screens/student/v2/EmergencyContactScreenV2';
import MyFeesScreenV2 from '../screens/student/v2/MyFeesScreenV2';
import PayGatewayScreen from '../screens/student/PayGatewayScreen';
import RewardsScreenV2 from '../screens/student/v2/RewardsScreenV2';
import ProfileScreenV2 from '../screens/student/v2/ProfileScreenV2';
import TeacherHomeScreenV2 from '../screens/teacher/v2/TeacherHomeScreenV2';
import TeacherQuickActionScreenV2 from '../screens/teacher/v2/TeacherQuickActionScreenV2';
import TeacherAccountScreen from '../screens/teacher/TeacherAccountScreen';
import PostHomeworkScreenV2 from '../screens/teacher/v2/PostHomeworkScreenV2';
import PostActivityScreenV2 from '../screens/admin/v2/PostActivityScreenV2';
import ViewSubmissionsScreenV2 from '../screens/teacher/v2/ViewSubmissionsScreenV2';
import ClassScheduleScreenV2 from '../screens/teacher/v2/ClassScheduleScreenV2';
import ParentMessagesScreenV2 from '../screens/teacher/v2/ParentMessagesScreenV2';
import MyAttendanceScreenV2 from '../screens/teacher/v2/MyAttendanceScreenV2';
import StudentAttendanceReportScreenV2 from '../screens/teacher/v2/StudentAttendanceReportScreenV2';
import SplashScreenV2 from '../screens/auth/v2/SplashScreenV2';
import OnboardingScreenV2 from '../screens/auth/v2/OnboardingScreenV2';
import PrivacyPolicyScreenV2 from '../screens/auth/v2/PrivacyPolicyScreenV2';
import NotificationSettingsScreenV2 from '../screens/NotificationSettingsScreenV2';
import ProfileSettingsScreenV2 from '../screens/ProfileSettingsScreenV2';
// Tuition screens
import TuitionTeacherHomeScreenV2 from '../screens/tuition/v2/TuitionTeacherHomeScreenV2';
import TuitionTeacherQuickActionScreenV2 from '../screens/tuition/v2/TuitionTeacherQuickActionScreenV2';
import TuitionTeacherAccountScreen from '../screens/tuition/TuitionTeacherAccountScreen';
import TuitionStudentHomeScreenV2 from '../screens/tuition/v2/TuitionStudentHomeScreenV2';
import TuitionStudentQuickActionScreenV2 from '../screens/tuition/v2/TuitionStudentQuickActionScreenV2';
import TuitionStudentAccountScreen from '../screens/tuition/TuitionStudentAccountScreen';
import TuitionAttendanceScreenV2 from '../screens/admin/v2/TuitionAttendanceScreenV2';
import TuitionStudentListScreenV2 from '../screens/admin/v2/TuitionStudentListScreenV2';
import TuitionStudentDetailScreenV2 from '../screens/admin/v2/TuitionStudentDetailScreenV2';
import TuitionPostProgressScreenV2 from '../screens/admin/v2/TuitionPostProgressScreenV2';
import TuitionMyProgressScreenV2 from '../screens/admin/v2/TuitionMyProgressScreenV2';
import TuitionStudyMaterialsScreenV2 from '../screens/admin/v2/TuitionStudyMaterialsScreenV2';
import TuitionConsoleScreenV2 from '../screens/admin/v2/TuitionConsoleScreenV2';
import ManageTuitionUsersScreenV2 from '../screens/admin/v2/ManageTuitionUsersScreenV2';
// Master Admin screens
import BranchManagementScreenV2 from '../screens/master_admin/v2/BranchManagementScreenV2';
import CameraManagementScreenV2 from '../screens/master_admin/v2/CameraManagementScreenV2';
import SuperAdminHomeScreenV2 from '../screens/master_admin/v2/SuperAdminHomeScreenV2';
import SuperAdminQuickActionScreenV2 from '../screens/master_admin/v2/SuperAdminQuickActionScreenV2';
import SuperAdminAccountScreenV2 from '../screens/master_admin/v2/SuperAdminAccountScreenV2';
import AttendanceSelectionScreenV2 from '../screens/master_admin/v2/AttendanceSelectionScreenV2';
import StudentInfoScreenV2 from '../screens/master_admin/v2/StudentInfoScreenV2';
// Nanny screens
import NannyHomeScreenV2 from '../screens/nanny/v2/NannyHomeScreenV2';
import NannyAccountScreen from '../screens/nanny/NannyAccountScreen';
import VoiceChatScreenV2 from '../screens/voice/v2/VoiceChatScreenV2';
import MaintenanceScreenV2 from '../screens/admin/v2/MaintenanceScreenV2';

type ScreenType = 'onboarding' | 'login' | 'privacyPolicy' | 'home' | 'quickAction' | 'account' | 'userManagement' | 'userManagementV2' | 'userMange' | 'alumni' | 'feesManagement' | 'announcements' | 'reports' | 'backup' | 'settings' | 'attendance' | 'activityFeed' | 'liveCamera' | 'attendanceSelection' | 'homework' | 'emergencyContact' | 'myFees' | 'rewards' | 'profile' | 'profileSettings' | 'timetable' | 'postHomework' | 'takeAttendance' | 'postActivity' | 'viewSubmissions' | 'classSchedule' | 'parentMessages' | 'studentList' | 'studentDetail' | 'incomeExpense' | 'myAttendance' | 'studentAttendanceReport' | 'teacherAttendanceReport' | 'notificationSettings' | 'branchManagement' | 'cameraManagement' | 'studentInfo' | 'tuitionPostProgress' | 'tuitionMyProgress' | 'tuitionAttendance' | 'tuitionConsole' | 'manageTuitionUsers' | 'tuitionStudyMaterials' | 'tuitionStudentList' | 'tuitionStudentDetail' | 'pettyCash' | 'nannyChat' | 'nannyAttendance' | 'nannyAttendanceReport' | 'maintenance';

export default function AppNavigator() {
  const { user, announcements, isLoading, logout } = useAuth();
  const { theme, colors } = useTheme();
  
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [navigationStack, setNavigationStack] = useState<ScreenType[]>(['login']);
  const [params, setParams] = useState<any>(null);
  const [isHomeBlinking, setIsHomeBlinking] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState<{ enabled: boolean; message: string }>({ enabled: false, message: '' });
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

  const navigation = useMemo(() => ({
    navigate,
    goBack,
  } as {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  }), [navigate, goBack]);

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

  // Session expired handler — only active when user is logged in
  useEffect(() => {
    if (user) {
      setOnUnauthorized(() => setSessionExpired(true));
    } else {
      setOnUnauthorized(null);
    }
    return () => setOnUnauthorized(null);
  }, [user]);

  // Poll Maintenance Mode status — non-admin users get blocked with a popup
  const checkMaintenance = useCallback(async () => {
    const status = await fetchMaintenanceStatus();
    setMaintenanceMode({ enabled: !!status.enabled, message: status.message || '' });
  }, []);

  useEffect(() => {
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 30000); // re-check every 30s
    return () => clearInterval(interval);
  }, [checkMaintenance]);

  // First-launch onboarding — only shown once until the user finishes it
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('@tn_happykids_onboarding_seen');
        if (mounted) setShowOnboarding(seen !== 'true');
      } catch {
        if (mounted) setShowOnboarding(true);
      } finally {
        if (mounted) setOnboardingChecked(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleOnboardingFinish = useCallback(async () => {
    try { await AsyncStorage.setItem('@tn_happykids_onboarding_seen', 'true'); } catch {}
    setShowOnboarding(false);
    navigate('login', true);
  }, [navigate]);

  const handleSessionLogin = useCallback(async () => {
    setSessionExpired(false);
    logout();
    navigate('login', true);
  }, [navigate, logout]);

  const handleMaintenanceLogout = useCallback(() => {
    logout();
    navigate('login', true);
  }, [navigate, logout]);

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
      } else if (currentScreen === 'account' && user?.role === 'nanny') {
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
    profileSettings: 'account',
    quickAction: 'quickAction',
    account: 'account',
    // Admin screens
    userManagement: 'quickAction',
    userManagementV2: 'quickAction',
    alumni: 'quickAction',
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
    teacherAttendanceReport: 'quickAction',
    nannyAttendanceReport: 'quickAction',
    // Tuition screens
    tuitionPostProgress: 'quickAction',
    tuitionMyProgress: 'home',
    tuitionAttendance: 'quickAction',
    tuitionStudyMaterials: 'home',
    pettyCash: 'quickAction',
    tuitionConsole: 'quickAction',
    manageTuitionUsers: 'quickAction',
    tuitionStudentList: 'quickAction',
    tuitionStudentDetail: 'quickAction',
    nannyChat: 'home',
    nannyAttendance: 'home',
    maintenance: 'quickAction',
  };

  const needsPayment = (user?.role === 'student' || user?.role === 'tuition_student') && (user?.pay_to_active === true || user?.status === 'pending_payment');
  const maintenanceBlocked = maintenanceMode.enabled && !!user && user?.role !== 'master_admin';
  const isTabScreen = ['home', 'quickAction', 'account'].includes(currentScreen) && !!user && user?.role !== 'nanny' && !needsPayment && !maintenanceBlocked;
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
    if (needsPayment) {
      return <PayGatewayScreen navigation={navigation} />;
    }
    switch (activeTab) {
      case 'privacyPolicy':
        return <PrivacyPolicyScreenV2 navigation={navigation} />;
      case 'home':
        return (
          <>
            {user?.role === 'master_admin' && <SuperAdminHomeScreenV2 navigation={navigation} />}
            {user?.role === 'admin' && <AdminHomeScreenV2 navigation={navigation} />}
            {user?.role === 'student' && <StudentHomeScreenV2 navigation={navigation} />}
            {user?.role === 'teacher' && <TeacherHomeScreenV2 navigation={navigation} />}
            {user?.role === 'tuition_teacher' && <TuitionTeacherHomeScreenV2 navigation={navigation} />}
            {user?.role === 'tuition_student' && <TuitionStudentHomeScreenV2 navigation={navigation} />}
            {user?.role === 'nanny' && <NannyHomeScreenV2 navigation={navigation} />}
          </>
        );
      case 'quickAction':
        return (
          <>
            {user?.role === 'master_admin' && <SuperAdminQuickActionScreenV2 navigation={navigation} />}
            {user?.role === 'admin' && <AdminQuickActionScreenV2 navigation={navigation} />}
            {user?.role === 'student' && <StudentQuickActionScreenV2 navigation={navigation} />}
            {user?.role === 'teacher' && <TeacherQuickActionScreenV2 navigation={navigation} />}
            {user?.role === 'tuition_teacher' && <TuitionTeacherQuickActionScreenV2 navigation={navigation} />}
            {user?.role === 'tuition_student' && <TuitionStudentQuickActionScreenV2 navigation={navigation} />}
            {user?.role === 'nanny' && <NannyHomeScreenV2 navigation={navigation} />}
          </>
        );
      case 'account':
        return (
          <>
            {user?.role === 'master_admin' && <SuperAdminAccountScreenV2 navigation={navigation} />}
            {user?.role === 'admin' && <AdminAccountScreen navigation={navigation} />}
            {user?.role === 'student' && <StudentAccountScreen navigation={navigation} />}
            {user?.role === 'teacher' && <TeacherAccountScreen navigation={navigation} />}
            {user?.role === 'tuition_teacher' && <TuitionTeacherAccountScreen navigation={navigation} />}
            {user?.role === 'tuition_student' && <TuitionStudentAccountScreen navigation={navigation} />}
            {user?.role === 'nanny' && <NannyAccountScreen navigation={navigation} />}
          </>
        );
      case 'userManagement': return <UserMange navigation={navigation} />;
      case 'userManagementV2': return <UserManagementScreenV2 navigation={navigation} />;
      case 'userMange': return <UserMange navigation={navigation} />;
      case 'alumni': return <AlumniScreenV2 navigation={navigation} />;
      case 'feesManagement': return <FeesManagementScreenV2 navigation={navigation} />;
      case 'announcements': return <AnnouncementsScreenV2 navigation={navigation} />;
      case 'reports': return <ReportsScreenV2 navigation={navigation} />;
      case 'backup': return <BackupScreenV2 navigation={navigation} />;
      case 'settings': return <SettingsScreenV2 navigation={navigation} />;
      case 'studentList': return <StudentListScreenV2 navigation={navigation} />;
      case 'studentDetail': return <StudentDetailScreenV2 navigation={navigation} route={{ params }} />;
      case 'attendance': return <AttendanceScreenV2 navigation={navigation} />;
      case 'activityFeed': return <ActivityFeedScreenV2 navigation={navigation} route={{ params }} />;
      case 'liveCamera': return <LiveCameraScreenV2 navigation={navigation} />;
      case 'timetable': return <TimetableScreenV2 navigation={navigation} />;
      case 'homework': return <HomeworkScreenV2 navigation={navigation} />;
      case 'emergencyContact': return <EmergencyContactScreenV2 navigation={navigation} />;
      case 'myFees': return <MyFeesScreenV2 navigation={navigation} />;
      case 'myAttendance': return <MyAttendanceScreenV2 navigation={navigation} />;
      case 'studentAttendanceReport': return <StudentAttendanceReportScreenV2 navigation={navigation} />;
      case 'teacherAttendanceReport': return <TeacherAttendanceReportScreenV2 navigation={navigation} />;
      case 'nannyAttendanceReport': return <NannyAttendanceReportScreenV2 navigation={navigation} />;
      case 'rewards': return <RewardsScreenV2 navigation={navigation} />;
      case 'profile': return <ProfileScreenV2 navigation={navigation} route={{ params }} />;
      case 'profileSettings': return <ProfileSettingsScreenV2 navigation={navigation} />;
      case 'postHomework': return <PostHomeworkScreenV2 navigation={navigation} />;
      case 'attendanceSelection': return <AttendanceSelectionScreenV2 navigation={navigation} />;
      case 'takeAttendance': return <TakeAttendanceScreenV2 navigation={navigation} />;
      case 'postActivity': return <PostActivityScreenV2 navigation={navigation} />;
      case 'viewSubmissions': return <ViewSubmissionsScreenV2 navigation={navigation} />;
      case 'classSchedule': return <ClassScheduleScreenV2 navigation={navigation} />;
      case 'parentMessages': return <ParentMessagesScreenV2 navigation={navigation} />;
      case 'incomeExpense': return <IncomeExpenseScreenV2 navigation={navigation} />;
      case 'branchManagement': return <BranchManagementScreenV2 navigation={navigation} />;
      case 'cameraManagement': return <CameraManagementScreenV2 navigation={navigation} />;
      case 'studentInfo': return <StudentInfoScreenV2 navigation={navigation} />;
      case 'notificationSettings': return <NotificationSettingsScreenV2 navigation={navigation} />;
      case 'tuitionPostProgress': return <TuitionPostProgressScreenV2 navigation={navigation} />;
      case 'tuitionMyProgress': return <TuitionMyProgressScreenV2 navigation={navigation} />;
      case 'tuitionAttendance': return <TuitionAttendanceScreenV2 navigation={navigation} />;
      case 'tuitionStudyMaterials': return <TuitionStudyMaterialsScreenV2 navigation={navigation} />;
      case 'pettyCash': return <PettyCashScreenV2 navigation={navigation} />;
      case 'maintenance': return <MaintenanceScreenV2 navigation={navigation} />;
      case 'tuitionConsole': return <TuitionConsoleScreenV2 navigation={navigation} />;
      case 'tuitionStudentList': return <TuitionStudentListScreenV2 navigation={navigation} />;
      case 'tuitionStudentDetail': return <TuitionStudentDetailScreenV2 navigation={navigation} route={{ params }} />;
      case 'manageTuitionUsers': return <ManageTuitionUsersScreenV2 navigation={navigation} />;
      case 'nannyChat': return <VoiceChatScreenV2 navigation={navigation} />;
      case 'nannyAttendance': return <TakeAttendanceScreenV2 navigation={navigation} />;
      default: return <AdminHomeScreen navigation={navigation} />;
    }
  };

  if (isLoading || isTransitioning) {
    return (
      <>
        <SplashScreenV2 />
        <SessionExpiredModal visible={sessionExpired} onLogin={handleSessionLogin} />
      </>
    );
  }

  // Maintenance Mode — block every non-master-admin user (logged in or not)
  if (maintenanceBlocked) {
    return (
      <>
        <MaintenanceBlockScreenV2 maintenanceMessage={maintenanceMode.message} onLogout={handleMaintenanceLogout} />
        <SessionExpiredModal visible={sessionExpired} onLogin={handleSessionLogin} />
      </>
    );
  }

  if (!user) {
    if (onboardingChecked && showOnboarding) {
      return (
        <>
          <OnboardingScreenV2 onFinish={handleOnboardingFinish} />
          <SessionExpiredModal visible={sessionExpired} onLogin={handleSessionLogin} />
        </>
      );
    }
    if (currentScreen === 'privacyPolicy') {
        return (
          <>
            <PrivacyPolicyScreenV2 navigation={navigation} />
            <SessionExpiredModal visible={sessionExpired} onLogin={handleSessionLogin} />
          </>
        );
    }
    return (
      <>
        <LoginScreenV2 
            onLogin={() => navigate('home', true)} 
            onOpenPrivacy={() => navigate('privacyPolicy')}
            maintenanceMessage={maintenanceMode.enabled ? maintenanceMode.message : undefined}
        />
        <SessionExpiredModal visible={sessionExpired} onLogin={handleSessionLogin} />
      </>
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
