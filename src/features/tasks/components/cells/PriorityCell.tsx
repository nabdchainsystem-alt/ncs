import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Priority, PRIORITY_COLORS, PRIORITY_COLORS_DARK } from '../../../rooms/boardTypes';
import { useQuickAction } from '../../../../hooks/useQuickAction';

interface PriorityCellProps {
    priority: Priority;
    onChange: (newPriority: Priority) => void;
    tabIndex?: number;
    darkMode?: boolean;
}

export const PriorityCell: React.FC<PriorityCellProps> = ({ priority, onChange, tabIndex, darkMode }) => {
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const { ref: dropdownRef, isActive: isOpen, setIsActive: setIsOpen, startAction } = useQuickAction<HTMLDivElement>({
        onCancel: () => setIsOpen(false)
    });

    const toggleDropdown = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const dropdownHeight = 200; // Approximate height
        const spaceBelow = window.innerHeight - rect.bottom;
        const showAbove = spaceBelow < dropdownHeight;

        setCoords({
            top: showAbove ? rect.top + window.scrollY - dropdownHeight - 4 : rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width
        });
        startAction();
    };

    const getColorClass = (p: Priority) => {
        if (darkMode) {
            return PRIORITY_COLORS_DARK[p] || "bg-gray-800 text-gray-400";
        }
        return PRIORITY_COLORS[p] || "bg-gray-100 text-gray-400";
    };

    return (
        <>
            <div className="relative w-full h-full">
                <div
                    onClick={toggleDropdown}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDropdown(e);
                        }
                    }}
                    tabIndex={tabIndex}
                    className={`w-full h-full flex items-center justify-center cursor-pointer transition-all duration-200 text-xs font-medium relative group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-sm ${getColorClass(priority)}`}
                >
                    <div className="absolute right-0 bottom-0 w-3 h-3 bg-black/10 opacity-0 group-hover:opacity-100 clip-triangle transition-opacity"></div>
                    <span className="truncate px-1">{priority || <span className="opacity-0 group-hover:opacity-100 text-[10px] uppercase">Set</span>}</span>
                </div>
            </div>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className={`fixed z-[10000] shadow-2xl rounded-lg border p-1.5 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1 ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-200'}`}
                    style={{
                        top: coords.top + 4,
                        left: coords.left - (140 - coords.width) / 2,
                        width: '140px'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {Object.values(Priority).map((p) => (
                        <div
                            key={p}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(p);
                                setIsOpen(false);
                            }}
                            className={`px-2 py-2 text-xs cursor-pointer hover:brightness-90 rounded-sm text-center font-medium transition-all shadow-sm ${getColorClass(p)}`}
                        >
                            {p || "Empty"}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
};


