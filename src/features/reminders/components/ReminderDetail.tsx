import React from 'react';
import {
    Trash2,
    Calendar,
    Flag,
    Tag,
    CheckSquare,
    Clock
} from 'lucide-react';
import { Reminder, Priority } from '../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ReminderDetailProps {
    reminder: Reminder | null;
    onUpdate: (updated: Reminder) => void;
    onDelete: (id: string) => void;
    width: number;
}

const ReminderDetail: React.FC<ReminderDetailProps> = ({
    reminder,
    onUpdate,
    onDelete,
    width
}) => {
    const { t, direction } = useLanguage();

    if (!reminder) {
        return (
            <div
                className="h-full flex flex-col items-center justify-center bg-white dark:bg-stone-900 text-stone-300 dark:text-stone-700 transition-colors duration-300"
                style={{ flexGrow: 1 }} // Allow it to fill remaining space
            >
                <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center mb-4">
                    <CheckSquare size={32} className="opacity-50" />
                </div>
                <p className="font-serif italic">{t('discussion.select_conversation') /* Reusing similar string or add specific if needed */}</p>
            </div>
        );
    }

    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate({ ...reminder, title: e.target.value });
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate({ ...reminder, notes: e.target.value });
    };

    const togglePriority = () => {
        const next: Record<Priority, Priority> = {
            'none': 'low',
            'low': 'medium',
            'medium': 'high',
            'high': 'none'
        };
        onUpdate({ ...reminder, priority: next[reminder.priority] });
    };

    return (
        <div
            className="h-full flex flex-col bg-white dark:bg-stone-900 overflow-y-auto transition-colors duration-300 border-l border-stone-200 dark:border-stone-800"
        // Note: border-l logic is for LTR. For RTL logic we might want border-r. 
        // However, if the parent uses flex-direction: row-reverse, then this element is visually on left, so border-r (logical border-inline-start?)
        // Actually in flex row (LTR), Sidebar | List | Detail. Detail has left border.
        // In RTL, Sidebar(Right) | List | Detail(Left). Detail should have right border? 
        // If we use logical properties or simple `border-inline-start` it handles itself if browswer supports it. 
        // Tailwind `border-s` is border-inline-start.
        // So `border-s` should match language direction.
        >
            <div className="flex-1 p-8 max-w-2xl mx-auto w-full space-y-8">

                {/* Header Actions */}
                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Add actions here if needed */}
                </div>

                {/* Title Area */}
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <button
                            onClick={() => onUpdate({ ...reminder, completed: !reminder.completed })}
                            className={`mt-1.5 w-6 h-6 rounded-full border-2 flex-shrink-0 transition-colors ${reminder.completed ? 'bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100' : 'border-stone-300 dark:border-stone-600 hover:border-stone-400'}`}
                        />
                        <textarea
                            value={reminder.title}
                            onChange={handleTitleChange}
                            placeholder={t('reminders.new')}
                            className="w-full text-3xl font-bold bg-transparent outline-none resize-none text-stone-900 dark:text-stone-100 placeholder:text-stone-300 leading-tight"
                            rows={2}
                        />
                    </div>
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-[120px_1fr] gap-y-6 items-center text-sm">

                    {/* Date */}
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                        <Calendar size={16} />
                        <span className="font-medium">{t('reminders.date')}</span>
                    </div>
                    <div className="flex items-center">
                        <button className="px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md text-stone-700 dark:text-stone-300 transition-colors text-start">
                            {reminder.dueDate || t('reminders.none')}
                        </button>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                        <Clock size={16} />
                        <span className="font-medium">{t('reminders.time')}</span>
                    </div>
                    <div className="flex items-center">
                        <button className="px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md text-stone-700 dark:text-stone-300 transition-colors text-start">
                            {reminder.time || t('reminders.none')}
                        </button>
                    </div>

                    {/* Priority */}
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                        <Flag size={16} />
                        <span className="font-medium">{t('reminders.priority')}</span>
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={togglePriority}
                            className="px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md text-stone-700 dark:text-stone-300 transition-colors uppercase tracking-wider font-bold text-xs"
                        >
                            {t(`reminders.${reminder.priority}`)}
                        </button>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 self-start mt-2">
                        <Tag size={16} />
                        <span className="font-medium">{t('reminders.tags')}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {reminder.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded text-stone-600 dark:text-stone-300 text-xs font-medium">
                                #{tag}
                            </span>
                        ))}
                        <button className="px-2 py-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 text-xs flex items-center gap-1">
                            + {t('reminders.add')}
                        </button>
                    </div>
                </div>

                <div className="h-px bg-stone-100 dark:bg-stone-800 w-full" />

                {/* Notes */}
                <div className="flex-1">
                    <textarea
                        value={reminder.notes || ''}
                        onChange={handleNotesChange}
                        placeholder={t('reminders.capture_placeholder')}
                        className="w-full h-48 bg-transparent start-0 outline-none resize-none text-stone-600 dark:text-stone-300 font-serif leading-relaxed"
                    />
                </div>

            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-900/50">
                <span className="text-xs text-stone-400">
                    {reminder.createdAt ? `Created ${new Date(reminder.createdAt).toLocaleDateString()}` : ''}
                </span>
                <button
                    onClick={() => onDelete(reminder.id)}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={t('reminders.delete')}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};

export default ReminderDetail;
