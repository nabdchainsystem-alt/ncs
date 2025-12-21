import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Calendar, ChevronRight, ChevronLeft
} from 'lucide-react';

// Portal Popup
interface PortalPopupProps {
    children: React.ReactNode;
    triggerRef: React.RefObject<HTMLElement | null>;
    onClose: () => void;
    position?: 'bottom' | 'top' | 'left' | 'right';
}

export const PortalPopup: React.FC<PortalPopupProps> = ({ children, triggerRef, onClose, position = 'bottom' }) => {
    const [coords, setCoords] = useState<{ top: number, left: number } | null>(null);

    React.useEffect(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Default to bottom align left
            let top = rect.bottom + window.scrollY + 8;
            let left = rect.left + window.scrollX;

            // Ensure it doesn't go off screen bottom
            if (top + 400 > window.scrollY + window.innerHeight) {
                // Flip to top if enough space
                if (rect.top - 400 > 0) {
                    top = rect.top + window.scrollY - 410;
                }
            }

            // Ensure it doesn't go off screen right
            if (left + 600 > window.innerWidth) {
                left = window.innerWidth - 620;
            }

            setCoords({ top, left });
        }
    }, [triggerRef]);

    if (!coords) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[9999] bg-transparent" onClick={onClose} />
            <div
                className="absolute z-[10000]"
                style={{ top: coords.top, left: coords.left }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </>,
        document.body
    );
};

import {
    format, addDays, startOfWeek, endOfWeek, addWeeks, isSameDay,
    isToday, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
    parse, isValid, startOfDay
} from 'date-fns';

interface DatePickerProps {
    startDate?: string;
    dueDate?: string;
    onUpdate: (dates: { startDate?: string, dueDate?: string }) => void;
    onClose: () => void;
    className?: string;
}

const parseDateString = (dateStr?: string): Date | undefined => {
    if (!dateStr) return undefined;
    // Try dd/MM/yyyy
    let d = parse(dateStr, 'dd/MM/yyyy', new Date());
    if (isValid(d)) return d;
    // Try yyyy-MM-dd
    d = parse(dateStr, 'yyyy-MM-dd', new Date());
    if (isValid(d)) return d;
    // Try MMM d (current year)
    d = parse(dateStr, 'MMM d', new Date());
    if (isValid(d)) return d;
    return undefined;
};

const formatDateString = (date: Date): string => {
    return format(date, 'dd/MM/yyyy');
};

