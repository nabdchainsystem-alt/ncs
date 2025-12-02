import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Check } from 'lucide-react';
import { IGroup, ITask, Priority, PRIORITY_COLORS } from '../features/space/boardTypes';
import { remindersService } from '../features/reminders/remindersService';

interface SendToReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: IGroup;
}

export const SendToReminderModal: React.FC<SendToReminderModalProps> = ({ isOpen, onClose, group }) => {
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

    if (!isOpen) return null;

    const toggleTask = (taskId: string) => {
        const newSelected = new Set(selectedTaskIds);
        if (newSelected.has(taskId)) {
            newSelected.delete(taskId);
        } else {
            newSelected.add(taskId);
        }
        setSelectedTaskIds(newSelected);
    };

    const handleSend = () => {
        const tasksToSend = group.tasks.filter(t => selectedTaskIds.has(t.id));

        if (tasksToSend.length === 0) return;

        // Create one parent reminder with subtasks
        remindersService.addReminder({
            title: group.title || 'Untitled Group',
            listId: 'inbox',
            priority: 'medium', // Default priority for the group container
            dueDate: undefined, // Could potentially find the earliest due date
            tags: [],
            completed: false,
            subtasks: tasksToSend.map(task => ({
                id: uuidv4(), // Generate a new ID for the subtask
                title: task.textValues['col_name'] || task.name || 'Untitled Task',
                completed: task.status === 'Done'
            }))
        });



        onClose();
        setSelectedTaskIds(new Set());
    };

    const toggleAll = () => {
        if (selectedTaskIds.size === group.tasks.length) {
            setSelectedTaskIds(new Set());
        } else {
            setSelectedTaskIds(new Set(group.tasks.map(t => t.id)));
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 ring-1 ring-black/5 flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Send to Reminders</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Select tasks from <span className="font-semibold text-gray-700">{group.title}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 text-gray-400 hover:text-gray-600 active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    {group.tasks.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                                <Check size={24} className="text-gray-300" />
                            </div>
                            <p className="font-medium">No tasks in this group</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3.5 border-b border-gray-200/80 w-[50px]">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedTaskIds.size === group.tasks.length && group.tasks.length > 0}
                                                onChange={toggleAll}
                                                className="rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                            />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/80">
                                        Task Name
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/80 text-center w-[120px]">
                                        Priority
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/80 w-[140px]">
                                        Due Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {group.tasks.map(task => {
                                    const isSelected = selectedTaskIds.has(task.id);
                                    const taskName = task.textValues['col_name'] || task.name || 'Untitled Task';

                                    return (
                                        <tr
                                            key={task.id}
                                            onClick={() => toggleTask(task.id)}
                                            className={`cursor-pointer transition-all duration-200 group ${isSelected ? 'bg-indigo-50/60' : 'hover:bg-gray-50/80'}`}
                                        >
                                            <td className="px-6 py-3.5 w-[50px]">
                                                <div className="flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleTask(task.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`text-sm font-medium truncate block max-w-[320px] transition-colors ${isSelected ? 'text-indigo-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                                    {taskName}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center w-[120px]">
                                                <div className="flex justify-center transform transition-transform group-hover:scale-105">
                                                    <span className={`text-[11px] px-2.5 py-1 rounded-full text-white font-semibold shadow-sm tracking-wide ${PRIORITY_COLORS[task.priority] || 'bg-gray-400'}`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 w-[140px]">
                                                <span className={`text-sm font-mono transition-colors ${task.dueDate ? 'text-gray-600' : 'text-gray-300'}`}>
                                                    {task.dueDate || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 backdrop-blur-sm flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-all duration-200 active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={selectedTaskIds.size === 0}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                    >
                        <Check size={16} strokeWidth={2.5} />
                        <span>Send Tasks</span>
                        {selectedTaskIds.size > 0 && (
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold ml-1">
                                {selectedTaskIds.size}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
