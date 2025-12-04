import React, { useState, useEffect, useRef } from 'react';
import {
    Type, Heading1, Heading2, Heading3, Heading4, CheckSquare, List, ListOrdered,
    ToggleLeft, Flag, Code, Quote, MessageSquareQuote, Text
} from 'lucide-react';

export interface SlashMenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    description?: string;
}

const MENU_ITEMS: SlashMenuItem[] = [
    { id: 'text', label: 'Normal text', icon: <Text size={18} className="text-gray-500" /> },
    { id: 'h1', label: 'Heading 1', icon: <Heading1 size={18} className="text-gray-500" /> },
    { id: 'h2', label: 'Heading 2', icon: <Heading2 size={18} className="text-gray-500" /> },
    { id: 'h3', label: 'Heading 3', icon: <Heading3 size={18} className="text-gray-500" /> },
    { id: 'h4', label: 'Heading 4', icon: <Heading4 size={18} className="text-gray-500" /> },
    { id: 'checklist', label: 'Checklist', icon: <CheckSquare size={18} className="text-gray-500" /> },
    { id: 'bulletList', label: 'Bulleted list', icon: <List size={18} className="text-gray-500" /> },
    { id: 'orderedList', label: 'Numbered list', icon: <ListOrdered size={18} className="text-gray-500" /> },
    { id: 'toggle', label: 'Toggle list', icon: <ToggleLeft size={18} className="text-gray-500" /> },
    { id: 'banner', label: 'Banners', icon: <Flag size={18} className="text-gray-500" /> },
    { id: 'code', label: 'Code block', icon: <Code size={18} className="text-gray-500" /> },
    { id: 'quote', label: 'Block quote', icon: <Quote size={18} className="text-gray-500" /> },
    { id: 'pullQuote', label: 'Pull quote', icon: <MessageSquareQuote size={18} className="text-gray-500" /> },
];

interface SlashMenuProps {
    search: string;
    onSelect: (item: SlashMenuItem) => void;
    onClose: () => void;
    position: { top: number; left: number };
    darkMode?: boolean;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({ search, onSelect, onClose, position, darkMode }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const filteredItems = MENU_ITEMS.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    onSelect(filteredItems[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredItems, selectedIndex, onSelect, onClose]);

    if (filteredItems.length === 0) return null;

    return (
        <div
            ref={menuRef}
            className={`fixed z-[9999] rounded-lg shadow-xl border w-72 max-h-80 overflow-y-auto flex flex-col p-1 animate-in fade-in zoom-in-95 duration-100 ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-200'}`}
            style={{ top: position.top, left: position.left }}
        >
            <div className={`px-2 py-1.5 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Basic blocks
            </div>
            {filteredItems.map((item, index) => (
                <div
                    key={item.id}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${index === selectedIndex ? (darkMode ? 'bg-white/10' : 'bg-gray-100') : (darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50')}`}
                    onClick={() => onSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                >
                    <div className={`w-10 h-10 rounded border flex items-center justify-center shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        {item.icon}
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{item.label}</span>
                        {item.description && <span className="text-xs text-gray-400">{item.description}</span>}
                    </div>
                </div>
            ))}
        </div>
    );
};
