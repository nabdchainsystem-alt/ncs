// Card design tokens + helpers (light/dark aware)

export const cardTheme = (() => {
  const isDark = () =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const radiusLg = 16; // consistent radius
  const padding = 24;
  const gap = 24;
  const headerSpacing = 12;

  const surface = () => (isDark() ? '#0f172a' : '#ffffff');
  const border = () => (isDark() ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.10)');
  const shadow = '0 1px 2px rgba(16,24,40,.06)';
  const muted = () => (isDark() ? '#94a3b8' : '#6b7280');
  const value = () => (isDark() ? '#e5e7eb' : '#111827');
  const iconBoxBg = () => (isDark() ? '#1f2937' : '#f8fafc');

  const pill = (type: 'positive' | 'negative' | 'neutral') => {
    if (type === 'positive') return { bg: '#ECFDF5', text: '#047857' };
    if (type === 'negative') return { bg: '#FEE2E2', text: '#B91C1C' };
    return { bg: '#F3F4F6', text: '#374151' };
  };

  const elevate = () => ({
    borderRadius: radiusLg,
    background: surface(),
    boxShadow: shadow,
    border: `1px solid ${border()}`,
    padding,
  });

  return { radiusLg, padding, gap, headerSpacing, surface, border, shadow, muted, value, iconBoxBg, pill, elevate };
})();

export default cardTheme;