export const EnhancedDatePicker = ({ startDate, dueDate, onUpdate, onClose, className = '' }: DatePickerProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [start, setStart] = useState<Date | undefined>(parseDateString(startDate));
    const [due, setDue] = useState<Date | undefined>(parseDateString(dueDate));
    const [focusedInput, setFocusedInput] = useState<'start' | 'due'>('due');

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateGrid = startOfWeek(monthStart);
    const endDateGrid = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDateGrid,
        end: endDateGrid,
    });

    const handleQuickSelect = (type: 'today' | 'tomorrow' | 'this-weekend' | 'next-week' | 'next-weekend' | '2-weeks' | '4-weeks') => {
        const today = new Date();
        let newDate = today;

        switch (type) {
            case 'today': newDate = today; break;
            case 'tomorrow': newDate = addDays(today, 1); break;
            case 'this-weekend':
                newDate = addDays(today, (6 - getDay(today) + 7) % 7 || 7);
                break;
            case 'next-week':
                newDate = addDays(today, (1 - getDay(today) + 7) % 7 || 7);
                break;
            case 'next-weekend':
                const thisSat = addDays(today, (6 - getDay(today) + 7) % 7 || 7);
                newDate = addDays(thisSat, 7);
                break;
            case '2-weeks': newDate = addWeeks(today, 2); break;
            case '4-weeks': newDate = addWeeks(today, 4); break;
        }

        if (focusedInput === 'start') {
            setStart(newDate);
            onUpdate({ startDate: formatDateString(newDate), dueDate: due ? formatDateString(due) : undefined });
        } else {
            setDue(newDate);
            onUpdate({ startDate: start ? formatDateString(start) : undefined, dueDate: formatDateString(newDate) });
        }
        onClose();
    };

    const handleDateClick = (day: Date) => {
        if (focusedInput === 'start') {
            setStart(day);
            setFocusedInput('due');
            onUpdate({
                startDate: formatDateString(day),
                dueDate: due ? formatDateString(due) : undefined
            });
        } else {
            setDue(day);
            onUpdate({
                startDate: start ? formatDateString(start) : undefined,
                dueDate: formatDateString(day)
            });
        }
    };

    const isDateSelected = (day: Date) => {
        if (focusedInput === 'start') return isSameDay(day, start || -1);
        if (focusedInput === 'due') return isSameDay(day, due || -1);
        return false;
    };

    const getDayClass = (day: Date) => {
        const isSelected = isDateSelected(day);
        const isCurrentMonth = isSameDay(day, startOfMonth(day)) || (day >= monthStart && day <= monthEnd);
        const isTodayDate = isToday(day);

        let classes = "h-8 w-8 rounded-full text-xs flex items-center justify-center transition-all relative z-10 ";

        if (isSelected) {
            classes += "bg-red-500 text-white font-medium hover:bg-red-600 shadow-sm ";
        } else if (isTodayDate) {
            classes += "text-red-500 font-bold hover:bg-stone-100 ";
        } else {
            classes += "text-stone-700 hover:bg-stone-100 ";
        }

        if (!isCurrentMonth) {
            classes += "opacity-30 ";
        }

        return classes;
    };

    return (
        <div className={`flex w-[600px] h-[400px] bg-white dark:bg-stone-900 shadow-2xl rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 font-sans ${className}`}>
            {/* Sidebar */}
            <div className="w-[180px] bg-stone-50/50 dark:bg-stone-900/50 border-r border-stone-200 dark:border-stone-800 flex flex-col py-2">
                <div className="flex-1 overflow-y-auto px-2">
                    <button onClick={() => handleQuickSelect('today')} className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors group">
                        <span>Today</span>
                        <span className="text-stone-400 group-hover:text-stone-500">{format(new Date(), 'EEE')}</span>
                    </button>
                    <button className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors group">
                        <span>Later</span>
                        <span className="text-stone-400 group-hover:text-stone-500">11:40 am</span>
                    </button>
                    <button onClick={() => handleQuickSelect('tomorrow')} className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors group">
                        <span>Tomorrow</span>
                        <span className="text-stone-400 group-hover:text-stone-500">{format(addDays(new Date(), 1), 'EEE')}</span>
                    </button>
                    <button onClick={() => handleQuickSelect('this-weekend')} className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors group">
                        <span>This weekend</span>
                        <span className="text-stone-400 group-hover:text-stone-500">Sat</span>
                    </button>
                    <button onClick={() => handleQuickSelect('next-week')} className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors group">
                        <span>Next week</span>
                        <span className="text-stone-400 group-hover:text-stone-500">Mon</span>
                    </button>
                    <button onClick={() => handleQuickSelect('next-weekend')} className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors group">
                        <span>Next weekend</span>
                        <span className="text-stone-400 group-hover:text-stone-500">{format(addDays(new Date(), (6 - getDay(new Date()) + 7) % 7 + 7), 'd MMM')}</span>
                    </button>
                    <button onClick={() => handleQuickSelect('2-weeks')} className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors group">
                        <span>2 weeks</span>
                        <span className="text-stone-400 group-hover:text-stone-500">{format(addWeeks(new Date(), 2), 'd MMM')}</span>
                    </button>
                    <button onClick={() => handleQuickSelect('4-weeks')} className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors group">
                        <span>4 weeks</span>
                        <span className="text-stone-400 group-hover:text-stone-500">{format(addWeeks(new Date(), 4), 'd MMM')}</span>
                    </button>
                </div>
                <div className="px-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <button className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors">
                        <span className="font-medium">Set Recurring</span>
                        <ChevronRight size={14} className="text-stone-400" />
                    </button>
                </div>
            </div>

            {/* Main Calendar Area */}
            <div className="flex-1 flex flex-col p-5 bg-white dark:bg-stone-950">
                {/* Inputs */}
                <div className="flex gap-3 mb-6">
                    <div
                        className={`flex-1 flex items-center gap-2 bg-stone-50 dark:bg-stone-900 border rounded-md px-3 py-2 cursor-pointer transition-colors ${focusedInput === 'start' ? 'border-stone-400 ring-2 ring-stone-100 dark:ring-stone-800' : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'}`}
                        onClick={() => setFocusedInput('start')}
                    >
                        <Calendar size={16} className="text-stone-400" />
                        <span className={`text-sm ${start ? 'text-stone-800 dark:text-stone-200' : 'text-stone-400'}`}>
                            {start ? format(start, 'dd/MM/yyyy') : 'Start date'}
                        </span>
                    </div>
                    <div
                        className={`flex-1 flex items-center gap-2 bg-white dark:bg-stone-900 border rounded-md px-3 py-2 cursor-pointer transition-colors ${focusedInput === 'due' ? 'border-stone-800 dark:border-stone-200 ring-1 ring-stone-200' : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'}`}
                        onClick={() => setFocusedInput('due')}
                    >
                        <Calendar size={16} className="text-stone-800 dark:text-stone-200" />
                        <span className={`text-sm font-medium ${due ? 'text-stone-800 dark:text-stone-200' : 'text-stone-400'}`}>
                            {due ? format(due, 'dd/MM/yyyy') : 'Due date'}
                        </span>
                    </div>
                </div>

                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-stone-900 dark:text-stone-100">
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <button onClick={() => setCurrentMonth(new Date())} className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 font-medium">
                            Today
                        </button>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setCurrentMonth(prev => addDays(startOfMonth(prev), -1))} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-stone-600">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={() => setCurrentMonth(prev => addDays(endOfMonth(prev), 1))} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-stone-600">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-xs text-stone-400 font-medium py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-1">
                    {calendarDays.map((day, i) => (
                        <button
                            key={i}
                            onClick={() => handleDateClick(day)}
                            className={getDayClass(day)}
                        >
                            {format(day, 'd')}
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 flex justify-between items-center text-xs">
                    <button
                        onClick={() => {
                            setStart(undefined);
                            setDue(undefined);
                            onUpdate({ startDate: undefined, dueDate: undefined });
                        }}
                        className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
                    >
                        Clear
                    </button>
                    <div className="text-stone-300">
                        {/* Placeholder for time input or other controls */}
                    </div>
                </div>
            </div>
        </div>
    );
};
