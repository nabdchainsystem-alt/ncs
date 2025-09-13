import React from 'react';
import { motion } from 'framer-motion';

type Req = { requestNo: string; department?: string; status: 'NEW'|'RFQ'|'APPROVED'|'COMPLETED'; requiredDate?: string; quantity?: number };

export default function QuickReports({ requests }: { requests: Req[] }) {
  const uniq = React.useMemo(() => {
    const m = new Map<string, Req>();
    requests.forEach(r => m.set(r.requestNo, r));
    return Array.from(m.values());
  }, [requests]);

  const thisWeek = React.useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 6*86400000);
    return uniq.filter(r => {
      const d = r.requiredDate ? new Date(r.requiredDate) : now;
      return d >= weekAgo && d <= now;
    }).length;
  }, [uniq]);

  const topDept = React.useMemo(() => {
    const m = new Map<string, number>();
    uniq.forEach(r => m.set(r.department || '—', (m.get(r.department || '—') || 0) + 1));
    let best = '—', n = 0; for (const [k,v] of m) { if (v > n) { best=k; n=v; } }
    return best;
  }, [uniq]);

  const approvals = uniq.filter(r => r.status === 'APPROVED').length;
  const pending = uniq.filter(r => r.status !== 'APPROVED' && r.status !== 'COMPLETED').length;
  const ratio = (approvals + pending) ? Math.round((approvals / (approvals + pending)) * 100) : 0;

  const avgLeadDays = React.useMemo(() => {
    const approved = uniq.filter(r => r.status === 'APPROVED');
    if (!approved.length) return '—';
    const now = Date.now();
    const days = approved.map(r => {
      const d = r.requiredDate ? new Date(r.requiredDate).getTime() : now;
      return Math.max(0, Math.round((now - d) / 86400000));
    });
    const avg = Math.round(days.reduce((s,x)=>s+x,0)/days.length);
    return `${avg} d`;
  }, [uniq]);

  // % converted to orders (use APPROVED/COMPLETED as proxy)
  const convertedPct = uniq.length ? Math.round((uniq.filter(r => r.status==='APPROVED' || r.status==='COMPLETED').length / uniq.length) * 100) : 0;

  // Average Request → Order cycle (rough estimate using requiredDate -> now for approved)
  const avgCycle = React.useMemo(() => {
    const approved = uniq.filter(r => r.status==='APPROVED' || r.status==='COMPLETED');
    if (!approved.length) return '—';
    const now = Date.now();
    const days = approved.map(r => {
      const d = r.requiredDate ? new Date(r.requiredDate).getTime() : now;
      return Math.max(0, Math.round((now - d)/86400000));
    });
    const avg = Math.round(days.reduce((s,x)=>s+x,0)/approved.length);
    return `${avg} d`;
  }, [uniq]);

  // High priority pending (heuristic: Maintenance/Operations or qty>=100 and not approved)
  const highPriorityPending = uniq.filter(r => (['Maintenance','Operations'].includes(String(r.department)) || (Number(r.quantity||0) >= 100)) && r.status!=='APPROVED' && r.status!=='COMPLETED').length;

  // Awaiting Quotes (RFQ)
  const awaitingQuotes = uniq.filter(r => r.status==='RFQ').length;

  const cards = [
    { label: 'Total Requests this Week', value: thisWeek },
    { label: 'Top Requesting Department', value: topDept },
    { label: 'Approval Ratio', value: `${ratio}%` },
    { label: 'Avg Approval Lead Time', value: avgLeadDays },
    { label: '% Converted to Orders', value: `${convertedPct}%` },
    { label: 'Avg Request → Order Cycle', value: avgCycle },
    { label: 'High Priority Pending', value: highPriorityPending },
    { label: 'Awaiting Quotes', value: awaitingQuotes },
  ];

  return (
    <div className="card card-p">
      <div className="mb-3 text-sm font-semibold">Quick Reports</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c,i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border p-3 bg-white shadow-card transition duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{c.label}</div>
            <div className="text-2xl font-semibold">{c.value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
