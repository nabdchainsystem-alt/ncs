import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Status, STATUS_COLORS, STATUS_COLORS_DARK } from '../../../rooms/boardTypes';
import { useQuickAction } from '../../../../hooks/useQuickAction';

interface StatusCellProps {
    status: Status;
    onChange: (newStatus: Status) => void;
    tabIndex?: number;
    darkMode?: boolean;
}

export const StatusCell: React.FC<StatusCellProps> = ({ status, onChange, tabIndex, darkMode }) => {
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
        const dropdownHeight = 250; // Approximate height
        const spaceBelow = window.innerHeight - rect.bottom;
        const showAbove = spaceBelow < dropdownHeight;

        setCoords({
            top: showAbove ? rect.top + window.scrollY - dropdownHeight - 4 : rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width
        });
        startAction();
    };

    const getColorClass = (s: Status) => {
        if (darkMode) {
            return STATUS_COLORS_DARK[s] || "bg-gray-800 text-gray-400";
        }
        return STATUS_COLORS[s] || "bg-gray-100 text-gray-400";
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
                    className={`w-full h-full flex items-center justify-center cursor-pointer transition-all duration-200 text-xs font-medium relative group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-sm ${getColorClass(status)}`}
                >
                    {/* Corner fold effect for selection hint */}
                    <div className="absolute right-0 bottom-0 w-3 h-3 bg-black/10 opacity-0 group-hover:opacity-100 clip-triangle transition-opacity"></div>
                    <span className="truncate px-1">{status || <span className="opacity-0 group-hover:opacity-100 text-[10px] uppercase">Set Status</span>}</span>
                </div>
            </div>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className={`fixed z-[10000] shadow-2xl rounded-lg border p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1 ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-200'}`}
                    style={{
                        top: coords.top + 4,
                        left: coords.left - (160 - coords.width) / 2,
                        width: '160px'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {Object.values(Status).map((s) => (
                        <div
                            key={s}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(s);
                                setIsOpen(false);
                            }}
                            className={`px-3 py-2.5 text-xs cursor-pointer hover:brightness-95 rounded-sm text-center font-medium transition-all shadow-sm ${getColorClass(s)}`}
                        >
                            {s || "Empty"}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
};


