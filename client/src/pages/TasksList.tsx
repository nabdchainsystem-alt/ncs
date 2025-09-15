import React from 'react';
import HeaderBar from '../components/ui/HeaderBar';
import { TasksProvider, useTasks } from '../context/TasksContext';
import type { Task, TaskStatus } from '../types';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, useDroppable, closestCorners } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Search, MoreHorizontal, PackagePlus, Upload, Boxes, Users, Wallet } from 'lucide-react';
import AddTaskModal from '../components/discussion/modals/AddTaskModal';

function TaskToolbar({ onOpenAdd = () => {} }: { onOpenAdd?: ()=>void }) {
  const { filter, setFilter, createTask, refresh } = useTasks();
  const [title, setTitle] = React.useState('');
  return (
    <div className="rounded-2xl border bg-white shadow-card px-4 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              className="h-10 w-full rounded-2xl border pl-9 pr-3 text-sm input-focus"
              placeholder="Search tasks…"
              value={filter.search || ''}
              onChange={(e)=> setFilter({ search: e.currentTarget.value })}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700"
            onClick={onOpenAdd}
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

function RowActions({ task }: { task: Task }) {
  const { updateTask } = useTasks();
  return (
    <div className="inline-flex items-center gap-1">
      <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=> updateTask(task.id, { status: 'COMPLETED' })}>Complete</button>
      <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=> alert('More actions…')}><MoreHorizontal className="w-4 h-4" /></button>
    </div>
  );
}

