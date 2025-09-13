import React, { useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { useReports } from '../../context/ReportsContext';
import '../../styles/reports.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

function Card({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition } as any;
  return (
    <div ref={setNodeRef} style={style} className={`rep-widget ${isDragging?'dragging':''} rep-card p-4`}
      data-id={id}
    >
      <div className="font-semibold mb-2 pr-8">{title}</div>
      <div className="drag-handle" {...attributes} {...listeners} title="Drag">⠿</div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { type, widgets, setWidgets, openDetails } = useReports();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e; if (!over || active.id===over.id) return;
    const oldIndex = widgets.findIndex((w)=> w===active.id);
    const newIndex = widgets.findIndex((w)=> w===over.id);
    setWidgets(arrayMove(widgets, oldIndex, newIndex));
  };

  // demo datasets by type
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const seriesA = months.map((_,i)=> 20 + (i*7%60));
  const seriesB = months.map((_,i)=> 12 + (i*9%55));
  const vendors = ['Alpha','Beta','Gamma','Delta','Epsilon'];

  const content = (id: string) => {
    if (type==='Requests') {
      if (id==='chartA') return <Bar data={{ labels: ['New','Review','RFQ','Approved','Completed'], datasets:[{ label:'Count', data:[34,18,25,20,44], backgroundColor:'#3B82F6' }] }} options={{ plugins:{ legend:{ display:false } } }} />;
      if (id==='chartB') return <Line data={{ labels: months, datasets:[{ label:'Approval Time (h)', data: seriesB, borderColor:'#10B981', backgroundColor:'rgba(16,185,129,.2)', tension:.35, fill:true }] }} options={{ plugins:{ legend:{ position:'bottom' } } }} />;
      if (id==='table') return <Table title="Top Requesters" rows={vendors.map((v,i)=>({ name:v, count: 10+i*3 }))} onOpen={openDetails} />;
    }
    if (type==='Orders') {
      if (id==='chartA') return <Doughnut data={{ labels: vendors, datasets:[{ data:[32,28,21,18,15], backgroundColor:['#111827','#10B981','#3B82F6','#F59E0B','#EF4444'] }] }} options={{ cutout:'65%', plugins:{ legend:{ position:'bottom' } } }} />;
      if (id==='chartB') return <Line data={{ labels: months, datasets:[{ label:'Monthly Orders', data: seriesA, borderColor:'#3B82F6', backgroundColor:'rgba(59,130,246,.2)', tension:.35, fill:true }] }} options={{ plugins:{ legend:{ position:'bottom' } } }} />;
      if (id==='table') return <Table title="High Value Orders" rows={Array.from({length:6}).map((_,i)=>({ order:`PO-${2000+i}`, vendor: vendors[i%vendors.length], value: 1_000_000 + i*120_000 }))} onOpen={openDetails} />;
    }
    if (type==='Vendors') {
      if (id==='chartA') return <Bar data={{ labels: vendors, datasets:[{ label:'Trust', data:[82,58,74,91,66], backgroundColor:'#10B981' }] }} options={{ plugins:{ legend:{ display:false } } }} />;
      if (id==='chartB') return <Line data={{ labels: months, datasets:[{ label:'On-Time %', data: months.map((_,i)=> 70 + (i*3%30)), borderColor:'#10B981' }] }} />;
      if (id==='table') return <Table title="Complaints (30d)" rows={vendors.map((v,i)=>({ vendor:v, ncr: i%2?0: (i+1) }))} onOpen={openDetails} />;
    }
    if (type==='Inventory') {
      if (id==='chartA') return <Doughnut data={{ labels:['Spare','Safety','Cons.','Equip.','Chem.'], datasets:[{ data:[38,22,18,12,10], backgroundColor:['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6'] }] }} options={{ cutout:'65%', plugins:{ legend:{ position:'bottom' } } }} />;
      if (id==='chartB') return <Bar data={{ labels: months, datasets:[{ label:'Predicted Stockouts', data: months.map((_,i)=> (i*5)%20), backgroundColor:'#EF4444' }] }} options={{ plugins:{ legend:{ position:'bottom' } } }} />;
      if (id==='table') return <Table title="Dead Stock" rows={Array.from({length:6}).map((_,i)=>({ item:`Item ${i+1}`, value: 100_000 + i*25_000 }))} onOpen={openDetails} />;
    }
    if (type==='ESG') {
      if (id==='chartA') return <Doughnut data={{ labels:['Sea','Air','Ground','Local'], datasets:[{ data:[55,12,22,11], backgroundColor:['#3B82F6','#EF4444','#0EA5E9','#10B981'] }] }} options={{ cutout:'60%', plugins:{ legend:{ position:'bottom' } } }} />;
      if (id==='chartB') return <Line data={{ labels: months, datasets:[{ label:'Sustainability Score', data: months.map((_,i)=> 60 + (i*4%35)), borderColor:'#8B5CF6', backgroundColor:'rgba(139,92,246,.2)', tension:.35, fill:true }] }} options={{ plugins:{ legend:{ position:'bottom' } } }} />;
      if (id==='table') return <Table title="Local vs Import (%)" rows={[{ local:45, import:55 }]} onOpen={openDetails} />;
    }
    return <div className="text-gray-400">(No content)</div>;
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <SortableContext items={widgets} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-12 gap-3">
          {widgets.map((w)=> (
            <div key={w} className={w==='kpis' ? 'col-span-12' : 'col-span-12 lg:col-span-6'}>
              {w==='kpis' ? (
                <Card id="kpis" title="KPIs">
                  {/* Empty shell — KPIs rendered above; keep slot for DnD layout */}
                  <div className="text-gray-400 text-sm">Drag widgets to rearrange layout</div>
                </Card>
              ) : (
                <Card id={w} title={w==='chartA'?'Primary Chart': w==='chartB'?'Secondary Chart':'Details Table'}>
                  {content(w)}
                </Card>
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function Table({ title, rows, onOpen }: { title: string; rows: any[]; onOpen: (title:string, rows:any[])=>void }) {
  return (
    <div>
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      <div className="table-wrap overflow-auto">
        <table className="min-w-full text-xs">
          <thead className="text-gray-500 bg-gray-50">
            <tr>{Object.keys(rows[0]||{col:'value'}).map(k=> <th key={k} className="px-2 py-1 text-left">{k}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r,i)=> (
              <tr key={i} className="border-t">
                {Object.values(r).map((v,j)=> <td key={j} className="px-2 py-1">{String(v)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-right">
        <button className="px-3 py-2 border rounded" onClick={()=> onOpen(title, rows)}>Open Details</button>
      </div>
    </div>
  );
}
