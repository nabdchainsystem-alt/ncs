import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createPortal } from 'react-dom';
import {
    Copy, Download, Archive as ArchiveIcon, Trash2, Search, Sparkles, X, Plus, Clock, File, Activity, RefreshCw, CheckCircle, GripVertical, MoveRight, Star, Box, Pin, MoreHorizontal, Maximize2, Globe, Mail, Phone, MapPin, ChevronRight, ChevronDown, CornerDownRight, MessageSquare, Flag, Tag, Edit, User, Bell, Target, ListTodo, Link2, ArrowUpRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRoomBoardData } from '../features/rooms/hooks/useRoomBoardData';
import { Status, Priority, STATUS_COLORS, PRIORITY_COLORS, PEOPLE, IBoard } from '../features/rooms/boardTypes';
import { ITask, IGroup } from '../features/rooms/boardTypes';
import { useNavigation } from '../contexts/NavigationContext';
import { ColumnMenu } from '../features/tasks/components/ColumnMenu';
import { DatePicker } from '../features/tasks/components/DatePicker';
import { ColumnContextMenu } from '../features/tasks/components/ColumnContextMenu';
import { remindersService } from '../features/reminders/remindersService';
import { SendToReminderModal } from './SendToReminderModal';
import { SendToGoalsModal } from './SendToGoalsModal';

import { SendToTaskBoardModal } from './SendToTaskBoardModal';
import { TaskBoardGroup } from './TaskBoard/TaskBoardGroup';
import { resolveTaskStatus, statusColorMap, calculateProgress } from './TaskBoard/boardUtils';
import { authService } from '../services/auth';
import { StatusCell } from '../features/tasks/components/cells/StatusCell';
import { PriorityCell } from '../features/tasks/components/cells/PriorityCell';
import { PersonCell } from '../features/tasks/components/cells/PersonCell';
import { LongTextCell } from '../features/tasks/components/cells/LongTextCell';
import { DropdownCell } from '../features/tasks/components/cells/DropdownCell';
import { PlusIcon, TrashIcon, SparklesIcon } from './TaskBoardIcons';
import { ConfirmModal } from './ConfirmModal';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    closestCenter,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';



// ==========================================
// 3. MAIN APP COMPONENT
// ==========================================

import { Task as StoreTask } from '../types/shared';

interface TaskBoardProps {
    storageKey?: string;
    tasks?: StoreTask[];
    onTaskUpdate?: (taskId: string, updates: Partial<StoreTask>) => void;
    darkMode?: boolean;
    minimal?: boolean;
    showGroupHeader?: boolean;
    transparent?: boolean;
    autoHeight?: boolean;
    expandAllSignal?: number;
    collapseAllSignal?: number;
    searchQuery?: string;
    statusFilter?: 'all' | 'active' | 'done' | 'new';
    sortKey?: 'none' | 'name' | 'dueAsc' | 'dueDesc' | 'priority';
}

export interface TaskBoardHandle {
    /**
     * Returns the current board state including any draft rows,
     * optionally skipping the next localStorage persist so callers
     * can clear the draft key after exporting.
     */
    exportBoardWithDrafts: (options?: { skipPersist?: boolean }) => IBoard;
}

