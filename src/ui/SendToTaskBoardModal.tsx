import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Check, ListTodo } from 'lucide-react';
import { IGroup, PRIORITY_COLORS, INITIAL_DATA, IBoard } from '../features/rooms/boardTypes';
import { authService } from '../services/auth';

import { useToast } from './Toast';
import { useQuickAction } from '../hooks/useQuickAction';

interface SendToTaskBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: IGroup;
    darkMode?: boolean;
}

export const SendToTaskBoardModal: React.FC<SendToTaskBoardModalProps> = ({ isOpen, onClose, group, darkMode }) => {

    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
    const user = authService.getCurrentUser();
    const targetStorageKey = user ? `taskboard-${user.id}` : 'taskboard-default';
    const { showToast } = useToast();


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

        try {
            // Read current target board state directly from localStorage
            const saved = localStorage.getItem(targetStorageKey);
            let targetBoard: IBoard;

            if (saved) {
                targetBoard = JSON.parse(saved);
                // Basic validation/migration if needed (simplified)
                if (!targetBoard.groups) {
                    targetBoard = { ...INITIAL_DATA, ...targetBoard };
                }
            } else {
                targetBoard = INITIAL_DATA;
            }

            // Create a new group in the target board with the selected tasks
            const newGroup: IGroup = {
                id: uuidv4(),
                title: group.title || 'Imported Group',
                color: group.color,
                columns: [...group.columns], // Preserve the column structure
                tasks: tasksToSend.map(t => ({ ...t, id: uuidv4() })),
                isPinned: false
            };

            // Update the board
            const updatedBoard = {
                ...targetBoard,
                groups: [newGroup, ...(targetBoard.groups || [])]
            };

            // Write back to localStorage immediately
            localStorage.setItem(targetStorageKey, JSON.stringify(updatedBoard));

            showToast(`Successfully sent ${tasksToSend.length} tasks to your Tasks Board`, 'success');
            onClose();
            setSelectedTaskIds(new Set());

        } catch (error) {
            console.error('Failed to send tasks:', error);
            showToast('Failed to send tasks. Please try again.', 'error');
        }
    };

    const toggleAll = () => {
        if (selectedTaskIds.size === group.tasks.length) {
            setSelectedTaskIds(new Set());
        } else {
            setSelectedTaskIds(new Set(group.tasks.map(t => t.id)));
        }
    };


    const { ref, setIsActive } = useQuickAction<HTMLDivElement>({
        onConfirm: handleSend,
        onCancel: onClose,
        initialActive: isOpen
    });

    useEffect(() => {
        setIsActive(isOpen);
    }, [isOpen, setIsActive]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div ref={ref} className={`backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border ring-1 ring-black/5 flex flex-col max-h-[85vh] ${darkMode ? 'bg-[#1a1d24]/95 border-gray-700' : 'bg-white/95 border-white/20'}`}>

                {/* Header */}
                <div className={`px-6 py-5 border-b flex items-center justify-between ${darkMode ? 'border-gray-700 bg-gradient-to-r from-gray-800/50 to-[#1a1d24]' : 'border-gray-100 bg-gradient-to-r from-gray-50/50 to-white'}`}>
                    <div>
                        <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            <ListTodo className="text-blue-600" size={24} />
                            Send to Tasks Board
                        </h2>
                        <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Select tasks from <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{group.title}</span> to copy to your personal Tasks.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-all duration-200 active:scale-95 ${darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    {group.tasks.length === 0 ? (
                        <div className={`text-center py-16 flex flex-col items-center gap-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <Check size={24} className={`${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                            </div>
                            <p className="font-medium">No tasks in this group</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className={`backdrop-blur-md sticky top-0 z-10 shadow-sm ${darkMode ? 'bg-gray-800/80' : 'bg-gray-50/80'}`}>
                                <tr>
                                    <th className={`px-6 py-3.5 border-b w-[50px] ${darkMode ? 'border-gray-700/80' : 'border-gray-200/80'}`}>
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedTaskIds.size === group.tasks.length && group.tasks.length > 0}
                                                onChange={toggleAll}
                                                className={`rounded-md focus:ring-indigo-500/20 transition-all cursor-pointer ${darkMode ? 'bg-gray-700 border-gray-600 text-indigo-500' : 'border-gray-300 text-indigo-600'}`}
                                            />
                                        </div>
                                    </th>
                                    <th className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b ${darkMode ? 'text-gray-400 border-gray-700/80' : 'text-gray-500 border-gray-200/80'}`}>
                                        Task Name
                                    </th>
                                    <th className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b text-center w-[120px] ${darkMode ? 'text-gray-400 border-gray-700/80' : 'text-gray-500 border-gray-200/80'}`}>
                                        Priority
                                    </th>
                                    <th className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b w-[140px] ${darkMode ? 'text-gray-400 border-gray-700/80' : 'text-gray-500 border-gray-200/80'}`}>
                                        Due Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                                {group.tasks.map(task => {
                                    const isSelected = selectedTaskIds.has(task.id);
                                    const taskName = task.textValues['col_name'] || task.name || 'Untitled Task';

                                    return (
                                        <tr
                                            key={task.id}
                                            onClick={() => toggleTask(task.id)}
                                            className={`cursor-pointer transition-all duration-200 group ${isSelected ? (darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50/60') : (darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50/80')}`}
                                        >
                                            <td className="px-6 py-3.5 w-[50px]">
                                                <div className="flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleTask(task.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`rounded-md focus:ring-indigo-500/20 transition-all cursor-pointer ${darkMode ? 'bg-gray-700 border-gray-600 text-indigo-500' : 'border-gray-300 text-indigo-600'}`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`text-sm font-medium truncate block max-w-[320px] transition-colors ${isSelected ? (darkMode ? 'text-indigo-300' : 'text-indigo-900') : (darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900')}`}>
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
                                                <span className={`text-sm font-mono transition-colors ${task.dueDate ? (darkMode ? 'text-gray-400' : 'text-gray-600') : (darkMode ? 'text-gray-600' : 'text-gray-300')}`}>
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
                <div className={`px-6 py-4 border-t backdrop-blur-sm flex justify-end gap-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                    <button
                        onClick={onClose}
                        className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'}`}
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
