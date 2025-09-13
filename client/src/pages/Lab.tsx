import React from 'react';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { OrdersProvider, useOrders } from '../context/OrdersContext';
import { InventoryProvider, useInventory } from '../context/InventoryContext';
import { VendorsProvider, useVendors } from '../context/VendorsContext';
import { listRequests } from '../lib/api';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Upload, Download, FileDown, History as HistoryIcon } from 'lucide-react';
import HeaderBar from '../components/ui/HeaderBar';

type TableRows = (string | number)[][];

function DataTable({ columns, rows }: { columns: string[]; rows: TableRows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <div className="table-wrap"><table className="u-table text-sm">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2.5 text-left font-semibold border-b border-gray-200">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={columns.length}>No data</td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={idx} className={idx % 2 ? 'bg-white' : 'bg-gray-50/50'}>
                {r.map((cell, i) => (
                  <td key={i} className="px-3 py-2.5 border-b border-gray-100">{String(cell)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table></div>
    </div>
  );
}

function RoseCharts({ charts }: { charts: { title: string; data: { name: string; value: number }[] }[] }) {
  const roseOption = (title: string, data: { name: string; value: number }[]): EChartsOption => ({
    backgroundColor: 'transparent',
    title: { text: title, left: 'center', top: 6, textStyle: { fontSize: 12, fontWeight: 600 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [
      {
        name: title,
        type: 'pie',
        radius: ['20%', '70%'],
        center: ['50%', '60%'],
        roseType: 'area',
        data,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: 'rgba(0,0,0,0.08)'
        },
      },
    ],
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      {charts.map((c, i) => (
        <div key={i} className="bg-white/0 border border-gray-200 rounded-xl">
          <ReactECharts style={{ height: 220, width: '100%' }} option={roseOption(c.title, c.data)} notMerge lazyUpdate />
        </div>
      ))}
    </div>
  );
}

function Block({
  title,
  actions,
  templateColumns,
  rows,
  columns,
  charts,
}: {
  title: string;
  actions: { label: string; onClick?: () => void; icon?: React.ReactNode; variant?: 'primary' | 'outline' }[];
  templateColumns: string[];
  rows: TableRows;
  columns: string[];
  charts?: { title: string; data: { name: string; value: number }[] }[];
}) {
  return (
    <Card className="shadow-lg-soft" interactive>
      <CardHeader className="mb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>Template Columns: {templateColumns.join(' · ')}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((a) => (
              <Button key={a.label} variant={a.variant ?? 'outline'} size="sm" onClick={a.onClick} className={a.variant==='primary' ? '' : 'border-gray-300'}>
                <span className="inline-flex items-center gap-1.5">{a.icon}{a.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {charts && charts.length ? <RoseCharts charts={charts} /> : null}
        <div className="text-xs text-gray-500 mb-2">Preview · Last 5 rows (read‑only)</div>
        <DataTable columns={columns} rows={rows} />
      </CardContent>
    </Card>
  );
}

// ---- Helpers ----
function fmtDate(v?: string | Date | null): string {
  if (!v) return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  return isNaN(d.getTime()) ? '—' : d.toISOString().slice(0, 10);
}

function downloadCsv(filename: string, headers: string[], rows: TableRows) {
  const esc = (s: any) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const lines = [headers.join(',')].concat(rows.map((r) => r.map(esc).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

function firstRegionOf(v: any): string {
  try { const arr = JSON.parse(v?.regionsJson || '[]'); return Array.isArray(arr) && arr[0] ? arr[0] : '—'; } catch { return '—'; }
}

// ---- Inner content with Providers ----
function LabContent() {
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState<'supply' | 'ops'>('supply');

  // Providers data/hooks
  const { view: ordersView, orders, setQuery: setOrdersQuery } = useOrders();
  const { view: invView, items: invItems, setQuery: setInvQuery, exportCsv: exportInvCsv } = useInventory();
  const { vendors, setQuery: setVendorsQuery, exportVendors, importVendors, reload: reloadVendors } = useVendors();

  // Sync global search with providers
  React.useEffect(() => {
    setOrdersQuery(q);
    setInvQuery(q);
    setVendorsQuery(q);
  }, [q, setOrdersQuery, setInvQuery, setVendorsQuery]);

  // Requests from API
  const [requestsRows, setRequestsRows] = React.useState<TableRows>([]);
  const [requestsItems, setRequestsItems] = React.useState<any[]>([]);
  const [rfqRows, setRfqRows] = React.useState<TableRows>([]);
  const [requestsLoading, setRequestsLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setRequestsLoading(true);
      try {
        const res = await listRequests({ page: 1, pageSize: 50, q, sortBy: 'createdAt', sortDir: 'desc' });
        if (cancelled) return;
        const items = res.items || [];
        const rows: TableRows = items.slice(0,5).map((r: any) => [
          r.orderNo || r.id,
          (r.items?.[0] as any)?.requester || r.vendor || '—',
          r.department || '—',
          fmtDate(r.createdAt || r.requiredDate),
          r.priority || '—',
          r.status || '—',
        ]);
        setRequestsRows(rows);
        setRequestsItems(items);

        // Derive RFQ preview from request items
        const rfq: TableRows = [];
        for (const r of items) {
          const baseDate = new Date(r.createdAt || Date.now());
          const validity = new Date(baseDate.getTime() + 14 * 86400000);
          const vendorName = r.vendor || (r.items?.[0] as any)?.requester || 'Vendor';
          const firstItemQty = Number(r.items?.[0]?.qty || 1);
          const price = Math.max(50, firstItemQty * 100);
          rfq.push([vendorName, price, 'SAR', fmtDate(validity)]);
          if (rfq.length >= 5) break;
        }
        setRfqRows(rfq);
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [q]);

  // Derived rows from providers
  const ordersRows: TableRows = React.useMemo(() => {
    const sorted = [...ordersView].sort((a, b) => (a.date < b.date ? 1 : -1));
    return sorted.slice(0, 5).map((o) => [o.orderNo, o.vendor, o.items, o.value, o.status, fmtDate(o.deliveryDate)]);
  }, [ordersView]);

  const inventoryRows: TableRows = React.useMemo(() => {
    const statusOf = (qty: number, min: number) => (qty <= 0 ? 'Out' : qty < min ? 'Low' : 'OK');
    const sorted = [...invView].sort((a, b) => (a.id < b.id ? 1 : -1));
    return sorted.slice(0, 5).map((it) => [it.name, it.qty, it.minLevel, it.warehouse, statusOf(it.qty, it.minLevel)]);
  }, [invView]);

  const vendorsRows: TableRows = React.useMemo(() => {
    const pickRegion = (v: any) => (v.region ?? firstRegionOf(v));
    return (vendors || []).slice(0, 5).map((v: any) => [v.code || '—', v.name || '—', pickRegion(v), v.trustScore ?? '—', v.status || '—']);
  }, [vendors]);

  // ---- Charts datasets (rose) ----
  const toChartData = (entries: [string, number][]) => entries.filter(([,v]) => v > 0).map(([name, value]) => ({ name, value }));
  const countBy = (arr: any[], pick: (x: any) => string) => {
    const m = new Map<string, number>();
    for (const x of arr) {
      const k = pick(x) || '—';
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a,b)=> b[1]-a[1]);
  };

  const requestsCharts = React.useMemo(() => {
    const byStatus = toChartData(countBy(requestsItems, r => String(r.status || '—')).slice(0,8));
    const byDept = toChartData(countBy(requestsItems, r => String(r.department || '—')).slice(0,8));
    const byPriority = toChartData(countBy(requestsItems, r => String(r.priority || 'Medium')).slice(0,8));
    return [
      { title: 'Requests by Status', data: byStatus },
      { title: 'Requests by Department', data: byDept },
      { title: 'Requests by Priority', data: byPriority },
    ];
  }, [requestsItems]);

  const rfqCharts = React.useMemo(() => {
    const vendorsC = new Map<string, number>();
    const priceBuckets = new Map<string, number>([['<=12k',0],['12–13k',0],[">13k",0]]);
    const validityWeeks = new Map<string, number>();
    for (const [vendor, price, , validity] of rfqRows as any[]) {
      vendorsC.set(String(vendor), (vendorsC.get(String(vendor)) || 0) + 1);
      const p = Number(price) || 0;
      if (p <= 12000) priceBuckets.set('<=12k', (priceBuckets.get('<=12k')||0)+1);
      else if (p <= 13000) priceBuckets.set('12–13k', (priceBuckets.get('12–13k')||0)+1);
      else priceBuckets.set('>13k', (priceBuckets.get('>13k')||0)+1);
      const wk = validity ? 'W' + Math.ceil(new Date(validity).getDate() / 7) : 'W?';
      validityWeeks.set(wk, (validityWeeks.get(wk) || 0) + 1);
    }
    const topVendors = toChartData(Array.from(vendorsC.entries()).sort((a,b)=>b[1]-a[1]).slice(0,8));
    const priceDist = toChartData(Array.from(priceBuckets.entries()));
    const validityDist = toChartData(Array.from(validityWeeks.entries()).sort());
    return [
      { title: 'Quotes by Vendor', data: topVendors },
      { title: 'Price Buckets', data: priceDist },
      { title: 'Validity (week)', data: validityDist },
    ];
  }, [rfqRows]);

  const ordersCharts = React.useMemo(() => {
    const byStatus = toChartData(countBy(orders, o => o.status).slice(0,8));
    const byVendor = toChartData(countBy(orders, o => o.vendor).slice(0,8));
    const byMode = toChartData(countBy(orders, o => o.shipMode).slice(0,8));
    return [
      { title: 'Orders by Status', data: byStatus },
      { title: 'Orders by Vendor', data: byVendor },
      { title: 'Orders by Ship Mode', data: byMode },
    ];
  }, [orders]);

  const invCharts = React.useMemo(() => {
    const statusOf = (x: any) => (x.qty <= 0 ? 'Out' : x.qty < x.minLevel ? 'Low' : 'OK');
    const byWh = toChartData(countBy(invItems, x => x.warehouse).slice(0,8));
    const byCat = toChartData(countBy(invItems, x => x.category).slice(0,8));
    const byStatus = toChartData(countBy(invItems, statusOf).slice(0,8));
    return [
      { title: 'Items by Warehouse', data: byWh },
      { title: 'Items by Category', data: byCat },
      { title: 'Stock Status', data: byStatus },
    ];
  }, [invItems]);

  const vendorsCharts = React.useMemo(() => {
    const pickRegion = (v: any) => String(v.region ?? firstRegionOf(v));
    const bucket = (t?: number) => {
      const n = Number(t ?? 0);
      if (n < 60) return 'Low (<60)';
      if (n < 80) return 'Medium (60–79)';
      return 'High (80+)';
    };
    const byStatus = toChartData(countBy(vendors as any[], v => String(v.status || '—')).slice(0,8));
    const byRegion = toChartData(countBy(vendors as any[], pickRegion).slice(0,8));
    const byTrust = toChartData(countBy(vendors as any[], v => bucket(v.trustScore)).slice(0,8));
    return [
      { title: 'Vendors by Status', data: byStatus },
      { title: 'Vendors by Region', data: byRegion },
      { title: 'Vendors by Trust', data: byTrust },
    ];
  }, [vendors]);

  // Actions per block
  const vendorsFileRef = React.useRef<HTMLInputElement | null>(null);
  const triggerVendorsImport = () => vendorsFileRef.current?.click();
  const onVendorsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { await importVendors(file); await reloadVendors(); }
    finally { e.target.value = ''; }
  };

  const exportVendorsData = async () => {
    const blob = await exportVendors();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vendors.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const downloadRequestsData = async () => {
    const res = await listRequests({ page: 1, pageSize: 100, q, sortBy: 'createdAt', sortDir: 'desc' });
    const headers = ['Request No','Requester','Dept','Date','Priority','Status'];
    const rows: TableRows = (res.items || []).map((r: any) => [
      r.orderNo || r.id,
      r.items?.[0]?.requester || r.vendor || '—',
      r.department || '—',
      fmtDate(r.createdAt || r.requiredDate),
      r.priority || '—',
      r.status || '—',
    ]);
    downloadCsv('requests.csv', headers, rows);
  };

  const downloadOrdersData = () => {
    const headers = ['PO No','Vendor','Items','Total','Status','Delivery Date'];
    const rows: TableRows = [...orders]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((o) => [o.orderNo, o.vendor, o.items, o.value, o.status, fmtDate(o.deliveryDate)]);
    downloadCsv('orders.csv', headers, rows);
  };

  const downloadInventorySnapshot = () => {
    const headers = ['Item','Stock','Minimum','Location','Status'];
    const statusOf = (qty: number, min: number) => (qty <= 0 ? 'Out' : qty < min ? 'Low' : 'OK');
    const rows: TableRows = [...invItems]
      .sort((a, b) => (a.id < b.id ? 1 : -1))
      .map((it) => [it.name, it.qty, it.minLevel, it.warehouse, statusOf(it.qty, it.minLevel)]);
    downloadCsv('inventory_snapshot.csv', headers, rows);
  };

  const exportTemplate = (name: string, headers: string[]) => downloadCsv(`${name}_template.csv`, headers, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <HeaderBar
        title="Lab"
        onSearch={(s)=> setQ(s)}
        searchPlaceholder="Search across requests, vendors, orders, inventory…"
        actions={[
          { key:'history', label:'History', icon:<HistoryIcon className='w-4 h-4' />, onClick:()=> alert('History') },
          { key:'export', label:'Export', icon:<Download className='w-4 h-4' />, onClick:()=> alert('Export') },
        ]}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          className={`px-4 py-2 rounded-full text-sm border ${tab==='supply' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          onClick={() => setTab('supply')}
        >
          Supply Chain
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm border ${tab==='ops' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          onClick={() => setTab('ops')}
        >
          Operations
        </button>
      </div>

      {/* hidden file input(s) */}
      <input ref={vendorsFileRef} type="file" accept=".csv,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{ display: 'none' }} onChange={onVendorsFile} />

      {/* Content: stacked full-width blocks */}
      {tab === 'supply' ? (
        <div className="space-y-5">
          <Block
            title="Requests"
            actions={[
              { label: 'Import File', icon: <Upload className="w-4 h-4" />, onClick: () => alert('Requests import: not implemented yet') },
              { label: 'Export Template', icon: <FileDown className="w-4 h-4" />, onClick: () => exportTemplate('requests', ['Request No','Requester','Dept','Date','Priority','Status']) },
              { label: 'Download Data', icon: <Download className="w-4 h-4" />, variant: 'primary', onClick: downloadRequestsData },
              { label: 'History', icon: <HistoryIcon className="w-4 h-4" />, onClick: () => alert('Requests history: not implemented yet') },
            ]}
            templateColumns={["Request No", "Requester", "Dept", "Date", "Priority", "Status"]}
            columns={["Request No", "Requester", "Dept", "Date", "Priority", "Status"]}
            rows={requestsRows}
            charts={requestsCharts}
          />
          <Block
            title="RFQ Comparison"
            actions={[
              { label: 'Import', icon: <Upload className="w-4 h-4" />, onClick: () => alert('RFQ import: not implemented yet') },
              { label: 'Export Template', icon: <FileDown className="w-4 h-4" />, onClick: () => exportTemplate('rfq_comparison', ['Vendor','Price','Currency','Validity']) },
              { label: 'Download Data', icon: <Download className="w-4 h-4" />, variant: 'primary', onClick: () => downloadCsv('rfq_comparison.csv', ['Vendor','Price','Currency','Validity'], rfqRows) },
              { label: 'History', icon: <HistoryIcon className="w-4 h-4" />, onClick: () => alert('RFQ history: not implemented yet') },
            ]}
            templateColumns={["Vendor", "Price", "Currency", "Validity"]}
            columns={["Vendor", "Price", "Currency", "Validity"]}
            rows={rfqRows}
            charts={rfqCharts}
          />
          <Block
            title="Orders"
            actions={[
              { label: 'Import', icon: <Upload className="w-4 h-4" />, onClick: () => alert('Orders import: not implemented yet') },
              { label: 'Export Template', icon: <FileDown className="w-4 h-4" />, onClick: () => exportTemplate('orders', ['PO No','Vendor','Items','Total','Status','Delivery Date']) },
              { label: 'Download Data', icon: <Download className="w-4 h-4" />, variant: 'primary', onClick: downloadOrdersData },
            ]}
            templateColumns={["PO No", "Vendor", "Items", "Total", "Status", "Delivery Date"]}
            columns={["PO No", "Vendor", "Items", "Total", "Status", "Delivery Date"]}
            rows={ordersRows}
            charts={ordersCharts}
          />
          <Block
            title="Inventory"
            actions={[
              { label: 'Import', icon: <Upload className="w-4 h-4" />, onClick: () => alert('Inventory import: not implemented yet') },
              { label: 'Export Template', icon: <FileDown className="w-4 h-4" />, onClick: () => exportTemplate('inventory', ['Item','Stock','Minimum','Location','Status']) },
              { label: 'Download Snapshot', icon: <Download className="w-4 h-4" />, variant: 'primary', onClick: downloadInventorySnapshot },
            ]}
            templateColumns={["Item", "Stock", "Minimum", "Location", "Status"]}
            columns={["Item", "Stock", "Minimum", "Location", "Status"]}
            rows={inventoryRows}
            charts={invCharts}
          />
          <Block
            title="Vendors"
            actions={[
              { label: 'Import', icon: <Upload className="w-4 h-4" />, onClick: triggerVendorsImport },
              { label: 'Export Template', icon: <FileDown className="w-4 h-4" />, onClick: () => exportTemplate('vendors', ['Vendor Code','Name','City','Rating','Active']) },
              { label: 'Download Data', icon: <Download className="w-4 h-4" />, variant: 'primary', onClick: exportVendorsData },
            ]}
            templateColumns={["Vendor Code", "Name", "City", "Rating", "Active"]}
            columns={["Vendor Code", "Name", "City", "Rating", "Active"]}
            rows={vendorsRows}
            charts={vendorsCharts}
          />
        </div>
      ) : (
        <div className="space-y-5">
          <Block
            title="Maintenance"
            actions={[
              { label: 'Import', icon: <Upload className="w-4 h-4" />, onClick: () => alert('Maintenance import: not implemented yet') },
              { label: 'Export Template', icon: <FileDown className="w-4 h-4" />, onClick: () => exportTemplate('maintenance', ['Ticket','Asset','Priority','Status','Due Date']) },
              { label: 'Download Data', icon: <Download className="w-4 h-4" />, onClick: () => alert('Use your CMMS export here') },
            ]}
            templateColumns={["Ticket", "Asset", "Priority", "Status", "Due Date"]}
            columns={["Ticket", "Asset", "Priority", "Status", "Due Date"]}
            rows={[]}
            charts={[
              { title: 'By Priority', data: [{ name: 'High', value: 6 }, { name: 'Medium', value: 10 }, { name: 'Low', value: 3 }] },
              { title: 'By Status', data: [{ name: 'Open', value: 9 }, { name: 'In Progress', value: 5 }, { name: 'Completed', value: 5 }] },
              { title: 'By Due Week', data: [{ name: 'W1', value: 4 }, { name: 'W2', value: 8 }, { name: 'W3', value: 7 }] },
            ]}
          />
          <Block
            title="Production"
            actions={[
              { label: 'Import', icon: <Upload className="w-4 h-4" />, onClick: () => alert('Production import: not implemented yet') },
              { label: 'Export Template', icon: <FileDown className="w-4 h-4" />, onClick: () => exportTemplate('production', ['WO No','Product','Planned','Produced','Status']) },
              { label: 'Download Data', icon: <Download className="w-4 h-4" />, onClick: () => alert('Use your MES/ERP export here') },
            ]}
            templateColumns={["WO No", "Product", "Planned", "Produced", "Status"]}
            columns={["WO No", "Product", "Planned", "Produced", "Status"]}
            rows={[]}
            charts={[
              { title: 'By Status', data: [{ name: 'Planned', value: 5 }, { name: 'Running', value: 7 }, { name: 'Completed', value: 3 }] },
              { title: 'By Line', data: [{ name: 'Line A', value: 6 }, { name: 'Line B', value: 4 }, { name: 'Line C', value: 5 }] },
              { title: 'By Product', data: [{ name: 'A', value: 7 }, { name: 'B', value: 5 }, { name: 'C', value: 3 }] },
            ]}
          />
          <Block
            title="Quality"
            actions={[
              { label: 'Import', icon: <Upload className="w-4 h-4" />, onClick: () => alert('Quality import: not implemented yet') },
              { label: 'Export Template', icon: <FileDown className="w-4 h-4" />, onClick: () => exportTemplate('quality', ['Lot','Product','Inspection Date','Result','Defects']) },
              { label: 'Download Data', icon: <Download className="w-4 h-4" />, onClick: () => alert('Use your QMS export here') },
            ]}
            templateColumns={["Lot", "Product", "Inspection Date", "Result", "Defects"]}
            columns={["Lot", "Product", "Inspection Date", "Result", "Defects"]}
            rows={[]}
            charts={[
              { title: 'Results', data: [{ name: 'Pass', value: 18 }, { name: 'Fail', value: 3 }] },
              { title: 'By Product', data: [{ name: 'A', value: 9 }, { name: 'B', value: 7 }, { name: 'C', value: 5 }] },
              { title: 'Defect Types', data: [{ name: 'Scratch', value: 5 }, { name: 'Crack', value: 3 }, { name: 'Color', value: 2 }] },
            ]}
          />
        </div>
      )}
    </div>
  );
}

export default function LabPage() {
  return (
    <OrdersProvider>
      <InventoryProvider>
        <VendorsProvider>
          <LabContent />
        </VendorsProvider>
      </InventoryProvider>
    </OrdersProvider>
  );
}
