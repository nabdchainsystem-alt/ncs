import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronRight as ChevronRightSmall } from 'lucide-react';
import { useQuickAction } from '../../../hooks/useQuickAction';

interface DatePickerProps {
    date?: string; // Due date (ISO string)
    startDate?: string; // Start date (ISO string)
    onSelect: (date: string, type: 'start' | 'due') => void;
    onClose: () => void;
    darkMode?: boolean;
    className?: string;
    compact?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ date, startDate, onSelect, onClose, darkMode, className = '', compact = false }) => {
    const [activeTab, setActiveTab] = useState<'start' | 'due'>('due');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDueDate, setSelectedDueDate] = useState<Date | null>(date ? new Date(date) : null);
    const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(startDate ? new Date(startDate) : null);

    const { ref: containerRef } = useQuickAction<HTMLDivElement>({
        onCancel: onClose,
        initialActive: true
    });

    useEffect(() => {
        if (date) setSelectedDueDate(new Date(date));
        if (startDate) setSelectedStartDate(new Date(startDate));
    }, [date, startDate]);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleDateClick = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const newDate = new Date(year, month, day);
        // Adjust for timezone to keep ID as YYYY-MM-DD local
        const offset = newDate.getTimezoneOffset();
        const adjustedDate = new Date(newDate.getTime() - (offset * 60 * 1000));
        const isoDate = adjustedDate.toISOString().split('T')[0];

        if (activeTab === 'due') {
            onSelect(isoDate, 'due');
            setSelectedDueDate(newDate);
        } else {
            onSelect(isoDate, 'start');
            setSelectedStartDate(newDate);
            setActiveTab('due'); // Auto-switch to due date after picking start
        }
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const days = daysInMonth(year, month);
        const firstDay = firstDayOfMonth(year, month);
        const calendarDays = [];

        const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

        // Weekday headers
        weekDays.forEach(d => {
            calendarDays.push(
                <div key={`header-${d}`} className="text-center text-xs text-gray-400 py-3">
                    {d}
                </div>
            );
        });

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} />);
        }

        // Days
        for (let day = 1; day <= days; day++) {
            const d = new Date(year, month, day);
            const isToday = new Date().toDateString() === d.toDateString();

            let isSelected = false;
            let isRange = false;

            // Check selection based on active tab or range visualization
            if (activeTab === 'due' && selectedDueDate && d.toDateString() === selectedDueDate.toDateString()) isSelected = true;
            if (activeTab === 'start' && selectedStartDate && d.toDateString() === selectedStartDate.toDateString()) isSelected = true;

            // Range visual (optional but nice)
            if (selectedStartDate && selectedDueDate) {
                if (d > selectedStartDate && d < selectedDueDate) isRange = true;
                if (activeTab === 'due' && selectedStartDate && d.toDateString() === selectedStartDate.toDateString()) isRange = true; // Show start when picking due
                if (activeTab === 'start' && selectedDueDate && d.toDateString() === selectedDueDate.toDateString()) isRange = true; // Show due when picking start
            }

            calendarDays.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`
                        w-9 h-9 text-[13px] rounded-full flex items-center justify-center transition-all relative mx-auto
                        ${isSelected ? 'bg-black text-white font-medium shadow-sm z-10' : 'hover:bg-gray-100/80 text-gray-700'}
                        ${isToday && !isSelected ? 'text-[#E2445C] font-bold' : ''}
                        ${isRange && !isSelected ? 'bg-gray-50 text-gray-900' : ''}
                    `}
                >
                    {day}
                </button>
            );
        }

        return calendarDays;
    };

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const formatDate = (d: Date | null) => {
        if (!d) return '';
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const quickOptions = [
        { label: 'Today', sub: 'Tue' },
        { label: 'Later', sub: '11:40 am' },
        { label: 'Tomorrow', sub: 'Wed' },
        { label: 'This weekend', sub: 'Sat' },
        { label: 'Next week', sub: 'Mon' },
        { label: 'Next weekend', sub: '20 Dec' },
        { label: '2 weeks', sub: '23 Dec' },
        { label: '4 weeks', sub: '6 Jan' },
    ];

    return (
        <div ref={containerRef} className={`rounded-lg shadow-2xl bg-white flex overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100/50 ${compact ? 'flex-col w-[320px]' : 'w-[680px]'}`}>
            {/* Main Content */}
            <div className="flex flex-1">
                {/* Sidebar (Quick Options) */}
                {!compact && (
                    <div className="w-[200px] bg-[#fafafa] flex flex-col pt-3 pb-2 border-r border-gray-100">
                        <div className="flex-1 px-2 space-y-0.5">
                            {quickOptions.map((opt, i) => (
                                <button key={i} className="w-full flex items-center justify-between px-3 py-2 rounded-[4px] hover:bg-gray-200/50 text-left group transition-colors">
                                    <span className="text-[13px] text-[#424242] font-medium">{opt.label}</span>
                                    <span className="text-[11px] text-[#9ca3af] group-hover:text-gray-500">{opt.sub}</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-auto pt-2 px-2 border-t border-gray-100">
                            <button className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-200/50 rounded-[4px] text-left text-[13px] font-medium text-[#424242] transition-colors">
                                Set Recurring <ChevronRightSmall className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Calendar Area */}
                <div className="flex-1 flex flex-col p-6 bg-white min-h-[440px]">
                    {/* Inputs tabs */}
                    <div className="flex gap-4 mb-8">
                        {/* Start Date Input */}
                        <div
                            onClick={() => setActiveTab('start')}
                            className={`flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-[4px] cursor-pointer transition-all ${activeTab === 'start'
                                    ? 'bg-white ring-1 ring-black border border-black shadow-sm'
                                    : 'bg-[#f7f7f7] border border-transparent hover:bg-gray-100'
                                }`}
                        >
                            <CalendarIcon className={`w-4 h-4 text-gray-400`} />
                            <span className={`text-[13px] ${selectedStartDate ? 'text-gray-900' : 'text-gray-400 font-normal'}`}>
                                {selectedStartDate ? formatDate(selectedStartDate) : 'Start date'}
                            </span>
                        </div>

                        {/* Due Date Input */}
                        <div
                            onClick={() => setActiveTab('due')}
                            className={`flex flex-1 items-center gap-2 pl-3 pr-4 py-2.5 rounded-[6px] border cursor-pointer transition-all ${activeTab === 'due'
                                    ? 'bg-white border-black ring-1 ring-black/5 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <CalendarIcon className="w-4 h-4 text-gray-800" />
                            <span className={`text-[14px] font-medium ${selectedDueDate ? 'text-black' : 'text-gray-500'}`}>
                                {selectedDueDate ? formatDate(selectedDueDate) : 'Select date'}
                            </span>
                        </div>
                    </div>

                    {/* Month Header */}
                    <div className="flex items-center justify-between mb-4 pl-1">
                        <div className="flex items-center gap-2.5 text-[17px] font-bold text-black tracking-tight">
                            {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            <span className="text-[11px] font-normal text-gray-400 tracking-normal translate-y-[1px]">Today</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-800"><ChevronLeft className="w-5 h-5" /></button>
                            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-800"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-y-1 w-full">
                        {renderCalendar()}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-auto flex justify-start pt-4">
                        <button
                            onClick={() => { onSelect('', 'due'); onSelect('', 'start'); onClose(); }}
                            className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

