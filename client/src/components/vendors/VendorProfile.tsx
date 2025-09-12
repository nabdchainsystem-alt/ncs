import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  IconButton,
  Box,
  Button,
  Typography,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
  Chip,
  Divider,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KpiCard from '../common/KpiCard';

interface VendorProfileProps {
  open: boolean;
  onClose: () => void;
  vendor: any;
  /** Send RFQ with selected item codes for this vendor */
  onSendRFQ?: (payload: { vendorId: number; itemCodes: string[] }) => void;
  /** Create PO (or open Contract flow) with selected item codes for this vendor */
  onCreatePO?: (payload: { vendorId: number; itemCodes: string[] }) => void;
}

const tabLabels = [
  'Overview',
  'Company Info',
  'Products & Prices',
  'Performance',
  'Compliance',
  'Contracts',
  'Activity Log & Notes',
  'Files',
  'Risks & Mitigations',
];

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: .4, mb: 1 }}>
    {children}
  </Typography>
);


const SparkLine: React.FC<{ values: number[]; color?: string }> = ({ values, color = '#3B82F6' }) => {
  const w = 220, h = 60, pad = 6;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const dx = (w - pad * 2) / (values.length - 1 || 1);
  const scaleY = (v: number) => pad + (h - pad * 2) * (1 - (v - min) / (max - min || 1));
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * dx} ${scaleY(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h }}>
      <path d={path} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
};

