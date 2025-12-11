import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    format, addDays, startOfWeek, endOfWeek, eachDayOfInterval,
    isSameDay, isWeekend, differenceInDays, parseISO, isValid
} from 'date-fns';
import {
    ChevronRight, ChevronDown, Plus, MoreHorizontal, Calendar as CalendarIcon,
    Search, Filter, ZoomIn, ZoomOut, Link as LinkIcon
} from 'lucide-react';
import { Task, INITIAL_DATA } from './KanbanBoard'; // Importing types

interface GanttProps {
    roomId?: string;
    initialTasks?: Task[];
}

const CELL_WIDTH = 50;
const HEADER_HEIGHT = 60;
const ROW_HEIGHT = 44;
const SIDEBAR_WIDTH = 300;

export const GanttChart: React.FC<GanttProps> = ({ roomId, initialTasks = [] }) => {
    const [tasks, setTasks] = useState<Task[]>(initialTasks.length > 0 ? initialTasks : []);
    const [zoomLevel, setZoomLevel] = useState<'day' | 'week'>('day');
    const [viewStartDate, setViewStartDate] = useState(startOfWeek(new Date()));
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'uncategorized': true });

    // Mock data generation if empty
    useEffect(() => {
        if (tasks.length === 0) {
            const today = new Date();
            const mockTasks: Task[] = [
                { id: 't1', title: 'Project Initiation', statusId: 'todo', priority: 'high', tags: [], subtasks: [], startDate: new Date().toISOString(), dueDate: addDays(new Date(), 3).toISOString(), dependencies: [] },
                { id: 't2', title: 'Design Phase', statusId: 'in-progress', priority: 'normal', tags: [], subtasks: [], startDate: addDays(new Date(), 2).toISOString(), dueDate: addDays(new Date(), 6).toISOString(), dependencies: ['t1'] },
                { id: 't3', title: 'Development', statusId: 'todo', priority: 'high', tags: [], subtasks: [], startDate: addDays(new Date(), 5).toISOString(), dueDate: addDays(new Date(), 12).toISOString(), dependencies: ['t2'] },
                { id: 't4', title: 'QA Testing', statusId: 'todo', priority: 'normal', tags: [], subtasks: [], startDate: addDays(new Date(), 11).toISOString(), dueDate: addDays(new Date(), 15).toISOString(), dependencies: ['t3'] },
            ];
            setTasks(mockTasks);
        }
    }, [initialTasks]);

    // Timeline calculations
    const daysToShow = 30; // Number of days to render
    const dates = useMemo(() => {
        return eachDayOfInterval({
            start: viewStartDate,
            end: addDays(viewStartDate, daysToShow - 1)
        });
    }, [viewStartDate]);

    // Helper: Get task position and width
    const getTaskLayout = (task: Task) => {
        if (!task.startDate || !task.dueDate) return null;
        const start = parseISO(task.startDate);
        const end = parseISO(task.dueDate);
        if (!isValid(start) || !isValid(end)) return null;

        const startOffset = differenceInDays(start, viewStartDate);
        const duration = differenceInDays(end, start) + 1;

        return {
            left: startOffset * CELL_WIDTH,
            width: Math.max(duration * CELL_WIDTH, CELL_WIDTH) // Min width 1 cell
        };
    };

    // Draw dependency lines (Bezier curves)
    const renderDependencies = () => {
        return tasks.map(task => {
            if (!task.dependencies?.length) return null;

            const targetLayout = getTaskLayout(task);
            if (!targetLayout) return null;

            return task.dependencies.map(depId => {
                const sourceTask = tasks.find(t => t.id === depId);
                const sourceLayout = sourceTask ? getTaskLayout(sourceTask) : null;

                if (!sourceTask || !sourceLayout) return null;

                const startX = sourceLayout.left + sourceLayout.width;
                const startY = (tasks.indexOf(sourceTask) * ROW_HEIGHT) + (ROW_HEIGHT / 2);

                const endX = targetLayout.left;
                const endY = (tasks.indexOf(task) * ROW_HEIGHT) + (ROW_HEIGHT / 2);

                const controlPoint1X = startX + 20;
                const controlPoint1Y = startY;
                const controlPoint2X = endX - 20;
                const controlPoint2Y = endY;

                const pathData = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;

                return (
                    <path
                        key={`${depId}-${task.id}`}
                        d={pathData}
                        fill="none"
                        stroke="#78716c" // stone-500
                        strokeWidth="1.5"
                        markerEnd="url(#arrowhead)"
                        className="opacity-60 hover:opacity-100 hover:stroke-stone-800 dark:hover:stroke-stone-200 transition-all cursor-pointer"
                    />
                );
            });
        });
    };


    return (
        <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans overflow-hidden border-t border-stone-200 dark:border-stone-800">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur border-b border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-white dark:bg-stone-900 rounded-lg p-1 border border-stone-200 dark:border-stone-800">
                        <button
                            onClick={() => setZoomLevel('day')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${zoomLevel === 'day' ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'}`}
                        >
                            Days
                        </button>
                        <button
                            onClick={() => setZoomLevel('week')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${zoomLevel === 'week' ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'}`}
                        >
                            Weeks
                        </button>
                    </div>
                    <div className="h-6 w-px bg-stone-200 dark:border-stone-800 mx-2"></div>
                    <button className="flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                        <Filter size={14} /> Filter
                    </button>
                    <button className="flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                        <ZoomIn size={14} /> Zoom
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button className="bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                        <Plus size={14} />
                        New Task
                    </button>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Sidebar (Task List) */}
                <div
                    className="flex-shrink-0 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 z-20 shadow-sm relative"
                    style={{ width: SIDEBAR_WIDTH }}
                >
                    {/* Sidebar Header */}
                    <div className="h-[60px] border-b border-stone-200 dark:border-stone-800 flex items-center px-4 font-serif font-bold text-sm text-stone-700 dark:text-stone-300 bg-stone-50/50 dark:bg-stone-900/50">
                        Name
                    </div>
                    {/* Sidebar Rows */}
                    <div className="overflow-hidden">
                        {tasks.map((task, index) => (
                            <div
                                key={task.id}
                                className="flex items-center px-4 border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
                                style={{ height: ROW_HEIGHT }}
                            >
                                <div className={`w-2 h-2 rounded-full mr-3 ${task.statusId === 'done' ? 'bg-emerald-500' : task.statusId === 'in-progress' ? 'bg-blue-500' : 'bg-stone-300'}`}></div>
                                <span className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate flex-1 font-serif">{task.title}</span>
                                <button className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-600 transition-opacity">
                                    <MoreHorizontal size={14} />
                                </button>
                            </div>
                        ))}
                        {/* New Task Row Placeholder */}
                        <div className="flex items-center px-4 h-[44px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/50 font-sans text-sm">
                            <Plus size={14} className="mr-3" /> Add Task
                        </div>
                    </div>
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 overflow-auto bg-stone-50/30 dark:bg-stone-950 relative">
                    {/* Header: Months/Days */}
                    <div className="sticky top-0 z-10 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex" style={{ width: dates.length * CELL_WIDTH }}>
                        {dates.map((date, i) => (
                            <div
                                key={date.toISOString()}
                                className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-stone-100 dark:border-stone-800/50 ${isWeekend(date) ? 'bg-stone-50/50 dark:bg-stone-900/50' : ''}`}
                                style={{ width: CELL_WIDTH, height: HEADER_HEIGHT }}
                            >
                                <span className="text-[10px] uppercase font-bold text-stone-400 font-sans mb-1">{format(date, 'E')}</span>
                                <div className={`text-xs font-semibold ${isSameDay(date, new Date()) ? 'bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 w-6 h-6 rounded-full flex items-center justify-center' : 'text-stone-600 dark:text-stone-300'}`}>
                                    {format(date, 'd')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Grid Body */}
                    <div className="relative" style={{ width: dates.length * CELL_WIDTH, height: tasks.length * ROW_HEIGHT + 100 }}>
                        {/* Vertical Grid Lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                            {dates.map((date, i) => (
                                <div
                                    key={`grid-${i}`}
                                    className={`flex-shrink-0 border-r border-stone-100 dark:border-stone-800/30 h-full ${isWeekend(date) ? 'bg-stone-50/30 dark:bg-stone-800/10' : ''}`}
                                    style={{ width: CELL_WIDTH }}
                                ></div>
                            ))}
                        </div>

                        {/* Horizontal Rows (for hover effect) */}
                        {tasks.map((task, index) => (
                            <div
                                key={`row-${task.id}`}
                                className="absolute left-0 w-full border-b border-stone-100 dark:border-stone-800/30 hover:bg-stone-100/30 dark:hover:bg-stone-800/20 transition-colors"
                                style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
                            ></div>
                        ))}


                        {/* SVG Layer for Connections */}
                        <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
                            <defs>
                                <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                    <polygon points="0 0, 6 2, 0 4" fill="#78716c" />
                                </marker>
                            </defs>
                            {renderDependencies()}
                        </svg>

                        {/* Task Bars */}
                        {tasks.map((task, index) => {
                            const layout = getTaskLayout(task);
                            if (!layout) return null;
                            const isLate = task.dueDate && new Date(task.dueDate) < new Date() && task.statusId !== 'done';

                            return (
                                <div
                                    key={`bar-${task.id}`}
                                    className="absolute z-20 group"
                                    style={{
                                        top: (index * ROW_HEIGHT) + 8, // Center vertically
                                        left: layout.left,
                                        width: layout.width,
                                        height: ROW_HEIGHT - 16
                                    }}
                                >
                                    <div
                                        className={`w-full h-full rounded-md shadow-sm border border-black/5 dark:border-white/10 flex items-center px-2 text-xs font-medium text-white truncate cursor-pointer transition-all hover:brightness-110 hover:shadow-md relative
                                            ${task.statusId === 'done' ? 'bg-emerald-600' : task.statusId === 'in-progress' ? 'bg-blue-600' : isLate ? 'bg-red-500' : 'bg-stone-500'}
                                        `}
                                    >
                                        <span className="truncate drop-shadow-md font-sans">{task.title}</span>

                                        {/* Resize Handles (Visual) */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/20"></div>
                                        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/20"></div>

                                        {/* Connector Nodes (Visual) */}
                                        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-stone-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-stone-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>

                                    {/* Tooltip on Hover */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-stone-800 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                                        {format(parseISO(task.startDate!), 'MMM d')} - {format(parseISO(task.dueDate!), 'MMM d')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};
