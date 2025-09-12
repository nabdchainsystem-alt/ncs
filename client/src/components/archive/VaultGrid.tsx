import React from 'react';
import { motion } from 'framer-motion';
import { useArchive } from '../../context/ArchiveContext';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import '../../styles/archive.css';

const VaultGrid: React.FC<{ moduleKey?: any }> = ({ moduleKey }) => {
  const { modules, active, openFolder } = useArchive();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const useKey = moduleKey ?? active;
  const mod = modules.find(m=> m.key===useKey)!;
  return (
    <DndContext sensors={sensors} onDragEnd={(e)=> onDragEnd(e, mod.key)}>
      <SortableContext items={mod.folders.map(f=> f.key)} strategy={rectSortingStrategy}>
        <div className="arch-grid">
          {mod.folders.map((f,i)=> (
            <SortableFolder key={f.key} id={f.key} onOpen={()=> { openFolder(f.key); }} label={f.label} icon={f.icon} index={i} />
          ))}
      </div>
    </SortableContext>
  </DndContext>
  );
};

export default VaultGrid;

// ---- Sortable Folder Card ----
function SortableFolder({ id, onOpen, label, icon, index }: { id: string; onOpen: ()=>void; label: string; icon: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition } as any;
  return (
    <motion.button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * .04 }}
      className="arch-card p-3 text-left"
      onMouseMove={(e)=> tilt(e)} onMouseLeave={(e)=> resetTilt(e)}
    >
      <div className="folder-3d">
        <div className="tab" />
        <div className="body" />
        <div className="glow" />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-[11px] text-gray-500">Drag to reorder</div>
        </div>
        <div className="text-xl">{icon}</div>
      </div>
    </motion.button>
  );
}

function tilt(e: React.MouseEvent) {
  const el = e.currentTarget as HTMLElement;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width; // 0..1
  const y = (e.clientY - r.top) / r.height; // 0..1
  const rx = (y - 0.5) * -6; // tilt up/down
  const ry = (x - 0.5) * 6;  // tilt left/right
  el.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`;
}
function resetTilt(e: React.MouseEvent) {
  const el = e.currentTarget as HTMLElement;
  el.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg)';
}

// DnD handler gets injected via closure from parent
function onDragEnd(e: DragEndEvent, moduleKey: any) {
  const { active, over } = e; if (!over || active.id === over.id) return;
  try {
    const evt = new CustomEvent('archive:reorder-folders', { detail: { moduleKey, activeId: active.id, overId: over.id } });
    window.dispatchEvent(evt);
  } catch {}
}
