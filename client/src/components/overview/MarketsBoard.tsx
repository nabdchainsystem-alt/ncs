import React from 'react';
import { AsyncECharts } from '../charts/AsyncECharts';

type Quote = { symbol: string; price: number; change: number; changesPercentage: number };
type HistoryPoint = { date: string; close: number };

const FMP_API = 'https://financialmodelingprep.com/api/v3';
const FMP_KEY = (import.meta as any).env?.VITE_FMP_API_KEY || 'demo';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<T>;
}

async function getQuote(symbols: string[]): Promise<Quote[]> {
  try {
    const data = await fetchJSON<any[]>(`${FMP_API}/quote/${symbols.join(',')}?apikey=${FMP_KEY}`);
    return (data || []).map((d) => ({
      symbol: d.symbol,
      price: Number(d.price || d.previousClose || 0),
      change: Number(d.change || 0),
      changesPercentage: Number((d.changesPercentage || '').toString().replace(/[()%]/g, '')),
    }));
  } catch {
    return symbols.map((s, i) => ({ symbol: s, price: 100 + i * 12, change: (i % 2 ? -1 : 1) * (5 + i), changesPercentage: (i % 2 ? -1 : 1) * (1.2 + i / 10) }));
  }
}

async function getHistory(symbol: string, series = 180): Promise<HistoryPoint[]> {
  try {
    const data = await fetchJSON<any>(`${FMP_API}/historical-price-full/${symbol}?serietype=line&timeseries=${series}&apikey=${FMP_KEY}`);
    const hist = Array.isArray(data?.historical) ? data.historical : [];
    return hist.reverse().map((h: any) => ({ date: h.date, close: Number(h.close || 0) }));
  } catch {
    // synthetic
    const out: HistoryPoint[] = [];
    let v = 100;
    for (let i = series - 1; i >= 0; i--) {
      v += (Math.random() - 0.5) * 2.5;
      out.push({ date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10), close: Math.max(10, v) });
    }
    return out;
  }
}

function areaOption(points: HistoryPoint[], color = '#4F46E5') {
  const labels = points.map((p) => p.date);
  const values = points.map((p) => p.close);
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 16, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: labels, boundaryGap: false, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { show: false } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e5e7eb' } } },
    series: [
      {
        type: 'line', smooth: true, data: values, showSymbol: false,
        lineStyle: { color },
        areaStyle: { color: `${color}33` },
        animationDuration: 800,
      },
    ],
  } as any;
}

const allSymbols = ['AAPL', 'META', 'GOOGL', 'TSLA', 'MSFT'];

