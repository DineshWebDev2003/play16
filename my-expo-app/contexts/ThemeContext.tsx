import React, { createContext, useContext, ReactNode, useMemo } from 'react';

export type ThemeType = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  backgroundHex: string;
  surface: string;
  surfaceSecondary: string;
  headerBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  tabBarActiveBg: string;
  tabBarInactiveBg: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  profileGradientStart: string;
  profileGradientEnd: string;
  menuItemBackground: string;
  menuItemBorder: string;
  menuItemText: string;
  menuItemTextSecondary: string;
  border: string;
  accent: string;
}

const lightTheme: ThemeColors = {
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

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const value = useMemo(() => ({
    theme: 'light' as ThemeType,
    colors: lightTheme,
    toggleTheme: () => {},
  }), []);

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
