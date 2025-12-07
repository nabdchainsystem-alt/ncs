import React, { useState } from 'react';
import { Plus, Inbox, CheckCircle2, Briefcase, Clock, Calendar, BookOpen, Trash2, X, Check } from 'lucide-react';
import { GTDItem, Project } from '../GTDSystemWidget';

interface GTDCaptureProps {
    items: GTDItem[];
    projects: Project[];
    onCapture: (text: string) => void;
    onSelect: (id: number) => void;
    onDelete: (id: number) => void;
}

export const GTDCapture = ({ items, projects, onCapture, onSelect, onDelete }: GTDCaptureProps) => {
    const [text, setText] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onCapture(text);
            setText('');
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setConfirmDeleteId(id);
    };

    const handleConfirmDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        onDelete(id);
        setConfirmDeleteId(null);
    };

    const handleCancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDeleteId(null);
    };

    // Filter main inbox items (status = 'inbox')
    const inboxItems = items.filter(i => i.status === 'inbox').sort((a, b) => b.createdAt - a.createdAt);

    // Date Helpers
    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isYesterday = (date: Date) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();
    };

    // Filter Items by Date
    const todayItems = inboxItems.filter(i => isToday(new Date(i.createdAt)));
    const yesterdayItems = inboxItems.filter(i => isYesterday(new Date(i.createdAt)));
    const pendingItems = inboxItems.filter(i => !isToday(new Date(i.createdAt)) && !isYesterday(new Date(i.createdAt)));

    // Reusable Column Component
    const InboxColumn = ({ title, items, subtitle, highlight = false }: { title: string, items: typeof inboxItems, subtitle?: string, highlight?: boolean }) => (
        <div className={`flex flex-col h-full relative ${highlight ? 'bg-white/40 shadow-sm ring-1 ring-stone-900/5' : 'bg-transparent'} rounded-[2rem] p-1 transition-all duration-300`}>
            {/* Header */}
            <div className="flex-none flex items-center justify-between px-5 pt-4 pb-2 border-b border-stone-100/50 mb-1 mx-2">
                <div className="flex flex-col gap-0.5">
                    <span className={`text-xs font-bold uppercase tracking-widest ${highlight ? 'text-stone-900' : 'text-stone-400'}`}>{title}</span>
                    {subtitle && <span className="text-[10px] text-stone-300 italic font-medium">{subtitle}</span>}
                </div>
                <span className={`text-[10px] font-extrabold h-5 min-w-[1.25rem] flex items-center justify-center px-1.5 rounded-full ${highlight ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                    {items.length}
                </span>
            </div>

            {/* List - Strictly Limited with Absolute Positioning */}
            <div className="flex-1 relative w-full min-h-0 rounded-b-[2rem] overflow-hidden">
                <div className="absolute inset-0 overflow-y-auto scrollbar-hide px-3 pb-8 pt-1">
                    {items.length > 0 ? (
                        <div className="space-y-1">
                            {items.map((item) => {
                                const isDeleting = confirmDeleteId === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => !isDeleting && onSelect(item.id)}
                                        className={`group relative py-3 px-3 border border-transparent transition-all cursor-pointer rounded-xl flex flex-col gap-1 overflow-hidden 
                                            ${isDeleting ? 'bg-red-50 border-red-100' : 'hover:border-stone-100/50 hover:bg-white/60 hover:shadow-sm'}
                                        `}
                                    >
                                        {isDeleting ? (
                                            <div className="flex items-center justify-between w-full h-full animate-fade-in-right">
                                                <span className="text-xs font-bold text-red-600 uppercase tracking-widest pl-1">Delete item?</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => handleCancelDelete(e)}
                                                        className="p-1 rounded-full bg-stone-200 text-stone-500 hover:bg-stone-300 transition-colors"
                                                    >
                                                        <X size={14} strokeWidth={3} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleConfirmDelete(e, item.id)}
                                                        className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                                                    >
                                                        <Check size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className={`text-base font-serif italic line-clamp-2 leading-snug ${highlight ? 'text-stone-700' : 'text-stone-500'} group-hover:text-stone-900 transition-colors`}>
                                                        {item.text}
                                                    </span>

                                                    {/* Delete Icon - Shows on Hover */}
                                                    <button
                                                        onClick={(e) => handleDeleteClick(e, item.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-all p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg -mr-1 -mt-1"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <span className="text-[9px] font-sans font-bold text-stone-200 group-hover:text-stone-300 uppercase tracking-wider transition-opacity">
                                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 select-none pb-8">
                            <span className="text-3xl font-serif italic text-stone-300 mb-2">~</span>
                            <p className="text-[9px] font-sans tracking-widest uppercase font-bold text-stone-300">Empty</p>
                        </div>
                    )}
                </div>
                {/* Fade Overlay - Pinned to bottom of the relative container */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-stone-50/100 to-transparent pointer-events-none"></div>
            </div>
        </div>
    );

    return (
        <div className="h-full min-h-[600px] flex flex-col font-serif p-6 max-w-[90rem] mx-auto w-full">
            {/* Capture Input - Minimalist & Centered */}
            <div className="flex-none mb-8 text-center relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold font-serif text-stone-900 uppercase tracking-widest mb-6 select-none">
                    Capture
                </h1>
                <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto group">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write it down..."
                        className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 px-6 py-4 text-4xl font-serif italic text-stone-800 placeholder:text-stone-200 focus:placeholder:text-stone-300 focus:outline-none transition-all text-center"
                        autoFocus
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500">
                        <span className="text-[9px] font-bold bg-stone-100 text-stone-400 px-2 py-1 rounded-md uppercase tracking-wider">Enter</span>
                    </div>
                </form>
            </div>

            {/* 3-Column Inbox Grid */}
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 border-t border-stone-100/30 pt-4">

                {/* 1. Yesterday */}
                <InboxColumn
                    title="Yesterday"
                    items={yesterdayItems}
                    subtitle="Review"
                />

                {/* 2. Inbox (Today) */}
                <InboxColumn
                    title="Today"
                    items={todayItems}
                    subtitle="Inbox"
                    highlight
                />

                {/* 3. Pending */}
                <InboxColumn
                    title="Pending"
                    items={pendingItems}
                    subtitle="Backlog"
                />

            </div>
        </div>
    );
};
