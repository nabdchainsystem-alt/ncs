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

const loadStoredModules = (): ArchiveModule[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem('ncs_archive_modules');
    if (stored) {
      const parsed = JSON.parse(stored) as ArchiveModule[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return [];
};

export const useArchive = () => {
  const ctx = useContext(ArchiveContext);
  if(!ctx) throw new Error('useArchive must be used within ArchiveProvider');
  return ctx;
};

export const ArchiveProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [modules, setModules] = useState<ArchiveModule[]>(() => loadStoredModules());
  const [active, setActive] = useState<ModuleKey>('SC');
  const [folderKey, setFolderKey] = useState<FolderKey | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilterState] = useState<{ type?: string; vendor?: string; from?: string|null; to?: string|null }>({});
  const [preview, _setPreview] = useState<DocItem | null>(null);

  React.useEffect(() => {
    if (modules.length === 0) return;
    try {
      window.localStorage.setItem('ncs_archive_modules', JSON.stringify(modules));
    } catch {
      // ignore persistence issues
    }
  }, [modules]);

  React.useEffect(() => {
    if (modules.length === 0) {
      setActive('SC');
      setFolderKey(null);
      return;
    }
    if (!modules.some((module) => module.key === active)) {
      setActive(modules[0].key);
    }
  }, [modules, active]);

  const setPreview = (d: DocItem | null) => {
    _setPreview(d);
    if (typeof window === 'undefined') return;
    try {
      if (d) {
        const prev = JSON.parse(window.localStorage.getItem('ncs_archive_recentDocs') || '[]');
        const rec = { id: d.id, name: d.name, date: d.date, type: d.type };
        const next = [rec, ...prev.filter((x: any)=> x.id!==d.id)].slice(0,12);
        window.localStorage.setItem('ncs_archive_recentDocs', JSON.stringify(next));
      }
    } catch {
      // ignore persistence issues
    }
  };

  const setFilter = (p: Partial<ArchiveContextValue['filter']>) => setFilterState((f)=> ({ ...f, ...p }));
  const currentModule = useMemo(()=> modules.find((m)=> m.key===active) ?? null, [modules, active]);
  const currentFolder = useMemo(()=> currentModule?.folders.find((f)=> f.key===folderKey) ?? null, [currentModule, folderKey]);

  const view = useMemo(()=>{
    const items = currentFolder?.items || [];
    const q = query.trim();
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
    if (typeof window === 'undefined') return;
    try {
      const f = modules.flatMap(m=> m.folders).find(f=> f.key===key);
      if (f) {
        const prev = JSON.parse(window.localStorage.getItem('ncs_archive_recentFolders') || '[]');
        const rec = { key: f.key, label: f.label };
        const next = [rec, ...prev.filter((x: any)=> x.key!==f.key)].slice(0,8);
        window.localStorage.setItem('ncs_archive_recentFolders', JSON.stringify(next));
      }
    } catch {
      // ignore persistence issues
    }
  };
  const closeFolder = () => setFolderKey(null);

  function reorder<T>(arr: T[], from: number, to: number): T[] {
    const a = [...arr];
    const [x] = a.splice(from, 1);
    a.splice(to, 0, x);
    return a;
  }

  function reorderFolders(moduleKey: ModuleKey, fromIndex: number, toIndex: number) {
    setModules((mods) => mods.map((m) => (m.key === moduleKey ? { ...m, folders: reorder(m.folders, fromIndex, toIndex) } : m)));
  }

  function reorderItems(folderKeyValue: FolderKey, idsInOrder: string[]) {
    setModules((mods) => mods.map((m) => ({
      ...m,
      folders: m.folders.map((f) => {
        if (f.key !== folderKeyValue) return f;
        const map = new Map(f.items.map((it) => [it.id, it] as const));
        const next: DocItem[] = [];
        idsInOrder.forEach((id) => { const it = map.get(id); if (it) next.push(it); });
        f.items.forEach((it) => { if (!idsInOrder.includes(it.id)) next.push(it); });
        return { ...f, items: next };
      }),
    })));
  }

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
      const { folderKey: fk, ids } = e.detail || {};
      if (!fk || !Array.isArray(ids)) return;
      reorderItems(fk, ids);
    };
    window.addEventListener('ncs:archive:reorder-folders', onRefolder);
    window.addEventListener('ncs:archive:reorder-items', onReitems);
    return () => {
      window.removeEventListener('ncs:archive:reorder-folders', onRefolder);
      window.removeEventListener('ncs:archive:reorder-items', onReitems);
    };
  }, []);

  const value: ArchiveContextValue = {
    modules, active, setActive,
    currentFolder, openFolder, closeFolder,
    query, setQuery, filter, setFilter,
    view, preview, setPreview,
  };

  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>;
};

export default ArchiveContext;
