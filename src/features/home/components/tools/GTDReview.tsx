import React, { useState } from 'react';
import { CheckSquare, Square, ListChecks, RefreshCw } from 'lucide-react';
import { GTDItem } from '../GTDSystemWidget';

interface GTDReviewProps {
    items: GTDItem[];
}

export const GTDReview = ({ items }: GTDReviewProps) => {
    const [checklist, setChecklist] = useState([
        { id: 1, text: 'Collect Loose Papers and Materials', checked: false },
        { id: 2, text: 'Get "In" to Zero', checked: false },
        { id: 3, text: 'Empty Your Head', checked: false },
        { id: 4, text: 'Review "Next Actions" Lists', checked: false },
        { id: 5, text: 'Review "Waiting For" List', checked: false },
        { id: 6, text: 'Review "Projects" (and Larger Outcomes)', checked: false },
        { id: 7, text: 'Review "Someday/Maybe" List', checked: false },
    ]);

    const toggle = (id: number) => {
        setChecklist(checklist.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const progress = Math.round((checklist.filter(i => i.checked).length / checklist.length) * 100);

    return (
        <div className="h-full flex flex-col font-serif">
            {/* Header */}
            <div className="flex-none text-center mb-8">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block font-sans">Step 4</span>
                <h3 className="text-4xl font-serif text-stone-900 mb-2 tracking-tight italic">Reflect</h3>
                <p className="text-sm text-stone-500 font-sans max-w-xl mx-auto">
                    Weekly Review: Clear the decks.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="max-w-xl mx-auto">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-2">
                            <ListChecks size={18} className="text-stone-400" />
                            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 font-sans">Weekly Review Checklist</h4>
                        </div>
                        <span className="text-xs font-bold font-sans text-stone-400 bg-stone-100 px-2 py-1 rounded-full">{progress}% Complete</span>
                    </div>

                    <div className="space-y-2">
                        {checklist.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => toggle(item.id)}
                                className={`flex items-start p-4 cursor-pointer group transition-all rounded-xl border ${item.checked
                                        ? 'bg-stone-50 border-stone-100'
                                        : 'bg-white border-stone-200 hover:border-stone-400 shadow-sm hover:shadow-md'
                                    }`}
                            >
                                <div className={`mr-4 pt-1 transition-colors ${item.checked ? 'text-stone-300' : 'text-stone-800'}`}>
                                    {item.checked ? <CheckSquare size={22} strokeWidth={1.5} /> : <Square size={22} strokeWidth={1.5} />}
                                </div>
                                <div>
                                    <span className={`text-lg transition-all font-serif italic ${item.checked ? 'text-stone-400 line-through decoration-stone-300' : 'text-stone-800'}`}>
                                        {item.text}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {progress === 100 && (
                        <div className="mt-8 text-center animate-fade-in-up">
                            <button onClick={() => setChecklist(checklist.map(i => ({ ...i, checked: false })))} className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl shadow-lg hover:bg-black transition-colors">
                                <RefreshCw size={16} />
                                <span className="font-bold text-sm">Start New Week</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-6 text-sm text-stone-300 italic text-center pt-4 mb-2">
                "Your mind is for having ideas, not holding them."
            </p>
        </div>
    );
};
