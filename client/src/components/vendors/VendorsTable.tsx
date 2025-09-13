import React, { useMemo, useState, useCallback } from 'react';
import { Eye, FileText, GitCompare, FileSignature, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVendors } from '../../context/VendorsContext';

export type VendorRow = {
  id: number;
  code?: string;
  nameEn?: string;
  nameAr?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  category?: string;
  status?: string;
  cr?: string;
  vat?: string;
  bank?: string;
  iban?: string;
};

interface VendorsTableProps {
  rows?: VendorRow[];
  onView: (row: VendorRow) => void;
  onRFQ: (row: VendorRow) => void;
  onCompare: (row: VendorRow) => void;
  onContract: (row: VendorRow) => void;
  onNotes: (row: VendorRow) => void;
}

type SortKey = keyof Pick<VendorRow, 'code' | 'nameEn' | 'nameAr' | 'contactPerson' | 'phone' | 'email' | 'address' | 'category' | 'status' | 'cr' | 'vat' | 'bank' | 'iban'>;

type SortDir = 'asc' | 'desc';

// Helper to safely parse JSON fields coming from server
function safeParseJSON(input: any): any {
  if (!input) return null;
  if (typeof input !== 'string') return input;
  try { return JSON.parse(input); } catch { return null; }
}

const VendorsTable: React.FC<VendorsTableProps> = ({ rows, onView, onRFQ, onCompare, onContract, onNotes }) => {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const { vendors: vendorsFromCtx } = useVendors();

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

  // Build data from context vendors if rows not provided
  const data: VendorRow[] = useMemo(() => {
    if (rows) return rows;
    return (vendorsFromCtx as any[]).map((v: any) => {
      const contacts = safeParseJSON(v.contactsJson);
      const bank = safeParseJSON(v.bankJson);
      const cats = safeParseJSON(v.categoriesJson);
      const category = Array.isArray(cats) ? cats[0] : (typeof cats === 'string' ? cats : undefined);
      let contactPerson: string | undefined;
      let phone: string | undefined;
      let email: string | undefined;
      let address: string | undefined;
      let nameAr: string | undefined;
      if (contacts && typeof contacts === 'object') {
        if (Array.isArray(contacts) && contacts.length) {
          contactPerson = contacts[0]?.name || contacts[0]?.contactPerson;
          phone = contacts[0]?.phone;
          email = contacts[0]?.email;
          address = contacts[0]?.address;
        } else {
          contactPerson = contacts.contactPerson || contacts.name || undefined;
          phone = contacts.phone || undefined;
          email = contacts.email || undefined;
          address = contacts.address || undefined;
          nameAr = contacts.nameAr || undefined;
        }
      }
      return {
        id: Number(v.id) || 0,
        code: v.code,
        nameEn: v.name,
        nameAr,
        contactPerson,
        phone,
        email,
        address,
        category,
        status: v.status,
        cr: bank?.cr,
        vat: bank?.vat,
        bank: bank?.bank || bank?.bankName,
        iban: bank?.iban,
      } as VendorRow;
    });
  }, [rows, vendorsFromCtx]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) =>
      [r.code, r.nameEn, r.nameAr, r.contactPerson, r.phone, r.email, r.address, r.category, r.status, r.cr, r.vat, r.bank, r.iban]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    );
  }, [data, filter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let va: any = (a as any)[sortKey];
      let vb: any = (b as any)[sortKey];
      va = String(va ?? '').toLowerCase();
      vb = String(vb ?? '').toLowerCase();
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
          placeholder="Filter by code/name/contact/CR/VAT..."
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
            <SortableTh label="Vendor Code" k="code" />
            <SortableTh label="Vendor Name English" k="nameEn" />
            <SortableTh label="Vendor Name Arabic" k="nameAr" />
            <SortableTh label="Contact Person" k="contactPerson" />
            <SortableTh label="Phone" k="phone" />
            <SortableTh label="Email" k="email" />
            <SortableTh label="Address" k="address" />
            <SortableTh label="Category" k="category" />
            <SortableTh label="Status" k="status" />
            <SortableTh label="CR" k="cr" />
            <SortableTh label="VAT" k="vat" />
            <SortableTh label="Bank" k="bank" />
            <SortableTh label="IBAN" k="iban" />
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
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.code}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.nameEn}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.nameAr || '—'}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.contactPerson || '—'}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.phone || '—'}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.email || '—'}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.address || '—'}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.category || '—'}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>
                <span className={`vendor-badge ${badgeClass(row.status || '')}`}>{row.status}</span>
              </td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.cr || '—'}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.vat || '—'}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.bank || '—'}</td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>{row.iban || '—'}</td>
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
                    <div className="title">{row.nameEn} {row.code ? `• ${row.code}` : ''}</div>
                    <div className="line"><span>Contact</span><span>{row.contactPerson || '—'}</span></div>
                    <div className="line"><span>Phone</span><span>{row.phone || '—'}</span></div>
                    <div className="line"><span>Email</span><span>{row.email || '—'}</span></div>
                    <div className="line"><span>Bank</span><span>{row.bank || '—'}</span></div>
                    <div className="line"><span>IBAN</span><span>{row.iban || '—'}</span></div>
                  </div>
                )}
              </td>
            </motion.tr>
          ))}
          </AnimatePresence>

          {pageRows.length === 0 && (
            <tr>
              <td colSpan={14} style={{ padding: 20, textAlign: 'center', color: '#6B7280' }}>No vendors match current filters.</td>
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
          <div style={{ width: 'min(90vw, 560px)', background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,.25)', border: '1px solid #E5E7EB' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800 }}>Send RFQ</div>
              <button onClick={closeRFQ} className="btn" style={{ borderRadius: 8 }}>✕</button>
            </div>
            <div style={{ padding: 16, display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 14 }}>
                <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>Vendor</div>
                <div style={{ fontWeight: 700 }}>{rfqFor.nameEn}{rfqFor.code ? ` • ${rfqFor.code}` : ''}</div>
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
          <div style={{ width: 'min(90vw, 560px)', background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,.25)', border: '1px solid #E5E7EB' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800 }}>Create PO / Contract</div>
              <button onClick={closePO} className="btn" style={{ borderRadius: 8 }}>✕</button>
            </div>
            <div style={{ padding: 16, display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 14 }}>
                <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>Vendor</div>
                <div style={{ fontWeight: 700 }}>{poFor.nameEn}{poFor.code ? ` • ${poFor.code}` : ''}</div>
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
