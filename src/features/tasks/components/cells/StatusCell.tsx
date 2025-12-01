import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Status, STATUS_COLORS } from '../../../space/boardTypes';

interface StatusCellProps {
    status: Status;
    onChange: (newStatus: Status) => void;
    tabIndex?: number;
}

export const StatusCell: React.FC<StatusCellProps> = ({ status, onChange, tabIndex }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const toggleDropdown = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const dropdownHeight = 250; // Approximate height
        const spaceBelow = window.innerHeight - rect.bottom;
        const showAbove = spaceBelow < dropdownHeight;

        setCoords({
            top: showAbove ? rect.top + window.scrollY - dropdownHeight - 4 : rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width
        });
        setIsOpen(!isOpen);
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
                    className={"w-full h-full flex items-center justify-center cursor-pointer transition-all duration-200 text-xs font-medium text-white relative group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset " + (STATUS_COLORS[status] || "bg-gray-100 text-gray-400")}
                >
                    {/* Corner fold effect for selection hint */}
                    <div className="absolute right-0 bottom-0 w-3 h-3 bg-black/10 opacity-0 group-hover:opacity-100 clip-triangle transition-opacity"></div>
                    <span className="truncate px-1">{status || <span className="opacity-0 group-hover:opacity-100 text-[10px] uppercase">Set Status</span>}</span>
                </div>
            </div>

            {isOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
                    <div
                        className="fixed z-50 bg-white shadow-2xl rounded-lg border border-gray-200 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1"
                        style={{
                            top: coords.top + 4,
                            left: coords.left - (160 - coords.width) / 2,
                            width: '160px'
                        }}
                    >
                        {Object.values(Status).map((s) => (
                            <div
                                key={s}
                                onClick={() => {
                                    onChange(s);
                                    setIsOpen(false);
                                }}
                                className={"px-3 py-2.5 text-xs cursor-pointer hover:brightness-95 rounded text-center font-medium transition-all shadow-sm " + (STATUS_COLORS[s] || "bg-gray-100 text-gray-600")}
                            >
                                {s || "Empty"}
                            </div>
                        ))}
                    </div>
                </>,
                document.body
            )}
        </>
    );
};
