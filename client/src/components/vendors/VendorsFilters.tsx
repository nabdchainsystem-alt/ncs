import React, { useEffect, useMemo, useState } from 'react';

export type Filters = {
  status: 'All' | 'Approved' | 'Pending' | 'On-Hold' | 'Suspended';
  category: string[];
  region: string[];
  minTrustScore: number; // 0..100
  onTimePercent: number; // 0..100
  priceIndex: number;    // <= Y (0 means ignore)
  hasValidISOESG: boolean;
};

type VendorsFiltersProps = {
  onChange: (filters: Filters) => void;
  categories?: string[]; // available category options
  regions?: string[];    // available region options
  initial?: Partial<Filters>;
};

const DEFAULTS: Filters = {
  status: 'All',
  category: [],
  region: [],
  minTrustScore: 0,
  onTimePercent: 0,
  priceIndex: 0,
  hasValidISOESG: false,
};

const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  borderRadius: 999,
  border: '1px solid #E5E7EB',
  background: '#F9FAFB',
  fontSize: 12,
};

const listBox: React.CSSProperties = {
  maxHeight: 160,
  overflow: 'auto',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: 8,
  background: '#fff',
};

const labelStyle: React.CSSProperties = { fontSize: 12, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' };

const section: React.CSSProperties = { marginBottom: '1rem' };

const VendorsFilters: React.FC<VendorsFiltersProps> = ({ onChange, categories, regions, initial }) => {
  const [filters, setFilters] = useState<Filters>({ ...DEFAULTS, ...(initial || {}) });

  // Derive options with sensible defaults
  const categoryOptions = useMemo(() => categories && categories.length ? categories : ['Mechanical','Electrical','Metals','Logistics','IT','Services'], [categories]);
  const regionOptions = useMemo(() => regions && regions.length ? regions : ['Riyadh','Jeddah','Dammam','Makkah','Madinah','Tabuk'], [regions]);

  useEffect(() => { onChange(filters); }, [filters, onChange]);

  const toggleIn = (key: 'category' | 'region', val: string) => {
    setFilters((f) => {
      const arr = new Set(f[key]);
      if (arr.has(val)) arr.delete(val); else arr.add(val);
      return { ...f, [key]: Array.from(arr) } as Filters;
    });
  };

  const reset = () => setFilters({ ...DEFAULTS });

  return (
    <aside style={{ padding: '1rem', borderRight: '1px solid #E5E7EB', width: 280, background: '#FAFAFA' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Filters</h3>
        <button onClick={reset} style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer' }}>Clear</button>
      </div>

      {/* Status */}
      <div style={section}>
        <div style={labelStyle}>Status</div>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as Filters['status'] }))}
          style={{ width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8 }}
        >
          {['All','Approved','Pending','On-Hold','Suspended'].map((s) => (
            <option key={s} value={s as Filters['status']}>{s}</option>
          ))}
        </select>
      </div>

      {/* Category multi-select */}
      <div style={section}>
        <div style={labelStyle}>Category</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {filters.category.map((c) => (
            <span key={c} style={chip}>
              {c}
              <button onClick={() => toggleIn('category', c)} aria-label={`Remove ${c}`} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ ...listBox, marginTop: 8 }}>
          {categoryOptions.map((c) => (
            <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.category.includes(c)}
                onChange={() => toggleIn('category', c)}
              />
              <span>{c}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Region multi-select */}
      <div style={section}>
        <div style={labelStyle}>Region</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {filters.region.map((r) => (
            <span key={r} style={chip}>
              {r}
              <button onClick={() => toggleIn('region', r)} aria-label={`Remove ${r}`} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ ...listBox, marginTop: 8 }}>
          {regionOptions.map((r) => (
            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.region.includes(r)}
                onChange={() => toggleIn('region', r)}
              />
              <span>{r}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Min Trust Score */}
      <div style={section}>
        <div style={labelStyle}>Min Trust Score</div>
        <input
          type="number"
          min={0}
          max={100}
          value={filters.minTrustScore}
          onChange={(e) => setFilters((f) => ({ ...f, minTrustScore: Number(e.target.value) }))}
          style={{ width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8 }}
        />
      </div>

      {/* On-Time ≥ X% */}
      <div style={section}>
        <div style={labelStyle}>On‑Time ≥ X%</div>
        <input
          type="number"
          min={0}
          max={100}
          value={filters.onTimePercent}
          onChange={(e) => setFilters((f) => ({ ...f, onTimePercent: Number(e.target.value) }))}
          style={{ width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8 }}
        />
      </div>

      {/* Price Index ≤ Y */}
      <div style={section}>
        <div style={labelStyle}>Price Index ≤ Y</div>
        <input
          type="number"
          min={0}
          value={filters.priceIndex}
          onChange={(e) => setFilters((f) => ({ ...f, priceIndex: Number(e.target.value) }))}
          style={{ width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8 }}
        />
      </div>

      {/* ISO / ESG */}
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={filters.hasValidISOESG}
            onChange={(e) => setFilters((f) => ({ ...f, hasValidISOESG: e.target.checked }))}
          />
          <span>Has Valid ISO / ESG</span>
        </label>
      </div>
    </aside>
  );
};

export default VendorsFilters;
