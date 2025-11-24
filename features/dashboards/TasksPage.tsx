import React, { useState } from 'react';
import TaskBoard from '../../ui/TaskBoard';
import {
    Search, Filter, LayoutTemplate, List, KanbanSquare,
    Calendar, SlidersHorizontal, ArrowUpDown, Plus
} from 'lucide-react';

const TasksPage: React.FC = () => {
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="flex flex-col h-full w-full bg-white overflow-hidden">
            {/* Tools Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 bg-white z-10">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    {/* View Toggles */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Board View"
                        >
                            <KanbanSquare size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
                        />
                    </div>

                    {/* Filters & Sort */}
                    <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Filter size={16} className="mr-2" />
                        Filter
                    </button>
                    <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <ArrowUpDown size={16} className="mr-2" />
                        Sort
                    </button>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <SlidersHorizontal size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'board' ? (
                    <TaskBoard />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                            <List size={48} className="mx-auto mb-4 opacity-20" />
                            <p>List view coming soon</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TasksPage;
