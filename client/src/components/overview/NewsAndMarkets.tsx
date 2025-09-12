import React from 'react';

type NewsItem = { title: string; link: string; pubDate?: string; source?: string };
type Stock = { symbol: string; price: number; change?: number; changesPercentage?: number };

async function fetchText(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    return await res.text();
  } catch {
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const r = await fetch(proxy);
    const j = await r.json();
    return j?.contents || '';
  }
}

async function loadRSSFeeds(feeds: string[]): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  for (const f of feeds) {
    try {
      const xml = await fetchText(f);
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const src = (doc.querySelector('channel>title')?.textContent || '').trim();
      Array.from(doc.querySelectorAll('item')).slice(0, 6).forEach((it) => {
        const title = (it.querySelector('title')?.textContent || '').trim();
        const link = (it.querySelector('link')?.textContent || '').trim();
        const pubDate = (it.querySelector('pubDate')?.textContent || '').trim();
        if (title && link) items.push({ title, link, pubDate, source: src });
      });
    } catch {}
  }
  // sort by recent if dates available
  items.sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime());
  return items.slice(0, 12);
}

async function loadStocks(symbols: string[]): Promise<Stock[]> {
  // Financial Modeling Prep demo key (free): for demo/visual only
  const url = `https://financialmodelingprep.com/api/v3/quote/${symbols.join(',')}?apikey=demo`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((d: any) => ({
      symbol: d.symbol,
      price: Number(d.price || d.previousClose || 0),
      change: Number(d.change || 0),
      changesPercentage: Number((d.changesPercentage || '').toString().replace(/[()%]/g, '')),
    }));
  } catch {
    // fallback to static demo if API blocked
    return symbols.map((s, i) => ({ symbol: s, price: 100 + i * 12, change: (i % 2 ? -1 : 1) * (5 + i), changesPercentage: (i % 2 ? -1 : 1) * (1.2 + i / 10) }));
  }
}

export default function NewsAndMarkets() {
  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [stocks, setStocks] = React.useState<Stock[]>([]);
  const [loadingNews, setLoadingNews] = React.useState(true);
  const [loadingStocks, setLoadingStocks] = React.useState(true);

  React.useEffect(() => {
    const feeds = [
      'https://news.google.com/rss/search?q=supply%20chain&hl=en-US&gl=US&ceid=US:en',
      'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    ];
    loadRSSFeeds(feeds).then((items) => { setNews(items); setLoadingNews(false); }).catch(()=> setLoadingNews(false));
    loadStocks(['AAPL','MSFT','AMZN','TSLA','NVDA']).then((s)=> { setStocks(s); setLoadingStocks(false); }).catch(()=> setLoadingStocks(false));
    const id = setInterval(() => { loadRSSFeeds(feeds).then(setNews); loadStocks(['AAPL','MSFT','AMZN','TSLA','NVDA']).then(setStocks); }, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="arch-card p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Stocks */}
        <div>
          <div className="text-sm font-semibold mb-2">Live Stocks</div>
          <div className="rounded-xl border p-2 bg-white shadow-sm">
            {loadingStocks ? (
              <div className="p-4 text-sm text-gray-500">Loading stocks…</div>
            ) : (
              <ul className="divide-y">
                {stocks.map((s)=> {
                  const pos = (s.change || s.changesPercentage || 0) >= 0;
                  return (
                    <li key={s.symbol} className="flex items-center justify-between py-2">
                      <div className="font-semibold">{s.symbol}</div>
                      <div className="text-sm text-gray-700">{s.price?.toLocaleString()}</div>
                      <div className={`text-sm font-semibold ${pos? 'text-emerald-600':'text-red-600'}`}>
                        {pos? '+':''}{(s.change ?? 0).toFixed(2)} ({pos? '+':''}{(s.changesPercentage ?? 0).toFixed(2)}%)
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right: News */}
        <div>
          <div className="text-sm font-semibold mb-2">Latest News</div>
          <div className="rounded-xl border p-2 bg-white shadow-sm">
            {loadingNews ? (
              <div className="p-4 text-sm text-gray-500">Loading news…</div>
            ) : news.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No news found right now.</div>
            ) : (
              <ul className="space-y-2">
                {news.map((n, i) => (
                  <li key={i} className="group transition">
                    <a href={n.link} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">
                      {n.title}
                    </a>
                    <div className="text-[11px] text-gray-500">
                      {(n.source || '').replace(/\s+RSS.*/,'')} {n.pubDate ? `• ${new Date(n.pubDate).toLocaleString()}` : ''}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

