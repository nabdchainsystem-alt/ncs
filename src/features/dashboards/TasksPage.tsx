import React, { useMemo, useState } from 'react';
import TaskBoard from '../../ui/TaskBoard';
import {
    Search, Filter, LayoutTemplate, List, KanbanSquare,
    Calendar, SlidersHorizontal, ArrowUpDown, Plus, ChevronsDownUp, ChevronsUpDown, Zap
} from 'lucide-react';

import { authService } from '../../services/auth';
import { useRoomBoardData } from '../rooms/hooks/useRoomBoardData';
import { Priority, Status } from '../rooms/boardTypes';
import {
    DndContext,
    useSensor,
    useSensors,
    PointerSensor,
    DragEndEvent,
    closestCorners,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const s = {
    // Layout
    pageBg: 'bg-stone-50',
    container: 'w-full',
    sectionPadding: 'py-10',

    // Typography
    fontMain: 'font-serif antialiased',
    h1: 'text-5xl font-medium tracking-tight text-gray-900 font-serif',
    h2: 'text-2xl font-bold text-gray-900 font-serif',
    subline: 'text-lg text-gray-500 font-serif italic mt-2',
    navText: 'text-sm font-bold tracking-wide uppercase',

    // Elements
    btnGroup: 'flex items-stretch border border-gray-900 rounded-sm bg-white shadow-sm hover:shadow-md transition-shadow',
    btnLeft: 'px-6 py-2.5 flex items-center gap-2 text-sm font-bold border-r border-gray-900 hover:bg-gray-50 text-gray-900',
    btnRight: 'px-6 py-2.5 flex items-center gap-2 text-sm font-bold hover:bg-gray-50 text-gray-900',

    // Tools
    toolbar: 'flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-200',
    toolBtn: 'flex items-center px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-black hover:bg-white border border-transparent hover:border-gray-200 rounded-sm transition-all',
    toolBtnActive: 'bg-black text-white border-black hover:bg-gray-800 hover:text-white',
    searchInput: 'bg-transparent border-b border-gray-200 focus:border-black outline-none py-2 w-64 text-sm font-serif placeholder:italic',
};


const TasksPage: React.FC = () => {
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'done' | 'new'>('all');
    const [sortKey, setSortKey] = useState<'none' | 'name' | 'dueAsc' | 'dueDesc' | 'priority'>('none');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [expandAllSignal, setExpandAllSignal] = useState(0);
    const [collapseAllSignal, setCollapseAllSignal] = useState(0);
    const user = authService.getCurrentUser();
    const storageKey = user ? `taskboard-${user.id}` : 'taskboard-default';

    const taskTools = useMemo(() => ([
        { label: 'Expand all', icon: ChevronsDownUp, onClick: () => setExpandAllSignal(prev => prev + 1) },
        { label: 'Collapse all', icon: ChevronsUpDown, onClick: () => setCollapseAllSignal(prev => prev + 1) },
    ]), []);

    const { board, setBoard } = useRoomBoardData(storageKey);

    const searchLower = searchQuery.trim().toLowerCase();
    const isFiltering = searchLower.length > 0 || statusFilter !== 'all';

    const normalizeStatus = (raw?: string): Status => {
        if (!raw) return Status.New;
        const val = raw.toLowerCase();
        if (val.includes('done') || val.includes('complete')) return Status.Done;
        if (val.includes('work') || val.includes('progress') || val.includes('doing')) return Status.Working;
        if (val.includes('stuck') || val.includes('block')) return Status.Stuck;
        if (val.includes('pending') || val.includes('todo') || val.includes('to do') || val.includes('backlog')) return Status.Pending;
        if (val.includes('almost') || val.includes('review')) return Status.AlmostFinish;
        return Status.New;
    };

    const matchesSearch = (task: any) => {
        if (!searchLower) return true;
        if ((task.name || '').toLowerCase().includes(searchLower)) return true;
        return Object.values(task.textValues || {}).some((v: any) => (v || '').toLowerCase().includes(searchLower));
    };

    const matchesStatusFilter = (task: any, group: any) => {
        if (statusFilter === 'all') return true;
        const statusColId = group.columns?.find((c: any) => c.type === 'status')?.id;
        const resolved = normalizeStatus(task.status || (statusColId ? task.textValues?.[statusColId] : undefined));
        if (statusFilter === 'done') return resolved === Status.Done;
        if (statusFilter === 'new') return resolved === Status.New || resolved === Status.Pending;
        return resolved !== Status.Done;
    };

    const sortTasksForView = (tasks: any[]) => {
        if (sortKey === 'none') return tasks;
        const cloned = [...tasks];
        if (sortKey === 'name') {
            cloned.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortKey === 'dueAsc' || sortKey === 'dueDesc') {
            cloned.sort((a, b) => {
                const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                return sortKey === 'dueAsc' ? aTime - bTime : bTime - aTime;
            });
        } else if (sortKey === 'priority') {
            const order: Record<string, number> = {
                [Priority.Urgent]: 1,
                [Priority.High]: 2,
                [Priority.Medium]: 3,
                [Priority.Normal]: 4,
                [Priority.Low]: 5,
            };
            cloned.sort((a, b) => (order[a.priority] || 99) - (order[b.priority] || 99));
        }
        return cloned;
    };

    const filteredGroups = useMemo(() => {
        return (board.groups || []).map(g => {
            const tasks = sortTasksForView((g.tasks || []).filter(t => matchesSearch(t) && matchesStatusFilter(t, g)));
            return { ...g, tasks };
        }).filter(g => !isFiltering || g.tasks.length > 0);
    }, [board.groups, isFiltering, sortTasksForView, matchesSearch, matchesStatusFilter]);

    // --- Kanban DnD ---
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !active.data.current) return;

        const { taskId, fromGroupId } = active.data.current as { taskId: string, fromGroupId: string };
        const overData = over.data.current as { taskId?: string; groupId?: string } | undefined;
        const toGroupId = overData?.groupId || fromGroupId;
        const beforeTaskId = overData?.taskId;

        if (!taskId || !toGroupId) return;

        setBoard(prev => {
            const newGroups = prev.groups.map(g => ({ ...g, tasks: [...g.tasks] }));
            const fromGroup = newGroups.find(g => g.id === fromGroupId);
            const targetGroup = newGroups.find(g => g.id === toGroupId);
            if (!fromGroup || !targetGroup) return prev;

            const taskIndex = fromGroup.tasks.findIndex(t => t.id === taskId);
            if (taskIndex === -1) return prev;
            const [task] = fromGroup.tasks.splice(taskIndex, 1);

            let insertIndex = targetGroup.tasks.length;
            if (beforeTaskId) {
                const idx = targetGroup.tasks.findIndex(t => t.id === beforeTaskId);
                if (idx >= 0) insertIndex = idx;
            }
            targetGroup.tasks.splice(insertIndex, 0, task);

            return { ...prev, groups: newGroups };
        });
    };

    const kanbanColumns = filteredGroups;

    return (
        <div className={`h-screen w-full ${s.pageBg} ${s.fontMain} relative overflow-hidden flex flex-col`}>
            {/* Background Texture*/}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <div className={`${s.container} px-8 md:px-16 pb-64 relative z-10`}>

                    {/* Header */}
                    <header className={`${s.sectionPadding} pt-20 pb-12 flex flex-col md:flex-row justify-between items-end gap-8`}>
                        <div>
                            <h1 className={s.h1}>Your Tasks</h1>
                            <p className={s.subline}>Manage, track, and complete.</p>
                        </div>

                        {/* View Toggle / Action Group */}
                        <div className={s.btnGroup}>
                            <button
                                onClick={() => setViewMode('table')}
                                className={viewMode === 'table' ? s.btnLeft + ' bg-gray-50' : s.btnLeft}
                            >
                                <List size={16} strokeWidth={2} />
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={viewMode === 'kanban' ? s.btnRight + ' border-l border-gray-900 bg-gray-50' : s.btnRight + ' border-l border-gray-900'}
                            >
                                <KanbanSquare size={16} strokeWidth={2} />
                                Kanban
                            </button>
                            <button
                                className={s.btnRight + ' border-l border-gray-900 !px-4 text-emerald-600'}
                                onClick={() => setExpandAllSignal(prev => prev + 1)} // Re-using signal for placeholder "Add" logic
                            >
                                <Plus size={16} strokeWidth={2} />
                            </button>
                        </div>
                    </header>


                    {/* Tools Toolbar */}
                    <div className={s.toolbar}>
                        {/* Search */}
                        <div className="relative mr-4">
                            <Search className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={s.searchInput + " pl-6"}
                            />
                        </div>

                        <div className="h-6 w-px bg-gray-200 mx-2"></div>

                        {/* Filter */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
                                className={s.toolBtn + (isFiltering ? ' text-blue-600' : '')}
                            >
                                <Filter size={14} className="mr-2" /> Filter
                            </button>
                            {showFilterMenu && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-sm shadow-xl z-20 py-2">
                                    <span className="block px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
                                    {[
                                        { key: 'all', label: 'All' },
                                        { key: 'active', label: 'Active' },
                                        { key: 'done', label: 'Done' },
                                        { key: 'new', label: 'New' },
                                    ].map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => { setStatusFilter(opt.key as any); setShowFilterMenu(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm font-serif hover:bg-gray-50 ${statusFilter === opt.key ? 'text-black font-bold' : 'text-gray-600'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sort */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
                                className={s.toolBtn + (sortKey !== 'none' ? ' text-blue-600' : '')}
                            >
                                <ArrowUpDown size={14} className="mr-2" /> Sort
                            </button>
                            {showSortMenu && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-sm shadow-xl z-20 py-2">
                                    <span className="block px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Order By</span>
                                    {[
                                        { key: 'none', label: 'Default' },
                                        { key: 'name', label: 'Name (A-Z)' },
                                        { key: 'dueAsc', label: 'Due Date (Earliest)' },
                                        { key: 'dueDesc', label: 'Due Date (Latest)' },
                                        { key: 'priority', label: 'Priority (High)' },
                                    ].map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => { setSortKey(opt.key as any); setShowSortMenu(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm font-serif hover:bg-gray-50 ${sortKey === opt.key ? 'text-black font-bold' : 'text-gray-600'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-gray-200 mx-2"></div>

                        {/* Task Tools */}
                        {taskTools.map(tool => (
                            <button
                                key={tool.label}
                                onClick={tool.onClick}
                                className={s.toolBtn}
                                title={tool.label}
                            >
                                <tool.icon size={14} className="mr-2" /> {tool.label}
                            </button>
                        ))}
                    </div>


                    {/* Main Board Content */}
                    <div className="w-full">
                        {viewMode === 'table' && (
                            <TaskBoard
                                storageKey={storageKey}
                                expandAllSignal={expandAllSignal}
                                collapseAllSignal={collapseAllSignal}
                                searchQuery={searchQuery}
                                statusFilter={statusFilter}
                                sortKey={sortKey}
                                autoHeight={true}
                            />
                        )}
                        {viewMode === 'kanban' && (
                            <div className="w-full overflow-x-auto pb-12">
                                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                                        {kanbanColumns.map(group => (
                                            <KanbanColumn key={group.id} group={group} />
                                        ))}
                                    </div>
                                </DndContext>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TasksPage;

// --- Kanban Components ---

const KanbanColumn: React.FC<{ group: any }> = ({ group }) => {
    const { setNodeRef, isOver } = useDroppableColumn(group.id);

    return (
        <div ref={setNodeRef} className={`w-full min-w-[300px] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col transition-all ${isOver ? 'ring-2 ring-black' : ''}`}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-serif font-bold text-gray-900">{group.title}</h3>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500">{group.tasks.length}</span>
            </div>
            <SortableContext items={group.tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 max-h-[500px] overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {group.tasks.length === 0 && (
                        <div className="text-sm font-serif italic text-gray-400 text-center py-8">No tasks</div>
                    )}
                    {group.tasks.map((task: any) => (
                        <KanbanCard key={task.id} task={task} groupId={group.id} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
};

const KanbanCard: React.FC<{ task: any; groupId: string }> = ({ task, groupId }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { taskId: task.id, fromGroupId: groupId, groupId }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group`}
        >
            <p className="text-base font-serif text-gray-900 mb-3 group-hover:text-amber-700 transition-colors">{task.name}</p>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm bg-gray-50 text-gray-500 border border-gray-100">{task.status || 'New'}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}</span>
            </div>
        </div>
    );
};

const useDroppableColumn = (id: string) => {
    const droppable = useDroppable({
        id,
        data: { groupId: id }
    });
    return droppable;
};
