import React, { useState } from 'react';
import { X, Search, Filter, ArrowUpDown } from 'lucide-react';
import { AggregatedTask } from '../hooks/useAllTasks';
import { Status, Priority, STATUS_COLORS, PRIORITY_COLORS } from '../../rooms/boardTypes';
import { format } from 'date-fns';

interface AllTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: AggregatedTask[];
}

export const AllTasksModal: React.FC<AllTasksModalProps> = ({ isOpen, onClose, tasks }) => {
    const [search, setSearch] = useState('');
    const [filterSource, setFilterSource] = useState<string | 'all'>('all');

    if (!isOpen) return null;

    const sources = Array.from(new Set(tasks.map(t => t.source)));

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.name.toLowerCase().includes(search.toLowerCase()) ||
            task.source.toLowerCase().includes(search.toLowerCase());
        const matchesSource = filterSource === 'all' || task.source === filterSource;
        return matchesSearch && matchesSource;
    });

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">All Tasks</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {tasks.length} tasks across {sources.length} sources
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex gap-4 shrink-0">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setFilterSource('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filterSource === 'all'
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            All Sources
                        </button>
                        {sources.map(source => (
                            <button
                                key={source}
                                onClick={() => setFilterSource(source)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filterSource === source
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {source}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">
                    <div className="col-span-6 pl-2">Task Name</div>
                    <div className="col-span-2">Source</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Priority</div>
                </div>

                {/* Task List */}
                <div className="overflow-y-auto flex-1 p-0">
                    {filteredTasks.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {filteredTasks.map(task => (
                                <div key={task.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center group cursor-default">
                                    <div className="col-span-6 font-medium text-gray-900 truncate pl-2 group-hover:text-blue-600 transition-colors">
                                        {task.name}
                                    </div>
                                    <div className="col-span-2">
                                        <span
                                            className="px-2 py-1 rounded-md text-[10px] font-bold border"
                                            style={{
                                                backgroundColor: task.roomColor ? `${task.roomColor}15` : '#EFF6FF',
                                                borderColor: task.roomColor ? `${task.roomColor}30` : '#DBEAFE',
                                                color: task.roomColor || '#3B82F6'
                                            }}
                                        >
                                            {task.source}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <div className={`px-2 py-1 rounded text-xs font-medium w-fit text-white ${STATUS_COLORS[task.status] || 'bg-gray-400'}`}>
                                            {task.status}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className={`px-2 py-1 rounded text-xs font-medium w-fit text-white ${PRIORITY_COLORS[task.priority] || 'bg-gray-400'}`}>
                                            {task.priority}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">No tasks found</p>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-xs text-gray-400 text-center shrink-0">
                    Showing {filteredTasks.length} of {tasks.length} tasks
                </div>

            </div>
        </div>
    );
};
