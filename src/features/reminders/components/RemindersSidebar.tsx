import React, { useState } from 'react';
import {
    Inbox,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Trash2,
    Hash,
    Moon,
    Sun,
    Plus,
    Sparkles,
    X,
    Loader2,
    CornerDownLeft
} from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useUI } from '../../../contexts/UIContext';
import { FilterType, Priority, Reminder } from '../types';
// We'll mock this for now or import if we migrate it
// import { parseNaturalLanguageReminder } from '../services/geminiService';

interface SidebarProps {
    activeFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
    width: number;
    onAdd: (reminder: any) => void; // Using any for now to simplify migration, ideally Omit<Reminder, 'id'>
}

const RemindersSidebar: React.FC<SidebarProps> = ({
    activeFilter,
    onFilterChange,
    width,
    onAdd
}) => {
    const { t, direction } = useLanguage();
    const { theme, setTheme } = useUI();
    const [isCaptureOpen, setIsCaptureOpen] = useState(false);
    const [captureText, setCaptureText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const navItems: { id: FilterType; labelKey: string; icon: React.ReactNode }[] = [
        { id: 'inbox', labelKey: 'reminders.inbox', icon: <Inbox size={18} /> },
        { id: 'today', labelKey: 'reminders.today', icon: <Calendar size={18} /> },
        { id: 'upcoming', labelKey: 'reminders.upcoming', icon: <CalendarDays size={18} /> },
        { id: 'completed', labelKey: 'reminders.completed', icon: <CheckCircle2 size={18} /> },
        { id: 'trash', labelKey: 'reminders.trash', icon: <Trash2 size={18} /> },
    ];

    const handleCreateNew = () => {
        // Basic default reminder
        const newReminder = {
            title: t('reminders.new'),
            notes: '',
            dueDate: null,
            priority: 'medium' as Priority,
            status: 'incomplete', // Service will map this if needed, but we use booleans in service
            completed: false,
            tags: [],
        };
        onAdd(newReminder);
    };

    const handleCaptureSubmit = async () => {
        if (!captureText.trim()) return;
        setIsProcessing(true);
        try {
            // TODO: Re-integrate Gemini Service
            // const parsed = await parseNaturalLanguageReminder(captureText);
            const newReminder = {
                title: captureText,
                notes: '',
                dueDate: null,
                priority: 'medium' as Priority,
                tags: [],
                completed: false,
            };
            onAdd(newReminder);
            setCaptureText('');
            setIsCaptureOpen(false);
        } finally {
            setIsProcessing(false);
        }
    };

    const isDarkMode = theme === 'nexus' || theme === 'sketch'; // Assuming 'nexus' is dark-ish

    return (
        <div
            className="h-full flex flex-col border-e border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-xl relative transition-colors duration-300"
            style={{ width }}
            dir={direction}
        >
            {/* Header */}
            <div className="px-5 py-6 flex items-center h-16">
                <span className="font-serif font-bold text-xl tracking-tight text-stone-900 dark:text-stone-50">
                    {t('reminders.title')}
                </span>
            </div>

            {/* Action Buttons Stack */}
            <div className="px-4 pb-6 space-y-3">
                {/* 1. New Reminder Button */}
                <button
                    onClick={handleCreateNew}
                    className="w-full flex items-center justify-center gap-2 bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:bg-stone-800 dark:hover:bg-white transition-all duration-200 font-sans text-sm font-medium"
                >
                    <Plus size={16} />
                    <span>{t('reminders.new')}</span>
                </button>

                {/* 2. Capture Button / Expandable Card */}
                {!isCaptureOpen ? (
                    <button
                        onClick={() => setIsCaptureOpen(true)}
                        className="w-full flex items-center justify-center gap-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 py-2.5 rounded-lg shadow-sm hover:border-stone-300 dark:hover:border-stone-600 transition-all font-serif text-lg italic group"
                    >
                        <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                            <Sparkles size={14} className="text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
                        </div>
                        <span>{t('reminders.capture')}</span>
                    </button>
                ) : (
                    <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 shadow-lg animate-in fade-in zoom-in-95 duration-200 ring-1 ring-stone-900/5 dark:ring-stone-100/10">
                        {/* Card Header */}
                        <div className="relative flex items-center justify-center mb-4 mt-1">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-stone-900 dark:bg-stone-100 flex items-center justify-center">
                                    <Sparkles size={12} className="text-white dark:text-stone-900" />
                                </div>
                                <span className="text-lg font-serif italic text-stone-800 dark:text-stone-100">{t('reminders.capture')}</span>
                            </div>
                            <button
                                onClick={() => setIsCaptureOpen(false)}
                                className={`absolute top-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors ${direction === 'rtl' ? 'left-0' : 'right-0'}`}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Text Area */}
                        <textarea
                            className="w-full bg-transparent text-sm font-serif text-stone-800 dark:text-stone-100 placeholder:text-stone-400/70 outline-none resize-none h-24 p-1 leading-relaxed border-b border-stone-100 dark:border-stone-700/50 mb-3"
                            placeholder={t('reminders.capture_placeholder')}
                            value={captureText}
                            onChange={(e) => setCaptureText(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCaptureSubmit();
                                }
                            }}
                        />

                        {/* Footer with Block ADD Button */}
                        <button
                            onClick={handleCaptureSubmit}
                            disabled={isProcessing || !captureText.trim()}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-stone-500/90 dark:bg-stone-600 hover:bg-stone-600 dark:hover:bg-stone-500 text-white rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all font-sans text-xs font-bold tracking-wider uppercase"
                        >
                            {isProcessing ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <>
                                    <span>{t('reminders.add')}</span>
                                    <CornerDownLeft size={14} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onFilterChange(item.id)}
                        className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group
              ${activeFilter === item.id
                                ? 'bg-stone-100 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100'
                                : 'text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/40 hover:text-stone-900 dark:hover:text-stone-200'
                            }
            `}
                    >
                        <span className={`transition-colors ${activeFilter === item.id ? 'text-stone-800 dark:text-stone-100' : 'text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300'}`}>
                            {item.icon}
                        </span>
                        <span className="font-sans">{t(item.labelKey)}</span>
                        {activeFilter === item.id && (
                            <div className="ms-auto w-1.5 h-1.5 rounded-full bg-stone-800 dark:bg-stone-200" />
                        )}
                    </button>
                ))}

                <div className="mt-8 px-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3 px-1">{t('reminders.tags')}</p>
                    <div className="space-y-1">
                        {['Personal', 'Work', 'Finance', 'Travel'].map(tag => (
                            <div key={tag} className="flex items-center gap-3 px-3 py-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer rounded-md hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                                <Hash size={14} className="opacity-40" />
                                <span className="font-sans">{tag}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Footer / User / Theme Toggle */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800">
                <button
                    onClick={() => setTheme(isDarkMode ? 'light' : 'nexus')}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 transition-colors"
                >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    <span className="text-sm font-sans">
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default RemindersSidebar;
