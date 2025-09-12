import React from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, AlarmClock, Bell, ListChecks, CheckCircle2 } from 'lucide-react';
import { listTasks, createTask, listRequests, updateTask, updateRequest, API_URL } from '../lib/api';
import type { Task } from '../types';

type ViewMode = 'month' | 'week' | 'day';
type CalEvent = { id: string; type: 'task'|'request'|'po'; title: string; startsAt: Date; raw: any };

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function sameDay(a?: Date, b?: Date) { if (!a || !b) return false; return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function toISODate(d: Date) { const k = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return k.toISOString().slice(0,10); }

export default function CalendarPage() {
  const today = React.useMemo(()=> new Date(), []);
  const [cursor, setCursor] = React.useState<Date>(new Date());
  const [view, setView] = React.useState<ViewMode>('month');
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [reqEvents, setReqEvents] = React.useState<CalEvent[]>([]);
  const [poEvents, setPoEvents] = React.useState<CalEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [showTasks, setShowTasks] = React.useState(true);
  const [showRequests, setShowRequests] = React.useState(true);
  const [showPOs, setShowPOs] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<'all'|'TODO'|'IN_PROGRESS'|'COMPLETED'>('all');
  const [q, setQ] = React.useState('');

  // Load tasks once
  React.useEffect(() => { (async()=>{
    try { setLoading(true); setError(null); const res = await listTasks({}); setTasks(res.data || []); } catch(e:any){ setError(e?.message || 'Failed to load'); } finally { setLoading(false); }
  })(); }, []);

  // Load requests for the visible month/week
  React.useEffect(() => { (async()=>{
    try {
      const rangeStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const rangeEnd = new Date(cursor.getFullYear(), cursor.getMonth()+1, 0);
      const dateFrom = toISODate(rangeStart);
      const dateTo = toISODate(rangeEnd);
      const res = await listRequests({ dateFrom, dateTo, page:1, pageSize: 500 });
      const mapped: CalEvent[] = (res.items||[]).filter(Boolean).map((r:any)=>{
        const iso = r.requiredDate || r.createdAt;
        const dt = iso ? new Date(iso) : new Date();
        const title = r.title || r.orderNo || 'Request';
        return { id: String(r.id || r.orderNo), type:'request', title: `REQ ${title}`, startsAt: dt, raw: r };
      });
      setReqEvents(mapped);
    } catch(e:any) {
      // non-fatal
      console.warn('calendar: listRequests failed', e);
    }
  })(); }, [cursor]);

  // Try to load POs if endpoint exists
  React.useEffect(() => { (async()=>{
    try {
      const rangeStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const rangeEnd = new Date(cursor.getFullYear(), cursor.getMonth()+1, 0);
      const res = await fetch(`${API_URL}/api/orders`).then(r=> r.ok ? r.json() : Promise.reject(new Error(String(r.status))));
      const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res?.data) ? res.data : (Array.isArray(res)? res : []));
      const mapped: CalEvent[] = items.map((o:any)=>{
        const iso = o.deliveryDate || o.date || o.createdAt;
        const dt = iso ? new Date(iso) : new Date();
        return { id: String(o.id || o.orderNo), type:'po', title: `PO ${o.orderNo || o.id}`, startsAt: dt, raw: o };
      }).filter((e:CalEvent)=> e.startsAt >= rangeStart && e.startsAt <= rangeEnd);
      setPoEvents(mapped);
    } catch(e) {
      setPoEvents([]); // ignore if not available
    }
  })(); }, [cursor]);

  const monthName = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const grid = React.useMemo(() => {
    const start = startOfMonth(cursor); const end = endOfMonth(cursor);
    const startOffset = (start.getDay() + 6) % 7; // Monday-first grid
    const first = addDays(start, -startOffset);
    return Array.from({length: 42}).map((_,i)=> addDays(first, i));
  }, [cursor]);

  const allEvents: CalEvent[] = React.useMemo(() => {
    const t = (tasks||[])
      .filter(it => statusFilter==='all' || (it.status as any)===statusFilter)
      .filter(it => !q || (it.title||'').toLowerCase().includes(q.toLowerCase()))
      .map((it:any)=> ({ id: String(it.id), type:'task' as const, title: it.title || 'Task', startsAt: it.dueDate ? new Date(it.dueDate) : new Date(), raw: it }));
    const r = (reqEvents||[]).filter(it => !q || it.title.toLowerCase().includes(q.toLowerCase()));
    const p = (poEvents||[]).filter(it => !q || it.title.toLowerCase().includes(q.toLowerCase()));
    return [ ...(showTasks? t: []), ...(showRequests? r: []), ...(showPOs? p: []) ];
  }, [tasks, reqEvents, poEvents, showTasks, showRequests, showPOs, statusFilter, q]);

  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of allEvents) {
      const k = toISODate(e.startsAt);
      map.set(k, [...(map.get(k)||[]), e]);
    }
    return map;
  }, [allEvents]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="text-xs text-gray-500">Plan requests, RFQs and approvals</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border rounded-xl p-1 shadow-sm">
            <label className="text-xs text-gray-600 inline-flex items-center gap-1 px-1">
              <input type="checkbox" checked={showTasks} onChange={e=> setShowTasks(e.target.checked)} /> Tasks
            </label>
            <span className="h-4 w-px bg-gray-200" />
            <label className="text-xs text-gray-600 inline-flex items-center gap-1 px-1">
              <input type="checkbox" checked={showRequests} onChange={e=> setShowRequests(e.target.checked)} /> Requests
            </label>
            <span className="h-4 w-px bg-gray-200" />
            <label className="text-xs text-gray-600 inline-flex items-center gap-1 px-1">
              <input type="checkbox" checked={showPOs} onChange={e=> setShowPOs(e.target.checked)} /> POs
            </label>
          </div>
          <div className="rounded-xl border p-0.5 bg-white shadow-sm">
            {(['month','week','day'] as ViewMode[]).map(v => (
              <button key={v} onClick={()=> setView(v)} className={`px-3 py-1.5 text-sm rounded-lg ${view===v? 'bg-gray-900 text-white':'text-gray-700 hover:bg-gray-50'}`}>{v[0].toUpperCase()+v.slice(1)}</button>
            ))}
          </div>
          <div className="rounded-xl border bg-white shadow-sm px-2 py-1">
            {(['all','TODO','IN_PROGRESS','COMPLETED'] as const).map(s => (
              <button key={s} onClick={()=> setStatusFilter(s)} className={`px-2 py-1 text-xs rounded-lg ${statusFilter===s? 'bg-indigo-50 text-indigo-700':'text-gray-600 hover:bg-gray-50'}`}>{s}</button>
            ))}
          </div>
          <input value={q} onChange={e=> setQ(e.target.value)} placeholder="Search…" className="px-3 py-2 text-sm rounded-xl border bg-white" />
          <button onClick={()=> setCursor(new Date())} className="px-3 py-2 text-sm rounded border bg-white">Today</button>
          <div className="inline-flex rounded-lg border bg-white shadow-sm overflow-hidden">
            <button className="px-2 py-2 hover:bg-gray-50" onClick={()=> setCursor(d=> new Date(d.getFullYear(), d.getMonth()-1, 1))}><ChevronLeft className="w-4 h-4"/></button>
            <div className="px-3 py-2 text-sm font-semibold min-w-[9rem] text-center">{monthName}</div>
            <button className="px-2 py-2 hover:bg-gray-50" onClick={()=> setCursor(d=> new Date(d.getFullYear(), d.getMonth()+1, 1))}><ChevronRight className="w-4 h-4"/></button>
          </div>
          <button onClick={()=> setNewOpen(true)} className="px-3 py-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-600 text-white inline-flex items-center gap-2 shadow"><Plus className="w-4 h-4"/> New</button>
        </div>
      </header>

      {/* Month grid */}
      {view==='month' && (
      <section className="bg-white rounded-xl border shadow-sm p-3">
        <div className="grid grid-cols-7 text-[11px] text-gray-500 px-1">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=> <div key={d} className="px-2 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d,i)=>{
            const inMonth = d.getMonth()===cursor.getMonth();
            const isToday = sameDay(d, new Date());
            const k = toISODate(d);
            const evts = eventsByDate.get(k) || [];
            const handleDrop: React.DragEventHandler<HTMLDivElement> = async (ev) => {
              ev.preventDefault();
              try {
                const json = ev.dataTransfer.getData('application/json');
                const data = JSON.parse(json) as { id: string; type: CalEvent['type'] };
                if (!data) return;
                const dateStr = toISODate(d);
                if (data.type === 'task') {
                  const found = tasks.find(t=> String(t.id)===data.id);
                  if (found) {
                    const time = found.dueDate ? new Date(found.dueDate) : new Date();
                    const newDt = new Date(dateStr + 'T' + time.toTimeString().slice(0,8));
                    await updateTask(found.id, { dueDate: newDt.toISOString() } as any);
                    setTasks(prev => prev.map(x => x.id===found.id ? ({...x, dueDate:newDt.toISOString()} as any) : x));
                  }
                } else if (data.type === 'request') {
                  const found = reqEvents.find(e=> e.id===data.id);
                  if (found) {
                    const r:any = found.raw;
                    await updateRequest(r.id || r.orderNo, { requiredDate: dateStr } as any);
                    setReqEvents(prev => prev.map(e=> e.id===data.id ? ({...e, startsAt: new Date(dateStr)}): e));
                  }
                } else if (data.type === 'po') {
                  // Optional: if API supports updating delivery, call it here
                  setPoEvents(prev => prev.map(e=> e.id===data.id ? ({...e, startsAt: new Date(dateStr)}): e));
                }
              } catch {}
            };
            return (
              <div
                key={i}
                className={`min-h-[92px] rounded-lg border p-1 ${inMonth? 'bg-white':'bg-gray-50'} ${isToday? 'border-indigo-400':'border-gray-200'}`}
                onDragOver={(e)=> e.preventDefault()}
                onDrop={handleDrop}
              >
                 <div className="flex items-center justify-between">
                   <div className={`text-xs font-medium ${inMonth? 'text-gray-800':'text-gray-400'}`}>{d.getDate()}</div>
                   {isToday && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">Today</span>}
                 </div>
                 <div className="mt-1 space-y-1">
                  {evts.slice(0,3).map((e,idx)=> (
                    <div
                      key={idx}
                      className={chipClass(e)}
                      draggable
                      onDragStart={(ev)=> ev.dataTransfer.setData('application/json', JSON.stringify({ id: e.id, type: e.type }))}
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  ))}
                  {evts.length>3 && <div className="text-[10px] text-indigo-600 px-1">+{evts.length-3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
        {loading && <div className="px-3 py-2 text-sm text-gray-500">Loading…</div>}
        {error && <div className="px-3 py-2 text-sm text-red-600">{error}</div>}
      </section>)}

      {/* Week view */}
      {view==='week' && (
        <WeekView cursor={cursor} events={allEvents} />
      )}

      {/* Day view */}
      {view==='day' && (
        <DayView date={cursor} events={allEvents} />
      )}

      {/* Reminders */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold inline-flex items-center gap-2"><AlarmClock className="w-4 h-4 text-indigo-600"/> Reminders</div>
            <button onClick={()=> setNewOpen(true)} className="px-2 py-1 text-xs rounded bg-gray-900 text-white">+ New</button>
          </div>
          <div className="space-y-2">
            {(tasks||[]).slice(0,8).map((t,i)=> (
              <div key={i} className="flex items-center justify-between rounded-lg border p-2 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white grid place-items-center"><Bell className="w-4 h-4"/></div>
                  <div>
                    <div className="text-sm font-medium">{(t as any).title || 'Untitled'}</div>
                    <div className="text-xs text-gray-500">Due {(t as any).dueDate ? new Date((t as any).dueDate).toLocaleString() : '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 text-xs rounded border">Open</button>
                  <button className="px-2 py-1 text-xs rounded bg-emerald-600 text-white inline-flex items-center gap-1" onClick={async()=>{ try { await updateTask((t as any).id, { status:'COMPLETED' as any }); setTasks(prev => prev.map(x => x.id===(t as any).id ? ({...x, status:'COMPLETED'} as any) : x)); } catch(e:any){ alert(e?.message||'Failed'); } }}><CheckCircle2 className="w-3.5 h-3.5"/> Done</button>
                </div>
              </div>
            ))}
            {(!tasks || tasks.length===0) && <div className="text-sm text-gray-500">No reminders yet.</div>}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><ListChecks className="w-4 h-4 text-indigo-600"/> Quick Lists</div>
          <div className="space-y-2 text-sm">
            {[{label:'Overdue',from:'#ef4444',to:'#f59e0b'},{label:'This Week',from:'#6366f1',to:'#22c55e'},{label:'Awaiting Quotes',from:'#3b82f6',to:'#a855f7'}].map((x,i)=> (
              <button key={i} className="w-full flex items-center justify-between rounded-lg border p-2 hover:bg-gray-50">
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{background:`linear-gradient(135deg, ${x.from}, ${x.to})`}}></span> {x.label}</span>
                <span className="text-xs text-gray-500">View</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {newOpen && <NewEventModal onClose={()=> setNewOpen(false)} onCreated={(t)=> { setTasks(prev=> [t as any, ...prev]); setNewOpen(false); }} />}
    </div>
  );
}

function hours() { return Array.from({length:24}).map((_,i)=> i); }

function WeekView({ cursor, events }: { cursor: Date; events: CalEvent[] }) {
  // Compute the Monday of the week containing cursor
  const d = new Date(cursor);
  const day = (d.getDay()+6)%7; // 0..6 Monday..Sunday
  const monday = new Date(d); monday.setDate(d.getDate()-day);
  const days = Array.from({length:7}).map((_,i)=> new Date(monday.getFullYear(), monday.getMonth(), monday.getDate()+i));
  const byDay = (dt: Date) => events.filter(e=> toISODate(e.startsAt)===toISODate(dt));
  return (
    <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="grid grid-cols-8 border-b bg-gray-50 text-xs">
        <div className="p-2" />
        {days.map((d,i)=> <div key={i} className="p-2 font-medium">{d.toLocaleDateString(undefined,{weekday:'short', day:'numeric'})}</div>)}
      </div>
      <div className="grid grid-cols-8">
        {/* Hours column */}
        <div className="border-r bg-white text-[11px] text-gray-500">
          {hours().map(h=> <div key={h} className="h-12 border-b px-1">{String(h).padStart(2,'0')}:00</div>)}
        </div>
        {/* Days columns */}
        {days.map((day,i)=> (
          <div key={i} className="relative border-r">
            {hours().map(h=> <div key={h} className="h-12 border-b" />)}
            {/* Events */}
            {byDay(day).map((e,idx)=>{
              const t = e.startsAt; const top = (t.getHours()+ t.getMinutes()/60) * 48; // 48px per hour
              return (
                <div key={idx} className={`absolute left-1 right-1 rounded px-2 py-1 text-[11px] shadow ${e.type==='task'?'bg-indigo-600 text-white':'bg-emerald-600 text-white'}`} style={{ top }}>
                  {e.title}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function DayView({ date, events }: { date: Date; events: CalEvent[] }) {
  const list = events.filter(e=> toISODate(e.startsAt)===toISODate(date));
  return (
    <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="px-3 py-2 border-b text-sm font-medium">{date.toLocaleDateString(undefined, { weekday:'long', month:'short', day:'numeric' })}</div>
      <div className="relative">
        {hours().map(h=> (
          <div key={h} className="h-12 border-b pl-12 relative">
            <div className="absolute left-0 top-0 w-12 text-[11px] text-gray-500 px-1">{String(h).padStart(2,'0')}:00</div>
          </div>
        ))}
        {list.map((e,idx)=>{
          const t = e.startsAt; const top = (t.getHours()+ t.getMinutes()/60) * 48;
          return (
            <div key={idx} className={`absolute left-14 right-2 rounded px-2 py-1 text-[11px] shadow ${e.type==='task'?'bg-indigo-600 text-white':'bg-emerald-600 text-white'}`} style={{ top }}>
              {e.title}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Visual helper for event chips with type/status colors
function chipClass(e: CalEvent) {
  if (e.type === 'task') {
    const status = (e.raw?.status || '').toString().toUpperCase();
    if (status === 'COMPLETED') return 'text-[11px] truncate px-1.5 py-0.5 rounded border bg-emerald-600 text-white';
    if (status === 'IN_PROGRESS') return 'text-[11px] truncate px-1.5 py-0.5 rounded border bg-sky-600 text-white';
    return 'text-[11px] truncate px-1.5 py-0.5 rounded border bg-indigo-600 text-white';
  }
  if (e.type === 'request') {
    const st = (e.raw?.status || '').toString().toUpperCase();
    if (st.includes('RFQ')) return 'text-[11px] truncate px-1.5 py-0.5 rounded border bg-amber-500 text-white';
    if (st.includes('APPROVED')) return 'text-[11px] truncate px-1.5 py-0.5 rounded border bg-emerald-500 text-white';
    return 'text-[11px] truncate px-1.5 py-0.5 rounded border bg-blue-600 text-white';
  }
  if (e.type === 'po') {
    return 'text-[11px] truncate px-1.5 py-0.5 rounded border bg-purple-600 text-white';
  }
  return 'text-[11px] truncate px-1.5 py-0.5 rounded border bg-gray-600 text-white';
}

function NewEventModal({ onClose, onCreated }: { onClose: ()=>void; onCreated: (t: Task)=>void }) {
  const [title, setTitle] = React.useState('');
  const [due, setDue] = React.useState<string>('');
  const [saving, setSaving] = React.useState(false);
  const can = title.trim().length>0 && due.trim().length>0;
  async function save(){
    if(!can) return; setSaving(true);
    try { const res = await createTask({ title, dueDate: new Date(due).toISOString(), status:'TODO' as any }); onCreated((res as any).data || (res as any)); }
    catch(e){ alert((e as any)?.message || 'Failed'); }
    finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-[520px] max-w-[95vw] rounded-xl border shadow-lg">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="text-lg font-semibold inline-flex items-center gap-2"><CalendarDays className="w-4 h-4"/> New Event</div>
          <button onClick={onClose} className="px-2 py-1 text-sm rounded border">Close</button>
        </div>
        <div className="p-4 space-y-3">
          <label className="text-sm block">
            <div className="text-gray-600 mb-1">Title</div>
            <input value={title} onChange={e=> setTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Event title" />
          </label>
          <label className="text-sm block">
            <div className="text-gray-600 mb-1">Due date and time</div>
            <input type="datetime-local" value={due} onChange={e=> setDue(e.target.value)} className="w-full border rounded px-3 py-2" />
          </label>
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
          <button onClick={save} disabled={!can || saving} className="px-3 py-2 text-sm rounded bg-gray-900 text-white disabled:opacity-50">{saving? 'Saving…':'Create'}</button>
        </div>
      </div>
    </div>
  );
}
