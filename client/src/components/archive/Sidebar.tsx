import React from 'react';
import { useArchive } from '../../context/ArchiveContext';
import '../../styles/archive.css';

const Sidebar: React.FC = () => {
  const { modules, active, setActive } = useArchive();
  return (
    <aside className="arch-sidebar space-y-2">
      {modules.map(m => (
        <button key={m.key} onClick={()=> setActive(m.key)} className={`vault-btn ${m.color}`}>
          <span className="text-xl">{iconFor(m.key)}</span>
          <div className="text-left">
            <div className="text-sm font-semibold">{m.label}</div>
            <div className="text-[11px] text-gray-500">{m.folders.length} sections</div>
          </div>
          <div className="ml-auto text-[11px] text-gray-500">{active===m.key? 'Active' : ''}</div>
        </button>
      ))}
    </aside>
  );
};

function iconFor(k: string) {
  switch(k){
    case 'SC': return '📦';
    case 'PR': return '🏭';
    case 'MA': return '⚙️';
    case 'QU': return '✅';
    default: return '🗂';
  }
}

export default Sidebar;

