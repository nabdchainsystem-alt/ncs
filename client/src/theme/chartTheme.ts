import type { EChartsOption } from 'echarts';
import { formatNumber } from '../shared/format';
import { runtimeMode, type ThemeMode } from './cardTheme';

type GradientStop = { offset: number; color: string };

const withOpacity = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const bigint = normalized.length === 3
    ? parseInt(normalized.split('').map((c) => c + c).join(''), 16)
    : parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const palette = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F97316', '#22C55E', '#EF4444', '#0EA5E9'];
const accent = {
  brandPrimary: palette[0],
  brandSecondary: palette[1],
  accentTeal: palette[2],
};

const neutralGrid = (mode: ThemeMode = runtimeMode()) => (mode === 'dark' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(15, 23, 42, 0.08)');
const textColor = (mode: ThemeMode = runtimeMode()) => (mode === 'dark' ? '#e2e8f0' : '#1e293b');
const axisLabel = (mode: ThemeMode = runtimeMode()) => (mode === 'dark' ? '#cbd5f5' : '#475569');
const tooltipBackground = (mode: ThemeMode = runtimeMode()) => (mode === 'dark' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.96)');

const legendDefaults = (mode: ThemeMode = runtimeMode()) => ({
  bottom: 0,
  icon: 'circle',
  textStyle: {
    color: axisLabel(mode),
    fontSize: 12,
  },
});

const heights = {
  bar: 300,
  line: 300,
  area: 300,
  pie: 280,
};

const ensureStops = (color: string, stops?: GradientStop[]): GradientStop[] => {
  if (stops && stops.length > 0) return stops;
  return [
    { offset: 0, color: withOpacity(color, 0.82) },
    { offset: 1, color: withOpacity(color, 0.12) },
  ];
};

const mkGradient = (color: string, stops?: GradientStop[]) => {
  const resolvedStops = ensureStops(color, stops);
  const echarts = (globalThis as unknown as { echarts?: typeof import('echarts') }).echarts ?? undefined;
  if (echarts?.graphic?.LinearGradient) {
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, resolvedStops);
  }
  return resolvedStops[0]?.color ?? color;
};

const numberFormat = (value: number | string, fractionDigits = 0) =>
  formatNumber(value, { maximumFractionDigits: fractionDigits });

const applyBaseOption = (mode: ThemeMode = runtimeMode()): Pick<EChartsOption, 'textStyle' | 'grid'> => ({
  textStyle: {
    color: textColor(mode),
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  grid: {
    top: 32,
    left: 48,
    right: 32,
    bottom: 48,
    containLabel: true,
  },
});

export const chartTheme = {
  ...accent,
  palette,
  neutralGrid,
  textColor,
  axisLabel,
  tooltipBackground,
  legendDefaults,
  heights,
  mkGradient,
  numberFormat,
  applyBaseOption,
};

export type ChartTheme = typeof chartTheme;

export default chartTheme;
