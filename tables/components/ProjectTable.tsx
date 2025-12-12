import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Plus, 
  CircleDashed,
  Flag,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Trash2
} from 'lucide-react';
import { Task } from '../types';

// --- Helpers ---

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date);
};

const getPriorityColor = (priority: string | null) => {
  switch (priority) {
    case 'Urgent': return 'text-red-600';
    case 'High': return 'text-amber-500';
    case 'Normal': return 'text-blue-600';
    case 'Low': return 'text-stone-400';
    default: return 'text-stone-300';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Done': return <CheckCircle2 size={14} className="text-emerald-600" />;
    case 'In Progress': return <Clock size={14} className="text-amber-600" />;
    case 'To Do': return <Circle size={14} className="text-stone-400" />;
    default: return <CircleDashed size={14} className="text-stone-400" />;
  }
};

// --- Popover Components ---

const PriorityPicker: React.FC<{ 
  onSelect: (p: string) => void; 
  onClose: () => void;
  current: string | null;
}> = ({ onSelect, onClose, current }) => {
  const priorities = [
    { label: 'Urgent', color: 'text-red-600' },
    { label: 'High', color: 'text-amber-500' },
    { label: 'Normal', color: 'text-blue-600' },
    { label: 'Low', color: 'text-stone-400' },
  ];

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-2 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800">
        <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-400">Task Priority</span>
      </div>
      <div className="p-1">
        {priorities.map((p) => (
          <button
            key={p.label}
            onClick={() => { onSelect(p.label); onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-start rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${current === p.label ? 'bg-stone-50 dark:bg-stone-800/50' : ''}`}
          >
            <Flag size={16} className={p.color} fill="currentColor" fillOpacity={current === p.label ? 1 : 0.2} />
            <span className="text-stone-700 dark:text-stone-200">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const StatusPicker: React.FC<{ 
  onSelect: (s: string) => void; 
  onClose: () => void;
  current: string;
}> = ({ onSelect, onClose, current }) => {
  const [customStatus, setCustomStatus] = useState('');
  const [statuses, setStatuses] = useState(['To Do', 'In Progress', 'Done']);

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStatus.trim()) {
      setStatuses([...statuses, customStatus.trim()]);
      onSelect(customStatus.trim());
      setCustomStatus('');
      onClose();
    }
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-2 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800">
        <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-400">Task Status</span>
      </div>
      <div className="p-1 max-h-48 overflow-y-auto">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => { onSelect(s); onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-start rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${current === s ? 'bg-stone-50 dark:bg-stone-800/50' : ''}`}
          >
            {getStatusIcon(s)}
            <span className="text-stone-700 dark:text-stone-200">{s}</span>
          </button>
        ))}
      </div>
      <form onSubmit={handleAddStatus} className="p-2 border-t border-stone-100 dark:border-stone-800">
        <input
          type="text"
          value={customStatus}
          onChange={(e) => setCustomStatus(e.target.value)}
          placeholder="New status..."
          className="w-full px-2 py-1 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:ring-1 focus:ring-stone-400"
        />
      </form>
    </div>
  );
};

