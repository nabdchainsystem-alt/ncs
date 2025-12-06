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
        { label: 'Quick add', icon: Plus, onClick: () => setExpandAllSignal(prev => prev + 1) }, // placeholder for quick add modal trigger
        { label: 'AI assist', icon: Zap, onClick: () => setExpandAllSignal(prev => prev + 1) }, // placeholder hook for AI
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
        <div className="flex flex-col h-full w-full bg-white overflow-hidden">
            {/* Tools Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 bg-white z-10">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    {/* View Toggles */}
                    <div className="flex bg-gray-100 p-1 rounded-lg space-x-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Table view"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Kanban view"
                        >
                            <KanbanSquare size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
                        />
                    </div>

                    {/* Filters & Sort */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowFilterMenu(!showFilterMenu);
                                setShowSortMenu(false);
                            }}
                            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Filter size={16} className="mr-2" />
                            Filter
                        </button>
                        {showFilterMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                {[
                                    { key: 'all', label: 'All' },
                                    { key: 'active', label: 'Active (not done)' },
                                    { key: 'done', label: 'Done only' },
                                    { key: 'new', label: 'New / Pending' },
                                ].map(opt => (
                                    <button
                                        key={opt.key}
                                        onClick={() => {
                                            setStatusFilter(opt.key as any);
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${statusFilter === opt.key ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowSortMenu(!showSortMenu);
                                setShowFilterMenu(false);
                            }}
                            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <ArrowUpDown size={16} className="mr-2" />
                            Sort
                        </button>
                        {showSortMenu && (
                            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                {[
                                    { key: 'none', label: 'Default order' },
                                    { key: 'name', label: 'Name A → Z' },
                                    { key: 'dueAsc', label: 'Due date (soonest)' },
                                    { key: 'dueDesc', label: 'Due date (latest)' },
                                    { key: 'priority', label: 'Priority (high first)' },
                                ].map(opt => (
                                    <button
                                        key={opt.key}
                                        onClick={() => {
                                            setSortKey(opt.key as any);
                                            setShowSortMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${sortKey === opt.key ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Task tools */}
                    <div className="h-6 w-px bg-gray-200 mx-1"></div>
                    <div className="flex items-center space-x-2">
                        {taskTools.map(tool => (
                            <button
                                key={tool.label}
                                onClick={tool.onClick}
                                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                title={tool.label}
                            >
                                <tool.icon size={16} className="mr-2" />
                                {tool.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <SlidersHorizontal size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'table' && (
                    <TaskBoard
                        storageKey={storageKey}
                        expandAllSignal={expandAllSignal}
                        collapseAllSignal={collapseAllSignal}
                        searchQuery={searchQuery}
                        statusFilter={statusFilter}
                        sortKey={sortKey}
                    />
                )}
                {viewMode === 'kanban' && (
                    <div className="h-full w-full overflow-x-auto px-4 py-6 bg-gray-50">
                        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-min">
                                {kanbanColumns.map(group => (
                                    <KanbanColumn key={group.id} group={group} />
                                ))}
                            </div>
                        </DndContext>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TasksPage;

// --- Kanban Components ---

const KanbanColumn: React.FC<{ group: any }> = ({ group }) => {
    const { setNodeRef, isOver } = useDroppableColumn(group.id);

    return (
        <div ref={setNodeRef} className={`w-full min-w-[260px] bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col transition-all ${isOver ? 'ring-2 ring-blue-100' : ''}`}>
            <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-800 truncate">{group.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{group.tasks.length}</span>
                </div>
            </div>
            <SortableContext items={group.tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 max-h-[420px] overflow-y-auto p-3 space-y-3">
                    {group.tasks.length === 0 && (
                        <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">No tasks</div>
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
        boxShadow: isDragging ? '0 10px 25px rgba(0,0,0,0.12)' : undefined
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-80 ring-2 ring-blue-100' : ''}`}
        >
            <p className="text-sm font-medium text-gray-800 mb-2">{task.name}</p>
            <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100">{task.status || 'New'}</span>
                <span className="text-[10px] text-gray-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}</span>
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
