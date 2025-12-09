import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, ChevronDown, Repeat } from 'lucide-react';
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
            // Don't close immediately to allow setting start date if needed, or close if intuitive behavior is desired.
            // For smoother flow, we can keep it open or close. Let's keep it open for range selection feel or close if single click.
            // User request implies "fully activate", often means convenient. Let's select and update local state.
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
                <div key={`header-${d}`} className="text-center text-xs font-medium py-2 text-gray-400">
                    {d}
                </div>
            );
        });

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="w-8 h-8" />);
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
                        w-8 h-8 text-sm rounded-full flex items-center justify-center transition-all relative
                        ${isSelected ? 'bg-red-500 text-white font-medium shadow-sm z-10' : 'hover:bg-gray-100 text-gray-700'}
                        ${isToday && !isSelected ? 'text-red-500 font-medium' : ''}
                        ${isRange && !isSelected ? 'bg-purple-50 text-purple-700 rounded-none first:rounded-l-full last:rounded-r-full' : ''}
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
        <div ref={containerRef} className={`rounded-xl shadow-2xl bg-white border border-gray-200 flex overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${compact ? 'flex-col w-[320px]' : 'w-[640px]'}`}>
            {/* Main Content */}
            <div className="flex flex-1">
                {/* Sidebar (Quick Options) - Hidden in compact mode or designed differently */}
                {!compact && (
                    <div className="w-48 border-r border-gray-100 bg-gray-50/30 flex flex-col">
                        <div className="p-2 space-y-0.5">
                            {quickOptions.map((opt, i) => (
                                <button key={i} className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100/80 text-left group">
                                    <span className="text-sm text-gray-700 font-medium">{opt.label}</span>
                                    <span className="text-xs text-gray-400 group-hover:text-gray-500">{opt.sub}</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-auto border-t border-gray-100">
                            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left text-sm font-medium text-gray-700">
                                Set Recurring <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Calendar Area */}
                <div className="flex-1 flex flex-col p-4 bg-white">
                    {/* Inputs tabs */}
                    <div className="flex gap-2 mb-4">
                        <div
                            onClick={() => setActiveTab('start')}
                            className={`flex-1 flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all ${activeTab === 'start' ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50/10' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                        >
                            <CalendarIcon className={`w-4 h-4 ${activeTab === 'start' ? 'text-purple-600' : 'text-gray-400'}`} />
                            <input
                                type="text"
                                readOnly
                                value={selectedStartDate ? formatDate(selectedStartDate) : ''}
                                placeholder="Start date"
                                className="bg-transparent outline-none text-sm w-full cursor-pointer text-gray-700 font-medium placeholder:font-normal"
                            />
                        </div>
                        <div
                            onClick={() => setActiveTab('due')}
                            className={`flex-1 flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all ${activeTab === 'due' ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50/10' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                        >
                            <CalendarIcon className={`w-4 h-4 ${activeTab === 'due' ? 'text-purple-600' : 'text-gray-400'}`} />
                            <div className="w-px h-4 bg-gray-300 mx-1"></div> {/* Separator visual from image */}
                            <input
                                type="text"
                                readOnly
                                value={selectedDueDate ? formatDate(selectedDueDate) : ''}
                                placeholder="Due date"
                                className="bg-transparent outline-none text-sm w-full cursor-pointer text-gray-700 font-medium placeholder:font-normal"
                            />
                        </div>
                    </div>

                    {/* Month Header */}
                    <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-2 font-bold text-gray-900">
                            {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            <span className="text-xs font-normal text-gray-400 cursor-pointer hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100">Today</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
                            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-y-1">
                        {renderCalendar()}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-auto pt-4 flex justify-between items-center">
                        <button onClick={() => { onSelect('', 'due'); onSelect('', 'start'); onClose(); }} className="text-xs font-medium text-gray-400 hover:text-gray-600">
                            Clear
                        </button>
                        {/* Done button removed to match image style usually, or can stay. Image shows 'Clear' and 'Recurring' at bottom, no explicit Done but standard for these is clicking outside or date. We keep standard actions or match exactly? 
                             The image shows "Set Recurring" on left bottom of sidebar. 
                             The bottom of calendar area is empty in one image, shows "Clear" and "Done" in another. 
                             I'll stick to a clean look.
                         */}
                    </div>
                </div>
            </div>
        </div>
    );
};
