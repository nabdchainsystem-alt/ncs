import React, { useEffect, useMemo, useRef, useState } from "react";
import { TasksProvider, useTasks } from "../context/TasksContext";
import type { Task, TaskStatus } from "../types";
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/tasks.css';

// --- Small UI helpers (Tailwind classes aligned with our design system) ---
const Badge: React.FC<{ color?: "gray" | "blue" | "green" | "amber"; children: React.ReactNode }> = ({ color = "gray", children }) => {
  const map: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[color]}`}>{children}</span>;
};

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" }> = ({ variant = "outline", className = "", ...props }) => {
  const base = "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300",
  } as const;
  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />;
};

// --- Tabs & View Switch ---
const Tabs: React.FC = () => {
  const { tab, setTab, counts } = useTasks();
  const tabs: { key: "all" | TaskStatus; label: string; count: number }[] = [
    { key: "all", label: "All Tasks", count: counts.all },
    { key: "TODO", label: "To do", count: counts.TODO },
    { key: "IN_PROGRESS", label: "In Progress", count: counts.IN_PROGRESS },
    { key: "COMPLETED", label: "Completed", count: counts.COMPLETED },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
            tab === t.key ? "border-blue-600 text-blue-700 bg-blue-50" : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span>{t.label}</span>
          <Badge color={tab === t.key ? "blue" : "gray"}>{t.count}</Badge>
        </button>
      ))}
    </div>
  );
};

const ViewSwitch: React.FC<{ mode: "list" | "kanban" | "deps" | "heatmap"; setMode: (m: "list" | "kanban" | "deps" | "heatmap") => void }> = ({ mode, setMode }) => (
  <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
    {([
      ["list","List"],
      ["kanban","Kanban"],
      ["deps","Dependencies"],
      ["heatmap","Heatmap"],
    ] as const).map(([k,label]) => (
      <button key={k} onClick={()=>setMode(k)} className={`px-3 py-1.5 text-sm ${mode===k? 'bg-gray-100' : 'hover:bg-gray-50'}`}>{label}</button>
    ))}
  </div>
);

// --- List View (grouped sections like TailAdmin) ---
const Section: React.FC<{ title: string; items: Task[]; color: "gray" | "blue" | "green" }>
  = ({ title, items, color }) => {
  const { moveTask } = useTasks();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const SortableItem: React.FC<{ task: Task }> = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
    const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition } as any;
    return (
      <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center justify-between px-4 py-3 cursor-grab">
        <div className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
          <div>
            <div className="text-sm font-medium text-gray-900">{task.title}</div>
            {task.description ? <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</div> : null}
            <div className="flex items-center gap-2 mt-2">
              {task.label ? <Badge>{task.label}</Badge> : null}
              {task.priority ? <Badge color="amber">{task.priority}</Badge> : null}
              {task.assignee ? <Badge color="blue">{task.assignee}</Badge> : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => alert(`Open task #${task.id}`)}>Open</Button>
          <Button onClick={() => (window.dispatchEvent(new CustomEvent('tasks:openChat',{ detail:{ taskId: task.id } })))}>💬 Chat</Button>
          <Button onClick={() => (window.dispatchEvent(new CustomEvent('tasks:openCall',{ detail:{ taskId: task.id } })))}>📞 Call</Button>
          <Button variant="outline" onClick={() => alert("More actions…")}>•••</Button>
        </div>
      </li>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <Badge color={color}>{items.length}</Badge>
        </div>
      </div>
      <DndContext sensors={sensors} onDragEnd={(e: DragEndEvent) => {
        const { active, over } = e; if (!over || active.id === over.id) return;
        const fromIndex = items.findIndex(t => t.id === Number(active.id) || t.id === active.id);
        const toIndex = items.findIndex(t => t.id === Number(over.id) || t.id === over.id);
        if (fromIndex < 0 || toIndex < 0) return;
        // keep same status, reorder within section
        moveTask(Number(active.id), { toIndex });
      }}>
        <SortableContext items={items.map((t)=> t.id)} strategy={rectSortingStrategy}>
          <ul className="divide-y divide-gray-200">
            {items.map((t) => (<SortableItem key={t.id} task={t} />))}
            {items.length === 0 && (
              <li className="px-4 py-8 text-sm text-gray-500 text-center">No tasks</li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
};

const ListView: React.FC = () => {
  const { tasks } = useTasks();
  const groups = useMemo(() => ({
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    COMPLETED: tasks.filter((t) => t.status === "COMPLETED"),
  }), [tasks]);
  return (
    <div className="space-y-6">
      <Section title="To do" items={groups.TODO} color="gray" />
      <Section title="In Progress" items={groups.IN_PROGRESS} color="blue" />
      <Section title="Completed" items={groups.COMPLETED} color="green" />
    </div>
  );
};

// ---- Kanban Board with DnD ----
type Lane = 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
const laneToStatus = (l: Lane): TaskStatus => l === 'BACKLOG' ? 'TODO' : l === 'DONE' ? 'COMPLETED' : 'IN_PROGRESS';

const TaskCard: React.FC<{ task: Task; dragging?: boolean; onChat?: (t:Task)=>void; onCall?: (t:Task)=>void }> = ({ task, dragging, onChat, onCall }) => {
  const overdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now();
  return (
    <motion.div layout className={`tb-card ${dragging ? 'dragging' : ''} ${overdue ? 'shake' : ''}`}>
      <div className="text-sm font-semibold text-gray-900">{task.title}</div>
      {task.description ? <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</div> : null}
      <div className="tb-meta">
        {task.priority ? <span className="tb-badge warn">{task.priority}</span> : null}
        {task.assignee ? <span className="tb-badge">{task.assignee}</span> : null}
        {task.dueDate ? <span className="tb-badge">⏰ {task.dueDate}</span> : null}
        {task.label ? <span className="tb-badge ok">{task.label}</span> : null}
      </div>
      <div className="mt-2 flex gap-2">
        <button className="tb-badge" onClick={(e)=> { e.stopPropagation(); onChat?.(task); }}>💬 Chat</button>
        <button className="tb-badge" onClick={(e)=> { e.stopPropagation(); onCall?.(task); }}>📞 Call</button>
      </div>
    </motion.div>
  );
};

const SortableCard: React.FC<{ task: Task; onChat?: (t:Task)=>void; onCall?: (t:Task)=>void }> = ({ task, onChat, onCall }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(task.id) });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition } as any;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} dragging={isDragging} onChat={onChat} onCall={onCall} />
    </div>
  );
};

