import React from 'react';
import { InboxItem } from '../types';
import { Sparkles, Paperclip, Calendar, Tag, CheckSquare } from 'lucide-react';

interface InboxItemCardProps {
    item: InboxItem;
    isSelected: boolean;
    onClick: () => void;
    locale?: string;
}

export const InboxItemCard: React.FC<InboxItemCardProps> = ({
    item,
    isSelected,
    onClick,
    locale = 'en-US'
}) => {
    const isClarified = !!item.aiSuggestions;
    const isRead = item.isRead ?? true; // Default to read if undefined, or change to false if you want everything unread by default. Let's assume read for legacy.

    // Format date: "10:42 AM" or "Fri"
    const timeString = item.createdAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

    // Truncate content for preview
    const previewText = item.content.length > 90
        ? item.content.substring(0, 90) + '...'
        : item.content;

    return (
        <div
            onClick={onClick}
            className={`
        relative px-4 py-3 cursor-pointer border-b border-stone-100 dark:border-stone-800 group transition-all duration-150 ease-out
        ${isSelected
                    ? 'bg-white dark:bg-stone-900 shadow-sm'
                    : 'bg-transparent hover:bg-white/60 dark:hover:bg-stone-800/60'}
        ${!isRead ? 'border-s-[3px] border-s-blue-600 dark:border-s-blue-500' : 'border-s-[3px] border-s-transparent'}
        ${isSelected && isRead ? 'border-s-stone-900 dark:border-s-stone-100' : ''}
      `}
        >
            <div className="flex gap-3">
                {/* Status Indicator Column */}
                <div className="pt-1.5 shrink-0">
                    <div className={`
                        w-2.5 h-2.5 rounded-full
                        ${isClarified ? 'bg-amber-400' : 'bg-blue-600 dark:bg-blue-500'}
                        ${!isRead ? 'opacity-100' : 'opacity-0'}
                    `}></div>
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                    {/* Header: Sender & Time */}
                    <div className="flex justify-between items-baseline mb-0.5">
                        <span className={`
                            font-sans text-sm truncate pe-2
                            ${!isRead ? 'font-bold text-stone-900 dark:text-stone-100' : 'font-semibold text-stone-700 dark:text-stone-300'}
                        `}>
                            {item.sender || 'Unknown Sender'}
                        </span>

                        <div className={`
                            flex items-center text-[10px] font-sans font-medium whitespace-nowrap
                            ${!isRead ? 'text-blue-600 dark:text-blue-400' : 'text-stone-400 dark:text-stone-500'}
                        `}>
                            <Calendar className="w-3 h-3 me-1.5 opacity-70" />
                            {timeString}
                        </div>
                    </div>

                    {/* Subject */}
                    <h4 className={`
                        font-serif text-sm leading-tight mb-1 line-clamp-1
                        ${!isRead ? 'font-medium text-stone-900 dark:text-stone-100' : 'font-normal text-stone-600 dark:text-stone-400'}
                    `}>
                        {item.subject || (item.aiSuggestions ? item.aiSuggestions.suggestedProject : 'No Subject')}
                    </h4>

                    {/* Message Preview */}
                    <p className="font-serif text-xs text-stone-500 dark:text-stone-500 line-clamp-1 mb-2">
                        {previewText}
                    </p>

                    {/* Interactive Icons */}
                    <div className="flex items-center gap-1 -ms-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors focus:outline-none text-stone-400 hover:text-blue-600"
                            title="Categorize"
                        >
                            <Tag className="w-3.5 h-3.5" />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors focus:outline-none text-stone-400 hover:text-green-600"
                            title="Create Task"
                        >
                            <CheckSquare className="w-3.5 h-3.5" />
                        </button>

                        {item.content.length > 80 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); }}
                                className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors focus:outline-none text-stone-400 hover:text-stone-600"
                                title="Attachments"
                            >
                                <Paperclip className="w-3.5 h-3.5 rtl:flip" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
