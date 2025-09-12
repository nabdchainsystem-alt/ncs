import React from 'react';

export type VendorsAlertsProps = {
  onExpiringDocs: () => void;
  onSingleSource: () => void;
  onQualityIssues: () => void;
  onCarbonFlags: () => void;
  // Optional live counts; if not provided, we show realistic demo numbers
  expiringCount?: number;
  singleSourceCount?: number;
  qualityIssuesCount?: number;
  carbonFlagsCount?: number;
};

const sectionStyle: React.CSSProperties = { margin: '2rem 0' };
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.5rem',
};

const cardBase: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: '18px 16px',
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(16,24,40,.06)',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  transition: 'box-shadow .2s ease, transform .2s ease, border-color .2s',
  minWidth: 0,
};

const titleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#111827' };
const subtitleStyle: React.CSSProperties = { fontSize: 12, color: '#6B7280', marginTop: 2 };
const countStyle: React.CSSProperties = { fontSize: 24, fontWeight: 800, color: '#111827', lineHeight: 1 };

function tone(kind: 'blue' | 'amber' | 'red' | 'emerald'): { left: React.CSSProperties; halo: React.CSSProperties; card: React.CSSProperties } {
  const map: Record<string, { bg: string; border: string; accent: string; halo: string }> = {
    blue:   { bg: '#EFF6FF', border: '#BFDBFE', accent: '#1D4ED8', halo: 'rgba(29,78,216,.15)' },
    amber:  { bg: '#FFFBEB', border: '#FDE68A', accent: '#92400E', halo: 'rgba(146,64,14,.15)' },
    red:    { bg: '#FEF2F2', border: '#FECACA', accent: '#991B1B', halo: 'rgba(153,27,27,.15)' },
    emerald:{ bg: '#ECFDF5', border: '#A7F3D0', accent: '#047857', halo: 'rgba(4,120,87,.15)' },
  };
  const { bg, border, accent, halo } = map[kind];
  return {
    left: {
      width: 44,
      height: 44,
      borderRadius: 10,
      background: bg,
      border: `1px solid ${border}`,
      display: 'grid', placeItems: 'center',
      flexShrink: 0,
    },
    halo: { boxShadow: `0 0 0 6px ${halo}` },
    card: { borderColor: border },
  };
}

const Icon: React.FC<{ kind: 'doc' | 'single' | 'quality' | 'carbon'; color: string }> = ({ kind, color }) => {
  const common = { width: 20, height: 20, fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as React.SVGProps<SVGSVGElement>;
  switch (kind) {
    case 'doc':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/>
          <path d="M14 3v6h6"/>
        </svg>
      );
    case 'single':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4"/>
          <path d="M6 21v-2a6 6 0 0 1 12 0v2"/>
        </svg>
      );
    case 'quality':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M3 3v18h18"/>
          <path d="M7 15l3-3 4 4 5-7"/>
        </svg>
      );
    case 'carbon':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 2a7 7 0 0 1 7 7c0 4.5-7 13-7 13S5 13.5 5 9a7 7 0 0 1 7-7z"/>
          <circle cx="12" cy="9" r="3"/>
        </svg>
      );
  }
};

const VendorsAlerts: React.FC<VendorsAlertsProps> = ({
  onExpiringDocs,
  onSingleSource,
  onQualityIssues,
  onCarbonFlags,
  expiringCount,
  singleSourceCount,
  qualityIssuesCount,
  carbonFlagsCount,
}) => {
  // Demo defaults if props not provided
  const counters = {
    expiring: expiringCount ?? 5,
    single: singleSourceCount ?? 3,
    quality: qualityIssuesCount ?? 4,
    carbon: carbonFlagsCount ?? 2,
  };

  const cards = [
    { key: 'exp', title: 'Expiring Documents',    count: counters.expiring, tone: tone('blue'),   icon: <Icon kind="doc" color="#1D4ED8"/>,      onClick: onExpiringDocs },
    { key: 'ss',  title: 'Single‑Source Risk',    count: counters.single,   tone: tone('amber'),  icon: <Icon kind="single" color="#92400E"/>,    onClick: onSingleSource },
    { key: 'ncr', title: 'High NCRs / Late',      count: counters.quality,  tone: tone('red'),    icon: <Icon kind="quality" color="#991B1B"/>,   onClick: onQualityIssues },
    { key: 'co2', title: 'ESG / Carbon Flags',    count: counters.carbon,   tone: tone('emerald'),icon: <Icon kind="carbon" color="#047857"/>,    onClick: onCarbonFlags },
  ];

  return (
    <section style={sectionStyle}>
      <div style={gridStyle}>
        {cards.map(({ key, title, count, tone: t, icon, onClick }) => (
          <div
            key={key}
            style={{ ...cardBase, ...t.card }}
            onClick={onClick}
            tabIndex={0}
            role="button"
            aria-label={title}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(16,24,40,.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 2px rgba(16,24,40,.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
          >
            <div style={{ ...t.left }} className="alert-left">
              <div style={t.halo}>{icon}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <div style={titleStyle}>{title}</div>
              <div style={subtitleStyle} className="muted">Last 30 days</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={countStyle}>{count}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VendorsAlerts;