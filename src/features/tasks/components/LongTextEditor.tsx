import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SlashMenu, SlashMenuItem } from './SlashMenu';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useQuickAction } from '../../../hooks/useQuickAction';

interface LongTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
    title?: string;
    darkMode?: boolean;
}

export const LongTextEditor: React.FC<LongTextEditorProps> = ({ value, onChange, onClose, title = 'Edit Text', darkMode }) => {
    const [text, setText] = useState(value);
    const [showMenu, setShowMenu] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const [search, setSearch] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { ref: containerRef, setIsActive } = useQuickAction<HTMLDivElement>({
        onCancel: onClose,
        initialActive: true
    });

    // Disable QuickAction (click outside/escape) when sub-menu is open
    useEffect(() => {
        setIsActive(!showMenu);
    }, [showMenu, setIsActive]);

    // Focus textarea on mount
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMenu) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
                // Let the SlashMenu handle these via its document listener
                if (e.key === 'Enter') e.preventDefault();
                return;
            }
            if (e.key === 'Escape') {
                setShowMenu(false);
                return;
            }
        }
        // Escape handled by useQuickAction when menu is closed

        if (e.key === '/' && !showMenu) {
            const rect = textareaRef.current?.getBoundingClientRect();
            if (rect) {
                setMenuPos({
                    top: rect.top + 40, // A bit down from the top
                    left: rect.left + 20
                });
                setShowMenu(true);
                setSearch('');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setText(newVal);
        onChange(newVal);

        if (showMenu) {
            const lastSlashIndex = newVal.lastIndexOf('/');
            if (lastSlashIndex === -1) {
                setShowMenu(false);
            } else {
                setSearch(newVal.slice(lastSlashIndex + 1));
            }
        }
    };

    const handleSelect = (item: SlashMenuItem) => {
        let textToInsert = '';
        switch (item.id) {
            case 'h1': textToInsert = '# '; break;
            case 'h2': textToInsert = '## '; break;
            case 'h3': textToInsert = '### '; break;
            case 'checklist': textToInsert = '- [ ] '; break;
            case 'bulletList': textToInsert = '- '; break;
            case 'orderedList': textToInsert = '1. '; break;
            case 'quote': textToInsert = '> '; break;
            case 'code': textToInsert = '```\n\n```'; break;
            default: textToInsert = '';
        }

        if (textToInsert) {
            const lastSlashIndex = text.lastIndexOf('/');
            const newValue = text.substring(0, lastSlashIndex) + textToInsert + text.substring(lastSlashIndex + 1 + search.length);
            setText(newValue);
            onChange(newValue);
        }
        setShowMenu(false);
        textareaRef.current?.focus();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={containerRef}
                className={`rounded-xl shadow-2xl w-[800px] h-[600px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-200'}`}
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-gray-700 bg-[#1a1d24]' : 'border-gray-100 bg-gray-50/50'}`}>
                    <div className="flex items-center gap-2">
                        <Maximize2 size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{title}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-1.5 rounded-md transition-colors ${darkMode ? 'hover:bg-white/5 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'}`}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Editor Area */}
                <div className={`flex-1 relative ${darkMode ? 'bg-[#1a1d24]' : 'bg-white'}`}>
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className={`w-full h-full p-6 resize-none focus:outline-none text-base leading-relaxed font-mono ${darkMode ? 'bg-[#1a1d24] text-gray-200 placeholder-gray-600' : 'text-gray-800 placeholder-gray-300'}`}
                        placeholder="Write something... Type '/' for commands"
                    />

                    {/* Helper hint */}
                    <div className={`absolute bottom-4 right-4 text-xs pointer-events-none ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        Markdown supported • Type '/' for commands
                    </div>
                </div>
            </div>

            {/* Slash Menu Portal */}
            {showMenu && (
                <div className="fixed inset-0 z-[10000] pointer-events-none">
                    {/* We render the menu at the calculated position */}
                    <div className="pointer-events-auto">
                        <SlashMenu
                            search={search}
                            onSelect={handleSelect}
                            onClose={() => setShowMenu(false)}
                            position={menuPos}
                            darkMode={darkMode}
                        />
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};


