
import React, { useState, useRef } from 'react';
import {
    Search,
    Plus,
    Circle,
    CheckCircle2,
    Sparkles,
    Loader2
} from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useUI } from '../../../contexts/UIContext';
import { FilterType, Priority, Reminder } from '../types';
// import { parseNaturalLanguageReminder } from '../services/geminiService';

interface ReminderListProps {
    reminders: Reminder[];
    activeFilter: FilterType;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAdd: (reminder: any) => void;
    onToggleStatus: (id: string) => void;
    width: number;
}

const ReminderList: React.FC<ReminderListProps> = ({
    reminders,
    activeFilter,
    selectedId,
    onSelect,
    onAdd,
    onToggleStatus,
    width
}) => {
    const { t, direction } = useLanguage();
    const { theme } = useUI();
    const [inputValue, setInputValue] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const listRef = useRef<HTMLDivElement>(null);

    // Filter Logic matching the original component somewhat but adapted
    const filteredReminders = reminders.filter(r => {
        // 1. Text Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const notes = r.notes || '';
            if (!r.title.toLowerCase().includes(q) && !notes.toLowerCase().includes(q)) return false;
        }

        // 2. Category Filter
        if (activeFilter === 'inbox') return !r.completed;
        if (activeFilter === 'completed') return r.completed;
        if (activeFilter === 'trash') return false;

        // Smart Lists logic (Client side filtering for now, service does basic list filtering)
        if (activeFilter === 'today') {
            if (r.completed) return false;
            if (!r.dueDate) return false;
            if (r.dueDate === 'Today') return true;
            const d = new Date(r.dueDate);
            const now = new Date();
            return d.toDateString() === now.toDateString();
        }
        if (activeFilter === 'scheduled' || activeFilter === 'upcoming') {
            if (r.completed) return false;
            if (!r.dueDate) return false;
            return true; // Simplified for now
        }
        if (activeFilter === 'flagged') return r.priority === 'high' && !r.completed;

        return true;
    });

    const handleSmartAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        setIsProcessing(true);

        try {
            // TODO: Gemini integration
            // const parsed = await parseNaturalLanguageReminder(inputValue);

            const newReminder = {
                title: inputValue,
                notes: '',
                dueDate: null,
                priority: 'medium' as Priority,
                tags: [],
                completed: false,
            };

            onAdd(newReminder);
            setInputValue('');
        } finally {
            setIsProcessing(false);
        }
    };

    const getPriorityColor = (p: Priority) => {
        switch (p) {
            case 'high': return 'text-rose-500';
            case 'medium': return 'text-amber-500';
            case 'low': return 'text-stone-400';
            default: return 'text-stone-400';
        }
    };

    const isDark = theme === 'nexus' || theme === 'sketch';

    return (
        <div
            className="h-full flex flex-col bg-white dark:bg-stone-900 border-e border-stone-200 dark:border-stone-800 transition-colors duration-300"
            style={{ width }}
            dir={direction}
        >
            {/* Top Bar */}
            <div className="h-14 border-b border-stone-200 dark:border-stone-800 flex items-center px-4 gap-3 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md z-10 sticky top-0">
                <Search className="text-stone-400" size={16} />
                <input
                    type="text"
                    placeholder={t('reminders.search')}
                    className="bg-transparent w-full text-sm outline-none placeholder:text-stone-400 text-stone-800 dark:text-stone-200 font-sans"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* List Content */}
            <div ref={listRef} className="flex-1 overflow-y-auto">
                {filteredReminders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-60">
                        <span className="font-serif italic text-lg">{t('reminders.no_reminders')}</span>
                    </div>
                ) : (
                    <div className="divide-y divide-stone-100 dark:divide-stone-800">
                        {filteredReminders.map(item => (
                            <div
                                key={item.id}
                                onClick={() => onSelect(item.id)}
                                className={`
                  group flex items-start gap-3 p-4 cursor-pointer transition-colors duration-200
                  ${selectedId === item.id
                                        ? 'bg-stone-100 dark:bg-stone-800/60'
                                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/30'
                                    }
                `}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleStatus(item.id); }}
                                    className="mt-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                                >
                                    {item.completed ? (
                                        <CheckCircle2 size={20} className="text-stone-500" />
                                    ) : (
                                        <Circle size={20} />
                                    )}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-sans text-sm font-medium truncate ${item.completed ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'}`}>
                                            {item.title}
                                        </h3>
                                        {item.dueDate && (
                                            <span className={`text-xs font-sans whitespace-nowrap ms-2 ${new Date(item.dueDate).getTime() < new Date().getTime() && !item.completed ? 'text-red-500' : 'text-stone-400'}`}>
                                                {item.dueDate === 'Today' ? t('reminders.today') : item.dueDate}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`text-[10px] uppercase font-bold tracking-wider ${getPriorityColor(item.priority)}`}>
                                            {t(`reminders.${item.priority}`)}
                                        </div>
                                        {item.notes && (
                                            <p className="text-xs text-stone-400 truncate max-w-[200px] font-serif italic">
                                                {item.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Smart Input Area */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                <form
                    onSubmit={handleSmartAdd}
                    className={`
            relative flex items-center bg-white dark:bg-stone-900 border rounded-lg shadow-sm transition-all duration-300
            ${isProcessing ? 'border-amber-400 dark:border-amber-700 ring-1 ring-amber-400/20' : 'border-stone-200 dark:border-stone-800 focus-within:border-stone-400 dark:focus-within:border-stone-600'}
          `}
                >
                    <div className="ps-3 text-stone-400">
                        {isProcessing ? <Loader2 size={18} className="animate-spin text-amber-500" /> : <Plus size={18} />}
                    </div>
                    <input
                        type="text"
                        className="w-full bg-transparent p-3 outline-none text-sm font-serif placeholder:font-serif text-stone-800 dark:text-stone-100 placeholder:italic"
                        placeholder={isProcessing ? "Gemini is thinking..." : "Add task..."}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isProcessing}
                    />
                    {!isProcessing && inputValue.length > 5 && (
                        <div className="pe-3 text-amber-500 animate-pulse" title="AI Processing Available">
                            <Sparkles size={16} />
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ReminderList;