const Column: React.FC<{ title: string; lane: Lane; items: Task[]; highlight?: boolean; onChat?: (t:Task)=>void; onCall?: (t:Task)=>void }> = ({ title, lane, items, highlight, onChat, onCall }) => (
  <div className={`tb-col ${highlight ? 'highlight glow' : ''}`}>
    <div className="tb-col-title">
      <span>{title}</span>
      <span className="tb-badge">{items.length}</span>
    </div>
    <SortableContext items={items.map((t)=> String(t.id))} strategy={rectSortingStrategy}>
      <div className="grid gap-2 min-h-[120px]">
        <AnimatePresence initial={false}>
          {items.map((t)=> (
            <motion.div key={t.id} layout initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0}}>
              <SortableCard task={t} onChat={onChat} onCall={onCall} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </SortableContext>
  </div>
);

const KanbanView: React.FC = () => {
  const { tasks, moveTask, updateTask } = useTasks();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const lanes: Record<Lane, Task[]> = useMemo(()=>({
    BACKLOG: tasks.filter(t=> t.status==='TODO'),
    IN_PROGRESS: tasks.filter(t=> t.status==='IN_PROGRESS' && t.label !== 'Review'),
    REVIEW: tasks.filter(t=> t.status==='IN_PROGRESS' && t.label === 'Review'),
    DONE: tasks.filter(t=> t.status==='COMPLETED'),
  }), [tasks]);

  const [highlight, setHighlight] = useState<Lane | null>(null);

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e; setHighlight(null);
    if (!over) return;
    const fromLane = (Object.keys(lanes) as Lane[]).find((l)=> lanes[l].some(t=> String(t.id)===active.id))!;
    let toLane: Lane = fromLane;
    // Guess lane by over id (item id) membership
    for (const l of Object.keys(lanes) as Lane[]) {
      if (lanes[l].some(t=> String(t.id)===String(over.id))) { toLane = l; break; }
    }
    const dest = lanes[toLane];
    const overIndex = dest.findIndex(t=> String(t.id)===String(over.id));
    const toIndex = overIndex >= 0 ? overIndex : dest.length;
    const toStatus = laneToStatus(toLane);
    await moveTask(Number(active.id), { toStatus, toIndex });
    if (toLane === 'REVIEW') await updateTask(Number(active.id), { label: 'Review' } as any);
    if (fromLane === 'REVIEW' && toLane !== 'REVIEW') await updateTask(Number(active.id), { label: null } as any);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd} onDragOver={(e)=>{
      const { over } = e; if(!over) return; let lane: Lane | null = null; for(const l of Object.keys(lanes) as Lane[]){ if(lanes[l].some(t=> String(t.id)===String(over.id))) { lane=l; break; } }
      setHighlight(lane);
    }}>
      <div className="tb-board">
        <Column title="Backlog" lane="BACKLOG" items={lanes.BACKLOG} highlight={highlight==='BACKLOG'} />
        <Column title="In Progress" lane="IN_PROGRESS" items={lanes.IN_PROGRESS} highlight={highlight==='IN_PROGRESS'} />
        <Column title="Review" lane="REVIEW" items={lanes.REVIEW} highlight={highlight==='REVIEW'} />
        <Column title="Done" lane="DONE" items={lanes.DONE} highlight={highlight==='DONE'} />
      </div>
    </DndContext>
  );
};

