import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface DatePickerProps {
    date?: string; // ISO date string YYYY-MM-DD
    onSelect: (date: string) => void;
    onClose: () => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ date, onSelect, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(date ? new Date(date) : null);

    useEffect(() => {
        if (date) {
            const d = new Date(date);
            setSelectedDate(d);
            setCurrentMonth(d);
        }
    }, [date]);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const days = daysInMonth(year, month);
        const firstDay = firstDayOfMonth(year, month);
        const calendarDays = [];

        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="w-8 h-8" />);
        }

        // Days of current month
        for (let day = 1; day <= days; day++) {
            const d = new Date(year, month, day);
            const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
            const isToday = new Date().toDateString() === d.toDateString();

            calendarDays.push(
                <button
                    key={day}
                    onClick={() => {
                        const newDate = new Date(year, month, day);
                        // Adjust for timezone offset to ensure YYYY-MM-DD is correct
                        const offset = newDate.getTimezoneOffset();
                        const adjustedDate = new Date(newDate.getTime() - (offset * 60 * 1000));
                        onSelect(adjustedDate.toISOString().split('T')[0]);
                        onClose();
                    }}
                    className={`w-8 h-8 text-xs rounded-full flex items-center justify-center transition-all
                        ${isSelected ? 'bg-red-500 text-white font-bold shadow-md' : 'text-gray-700 hover:bg-gray-100'}
                        ${isToday && !isSelected ? 'text-red-500 font-bold' : ''}
                    `}
                >
                    {day}
                </button>
            );
        }

        return calendarDays;
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const quickSelect = (daysFromNow: number) => {
        const d = new Date();
        d.setDate(d.getDate() + daysFromNow);
        const offset = d.getTimezoneOffset();
        const adjustedDate = new Date(d.getTime() - (offset * 60 * 1000));
        onSelect(adjustedDate.toISOString().split('T')[0]);
        onClose();
    };

    const quickOptions = [
        { label: 'Today', days: 0, sub: 'Sun' },
        { label: 'Later', days: 7, sub: '8:53 pm' }, // Mock time for "Later"
        { label: 'Tomorrow', days: 1, sub: 'Mon' },
        { label: 'Next week', days: 7, sub: 'Mon' },
        { label: 'Next weekend', days: 6, sub: 'Sat' }, // Approx
        { label: '2 weeks', days: 14, sub: '14 Dec' },
        { label: '4 weeks', days: 28, sub: '28 Dec' },
        { label: '8 weeks', days: 56, sub: '25 Jan' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 flex overflow-hidden w-[500px] animate-in fade-in zoom-in-95 duration-200">
            {/* Sidebar */}
            <div className="w-48 bg-gray-50/50 border-r border-gray-100 p-2 flex flex-col gap-1">
                <div className="px-3 py-2 mb-2 border-b border-gray-100">
                    <div className="flex items-center text-gray-400 text-xs font-medium mb-1">
                        <CalendarIcon size={12} className="mr-2" />
                        <span>Date</span>
                    </div>
                    <div className="text-sm font-bold text-gray-800">
                        {selectedDate ? selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Set Date'}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {quickOptions.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => quickSelect(opt.days)}
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors group text-left"
                        >
                            <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900">{opt.label}</span>
                            <span className="text-xs text-gray-400 group-hover:text-gray-500">{opt.sub}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                            {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-gray-400 font-medium cursor-pointer hover:text-gray-600">Today</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <button
                        onClick={() => { onSelect(''); onClose(); }}
                        className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 bg-black text-white text-xs font-bold rounded-md hover:bg-gray-800 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