const DatePicker: React.FC<{ 
  onSelect: (d: Date) => void; 
  onClose: () => void;
  current: Date | null;
}> = ({ onSelect, onClose }) => {
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Array(31).fill(0).map((_, i) => i + 1);
  
  const shortcuts = [
    { label: 'Today', sub: 'Thu', date: new Date() },
    { label: 'Tomorrow', sub: 'Fri', date: new Date(Date.now() + 86400000) },
    { label: 'This weekend', sub: 'Sat', date: new Date(Date.now() + 86400000 * 2) },
    { label: 'Next week', sub: 'Mon', date: new Date(Date.now() + 86400000 * 4) },
    { label: '2 weeks', sub: formatDate(new Date(Date.now() + 86400000 * 14)), date: new Date(Date.now() + 86400000 * 14) },
  ];

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-1 w-[400px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="flex items-center p-2 border-b border-stone-200 dark:border-stone-800 gap-2">
         <div className="flex-1 bg-stone-50 dark:bg-stone-800 rounded px-2 py-1.5 flex items-center gap-2 border border-stone-200 dark:border-stone-700 focus-within:ring-2 ring-indigo-500/20">
            <CalendarIcon size={14} className="text-stone-400" />
            <input 
              type="text" 
              placeholder="Due date"
              className="bg-transparent border-none outline-none text-sm text-stone-700 dark:text-stone-200 w-full placeholder:text-stone-400"
              autoFocus
            />
         </div>
      </div>

      <div className="flex h-64">
        <div className="w-40 border-e border-stone-100 dark:border-stone-800 p-2 overflow-y-auto bg-stone-50/50 dark:bg-stone-900/50">
          <div className="space-y-0.5">
             {shortcuts.map((s, i) => (
               <button 
                 key={i}
                 onClick={() => { onSelect(s.date); onClose(); }}
                 className="w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
               >
                 <span className="text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100">{s.label}</span>
                 <span className="text-xs text-stone-400">{s.sub}</span>
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">{currentMonth}</span>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"><ChevronLeft size={14} /></button>
              <button className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"><ChevronRight size={14} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <span key={d} className="text-[10px] font-medium text-stone-400 uppercase">{d}</span>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 flex-1 content-start">
             <span className="h-7 w-7"></span>
             <span className="h-7 w-7"></span>
             <span className="h-7 w-7"></span>
             {daysInMonth.map(d => (
               <button 
                 key={d}
                 onClick={() => { 
                   const date = new Date(); 
                   date.setDate(d); 
                   onSelect(date); 
                   onClose(); 
                 }}
                 className={`
                   h-7 w-7 flex items-center justify-center text-xs rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors
                   ${d === today.getDate() ? 'bg-red-500 text-white hover:bg-red-600 font-bold' : 'text-stone-700 dark:text-stone-300'}
                 `}
               >
                 {d}
               </button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

const INITIAL_TASKS: Task[] = [
  { id: '1', name: 'Draft Q3 Proposal', status: 'In Progress', dueDate: new Date(), priority: 'High' },
  { id: '2', name: 'Review Website Assets', status: 'To Do', dueDate: null, priority: 'Normal' },
  { id: '3', name: 'Client Feedback Meeting', status: 'Done', dueDate: new Date(Date.now() - 86400000), priority: 'Urgent' },
  { id: '4', name: 'Update Design System', status: 'To Do', dueDate: null, priority: 'Low' },
];

interface Column {
  id: string;
  label: string;
  width: number;
  minWidth: number;
  resizable: boolean;
}

export const ProjectTable: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [newTaskName, setNewTaskName] = useState('');
  const [activeCell, setActiveCell] = useState<{ rowId: string, colId: string } | null>(null);
  
  // Drag & Drop State
  const dragItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState<{index: number, position: 'top' | 'bottom'} | null>(null);

  // Column Resize State
  const [columns, setColumns] = useState<Column[]>([
    { id: 'select', label: '', width: 48, minWidth: 40, resizable: false },
    { id: 'name', label: 'Name', width: 320, minWidth: 200, resizable: true },
    { id: 'status', label: 'Status', width: 140, minWidth: 100, resizable: true },
    { id: 'dueDate', label: 'Due date', width: 140, minWidth: 100, resizable: true },
    { id: 'priority', label: 'Priority', width: 140, minWidth: 100, resizable: true },
  ]);
  const resizingColId = useRef<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  // --- Click Outside Logic ---
  useEffect(() => {
    const handleClickOutside = () => setActiveCell(null);
    
    // Only add listener if there is an active cell
    if (activeCell) {
      window.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [activeCell]);

  // --- Handlers ---

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      name: newTaskName,
      status: 'To Do',
      dueDate: null,
      priority: null
    };
    setTasks([...tasks, newTask]);
    setNewTaskName('');
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleCell = (e: React.MouseEvent, rowId: string, colId: string) => {
    e.stopPropagation(); // Stop click from propagating to window listener
    if (activeCell?.rowId === rowId && activeCell?.colId === colId) {
      setActiveCell(null);
    } else {
      setActiveCell({ rowId, colId });
    }
  };

  // Drag and Drop (Improved with drop indicators)
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    // Optional: make the drag image transparent if you want purely custom styling, 
    // but default ghost image is usually fine.
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (dragItem.current === null || dragItem.current === index) return;

    // Calculate if we are hovering the top half or bottom half of the row
    const rect = e.currentTarget.getBoundingClientRect();
    const mid = (rect.bottom - rect.top) / 2;
    const clientY = e.clientY - rect.top;
    
    const position = clientY < mid ? 'top' : 'bottom';
    
    // Only update state if different to prevent excessive renders
    if (dropTarget?.index !== index || dropTarget?.position !== position) {
      setDropTarget({ index, position });
    }
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    setIsDragging(false);
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dragItem.current !== null && dropTarget) {
      const copy = [...tasks];
      const [draggedItem] = copy.splice(dragItem.current, 1);
      
      // Calculate insertion index
      // If we are dropping on a target that was *after* the dragged item, the index has shifted down by 1 because of splice.
      // However, it's easier to think about the original indices.
      
      let insertIndex = dropTarget.index;
      
      // If dropping "below" the target, we want to insert after it.
      if (dropTarget.position === 'bottom') {
        insertIndex += 1;
      }
      
      // Adjust if the dragged item came from before the insertion point
      if (dragItem.current < insertIndex) {
        insertIndex -= 1;
      }
      
      copy.splice(insertIndex, 0, draggedItem);
      setTasks(copy);
    }
    handleDragEnd();
  };


  // Column Resize
  const startResize = (e: React.MouseEvent, colId: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizingColId.current = colId;
    startX.current = e.clientX;
    startWidth.current = currentWidth;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColId.current) return;
    
    const diff = e.clientX - startX.current;
    const newWidth = startWidth.current + diff;

    setColumns(cols => cols.map(col => {
      if (col.id === resizingColId.current) {
        return { ...col, width: Math.max(col.minWidth, newWidth) };
      }
      return col;
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    resizingColId.current = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'default';
  }, [onMouseMove]);

  return (
    <div className="flex flex-col w-full h-full bg-stone-50 dark:bg-stone-900/50">
      
      {/* Table Header */}
      <div className="flex items-center border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 h-10 flex-shrink-0 sticky top-0 z-20">
        {columns.map((col, index) => (
          <div 
            key={col.id} 
            style={{ width: col.width }}
            className={`
              h-full flex items-center text-xs font-sans font-medium text-stone-500 dark:text-stone-400 
              ${col.id === 'select' ? 'justify-center px-0' : 'px-3'}
              ${index !== columns.length - 1 ? 'border-e border-stone-200/50 dark:border-stone-800' : ''}
              hover:bg-stone-100 dark:hover:bg-stone-800 cursor-default transition-colors select-none relative group
            `}
          >
            {col.id === 'select' && (
               <div className="w-3.5 h-3.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-800 hover:border-stone-400 transition-colors" />
            )}
            
            <div className="flex items-center gap-1.5 w-full truncate">
              <span>{col.label}</span>
            </div>

            {col.resizable && (
              <div 
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-stone-400/50 dark:hover:bg-stone-600/50 z-10"
                onMouseDown={(e) => startResize(e, col.id, col.width)}
              />
            )}
          </div>
        ))}
        {/* Add Column Button */}
        <button className="flex items-center justify-center w-8 h-full border-s border-stone-200/50 dark:border-stone-800 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <Plus size={14} />
        </button>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto overflow-x-auto bg-white dark:bg-stone-900 pb-20 relative">
        
        {/* Tasks */}
        {tasks.map((task, index) => (
           <div 
             key={task.id}
             draggable
             onDragStart={(e) => handleDragStart(e, index)}
             onDragOver={(e) => handleDragOver(e, index)}
             onDragEnd={handleDragEnd}
             onDrop={handleDrop}
             className={`
                group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50 
                hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors relative min-w-max
                ${isDragging && dragItem.current === index ? 'opacity-40' : ''}
                cursor-grab active:cursor-grabbing
             `}
           >
              {/* Drop Indicators */}
              {isDragging && dropTarget?.index === index && (
                <div 
                  className={`absolute left-0 right-0 h-0.5 bg-indigo-500 z-50 pointer-events-none ${dropTarget.position === 'top' ? '-top-[1px]' : '-bottom-[1px]'}`} 
                />
              )}

              {/* Checkbox / Drag Handle */}
              <div style={{ width: columns[0].width }} className="h-full flex items-center justify-center border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800">
                 <div className="hidden group-hover:flex text-stone-300">
                    <GripVertical size={14} />
                 </div>
                 <div className="group-hover:hidden w-3.5 h-3.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-800 hover:border-stone-400 cursor-pointer" />
              </div>

              {/* Name */}
              <div style={{ width: columns[1].width }} className="h-full flex items-center px-3 border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800 overflow-hidden">
                <span className="text-sm font-serif text-stone-800 dark:text-stone-200 truncate w-full">{task.name}</span>
              </div>

              {/* Status Cell */}
              <div style={{ width: columns[2].width }} className="h-full border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800 relative">
                <button 
                  onClick={(e) => toggleCell(e, task.id, 'status')}
                  className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                >
                  {task.status ? (
                    <div className="flex items-center gap-2 truncate">
                       {getStatusIcon(task.status)}
                       <span className="text-sm font-sans text-stone-600 dark:text-stone-300 truncate">{task.status}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-stone-400">Set Status</span>
                  )}
                </button>
                {activeCell?.rowId === task.id && activeCell?.colId === 'status' && (
                  <StatusPicker 
                    current={task.status} 
                    onSelect={(s) => handleUpdateTask(task.id, { status: s })} 
                    onClose={() => setActiveCell(null)} 
                  />
                )}
              </div>
              
              {/* Date Cell */}
              <div style={{ width: columns[3].width }} className="h-full border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800 relative">
                <button 
                   onClick={(e) => toggleCell(e, task.id, 'date')}
                   className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                >
                  <span className={`text-sm font-sans truncate ${task.dueDate ? 'text-stone-600 dark:text-stone-300' : 'text-stone-400'}`}>
                    {formatDate(task.dueDate) || 'Set Date'}
                  </span>
                </button>
                {activeCell?.rowId === task.id && activeCell?.colId === 'date' && (
                  <DatePicker 
                    current={task.dueDate} 
                    onSelect={(d) => handleUpdateTask(task.id, { dueDate: d })} 
                    onClose={() => setActiveCell(null)} 
                  />
                )}
              </div>

               {/* Priority Cell */}
              <div style={{ width: columns[4].width }} className="h-full border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800 relative">
                <button 
                  onClick={(e) => toggleCell(e, task.id, 'priority')}
                  className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                >
                  {task.priority ? (
                    <div className="flex items-center gap-2 truncate">
                       <Flag size={14} className={getPriorityColor(task.priority)} fill="currentColor" />
                       <span className="text-sm font-sans text-stone-600 dark:text-stone-300 truncate">{task.priority}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-stone-400">Set Priority</span>
                  )}
                </button>
                {activeCell?.rowId === task.id && activeCell?.colId === 'priority' && (
                  <PriorityPicker 
                    current={task.priority} 
                    onSelect={(p) => handleUpdateTask(task.id, { priority: p })} 
                    onClose={() => setActiveCell(null)} 
                  />
                )}
              </div>
               
               {/* Fixed Actions Column (Delete) */}
              <div className="w-8 h-full flex items-center justify-center text-stone-300 border-s border-stone-100/50 dark:border-stone-800">
                <button 
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-600 rounded transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
           </div>
        ))}
        
        {/* Input Row - MOVED TO BOTTOM */}
        <div className="group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors focus-within:bg-stone-50 dark:focus-within:bg-stone-800/50 min-w-max">
          <div style={{ width: columns[0].width }} className="h-full flex items-center justify-center border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800">
             <Plus size={14} className="text-stone-300 dark:text-stone-600" />
          </div>

          <div style={{ width: columns[1].width }} className="h-full flex items-center px-3 border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800">
            <input 
              type="text" 
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="Start typing..."
              className="w-full bg-transparent border-none outline-none text-sm font-serif placeholder:text-stone-400 text-stone-800 dark:text-stone-200 p-0"
            />
          </div>

          {/* Empty cells for Input Row */}
          {columns.slice(2).map(col => (
             <div key={col.id} style={{ width: col.width }} className="h-full border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800" />
          ))}
          
           {/* Spacer for Delete Column */}
           <div className="w-8 h-full border-s border-stone-100/50 dark:border-stone-800" />
        </div>

        <div className="w-full h-full min-h-[200px] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      </div>
    </div>
  );
};