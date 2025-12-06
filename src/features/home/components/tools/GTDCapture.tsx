import React, { useState } from 'react';
import { Plus, Inbox, CheckCircle2, Briefcase, Clock, Calendar, BookOpen } from 'lucide-react';
import { GTDItem, Project } from '../GTDSystemWidget';

interface GTDCaptureProps {
    items: GTDItem[];
    projects: Project[];
    onCapture: (text: string) => void;
    onSelect: (id: number) => void;
}

export const GTDCapture = ({ items, projects, onCapture, onSelect }: GTDCaptureProps) => {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onCapture(text);
            setText('');
        }
    };

    // Filter items for display
    const inboxItems = items.filter(i => i.status === 'inbox').sort((a, b) => b.createdAt - a.createdAt);
    const taskItems = items.filter(i => i.status === 'actionable').sort((a, b) => b.createdAt - a.createdAt);
    const waitingItems = items.filter(i => i.status === 'waiting').sort((a, b) => b.createdAt - a.createdAt);

    // We only show top 3-5 items per category to keep it clean, or all? 
    // User wants "capture he will put all his thoughts... organized in categories"
    // Let's show all but maybe limited height scrollable areas if many.

    const Section = ({ title, icon: Icon, data, type = 'item', color = 'text-stone-900' }: any) => {
        if (data.length === 0) return null;

        return (
            <div className="mb-6 animate-fade-in-up">
                <div className={`flex items-center gap-2 mb-3 px-2 ${color}`}>
                    <Icon size={16} className="opacity-70" />
                    <span className="text-xs font-bold uppercase tracking-wider font-sans">{title} ({data.length})</span>
                </div>
                <div className="space-y-2 pl-2">
                    {data.map((obj: any) => (
                        <div
                            key={obj.id}
                            onClick={() => type === 'item' ? onSelect(obj.id) : null}
                            className="bg-white/50 p-3 rounded-lg border border-stone-100 hover:border-stone-200 hover:bg-white transition-all cursor-pointer flex items-center justify-between group"
                        >
                            <span className="text-stone-700 font-medium group-hover:text-stone-900 line-clamp-1 text-sm font-sans">
                                {type === 'project' ? obj.name : obj.text}
                            </span>
                            {type === 'item' && (
                                <span className="text-[10px] uppercase font-bold text-stone-300 group-hover:text-stone-400 font-sans tracking-wider">
                                    {obj.status}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col font-serif p-8 max-w-4xl mx-auto w-full">
            {/* Capture Input - Minimalist */}
            <div className="flex-none mb-12">
                <div className="text-center mb-10">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 block font-sans">Daily Mind Sweep</span>
                    <h3 className="text-5xl font-serif text-stone-900 mb-4 tracking-tighter italic">Capture</h3>
                </div>

                <form onSubmit={handleSubmit} className="relative w-full">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write it down..."
                        className="w-full bg-transparent border-b-2 border-stone-200 px-4 py-4 text-3xl font-serif italic text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-800 transition-colors text-center"
                        autoFocus
                    />
                    <div className="mt-2 text-center">
                        <span className="text-[10px] text-stone-400 font-sans tracking-wider uppercase">Press Enter to Save</span>
                    </div>
                </form>
            </div>

            {/* Simple Notepad List (Inbox Only) */}
            <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto pr-2">
                {inboxItems.length > 0 ? (
                    <div className="space-y-0">
                        {/* Header Line */}
                        <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-4">
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Inbox ({inboxItems.length})</span>
                            <span className="text-[10px] text-stone-300 italic">Unprocessed</span>
                        </div>

                        {inboxItems.map((item) => (
                            <div key={item.id} onClick={() => onSelect(item.id)} className="group py-4 border-b border-stone-100 flex items-center justify-between hover:bg-stone-50/50 transition-colors px-2 cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-stone-300 group-hover:bg-stone-800 transition-colors"></div>
                                    <span className="text-xl font-serif text-stone-600 group-hover:text-stone-900 italic">{item.text}</span>
                                </div>
                                <span className="text-[10px] font-mono text-stone-300 group-hover:text-stone-400 opacity-0 group-hover:opacity-100 transition-all">
                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 opacity-20">
                        <div className="text-6xl font-serif italic text-stone-400 mb-4">Empty</div>
                        <p className="text-sm font-sans tracking-widest uppercase">Your mind is clear</p>
                    </div>
                )}
            </div>
        </div>
    );
};
