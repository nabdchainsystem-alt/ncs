import React, { useEffect, useMemo, useState } from 'react';
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    startOfMonth,
    startOfWeek,
    subMonths,
    addDays
} from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Filter,
    Search,
    SlidersHorizontal,
    UserRound,
    EyeOff,
    Plus,
    RefreshCw
} from 'lucide-react';

import { spaceService } from '../private-space/spaceService';
import { authService } from '../../services/auth';

type CalendarTask = {
    id: string;
    name: string;
    dueDate: string;
    status?: string;
    priority?: string;
    source: 'main' | 'private';
    spaceName?: string;
};

const BOARD_STORAGE_KEY = 'taskboard-state';

const STATUS_COLOR_MAP: Record<string, string> = {
    'Done': '#00C875',
    'Working on it': '#FDAB3D',
    'Stuck': '#E2445C',
};

const PRIORITY_HEX_MAP: Record<string, string> = {
    'Normal': '#D9D9D9',
    'Low': '#579BFC',
    'Medium': '#FFA533',
    'High': '#7048C4',
    'Urgent': '#FF526B',
};

const getPriorityColor = (priority?: string) => PRIORITY_HEX_MAP[priority || 'Normal'] || '#D9D9D9';

const getStatusColor = (status?: string) => STATUS_COLOR_MAP[status || ''] || '#cbd5e1';

interface SpaceCalendarProps {
    refreshTrigger: string;
    onAddTask?: () => void;
    onShowList?: () => void;
    storageKey?: string;
}

