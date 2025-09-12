import React from 'react';
import '../../styles/archive.css';

const QuickJump: React.FC = () => {
  const [folders, setFolders] = React.useState<any[]>([]);
  const [docs, setDocs] = React.useState<any[]>([]);
  React.useEffect(()=>{
    try { setFolders(JSON.parse(localStorage.getItem('ncs_archive_recentFolders')||'[]')); } catch {}
    try { setDocs(JSON.parse(localStorage.getItem('ncs_archive_recentDocs')||'[]')); } catch {}
  }, []);
  if (!folders.length && !docs.length) return null;
  return (
    <section className="arch-card p-4 max-w-6xl mx-auto w-full">
      <div className="text-lg font-bold mb-2">Quick Jump</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-600 mb-1">Recent Folders</div>
          <div className="flex flex-wrap gap-2">
            {folders.map((f)=> <span key={f.key} className="u-neo px-2 py-1 text-xs">{f.label}</span>)}
            {!folders.length && <div className="text-xs text-gray-500">—</div>}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Recent Documents</div>
          <div className="flex flex-wrap gap-2">
            {docs.map((d)=> <span key={d.id} className="u-neo px-2 py-1 text-xs">{d.name}</span>)}
            {!docs.length && <div className="text-xs text-gray-500">—</div>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickJump;