export default function MarketsBoard() {
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [selected, setSelected] = React.useState<string>('AAPL');
  const [history, setHistory] = React.useState<HistoryPoint[]>([]);
  const [loadingHist, setLoadingHist] = React.useState<boolean>(true);
  const [range, setRange] = React.useState<'7d'|'1m'|'1y'>('1m');
  const [logos, setLogos] = React.useState<Record<string,string>>({});
  const [sparks, setSparks] = React.useState<Record<string,HistoryPoint[]>>({});
  const domainMap: Record<string,string> = { AAPL:'apple.com', META:'meta.com', GOOGL:'google.com', TSLA:'tesla.com', MSFT:'microsoft.com' };

  // load quotes periodically
  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const q = await getQuote(allSymbols);
      if (!active) return; setQuotes(q);
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  // load history for selected
  React.useEffect(() => {
    let active = true; setLoadingHist(true);
    const days = range==='7d'? 7 : range==='1m'? 30 : 365;
    getHistory(selected, days).then((h) => { if (!active) return; setHistory(h); setLoadingHist(false); });
    return () => { active = false; };
  }, [selected, range]);

  // load company logos
  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const map: Record<string,string> = {};
        for (const s of allSymbols) {
          try {
            const prof = await fetchJSON<any[]>(`${FMP_API}/profile/${s}?apikey=${FMP_KEY}`);
            const img = prof?.[0]?.image; if (img) map[s] = img;
          } catch {}
        }
        if (mounted) setLogos(map);
      } catch {}
    };
    run();
    return () => { mounted = false; };
  }, []);

  // load mini spark history for all symbols (30d)
  React.useEffect(() => {
    let ok = true;
    Promise.all(allSymbols.map((s)=> getHistory(s, 30).then((h)=> [s,h] as const))).then((pairs)=>{
      if (!ok) return; const m: Record<string,HistoryPoint[]> = {}; pairs.forEach(([s,h])=> m[s]=h); setSparks(m);
    });
    return ()=> { ok=false; };
  }, []);

  const selectedQuote = quotes.find((q) => q.symbol === selected);
  const pos = (selectedQuote?.change || 0) >= 0;

  return (
    <section className="space-y-4">
      {/* Top carousel-like row */}
      <div className="arch-card p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {quotes.map((q) => (
            <button key={q.symbol} onClick={() => setSelected(q.symbol)} className={`rounded-xl border p-3 text-left bg-white shadow-sm hover:shadow transition ${selected===q.symbol?'ring-2 ring-indigo-400':''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  {logos[q.symbol] ? (
                    <img src={logos[q.symbol]} alt="logo" className="w-5 h-5 rounded-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <img src={`https://logo.clearbit.com/${domainMap[q.symbol] || 'example.com'}`} alt="logo" className="w-5 h-5 rounded-full object-contain" referrerPolicy="no-referrer" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                  )}
                  {q.symbol}
                </div>
                <div className={`text-sm font-semibold ${q.change>=0?'text-emerald-600':'text-red-600'}`}>{q.price?.toLocaleString()}</div>
              </div>
              <div className={`text-xs ${q.change>=0?'text-emerald-600':'text-red-600'}`}>{q.change>=0?'+':''}{q.change?.toFixed(2)} ({q.changesPercentage?.toFixed(2)}%)</div>
              {/* mini sparkline */}
              <div className="mt-2 h-14">
                <AsyncECharts option={areaOption((sparks[q.symbol]||[]), '#8B5CF6')} style={{ height: '100%' }} opts={{ renderer:'svg' }} fallbackHeight={56} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Split: Left chart for selected, Right list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 arch-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold">{selected} — Live Chart</div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">{selectedQuote ? `${selectedQuote.price?.toLocaleString()} (${pos?'+':''}${selectedQuote.change?.toFixed(2)})` : ''}</div>
              <div className="border rounded-lg text-xs">
                {(['7d','1m','1y'] as const).map(r=> (
                  <button key={r} onClick={()=> setRange(r)} className={`px-2 py-1 rounded-lg ${range===r? 'bg-gray-900 text-white':'text-gray-700 hover:bg-gray-100'}`}>{r.toUpperCase()}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-72">
          {loadingHist ? <div className="p-4 text-sm text-gray-500">Loading…</div> : <AsyncECharts option={areaOption(history, '#3B82F6')} style={{ height: '100%' }} fallbackHeight={240} />}
          </div>
        </div>
        <div className="arch-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">My Stocks</div>
            <select className="border rounded px-2 py-1 text-xs">
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Daily</option>
            </select>
          </div>
          <ul className="divide-y">
            {quotes.map((q) => (
              <li key={q.symbol} className="py-2 flex items-center justify-between">
                <button className="text-left" onClick={() => setSelected(q.symbol)}>
                  <div className="font-medium">{q.symbol}</div>
                  <div className="text-xs text-gray-500">{Math.floor(Math.random()*100)+10} Shares</div>
                </button>
                <div className="text-right">
                  <div className="text-sm text-gray-800">{q.price?.toLocaleString()}</div>
                  <div className={`text-xs font-semibold ${q.change>=0?'text-emerald-600':'text-red-600'}`}>{q.changesPercentage>=0?'+':''}{q.changesPercentage?.toFixed(2)}%</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