// --- Dependencies (Graph-like) simple view ---
const DependenciesView: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const nodes = tasks.slice(0,12);
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="font-semibold text-sm mb-2">Dependency Map</div>
      <div className="relative overflow-hidden" style={{ height: 320 }}>
        <svg viewBox="0 0 800 320" width="100%" height="100%">
          {nodes.map((n,i)=>{
            const x=100 + (i%6)*110; const y=60 + Math.floor(i/6)*160;
            // simple rule: link each node to next
            if(i<nodes.length-1){ const nx=100 + ((i+1)%6)*110; const ny=60 + Math.floor((i+1)/6)*160;
              return (
                <g key={'g'+i}>
                  <defs>
                    <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,6 L6,3 z" fill="#93C5FD" />
                    </marker>
                  </defs>
                  <line x1={x+60} y1={y+20} x2={nx} y2={ny+20} stroke="#93C5FD" strokeWidth={2} markerEnd="url(#arrow)" />
                </g>
              );
            }
            return null;
          })}
          {nodes.map((n,i)=>{ const x=100 + (i%6)*110; const y=60 + Math.floor(i/6)*160; return (
            <g key={n.id}>
              <rect x={x} y={y} rx={10} ry={10} width={120} height={40} fill="#F3F4F6" stroke="#E5E7EB" />
              <text x={x+60} y={y+24} textAnchor="middle" fontSize="11" fill="#111827">{n.title.slice(0,14)}</text>
            </g>
          ); })}
        </svg>
      </div>
    </div>
  );
};