const TaskBoard = forwardRef<TaskBoardHandle, TaskBoardProps>(({ storageKey = 'taskboard-state', tasks: storeTasks, onTaskUpdate, darkMode = false, minimal = false, showGroupHeader = false, expandAllSignal, collapseAllSignal, searchQuery = '', statusFilter = 'all', sortKey = 'none', transparent = false, autoHeight = false }, ref) => {

    const {
        board,
        setBoard,
        aiPrompt,
        setAiPrompt,
        isAiLoading,
        aiAnalysis,
        setAiAnalysis,
        updateTask: internalUpdateTask,
        toggleTaskSelection,
        toggleGroupSelection,
        updateTaskTextValue,
        addTask,
        deleteTask,
        addGroup,
        deleteGroup,
        updateGroupTitle,
        toggleGroupPin,
        addColumn,
        updateColumnTitle,
        updateColumn,
        deleteColumn,
        duplicateColumn,
        moveColumn,
        reorderColumn,
        updateColumnWidth,
        handleGeneratePlan,
        handleAnalyzeBoard
    } = useRoomBoardData(storageKey);

    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        type: 'task' | 'group' | 'selected' | 'column';
        id?: string;
        groupId?: string;
    } | null>(null);
    const { isImmersive, activePage, setActivePage } = useNavigation();

    const handleDeleteTaskClick = (groupId: string, taskId: string) => {
        setDeleteConfirmation({ type: 'task', id: taskId, groupId });
    };

    const handleDeleteGroupClick = (groupId: string) => {
        setDeleteConfirmation({ type: 'group', groupId });
    };

    const handleDeleteSelectedClick = () => {
        setDeleteConfirmation({ type: 'selected' });
    };

    const handleDeleteColumnClick = (groupId: string, colId: string) => {
        setDeleteConfirmation({ type: 'column', id: colId, groupId });
    };

    const confirmDelete = () => {
        if (!deleteConfirmation) return;

        const { type, id, groupId } = deleteConfirmation;

        if (type === 'task' && id && groupId) {
            deleteTask(groupId, id);
        } else if (type === 'group' && groupId) {
            deleteGroup(groupId);
        } else if (type === 'selected') {
            handleDeleteSelected();
        } else if (type === 'column' && id && groupId) {
            deleteColumn(groupId, id);
        }

        setDeleteConfirmation(null);
    };

    // Sync Store Tasks to Board
    useEffect(() => {
        if (storeTasks && storeTasks.length > 0) {
            setBoard(prev => {
                const newGroups = [...prev.groups];
                // Ensure a default group exists
                if (newGroups.length === 0) {
                    newGroups.push({ id: 'g1', title: 'Tasks', color: '#3b82f6', tasks: [], columns: [], isPinned: false });
                }

                const group = newGroups[0];
                // Map store tasks to board tasks
                const mappedTasks: ITask[] = storeTasks.map(t => {
                    // Map Store Status to Board Status
                    let boardStatus = Status.New;
                    if (t.status === 'To do') boardStatus = Status.New;
                    else if (t.status === 'In Progress') boardStatus = Status.Working;
                    else if (t.status === 'Review') boardStatus = Status.AlmostFinish;
                    else if (t.status === 'Complete') boardStatus = Status.Done;

                    return {
                        id: t.id,
                        name: t.title,
                        status: boardStatus,
                        priority: t.priority as unknown as Priority, // Cast priority as they might match or need similar mapping
                        personId: t.assigneeId || null,
                        dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : '',
                        textValues: {},
                        selected: false
                    };
                });

                // Merge with existing columns logic if needed, but for now just replace tasks
                // to ensure we see the latest state (e.g. automated status change)
                newGroups[0] = { ...group, tasks: mappedTasks };
                return { ...prev, groups: newGroups };
            });
        }
    }, [storeTasks, setBoard]);

    // Wrap updateTask to notify parent
    const updateTask = (groupId: string, taskId: string, updates: Partial<ITask>) => {
        internalUpdateTask(groupId, taskId, updates);
        if (onTaskUpdate) {
            // Map ITask updates to StoreTask updates
            const storeUpdates: Partial<StoreTask> = {};
            if (updates.name) storeUpdates.title = updates.name;

            // Map Board Status to Store Status
            if (updates.status) {
                if (updates.status === Status.New) storeUpdates.status = 'To do' as any;
                else if (updates.status === Status.Pending) storeUpdates.status = 'To do' as any;
                else if (updates.status === Status.Working) storeUpdates.status = 'In Progress' as any;
                else if (updates.status === Status.Stuck) storeUpdates.status = 'In Progress' as any; // Map Stuck to In Progress for now
                else if (updates.status === Status.AlmostFinish) storeUpdates.status = 'Review' as any;
                else if (updates.status === Status.Done) storeUpdates.status = 'Complete' as any;
            }

            if (updates.priority) storeUpdates.priority = updates.priority as any;
            if (updates.personId !== undefined) storeUpdates.assigneeId = updates.personId || undefined;
            if (updates.dueDate) storeUpdates.dueDate = new Date(updates.dueDate);

            onTaskUpdate(taskId, storeUpdates);
        }
    };

    // Drag and Drop State
    const [isDragging, setIsDragging] = useState(false);
    const [openMenuGroupId, setOpenMenuGroupId] = useState<string | null>(null);
    const [activeDatePicker, setActiveDatePicker] = useState<{ taskId: string, colId: string, date: string | undefined, rect: DOMRect, onSelect: (d: string) => void } | null>(null);
    const [activeColumnMenu, setActiveColumnMenu] = useState<{ groupId: string, rect: DOMRect } | null>(null);
    const [activeConnectionMenu, setActiveConnectionMenu] = useState<{
        groupId: string;
        taskId: string;
        colId: string;
        rect: DOMRect;
        config?: { targetPath?: string; targetName?: string; };
    } | null>(null);
    const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
    const [subtaskInput, setSubtaskInput] = useState<Record<string, string>>({});
    const [showReminderModalGroupId, setShowReminderModalGroupId] = useState<string | null>(null);
    const [showGoalsModalGroupId, setShowGoalsModalGroupId] = useState<string | null>(null);
    const [showTaskBoardModalGroupId, setShowTaskBoardModalGroupId] = useState<string | null>(null);

    const user = authService.getCurrentUser();
    const isMainBoard = user && storageKey === `taskboard-${user.id}`;
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, groupId: string, colId: string } | null>(null);
    const [draftTasks, setDraftTasks] = useState<Record<string, Partial<ITask>>>({});
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const prevGroupsLength = useRef(board.groups.length);
    const [resizingCol, setResizingCol] = useState<{ groupId: string, colId: string, startX: number, startWidth: number } | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingCol) return;
            const diff = e.clientX - resizingCol.startX;
            const newWidth = Math.max(50, resizingCol.startWidth + diff);
            updateColumnWidth(resizingCol.groupId, resizingCol.colId, newWidth);
        };

        const handleMouseUp = () => {
            if (resizingCol) {
                setResizingCol(null);
                document.body.style.cursor = '';
            }
        };

        if (resizingCol) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        };
    }, [resizingCol, updateColumnWidth]);

    useEffect(() => {
        prevGroupsLength.current = board.groups.length;
    }, [board.groups.length]);

    const toggleSubtask = (taskId: string) => {
        const newExpanded = new Set(expandedTaskIds);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedTaskIds(newExpanded);
    };

    const handleAddSubtask = (groupId: string, parentTaskId: string) => {
        const name = subtaskInput[parentTaskId]?.trim();
        if (!name) return;

        const newSubtask: ITask = {
            id: `subtask-${uuidv4()}`,
            name: name,
            status: Status.New,
            priority: Priority.Normal,
            dueDate: '',
            personId: null,
            textValues: {},
            selected: false
        };

        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                if (g.id === groupId) {
                    return {
                        ...g,
                        tasks: g.tasks.map(t => {
                            if (t.id === parentTaskId) {
                                return {
                                    ...t,
                                    subtasks: [...(t.subtasks || []), newSubtask]
                                };
                            }
                            return t;
                        })
                    };
                }
                return g;
            })
        }));

        setSubtaskInput(prev => ({ ...prev, [parentTaskId]: '' }));
    };

    const updateDraftTask = (groupId: string, updates: Partial<ITask>) => {
        setDraftTasks(prev => ({
            ...prev,
            [groupId]: { ...prev[groupId], ...updates }
        }));
    };

    const handleAddTask = (groupId: string) => {
        const draft = draftTasks[groupId] || {};
        const title = draft.name || '';
        if (title.trim()) {
            addTask(groupId, title, draft);
            setDraftTasks(prev => {
                const next = { ...prev };
                delete next[groupId];
                return next;
            });
        }
    };

    const exportBoardWithDrafts = (options?: { skipPersist?: boolean }): IBoard => {
        const draftEntries = Object.entries(draftTasks).filter(([, draft]) => draft?.name?.trim());

        if (draftEntries.length === 0) {
            return board;
        }

        const mergedBoard: IBoard = {
            ...board,
            groups: board.groups.map(group => {
                const draft = draftTasks[group.id];
                const draftName = draft?.name?.trim();

                if (!draft || !draftName) return group;

                const newTask: ITask = {
                    id: uuidv4(),
                    name: draftName,
                    status: draft.status || Status.New,
                    priority: draft.priority || Priority.Normal,
                    dueDate: draft.dueDate || new Date().toISOString().split('T')[0],
                    personId: draft.personId ?? null,
                    textValues: draft.textValues || {},
                    selected: false
                };

                return { ...group, tasks: [...group.tasks, newTask] };
            })
        };

        if (!options?.skipPersist) {
            setBoard(mergedBoard);
        }
        setDraftTasks({});
        return mergedBoard;
    };

    useImperativeHandle(ref, () => ({
        exportBoardWithDrafts,
    }), [board, draftTasks]);

    const handleContextMenu = (e: React.MouseEvent, groupId: string, colId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, groupId, colId });
    };

    const handleContextMenuAction = (action: string, groupId: string, colId: string) => {
        if (action === 'delete') {
            deleteColumn(groupId, colId);
        } else if (action === 'duplicate') {
            duplicateColumn(groupId, colId);
        } else if (action === 'move_left') {
            // moveColumn(groupId, colId, 'left'); // Need to implement move left/right with index
        } else if (action === 'move_right') {
            // moveColumn(groupId, colId, 'right');
        } else if (action === 'rename') {
            const newTitle = prompt('Enter new column name:');
            if (newTitle) updateColumnTitle(groupId, colId, newTitle);
        }
        setContextMenu(null);
    };

    // --- Drag and Drop Logic ---

    // --- Drag and Drop Logic (dnd-kit) ---
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5, // Reduced from 10 to 5
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setIsDragging(true);
        setActiveId(active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) {
            setIsDragging(false);
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) {
            setIsDragging(false);
            return;
        }

        setBoard((prevBoard) => {
            const activeGroup = prevBoard.groups.find(g => g.tasks.some(t => t.id === activeId));
            const overGroup = prevBoard.groups.find(g => g.tasks.some(t => t.id === overId));

            if (!activeGroup || !overGroup) return prevBoard;

            const activeTaskIndex = activeGroup.tasks.findIndex(t => t.id === activeId);
            const overTaskIndex = overGroup.tasks.findIndex(t => t.id === overId);

            if (activeGroup.id === overGroup.id) {
                // Reorder in same group
                const newTasks = arrayMove(activeGroup.tasks, activeTaskIndex, overTaskIndex);
                const newGroups = prevBoard.groups.map(g =>
                    g.id === activeGroup.id ? { ...g, tasks: newTasks } : g
                );
                return { ...prevBoard, groups: newGroups };
            } else {
                // Move to different group
                const newActiveGroupTasks = [...activeGroup.tasks];
                const [movedTask] = newActiveGroupTasks.splice(activeTaskIndex, 1);

                // Update task status based on new group's first column or logic?
                // For now just move it.

                const newOverGroupTasks = [...overGroup.tasks];
                newOverGroupTasks.splice(overTaskIndex, 0, movedTask);

                const newGroups = prevBoard.groups.map(g => {
                    if (g.id === activeGroup.id) return { ...g, tasks: newActiveGroupTasks };
                    if (g.id === overGroup.id) return { ...g, tasks: newOverGroupTasks };
                    return g;
                });
                return { ...prevBoard, groups: newGroups };
            }
        });
        setIsDragging(false);
    };


    // --- Column Drag & Drop Handlers ---

    const handleColumnDragStart = (e: React.DragEvent, groupId: string, colId: string, index: number) => {
        // Prevent dragging the first column (Name)
        if (index === 0) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'COLUMN', groupId, colId, index }));
        e.dataTransfer.effectAllowed = 'move';
        // Optional: Add a class or style to indicate dragging
    };

    const handleColumnDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        // Prevent dropping on the first column
        if (index === 0) {
            e.dataTransfer.dropEffect = 'none';
        } else {
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleColumnDrop = (e: React.DragEvent, targetGroupId: string, targetIndex: number) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        try {
            const { type, groupId: fromGroupId, index: fromIndex } = JSON.parse(data);
            if (type === 'COLUMN' && fromGroupId === targetGroupId && fromIndex !== targetIndex && targetIndex !== 0) {
                reorderColumn(targetGroupId, fromIndex, targetIndex);
            }
        } catch (err) {
            // Ignore
        }
    };



    // --- Render Helpers ---


    const searchLower = searchQuery.trim().toLowerCase();
    const isFiltering = searchLower.length > 0 || statusFilter !== 'all';

    const matchesSearch = (task: ITask) => {
        if (!searchLower) return true;
        if (task.name.toLowerCase().includes(searchLower)) return true;
        return Object.values(task.textValues || {}).some(v => (v || '').toLowerCase().includes(searchLower));
    };

    const matchesStatusFilter = (task: ITask, group: IGroup) => {
        if (statusFilter === 'all') return true;
        const status = resolveTaskStatus(group, task);
        if (statusFilter === 'done') return status === Status.Done;
        if (statusFilter === 'new') return status === Status.New || status === Status.Pending;
        // active: anything not done
        return status !== Status.Done;
    };

    const sortTasksForView = (tasks: ITask[]) => {
        if (sortKey === 'none') return tasks;
        const cloned = [...tasks];
        if (sortKey === 'name') {
            cloned.sort((a, b) => a.name.localeCompare(b.name));
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

    const selectionColumnWidth = '50px';
    const actionColumnWidth = '50px';
    // const gridTemplate = ... // Removed top-level definition
    const selectedEntries = board.groups.flatMap(g =>
        g.tasks.filter(t => t.selected).map(t => ({ groupId: g.id, task: t }))
    );
    const selectedCount = selectedEntries.length;

    const clearAllSelections = () => {
        toggleGroupSelection('all', false);
    };

    const handleDeleteSelected = () => {
        if (selectedCount === 0) return;
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => ({
                ...g,
                tasks: g.tasks.filter(t => !t.selected)
            }))
        }));
    };

    const handleDuplicateSelected = () => {
        if (selectedCount === 0) return;
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                const selectedTasks = g.tasks.filter(t => t.selected);
                if (selectedTasks.length === 0) return g;
                const duplicates = selectedTasks.map(t => ({
                    ...t,
                    id: crypto.randomUUID(),
                    name: t.name + " (Copy)",
                    selected: true
                }));
                return { ...g, tasks: [...g.tasks, ...duplicates] };
            })
        }));
    };

    const toggleGroupCollapse = (groupId: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    useEffect(() => {
        if (expandAllSignal === undefined) return;
        setCollapsedGroups(new Set());
    }, [expandAllSignal]);

    // Use a ref to track the previous signal value
    const prevCollapseSignal = useRef(collapseAllSignal);

    useEffect(() => {
        if (collapseAllSignal === undefined) return;

        // Only collapse if the signal actually changed (incremented)
        if (collapseAllSignal !== prevCollapseSignal.current) {
            setCollapsedGroups(new Set(board.groups.map(g => g.id)));
            prevCollapseSignal.current = collapseAllSignal;
        }
    }, [collapseAllSignal, board.groups]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className={`flex w-full ${minimal || autoHeight ? 'h-full' : 'h-screen'} ${autoHeight ? '' : 'overflow-hidden'} font-sans transition-colors ${transparent ? 'bg-transparent' : (darkMode ? 'bg-[#0f1115] text-gray-200' : 'bg-white text-gray-800')}`}>

                {/* Main Content Area */}
                <main className={`flex-1 flex flex-col ${minimal || autoHeight ? 'h-full' : 'h-screen'} ${autoHeight ? '' : 'overflow-hidden'} relative transition-colors ${transparent ? 'bg-transparent' : (darkMode ? 'bg-[#0f1115]' : 'bg-white')}`}>

                    {/* Header */}
                    {/* Header */}
                    {!minimal && (
                        <header className={`h-16 flex items-center justify-between px-8 flex-shrink-0 transition-colors z-10 ${transparent ? 'bg-transparent' : 'bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800'}`}>
                            <div>
                                <h1 className={`text-2xl font-serif font-bold tracking-tight ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>{board.name}</h1>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={(e) => {
                                        const defaultGroup = board.groups[0];
                                        if (defaultGroup) addTask(defaultGroup.id);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 rounded-lg hover:opacity-90 transition-colors shadow-sm active:scale-95"
                                >
                                    <Plus size={18} />
                                    <span className="text-sm font-medium">Add Task</span>
                                </button>
                                <button
                                    onClick={addGroup}
                                    className="flex items-center gap-2 px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-md hover:bg-stone-300 dark:hover:bg-stone-700 transition text-sm font-medium shadow-sm">
                                    <PlusIcon className="w-4 h-4" /> New Group
                                </button>
                            </div>
                        </header>
                    )}

                    {/* Scrolling Board Content */}
                    <div ref={scrollContainerRef} className={`flex-1 ${autoHeight ? '' : 'overflow-y-auto overflow-x-hidden custom-scroll'} ${minimal ? 'p-0 pb-4' : (autoHeight ? '' : 'p-6 pb-96')}`}>

                        {/* AI Output Section */}
                        {aiAnalysis && (
                            <div className="mb-8 p-6 bg-white border border-indigo-100 rounded-2xl shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
                                <h3 className="text-indigo-900 font-bold text-lg mb-3 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-indigo-500" /> AI Assistant Insights</h3>
                                <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">{aiAnalysis}</p>
                                <button onClick={() => setAiAnalysis(null)} className="mt-4 text-xs font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-wider">Dismiss</button>
                            </div>
                        )}

                        {/* Render Groups */}
                        <div className="space-y-8 w-full">
                            {[...board.groups].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((group) => {
                                const filteredTasks = sortTasksForView(group.tasks.filter(t => matchesSearch(t) && matchesStatusFilter(t, group)));
                                const progress = calculateProgress(group, filteredTasks);
                                const allSelected = group.tasks.length > 0 && group.tasks.every(t => t.selected);
                                const someSelected = group.tasks.some(t => t.selected);

                                if (isFiltering && filteredTasks.length === 0) {
                                    return null;
                                }

                                return (
                                    <TaskBoardGroup
                                        key={group.id}
                                        group={group}
                                        filteredTasks={filteredTasks}
                                        progress={progress}
                                        collapsedGroups={collapsedGroups}
                                        toggleGroupCollapse={toggleGroupCollapse}
                                        updateGroupTitle={updateGroupTitle}
                                        toggleGroupPin={toggleGroupPin}
                                        setShowReminderModalGroupId={setShowReminderModalGroupId}
                                        setShowGoalsModalGroupId={setShowGoalsModalGroupId}
                                        setShowTaskBoardModalGroupId={setShowTaskBoardModalGroupId}
                                        isMainBoard={isMainBoard}
                                        handleDeleteGroupClick={handleDeleteGroupClick}
                                        allSelected={allSelected}
                                        someSelected={someSelected}
                                        toggleGroupSelection={toggleGroupSelection}
                                        selectionColumnWidth={selectionColumnWidth}
                                        actionColumnWidth={actionColumnWidth}
                                        handleContextMenu={handleContextMenu}
                                        handleColumnDragStart={handleColumnDragStart}
                                        handleColumnDragOver={handleColumnDragOver}
                                        handleColumnDrop={handleColumnDrop}
                                        updateColumnTitle={updateColumnTitle}
                                        activeColumnMenu={activeColumnMenu}
                                        setActiveColumnMenu={setActiveColumnMenu}
                                        setResizingCol={setResizingCol}
                                        expandedTaskIds={expandedTaskIds}
                                        toggleTaskSelection={toggleTaskSelection}
                                        updateTask={updateTask}
                                        handleDeleteTaskClick={handleDeleteTaskClick}
                                        updateTaskTextValue={updateTaskTextValue}
                                        toggleSubtask={toggleSubtask}
                                        setActiveDatePicker={setActiveDatePicker}
                                        setActiveConnectionMenu={setActiveConnectionMenu}
                                        handleAddSubtask={handleAddSubtask}
                                        subtaskInput={subtaskInput}
                                        setSubtaskInput={setSubtaskInput}
                                        draftTasks={draftTasks}
                                        updateDraftTask={updateDraftTask}
                                        handleAddTask={handleAddTask}
                                        darkMode={darkMode}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Floating Selection Bar */}
                    <AnimatePresence>
                        {selectedCount > 0 && (
                            <motion.div
                                className="fixed bottom-16 md:bottom-20 left-0 right-0 px-4 z-50 pointer-events-none"
                                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                            >
                                <motion.div
                                    className={`mx-auto max-w-5xl shadow-2xl border rounded-2xl px-6 py-3 flex items-center gap-6 pointer-events-auto justify-center ${darkMode ? 'bg-[#1a1d24] border-gray-800' : 'bg-white border-gray-200'}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.18, ease: 'easeOut', delay: 0.02 }}
                                >
                                    <div className="flex items-center gap-5 text-sm text-gray-600 flex-wrap md:flex-nowrap justify-center w-full">
                                        <div className="flex items-center gap-5 flex-wrap md:flex-nowrap justify-center">
                                            <button className="flex items-center gap-2 hover:text-gray-900 whitespace-nowrap text-gray-700" onClick={handleDuplicateSelected}>
                                                <Copy size={18} className="text-gray-700" /> <span>Duplicate</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-gray-900 whitespace-nowrap text-gray-700">
                                                <Download size={18} className="text-gray-700" /> <span>Export</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-gray-900 whitespace-nowrap text-gray-700">
                                                <ArchiveIcon size={18} className="text-gray-700" /> <span>Archive</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-gray-900 whitespace-nowrap text-gray-700" onClick={handleDeleteSelectedClick}>
                                                <Trash2 size={18} className="text-gray-700" /> <span>Delete</span>
                                            </button>
                                            <button className="flex items-center gap-2 text-gray-400 cursor-not-allowed whitespace-nowrap" disabled>
                                                <MoveRight size={18} className="text-gray-400" /> <span>Convert</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-gray-900 whitespace-nowrap text-gray-700">
                                                <MoveRight size={18} className="text-gray-700" /> <span>Move to</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-gray-900 whitespace-nowrap text-gray-700">
                                                <Star size={18} className="text-gray-700" /> <span>Sidekick</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-gray-900 whitespace-nowrap text-gray-700">
                                                <Box size={18} className="text-gray-700" /> <span>Apps</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-gray-900 whitespace-nowrap text-gray-700" onClick={clearAllSelections}>
                                                <X size={18} className="text-gray-700" /> <span>Clear</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom Floating AI Assistant Bar */}


                </main >
                {/* Context Menu */}
                {
                    contextMenu && (
                        <ColumnContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            onClose={() => setContextMenu(null)}
                            onAction={(action) => handleContextMenuAction(action, contextMenu.groupId, contextMenu.colId)}
                        />
                    )
                }
                {/* Portal Date Picker */}
                {
                    activeDatePicker && createPortal(
                        <>
                            <div
                                className="fixed inset-0 z-[9998] bg-transparent"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDatePicker(null);
                                }}
                            />
                            <div
                                className="fixed z-[10005]"
                                style={{
                                    top: activeDatePicker.rect.bottom + 8,
                                    left: activeDatePicker.rect.left + (activeDatePicker.rect.width / 2),
                                    transform: 'translateX(-50%)'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DatePicker
                                    date={activeDatePicker.date}
                                    onSelect={(date) => {
                                        activeDatePicker.onSelect(date);
                                        // Don't close immediately if you want to allow changing? Usually yes.
                                        // But the DatePicker component calls onClose.
                                        // We can just pass a wrapper.
                                    }}
                                    onClose={() => setActiveDatePicker(null)}
                                />
                            </div>
                        </>,
                        document.body
                    )
                }
                {/* Portal Column Menu */}
                {
                    activeColumnMenu && createPortal(
                        <>
                            <div
                                className="fixed inset-0 z-[9998] bg-transparent"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveColumnMenu(null);
                                }}
                            />
                            <div
                                className="fixed top-[100px] bottom-0 right-0 z-[10005]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ColumnMenu
                                    onClose={() => setActiveColumnMenu(null)}
                                    onSelect={(type, label, options, currency, config) => {
                                        if (activeColumnMenu) {
                                            addColumn(activeColumnMenu.groupId, type, label, options, currency, config);
                                        }
                                        setActiveColumnMenu(null);
                                    }}
                                    darkMode={darkMode}
                                />
                            </div>
                        </>,
                        document.body
                    )
                }

                {/* Portal Connection Menu */}
                {activeConnectionMenu && createPortal(
                    <div
                        className="fixed inset-0 z-[100] flex items-start justify-start"
                        onClick={() => setActiveConnectionMenu(null)}
                    >
                        <div
                            className="absolute bg-white rounded-lg shadow-xl border border-gray-200 w-64 p-2 animate-in fade-in zoom-in-95 duration-100"
                            style={{
                                top: Math.min(activeConnectionMenu.rect.bottom + 8, window.innerHeight - 300),
                                left: Math.max(8, Math.min(activeConnectionMenu.rect.left, window.innerWidth - 270))
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {activeConnectionMenu.config?.targetPath ? (
                                <div className="space-y-2">
                                    <div className="text-xs font-medium text-gray-500 uppercase px-2 mb-2">Connected Page</div>
                                    <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded-md">
                                        <Globe size={16} />
                                        <span className="font-medium text-sm">{activeConnectionMenu.config.targetName}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (activeConnectionMenu.config?.targetPath) {
                                                setActivePage(activeConnectionMenu.config.targetPath);
                                            }
                                            setActiveConnectionMenu(null);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Open Page <ArrowUpRight size={14} />
                                    </button>
                                    <div className="h-px bg-gray-100 my-2" />
                                    <button
                                        onClick={() => {
                                            // Allow re-selecting
                                            setActiveConnectionMenu(prev => prev ? { ...prev, config: undefined } : null);
                                        }}
                                        className="w-full text-left px-2 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded"
                                    >
                                        Change Connection...
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2 px-2 border-b pb-2">
                                        <h3 className="font-semibold text-gray-800 text-sm">Select Page to Connect</h3>
                                    </div>
                                    {[
                                        { name: 'Goals', path: 'goals' },
                                        { name: 'Reminders', path: 'reminders' },
                                        { name: 'Overview', path: 'overview' },
                                        { name: 'Tasks', path: 'tasks' },
                                        { name: 'Vault', path: 'vault' },
                                        { name: 'Teams', path: 'teams' },
                                        { name: 'Departments', path: 'departments' },
                                        { name: 'Private Rooms', path: 'rooms' },
                                        { name: 'Discussion', path: 'discussion' },
                                    ].map(page => (
                                        <button
                                            key={page.path}
                                            onClick={() => {
                                                if (activeConnectionMenu.taskId === 'DRAFT_TASK') {
                                                    // TODO: Implement draft task connection logic if needed
                                                    // For now just close menu to prevent crash
                                                    setActiveConnectionMenu(null);
                                                    return;
                                                }
                                                const config = { targetPath: page.path, targetName: page.name };
                                                updateTaskTextValue(activeConnectionMenu.groupId, activeConnectionMenu.taskId, activeConnectionMenu.colId, JSON.stringify(config));
                                                setActiveConnectionMenu(null);
                                            }}
                                            className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 flex items-center justify-between group transition-colors"
                                        >
                                            <span className="text-sm font-medium text-gray-700">{page.name}</span>
                                            <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}

                {/* Send to Reminder Modal */}
                {
                    showReminderModalGroupId && (
                        <SendToReminderModal
                            isOpen={!!showReminderModalGroupId}
                            onClose={() => setShowReminderModalGroupId(null)}
                            group={board.groups.find(g => g.id === showReminderModalGroupId)!}
                        />
                    )
                }
                {/* Send to Goals Modal */}
                {showGoalsModalGroupId && (
                    <SendToGoalsModal
                        isOpen={true}
                        onClose={() => setShowGoalsModalGroupId(null)}
                        group={board.groups.find(g => g.id === showGoalsModalGroupId)!}
                    />
                )}

                {/* Send to Task Board Modal */}
                {showTaskBoardModalGroupId && (
                    <SendToTaskBoardModal
                        isOpen={true}
                        onClose={() => setShowTaskBoardModalGroupId(null)}
                        group={board.groups.find(g => g.id === showTaskBoardModalGroupId)!}
                    />
                )}

                <ConfirmModal
                    isOpen={!!deleteConfirmation}
                    onClose={() => setDeleteConfirmation(null)}
                    onConfirm={confirmDelete}
                    title={
                        deleteConfirmation?.type === 'task' ? 'Delete Task' :
                            deleteConfirmation?.type === 'group' ? 'Delete Group' :
                                deleteConfirmation?.type === 'column' ? 'Delete Column' :
                                    'Delete Selected Tasks'
                    }
                    message={
                        deleteConfirmation?.type === 'task' ? 'Are you sure you want to delete this task? This action cannot be undone.' :
                            deleteConfirmation?.type === 'group' ? 'Are you sure you want to delete this group and all its tasks? This action cannot be undone.' :
                                deleteConfirmation?.type === 'column' ? 'Are you sure you want to delete this column? This action cannot be undone.' :
                                    `Are you sure you want to delete ${selectedCount} tasks? This action cannot be undone.`
                    }
                    confirmText="Delete"
                    variant="danger"
                />
            </div >
            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '1',
                        },
                    },
                })
            }}>
                {activeId ? (() => {
                    const task = board.groups.flatMap(g => g.tasks).find(t => t.id === activeId);
                    const group = board.groups.find(g => g.tasks.some(t => t.id === activeId));
                    if (!task || !group) return null;

                    return (
                        <div
                            className={`grid gap-px text-sm rounded cursor-grabbing shadow-2xl ring-2 ring-blue-500/20 z-50 transform scale-[1.01] ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-200'}`} // Removed /95 opacity
                            style={{
                                gridTemplateColumns: selectionColumnWidth + " " + group.columns.map(c => c.width).join(' ') + " " + actionColumnWidth,
                                width: '100%',
                            }}
                        >
                            <div className={`flex items-center justify-center py-1.5 border-r relative ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: group.color }}></div>
                                <div className="w-4 h-4 rounded border-gray-300" />
                            </div>

                            {group.columns.map((col) => {
                                const isName = col.type === 'name';
                                return (
                                    <div key={col.id} className={`relative border-r flex items-center ${isName ? 'justify-start pl-2' : 'justify-center'} min-h-[32px] overflow-hidden ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                                        {isName && (
                                            <>
                                                <div className="text-gray-400 mr-2 p-1">
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                                                </div>
                                                <div className={`font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                    {task.name}
                                                </div>
                                            </>
                                        )}
                                        {col.type === 'status' && (
                                            <div className="px-2 py-0.5 rounded text-white text-xs font-bold uppercase truncate" style={{ backgroundColor: STATUS_COLORS[task.status] }}>{task.status}</div>
                                        )}
                                        {col.type === 'priority' && (
                                            <div className="px-2 py-0.5 rounded text-white text-xs font-bold uppercase truncate" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}>{task.priority}</div>
                                        )}
                                        {col.type === 'person' && (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                                                    {PEOPLE.find(p => p.id === task.personId)?.name.charAt(0) || '?'}
                                                </div>
                                                <span className="text-xs truncate">{PEOPLE.find(p => p.id === task.personId)?.name}</span>
                                            </div>
                                        )}
                                        {col.type === 'date' && (
                                            <div className="text-xs text-gray-500 truncate">{task.dueDate || '-'}</div>
                                        )}
                                        {col.type === 'text' && (
                                            <div className="text-xs text-gray-500 truncate px-2">{task[col.id] || '-'}</div>
                                        )}
                                    </div>
                                );
                            })}
                            <div className="border-r border-transparent"></div>
                        </div>
                    );
                })() : null}
            </DragOverlay>
        </DndContext >
    );
});

export default TaskBoard;
