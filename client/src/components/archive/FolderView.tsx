import React from 'react';
import { useArchive } from '../../context/ArchiveContext';
import '../../styles/archive.css';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

const FolderView: React.FC = () => {
  const { currentFolder, view, setPreview } = useArchive();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  if (!currentFolder) return null;
  return (
    <div className="arch-card p-0">
      <div className="px-4 pt-4 pb-2 font-semibold flex items-center justify-between">
        <div>{currentFolder.label}</div>
        <UploadBar folderKey={currentFolder.key} />
      </div>
      <MiniKPIs items={view} />
      <div className="overflow-auto">
        <DndContext sensors={sensors} onDragEnd={(e)=> onDragEnd(e, currentFolder.key, view.map(x=> x.id))}>
          <SortableContext items={view.map(x=> x.id)} strategy={rectSortingStrategy}>
            <table className="arch-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Size</th>
                  <th>Tags</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {view.map((d)=> (
                  <Row key={d.id} id={d.id} d={d} onPreview={()=> setPreview(d)} />
                ))}
                {view.length===0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">No results</td></tr>
                )}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

function Row({ id, d, onPreview }: { id: string; d: any; onPreview: ()=>void }){
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition } as any;
  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <td>{d.name}</td>
      <td>{d.type}</td>
      <td>{d.vendor||'—'}</td>
      <td>{d.date}</td>
      <td>{d.size||'—'}</td>
      <td>{(d.tags||[]).join(', ')}</td>
      <td><button className="text-blue-600 text-xs" onClick={onPreview}>Preview</button></td>
    </tr>
  );
}

// ---- Mini KPIs (charts) ----
function MiniKPIs({ items }: { items: any[] }) {
  const byType: Record<string, number> = {};
  const byVendor: Record<string, number> = {};
  const byDate: Record<string, number> = {};
  items.forEach((d) => {
    byType[d.type] = (byType[d.type] || 0) + 1;
    if (d.vendor) byVendor[d.vendor] = (byVendor[d.vendor] || 0) + 1;
    byDate[d.date] = (byDate[d.date] || 0) + 1;
  });
  const vendors = Object.entries(byVendor).sort((a,b)=> b[1]-a[1]).slice(0,6);
  const dates = Object.keys(byDate).sort();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 pb-3">
      <div className="p-3">
        <div className="text-xs text-gray-600 mb-1">By Type</div>
        <Doughnut data={{ labels:Object.keys(byType), datasets:[{ data:Object.values(byType), backgroundColor:['#111827','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6'] }] }} options={{ plugins:{ legend:{ position:'bottom' } }, cutout:'65%' }} />
      </div>
      <div className="p-3">
        <div className="text-xs text-gray-600 mb-1">Top Vendors</div>
        <Bar data={{ labels:vendors.map(v=>v[0]), datasets:[{ data:vendors.map(v=>v[1]), backgroundColor:'#3B82F6', label:'Files' }] }} options={{ indexAxis:'y' as const, plugins:{ legend:{ display:false } } }} />
      </div>
      <div className="p-3">
        <div className="text-xs text-gray-600 mb-1">Files over Time</div>
        <Line data={{ labels:dates, datasets:[{ data:dates.map(d=> byDate[d]), label:'Count', borderColor:'#10B981', backgroundColor:'rgba(16,185,129,.2)', tension:.35, fill:true }] }} options={{ plugins:{ legend:{ position:'bottom' } } }} />
      </div>
    </div>
  );
}

// ---- Upload bar (Presigned URL) ----
function UploadBar({ folderKey }: { folderKey: string }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [url, setUrl] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const putFile = async () => {
    if (!file || !url) { setMsg('Pick a file and paste presigned URL'); return; }
    setBusy(true); setMsg('Uploading…');
    try {
      const res = await fetch(url, { method:'PUT', body:file, headers:{ 'Content-Type': file.type || 'application/octet-stream' } });
      if (!res.ok) throw new Error('upload_failed');
      setMsg('Uploaded ✓');
    } catch (e:any) { setMsg('Upload failed'); }
    setBusy(false);
  };
  return (
    <div className="flex items-center gap-2 text-xs">
      <input type="file" onChange={(e)=> setFile(e.target.files?.[0]||null)} className="text-xs" />
      <input value={url} onChange={(e)=> setUrl(e.target.value)} placeholder="Presigned URL" className="border rounded px-2 py-1 w-64" />
      <button className="px-2 py-1 border rounded" onClick={putFile} disabled={busy}>Upload</button>
      {msg && <span className="text-gray-500">{msg}</span>}
    </div>
  );
}

function onDragEnd(e: DragEndEvent, folderKey: string, currentIds: string[]) {
  const { active, over } = e; if(!over || active.id===over.id) return;
  try {
    const evt = new CustomEvent('archive:reorder-items', { detail: { folderKey, activeId: active.id, overId: over.id, currentIds } });
    window.dispatchEvent(evt);
  } catch {}
}

export default FolderView;
