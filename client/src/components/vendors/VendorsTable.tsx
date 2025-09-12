import React, { useMemo, useState, useCallback } from 'react';
import { Eye, FileText, GitCompare, FileSignature, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type VendorRow = {
  id: number;
  code?: string;
  vendor: string;
  category: string;
  region: string;
  leadTime: string;      // e.g. "10 days"
  onTime: string;        // e.g. "95%"
  qualityPPM: string;    // e.g. "50"
  priceIndex: string;    // e.g. "1.2" or "102"
  responseSLA: string;   // e.g. "24 hrs"
  trustScore: string;    // e.g. "85"
  status: string;        // Active / Approved / Pending / On‑Hold / Suspended
};

interface VendorsTableProps {
  rows?: VendorRow[];
  onView: (row: VendorRow) => void;
  onRFQ: (row: VendorRow) => void;
  onCompare: (row: VendorRow) => void;
  onContract: (row: VendorRow) => void;
  onNotes: (row: VendorRow) => void;
}

type SortKey = keyof Pick<VendorRow, 'vendor' | 'code' | 'category' | 'region' | 'leadTime' | 'onTime' | 'qualityPPM' | 'priceIndex' | 'responseSLA' | 'trustScore' | 'status'>;

type SortDir = 'asc' | 'desc';

const defaultRows: VendorRow[] = [
  { id: 1, code: 'V-100', vendor: 'Alpha Supplies Co.', category: 'Mechanical', region: 'Riyadh', leadTime: '12 days', onTime: '92%', qualityPPM: '500', priceIndex: '102', responseSLA: '24 hrs', trustScore: '85', status: 'Approved' },
  { id: 2, code: 'V-101', vendor: 'Beta Electrics Ltd.', category: 'Electrical', region: 'Jeddah', leadTime: '20 days', onTime: '88%', qualityPPM: '1200', priceIndex: '98', responseSLA: '48 hrs', trustScore: '75', status: 'Pending' },
  { id: 3, code: 'V-102', vendor: 'Gamma Industrial', category: 'Mechanical', region: 'Dammam', leadTime: '16 days', onTime: '91%', qualityPPM: '700', priceIndex: '101', responseSLA: '36 hrs', trustScore: '81', status: 'Approved' },
  { id: 4, code: 'V-103', vendor: 'Delta Logistics', category: 'Logistics', region: 'Riyadh', leadTime: '8 days', onTime: '95%', qualityPPM: '300', priceIndex: '105', responseSLA: '12 hrs', trustScore: '88', status: 'Approved' },
  { id: 5, code: 'V-104', vendor: 'Epsilon Metals', category: 'Metals', region: 'Jeddah', leadTime: '25 days', onTime: '82%', qualityPPM: '2200', priceIndex: '96', responseSLA: '60 hrs', trustScore: '68', status: 'On-Hold' },
];

function parseNumeric(field: SortKey, v: VendorRow): number {
  const get = (s?: string) => (s ?? '').replace(/[^0-9.]/g, '');
  switch (field) {
    case 'leadTime': return Number(get(v.leadTime)) || 0;
    case 'onTime': return Number(get(v.onTime)) || 0;
    case 'qualityPPM': return Number(get(v.qualityPPM)) || 0;
    case 'priceIndex': return Number(get(v.priceIndex)) || 0;
    case 'responseSLA': return Number(get(v.responseSLA)) || 0;
    case 'trustScore': return Number(get(v.trustScore)) || 0;
    default: return 0;
  }
}

const VendorsTable: React.FC<VendorsTableProps> = ({ rows, onView, onRFQ, onCompare, onContract, onNotes }) => {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('vendor');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // RFQ lightweight flow (inline modal)
  const [rfqFor, setRfqFor] = useState<VendorRow | null>(null);
  const [rfqDue, setRfqDue] = useState<string>('');
  const [rfqItems, setRfqItems] = useState<string>('');
  const [rfqNotes, setRfqNotes] = useState<string>('');

  const openRFQ = useCallback((row: VendorRow) => {
    setRfqFor(row);
    setRfqDue('');
    setRfqItems('');
    setRfqNotes('');
  }, []);

  const closeRFQ = useCallback(() => setRfqFor(null), []);

  const submitRFQ = useCallback(() => {
    if (!rfqFor) return;
    try {
      // Dispatch a DOM CustomEvent for any global listeners (e.g., RFQ flow module)
      if (typeof window !== 'undefined' && (window as any).dispatchEvent) {
        const items = rfqItems
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const detail = { vendor: rfqFor, dueDate: rfqDue || null, items, notes: rfqNotes || null };
        window.dispatchEvent(new CustomEvent('vendors:rfq', { detail }));
      }
    } catch {}
    // Also call the provided callback for app-level handling
    onRFQ(rfqFor);
    setRfqFor(null);
  }, [rfqFor, rfqDue, rfqItems, rfqNotes, onRFQ]);

  // PO / Contract lightweight flow (inline modal)
  const [poFor, setPoFor] = useState<VendorRow | null>(null);
  const [poDue, setPoDue] = useState<string>('');
  const [poItems, setPoItems] = useState<string>('');
  const [poNotes, setPoNotes] = useState<string>('');
  const [poLoading, setPoLoading] = useState<boolean>(false);
  const [poError, setPoError] = useState<string | null>(null);

  const openPO = useCallback((row: VendorRow) => {
    setPoFor(row);
    setPoDue('');
    setPoItems('');
    setPoNotes('');
    setPoError(null);
  }, []);

  const closePO = useCallback(() => setPoFor(null), []);

  const submitPO = useCallback(async () => {
    if (!poFor) return;
    const items = poItems
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) { setPoError('Please add at least one item code'); return; }
    setPoLoading(true);
    setPoError(null);
    try {
      // Fire a DOM event for app-wide listeners
      if (typeof window !== 'undefined' && (window as any).dispatchEvent) {
        const detail = { vendor: poFor, dueDate: poDue || null, items, notes: poNotes || null };
        window.dispatchEvent(new CustomEvent('vendors:po', { detail }));
      }
      // Call backend
      await fetch('/api/po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: poFor.id, items, dueDate: poDue || null, notes: poNotes || null }),
      }).then(async (res) => {
        if (!res.ok) throw new Error(`po_create_failed_${res.status}`);
        return res.json().catch(() => ({}));
      });
      // Notify parent callback
      onContract(poFor);
      setPoFor(null);
    } catch (e: any) {
      setPoError(String(e?.message || 'Failed to create PO'));
    } finally {
      setPoLoading(false);
    }
  }, [poFor, poDue, poItems, poNotes, onContract]);

  const data = rows ?? defaultRows;

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) =>
      [r.vendor, r.code, r.category, r.region, r.status]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    );
  }, [data, filter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let va: any = (a as any)[sortKey];
      let vb: any = (b as any)[sortKey];
      // numeric handling for certain fields
      if (['leadTime','onTime','qualityPPM','priceIndex','responseSLA','trustScore'].includes(sortKey)) {
        va = parseNumeric(sortKey, a);
        vb = parseNumeric(sortKey, b);
      } else {
        va = String(va ?? '').toLowerCase();
        vb = String(vb ?? '').toLowerCase();
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const changeSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortableTh: React.FC<{ label: string; k: SortKey; w?: number }> = ({ label, k, w }) => (
    <th
      style={{ padding: '12px 14px', borderBottom: '1px solid #E5E7EB', cursor: 'pointer', width: w }}
      onClick={() => changeSort(k)}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {label}
        {sortKey === k ? <span style={{ fontSize: 12, color: '#6B7280' }}>{sortDir === 'asc' ? '▲' : '▼'}</span> : <span style={{ fontSize: 12, color: '#D1D5DB' }}>▲</span>}
      </span>
    </th>
  );

  return (
    <div className="vendors-table-modern">
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 14px' }}>
        <input
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          type="text"
          placeholder="Filter by name/code/category/region..."
          style={{ width: 360, padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 12, color: '#6B7280' }}>Rows per page</label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 8 }}>
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <table className="vendors-table vendors-table--sticky" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            <SortableTh label="Vendor Name / Code" k="vendor" />
            <SortableTh label="Category" k="category" />
            <SortableTh label="Region" k="region" />
            <SortableTh label="Lead Time" k="leadTime" />
            <SortableTh label="On-Time %" k="onTime" />
            <SortableTh label="Quality PPM" k="qualityPPM" />
            <SortableTh label="Price Index" k="priceIndex" />
            <SortableTh label="Response SLA" k="responseSLA" />
            <SortableTh label="Trust" k="trustScore" />
            <SortableTh label="Status" k="status" />
            <th style={{ padding: '12px 14px', borderBottom: '1px solid #E5E7EB' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
          {pageRows.map((row) => (
            <motion.tr
              key={row.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onMouseEnter={() => setHoveredId(row.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>
                <div className="vendor-cell">
                  <div className="vendor-avatar">{(row.vendor || '?').slice(0,1)}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div className="vendor-name">{row.vendor}</div>
                    {row.code && <div className="vendor-code">• {row.code}</div>}
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.category}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.region}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', whiteSpace: 'nowrap' }}>{row.leadTime}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', whiteSpace: 'nowrap' }}>{row.onTime}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', whiteSpace: 'nowrap' }}>{row.qualityPPM}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', whiteSpace: 'nowrap' }}>{row.priceIndex}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', whiteSpace: 'nowrap' }}>{row.responseSLA}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>
                <TrustGauge score={Number(row.trustScore)} />
              </td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>
                <span className={`vendor-badge ${badgeClass(row.status)}`}>{row.status}</span>
              </td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', position: 'relative' }}>
                <div className="vendor-actions">
                  <button className="btn icon-btn" title="View" onClick={() => onView(row)}><Eye size={16} /></button>
                  <button className="btn icon-btn" title="RFQ" onClick={() => openRFQ(row)}><FileText size={16} /></button>
                  <button className="btn icon-btn" title="Compare" onClick={() => onCompare(row)}><GitCompare size={16} /></button>
                  <button className="btn icon-btn" title="Contract" onClick={() => openPO(row)}><FileSignature size={16} /></button>
                  <button className="btn icon-btn" title="Notes" onClick={() => onNotes(row)}><StickyNote size={16} /></button>
                </div>

                {/* Hover Snapshot */}
                {hoveredId === row.id && (
                  <div className="vendor-hover-card" style={{ right: 0, top: '100%', marginTop: 6 }}>
                    <div className="title">{row.vendor} {row.code ? `• ${row.code}` : ''}</div>
                    <div className="line"><span>Lead</span><span>{row.leadTime}</span></div>
                    <div className="line"><span>On‑Time</span><span>{row.onTime}</span></div>
                    <div className="line"><span>Quality</span><span>{row.qualityPPM} ppm</span></div>
                    <div className="line"><span>PriceIdx</span><span>{row.priceIndex}</span></div>
                    <div className="line"><span>Resp SLA</span><span>{row.responseSLA}</span></div>
                  </div>
                )}
              </td>
            </motion.tr>
          ))}
          </AnimatePresence>

          {pageRows.length === 0 && (
            <tr>
              <td colSpan={11} style={{ padding: 20, textAlign: 'center', color: '#6B7280' }}>No vendors match current filters.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          Showing <b>{sorted.length ? start + 1 : 0}</b>–<b>{Math.min(sorted.length, start + pageSize)}</b> of <b>{sorted.length}</b>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1}>Prev</button>
          <div style={{ padding: '6px 10px', fontSize: 12 }}>Page {pageSafe} / {totalPages}</div>
          <button className="btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages}>Next</button>
        </div>
      </div>

      {rfqFor && (
        <div style={{ position: 'fixed', inset: 0 as any, background: 'rgba(17,24,39,.45)', zIndex: 50, display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 520, background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,.25)', border: '1px solid #E5E7EB' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800 }}>Send RFQ</div>
              <button onClick={closeRFQ} className="btn" style={{ borderRadius: 8 }}>✕</button>
            </div>
            <div style={{ padding: 16, display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 14 }}>
                <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>Vendor</div>
                <div style={{ fontWeight: 700 }}>{rfqFor.vendor}{rfqFor.code ? ` • ${rfqFor.code}` : ''}</div>
              </div>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Due Date</span>
                <input type="date" value={rfqDue} onChange={(e) => setRfqDue(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8 }} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Items (codes, comma‑separated)</span>
                <input type="text" placeholder="ITEM-001, ITEM-002" value={rfqItems} onChange={(e) => setRfqItems(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8 }} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Notes (optional)</span>
                <textarea rows={3} value={rfqNotes} onChange={(e) => setRfqNotes(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, resize: 'vertical' as any }} />
              </label>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn" onClick={closeRFQ}>Cancel</button>
              <button className="btn" onClick={submitRFQ} style={{ fontWeight: 700 }}>Send RFQ</button>
            </div>
          </div>
        </div>
      )}

      {poFor && (
        <div style={{ position: 'fixed', inset: 0 as any, background: 'rgba(17,24,39,.45)', zIndex: 50, display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 520, background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,.25)', border: '1px solid #E5E7EB' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800 }}>Create PO / Contract</div>
              <button onClick={closePO} className="btn" style={{ borderRadius: 8 }}>✕</button>
            </div>
            <div style={{ padding: 16, display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 14 }}>
                <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>Vendor</div>
                <div style={{ fontWeight: 700 }}>{poFor.vendor}{poFor.code ? ` • ${poFor.code}` : ''}</div>
              </div>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Due Date</span>
                <input type="date" value={poDue} onChange={(e) => setPoDue(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8 }} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Items (codes, comma‑separated)</span>
                <input type="text" placeholder="ITEM-001, ITEM-005" value={poItems} onChange={(e) => setPoItems(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8 }} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Notes (optional)</span>
                <textarea rows={3} value={poNotes} onChange={(e) => setPoNotes(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, resize: 'vertical' as any }} />
              </label>
              {poError && <div style={{ color: '#DC2626', fontSize: 12 }}>{poError}</div>}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn" onClick={closePO} disabled={poLoading}>Cancel</button>
              <button className="btn" onClick={submitPO} style={{ fontWeight: 700 }} disabled={poLoading}>{poLoading ? 'Creating…' : 'Create PO'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function badgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('approved') || s.includes('active')) return 'approved';
  if (s.includes('pending')) return 'pending';
  if (s.includes('hold')) return 'on-hold';
  if (s.includes('suspend')) return 'suspended';
  return '';
}

export default VendorsTable;

// ---- Visuals ----
function TrustGauge({ score }: { score: number }) {
  const s = Math.max(0, Math.min(100, isFinite(score) ? score : 0));
  const R = 14;
  const C = 2 * Math.PI * R;
  const off = C * (1 - s / 100);
  const color = s >= 85 ? '#10B981' : s >= 70 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg width="36" height="36" viewBox="0 0 36 36" aria-label={`Trust ${s}%`}>
        <circle cx="18" cy="18" r={R} fill="none" stroke="#E5E7EB" strokeWidth={4} />
        <motion.circle
          cx="18" cy="18" r={R} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={C}
          strokeDashoffset={C}
          strokeLinecap="round"
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      <span style={{ fontWeight: 800, color }}>{s}%</span>
    </div>
  );
}
