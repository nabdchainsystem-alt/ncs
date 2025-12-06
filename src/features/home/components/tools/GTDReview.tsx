import React, { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';

export const GTDReview = () => {
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

    return (
        <div className="h-full flex flex-col font-serif p-4 pt-0">
            <div className="text-center mb-6 z-10">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block font-sans">Step 4</span>
                <h3 className="text-5xl font-serif text-stone-900 mb-4 tracking-tight italic">Review</h3>
                <p className="text-sm text-stone-500 leading-relaxed font-sans max-w-xl mx-auto">
                    Frequently look over, update, and revise your lists. Do smaller daily reviews and bigger weekly ones.
                </p>
            </div>

            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl text-stone-900 italic">Weekly Checklist</h3>
                <span className="text-xs font-sans tracking-widest text-stone-400">
                    {Math.round((checklist.filter(i => i.checked).length / checklist.length) * 100)}% DONE
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                {checklist.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        className="flex items-center p-3 cursor-pointer group hover:bg-stone-100/50 transition-colors"
                    >
                        <div className={`mr-4 transition-colors ${item.checked ? 'text-stone-400' : 'text-stone-300 group-hover:text-stone-500'}`}>
                            {item.checked ? <CheckSquare size={20} strokeWidth={1.5} /> : <Square size={20} strokeWidth={1.5} />}
                        </div>
                        <span className={`text-lg transition-all ${item.checked ? 'text-stone-400 line-through decoration-stone-300' : 'text-stone-700'}`}>
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>

            <p className="mt-6 text-sm text-stone-400 italic text-center border-t border-stone-200 pt-4">
                "Your mind is for having ideas, not holding them."
            </p>
        </div>
    );
};
