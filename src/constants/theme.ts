/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B1B1F',
    background: '#F9F9FF',
    backgroundElement: '#F0F0F7',
    backgroundSelected: '#DEE4FF',
    textSecondary: '#46464F',
    primary: '#435D92',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D9E2FF',
    outline: '#767680',
    outlineVariant: '#C6C6D0',
    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    warningContainer: '#FFE08A',
    onWarningContainer: '#2A2100',
    successContainer: '#B9F0C6',
    onSuccessContainer: '#072712',
    needs: '#5375AF',
    wants: '#8B5C99',
    savings: '#377A58',
  },
  dark: {
    text: '#E4E1E9',
    background: '#121318',
    backgroundElement: '#1E1F25',
    backgroundSelected: '#293450',
    textSecondary: '#C7C5D0',
    primary: '#ADC6FF',
    onPrimary: '#112F60',
    primaryContainer: '#294677',
    outline: '#90909A',
    outlineVariant: '#46464F',
    error: '#FFB4AB',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    warningContainer: '#594700',
    onWarningContainer: '#FFE08A',
    successContainer: '#18522F',
    onSuccessContainer: '#B9F0C6',
    needs: '#A9C7FF',
    wants: '#E5B6EF',
    savings: '#9AD8B1',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
