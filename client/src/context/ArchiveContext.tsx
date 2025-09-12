import React, { createContext, useContext, useMemo, useState } from 'react';

export type ModuleKey = 'SC' | 'PR' | 'MA' | 'QU';
export type FolderKey = string;

export type DocItem = {
  id: string;
  name: string;
  type: 'pdf'|'image'|'doc'|'xls'|'link';
  vendor?: string;
  date: string; // ISO
  size?: string;
  url?: string;
  tags?: string[];
  meta?: Record<string, any>;
};

export type Folder = {
  key: FolderKey;
  label: string;
  icon: string; // emoji for now
  items: DocItem[];
};

export type ArchiveModule = {
  key: ModuleKey;
  label: string;
  color: string; // css class suffix
  folders: Folder[];
};

export type ArchiveContextValue = {
  modules: ArchiveModule[];
  active: ModuleKey;
  setActive: (m: ModuleKey)=>void;
  currentFolder: Folder | null;
  openFolder: (key: FolderKey)=>void;
  closeFolder: () => void;
  query: string; setQuery: (q: string)=>void;
  filter: { type?: string; vendor?: string; from?: string|null; to?: string|null };
  setFilter: (p: Partial<ArchiveContextValue['filter']>)=>void;
  view: DocItem[]; // filtered items of current folder
  preview: DocItem | null; setPreview:(d:DocItem|null)=>void;
};

const ArchiveContext = createContext<ArchiveContextValue | null>(null);

function mockModules(): ArchiveModule[] {
  const mk = (key: ModuleKey, label: string, color: string, folders: Array<[string,string]>): ArchiveModule => ({
    key, label, color, folders: folders.map(([k,l],i)=> ({ key: `${key}-${k}`, label: l, icon: ['🗂','📄','📦','📝','📑','🏭','🧾','📦'][i%8], items: sampleItems(k) }))
  });
  return [
    mk('SC','Supply Chain','mod-sc', [['requests','Requests'],['rfqs','RFQs'],['orders','Orders'],['contracts','Contracts'],['invoices','Invoices'],['warehouse','Warehouse'],['movement','Movement'],['planning','Planning']]),
    mk('PR','Production','mod-pr', [['porders','Production Orders'],['boms','BOMs'],['preports','Production Reports'],['downtime','Downtime Logs'],['sched','Scheduling History']]),
    mk('MA','Maintenance','mod-ma', [['wo','Work Orders'],['pm','PM Schedules'],['break','Breakdowns'],['spare','Spare Parts History'],['cost','Cost Reports']]),
    mk('QU','Quality','mod-qu', [['insp','Inspection Reports'],['ncr','NCRs'],['audit','Audit Reports'],['certs','Certificates'],['complaints','Complaints']]),
  ];
}

function sampleItems(kind: string): DocItem[] {
  const today = new Date();
  const addDays = (n:number)=> new Date(Date.now()+n*86400000).toISOString().slice(0,10);
  return Array.from({length: 12}).map((_,i)=> ({
    id: `${kind}-${i+1}`,
    name: `${kind.toUpperCase()}-DOC-${1000+i}`,
    type: (['pdf','image','doc','xls','link'] as const)[i%5],
    vendor: ['Alpha','Beta','Gamma','Delta','Epsilon'][i%5],
    date: addDays(-i*3),
    size: `${Math.floor(Math.random()*900+100)} KB`,
    url: i%5===0? 'https://example.com/sample.pdf' : undefined,
    tags: i%2? ['2025','conf'] : ['2024'],
  }));
}

export const useArchive = () => {
  const ctx = useContext(ArchiveContext);
  if(!ctx) throw new Error('useArchive must be used within ArchiveProvider');
  return ctx;
};

