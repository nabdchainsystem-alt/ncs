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
    darkMode?: boolean;
}

export const ColumnContextMenu: React.FC<ColumnContextMenuProps> = ({ x, y, onClose, onAction, darkMode }) => {
    // Adjust position if it's too close to the edge
    const MENU_WIDTH = 256; // w-64
    const MENU_HEIGHT = 400; // Approximate height

    let adjustedX = x;
    let adjustedY = y;

    if (typeof window !== 'undefined') {
        if (x + MENU_WIDTH > window.innerWidth) {
            adjustedX = x - MENU_WIDTH;
        }
        if (y + MENU_HEIGHT > window.innerHeight) {
            adjustedY = y - MENU_HEIGHT;
        }
    }

    const style = {
        top: adjustedY,
        left: adjustedX,
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
                className={`fixed z-50 rounded-lg shadow-xl border w-64 py-2 animate-in fade-in zoom-in-95 duration-100 ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-200'}`}
                style={style}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col">
                    <button onClick={() => handleAction('sort_asc')} className={`flex items-center px-4 py-2 text-sm gap-3 ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <ArrowDownAZ size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                        <span>Sort ascending</span>
                    </button>
                    <button onClick={() => handleAction('sort_desc')} className={`flex items-center px-4 py-2 text-sm gap-3 ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <ArrowUpZA size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                        <span>Sort descending</span>
                    </button>
                    <button onClick={() => handleAction('group')} className={`flex items-center px-4 py-2 text-sm gap-3 ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <Layers size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                        <span>Group by this field</span>
                    </button>

                    <div className={`h-px my-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />

                    <button onClick={() => handleAction('rename')} className={`flex items-center px-4 py-2 text-sm gap-3 ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <Edit3 size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                        <span>Edit field</span>
                    </button>
                    <button onClick={() => handleAction('permissions')} className={`flex items-center px-4 py-2 text-sm gap-3 ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <Lock size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                        <span>Privacy and permissions</span>
                    </button>

                    <div className={`h-px my-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />

                    <button onClick={() => handleAction('move_start')} className={`flex items-center px-4 py-2 text-sm gap-3 ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <ArrowLeftToLine size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                        <span>Move to start</span>
                    </button>
                    <button onClick={() => handleAction('move_end')} className={`flex items-center px-4 py-2 text-sm gap-3 ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <ArrowRightToLine size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                        <span>Move to end</span>
                    </button>
                    <button onClick={() => handleAction('automate')} className={`flex items-center px-4 py-2 text-sm gap-3 ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <Zap size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                        <span>Automate</span>
                    </button>

                    <div className={`h-px my-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />

                    <button onClick={() => handleAction('hide')} className={`flex items-center px-4 py-2 text-sm gap-3 ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <EyeOff size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                        <span>Hide column</span>
                    </button>
                    <button onClick={() => handleAction('duplicate')} className={`flex items-center px-4 py-2 text-sm gap-3 ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <Copy size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                        <span>Duplicate</span>
                    </button>
                    <button onClick={() => handleAction('delete')} className={`flex items-center px-4 py-2 text-sm gap-3 ${darkMode ? 'hover:bg-white/5 text-red-400' : 'hover:bg-red-50 text-red-600'}`}>
                        <Trash2 size={16} className="text-red-500" />
                        <span>Delete field</span>
                    </button>
                </div>
            </div>
        </>
    );
};
