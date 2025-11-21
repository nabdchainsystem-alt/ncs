import React, { useState } from 'react';
import { Task } from './types';
import { Status, STATUS_COLORS, Priority, PRIORITY_COLORS } from '../../types/shared';
import { MoreHorizontal, Plus, Flag, Calendar, KanbanSquare } from 'lucide-react';
import { useToast } from '../../ui/Toast';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragEndEvent,
    DragStartEvent,
    useDraggable,
    useDroppable,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';

interface TaskBoardViewProps {
    tasks: Task[];
    isLoading: boolean;
    onAddTask: () => void;
    onStatusChange: (taskId: string, newStatus: Status) => void;
}

// --- Draggable Task Component ---
const DraggableTask: React.FC<{ task: Task; onClick: () => void }> = ({ task, onClick }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
        data: { task },
    });

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                className="bg-gray-50 p-3 rounded-lg border-2 border-dashed border-gray-200 h-24 opacity-50"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-grab active:cursor-grabbing group relative select-none touch-none"
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="text-xs font-medium text-gray-400 hover:underline">
                    #{task.id.substring(5)}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal size={14} className="text-gray-400" />
                </div>
            </div>

            <h3 className="text-sm text-gray-800 font-medium mb-3 leading-snug group-hover:text-clickup-purple transition-colors">
                {task.title}
            </h3>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center space-x-2">
                    {task.priority !== Priority.None && (
                        <div className="p-0.5 rounded hover:bg-gray-100 transition-colors" title={`Priority: ${task.priority}`}>
                            <Flag
                                size={12}
                                fill={PRIORITY_COLORS[task.priority]}
                                color={PRIORITY_COLORS[task.priority]}
                            />
                        </div>
                    )}
                    {task.dueDate && (
                        <div className={`flex items-center text-[10px] px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100 ${new Date(task.dueDate) < new Date() ? 'text-red-500 border-red-100 bg-red-50' : 'text-gray-400'}`}>
                            <Calendar size={10} className="mr-1" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                </div>

                <div className="flex -space-x-1">
                    {task.assignees.map(u => (
                        <div
                            key={u.id}
                            className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[9px] text-white font-bold shadow-sm"
                            style={{ backgroundColor: u.color }}
                            title={u.name}
                        >
                            {u.avatar}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Droppable Column Component ---
const DroppableColumn: React.FC<{ status: Status; tasks: Task[]; isLoading: boolean; onAddTask: () => void; showToast: any }> = ({ status, tasks, isLoading, onAddTask, showToast }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    return (
        <div ref={setNodeRef} className={`flex-shrink-0 w-72 flex flex-col h-full animate-in fade-in duration-500 rounded-xl transition-colors ${isOver ? 'bg-indigo-50/50 ring-2 ring-indigo-100' : ''}`}>
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1 group">
                <div className="flex items-center space-x-2">
                    <span
                        className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white shadow-sm cursor-pointer hover:opacity-90"
                        style={{ backgroundColor: STATUS_COLORS[status] }}
                        onClick={() => showToast(`Status: ${status}`, 'info')}
                    >
                        {status}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{isLoading ? '...' : tasks.length}</span>
                </div>
                <div className="flex space-x-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={14} className="cursor-pointer hover:text-gray-600" onClick={onAddTask} />
                    <MoreHorizontal size={14} className="cursor-pointer hover:text-gray-600" onClick={() => showToast('Column Settings', 'info')} />
                </div>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 pb-10 custom-scrollbar">
                {isLoading ? (
                    <>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm h-28 animate-pulse"></div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm h-28 animate-pulse"></div>
                    </>
                ) : (
                    <>
                        {tasks.map(task => (
                            <DraggableTask
                                key={task.id}
                                task={task}
                                onClick={() => showToast(`Opening ${task.title}`, 'info')}
                            />
                        ))}
                        {/* Add Card Button */}
                        <button
                            className="w-full py-2 rounded-md border border-transparent hover:bg-gray-200/50 hover:border-gray-300 text-gray-400 text-sm flex items-center justify-center transition-all group"
                            onClick={onAddTask}
                        >
                            <Plus size={14} className="mr-1 group-hover:text-clickup-purple transition-colors" />
                            <span className="group-hover:text-clickup-purple transition-colors">New Task</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const TaskBoardView: React.FC<TaskBoardViewProps> = ({ tasks, isLoading, onAddTask, onStatusChange }) => {
    const { showToast } = useToast();
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required to start drag
            },
        })
    );

    const groupedTasks = Object.values(Status).reduce((acc, status) => {
        acc[status] = tasks.filter(t => t.status === status);
        return acc;
    }, {} as Record<Status, Task[]>);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = tasks.find(t => t.id === active.id);
        if (task) setActiveTask(task);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const newStatus = over.id as Status;
        const task = tasks.find(t => t.id === taskId);

        if (task && task.status !== newStatus) {
            onStatusChange(taskId, newStatus);
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

    if (!isLoading && tasks.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-clickup-light p-8 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 border border-dashed border-gray-300 shadow-sm">
                    <KanbanSquare size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Board is empty</h3>
                <p className="text-gray-500 max-w-sm mb-8 text-center">Visualise your workflow here. Start by creating a new task.</p>
                <button
                    onClick={onAddTask}
                    className="px-6 py-2 bg-clickup-purple text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors shadow-lg shadow-purple-200 flex items-center"
                >
                    <Plus size={18} className="mr-2" />
                    Create Task
                </button>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex-1 overflow-x-auto overflow-y-hidden bg-clickup-light p-6 custom-scrollbar h-full">
                <div className="flex h-full space-x-4">
                    {Object.entries(groupedTasks).map(([status, groupTasks]) => (
                        <DroppableColumn
                            key={status}
                            status={status as Status}
                            tasks={groupTasks}
                            isLoading={isLoading}
                            onAddTask={onAddTask}
                            showToast={showToast}
                        />
                    ))}
                    <div className="w-8 flex-shrink-0"></div>
                </div>
            </div>

            {createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeTask ? (
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xl w-72 cursor-grabbing rotate-2 opacity-90">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-xs font-medium text-gray-400">
                                    #{activeTask.id.substring(5)}
                                </div>
                            </div>
                            <h3 className="text-sm text-gray-800 font-medium mb-3 leading-snug">
                                {activeTask.title}
                            </h3>
                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center space-x-2">
                                    {activeTask.priority !== Priority.None && (
                                        <div className="p-0.5 rounded" title={`Priority: ${activeTask.priority}`}>
                                            <Flag
                                                size={12}
                                                fill={PRIORITY_COLORS[activeTask.priority]}
                                                color={PRIORITY_COLORS[activeTask.priority]}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
};

export default TaskBoardView;