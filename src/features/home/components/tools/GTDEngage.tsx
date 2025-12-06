import React from 'react';
import { GTDItem, Project } from '../GTDSystemWidget';
import { Play, Star, Clock, Battery } from 'lucide-react';

interface GTDEngageProps {
    actions: GTDItem[];
    projects: Project[];
}

export const GTDEngage = ({ actions }: GTDEngageProps) => {
    return (
        <div className="h-full flex flex-col font-serif p-4 pt-0">
            <div className="text-center mb-6 z-10">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block font-sans">Step 5</span>
                <h3 className="text-5xl font-serif text-stone-900 mb-4 tracking-tight italic">Engage</h3>
                <p className="text-sm text-stone-500 leading-relaxed font-sans max-w-xl mx-auto">
                    Get to work on the important stuff. Use your system to know exactly what to work on when.
                </p>
            </div>

            <div className="mb-2 flex items-center gap-3 pb-2">
                <div className="text-stone-800">
                    <Play size={20} strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-xl text-stone-900 italic">Next Actions</h3>
                    <p className="text-xs font-sans text-stone-400 tracking-wider uppercase">Prioritized by Context</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 p-1">
                {actions.length === 0 ? (
                    <div className="text-center text-stone-400 mt-10 italic">
                        No next actions defined. Go clarifying!
                    </div>
                ) : (
                    actions.map((action) => (
                        <div key={action.id} className="group flex items-start p-4 bg-white rounded-xl shadow-sm border border-stone-100 hover:shadow-md hover:border-stone-200 transition-all cursor-pointer">
                            <div className="mt-1 mr-4 text-stone-300 group-hover:text-stone-600 transition-colors">
                                <Star size={16} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <p className="text-lg text-stone-800 italic mb-2 group-hover:text-black transition-colors">{action.text}</p>
                                <div className="flex flex-wrap gap-2 text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500">
                                    <span className="flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-md">
                                        {action.contextId}
                                    </span>
                                    {action.time && (
                                        <span className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-md text-stone-400">
                                            <Clock size={10} /> {action.time}
                                        </span>
                                    )}
                                    {action.energy && (
                                        <span className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-md text-stone-400">
                                            <Battery size={10} /> {action.energy}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
