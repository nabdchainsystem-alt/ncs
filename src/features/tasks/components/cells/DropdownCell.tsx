import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical } from 'lucide-react';
import { useQuickAction } from '../../../../hooks/useQuickAction';

interface DropdownCellProps {
    options?: { id: string; label: string; color: string }[];
    value?: string;
    onChange: (val: string) => void;
    onClose?: () => void;
    tabIndex?: number;
    darkMode?: boolean;
}

export const DropdownCell: React.FC<DropdownCellProps> = ({
    options = [],
    value,
    onChange,
    onClose,
    tabIndex,
    darkMode
}) => {
    const [search, setSearch] = useState('');
    const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const { ref: dropdownRef, isActive: isOpen, setIsActive: setIsOpen, startAction } = useQuickAction<HTMLDivElement>({
        onCancel: () => {
            setIsOpen(false);
            onClose?.();
        }
    });

    const selectedOption = options.find(o => o.id === value);

    const handleOpen = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const width = Math.max(rect.width, 220);
            const left = rect.left + window.scrollX - ((width - rect.width) / 2);
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left,
                width
            });
        }
        startAction();
    };

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div
                ref={triggerRef}
                onClick={handleOpen}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpen(e);
                    }
                }}
                tabIndex={tabIndex}
                className={`w-full h-full flex items-center justify-center cursor-pointer transition-colors px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
            >
                {selectedOption ? (
                    <div className={"px-3 py-1 rounded-sm text-white text-xs font-medium truncate w-full text-center " + selectedOption.color}>
                        {selectedOption.label}
                    </div>
                ) : (
                    <span className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                )}
            </div>

            {isOpen && position && createPortal(
                <div
                    ref={dropdownRef}
                    className={`dropdown-portal fixed z-[9999] rounded-lg shadow-2xl border animate-in fade-in zoom-in-95 duration-100 ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-100'}`}
                    style={{
                        top: position.top,
                        left: position.left,
                        width: position.width,
                        minWidth: '220px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-2">
                        <input
                            type="text"
                            placeholder="Search or add options..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`w-full px-3 py-2 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 ${darkMode ? 'bg-gray-800 text-gray-200 placeholder-gray-500' : 'bg-gray-50 text-gray-700 placeholder-gray-400'}`}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                        <div
                            onClick={() => {
                                onChange('');
                                setIsOpen(false);
                            }}
                            className={`flex items-center justify-center px-3 py-2 rounded-sm cursor-pointer border border-dashed transition-all ${darkMode ? 'hover:bg-white/5 border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500' : 'hover:bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'}`}
                        >
                            -
                        </div>
                        {filteredOptions.map(option => (
                            <div
                                key={option.id}
                                onClick={() => {
                                    onChange(option.id);
                                    setIsOpen(false);
                                }}
                                className="flex items-center justify-center relative gap-2 group cursor-pointer"
                            >
                                <div className={`absolute left-2 opacity-0 group-hover:opacity-100 cursor-grab p-1 rounded ${darkMode ? 'text-gray-500 hover:bg-white/10' : 'text-gray-300 hover:bg-gray-100'}`}>
                                    <GripVertical size={14} />
                                </div>
                                <div className={"w-[90%] px-3 py-2 rounded-sm text-white text-sm font-medium shadow-sm transition-transform active:scale-[0.98] text-center " + option.color}>
                                    {option.label}
                                </div>
                            </div>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div className={`px-3 py-4 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                No options found
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};


