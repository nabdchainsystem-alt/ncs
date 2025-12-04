import React, { useState } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRoomBoardData } from '../features/rooms/hooks/useRoomBoardData';
import { Status, STATUS_COLORS, ITask, IGroup } from '../features/rooms/boardTypes';
import { Plus, MoreHorizontal, GripVertical } from 'lucide-react';

interface KanbanBoardProps {
    storageKey: string;
}

const KanbanColumn = ({ status, tasks, color }: { status: Status, tasks: ITask[], color: string }) => {
    const { setNodeRef } = useDroppable({
        id: status,
    });

    return (
        <div className="flex flex-col w-80 min-w-[320px] h-full bg-gray-50/50 rounded-xl border border-gray-200/60 flex-shrink-0">
            {/* Header */}
            <div className={`p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-gray-50/50 backdrop-blur-sm z-10 rounded-t-xl`}>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{status || 'No Status'}</h3>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">{tasks.length}</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={16} />
                </button>
            </div>

            {/* Content */}
            <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto custom-scroll space-y-3">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <KanbanCard key={task.id} task={task} />
                    ))}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                        Drop items here
                    </div>
                )}
            </div>
        </div>
    );
};

const KanbanCard = ({ task }: { task: ITask }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group relative`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{task.name}</div>
                <button className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal size={14} />
                </button>
            </div>

            <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                    {/* Person Avatar Placeholder */}
                    {task.personId ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold border border-white shadow-sm">
                            ID
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center border border-dashed border-gray-300">
                            <Plus size={12} />
                        </div>
                    )}
                </div>

                {task.priority && (
                    <div className={`text-[10px] px-2 py-0.5 rounded border ${task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                        {task.priority}
                    </div>
                )}
            </div>
        </div>
    );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ storageKey }) => {
    const { board, updateTask } = useRoomBoardData(storageKey);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // Flatten tasks for drag overlay
    const allTasks = board.groups.flatMap(g => g.tasks);
    const activeTask = activeId ? allTasks.find(t => t.id === activeId) : null;

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        // Find the task and its group
        let sourceGroup: IGroup | undefined;
        let task: ITask | undefined;

        for (const group of board.groups) {
            const found = group.tasks.find(t => t.id === taskId);
            if (found) {
                sourceGroup = group;
                task = found;
                break;
            }
        }

        if (!sourceGroup || !task) return;

        // Check if dropped on a column (status)
        if (Object.values(Status).includes(overId as Status)) {
            const newStatus = overId as Status;
            if (task.status !== newStatus) {
                updateTask(sourceGroup.id, taskId, { status: newStatus });
            }
        }
        // Logic for reordering within column could go here, but for now just status change
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Toolbar */}
            <div className="h-14 border-b border-gray-200 flex items-center px-6 justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-gray-800">Board</h2>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#7B61FF] transition-colors">
                        <span className="text-[#7B61FF]">Group by:</span> Status
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 bg-[#7B61FF] text-white rounded-md text-sm font-medium hover:bg-[#6a51e6] transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200">
                        <Plus size={16} /> New Task
                    </button>
                </div>
            </div>

            {/* Board Area */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    <div className="flex h-full gap-6">
                        {Object.values(Status).map(status => {
                            // Filter tasks for this status across all groups
                            const tasks = board.groups.flatMap(g => g.tasks).filter(t => t.status === status);
                            return (
                                <KanbanColumn
                                    key={status}
                                    status={status}
                                    tasks={tasks}
                                    color={STATUS_COLORS[status]}
                                />
                            );
                        })}
                    </div>
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <div className="bg-white p-4 rounded-lg shadow-xl border border-[#7B61FF] rotate-2 cursor-grabbing w-[300px]">
                            <div className="text-sm font-medium text-gray-800">{activeTask.name}</div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default KanbanBoard;
