import React from 'react';
import {
    ArrowUpDown, ArrowLeftToLine, ArrowRightToLine, EyeOff, Copy, Trash2,
    Settings, Lock, Zap, Layers, Edit3, ArrowDownAZ, ArrowUpZA
} from 'lucide-react';

interface ColumnContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAction: (action: string) => void;
}

export const ColumnContextMenu: React.FC<ColumnContextMenuProps> = ({ x, y, onClose, onAction }) => {
    // Adjust position if it's too close to the edge (simple implementation)
    const style = {
        top: y,
        left: x,
    };

    const handleAction = (action: string) => {
        onAction(action);
        onClose();
    };

    return (
        <>
            <div
                className="fixed inset-0 z-50 bg-transparent"
                onClick={onClose}
                onContextMenu={(e) => { e.preventDefault(); onClose(); }}
            />
            <div
                className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-64 py-2 animate-in fade-in zoom-in-95 duration-100"
                style={style}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col">
                    <button onClick={() => handleAction('sort_asc')} className="flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 gap-3">
                        <ArrowDownAZ size={16} className="text-gray-500" />
                        <span>Sort ascending</span>
                    </button>
                    <button onClick={() => handleAction('sort_desc')} className="flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 gap-3">
                        <ArrowUpZA size={16} className="text-gray-500" />
                        <span>Sort descending</span>
                    </button>
                    <button onClick={() => handleAction('group')} className="flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 gap-3">
                        <Layers size={16} className="text-gray-500" />
                        <span>Group by this field</span>
                    </button>

                    <div className="h-px bg-gray-100 my-1" />

                    <button onClick={() => handleAction('rename')} className="flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 gap-3">
                        <Edit3 size={16} className="text-gray-500" />
                        <span>Edit field</span>
                    </button>
                    <button onClick={() => handleAction('permissions')} className="flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 gap-3">
                        <Lock size={16} className="text-gray-500" />
                        <span>Privacy and permissions</span>
                    </button>

                    <div className="h-px bg-gray-100 my-1" />

                    <button onClick={() => handleAction('move_start')} className="flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 gap-3">
                        <ArrowLeftToLine size={16} className="text-gray-500" />
                        <span>Move to start</span>
                    </button>
                    <button onClick={() => handleAction('move_end')} className="flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 gap-3">
                        <ArrowRightToLine size={16} className="text-gray-500" />
                        <span>Move to end</span>
                    </button>
                    <button onClick={() => handleAction('automate')} className="flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 gap-3">
                        <Zap size={16} className="text-gray-500" />
                        <span>Automate</span>
                    </button>

                    <div className="h-px bg-gray-100 my-1" />

                    <button onClick={() => handleAction('hide')} className="flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 gap-3">
                        <EyeOff size={16} className="text-gray-500" />
                        <span>Hide column</span>
                    </button>
                    <button onClick={() => handleAction('duplicate')} className="flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 gap-3">
                        <Copy size={16} className="text-gray-500" />
                        <span>Duplicate</span>
                    </button>
                    <button onClick={() => handleAction('delete')} className="flex items-center px-4 py-2 hover:bg-red-50 text-sm text-red-600 gap-3">
                        <Trash2 size={16} className="text-red-500" />
                        <span>Delete field</span>
                    </button>
                </div>
            </div>
        </>
    );
};
