import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronRight as ChevronRightSmall } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface TaskDatePickerProps {
  onSelectDate: (date: Date) => void;
  onClose: () => void;

}

export const TaskDatePicker: React.FC<TaskDatePickerProps> = ({ onSelectDate, onClose }) => {
  const { t, language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const calendar = [];

    // Padding
    for (let i = 0; i < firstDay; i++) {
      calendar.push(null);
    }

    // Days
    for (let i = 1; i <= days; i++) {
      calendar.push(i);
    }

    return calendar;
  };

  const handleShortcut = (type: string) => {
    const today = new Date();
    let target = new Date();

    switch (type) {
      case 'today':
        break;
      case 'tomorrow':
        target.setDate(today.getDate() + 1);
        break;
      case 'thisWeekend':
        const daysToSat = 6 - today.getDay();
        target.setDate(today.getDate() + (daysToSat <= 0 ? 7 : daysToSat));
        break;
      case 'nextWeek':
        target.setDate(today.getDate() + (8 - today.getDay())); // Next Monday
        break;
      case 'nextWeekend':
        // Logic for next weekend
        const nextSat = 6 - today.getDay() + 7;
        target.setDate(today.getDate() + nextSat);
        break;
      case 'twoWeeks':
        target.setDate(today.getDate() + 14);
        break;
      case 'fourWeeks':
        target.setDate(today.getDate() + 28);
        break;
    }
    onSelectDate(target);
    onClose();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const weekDays = language === 'ar'
    ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="absolute top-8 end-0 z-50 bg-white dark:bg-stone-900 shadow-xl border border-stone-200 dark:border-stone-800 rounded-lg flex overflow-hidden w-[500px] max-w-[90vw] text-stone-800 dark:text-stone-200 font-sans animate-in fade-in zoom-in-95 duration-100">

      {/* Sidebar Shortcuts */}
      <div className="w-40 bg-stone-50 dark:bg-stone-900 border-e border-stone-100 dark:border-stone-800 p-2 flex flex-col gap-1 overflow-y-auto max-h-[350px]">
        {[
          { key: 'today', label: t('discussion.date_picker.today'), sub: new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en-US', { weekday: 'short' }) },
          { key: 'later', label: t('discussion.date_picker.later'), sub: '11:46 pm' }, // Static for demo
          { key: 'tomorrow', label: t('discussion.date_picker.tomorrow'), sub: new Date(Date.now() + 86400000).toLocaleDateString(language === 'ar' ? 'ar' : 'en-US', { weekday: 'short' }) },
          { key: 'thisWeekend', label: t('discussion.date_picker.this_weekend'), sub: 'Sat' },
          { key: 'nextWeek', label: t('discussion.date_picker.next_week'), sub: 'Mon' },
          { key: 'nextWeekend', label: t('discussion.date_picker.next_weekend'), sub: '' },
          { key: 'twoWeeks', label: t('discussion.date_picker.two_weeks'), sub: '' },
          { key: 'fourWeeks', label: t('discussion.date_picker.four_weeks'), sub: '' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => handleShortcut(item.key)}
            className="flex items-center justify-between px-3 py-2 text-xs hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-start transition-colors"
          >
            <span>{item.label}</span>
            <span className="text-stone-400">{item.sub}</span>
          </button>
        ))}

        <div className="mt-auto pt-2 border-t border-stone-200 dark:border-stone-800">
          <button className="flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-start">
            <span>{t('discussion.date_picker.set_recurring')}</span>
            <ChevronRightSmall size={12} className="rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* Main Calendar */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-sm">
            {currentMonth.toLocaleDateString(language === 'ar' ? 'ar' : 'en-US', { month: 'long', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500">
              <ChevronLeft size={16} className="rtl:rotate-180" />
            </button>
            <button onClick={nextMonth} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500">
              <ChevronRight size={16} className="rtl:rotate-180" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDays.map(d => (
            <span key={d} className="text-xs text-stone-400 font-medium">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {generateCalendar().map((day, idx) => {
            if (!day) return <div key={idx} />;
            const isToday = day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();

            return (
              <button
                key={idx}
                onClick={() => {
                  const d = new Date(currentMonth);
                  d.setDate(day);
                  onSelectDate(d);
                  onClose();
                }}
                className={`
                  w-8 h-8 rounded-full text-xs flex items-center justify-center transition-colors mx-auto
                  ${isToday
                    ? 'bg-red-500 text-white'
                    : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};