import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical } from 'lucide-react';

interface DropdownCellProps {
    options?: { id: string; label: string; color: string }[];
    value?: string;
    onChange: (val: string) => void;
    onClose?: () => void;
    tabIndex?: number;
}

export const DropdownCell: React.FC<DropdownCellProps> = ({
    options = [],
    value,
    onChange,
    onClose,
    tabIndex
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

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
        setIsOpen(true);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && !(e.target as Element).closest('.dropdown-portal')) {
                setIsOpen(false);
                onClose?.();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

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
                className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
                {selectedOption ? (
                    <div className={"px-3 py-1 rounded-sm text-white text-xs font-medium truncate w-full text-center " + selectedOption.color}>
                        {selectedOption.label}
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </div>

            {isOpen && position && createPortal(
                <div
                    className="dropdown-portal fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-100"
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
                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 text-gray-700 placeholder-gray-400"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                        <div
                            onClick={() => {
                                onChange('');
                                setIsOpen(false);
                            }}
                            className="flex items-center justify-center px-3 py-2 hover:bg-gray-50 rounded-sm cursor-pointer border border-dashed border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
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
                                <div className="absolute left-2 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab p-1 hover:bg-gray-100 rounded">
                                    <GripVertical size={14} />
                                </div>
                                <div className={"w-[90%] px-3 py-2 rounded-sm text-white text-sm font-medium shadow-sm transition-transform active:scale-[0.98] text-center " + option.color}>
                                    {option.label}
                                </div>
                            </div>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div className="px-3 py-4 text-center text-xs text-gray-400">
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