const VendorProfile: React.FC<VendorProfileProps> = ({ open, onClose, vendor, onSendRFQ, onCreatePO }) => {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [rfqDue, setRfqDue] = useState<string>('');
  const [rfqNotes, setRfqNotes] = useState<string>('');
  const [poLoading, setPoLoading] = useState(false);
  const [poError, setPoError] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const products: { code: string; name?: string; price?: number; currency?: string }[] = useMemo(() => {
    const raw = vendor?.products || vendor?.Products || [];
    if (Array.isArray(raw) && raw.length) {
      return raw.map((p: any) => ({
        code: String(p.itemCode ?? p.code ?? ''),
        name: p.name ?? undefined,
        price: typeof p.price === 'number' ? p.price : undefined,
        currency: p.currency ?? 'SAR',
      })).filter((p: any) => p.code);
    }
    return [
      { code: 'ITEM-001', name: 'Sample Item A', price: 100, currency: 'SAR' },
      { code: 'ITEM-002', name: 'Sample Item B', price: 150, currency: 'SAR' },
      { code: 'ITEM-003', name: 'Sample Item C', price: 200, currency: 'SAR' },
    ];
  }, [vendor]);

  const toggle = (code: string) => {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const clearSelection = () => setSelected([]);

  const vendorId = Number(vendor?.id ?? vendor?.vendorId ?? 0) || 0;

  const handleSendRFQ = () => {
    if (!selected.length) return;
    try {
      if (typeof window !== 'undefined' && (window as any).dispatchEvent) {
        const detail = { vendorId, vendorName: vendor?.name, itemCodes: selected, dueDate: rfqDue || null, notes: rfqNotes || null };
        window.dispatchEvent(new CustomEvent('vendors:rfq', { detail }));
      }
    } catch {}
    if (onSendRFQ) onSendRFQ({ vendorId, itemCodes: selected });
  };

  /** Create PO/Contract via backend API */
  const createPORequest = async (payload: { vendorId: number; itemCodes: string[]; notes?: string | null }) => {
    setPoLoading(true);
    setPoError(null);
    try {
      const res = await fetch('/api/po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: payload.vendorId,
          items: payload.itemCodes,
          notes: payload.notes ?? null,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`po_create_failed_${res.status}: ${text}`);
      }
      const data = await res.json().catch(() => ({}));
      return data;
    } catch (e: any) {
      setPoError(String(e?.message || 'po_create_failed'));
      throw e;
    } finally {
      setPoLoading(false);
    }
  };

  const handleCreatePO = async () => {
    if (!selected.length) return;
    const payload = { vendorId, itemCodes: selected, notes: rfqNotes || null };
    try {
      // Fire DOM event for any app-wide listeners
      if (typeof window !== 'undefined' && (window as any).dispatchEvent) {
        window.dispatchEvent(new CustomEvent('vendors:po', { detail: { ...payload, vendorName: vendor?.name } }));
      }
      // Call backend
      await createPORequest(payload);
      // Notify via callback if provided
      if (onCreatePO) onCreatePO({ vendorId, itemCodes: selected });
      // Optional: quick feedback
      if (typeof window !== 'undefined') alert('PO created successfully');
    } catch {
      if (typeof window !== 'undefined') alert('Failed to create PO. Please try again.');
    }
  };

  // Derived demo metrics if missing
  const metrics = vendor?.metrics || {
    onTimePct: vendor?.onTimePct ?? 92,
    leadTimeAvgDays: vendor?.leadTimeAvgDays ?? 14,
    qualityPpm: vendor?.qualityPpm ?? 650,
    priceIndex: vendor?.priceIndex ?? 101,
    quoteRespHrs: vendor?.quoteRespHrs ?? 36,
  };
  const trustScore = vendor?.trustScore ?? 82;

  const company = {
    code: vendor?.code ?? '—',
    name: vendor?.name ?? '—',
    status: vendor?.status ?? 'Pending',
    categories: (() => { try { return JSON.parse(vendor?.categoriesJson || '[]'); } catch { return []; } })(),
    regions: (() => { try { return JSON.parse(vendor?.regionsJson || '[]'); } catch { return []; } })(),
    bank: vendor?.bank || { iban: 'SAxx xxxx xxxx xxxx', swift: 'SABBSA', beneficiary: vendor?.name || '—' },
    contacts: vendor?.contacts || [{ name: 'Mohammed Ali', role: 'Sales', email: 'sales@example.com', phone: '+9665xxxxxxx' }],
  };

  const history = vendor?.performance || [82, 84, 80, 86, 88, 85, 87, 90, 88, 89, 91, 92];

  const documents = vendor?.documents || [
    { type: 'CR', number: '12345', expiry: '2026-01-01', valid: true },
    { type: 'ISO9001', number: 'ISO9001-2025', expiry: '2025-12-01', valid: true },
  ];

  const files = vendor?.files || [
    { name: 'Alpha_RFQ_July.pdf', size: '320 KB' },
    { name: 'ISO9001.pdf', size: '180 KB' },
  ];

  const risks = vendor?.risks || [
    { label: 'Single‑source for ITEM‑001', severity: 'High' },
    { label: 'Expiring ISO within 60 days', severity: 'Medium' },
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          {vendor?.name || 'Vendor'}
        </Typography>
        <IconButton onClick={onClose} edge="end" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          {tabLabels.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
        <Box sx={{ mt: 2 }}>
          {/* Overview */}
          {tab === 0 && (
            <Box>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                <div><KpiCard label="Trust Score" value={trustScore} unit="/100" /></div>
                <div><KpiCard label="On‑Time %" value={metrics.onTimePct} unit="%" /></div>
                <div><KpiCard label="Lead Time" value={metrics.leadTimeAvgDays} unit="days" /></div>
                <div><KpiCard label="Quote Resp." value={metrics.quoteRespHrs} unit="hrs" /></div>
              </div>
              <Box sx={{ mt: 2 }}>
                <SectionTitle>Performance (12m)</SectionTitle>
                <SparkLine values={history} />
              </Box>
            </Box>
          )}

          {/* Company Info */}
          {tab === 1 && (
            <Box>
              <SectionTitle>Identity</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                <div><Typography><b>Code:</b> {company.code}</Typography></div>
                <div><Typography><b>Status:</b> {company.status}</Typography></div>
                <div><Typography><b>Name:</b> {company.name}</Typography></div>
              </div>
              <Divider sx={{ my: 2 }} />
              <SectionTitle>Categories & Regions</SectionTitle>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {(company.categories as string[]).map((c) => <Chip key={c} label={c} size="small" />)}
                {(!company.categories || (company.categories as string[]).length === 0) && <Typography color="text.secondary">—</Typography>}
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
                {(company.regions as string[]).map((r) => <Chip key={r} label={r} size="small" color="success" />)}
                {(!company.regions || (company.regions as string[]).length === 0) && <Typography color="text.secondary">—</Typography>}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <SectionTitle>Contacts</SectionTitle>
              <List dense>
                {company.contacts.map((c: any, i: number) => (
                  <ListItem key={i}>
                    <ListItemText primary={`${c.name} • ${c.role}`} secondary={`${c.email} • ${c.phone}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Products & Prices */}
          {tab === 2 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Products &amp; Prices</Typography>
              <List dense sx={{ border: '1px solid #eee', borderRadius: 1, maxHeight: 280, overflow: 'auto' }}>
                {products.map((p) => (
                  <ListItem key={p.code} secondaryAction={
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {p.price != null ? `${p.price} ${p.currency || ''}` : ''}
                    </Typography>
                  }>
                    <ListItemIcon>
                      <Checkbox edge="start" checked={selected.includes(p.code)} tabIndex={-1} onChange={() => toggle(p.code)} />
                    </ListItemIcon>
                    <ListItemText primary={`${p.code}${p.name ? ' • ' + p.name : ''}`} />
                  </ListItem>
                ))}
              </List>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
                <TextField
                  label="Due Date"
                  type="date"
                  size="small"
                  value={rfqDue}
                  onChange={(e) => setRfqDue(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Notes"
                  size="small"
                  fullWidth
                  value={rfqNotes}
                  onChange={(e) => setRfqNotes(e.target.value)}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
                <Button variant="contained" color="primary" disabled={!selected.length} onClick={handleSendRFQ}>Send RFQ</Button>
                <Button variant="outlined" color="secondary" disabled={!selected.length || poLoading} onClick={handleCreatePO}>
                  {poLoading ? 'Creating PO…' : 'Create PO / Contract'}
                </Button>
                <Button variant="text" onClick={clearSelection} disabled={!selected.length}>Clear Selection</Button>
              </Stack>
              {poError && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {poError}
                </Typography>
              )}
            </Box>
          )}

          {/* Performance */}
          {tab === 3 && (
            <Box>
              <SectionTitle>KPIs</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                <div><KpiCard label="On‑Time %" value={metrics.onTimePct} unit="%" /></div>
                <div><KpiCard label="Lead Time" value={metrics.leadTimeAvgDays} unit="d" /></div>
                <div><KpiCard label="Quality PPM" value={metrics.qualityPpm} /></div>
                <div><KpiCard label="Trust" value={trustScore} unit="/100" /></div>
              </div>
              <Box sx={{ mt: 2 }}>
                <SectionTitle>On‑Time vs Defects (12m)</SectionTitle>
                <SparkLine values={[88,90,87,91,92,93,90,94,95,92,91,93]} />
              </Box>
            </Box>
          )}

          {/* Compliance */}
          {tab === 4 && (
            <Box>
              <SectionTitle>Documents</SectionTitle>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Number</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Expiry</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Valid</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d: any, i: number) => (
                    <tr key={i}>
                      <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{d.type}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{d.number}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{String(d.expiry).slice(0,10)}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{d.valid ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}

          {/* Contracts */}
          {tab === 5 && (
            <Box>
              <SectionTitle>Contracts</SectionTitle>
              <Typography color="text.secondary">No contracts linked yet. Use "Create PO / Contract" from Products tab.</Typography>
            </Box>
          )}

          {/* Activity & Notes */}
          {tab === 6 && (
            <Box>
              <SectionTitle>Recent Activity</SectionTitle>
              <List dense>
                <ListItem><ListItemText primary="RFQ sent for ITEM‑001, ITEM‑002" secondary="Today 10:40" /></ListItem>
                <ListItem><ListItemText primary="Trust score recomputed (82 → 85)" secondary="Yesterday 14:05" /></ListItem>
              </List>
            </Box>
          )}

          {/* Files */}
          {tab === 7 && (
            <Box>
              <SectionTitle>Files</SectionTitle>
              <List dense>
                {files.map((f: any, i: number) => (
                  <ListItem key={i}>
                    <ListItemText primary={f.name} secondary={f.size} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Risks */}
          {tab === 8 && (
            <Box>
              <SectionTitle>Risks & Mitigations</SectionTitle>
              <List dense>
                {risks.map((r: any, i: number) => (
                  <ListItem key={i}>
                    <ListItemText primary={r.label} secondary={`Severity: ${r.severity}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default VendorProfile;
