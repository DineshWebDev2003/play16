import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark';

export interface ThemeColors {
  // Background colors
   background: string;
  backgroundHex: string;
  surface: string;
  surfaceSecondary: string;
  headerBackground: string;
  
  // Tab Bar
  tabBarActive: string;
  tabBarInactive: string;
  tabBarActiveBg: string;
  tabBarInactiveBg: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Profile container
  profileGradientStart: string;
  profileGradientEnd: string;

  // Menu items
  menuItemBackground: string;
  menuItemBorder: string;
  menuItemText: string;
  menuItemTextSecondary: string;

  // Borders and accents
  border: string;
  accent: string;
}

export const lightTheme: ThemeColors = {
  background: 'bg-white',
  backgroundHex: '#FFFFFF',
  surface: 'bg-white',
  surfaceSecondary: 'bg-white',
  headerBackground: 'bg-white',

  tabBarActive: '#FFC107',
  tabBarInactive: '#9CA3AF',
  tabBarActiveBg: 'bg-violet-100',
  tabBarInactiveBg: 'bg-white',

  text: 'text-gray-900',
  textSecondary: 'text-gray-700',
  textTertiary: 'text-gray-500',

  profileGradientStart: 'from-brand-yellow',
  profileGradientEnd: 'to-brand-violet',

  menuItemBackground: 'bg-white',
  menuItemBorder: 'border-gray-100',
  menuItemText: 'text-gray-900',
  menuItemTextSecondary: 'text-gray-600',

  border: 'border-gray-200',
  accent: 'bg-brand-yellow',
};

export const darkTheme: ThemeColors = {
  background: 'bg-[#1c1c14]',
  backgroundHex: '#1c1c14',
  surface: 'bg-[#2d2d24]',
  surfaceSecondary: 'bg-[#3e3e34]',
  headerBackground: 'bg-[#2d2d24]',

  tabBarActive: '#FFC107',
  tabBarInactive: '#6B7280',
  tabBarActiveBg: 'bg-[#2d1b4e]',
  tabBarInactiveBg: 'bg-[#2d2d24]',

  text: 'text-white',
  textSecondary: 'text-gray-200',
  textTertiary: 'text-gray-300',

  profileGradientStart: 'from-brand-yellow',
  profileGradientEnd: 'to-brand-violet',

  menuItemBackground: 'bg-[#2d2d24]',
  menuItemBorder: 'border-[#3e3e34]',
  menuItemText: 'text-white',
  menuItemTextSecondary: 'text-gray-300',

  border: 'border-[#4e4e44]',
  accent: 'bg-brand-yellow',
};

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('light');

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then(saved => {
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved);
      }
    });
  }, []);

  const colors = theme === 'light' ? lightTheme : darkTheme;

  const toggleTheme = () => {
    setThemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem('app_theme', next);
      return next;
    });
  };

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    AsyncStorage.setItem('app_theme', newTheme);
  };

  const value = useMemo(() => ({
    theme,
    colors,
    toggleTheme,
    setTheme,
  }), [theme, colors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
