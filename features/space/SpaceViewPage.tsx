import React, { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import TaskBoard from '../../ui/TaskBoard';

interface SpaceViewPageProps {
    spaceName: string;
    spaceId: string;
}

const SpaceViewPage: React.FC<SpaceViewPageProps> = ({ spaceName, spaceId }) => {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [showTaskBoard, setShowTaskBoard] = useState(false);

    if (showTaskBoard) {
        return (
            <div className="w-full h-full bg-white flex flex-col">
                <TaskBoard />
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-clickup-dark flex flex-col">
            {/* Header with Breadcrumb */}
            <header className="h-14 bg-clickup-sidebar/90 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-6 flex-shrink-0 z-20 select-none">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-gray-300 min-w-[320px]">
                    <span className="text-sm font-medium whitespace-nowrap">Spaces</span>
                    <ChevronRight size={14} className="text-gray-500" />
                    <span className="text-sm font-medium text-white whitespace-nowrap">{spaceName}</span>
                </div>

                {/* Menu Bar */}
                <div className="flex items-center space-x-1">
                    {/* Add Button */}
                    <div className="relative">
                        <button
                            className="relative z-30 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center space-x-1 font-medium"
                            onClick={() => setActiveMenu(activeMenu === 'Add' ? null : 'Add')}
                        >
                            <Plus size={14} />
                            <span>Add</span>
                        </button>

                        {activeMenu === 'Add' && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 z-20 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-clickup-purple hover:text-white flex items-center justify-between group rounded-lg transition-colors"
                                        onClick={() => {
                                            setShowTaskBoard(true);
                                            setActiveMenu(null);
                                        }}
                                    >
                                        <span className="font-medium">Task Board</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Empty State */}
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-500 mb-4">
                        <svg className="w-20 h-20 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-400 mb-2">Welcome to {spaceName}</h2>
                    <p className="text-sm text-gray-500 mb-6">Click the <strong>Add</strong> button to get started</p>
                </div>
            </div>
        </div>
    );
};

export default SpaceViewPage;
