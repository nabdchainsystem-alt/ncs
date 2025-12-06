import React, { useState } from 'react';
import { DatePicker } from '../../tasks/components/DatePicker';
import { goalsService, Goal } from '../goalsService';

interface CreateGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoalCreated?: (goal: Goal) => void;
}

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ isOpen, onClose, onGoalCreated }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Work');
    const [date, setDate] = useState('');
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [description, setDescription] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!title.trim()) return;

        const newGoalData: Omit<Goal, 'id'> = {
            title,
            category,
            dueDate: date || new Date().toISOString().split('T')[0],
            progress: 0,
            subGoals: [],
            status: 'on-track',
            priority,
            impact: 'Medium',
            description
        };

        try {
            const savedGoal = await goalsService.createGoal(newGoalData);
            if (onGoalCreated) onGoalCreated(savedGoal);

            // Reset and close
            setTitle('');
            setCategory('Work');
            setDate('');
            setPriority('Medium');
            setDescription('');
            onClose();
        } catch (error) {
            console.error("Failed to save goal", error);
            alert("Failed to save goal. Please check the server connection.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" onClick={() => { onClose(); setShowDatePicker(false); }}></div>
            <div className="relative w-full max-w-[600px] bg-white p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in zoom-in-95 duration-300 rounded-[2px]" onClick={() => setShowDatePicker(false)}>

                <h2 className="text-[32px] font-serif text-gray-900 leading-tight mb-2">Create New Goal</h2>
                <p className="text-[16px] text-gray-500 italic font-serif mb-10">What's the next big milestone?</p>

                <div className="space-y-8" onClick={(e) => e.stopPropagation()}>
                    {/* GOAL TITLE */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-3">Goal Title</label>
                        <input
                            type="text"
                            className="w-full text-2xl font-serif text-gray-900 pb-2 border-b-2 border-gray-900 focus:border-black focus:outline-none placeholder:text-gray-300"
                            placeholder="Enter goal..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-12">
                        {/* CATEGORY */}
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4">Category</label>
                            <div className="flex flex-col gap-3">
                                {['WORK', 'PERSONAL', 'HEALTH'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat.charAt(0) + cat.slice(1).toLowerCase())}
                                        className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-left w-full transition-all border ${category.toUpperCase() === cat
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-900 hover:text-gray-900'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* PRIORITY */}
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4">Priority</label>
                            <div className="flex flex-col gap-3">
                                {['HIGH', 'MEDIUM', 'LOW'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPriority(p.charAt(0) + p.slice(1).toLowerCase() as any)}
                                        className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-left w-full transition-all border ${priority.toUpperCase() === p
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-900 hover:text-gray-900'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* TARGET DATE - WITH DATE PICKER */}
                    <div className="pt-2 relative">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-3">Target Date</label>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowDatePicker(!showDatePicker); }}
                            className="w-full text-left text-lg font-serif text-gray-900 pb-2 border-b border-gray-200 hover:border-black focus:outline-none transition-colors"
                        >
                            {date ?
                                new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                                : <span className="text-gray-300">MM/DD/YYYY</span>}
                        </button>

                        {showDatePicker && (
                            <div className="absolute top-full left-0 mt-4 z-[60] shadow-2xl">
                                <DatePicker
                                    date={date}
                                    onSelect={(d) => { setDate(d); setShowDatePicker(false); }}
                                    onClose={() => setShowDatePicker(false)}
                                    compact={true}
                                    className="shadow-2xl border border-gray-100"
                                />
                            </div>
                        )}
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-3">Description (Optional)</label>
                        <textarea
                            className="w-full text-base font-serif text-gray-600 pb-2 border-b border-gray-200 focus:border-black focus:outline-none resize-none h-24 bg-transparent"
                            placeholder="Add some context or success criteria..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="flex justify-between items-center pt-8 mt-4">
                        <button
                            onClick={onClose}
                            className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-4 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors shadow-lg"
                        >
                            Save Goal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
