import React, { useState } from 'react';
import { Task } from './types';
import { Status, STATUS_COLORS, Priority, PRIORITY_COLORS } from '../../types/shared';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Flag } from 'lucide-react';

interface CalendarViewProps {
    tasks: Task[];
    isLoading: boolean;
    onAddTask: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, isLoading, onAddTask }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const today = () => setCurrentDate(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getTasksForDay = (day: Date) => {
        return tasks.filter(task => {
            if (!task.dueDate) return false;
            return isSameDay(new Date(task.dueDate), day);
        });
    };

    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center">Loading calendar...</div>;
    }

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden h-full">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center bg-gray-100 rounded-md p-0.5">
                        <button onClick={prevMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all">
                            <ChevronLeft size={16} className="text-gray-600" />
                        </button>
                        <button onClick={today} className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-white rounded shadow-sm transition-all mx-1">
                            Today
                        </button>
                        <button onClick={nextMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all">
                            <ChevronRight size={16} className="text-gray-600" />
                        </button>
                    </div>
                </div>
                <button
                    onClick={onAddTask}
                    className="px-4 py-2 bg-clickup-purple text-white rounded-md text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center"
                >
                    <Plus size={16} className="mr-2" /> Add Task
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-gray-200">
                    {weekDays.map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-200 gap-px border-b border-gray-200">
                    {days.map((day, idx) => {
                        const dayTasks = getTasksForDay(day);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={day.toString()}
                                className={`bg-white min-h-[100px] p-2 flex flex-col group relative hover:bg-gray-50 transition-colors ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : ''}`}
                                onClick={() => { /* Could open add task modal pre-filled with date */ }}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-clickup-purple text-white shadow-md' : 'text-gray-700'}`}>
                                        {format(day, 'd')}
                                    </span>
                                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-400 transition-opacity">
                                        <Plus size={12} />
                                    </button>
                                </div>

                                <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                    {dayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className="px-2 py-1 rounded text-xs font-medium truncate border-l-2 shadow-sm cursor-pointer hover:opacity-80 transition-opacity bg-white border-gray-200 flex items-center"
                                            style={{ borderLeftColor: STATUS_COLORS[task.status] }}
                                        >
                                            {task.priority !== Priority.None && (
                                                <Flag size={10} className="mr-1 flex-shrink-0" fill={PRIORITY_COLORS[task.priority]} color={PRIORITY_COLORS[task.priority]} />
                                            )}
                                            <span className="truncate">{task.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
