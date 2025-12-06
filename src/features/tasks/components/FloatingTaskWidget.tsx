import React from 'react';
import { useUI } from '../../../contexts/UIContext';
import { FloatingBoardContainer } from './FloatingBoardContainer';
import { Layers, Minimize2, Maximize2 } from 'lucide-react';

export const FloatingTaskWidget: React.FC = () => {
    const { floatingTaskState, setFloatingTaskState } = useUI();

    if (!floatingTaskState.isOpen || !floatingTaskState.config) {
        return null;
    }

    const toggleExpand = () => {
        setFloatingTaskState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
    };

    return (
        <>
            {/* Expanded Overlay */}
            {floatingTaskState.isExpanded && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
                    <div className="w-full max-w-6xl h-[80vh] relative animate-in zoom-in-95 duration-200">
                        {/* Close/Minimize button for the overlay */}
                        <button
                            onClick={toggleExpand}
                            className="absolute -top-3 -right-3 z-50 bg-white rounded-full p-2 shadow-lg border border-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            <Minimize2 size={20} />
                        </button>
                        <FloatingBoardContainer activePage={floatingTaskState.config.activePage} />
                    </div>
                </div>
            )}

            {/* Floating Widget Button */}
            <div
                className={`fixed bottom-6 right-6 z-[70] transition-all duration-300 ${floatingTaskState.isExpanded ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}
            >
                <button
                    onClick={toggleExpand}
                    className="group relative w-14 h-14 bg-white/90 backdrop-blur-md rounded-full shadow-2xl border border-white/50 flex items-center justify-center hover:scale-105 transition-all duration-300 hover:shadow-clickup-purple/20 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Layers size={24} className="text-gray-600 group-hover:text-clickup-purple transition-colors relative z-10" />

                    {/* Tooltip-ish text on hover */}
                    <span className="absolute -top-10 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Open Board
                    </span>
                </button>
            </div>
        </>
    );
};
