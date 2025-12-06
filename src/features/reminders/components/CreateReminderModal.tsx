import React, { useState } from 'react';
import { DatePicker } from '../../tasks/components/DatePicker';
import { remindersService } from '../remindersService';
import { Bell, Clock, AlertCircle } from 'lucide-react';

interface CreateReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateReminderModal: React.FC<CreateReminderModalProps> = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState('');
    const [priority, setPriority] = useState<'none' | 'low' | 'medium' | 'high'>('none');
    const [showDatePicker, setShowDatePicker] = useState(false);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!title.trim()) return;

        remindersService.addReminder({
            title,
            notes,
            dueDate: date || 'Today',
            priority,
            listId: 'inbox',
            tags: [],
            completed: false,
            subtasks: []
        });

        // Reset and close
        setTitle('');
        setNotes('');
        setDate('');
        setPriority('none');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" onClick={() => { onClose(); setShowDatePicker(false); }}></div>
            <div className="relative w-full max-w-[500px] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in zoom-in-95 duration-300 rounded-2xl border border-stone-100" onClick={() => setShowDatePicker(false)}>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-stone-100 rounded-xl text-stone-900">
                        <Bell size={20} />
                    </div>
                    <h2 className="text-2xl font-serif text-stone-900">Set Reminder</h2>
                </div>

                <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
                    {/* TITLE */}
                    <div>
                        <input
                            type="text"
                            className="w-full text-xl font-serif text-stone-900 pb-2 border-b border-stone-200 focus:border-stone-900 focus:outline-none placeholder:text-stone-300 transition-colors"
                            placeholder="Remind me to..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-4">
                        {/* DATE */}
                        <div className="flex-1 relative">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">When</label>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowDatePicker(!showDatePicker); }}
                                className="w-full flex items-center gap-2 p-3 bg-stone-50 hover:bg-stone-100 rounded-lg text-sm text-stone-700 font-medium transition-colors text-left"
                            >
                                <Clock size={14} className="text-stone-400" />
                                {date ? new Date(date).toLocaleDateString() : 'Today'}
                            </button>

                            {showDatePicker && (
                                <div className="absolute top-full left-0 mt-2 z-[60] shadow-xl">
                                    <DatePicker
                                        date={date}
                                        onSelect={(d) => { setDate(d); setShowDatePicker(false); }}
                                        onClose={() => setShowDatePicker(false)}
                                        compact={true}
                                        className="shadow-xl border border-stone-100"
                                    />
                                </div>
                            )}
                        </div>

                        {/* PRIORITY */}
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">Priority</label>
                            <div className="flex bg-stone-50 rounded-lg p-1">
                                {(['none', 'high'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPriority(p)}
                                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${priority === p
                                            ? 'bg-white shadow-sm text-stone-900'
                                            : 'text-stone-400 hover:text-stone-600'
                                            }`}
                                    >
                                        {p === 'none' ? 'Normal' : 'Urgent'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* NOTES */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">Notes</label>
                        <textarea
                            className="w-full text-sm font-sans text-stone-600 p-3 bg-stone-50 rounded-lg border border-transparent focus:bg-white focus:border-stone-200 focus:outline-none resize-none h-20 transition-all placeholder:text-stone-300"
                            placeholder="Add details..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        ></textarea>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-black rounded-xl shadow-lg transition-colors flex items-center gap-2"
                        >
                            <Bell size={14} className="text-stone-300" />
                            Set Reminder
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
