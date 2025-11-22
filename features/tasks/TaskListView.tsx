import React, { useState, useMemo } from 'react';
import { Task } from './types';
import { Status, STATUS_COLORS, PRIORITY_COLORS, Priority } from '../../types/shared';
import { CheckCircle2, ChevronDown, Plus, Flag, Calendar, User as UserIcon, MoreHorizontal, PlayCircle, GripVertical } from 'lucide-react';
import { useToast } from '../../ui/Toast';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    DropAnimation,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TaskListViewProps {
    tasks: Task[];
    isLoading: boolean;
    onStatusChange: (taskId: string, newStatus: Status) => void;
    onAddTask: () => void;
    onReorder?: (tasks: Task[]) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

const TaskSkeleton: React.FC = () => (
    <div className="flex items-center px-4 py-3 border-b border-gray-100 animate-pulse">
        <div className="w-4 h-4 bg-gray-200 rounded-sm mr-3"></div>
        <div className="flex-1 h-4 bg-gray-200 rounded mr-4"></div>
        <div className="w-32 h-4 bg-gray-200 rounded ml-2"></div>
        <div className="w-32 h-4 bg-gray-200 rounded ml-2"></div>
        <div className="w-24 h-4 bg-gray-200 rounded ml-2"></div>
        <div className="w-32 h-6 bg-gray-200 rounded ml-2"></div>
    </div>
);

interface SortableTaskRowProps {
    task: Task;
    onStatusChange: (taskId: string, newStatus: Status) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const SortableTaskRow: React.FC<SortableTaskRowProps> = ({ task, onStatusChange, onUpdateTask, showToast }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: 'Task', task } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);

    const handleSaveTitle = () => {
        if (editTitle.trim() !== task.title) {
            onUpdateTask?.(task.id, { title: editTitle });
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveTitle();
        } else if (e.key === 'Escape') {
            setEditTitle(task.title);
            setIsEditing(false);
        }
    };

    const cycleStatus = (e: React.MouseEvent) => {
        e.stopPropagation();
        const statusValues = Object.values(Status);
        const currentIndex = statusValues.indexOf(task.status);
        const nextStatus = statusValues[(currentIndex + 1) % statusValues.length];
        onStatusChange(task.id, nextStatus);
        showToast(`Status changed to ${nextStatus}`, 'success');
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 bg-gray-50 border border-dashed border-gray-300 h-10 rounded my-1"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={twMerge(
                "group flex items-center px-4 py-1.5 border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm bg-white",
                isDragging && "z-50 shadow-xl"
            )}
        >
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="mr-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={14} />
            </div>

            {/* Title Column */}
            <div className="flex-1 flex items-center min-w-0 pr-4">
                <div className="mr-3 relative flex-shrink-0">
                    <div
                        className="w-4 h-4 rounded-sm border border-gray-300 hover:border-gray-500 transition-colors flex items-center justify-center cursor-pointer hover:bg-gray-100"
                        onClick={(e) => { e.stopPropagation(); showToast(`Marked ${task.id} complete`, 'success'); }}
                    >
                        <CheckCircle2 size={12} className="opacity-0 group-hover:opacity-100 text-gray-700" />
                    </div>
                </div>

                {isEditing ? (
                    <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-white border border-clickup-purple rounded px-1 py-0.5 outline-none text-sm text-gray-900"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span
                        className="truncate text-gray-700 cursor-text hover:text-clickup-purple font-medium"
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                    >
                        {task.title}
                    </span>
                )}

                {/* Hover Actions */}
                <div className="ml-2 opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                    <button
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-black transition-colors"
                        onClick={(e) => { e.stopPropagation(); showToast('Timer started', 'success'); }}
                    >
                        <PlayCircle size={12} />
                    </button>
                </div>
            </div>

            {/* Assignee Column */}
            <div
                className="w-32 flex items-center pl-2 cursor-pointer min-h-[24px]"
                onClick={() => showToast('Assign People', 'info')}
            >
                {task.assignees.length > 0 ? (
                    <div className="flex -space-x-1 hover:space-x-0.5 transition-all">
                        {task.assignees.map(u => (
                            <div
                                key={u.id}
                                className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm"
                                style={{ backgroundColor: u.color }}
                                title={u.name}
                            >
                                {u.avatar}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-full border border-gray-300 border-dashed flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 hover:border-clickup-purple hover:text-clickup-purple transition-all">
                        <UserIcon size={12} />
                    </div>
                )}
            </div>

            {/* Due Date Column */}
            <div
                className="w-32 pl-2 text-xs text-gray-400 flex items-center group-hover:text-gray-600 cursor-pointer min-h-[24px]"
                onClick={() => showToast('Open Date Picker', 'info')}
            >
                {task.dueDate ? (
                    <span className={new Date(task.dueDate) < new Date() ? 'text-red-500' : ''}>
                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                ) : (
                    <Calendar size={14} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black transition-colors" />
                )}
            </div>

            {/* Priority Column */}
            <div
                className="w-24 pl-2 cursor-pointer min-h-[24px] flex items-center"
                onClick={() => showToast('Change Priority', 'info')}
            >
                <div className="flex items-center group/priority">
                    <Flag
                        size={14}
                        fill={task.priority === Priority.None ? 'none' : PRIORITY_COLORS[task.priority]}
                        color={task.priority === Priority.None ? '#d1d5db' : PRIORITY_COLORS[task.priority]}
                        className="transition-colors"
                    />
                    <span className={`ml-1.5 text-xs ${task.priority === Priority.None ? 'text-gray-400 opacity-0 group-hover:opacity-100' : 'text-gray-500'} transition-opacity`}>
                        {task.priority}
                    </span>
                </div>
            </div>

            {/* Status Column */}
            <div className="w-32 pl-2">
                <button
                    className="px-2 py-0.5 text-[10px] uppercase font-bold text-white rounded-sm truncate max-w-full transition-all hover:scale-105 hover:opacity-90 shadow-sm"
                    style={{ backgroundColor: STATUS_COLORS[task.status] }}
                    onClick={cycleStatus}
                >
                    {task.status}
                </button>
            </div>
        </div>
    );
};

const TaskListView: React.FC<TaskListViewProps> = ({ tasks, isLoading, onStatusChange, onAddTask, onReorder, onUpdateTask }) => {
    const { showToast } = useToast();
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Group tasks by status
    const groupedTasks = useMemo(() => {
        const groups = Object.values(Status).reduce((acc, status) => {
            acc[status] = tasks.filter(t => t.status === status).sort((a, b) => (a.order || 0) - (b.order || 0));
            return acc;
        }, {} as Record<Status, Task[]>);
        return groups;
    }, [tasks]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeTask = tasks.find(t => t.id === active.id);
        const overTask = tasks.find(t => t.id === over.id);

        if (!activeTask) return;

        // If dragging over a different group (status)
        if (overTask && activeTask.status !== overTask.status) {
            // We could optimistically update here, but for simplicity we'll wait for drop
            // Or we can implement a visual indicator
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeTask = tasks.find(t => t.id === active.id);
        const overTask = tasks.find(t => t.id === over.id);

        if (!activeTask) return;

        // Dropped on a task
        if (overTask) {
            if (activeTask.status !== overTask.status) {
                // Changed status
                onStatusChange(activeTask.id, overTask.status);
            } else if (active.id !== over.id) {
                // Reordered within same status
                // Calculate new order
                // For now, we'll just trigger a reorder callback if we had the logic
                // Since we don't have full reorder logic in App.tsx yet, we'll just swap locally or ignore
                // But to make it "ClickUp like", we should support it.
                // Let's assume onReorder handles the array reordering.

                // Simple array move logic
                const oldIndex = tasks.findIndex(t => t.id === active.id);
                const newIndex = tasks.findIndex(t => t.id === over.id);

                // Create new array
                const newTasks = [...tasks];
                const [movedTask] = newTasks.splice(oldIndex, 1);
                newTasks.splice(newIndex, 0, movedTask);

                onReorder?.(newTasks);
            }
        } else {
            // Dropped on a container/group?
            // If we had droppable containers for empty statuses, we'd handle it here.
            // For now, we only have sortable items.
        }
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    if (isLoading) {
        return (
            <div className="flex-1 overflow-y-auto bg-white custom-scrollbar p-4">
                {[1, 2, 3, 4, 5].map(i => <TaskSkeleton key={i} />)}
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white text-center p-8 animate-in fade-in duration-500">
                {/* Empty state content */}
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-dashed border-gray-200">
                    <Plus size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No tasks found</h3>
                <button onClick={onAddTask} className="px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition-colors shadow-md flex items-center">
                    <Plus size={18} className="mr-2" /> Create Task
                </button>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex-1 overflow-y-auto bg-white custom-scrollbar h-full">
                <div className="min-w-[800px] pb-10">
                    {/* Table Header */}
                    <div className="flex items-center px-8 py-2 border-b border-gray-200 text-xs font-semibold text-gray-400 sticky top-0 bg-white z-20 select-none shadow-sm">
                        <div className="w-6 mr-2"></div> {/* Grip placeholder */}
                        <div className="flex-1">NAME</div>
                        <div className="w-32 pl-2">ASSIGNEE</div>
                        <div className="w-32 pl-2">DUE DATE</div>
                        <div className="w-24 pl-2">PRIORITY</div>
                        <div className="w-32 pl-2">STATUS</div>
                    </div>

                    {(Object.entries(groupedTasks) as [string, Task[]][]).map(([status, groupTasks]) => (
                        <div key={status} className="mb-2">
                            {/* Group Header */}
                            <div className="group sticky top-[33px] z-10 bg-white/95 backdrop-blur-sm flex items-center px-4 py-2 mt-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
                                <ChevronDown size={14} className="mr-2 text-gray-400 group-hover:text-gray-600" />
                                <span
                                    className="px-2 py-0.5 rounded text-white text-xs uppercase font-bold mr-2 shadow-sm"
                                    style={{ backgroundColor: STATUS_COLORS[status as Status] }}
                                >
                                    {status}
                                </span>
                                <span className="text-gray-400 text-xs font-normal ml-1">{groupTasks.length} tasks</span>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center space-x-2 transition-opacity">
                                    <Plus size={14} className="text-gray-500 hover:text-black" onClick={(e) => { e.stopPropagation(); onAddTask(); }} />
                                    <MoreHorizontal size={14} className="text-gray-400 hover:text-gray-600" onClick={(e) => { e.stopPropagation(); showToast('Group Settings', 'info'); }} />
                                </div>
                            </div>

                            {/* Tasks Rows */}
                            <SortableContext items={groupTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                <div className="flex flex-col">
                                    {groupTasks.map(task => (
                                        <SortableTaskRow
                                            key={task.id}
                                            task={task}
                                            onStatusChange={onStatusChange}
                                            onUpdateTask={onUpdateTask}
                                            showToast={showToast}
                                        />
                                    ))}
                                </div>
                            </SortableContext>

                            {/* Add Task Row */}
                            <div
                                className="flex items-center px-4 py-2 border-b border-transparent hover:bg-gray-50 group cursor-pointer transition-colors ml-8"
                                onClick={onAddTask}
                            >
                                <div className="mr-3 w-4 h-4 flex items-center justify-center">
                                    <Plus size={14} className="text-gray-400 group-hover:text-black transition-colors" />
                                </div>
                                <span className="text-sm text-gray-400 group-hover:text-gray-600 italic">
                                    + New Task...
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeId ? (
                    <div className="bg-white shadow-2xl border border-clickup-purple/20 rounded p-2 opacity-90">
                        {/* Simplified drag preview */}
                        <div className="flex items-center text-sm font-medium text-gray-700">
                            <GripVertical size={14} className="mr-2 text-clickup-purple" />
                            {tasks.find(t => t.id === activeId)?.title}
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default TaskListView;