function StatusPill({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, string> = {
    TODO: 'bg-gray-100 text-gray-700 border-gray-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const label = status === 'TODO' ? 'To do' : status === 'IN_PROGRESS' ? 'In Progress' : 'Completed';
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${map[status]}`}>{label}</span>;
}

function AssigneeChip({ name }: { name?: string | null }) {
  if (!name) return <span className="text-xs text-gray-400">—</span>;
  const initials = name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
  return (
    <div className="inline-flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-gray-200 grid place-items-center text-[10px] font-semibold text-gray-700">{initials}</div>
      <span className="text-xs text-gray-700">{name}</span>
    </div>
  );
}

const SortableRow: React.FC<{ task: Task; index: number }> = ({ task }) => {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({ id: task.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition } as any;
  const { updateTask } = useTasks();
  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50">
      <td className="px-2 py-3 w-8">
        <button className="cursor-grab text-gray-400 hover:text-gray-600" {...attributes} {...listeners} aria-label="Drag">
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <td className="px-2 py-3 w-8"><input type="checkbox" className="h-4 w-4 rounded border-gray-300" /></td>
      <td className="px-2 py-3">
        <div className="text-sm font-medium text-gray-900">{task.title}</div>
        {task.label && <div className="text-[11px] text-gray-500 mt-0.5">{task.label}</div>}
      </td>
      <td className="px-2 py-3"><AssigneeChip name={task.assignee} /></td>
      <td className="px-2 py-3"><StatusPill status={task.status} /></td>
      <td className="px-2 py-3 text-xs text-gray-700">{task.priority || '—'}</td>
      <td className="px-2 py-3 text-xs text-gray-700">{task.dueDate || '—'}</td>
      <td className="px-2 py-3 text-right"><RowActions task={task} /></td>
    </tr>
  );
};

function TasksTable() {
  const { tasks, moveTask } = useTasks();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Sort by status then order to keep sections visually grouped but a single full-width list
  const ordered = React.useMemo(() => {
    const orderMap: Record<TaskStatus, number> = { TODO: 0, IN_PROGRESS: 1, COMPLETED: 2 };
    return [...tasks].sort((a, b) => (orderMap[a.status]-orderMap[b.status]) || (a.order - b.order) || (a.id - b.id));
  }, [tasks]);

  const ids = ordered.map((t)=> t.id);

  function toIndexWithinStatus(list: Task[], status: TaskStatus, taskId: number, overId: number) {
    const same = list.filter(t=> t.status===status).map(t=> t.id);
    const idx = same.indexOf(overId);
    return Math.max(0, idx);
  }

  return (
    <div className="rounded-2xl border bg-white shadow-card">
      <div className="px-4 py-3 border-b text-sm font-semibold">Tasks</div>
      <div className="overflow-auto">
        <DndContext sensors={sensors} onDragEnd={(e: DragEndEvent) => {
          const { active, over } = e; if (!over) return;
          const aTask = ordered.find(t=> t.id===Number(active.id)) as Task | undefined; if (!aTask) return;
          const overId = Number(over.id);
          const toIndex = toIndexWithinStatus(ordered, aTask.status, Number(active.id), overId);
          moveTask(Number(active.id), { toStatus: aTask.status, toIndex });
        }}>
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <table className="u-table text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600">
                <tr>
                  <th className="px-2 py-2 w-8"></th>
                  <th className="px-2 py-2 w-8"><input type="checkbox" className="h-4 w-4 rounded border-gray-300" /></th>
                  <th className="px-2 py-2 text-left">Task</th>
                  <th className="px-2 py-2 text-left">Assignee</th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-left">Priority</th>
                  <th className="px-2 py-2 text-left">Due Date</th>
                  <th className="px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((t, i) => (
                  <SortableRow key={t.id} task={t} index={i} />
                ))}
                {ordered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">No tasks</td></tr>
                )}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function Shell() {
  return (
    <div className="p-6 space-y-4">
      <HeaderBar
        title="Tasks"
        onSearch={()=>{}}
        actions={[{ key:'add', label:'Add Task', icon:<Plus className='w-4 h-4' />, onClick:()=> alert('New Task') }]} />
      <TasksTable />
    </div>
  );
}

// ---- List blocks view (stacked sections) ----
function TaskBlock({ title, status, activeId, setActiveId }: { title: string; status: TaskStatus; activeId?: number|null; setActiveId: (id:number)=>void }) {
  const { tasks, moveTask } = useTasks();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const rows = React.useMemo(() => tasks.filter(t=> t.status===status).sort((a,b)=> (a.order-b.order) || (a.id-b.id)), [tasks, status]);
  const ids = rows.map(r=> r.id);

  const ItemCard: React.FC<{ task: Task }> = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
    const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition } as any;
    const active = activeId === task.id;
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}
        onClick={()=> setActiveId(task.id)}
        className={`rounded-xl border p-3 bg-white shadow-card hover:shadow-lg-soft transition ${active? 'ring-2 ring-primary-500' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">{task.title}</div>
            {task.description ? <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</div> : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {task.assignee ? <span className="px-2 py-0.5 rounded-full border bg-gray-50">{task.assignee}</span> : null}
              {task.priority ? <span className="px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">{task.priority}</span> : null}
              {task.label ? <span className="px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">{task.label}</span> : null}
              {task.dueDate ? <span className="px-2 py-0.5 rounded-full border">⏰ {task.dueDate}</span> : null}
            </div>
          </div>
          <div className="text-gray-400 cursor-grab" title="Drag"><GripVertical className="w-4 h-4" /></div>
        </div>
      </div>
    );
  };

  return (
    <div className="arch-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs text-gray-500">{rows.length} tasks</div>
      </div>
      <DndContext sensors={sensors} onDragEnd={(e: DragEndEvent) => {
        const { active, over } = e; if (!over) return;
        const destIndex = rows.findIndex(t=> t.id===Number(over.id));
        moveTask(Number(active.id), { toStatus: status, toIndex: Math.max(0, destIndex) });
      }}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {rows.map(r=> <ItemCard key={r.id} task={r} />)}
            {rows.length===0 && (
              <div className="rounded-xl border bg-white p-8 text-center text-gray-500">No tasks</div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function MiniChat({ activeId }: { activeId?: number|null }) {
  const [msgs, setMsgs] = React.useState<Record<number, { id:string; at:string; text:string; user:string }[]>>({});
  const [txt, setTxt] = React.useState('');
  const list = activeId ? (msgs[activeId] || []) : [];
  const send = () => { if (!activeId || !txt.trim()) return; const m = { id: crypto.randomUUID?.() || String(Math.random()), at: new Date().toISOString(), text: txt.trim(), user:'you' }; setMsgs(s => ({ ...s, [activeId]: [...(s[activeId]||[]), m] })); setTxt(''); };
  return (
    <div className="rounded-2xl border bg-white shadow-card p-3">
      <div className="mb-2 text-sm font-semibold">Mini Chat {activeId ? `#${activeId}` : ''}</div>
      <div className="h-40 overflow-auto space-y-2">
        {list.map(m=> (
          <div key={m.id} className="rounded-lg border bg-gray-50 p-2">
            <div className="text-xs text-gray-500">{m.user} • {new Date(m.at).toLocaleString()}</div>
            <div className="text-sm">{m.text}</div>
          </div>
        ))}
        {list.length===0 && <div className="text-sm text-gray-500">Select a task to chat.</div>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input className="flex-1 h-9 rounded-xl border px-3 text-sm input-focus" placeholder="Write a message…" value={txt} onChange={(e)=> setTxt(e.currentTarget.value)} />
        <button className="px-3 py-2 rounded border text-sm hover:bg-gray-50" onClick={send}>Send</button>
      </div>
    </div>
  );
}

// ---- Kanban view (toggle) ----
function KanbanView({ setActiveId }: { setActiveId: (id:number)=>void }) {
  const { tasks, moveTask } = useTasks();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const cols: TaskStatus[] = ['TODO','IN_PROGRESS','COMPLETED'];
  const label = (s: TaskStatus) => s==='TODO'?'To do': s==='IN_PROGRESS'?'In Progress':'Completed';
  const itemsBy = (s: TaskStatus) => tasks.filter(t=> t.status===s).sort((a,b)=> (a.order-b.order)||(a.id-b.id));

  const Droppable: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
    const { setNodeRef } = useDroppable({ id });
    return <div ref={setNodeRef} className="min-h-[120px]">{children}</div>;
  };

  const Card: React.FC<{ t: Task }> = ({ t }) => (
    <div onClick={()=> setActiveId(t.id)} className="rounded-xl border p-3 bg-white shadow-card hover:shadow-lg-soft cursor-pointer">
      <div className="text-sm font-semibold">{t.title}</div>
      {t.assignee && <div className="text-xs text-gray-500">{t.assignee}</div>}
      {t.dueDate && <div className="text-xs text-gray-600 mt-1">⏰ {t.dueDate}</div>}
    </div>
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={(e: DragEndEvent)=>{
      const { active, over } = e; if (!over) return;
      const activeTask = tasks.find(t=> t.id===Number(active.id)); if (!activeTask) return;
      const overTask = tasks.find(t=> t.id===Number((over as any).id));
      if (overTask) {
        const toStatus = overTask.status as TaskStatus;
        const dest = itemsBy(toStatus);
        const idx = dest.findIndex(x=> x.id===overTask.id);
        moveTask(activeTask.id, { toStatus, toIndex: Math.max(0, idx) });
      } else {
        // Dropped on empty column root
        const to = String((over as any).id).replace('col-','') as TaskStatus;
        moveTask(activeTask.id, { toStatus: to, toIndex: 0 });
      }
    }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cols.map((s)=> (
          <div key={s} className="arch-card p-3">
            <div className="tb-col-title"><span>{label(s)}</span><span className="tb-badge">{itemsBy(s).length}</span></div>
            <Droppable id={`col-${s}`}>
              <SortableContext items={itemsBy(s).map(t=> t.id)} strategy={rectSortingStrategy}>
                <div className="grid gap-2">
                  {itemsBy(s).map(t=> (
                    <div key={t.id}><Card t={t} /></div>
                  ))}
                </div>
              </SortableContext>
            </Droppable>
          </div>
        ))}
      </div>
    </DndContext>
  );
}

export default function TasksListPage() {
  return (
    <TasksProvider>
      <PageShell />
    </TasksProvider>
  );
}

function PageShell() {
  const [mode, setMode] = React.useState<'list'|'kanban'>('list');
  const [activeId, setActiveId] = React.useState<number | null>(null);
  const [openAdd, setOpenAdd] = React.useState(false);
  const { setFilter } = useTasks();
  return (
    <div className="p-6 space-y-4">
      <HeaderBar
        title="Tasks"
        onSearch={(s)=> setFilter({ search: s })}
        searchPlaceholder="Search tasks…"
        actions={[
          { key: 'new-request', label: 'New Request', icon: <Plus className="w-5 h-5" />, onClick: () => console.log('New Request') },
          { key: 'import-requests', label: 'Import Requests', icon: <Upload className="w-5 h-5" />, onClick: () => console.log('Import Requests') },
          { key: 'new-material', label: 'New Material', icon: <PackagePlus className="w-5 h-5" />, onClick: () => console.log('New Material') },
          { key: 'import-materials', label: 'Import Materials', icon: <Boxes className="w-5 h-5" />, onClick: () => console.log('Import Materials') },
          { key: 'new-vendor', label: 'New Vendor', icon: <Users className="w-5 h-5" />, onClick: () => console.log('New Vendor') },
          { key: 'import-vendors', label: 'Import Vendors', icon: <Upload className="w-5 h-5" />, onClick: () => console.log('Import Vendors') },
          { key: 'new-payment-request', label: 'New Payment Request', icon: <Wallet className="w-5 h-5" />, onClick: () => console.log('New Payment Request') },
        ]}
      />

      {mode==='list' ? (
        <>
          <div className="space-y-4">
            <TaskBlock title="To do" status="TODO" activeId={activeId ?? undefined} setActiveId={setActiveId} />
            <TaskBlock title="In Progress" status="IN_PROGRESS" activeId={activeId ?? undefined} setActiveId={setActiveId} />
            <TaskBlock title="Completed" status="COMPLETED" activeId={activeId ?? undefined} setActiveId={setActiveId} />
          </div>
          <MiniChat activeId={activeId ?? undefined} />

          {/* Useful extras */}
          <UsefulExtras />
        </>
      ) : (
        <>
          <KanbanView setActiveId={setActiveId} />
          <MiniChat activeId={activeId ?? undefined} />
          <UsefulExtras />
        </>
      )}

      <AddTaskModal open={openAdd} onClose={()=> setOpenAdd(false)} />
    </div>
  );
}

function UsefulExtras() {
  const { tasks } = useTasks();
  const upcoming = React.useMemo(()=> tasks.filter(t=> t.dueDate && (new Date(t.dueDate!).getTime()-Date.now()) <= 7*86400000 && t.status!=='COMPLETED').slice(0,6), [tasks]);
  const byAssignee = React.useMemo(()=> {
    const m = new Map<string, number>();
    tasks.forEach(t=> { if (t.assignee) m.set(t.assignee, (m.get(t.assignee)||0)+1); });
    return Array.from(m.entries());
  }, [tasks]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border bg-white shadow-card p-3">
        <div className="mb-2 text-sm font-semibold">Upcoming Deadlines (7d)</div>
        <ul className="divide-y">
          {upcoming.length===0 && <li className="py-4 text-sm text-gray-500 text-center">Nothing upcoming</li>}
          {upcoming.map(t=> (
            <li key={t.id} className="py-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{t.title}</div>
                <div className="text-xs text-gray-500">{t.assignee || '—'}</div>
              </div>
              <div className="text-xs">⏰ {t.dueDate}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border bg-white shadow-card p-3">
        <div className="mb-2 text-sm font-semibold">Team Load</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {byAssignee.length===0 && <div className="text-sm text-gray-500">No assignees yet</div>}
          {byAssignee.map(([name, count])=> (
            <div key={name} className="arch-card p-3 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 mx-auto grid place-items-center text-xs font-semibold">{name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()}</div>
              <div className="mt-1 text-sm font-medium">{name}</div>
              <div className="text-xs text-gray-500">{count} tasks</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
