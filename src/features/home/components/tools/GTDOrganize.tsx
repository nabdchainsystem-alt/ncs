import React from 'react';
import { Folder, Phone, Monitor, Briefcase, User, Calendar } from 'lucide-react';

export const GTDOrganize = () => {
    const contexts = [
        { id: 1, name: 'Calls', icon: Phone, count: 2, color: 'bg-blue-100 text-blue-600' },
        { id: 2, name: 'Computer', icon: Monitor, count: 5, color: 'bg-indigo-100 text-indigo-600' },
        { id: 3, name: 'Office', icon: Briefcase, count: 3, color: 'bg-orange-100 text-orange-600' },
        { id: 4, name: 'Errands', icon: User, count: 1, color: 'bg-green-100 text-green-600' },
    ];

    const projects = [
        { id: 1, name: 'Q3 Report', status: 'In Progress' },
        { id: 2, name: 'Website Redesign', status: 'Planning' },
        { id: 3, name: 'Team Offsite', status: 'Waiting' },
    ];

    return (
        <div className="h-full grid grid-cols-2 gap-12 p-4 pt-0 font-serif">
            <div className="col-span-2 text-center mb-6 z-10">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block font-sans">Step 3</span>
                <h3 className="text-5xl font-serif text-stone-900 mb-4 tracking-tight italic">Organize</h3>
                <p className="text-sm text-stone-500 leading-relaxed font-sans max-w-xl mx-auto">
                    Put everything in the right place: Add dates to your calendar, delegate action items, file away reference materials, sort your tasks, and more.
                </p>
            </div>

            <div className="flex flex-col">
                <h3 className="text-xs font-bold text-stone-400 mb-6 uppercase tracking-widest font-sans flex items-center gap-2">
                    <Folder size={14} /> Contexts
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    {contexts.map((ctx) => (
                        <div key={ctx.id} className="p-4 rounded-none border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer group bg-stone-50">
                            <div className="flex items-center justify-between mb-2">
                                <ctx.icon size={20} className="text-stone-400 group-hover:text-stone-800 transition-colors" strokeWidth={1.5} />
                                <span className="text-xs text-stone-400 font-sans">{ctx.count}</span>
                            </div>
                            <p className="text-lg text-stone-700 italic group-hover:text-stone-900">{ctx.name}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col">
                <h3 className="text-xs font-bold text-stone-400 mb-6 uppercase tracking-widest font-sans flex items-center gap-2">
                    <Folder size={14} /> Projects
                </h3>
                <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                    {projects.map((proj) => (
                        <div key={proj.id} className="flex items-center justify-between p-3 border-b border-stone-200 hover:border-stone-400 transition-colors">
                            <span className="text-lg text-stone-700 italic">{proj.name}</span>
                            <span className="text-[10px] uppercase tracking-wider font-sans text-stone-400">
                                {proj.status}
                            </span>
                        </div>
                    ))}
                    <button className="w-full py-3 border border-dashed border-stone-300 text-stone-400 text-sm italic hover:border-stone-500 hover:text-stone-600 transition-colors mt-2">
                        + New Project
                    </button>
                </div>
            </div>
        </div>
    );
};
