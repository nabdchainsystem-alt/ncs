import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SlashMenu, SlashMenuItem } from './SlashMenu';
import { X, Maximize2, Minimize2 } from 'lucide-react';

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
    const containerRef = useRef<HTMLDivElement>(null);

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
        } else {
            if (e.key === 'Escape') {
                onClose();
            }
        }

        if (e.key === '/' && !showMenu) {
            const rect = textareaRef.current?.getBoundingClientRect();
            // Get cursor position coordinates (approximate or use a library for exact caret pos)
            // For simplicity in this textarea, we'll position near the cursor or bottom-left of caret
            // Since getting exact caret coordinates in a textarea is complex without a library, 
            // we will position it relative to the textarea or use a simple heuristic.

            // A simple heuristic: position near the bottom left of the textarea for now, 
            // or better, use the mouse position if available, but we are using keyboard.
            // Let's try to position it reasonably. 

            // Actually, for a better UX in a large editor, we might want it near the typing.
            // But without a library like 'textarea-caret', exact positioning is hard.
            // We'll position it at the cursor's approximate line height if possible, or just below the textarea cursor.

            // Let's use a fixed position relative to the textarea for MVP or try to calculate.
            // We can use the selectionStart to guess.

            if (rect) {
                // Simplified positioning: 
                // We'll position it slightly below the current cursor line if we could calculate it.
                // Fallback: Position at the bottom of the textarea or near the top-left if empty.

                // Let's try to be smart: 
                // We can create a dummy div to mirror the text and find the caret position.
                // But for this task, let's keep it simple: Position it relative to the textarea container.

                // We'll use the textarea's bounding rect and some offset.
                // Ideally, we'd use a library. For now, let's center it or put it below the cursor.

                // Let's just put it at the cursor position if we can get it from the event? No.

                // We will use a library-free approach: 
                // Just position it at the bottom left of the textarea for now to ensure visibility.
                // OR, let's try to get the caret coordinates using a known trick if needed.
                // For now, let's stick to the previous logic but adapted for the modal.

                // Actually, the previous logic used `rect.bottom`. Let's stick to that for consistency.
                // But since this is a large editor, maybe we want it to follow the cursor.
                // Let's use the `selectionStart` to estimate vertical position? 
                // No, that's unreliable with wrapping.

                // Let's just position it below the textarea for now, or fixed in the modal.
                // Actually, the user asked for "user will type / and the other menu will appear".
                // In Notion, it appears right next to the slash.

                // Let's use a simple approximation:
                // We can't easily get the XY of the caret in a plain textarea without a helper.
                // Let's position it at the bottom of the textarea for now.

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
