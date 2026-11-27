import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  light: {
    background: '#FFF7F2', foreground: '#3B2932', card: '#FFFFFF', cardForeground: '#3B2932',
    popover: '#FFFFFF', popoverForeground: '#3B2932', primary: '#B83265', primaryForeground: '#FFFFFF',
    secondary: '#FDE7EF', secondaryForeground: '#8B294E', muted: '#F7EDE7', mutedForeground: '#78636C',
    accent: '#FFC53D', accentForeground: '#3B2932', destructive: '#E06455', destructiveForeground: '#FFFFFF',
    border: '#EAD5DC', input: '#DCC7CF', ring: '#B83265', radius: '1rem',
  },
  dark: {
    background: '#1C1219', foreground: '#F8ECEF', card: '#271A23', cardForeground: '#F8ECEF',
    popover: '#271A23', popoverForeground: '#F8ECEF', primary: '#E77AA4', primaryForeground: '#24131B',
    secondary: '#422935', secondaryForeground: '#F8ECEF', muted: '#34242E', mutedForeground: '#C0A9B2',
    accent: '#F4BE39', accentForeground: '#241A12', destructive: '#D9534B', destructiveForeground: '#FFFFFF',
    border: '#493541', input: '#51404A', ring: '#E77AA4', radius: '1rem',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: THEME.light.background, border: THEME.light.border, card: THEME.light.card, notification: THEME.light.destructive, primary: THEME.light.primary, text: THEME.light.foreground } },
  dark: { ...DarkTheme, colors: { ...DarkTheme.colors, background: THEME.dark.background, border: THEME.dark.border, card: THEME.dark.card, notification: THEME.dark.destructive, primary: THEME.dark.primary, text: THEME.dark.foreground } },
};