// --- Heatmap (load per assignee) ---
const HeatmapView: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const members = Array.from(new Set(tasks.map(t=> t.assignee).filter(Boolean))) as string[];
  const days = Array.from({length:7}).map((_,i)=> ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]);
  const count = (name:string, dayIndex:number) => tasks.filter(t=> t.assignee===name && (new Date(t.createdAt).getDay()===dayIndex || new Date(t.updatedAt||t.createdAt).getDay()===dayIndex)).length;
  const color = (v:number) => v>6? '#EF4444' : v>3? '#F59E0B' : v>1? '#10B981' : '#D1D5DB';
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="font-semibold text-sm mb-2">Executive Heatmap</div>
      <div className="overflow-auto">
        <table className="text-xs">
          <thead><tr><th className="px-2 py-1 text-left">Member</th>{days.map((d,i)=> <th key={i} className="px-2 py-1 text-left">{d}</th>)}</tr></thead>
          <tbody>
            {members.map(m=> (
              <tr key={m} className="border-t">
                <td className="px-2 py-1 font-medium">{m}</td>
                {days.map((_,i)=>{ const v=count(m,i); return <td key={i} className="px-2 py-1"><div className="heat-cell" style={{ background: color(v) }} title={`${v} tasks`} /></td>; })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BoardContent: React.FC = () => {
  const { loading, createTask, refresh, tasks } = useTasks();
  const [mode, setMode] = useState<"list" | "kanban" | "deps" | "heatmap">("kanban");
  const [globalChat, setGlobalChat] = useState<{ user:string; text:string; ts:number }[]>([]);
  const [chatTask, setChatTask] = useState<Task | null>(null);
  const [taskMessages, setTaskMessages] = useState<Record<number, { user:string; text:string; ts:number }[]>>({});
  const [callFor, setCallFor] = useState<Task | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const [callTime, setCallTime] = useState<number>(0);

  // open chat/call via events (from list buttons)
  useEffect(()=>{
    const openChat = (e: any) => {
      const id = Number(e?.detail?.taskId); const t = tasks.find(x=> x.id===id);
      if (t) setChatTask(t);
    };
    const openCall = (e: any) => {
      const id = Number(e?.detail?.taskId); const t = tasks.find(x=> x.id===id);
      if (t) startCall(t);
    };
    window.addEventListener('tasks:openChat', openChat as any);
    window.addEventListener('tasks:openCall', openCall as any);
    return () => {
      window.removeEventListener('tasks:openChat', openChat as any);
      window.removeEventListener('tasks:openCall', openCall as any);
    };
  }, [tasks]);

  async function startCall(t: Task) {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaRef.current = ms; setCallFor(t); setCallTime(0);
      if (videoRef.current) videoRef.current.srcObject = ms;
      // recorder for note (local only)
      const rec = new MediaRecorder(ms, { mimeType: 'video/webm;codecs=vp9,opus' } as any);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setTaskMessages((map)=> ({ ...map, [t.id]: [ ...(map[t.id]||[]), { user:'System', text:`Call recording saved: ${url}`, ts: Date.now() } ] }));
      };
      rec.start(); recRef.current = rec;
      const timer = setInterval(()=> setCallTime(s=> s+1), 1000);
      // auto-stop after 5 minutes
      setTimeout(()=> stopCall(timer), 5*60*1000);
    } catch (e) {
      alert('Unable to access camera/microphone');
    }
  }
  function stopCall(timer?: any) {
    if (timer) clearInterval(timer);
    recRef.current?.stop(); recRef.current = null;
    mediaRef.current?.getTracks().forEach(tr=> tr.stop());
    mediaRef.current = null; setCallFor(null); setCallTime(0);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-gray-900">Discussion Board</h1>
          <div className="text-sm text-gray-500">Tasks (List & Kanban)</div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => alert("Filter & Sort modal (next step)")}>Filter & Sort</Button>
          <Button variant="primary" onClick={async () => {
            const title = window.prompt("Task title");
            if (!title) return;
            await createTask({ title });
            await refresh();
          }}>Add New Task</Button>
        </div>
      </div>

      {/* Tabs & View switch */}
      <div className="flex items-center justify-between">
        <Tabs />
        <ViewSwitch mode={mode} setMode={setMode} />
      </div>

      {/* Content */}
      <div>
        {mode === "list" && <ListView />}
        {mode === "kanban" && (
          <KanbanView />
        )}
        {mode === "deps" && <DependenciesView tasks={tasks} />}
        {mode === "heatmap" && <HeatmapView tasks={tasks} />}
      </div>

      {/* Global Chat */}
      <div className="rounded-xl border bg-white p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-sm">Project Chat</div>
        </div>
        <div className="max-h-40 overflow-auto space-y-1">
          <AnimatePresence initial={false}>
            {globalChat.map((m,i)=> (
              <motion.div key={i} initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="text-sm"><b>{m.user}:</b> {m.text}</motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input className="border rounded px-3 py-2 text-sm flex-1" placeholder="Write a message… (@Ahmed to mention)" onKeyDown={(e)=>{
            const el=e.target as HTMLInputElement; if(e.key==='Enter' && el.value.trim()){ setGlobalChat(ch=> [...ch, { user:'You', text:el.value.trim(), ts:Date.now() }]); el.value=''; }
          }} />
          <button className="px-3 py-2 bg-gray-900 text-white rounded text-sm" onClick={(e)=>{
            const inp=(e.currentTarget.previousSibling as HTMLInputElement); if(inp && inp.value.trim()){ setGlobalChat(ch=> [...ch, { user:'You', text:inp.value.trim(), ts:Date.now() }]); inp.value=''; }
          }}>Send</button>
        </div>
      </div>

      {/* AI Task Assistant */}
      <AIAssistant />

      {/* Task Chat Drawer */}
      {chatTask && (
        <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center" onClick={()=> setChatTask(null)}>
          <div className="bg-white rounded-xl border w-[520px] max-w-[95vw] shadow-lg" onClick={(e)=> e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b"><div className="font-semibold">💬 {chatTask.title}</div><button onClick={()=> setChatTask(null)} className="text-sm border rounded px-2 py-1">Close</button></div>
            <div className="p-3 max-h-72 overflow-auto space-y-1">
              <AnimatePresence initial={false}>
                {(taskMessages[chatTask.id]||[]).map((m,i)=> (
                  <motion.div key={i} initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} exit={{opacity:0}} className="text-sm"><b>{m.user}:</b> {m.text}</motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="p-3 border-t flex items-center gap-2">
              <input className="border rounded px-3 py-2 text-sm flex-1" placeholder="Type a reply…" onKeyDown={(e)=>{ const el=e.target as HTMLInputElement; if(e.key==='Enter' && el.value.trim()){ setTaskMessages(map=> ({ ...map, [chatTask.id]: [ ...(map[chatTask.id]||[]), { user:'You', text:el.value.trim(), ts:Date.now() } ] })); el.value=''; } }} />
              <button className="px-3 py-2 bg-gray-900 text-white rounded text-sm" onClick={(e)=>{ const inp=(e.currentTarget.previousSibling as HTMLInputElement); if(inp && inp.value.trim()){ setTaskMessages(map=> ({ ...map, [chatTask.id]: [ ...(map[chatTask.id]||[]), { user:'You', text:inp.value.trim(), ts:Date.now() } ] })); inp.value=''; } }}>Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Mini Call Overlay */}
      {callFor && (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center" onClick={()=> stopCall()}>
          <div className="bg-white rounded-xl border w-[640px] max-w-[98vw] shadow-lg" onClick={(e)=> e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b"><div className="font-semibold">📞 Call — {callFor.title}</div><button onClick={()=> stopCall()} className="text-sm border rounded px-2 py-1">End</button></div>
            <div className="p-3 grid place-items-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded bg-black" />
              <div className="text-xs text-gray-500 mt-2">Time: {Math.floor(callTime/60)}:{String(callTime%60).padStart(2,'0')} (auto-stops at 5 min)</div>
            </div>
          </div>
        </div>
      )}

      {/* Gamification Leaderboard */}
      <Leaderboard />

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
    </div>
  );
};

const AIAssistant: React.FC = () => {
  const { tasks } = useTasks();
  const soon = tasks.filter(t=> t.dueDate && (new Date(t.dueDate).getTime() - Date.now()) < 3*86400000 && t.status!=='COMPLETED');
  const long = tasks.filter(t=> (t.description||'').length > 80).slice(0,3);
  const suggestDeadline = (t:Task) => {
    // naive: size by length => days
    const days = Math.min(14, 2 + Math.ceil(((t.description||'').length)/50));
    const d = new Date(Date.now()+days*86400000); return d.toISOString().slice(0,10);
  };
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="font-semibold text-sm mb-2">🤖 AI Assistant</div>
      <div className="text-sm text-gray-700 mb-1">Suggestions</div>
      <ul className="text-sm list-disc pl-5 space-y-1">
        {soon.slice(0,3).map(t=> <li key={t.id}>Task <b>{t.title}</b> may slip — propose deadline {suggestDeadline(t)}.</li>)}
        {long.map(t=> <li key={t.id}>Generated Checklist for <b>{t.title}</b>: Split into 3–5 subtasks based on notes.</li>)}
        <li>Daily summary is ready at 6 PM with progress and blockers.</li>
      </ul>
    </div>
  );
};

const Leaderboard: React.FC = () => {
  const { tasks } = useTasks();
  const scores = useMemo(()=>{
    const map: Record<string, number> = {};
    for (const t of tasks) if (t.status==='COMPLETED' && t.assignee) map[t.assignee] = (map[t.assignee]||0) + 10;
    return Object.entries(map).sort((a,b)=> b[1]-a[1]).slice(0,5);
  }, [tasks]);
  if (!scores.length) return null;
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="font-semibold text-sm mb-2">🏆 Leaderboard</div>
      <div className="grid gap-2">
        {scores.map(([name, pts], i)=> (
          <div key={name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2"><span className="text-gray-500">#{i+1}</span><span className="font-medium">{name}</span></div>
            <div className="font-semibold">{pts} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DiscussionBoardPage: React.FC = () => {
  return (
    <TasksProvider>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <BoardContent />
      </div>
    </TasksProvider>
  );
};

export default DiscussionBoardPage;
