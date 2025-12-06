import React, { useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskBoardView from '../TaskBoardView';
import { useUI } from '../../../contexts/UIContext';
import { X } from 'lucide-react';

interface FloatingBoardContainerProps {
    activePage: string;
}

export const FloatingBoardContainer: React.FC<FloatingBoardContainerProps> = ({ activePage }) => {
    const { tasks, isLoading, handleStatusChange, handleQuickCreate } = useTasks('app', activePage);
    const { setFloatingTaskState } = useUI();

    // Replicate filtering logic from PageRenderer
    const filteredTasks = useMemo(() => {
        switch (activePage) {
            case 'inbox':
            case 'home':
                return [];
            case 'backend':
                return tasks.filter(t => t.tags.includes('Backend') || t.tags.includes('API') || t.tags.includes('Auth'));
            case 'sprints':
                return tasks.filter(t => t.tags.includes('Feature') || t.tags.includes('Bug'));
            case 'frontend':
                return tasks;
            default:
                return tasks;
        }
    }, [tasks, activePage]);

    return (
        <div className="h-full flex flex-col bg-white/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl border border-white/20">
            <div className="flex items-center justify-between px-4 py-2 bg-white/80 border-b border-gray-200/50">
                <h3 className="font-medium text-gray-700">Floating Board: {activePage}</h3>
                <button
                    onClick={() => setFloatingTaskState({ isOpen: false, isExpanded: false, config: null })}
                    className="p-1 hover:bg-gray-200/50 rounded-full transition-colors text-gray-500"
                    title="Close Floating Board"
                >
                    <X size={16} />
                </button>
            </div>
            <div className="flex-1 overflow-hidden relative">
                <TaskBoardView
                    tasks={filteredTasks}
                    isLoading={isLoading}
                    onAddTask={handleQuickCreate}
                    onStatusChange={handleStatusChange}
                />
            </div>
        </div>
    );
};
