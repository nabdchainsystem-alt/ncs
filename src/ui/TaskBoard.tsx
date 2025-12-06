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

interface SortableTaskRowProps {
    task: ITask;
    group: IGroup;
    selectionColumnWidth: string;
    actionColumnWidth: string;
    expandedTaskIds: Set<string>;
    toggleTaskSelection: (groupId: string, taskId: string, selected: boolean) => void;
    updateTask: (groupId: string, taskId: string, updates: Partial<ITask>) => void;
    updateTaskTextValue: (groupId: string, taskId: string, colId: string, value: string) => void;
    toggleSubtask: (taskId: string) => void;
    setActiveDatePicker: (data: any) => void;
    handleContextMenu: (e: React.MouseEvent, groupId: string, colId: string) => void;
    deleteTask: (groupId: string, taskId: string) => void;
    handleAddSubtask: (groupId: string, parentTaskId: string) => void;
    subtaskInput: Record<string, string>;
    setSubtaskInput: (input: Record<string, string>) => void;
    darkMode?: boolean;
    setActiveConnectionMenu: (data: { groupId: string, taskId: string, colId: string, rect: DOMRect, config?: { targetPath?: string, targetName?: string } }) => void;
}

const SortableTaskRow: React.FC<SortableTaskRowProps> = ({
    task,
    group,
    selectionColumnWidth,
    actionColumnWidth,
    expandedTaskIds,
    toggleTaskSelection,
    updateTask,
    updateTaskTextValue,
    toggleSubtask,
    setActiveDatePicker,
    handleContextMenu,
    deleteTask,
    handleAddSubtask,
    subtaskInput,
    setSubtaskInput,

    darkMode = false,
    setActiveConnectionMenu,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: 'TASK', task, group } });

    const style = {

        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1, // Hide original row completely while dragging
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative' as const,
        gridTemplateColumns: selectionColumnWidth + " " + group.columns.map(c => c.width).join(' ') + " " + actionColumnWidth
    };

    return (
        <React.Fragment >
            <div
                ref={setNodeRef}
                style={style}
                // {...attributes}  <-- Moved to handle
                className={`grid gap-px group/row text-sm transition-colors relative ${isDragging ? "z-50 shadow-xl ring-2 ring-blue-500/20" : ""} ${darkMode ? 'bg-[#1a1d24] hover:bg-white/5' : 'bg-white hover:bg-gray-50/50'}`}
            >
                <div className={`flex items-center justify-center py-1.5 border-r relative transition-colors sticky left-0 z-10 border-r-2 ${darkMode ? 'bg-[#1a1d24] border-gray-800 border-r-gray-800 group-hover/row:bg-white/5' : 'bg-white border-gray-100 border-r-gray-200/50 hover:bg-gray-50'}`}>
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: group.color }}></div>
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300"
                        checked={!!task.selected}
                        onChange={(e) => toggleTaskSelection(group.id, task.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                </div>

                {/* Render Cells based on Columns */}
                {group.columns.map((col) => {
                    const isName = col.type === 'name';

                    return (

                        <div key={col.id} className={`relative border-r flex items-center ${isName ? 'justify-start pl-2 sticky left-[50px] z-10 border-r-2' : 'justify-center'} min-h-[32px] transition-colors ${darkMode ? 'bg-[#1a1d24] border-gray-800 border-r-gray-800 group-hover/row:bg-white/5 text-gray-300' : 'bg-white border-gray-100 border-r-gray-200/50 group-hover/row:bg-[#f8f9fa]'}`}>

                            {isName && (
                                <div className="cursor-grab active:cursor-grabbing text-gray-300 mr-2 opacity-0 group-hover/row:opacity-100 hover:text-gray-500 p-1" {...listeners} {...attributes} style={{ touchAction: 'none' }}>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                                </div>
                            )}

                            {col.type === 'name' && (
                                <div className="flex items-center w-full gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSubtask(task.id);
                                        }}
                                        className="p-0.5 hover:bg-gray-200 rounded text-gray-400 transition-colors"
                                    >
                                        {expandedTaskIds.has(task.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    <input
                                        value={task.name}
                                        onChange={(e) => updateTask(group.id, task.id, { name: e.target.value })}
                                        className={`w-full px-2 py-1.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                                    />
                                    <div className="text-xs text-gray-400 mr-2">
                                        {task.subtasks?.length ? `${task.subtasks.length} subtasks` : ''}
                                    </div>
                                </div>
                            )}


                            {col.type === 'status' ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <StatusCell
                                        status={col.id === 'col_status' ? task.status : (task.textValues[col.id] as Status || Status.New)}
                                        onChange={(s) => {
                                            if (col.id === 'col_status') {
                                                updateTask(group.id, task.id, { status: s });
                                            } else {
                                                updateTaskTextValue(group.id, task.id, col.id, s);
                                            }
                                        }}
                                        tabIndex={0}
                                        darkMode={darkMode}
                                    />
                                </div>
                            ) : col.type === 'priority' ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <PriorityCell
                                        priority={col.id === 'col_priority' ? task.priority : (task.textValues[col.id] as Priority || Priority.Normal)}
                                        onChange={(p) => {
                                            if (col.id === 'col_priority') {
                                                updateTask(group.id, task.id, { priority: p });
                                            } else {
                                                updateTaskTextValue(group.id, task.id, col.id, p);
                                            }
                                        }}
                                        tabIndex={0}
                                        darkMode={darkMode}
                                    />
                                </div>
                            ) : col.type === 'person' ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <PersonCell
                                        personId={col.id === 'col_person' ? task.personId : (task.textValues[col.id] || null)}
                                        onChange={(pid) => {
                                            if (col.id === 'col_person') {
                                                updateTask(group.id, task.id, { personId: pid });
                                            } else {
                                                updateTaskTextValue(group.id, task.id, col.id, pid || '');
                                            }
                                        }}
                                        tabIndex={0}
                                        darkMode={darkMode}
                                    />
                                </div>
                            ) : col.type === 'date' ? (
                                <div
                                    className="w-full h-full relative flex items-center justify-center"
                                >
                                    <div
                                        className={`text-xs font-medium px-2 py-1 rounded transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer ${darkMode ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const isPrimary = col.id === 'col_date';
                                            const currentValue = isPrimary ? (task.dueDate || '') : (task.textValues[col.id] || '');

                                            setActiveDatePicker({
                                                taskId: task.id,
                                                colId: col.id,
                                                date: currentValue,
                                                rect,
                                                onSelect: (dateStr: string) => {
                                                    if (isPrimary) {
                                                        updateTask(group.id, task.id, { dueDate: dateStr });
                                                    } else {
                                                        updateTaskTextValue(group.id, task.id, col.id, dateStr);
                                                    }
                                                }
                                            });
                                        }}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const isPrimary = col.id === 'col_date';
                                                const currentValue = isPrimary ? (task.dueDate || '') : (task.textValues[col.id] || '');

                                                setActiveDatePicker({
                                                    taskId: task.id,
                                                    colId: col.id,
                                                    date: currentValue,
                                                    rect,
                                                    onSelect: (dateStr: string) => {
                                                        if (isPrimary) {
                                                            updateTask(group.id, task.id, { dueDate: dateStr });
                                                        } else {
                                                            updateTaskTextValue(group.id, task.id, col.id, dateStr);
                                                        }
                                                    }
                                                });
                                            }
                                        }}
                                    >
                                        {(() => {
                                            const isPrimary = col.id === 'col_date';
                                            const val = isPrimary ? task.dueDate : task.textValues[col.id];
                                            return val ? new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : <span className="text-gray-300">Set Date</span>;
                                        })()}
                                    </div>
                                </div>
                            ) : null}

                            {col.type === 'checkbox' && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={task.textValues[col.id] === 'true'}
                                        onChange={(e) => {
                                            updateTaskTextValue(group.id, task.id, col.id, e.target.checked ? 'true' : 'false');
                                        }}
                                        className={`w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer ${darkMode ? 'border-gray-600 bg-transparent' : 'border-gray-300'}`}
                                    />
                                </div>
                            )}

                            {col.type === 'money' && (
                                <div className="w-full h-full px-2 py-1.5 text-sm text-gray-700 flex items-center justify-end font-mono">
                                    {task.textValues[col.id] ? (
                                        <>
                                            <span className={`mr-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{col.currency || '$'}</span>
                                            <input
                                                type="text"
                                                value={task.textValues[col.id]}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                                    updateTaskTextValue(group.id, task.id, col.id, val);
                                                }}
                                                className="bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 w-full text-right"
                                                placeholder="0.00"
                                            />
                                        </>
                                    ) : (
                                        <input
                                            type="text"
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                                updateTaskTextValue(group.id, task.id, col.id, val);
                                            }}
                                            className={`bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 w-full text-right ${darkMode ? 'placeholder-gray-600 text-gray-300' : 'placeholder-gray-300 text-gray-700'}`}
                                            placeholder={col.currency || '$'}
                                        />
                                    )}
                                </div>
                            )}

                            {col.type === 'website' && (
                                <div className="w-full h-full px-2 py-1.5 flex items-center gap-2">
                                    <div className={`p-1 rounded ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                                        <Globe size={12} />
                                    </div>
                                    <input
                                        type="text"
                                        value={task.textValues[col.id] || ''}
                                        onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                        className={`w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 text-sm hover:underline cursor-text truncate ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                        placeholder="www.example.com"
                                    />
                                </div>
                            )}

                            {col.type === 'email' && (
                                <div className="w-full h-full px-2 py-1.5 flex items-center gap-2">
                                    <div className={`p-1 rounded ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-500'}`}>
                                        <Mail size={12} />
                                    </div>
                                    <input
                                        type="text"
                                        value={task.textValues[col.id] || ''}
                                        onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                        className={`w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                        placeholder="email@example.com"
                                    />
                                </div>
                            )}

                            {col.type === 'phone' && (
                                <div className="w-full h-full px-2 py-1.5 flex items-center gap-2">
                                    <div className={`p-1 rounded ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-500'}`}>
                                        <Phone size={12} />
                                    </div>
                                    <input
                                        type="text"
                                        value={task.textValues[col.id] || ''}
                                        onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                        className={`w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            )}

                            {col.type === 'location' && (
                                <div className="w-full h-full px-2 py-1.5 flex items-center gap-2">
                                    <div className={`p-1 rounded ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                        <MapPin size={12} />
                                    </div>
                                    <input
                                        type="text"
                                        value={task.textValues[col.id] || ''}
                                        onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                        className={`w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                        placeholder="Add location"
                                    />
                                </div>
                            )}

                            {col.type === 'rating' && (
                                <div className="w-full h-full flex items-center justify-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={14}
                                            className={`cursor-pointer transition-colors ${star <= (Number(task.textValues[col.id]) || 0) ? 'text-amber-400 fill-amber-400' : (darkMode ? 'text-gray-600' : 'text-gray-300')}`}
                                            onClick={() => updateTaskTextValue(group.id, task.id, col.id, star.toString())}
                                        />
                                    ))}
                                </div>
                            )}

                            {col.type === 'progress_manual' && (
                                <div className="w-full h-full px-2 py-1.5 flex items-center gap-2">
                                    <div className={`flex-1 h-2 rounded-full overflow-hidden relative group/progress cursor-pointer ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        <div
                                            className="h-full bg-green-500 transition-all duration-300"
                                            style={{ width: `${Number(task.textValues[col.id]) || 0}%` }}
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={Number(task.textValues[col.id]) || 0}
                                            onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <span className={`text-xs w-8 text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{Number(task.textValues[col.id]) || 0}%</span>
                                </div>
                            )}

                            {col.type === 'button' && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <button
                                        className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors active:scale-95"
                                        onClick={() => alert(`Action triggered for ${task.name}`)}
                                    >
                                        Click Me
                                    </button>
                                </div>
                            )}

                            {col.type === 'connection' && (
                                <div className="w-full h-full p-1 flex items-center justify-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            let config;
                                            try {
                                                const val = task.textValues[col.id];
                                                if (val) config = JSON.parse(val);
                                            } catch (e) { /* ignore */ }

                                            setActiveConnectionMenu({
                                                groupId: group.id,
                                                taskId: task.id,
                                                colId: col.id,
                                                rect,
                                                config
                                            });
                                        }}
                                        className={`w-full h-full text-xs font-semibold rounded transition-all flex items-center justify-center gap-1.5 px-2 group/btn ${(() => {
                                            let hasConfig = false;
                                            try {
                                                const val = task.textValues[col.id];
                                                if (val && JSON.parse(val).targetPath) hasConfig = true;
                                            } catch (e) { }
                                            return hasConfig;
                                        })() ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200'}`}
                                    >
                                        <Link2 size={12} className="group-hover/btn:scale-110 transition-transform" />
                                        <span className="truncate">{(() => {
                                            try {
                                                const val = task.textValues[col.id];
                                                if (val) {
                                                    const c = JSON.parse(val);
                                                    if (c.targetName) return `Go to ${c.targetName}`;
                                                }
                                            } catch (e) { }
                                            return 'Connect';
                                        })()}</span>
                                    </button>
                                </div>
                            )}

                            {col.type === 'text' && (
                                <input
                                    type="text"
                                    value={task.textValues[col.id] || ''}
                                    onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                    className={`w-full h-full text-center px-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                                    placeholder="-"
                                    tabIndex={0}
                                />
                            )}
                            {col.type === 'long_text' && (
                                <div className="w-full h-full p-1">
                                    <LongTextCell
                                        value={task.textValues[col.id] || ''}
                                        onChange={(val) => updateTaskTextValue(group.id, task.id, col.id, val)}
                                        tabIndex={0}
                                        darkMode={darkMode}
                                    />
                                </div>
                            )}
                            {col.type === 'dropdown' && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <DropdownCell
                                        options={col.options}
                                        value={task.textValues[col.id]}
                                        onChange={(val) => updateTaskTextValue(group.id, task.id, col.id, val)}
                                        tabIndex={0}
                                        darkMode={darkMode}
                                    />
                                </div>
                            )}
                            {col.type === 'number' && (
                                <input
                                    type="text"
                                    value={task.textValues[col.id] || ''}
                                    onChange={(e) => {
                                        // Allow only numbers and commas/dots
                                        const val = e.target.value;
                                        if (/^[0-9.,]*$/.test(val)) {
                                            updateTaskTextValue(group.id, task.id, col.id, val);
                                        }
                                    }}
                                    onBlur={(e) => {
                                        // Format on blur
                                        const val = e.target.value.replace(/,/g, '');
                                        if (val && !isNaN(Number(val))) {
                                            const formatted = Number(val).toLocaleString();
                                            updateTaskTextValue(group.id, task.id, col.id, formatted);
                                        }
                                    }}
                                    className="w-full h-full text-center px-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-gray-600 font-mono text-xs"
                                    placeholder="0"
                                    tabIndex={0}
                                />
                            )}
                        </div>
                    );
                })}

                {/* Delete Row Action */}
                <div className={`flex items-center justify-center border-l opacity-0 group-hover/row:opacity-100 transition-opacity ${darkMode ? 'border-gray-800 bg-[#0f1115]' : 'border-gray-100 bg-white'}`}>
                    <button
                        onClick={() => deleteTask(group.id, task.id)}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>

            {/* Subtasks Render */}
            {
                expandedTaskIds.has(task.id) && (
                    <div className="contents">
                        {/* Existing Subtasks */}
                        {task.subtasks?.map((subtask) => (
                            <div
                                key={subtask.id}
                                className={`grid gap-px group/subrow text-sm transition-colors relative ${darkMode ? 'bg-[#1a1d24]/50 hover:bg-white/5' : 'bg-gray-50/30 hover:bg-gray-50'}`}
                                style={{ gridTemplateColumns: selectionColumnWidth + " " + group.columns.map(c => c.width).join(' ') + " " + actionColumnWidth }}
                            >
                                {/* Selection Column Placeholder */}
                                <div className={`flex items-center justify-center py-1.5 border-r relative sticky left-0 z-10 border-r-2 ${darkMode ? 'bg-[#1a1d24]/50 border-gray-800 border-r-gray-800' : 'bg-gray-50/30 border-gray-100 border-r-gray-200/50'}`}>
                                    <div className="w-4 h-4" /> {/* Empty placeholder for checkbox */}
                                </div>

                                {/* Cells */}
                                {group.columns.map((col) => {
                                    const isName = col.type === 'name';
                                    return (
                                        <div key={`${subtask.id}-${col.id}`} className={`relative border-r flex items-center ${isName ? 'justify-start pl-8 sticky left-[50px] z-10 border-r-2' : 'justify-center'} min-h-[32px] transition-colors ${darkMode ? 'bg-[#1a1d24]/50 border-gray-800 border-r-gray-800 group-hover/subrow:bg-white/5 text-gray-400' : 'bg-gray-50/30 border-gray-100 border-r-gray-200/50 group-hover/subrow:bg-gray-100'}`}>
                                            {isName && <CornerDownRight size={14} className="text-gray-400 mr-2" />}
                                            {isName ? (
                                                <input
                                                    value={subtask.name}
                                                    onChange={(e) => {
                                                        const updatedSubtasks = task.subtasks?.map(st => st.id === subtask.id ? { ...st, name: e.target.value } : st);
                                                        updateTask(group.id, task.id, { subtasks: updatedSubtasks });
                                                    }}
                                                    className={`w-full px-2 py-1.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                                                />
                                            ) : (
                                                <div className="text-xs text-gray-400 italic">
                                                    -
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div className={`border-l ${darkMode ? 'bg-[#1a1d24]/50 border-gray-800' : 'bg-white border-gray-100'}`} />
                            </div>
                        ))}

                        {/* Add Subtask Row */}
                        <div className={`grid gap-px relative z-20 shadow-lg my-2 mx-4 rounded-lg border overflow-hidden animate-in slide-in-from-top-2 duration-200 ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-200'}`}
                            style={{ gridColumn: `1 / -1` }}
                        >
                            <div className={`flex items-center p-2 gap-3 ${darkMode ? 'bg-[#1a1d24]' : 'bg-white'}`}>
                                <div className={`w-5 h-5 rounded-full border-2 border-dashed animate-spin-slow ${darkMode ? 'border-gray-600' : 'border-gray-300'}`} />
                                <input
                                    autoFocus
                                    value={subtaskInput[task.id] || ''}
                                    onChange={(e) => setSubtaskInput({ ...subtaskInput, [task.id]: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddSubtask(group.id, task.id);
                                    }}
                                    placeholder="Task Name or type '/' for commands"
                                    className={`flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 bg-transparent ${darkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                                />
                                <div className={`flex items-center gap-1 border-l pl-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><Box size={16} /></button>
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><Sparkles size={16} /></button>
                                    <div className={`w-px h-4 mx-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><User size={16} /></button>
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><Clock size={16} /></button>
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><Flag size={16} /></button>
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><Tag size={16} /></button>
                                    <button className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}><Edit size={16} /></button>
                                    <div className={`w-px h-4 mx-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                                    <button
                                        onClick={() => toggleSubtask(task.id)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${darkMode ? 'text-gray-400 hover:bg-white/5 border-gray-700' : 'text-gray-600 hover:bg-gray-100 border-gray-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleAddSubtask(group.id, task.id)}
                                        className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm transition-colors flex items-center gap-1"
                                    >
                                        Save <CornerDownRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </React.Fragment >
    );
};


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

    const statusColorMap: Record<Status, string> = {
        [Status.Done]: '#33D995',
        [Status.Working]: '#FFBE66',
        [Status.Stuck]: '#FF7085',
        [Status.Pending]: '#FFD940',
        [Status.AlmostFinish]: '#C48AF0',
        [Status.New]: '#A0A5B9',
    };

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

    const resolveTaskStatus = (group: IGroup, task: ITask): Status => {
        const statusColId = group.columns.find(c => c.type === 'status')?.id;
        const rawStatus = task.status || (statusColId ? task.textValues?.[statusColId] : undefined);
        return normalizeStatus(rawStatus as string | undefined);
    };

    const calculateProgress = (group: IGroup, tasksOverride?: ITask[]) => {
        const allTasks = (tasksOverride ?? group.tasks).flatMap(t => [t, ...(t.subtasks || [])]);
        if (allTasks.length === 0) {
            return {
                counts: { done: 0, working: 0, stuck: 0, pending: 0, almostFinish: 0, new: 0 },
                weighted: 0,
                total: 0
            };
        }

        const counts = allTasks.reduce((acc, task) => {
            const status = resolveTaskStatus(group, task);
            acc[status === Status.Done ? 'done'
                : status === Status.Working ? 'working'
                    : status === Status.Stuck ? 'stuck'
                        : status === Status.Pending ? 'pending'
                            : status === Status.AlmostFinish ? 'almostFinish'
                                : 'new'] += 1;
            return acc;
        }, { done: 0, working: 0, stuck: 0, pending: 0, almostFinish: 0, new: 0 });

        const total = allTasks.length;
        const weighted = (
            counts.done * 1 +
            counts.almostFinish * 0.75 +
            counts.working * 0.5 +
            counts.pending * 0.25 +
            counts.new * 0.1 +
            counts.stuck * 0
        ) / total * 100;

        return {
            counts,
            weighted,
            total
        };
    };

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
                    {!minimal && (
                        <header className={`h-16 flex items-center justify-between px-8 flex-shrink-0 transition-colors ${transparent ? 'bg-transparent' : (darkMode ? 'bg-[#0f1115] border-b border-white/5' : 'bg-white')}`}>
                            <div>
                                <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>{board.name}</h1>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleAnalyzeBoard}
                                    disabled={isAiLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-full hover:shadow-md hover:scale-105 transition-all text-sm font-semibold border border-indigo-100">
                                    <SparklesIcon className="w-4 h-4" />
                                    {isAiLoading ? 'Thinking...' : 'Analyze Board'}
                                </button>
                                <button
                                    onClick={addGroup}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#1e2126] text-white rounded-md hover:bg-[#2c3036] transition text-sm font-medium shadow-sm">
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
                                    <div key={group.id} id={`group-${group.id}`} className={`relative flex flex-col w-full mb-10 shadow-sm border rounded-xl overflow-hidden transition-colors ${darkMode ? 'border-gray-800 bg-[#1a1d24]' : 'border-gray-200/60'}`}>

                                        {/* Group Header */}
                                        <div className={`flex items-center px-4 py-3 relative w-full border-b transition-colors ${darkMode ? 'bg-[#1a1d24] border-gray-800' : 'bg-white border-gray-200'}`}>
                                            <div className="flex items-center gap-3 pr-4">
                                                <div
                                                    className="cursor-pointer hover:bg-gray-100 p-1.5 rounded transition-colors group/menu relative"
                                                    onClick={() => toggleGroupCollapse(group.id)}
                                                >
                                                    <svg className={`w-4 h-4 text-gray-400 group-hover/menu:text-blue-500 transition-transform ${collapsedGroups.has(group.id) ? '-rotate-90' : 'rotate-0'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                </div>
                                                <input
                                                    value={group.title}
                                                    onChange={(e) => updateGroupTitle(group.id, e.target.value)}
                                                    className={`text-xl font-bold bg-transparent border border-transparent rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 w-full max-w-md transition-all ${darkMode ? 'hover:border-gray-700 focus:bg-[#0f1115]' : 'hover:border-gray-300 focus:bg-white'}`}
                                                    style={{ color: group.color }}
                                                />
                                                <div className="ml-4 flex items-center gap-2">
                                                    <div className="flex h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
                                                        {(['new', 'pending', 'working', 'almostFinish', 'done', 'stuck'] as const).map(key => {
                                                            const pct = progress.total === 0 ? 0 : (progress.counts as any)[key] / progress.total * 100;
                                                            if (pct <= 0) return null;
                                                            const color = key === 'new' ? statusColorMap[Status.New]
                                                                : key === 'pending' ? statusColorMap[Status.Pending]
                                                                    : key === 'working' ? statusColorMap[Status.Working]
                                                                        : key === 'almostFinish' ? statusColorMap[Status.AlmostFinish]
                                                                            : key === 'done' ? statusColorMap[Status.Done]
                                                                                : statusColorMap[Status.Stuck];
                                                            return <div key={key} className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />;
                                                        })}
                                                    </div>
                                                    <span className="text-xs text-gray-400 font-medium">{Math.round(progress.weighted)}%</span>
                                                </div>

                                            </div>
                                            <div className="flex-1" />
                                            {!minimal && (
                                                <div className="flex items-center gap-1 px-2">
                                                    <button
                                                        onClick={() => toggleGroupPin(group.id)}
                                                        className={"p-2 transition-colors rounded-md " + (group.isPinned ? 'text-blue-500 bg-blue-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100')}
                                                        title={group.isPinned ? "Unpin Group" : "Pin Group"}
                                                    >
                                                        <Pin className={"w-4 h-4 " + (group.isPinned ? 'fill-current' : '')} />
                                                    </button>

                                                    {/* Send to Reminder Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowReminderModalGroupId(group.id);
                                                        }}
                                                        className="p-2 transition-colors rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                                                        title="Send to Reminders"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                    </button>
                                                    {/* Send to Goals Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowGoalsModalGroupId(group.id);
                                                        }}
                                                        className="p-2 transition-colors rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                                                        title="Send to Goals"
                                                    >
                                                        <Target className="w-4 h-4" />
                                                    </button>

                                                    {/* Send to Tasks Board Button - Only show if NOT main board */}
                                                    {!isMainBoard && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowTaskBoardModalGroupId(group.id);
                                                            }}
                                                            className="p-2 transition-colors rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                                                            title="Send to Tasks Board"
                                                        >
                                                            <ListTodo className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDeleteGroupClick(group.id)} className="text-gray-400 hover:text-red-500 p-2 transition-colors hover:bg-red-50 rounded-md" title="Delete Group">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Scrollable Content */}
                                        {!collapsedGroups.has(group.id) && (
                                            <div className="overflow-x-auto w-full [&::-webkit-scrollbar]:hidden">

                                                {/* Columns Header */}
                                                <div className={`sticky top-0 z-[1] min-w-full w-fit transition-colors ${darkMode ? 'bg-[#1a1d24]' : 'bg-white'}`} style={{ boxShadow: '0 2px 5px -2px rgba(0,0,0,0.05)' }}>
                                                    <div className={`grid gap-px border-y text-xs font-semibold uppercase tracking-wide transition-colors ${darkMode ? 'bg-gray-800 border-gray-800 text-gray-400' : 'bg-gray-200 border-gray-200 text-gray-500'}`} style={{ gridTemplateColumns: selectionColumnWidth + " " + group.columns.map(c => c.width).join(' ') + " " + actionColumnWidth }}>
                                                        <div className={`flex items-center justify-center sticky left-0 z-20 border-r-2 transition-colors ${darkMode ? 'bg-[#1a1d24]/95 border-r-gray-800' : 'bg-gray-50/80 border-r-gray-200/50'}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded border-gray-300"
                                                                checked={allSelected}
                                                                ref={el => {
                                                                    if (el) el.indeterminate = someSelected && !allSelected;
                                                                }}
                                                                onChange={(e) => toggleGroupSelection(group.id, e.target.checked)}
                                                            />
                                                        </div>
                                                        {group.columns.map((col, index) => (
                                                            <div
                                                                key={col.id}
                                                                className={`relative group backdrop-blur-sm transition-colors ${col.type === 'name' ? `sticky left-[50px] z-20 border-r-2 ${darkMode ? 'border-r-gray-800' : 'border-r-gray-200/50'}` : 'cursor-grab active:cursor-grabbing'} ${darkMode ? 'bg-[#1a1d24]/95 hover:bg-white/5' : 'bg-gray-50/80 hover:bg-gray-100'}`}
                                                                onContextMenu={(e) => handleContextMenu(e, group.id, col.id)}
                                                                draggable={col.type !== 'name'}
                                                                onDragStart={(e) => handleColumnDragStart(e, group.id, col.id, index)}
                                                                onDragOver={(e) => handleColumnDragOver(e, index)}
                                                                onDrop={(e) => handleColumnDrop(e, group.id, index)}
                                                            >
                                                                <div className="flex items-center justify-between h-full">
                                                                    <input
                                                                        value={col.title}
                                                                        onChange={(e) => updateColumnTitle(group.id, col.id, e.target.value)}
                                                                        className={`w-full h-full bg-transparent px-3 py-2 text-center text-[11px] focus:outline-none border-b-2 border-transparent focus:border-blue-500 ${darkMode ? 'focus:bg-[#0f1115] focus:text-white text-gray-300' : 'focus:bg-white focus:text-gray-800'}`}
                                                                        style={{ textAlign: (col.type === 'name' || col.type === 'long_text') ? 'left' : 'center' }}
                                                                    />
                                                                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 hover:bg-gray-200 rounded"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setActiveColumnMenu(activeColumnMenu?.groupId === group.id ? null : { groupId: group.id, rect });
                                                                        }}
                                                                    >
                                                                        <MoreHorizontal size={14} className="text-gray-400" />
                                                                    </div>
                                                                    {/* Resize Handle */}
                                                                    <div
                                                                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400/50 z-30"
                                                                        onMouseDown={(e) => {
                                                                            e.stopPropagation();
                                                                            e.preventDefault();
                                                                            const currentWidth = parseInt(col.width.replace('px', '')) || 140;
                                                                            setResizingCol({
                                                                                groupId: group.id,
                                                                                colId: col.id,
                                                                                startX: e.clientX,
                                                                                startWidth: currentWidth
                                                                            });
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {/* Add Column Button Cell */}
                                                        <div className={`flex items-center justify-center relative group ${darkMode ? 'bg-[#1a1d24]/95' : 'bg-gray-50/80'}`}>
                                                            <div
                                                                className={"cursor-pointer w-6 h-6 rounded flex items-center justify-center transition-all duration-200 " + (activeColumnMenu?.groupId === group.id ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/50')}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    setActiveColumnMenu(activeColumnMenu?.groupId === group.id ? null : { groupId: group.id, rect });
                                                                }}
                                                                title="Add Column"
                                                            >
                                                                <PlusIcon className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Tasks List with Drag & Drop */}
                                                {/* Tasks List with Drag & Drop */}
                                                <div className={`divide-y relative z-0 min-w-full w-fit ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                                                    <SortableContext
                                                        items={filteredTasks.map(t => t.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {filteredTasks.map((task) => (
                                                            <SortableTaskRow
                                                                key={task.id}
                                                                task={task}
                                                                group={group}
                                                                selectionColumnWidth={selectionColumnWidth}
                                                                actionColumnWidth={actionColumnWidth}
                                                                expandedTaskIds={expandedTaskIds}
                                                                toggleTaskSelection={toggleTaskSelection}
                                                                updateTask={updateTask}
                                                                deleteTask={() => handleDeleteTaskClick(group.id, task.id)}
                                                                updateTaskTextValue={updateTaskTextValue}
                                                                toggleSubtask={toggleSubtask}
                                                                setActiveDatePicker={setActiveDatePicker}
                                                                handleContextMenu={handleContextMenu}
                                                                handleAddSubtask={handleAddSubtask}
                                                                subtaskInput={subtaskInput}
                                                                setSubtaskInput={setSubtaskInput}
                                                                darkMode={darkMode}
                                                                setActiveConnectionMenu={setActiveConnectionMenu}
                                                            />
                                                        ))}
                                                    </SortableContext>
                                                </div>

                                                {/* Add Task Bar */}
                                                <div className={`grid gap-px border-t group/add-row transition-colors min-w-full w-fit ${darkMode ? 'bg-[#1a1d24] border-gray-800 hover:bg-white/5' : 'bg-white border-gray-200 hover:bg-gray-50'}`} style={{ gridTemplateColumns: selectionColumnWidth + " " + group.columns.map(c => c.width).join(' ') + " " + actionColumnWidth }}>
                                                    <div className={`flex items-center justify-center border-r sticky left-0 z-10 border-r-2 transition-colors relative ${darkMode ? 'bg-[#1a1d24] border-gray-800 border-r-gray-800 group-hover/add-row:bg-white/5' : 'bg-white border-gray-100 border-r-gray-200/50 group-hover/add-row:bg-gray-50'}`}>
                                                        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: group.color }}></div>
                                                        <div className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center text-gray-300">
                                                            <Plus size={10} />
                                                        </div>
                                                    </div>
                                                    <div className={`flex items-center pl-2 py-2 border-r sticky left-[50px] z-10 border-r-2 transition-colors ${darkMode ? 'bg-[#1a1d24] border-gray-800 border-r-gray-800 group-hover/add-row:bg-white/5' : 'bg-white border-gray-100 border-r-gray-200/50 group-hover/add-row:bg-gray-50'}`}>
                                                        <input
                                                            type="text"
                                                            placeholder="+ Add task"
                                                            value={draftTasks[group.id]?.name || ''}
                                                            onChange={(e) => updateDraftTask(group.id, { name: e.target.value })}
                                                            className={`w-full bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 ${darkMode ? 'placeholder-gray-600 text-gray-200' : 'placeholder-gray-400 text-gray-700'}`}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleAddTask(group.id);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    {group.columns.slice(1).map(col => (
                                                        <div key={col.id} className={`border-r min-h-[32px] flex items-center justify-center ${darkMode ? 'bg-[#1a1d24] border-gray-800' : 'bg-white border-gray-100'}`}>
                                                            {col.type === 'status' ? (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <StatusCell
                                                                        status={col.id === 'col_status' ? (draftTasks[group.id]?.status || Status.New) : (draftTasks[group.id]?.textValues?.[col.id] as Status || Status.New)}
                                                                        onChange={(s) => {
                                                                            if (col.id === 'col_status') {
                                                                                updateDraftTask(group.id, { status: s });
                                                                            } else {
                                                                                updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: s } });
                                                                            }
                                                                        }}
                                                                        tabIndex={0}
                                                                        darkMode={darkMode}
                                                                    />
                                                                </div>
                                                            ) : col.type === 'priority' ? (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <PriorityCell
                                                                        priority={col.id === 'col_priority' ? (draftTasks[group.id]?.priority || Priority.Normal) : (draftTasks[group.id]?.textValues?.[col.id] as Priority || Priority.Normal)}
                                                                        onChange={(p) => {
                                                                            if (col.id === 'col_priority') {
                                                                                updateDraftTask(group.id, { priority: p });
                                                                            } else {
                                                                                updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: p } });
                                                                            }
                                                                        }}
                                                                        tabIndex={0}
                                                                        darkMode={darkMode}
                                                                    />
                                                                </div>
                                                            ) : col.type === 'person' ? (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <PersonCell
                                                                        personId={col.id === 'col_person' ? (draftTasks[group.id]?.personId || null) : (draftTasks[group.id]?.textValues?.[col.id] || null)}
                                                                        onChange={(pid) => {
                                                                            if (col.id === 'col_person') {
                                                                                updateDraftTask(group.id, { personId: pid });
                                                                            } else {
                                                                                updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: pid || '' } });
                                                                            }
                                                                        }}
                                                                        tabIndex={0}
                                                                        darkMode={darkMode}
                                                                    />
                                                                </div>
                                                            ) : col.type === 'button' ? (
                                                                <div className="w-full h-full p-1">
                                                                    <button className="w-full h-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors flex items-center justify-center">
                                                                        Action
                                                                    </button>
                                                                </div>
                                                            ) : col.type === 'connection' ? (
                                                                <div className="w-full h-full p-1 flex items-center justify-center">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setActiveConnectionMenu({
                                                                                groupId: group.id,
                                                                                taskId: 'DRAFT_TASK', // Placeholder, handled in menu if needed
                                                                                colId: col.id,
                                                                                rect,
                                                                                config: col.config
                                                                            });
                                                                        }}
                                                                        className={`w-full h-full text-xs font-semibold rounded transition-all flex items-center justify-center gap-1.5 px-2 group/btn ${col.config?.targetPath ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200'}`}
                                                                    >
                                                                        <Link2 size={12} className="group-hover/btn:scale-110 transition-transform" />
                                                                        <span className="truncate">{col.config?.targetName ? `Go to ${col.config.targetName}` : 'Connect'}</span>
                                                                    </button>
                                                                </div>
                                                            ) : col.type === 'date' ? (
                                                                <div className="w-full h-full relative flex items-center justify-center">
                                                                    <div
                                                                        className={`text-xs cursor-pointer font-medium px-2 py-1 rounded transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            const isPrimary = col.id === 'col_date';
                                                                            const currentValue = isPrimary ? (draftTasks[group.id]?.dueDate || '') : (draftTasks[group.id]?.textValues?.[col.id] || '');
                                                                            setActiveDatePicker({
                                                                                taskId: 'draft-' + group.id,
                                                                                colId: col.id,
                                                                                date: currentValue,
                                                                                rect,
                                                                                onSelect: (dateStr) => {
                                                                                    if (isPrimary) {
                                                                                        updateDraftTask(group.id, { dueDate: dateStr });
                                                                                    } else {
                                                                                        updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: dateStr } });
                                                                                    }
                                                                                }
                                                                            });
                                                                        }}
                                                                        tabIndex={0}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                e.preventDefault();
                                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                                const isPrimary = col.id === 'col_date';
                                                                                const currentValue = isPrimary ? (draftTasks[group.id]?.dueDate || '') : (draftTasks[group.id]?.textValues?.[col.id] || '');
                                                                                setActiveDatePicker({
                                                                                    taskId: 'draft-' + group.id,
                                                                                    colId: col.id,
                                                                                    date: currentValue,
                                                                                    rect,
                                                                                    onSelect: (dateStr) => {
                                                                                        if (isPrimary) {
                                                                                            updateDraftTask(group.id, { dueDate: dateStr });
                                                                                        } else {
                                                                                            updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: dateStr } });
                                                                                        }
                                                                                    }
                                                                                });
                                                                            }
                                                                        }}
                                                                    >
                                                                        {(() => {
                                                                            const isPrimary = col.id === 'col_date';
                                                                            const val = isPrimary ? draftTasks[group.id]?.dueDate : draftTasks[group.id]?.textValues?.[col.id];
                                                                            return val ? new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : <span className="text-gray-300">Set Date</span>;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            ) : col.type === 'text' ? (
                                                                <input
                                                                    type="text"
                                                                    value={draftTasks[group.id]?.textValues?.[col.id] || ''}
                                                                    onChange={(e) => updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: e.target.value } })}
                                                                    className="w-full h-full text-center px-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-gray-600"
                                                                    placeholder="-"
                                                                    tabIndex={0}
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(group.id)}
                                                                />
                                                            ) : col.type === 'number' ? (
                                                                <input
                                                                    type="text"
                                                                    value={draftTasks[group.id]?.textValues?.[col.id] || ''}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        if (/^[0-9.,]*$/.test(val)) {
                                                                            updateDraftTask(group.id, { textValues: { ...draftTasks[group.id]?.textValues, [col.id]: val } });
                                                                        }
                                                                    }}
                                                                    className="w-full h-full text-center px-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-gray-600 font-mono text-xs"
                                                                    placeholder="0"
                                                                    tabIndex={0}
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(group.id)}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full"></div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div className={`transition-colors ${darkMode ? 'bg-[#1a1d24] group-hover/add-row:bg-white/5' : 'bg-white group-hover/add-row:bg-gray-50'}`}></div>
                                                </div>



                                                {/* Group Summary Footer */}
                                                <div className={`grid gap-px border-t rounded-b-xl min-w-full w-fit ${darkMode ? 'bg-[#1a1d24] border-gray-800' : 'bg-white border-gray-200'}`} style={{ gridTemplateColumns: selectionColumnWidth + " " + group.columns.map(c => c.width).join(' ') + " " + actionColumnWidth }}>
                                                    <div className={`flex items-center justify-center border-r sticky left-0 z-10 border-r-2 ${darkMode ? 'bg-[#1a1d24] border-gray-800 border-r-gray-800' : 'bg-white border-gray-100 border-r-gray-200/50'}`}></div>
                                                    <div className={`flex items-center justify-center sticky left-[50px] z-10 border-t ${darkMode ? 'bg-[#1a1d24] border-gray-800' : 'bg-white border-gray-200'}`}>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider"></span>
                                                    </div>
                                                    {group.columns.slice(1).map(col => (
                                                        <div key={col.id} className={`border-r min-h-[32px] flex items-center justify-center px-2 ${darkMode ? 'bg-[#1a1d24] border-gray-800' : 'bg-white border-gray-100'}`}>
                                                            {col.type === 'status' && (
                                                                <div className="w-full h-4 flex rounded-sm overflow-hidden">
                                                                    {Object.values(Status).map(s => {
                                                                        const count = filteredTasks.filter(t => resolveTaskStatus(group, t) === s).length;
                                                                        if (count === 0) return null;
                                                                        const width = (count / Math.max(filteredTasks.length, 1)) * 100;
                                                                        return (
                                                                            <div key={s} style={{ width: width + "%" }} title={s + ": " + count} className={STATUS_COLORS[s] + " h-full hover:opacity-80 transition-opacity"} />
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                            {col.type === 'priority' && (
                                                                <div className="w-full h-4 flex rounded-sm overflow-hidden">
                                                                    {Object.values(Priority).map(p => {
                                                                        const count = group.tasks.filter(t => {
                                                                            const val = col.id === 'col_priority' ? t.priority : (t.textValues[col.id] as Priority);
                                                                            return val === p;
                                                                        }).length;
                                                                        if (count === 0) return null;
                                                                        const width = (count / group.tasks.length) * 100;
                                                                        return (
                                                                            <div key={p} style={{ width: width + "%" }} title={p + ": " + count} className={PRIORITY_COLORS[p] + " h-full hover:opacity-80 transition-opacity"} />
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                            {col.type === 'person' && (
                                                                (() => {
                                                                    const assignedCount = group.tasks.filter(t => {
                                                                        const val = col.id === 'col_owner' ? t.personId : t.textValues[col.id];
                                                                        return val && val.length > 0;
                                                                    }).length;
                                                                    if (assignedCount === 0) return null;
                                                                    return (
                                                                        <div className="flex flex-col items-center justify-center leading-none">
                                                                            <span className="text-sm text-gray-500 font-medium">{assignedCount}</span>
                                                                            <span className="text-[10px] text-gray-400">owners</span>
                                                                        </div>
                                                                    );
                                                                })()
                                                            )}
                                                            {col.type === 'money' && (
                                                                (() => {
                                                                    const sum = group.tasks.reduce((acc, t) => {
                                                                        const val = t.textValues[col.id]?.replace(/,/g, '');
                                                                        return acc + (Number(val) || 0);
                                                                    }, 0);
                                                                    return (
                                                                        <div className="flex flex-col items-center justify-center leading-none">
                                                                            <span className="text-xs text-gray-700 font-bold font-mono">
                                                                                {(col.currency || '$')} {sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-400">sum</span>
                                                                        </div>
                                                                    );
                                                                })()
                                                            )}
                                                            {col.type === 'checkbox' && (
                                                                (() => {
                                                                    const count = group.tasks.filter(t => t.textValues[col.id] === 'true').length;
                                                                    if (count === 0) return null;
                                                                    return (
                                                                        <div className="flex flex-col items-center justify-center leading-none">
                                                                            <span className="text-xs text-gray-700 font-bold font-mono">{count}</span>
                                                                            <span className="text-[10px] text-gray-400">checked</span>
                                                                        </div>
                                                                    );
                                                                })()
                                                            )}
                                                            {col.type === 'number' && (
                                                                (() => {
                                                                    const sum = group.tasks.reduce((acc, t) => {
                                                                        const val = t.textValues[col.id]?.replace(/,/g, '');
                                                                        return acc + (Number(val) || 0);
                                                                    }, 0);
                                                                    return (
                                                                        <div className="flex flex-col items-center justify-center leading-none">
                                                                            <span className="text-xs text-gray-700 font-bold font-mono">{sum.toLocaleString()}</span>
                                                                            <span className="text-[10px] text-gray-400">sum</span>
                                                                        </div>
                                                                    );
                                                                })()
                                                            )}
                                                            {(col.type === 'text' || col.type === 'long_text' || col.type === 'date' || col.type === 'dropdown' || col.type === 'name') && (
                                                                (() => {
                                                                    const count = group.tasks.filter(t => {
                                                                        if (col.type === 'name') return true; // Always count for name
                                                                        const val = t.textValues[col.id];
                                                                        return val && val.trim().length > 0;
                                                                    }).length;
                                                                    if (count === 0) return null;
                                                                    return (
                                                                        <div className="flex flex-col items-center justify-center leading-none">
                                                                            <span className="text-xs text-gray-700 font-bold font-mono">{count}</span>
                                                                            <span className="text-[10px] text-gray-400">count</span>
                                                                        </div>
                                                                    );
                                                                })()
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div className={`${darkMode ? 'bg-[#1a1d24]' : 'bg-white'}`}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
            <DragOverlay dropAnimation={defaultDropAnimationSideEffects({
                styles: {
                    active: {
                        opacity: '1',
                    },
                },
            })}>
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
                                                    {PEOPLE.find(p => p.id === task.owner)?.name.charAt(0) || '?'}
                                                </div>
                                                <span className="text-xs truncate">{PEOPLE.find(p => p.id === task.owner)?.name}</span>
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
