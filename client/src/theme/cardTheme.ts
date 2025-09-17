import type { CSSProperties } from 'react';

export type ThemeMode = 'light' | 'dark';
export type Direction = 'ltr' | 'rtl';

export const runtimeMode = (fallback: ThemeMode = 'light'): ThemeMode => {
  if (typeof document === 'undefined') return fallback;
  return document.documentElement.classList.contains('dark') ? 'dark' : fallback;
};

export const runtimeDirection = (fallback: Direction = 'ltr'): Direction => {
  if (typeof document === 'undefined') return fallback;
  const dir = document.documentElement.getAttribute('dir');
  return dir === 'rtl' ? 'rtl' : fallback;
};

const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

const padding = {
  snug: 16,
  base: 24,
  roomy: 32,
};

const gap = 24;
const headerSpacing = 12;

const surface = (mode: ThemeMode = runtimeMode()) => (mode === 'dark' ? '#0f172a' : '#ffffff');
const border = (mode: ThemeMode = runtimeMode()) => (mode === 'dark' ? 'rgba(148, 163, 184, 0.24)' : 'rgba(15, 23, 42, 0.08)');
const shadow = (mode: ThemeMode = runtimeMode()) =>
  mode === 'dark'
    ? '0 18px 32px -24px rgba(15, 23, 42, 0.72)'
    : '0 14px 32px -16px rgba(15, 23, 42, 0.18)';
const muted = (mode: ThemeMode = runtimeMode()) => (mode === 'dark' ? '#94a3b8' : '#64748b');
const valueColor = (mode: ThemeMode = runtimeMode()) => (mode === 'dark' ? '#f8fafc' : '#111827');
const iconBoxBg = (mode: ThemeMode = runtimeMode()) => (mode === 'dark' ? 'rgba(148, 163, 184, 0.14)' : '#f8fafc');

const typography = {
  heading: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  subtitle: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.01em',
  },
  meta: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.03em',
  },
};

const pillPalette = {
  positive: { bg: '#ecfdf5', text: '#047857' },
  negative: { bg: '#fee2e2', text: '#b91c1c' },
  neutral: { bg: '#f3f4f6', text: '#374151' },
  info: { bg: '#e0f2fe', text: '#0369a1' },
  warning: { bg: '#fef3c7', text: '#b45309' },
} as const;

type PillTone = keyof typeof pillPalette;

const pill = (tone: PillTone) => pillPalette[tone];

const container = (mode: ThemeMode = runtimeMode()): CSSProperties => ({
  borderRadius: radius.lg,
  background: surface(mode),
  border: `1px solid ${border(mode)}`,
  boxShadow: shadow(mode),
});

export const cardTheme = {
  radius,
  padding,
  gap,
  headerSpacing,
  surface,
  border,
  shadow,
  muted,
  valueColor,
  iconBoxBg,
  typography,
  pill,
  container,
  runtimeMode,
  runtimeDirection,
};

export type CardTheme = typeof cardTheme;

export default cardTheme;
