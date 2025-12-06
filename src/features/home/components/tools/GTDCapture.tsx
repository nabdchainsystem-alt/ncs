import React, { useState } from 'react';
import { Plus, Inbox } from 'lucide-react';
import { GTDItem } from '../GTDSystemWidget';

interface GTDCaptureProps {
    inbox: GTDItem[];
    onCapture: (text: string) => void;
    onSelect: (id: number) => void;
}

export const GTDCapture = ({ inbox, onCapture, onSelect }: GTDCaptureProps) => {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onCapture(text);
            setText('');
        }
    };

    return (
        <div className="h-full flex flex-col font-serif">
            {/* Capture Input */}
            <div className="flex-none mb-8">
                <div className="text-center mb-6">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block font-sans">Step 1</span>
                    <h3 className="text-4xl font-serif text-stone-900 mb-2 tracking-tight italic">Capture</h3>
                    <p className="text-sm text-stone-500 font-sans">Get it all out of your head.</p>
                </div>

                <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="What's on your mind?..."
                        className="w-full bg-white border-b-2 border-stone-200 px-6 py-4 text-xl placeholder:text-stone-300 focus:outline-none focus:border-stone-800 transition-colors font-serif italic text-stone-700 bg-transparent"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!text.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-stone-900 disabled:opacity-30 transition-colors"
                    >
                        <Plus size={24} />
                    </button>
                </form>
            </div>

            {/* Inbox List */}
            <div className="flex-1 overflow-hidden flex flex-col max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Inbox size={16} className="text-stone-400" />
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider font-sans">In your inbox ({inbox.length})</span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {inbox.length === 0 ? (
                        <div className="text-center py-12 text-stone-300 italic border-2 border-dashed border-stone-100 rounded-2xl">
                            Your inbox is empty. Clear mind!
                        </div>
                    ) : (
                        inbox.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => onSelect(item.id)}
                                className="group bg-white p-4 rounded-xl border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-300 transition-all cursor-pointer flex items-center justify-between animate-fade-in-up"
                            >
                                <span className="text-lg text-stone-700 italic group-hover:text-stone-900 line-clamp-1">{item.text}</span>
                                <span className="text-xs font-bold text-stone-300 group-hover:text-stone-500 font-sans bg-stone-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                                    PROCESS
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
