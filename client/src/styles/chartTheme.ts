// Small chart theme tokens + helpers for ECharts (light/dark aware)

export const chartTheme = (() => {
  const isDark = () =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const brandPrimary = '#3B82F6';
  const brandSecondary = '#8B5CF6';
  const accentTeal = '#14B8A6';

  const neutralGrid = () => (isDark() ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)');

  function withOpacity(hex: string, alpha: number) {
    const h = hex.replace('#', '');
    const bigint = h.length === 3
      ? parseInt(h.split('').map((c) => c + c).join(''), 16)
      : parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function mkGradient(color: string, opacityTop = (isDark() ? 0.65 : 0.85), opacityBottom = 0.12) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const echarts: any = (globalThis as any).echarts || (window as any).echarts;
    if (echarts?.graphic?.LinearGradient) {
      return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: withOpacity(color, opacityTop) },
        { offset: 1, color: withOpacity(color, opacityBottom) },
      ]);
    }
    return withOpacity(color, opacityTop);
  }

  const palette = [brandPrimary, brandSecondary, accentTeal, '#06B6D4', '#22C55E', '#F59E0B', '#EF4444'];

  return { brandPrimary, brandSecondary, accentTeal, neutralGrid, withOpacity, mkGradient, palette };
})();

export default chartTheme;