const SpaceCalendar: React.FC<SpaceCalendarProps> = ({ refreshTrigger, onAddTask, onShowList, storageKey }) => {
    const boardStorageKey = storageKey || BOARD_STORAGE_KEY;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
    const [timePeriod, setTimePeriod] = useState<'day' | '4days' | 'week' | 'month'>('month');
    const [isPeriodOpen, setIsPeriodOpen] = useState(false);

    const fetchAllTasks = async () => {
        const tasks: CalendarTask[] = [];

        // 1. Fetch Main Board Tasks
        try {
            const user = authService.getCurrentUser();
            const mainKey = user ? `taskboard-${user.id}` : 'taskboard-default';
            const rawMain = localStorage.getItem(mainKey);
            if (rawMain) {
                const parsed = JSON.parse(rawMain);
                if (parsed?.groups) {
                    parsed.groups.forEach((group: any) => {
                        (group.tasks || []).forEach((task: any) => {
                            if (task?.dueDate) {
                                tasks.push({
                                    id: task.id,
                                    name: task.name || 'Task',
                                    dueDate: task.dueDate,
                                    status: task.status,
                                    priority: task.priority,
                                    source: 'main',
                                    spaceName: 'Main Board'
                                });
                            }
                        });
                    });
                }
            }
        } catch (e) {
            console.warn('Error loading main board tasks', e);
        }

        // 2. Fetch All Private Spaces Tasks
        try {
            const spaces = await spaceService.getSpaces();
            spaces.forEach(space => {
                const spaceKey = `taskboard-${space.id}`;
                const rawSpace = localStorage.getItem(spaceKey);
                if (rawSpace) {
                    const parsed = JSON.parse(rawSpace);
                    if (parsed?.groups) {
                        parsed.groups.forEach((group: any) => {
                            (group.tasks || []).forEach((task: any) => {
                                if (task?.dueDate) {
                                    tasks.push({
                                        id: task.id,
                                        name: task.name || 'Task',
                                        dueDate: task.dueDate,
                                        status: task.status,
                                        priority: task.priority,
                                        source: 'private',
                                        spaceName: space.name
                                    });
                                }
                            });
                        });
                    }
                }
            });
        } catch (e) {
            console.warn('Error loading space tasks', e);
        }

        setCalendarTasks(tasks);
    };

    useEffect(() => {
        fetchAllTasks();
    }, [refreshTrigger, boardStorageKey]);

    const computeRange = () => {
        if (timePeriod === 'day') {
            return { startDate: currentDate, endDate: currentDate };
        }
        if (timePeriod === '4days') {
            return { startDate: currentDate, endDate: addDays(currentDate, 3) };
        }
        if (timePeriod === 'week') {
            return { startDate: startOfWeek(currentDate), endDate: endOfWeek(currentDate) };
        }
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        return { startDate: startOfWeek(monthStart), endDate: endOfWeek(monthEnd) };
    };

    const { startDate, endDate } = computeRange();
    const days = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const columnCount = timePeriod === 'month' ? 7 : timePeriod === 'week' ? 7 : timePeriod === '4days' ? 4 : 1;
    const headerDates = timePeriod === 'month' ? [] : days.slice(0, columnCount);
    const isMonthView = timePeriod === 'month';
    const timeSlots = useMemo(() => Array.from({ length: 24 }, (_, i) => {
        const hour = i % 12 === 0 ? 12 : i % 12;
        const suffix = i < 12 ? 'am' : 'pm';
        return `${hour}${suffix}`;
    }), []);
    const visibleDays = isMonthView ? days : days.slice(0, columnCount);
    const monthRowHeight = '160px';

    const tasksByDay = useMemo(() => {
        const map: Record<string, CalendarTask[]> = {};
        days.forEach((day) => {
            const key = format(day, 'yyyy-MM-dd');
            map[key] = [];
        });
        calendarTasks.forEach((task) => {
            const key = task.dueDate;
            if (map[key]) map[key].push(task);
        });
        return map;
    }, [calendarTasks, days]);

    const goToday = () => setCurrentDate(new Date());

    const shiftDate = (direction: 'prev' | 'next') => {
        const delta = direction === 'prev' ? -1 : 1;
        if (timePeriod === 'day') return setCurrentDate((d) => addDays(d, delta));
        if (timePeriod === '4days') return setCurrentDate((d) => addDays(d, delta * 4));
        if (timePeriod === 'week') return setCurrentDate((d) => addDays(d, delta * 7));
        return setCurrentDate((d) => direction === 'prev' ? subMonths(d, 1) : addMonths(d, 1));
    };

    const periodLabel = {
        day: 'Day',
        '4days': '4 days',
        week: 'Week',
        month: 'Month'
    }[timePeriod];

    const headerLabel = timePeriod === 'month'
        ? format(currentDate, 'MMMM yyyy')
        : `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}`;

    const periodOptions = [
        { id: 'day', label: 'Day', hotkey: 'D' },
        { id: '4days', label: '4 days', hotkey: '4' },
        { id: 'week', label: 'Week', hotkey: 'W' },
        { id: 'month', label: 'Month', hotkey: 'M' },
    ] as const;

    const defaultBoard = () => ({
        id: 'board-1',
        name: 'Task Board',
        columns: [
            { id: 'col_name', title: 'Item', type: 'name', width: '300px' },
            { id: 'col_person', title: 'Owner', type: 'person', width: '96px' },
            { id: 'col_status', title: 'Status', type: 'status', width: '128px' },
            { id: 'col_priority', title: 'Priority', type: 'priority', width: '128px' },
            { id: 'col_date', title: 'Due Date', type: 'date', width: '110px' },
        ],
        groups: [] as any[],
    });

    const readBoard = () => {
        try {
            const raw = localStorage.getItem(boardStorageKey);
            if (!raw) return defaultBoard();
            const parsed = JSON.parse(raw);
            if (parsed?.groups && parsed?.columns) return parsed;
            return defaultBoard();
        } catch {
            return defaultBoard();
        }
    };

    const saveBoard = (board: any) => {
        try {
            localStorage.setItem(boardStorageKey, JSON.stringify(board));
        } catch (err) {
            console.warn('Failed to save board from calendar', err);
        }
    };

    const addTaskOnDay = (day: Date) => {
        const board = readBoard();
        const dueDate = format(day, 'yyyy-MM-dd');
        const groups = Array.isArray(board.groups) ? board.groups : [];
        const group = groups[0] || {
            id: uuidv4(),
            title: 'New Group',
            color: '#579bfc',
            tasks: [],
        };
        if (groups.length === 0) {
            board.groups = [group];
        }
        const newTask = {
            id: uuidv4(),
            name: 'New Item',
            status: 'Working on it',
            priority: 'Medium',
            dueDate,
            personId: null,
            textValues: {},
        };
        group.tasks = [...(group.tasks || []), newTask];
        saveBoard(board);
        saveBoard(board);
        fetchAllTasks();
    };

    return (
        <div className="flex flex-col h-full bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden relative">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <button onClick={goToday} className="px-3 py-1.5 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium">Today</button>
                    <div className="relative">
                        <button
                            className="px-3 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-gray-700 font-medium inline-flex items-center gap-1"
                            onClick={() => setIsPeriodOpen((v) => !v)}
                        >
                            {periodLabel} <ChevronDown size={14} />
                        </button>
                        {isPeriodOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsPeriodOpen(false)} />
                                <div className="absolute z-20 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 p-3">
                                    <div className="text-[11px] font-semibold text-gray-400 uppercase mb-2">Time period</div>
                                    <div className="space-y-1">
                                        {periodOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setTimePeriod(opt.id);
                                                    setIsPeriodOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm hover:bg-gray-50 ${timePeriod === opt.id ? 'text-black font-medium bg-gray-100' : 'text-gray-700'}`}
                                            >
                                                <span>{opt.label}</span>
                                                <span className="px-2 py-0.5 rounded border border-gray-200 text-[11px] text-gray-500 bg-gray-50">
                                                    {opt.hotkey}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200 text-gray-800 font-semibold">
                        <button onClick={() => shiftDate('prev')} className="p-1.5 rounded-md hover:bg-gray-100">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-base">{headerLabel}</span>
                        <button onClick={() => shiftDate('next')} className="p-1.5 rounded-md hover:bg-gray-100">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-50">
                        <Search size={16} /> Search
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-50">
                        <EyeOff size={16} /> Hide
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-50">
                        <SlidersHorizontal size={16} /> Customize
                    </button>
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-50"
                        onClick={fetchAllTasks}
                        title="Refresh tasks"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 shadow-sm"
                        onClick={() => (onShowList ? onShowList() : onAddTask?.())}
                    >
                        <Plus size={16} /> Add Task
                    </button>
                </div>
            </div>

            {/* Filters bar */}
            <div className="flex items-center gap-3 px-5 py-2 border-b border-gray-200 text-xs text-gray-600 bg-gray-50/80">
                <button className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-white hover:border-gray-300">
                    <Filter size={12} /> Filter
                </button>
                <button className="px-2 py-1 rounded-full border border-gray-200 bg-white hover:border-gray-300">Closed</button>
                <button className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-white hover:border-gray-300">
                    <UserRound size={12} /> Assignee
                </button>
                <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-2 text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    </div>
                    <div className="px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-500 flex items-center gap-2">
                        <Search size={12} /> Search
                    </div>
                </div>
            </div>

            {isMonthView ? (
                <>
                    {/* Month weekday headers */}
                    <div
                        className="grid text-xs font-semibold text-gray-500 border-b border-gray-200 px-5 py-2 bg-white"
                        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0,1fr))` }}
                    >
                        {weekDays.map((day) => (
                            <div key={day} className="uppercase tracking-wide text-left">{day}</div>
                        ))}
                    </div>

                    {/* Month grid */}
                    <div
                        className="grid flex-1 bg-gray-100 gap-px relative"
                        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0,1fr))`, gridAutoRows: monthRowHeight }}
                    >
                        {days.map((day) => {
                            const key = format(day, 'yyyy-MM-dd');
                            const dayTasks = tasksByDay[key] || [];
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div
                                    key={key}
                                    className={`bg-white p-3 flex flex-col border border-transparent hover:border-indigo-200 transition-colors ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`text-sm font-medium ${isToday ? 'text-white bg-black rounded-full px-2 py-1 shadow' : 'text-gray-700'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-black p-1 rounded"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addTaskOnDay(day);
                                            }}
                                            title="Add task on this date"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <div className="space-y-1 overflow-y-auto custom-scrollbar pr-1">
                                        {dayTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className={`text-[11px] leading-4 px-2 py-1 border flex items-center gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer hover:border-black/50 ${task.source === 'main' ? 'rounded-none border-l-4' : 'rounded-lg border-l-[3px]'}`}
                                                style={{ borderLeftColor: getStatusColor(task.status) }}
                                                title={`${task.name} (${task.spaceName}) - Priority: ${task.priority}`}
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getPriorityColor(task.priority) }}></div>
                                                <span className="truncate text-gray-700">{task.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <>
                    {/* Day/4-days/Week headers */}
                    <div
                        className="grid text-xs font-semibold text-gray-500 border-b border-gray-200 px-5 py-2 bg-white"
                        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0,1fr))` }}
                    >
                        {visibleDays.map((day) => (
                            <div key={day.toISOString()} className="text-left">
                                <div className="text-[11px] uppercase text-gray-400">{format(day, 'EEE')}</div>
                                <div className="text-sm text-gray-700 font-semibold">{format(day, 'MMM d')}</div>
                            </div>
                        ))}
                    </div>

                    {/* Timeline grid */}
                    <div className="flex flex-1 overflow-auto">
                        {/* Time rail */}
                        <div className="w-20 border-r border-gray-200 text-[11px] text-gray-400 bg-white">
                            <div className="h-11 flex items-center justify-end pr-2 border-b border-gray-100">All day</div>
                            {timeSlots.map((slot, idx) => (
                                <div
                                    key={slot}
                                    className={`h-12 flex items-start justify-end pr-2 ${idx === 0 ? 'border-t border-gray-100' : ''} border-b border-gray-100`}
                                >
                                    <span className="pt-1">{slot}</span>
                                </div>
                            ))}
                        </div>

                        {/* Columns */}
                        <div className="flex-1 overflow-auto">
                            <div
                                className="grid min-w-full"
                                style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(200px, 1fr))` }}
                            >
                                {visibleDays.map((day) => {
                                    const key = format(day, 'yyyy-MM-dd');
                                    const dayTasks = tasksByDay[key] || [];
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                        <div key={key} className="border-r border-gray-100 relative">
                                            {/* All day row */}
                                            <div className="h-11 border-b border-gray-100 flex items-center justify-between px-3 bg-white">
                                                <div className={`text-sm font-medium ${isToday ? 'text-black' : 'text-gray-700'}`}>
                                                    {format(day, 'd')}
                                                </div>
                                                <button
                                                    className="text-gray-400 hover:text-black p-1 rounded transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addTaskOnDay(day);
                                                    }}
                                                    title="Add task on this date"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            {/* Day tasks (all-day pills) */}
                                            {dayTasks.length > 0 && (
                                                <div className="absolute left-3 right-3 top-2 z-10 space-y-1 pointer-events-none">
                                                    {dayTasks.map((task) => (
                                                        <div
                                                            key={task.id}
                                                            className={`text-[11px] leading-4 px-2 py-1 border shadow-[0_1px_3px_rgba(0,0,0,0.05)] bg-white flex items-center gap-2 ${task.source === 'main' ? 'rounded-none border-l-4' : 'rounded-lg border-l-[3px]'}`}
                                                            style={{ borderLeftColor: getStatusColor(task.status) }}
                                                            title={`${task.name} (${task.spaceName}) - Priority: ${task.priority}`}
                                                        >
                                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getPriorityColor(task.priority) }}></div>
                                                            <span className="truncate text-gray-700">{task.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Hour slots */}
                                            <div className="relative">
                                                {timeSlots.map((slot, idx) => (
                                                    <div
                                                        key={slot}
                                                        className={`h-12 border-b border-gray-100 hover:bg-gray-50 transition-colors`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}


        </div>
    );
};

export default SpaceCalendar;