export const ArchiveProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const initial = (()=> {
    try{ const s = localStorage.getItem('ncs_archive_modules'); if(s) return JSON.parse(s) as ArchiveModule[]; }catch{}
    return mockModules();
  })();
  const [modules, setModules] = useState<ArchiveModule[]>(initial);
  const [active, setActive] = useState<ModuleKey>('SC');
  // Start at modules view (no folder selected) so user picks a section
  const [folderKey, setFolderKey] = useState<FolderKey | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilterState] = useState<{ type?: string; vendor?: string; from?: string|null; to?: string|null }>({});
  const [preview, _setPreview] = useState<DocItem | null>(null);
  const setPreview = (d: DocItem | null) => {
    _setPreview(d);
    try {
      if (d) {
        const prev = JSON.parse(localStorage.getItem('ncs_archive_recentDocs') || '[]');
        const rec = { id: d.id, name: d.name, date: d.date, type: d.type };
        const next = [rec, ...prev.filter((x: any)=> x.id!==d.id)].slice(0,12);
        localStorage.setItem('ncs_archive_recentDocs', JSON.stringify(next));
      }
    } catch {}
  };

  const setFilter = (p: Partial<ArchiveContextValue['filter']>) => setFilterState((f)=> ({ ...f, ...p }));
  const current = useMemo(()=> modules.find(m=> m.key===active)!, [modules, active]);
  const currentFolder = useMemo(()=> current.folders.find(f=> f.key===folderKey) || null, [current, folderKey]);

  const view = useMemo(()=>{
    const items = currentFolder?.items || [];
    const q = query.trim();
    // try Fuse.js if available
    try {
      if (q.length > 1 && (window as any).Fuse) {
        const Fuse = (window as any).Fuse;
        const fuse = new Fuse(items, { keys: ['name','vendor','type','tags'], threshold: 0.35 });
        const res = fuse.search(q).map((r: any)=> r.item) as DocItem[];
        return res.filter((it)=> {
          const tok = !filter.type || it.type===filter.type;
          const vok = !filter.vendor || it.vendor===filter.vendor;
          const fok = !filter.from || it.date >= (filter.from as any);
          const tok2 = !filter.to || it.date <= (filter.to as any);
          return tok && vok && fok && tok2;
        });
      }
    } catch {}
    const ql = q.toLowerCase();
    return items.filter(it=> {
      const qok = !ql || [it.name,it.vendor,it.type].some(s=> String(s||'').toLowerCase().includes(ql));
      const tok = !filter.type || it.type===filter.type;
      const vok = !filter.vendor || it.vendor===filter.vendor;
      const fok = !filter.from || it.date >= filter.from!;
      const tok2 = !filter.to || it.date <= filter.to!;
      return qok && tok && vok && fok && tok2;
    });
  }, [currentFolder, query, filter]);

  const openFolder = (key: FolderKey) => {
    setFolderKey(key);
    try {
      const f = modules.flatMap(m=> m.folders).find(f=> f.key===key);
      if (f) {
        const prev = JSON.parse(localStorage.getItem('ncs_archive_recentFolders') || '[]');
        const rec = { key: f.key, label: f.label };
        const next = [rec, ...prev.filter((x: any)=> x.key!==f.key)].slice(0,8);
        localStorage.setItem('ncs_archive_recentFolders', JSON.stringify(next));
      }
    } catch {}
  };
  const closeFolder = () => setFolderKey(null);

  // --- Reorder helpers (DnD) ---
  function reorder<T>(arr: T[], from: number, to: number): T[] {
    const a = [...arr];
    const [x] = a.splice(from, 1);
    a.splice(to, 0, x);
    return a;
  }

  function reorderFolders(moduleKey: ModuleKey, fromIndex: number, toIndex: number) {
    setModules((mods) => mods.map((m) => (m.key === moduleKey ? { ...m, folders: reorder(m.folders, fromIndex, toIndex) } : m)));
  }

  function reorderItems(folderKey: FolderKey, idsInOrder: string[]) {
    setModules((mods) => mods.map((m) => ({
      ...m,
      folders: m.folders.map((f) => {
        if (f.key !== folderKey) return f;
        const map = new Map(f.items.map((it) => [it.id, it] as const));
        const next: DocItem[] = [];
        idsInOrder.forEach((id) => { const it = map.get(id); if (it) next.push(it); });
        // append the rest (not visible in filtered view)
        f.items.forEach((it) => { if (!idsInOrder.includes(it.id)) next.push(it); });
        return { ...f, items: next };
      }),
    })));
  }

  const value: ArchiveContextValue = {
    modules, active, setActive,
    currentFolder, openFolder, closeFolder,
    query, setQuery, filter, setFilter,
    view, preview, setPreview,
  };

  // Wire DnD reorder for folders via window event from VaultGrid
  React.useEffect(() => {
    const onRefolder = (e: any) => {
      const { moduleKey, activeId, overId } = e.detail || {};
      setModules((mods) => mods.map((m) => {
        if (m.key !== moduleKey) return m;
        const from = m.folders.findIndex((f) => f.key === activeId);
        const to = m.folders.findIndex((f) => f.key === overId);
        if (from < 0 || to < 0) return m;
        const nf = [...m.folders];
        const [x] = nf.splice(from, 1); nf.splice(to, 0, x);
        return { ...m, folders: nf };
      }));
    };
    const onReitems = (e: any) => {
      const { folderKey, activeId, overId, currentIds } = e.detail || {};
      setModules((mods) => mods.map((m) => ({
        ...m,
        folders: m.folders.map((f) => {
          if (f.key !== folderKey) return f;
          const ids = currentIds || f.items.map((it)=> it.id);
          const from = ids.indexOf(activeId);
          const to = ids.indexOf(overId);
          if (from < 0 || to < 0) return f;
          const order = [...ids];
          order.splice(to, 0, order.splice(from, 1)[0]);
          const map = new Map(f.items.map((it)=> [it.id, it] as const));
          const next = order.map((id:string)=> map.get(id)).filter(Boolean) as DocItem[];
          // append leftovers (filtered out items)
          f.items.forEach((it)=> { if(!order.includes(it.id)) next.push(it); });
          return { ...f, items: next };
        })
      })));
    };
    window.addEventListener('archive:reorder-folders', onRefolder as any);
    window.addEventListener('archive:reorder-items', onReitems as any);
    return () => {
      window.removeEventListener('archive:reorder-folders', onRefolder as any);
      window.removeEventListener('archive:reorder-items', onReitems as any);
    };
  }, []);

  // persist modules order locally
  React.useEffect(()=>{ try{ localStorage.setItem('ncs_archive_modules', JSON.stringify(modules)); }catch{} }, [modules]);

  React.useEffect(()=>{
    // lazy load Fuse when available
    import('fuse.js').then((m)=> { (window as any).Fuse = (m as any).default || (m as any); }).catch(()=>{});
  }, []);

  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>;
};

export default ArchiveContext;
