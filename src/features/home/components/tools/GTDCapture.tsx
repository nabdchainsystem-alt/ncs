import React, { useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';

interface GTDCaptureProps {
    inbox: { id: number; text: string; createdAt: number }[];
    onCapture: (text: string) => void;
    onSelect: (item: { id: number; text: string }) => void;
}

export const GTDCapture = ({ inbox, onCapture, onSelect }: GTDCaptureProps) => {
    const [input, setInput] = useState('');
    const [activeTab, setActiveTab] = useState<'today' | 'yesterday'>('today');

    const handleAdd = () => {
        if (!input.trim()) return;
        onCapture(input);
        setInput('');
    };

    // Filter items based on tab
    const filteredInbox = inbox.filter(item => {
        const itemDate = new Date(item.createdAt);
        const today = new Date();
        const isToday = itemDate.getDate() === today.getDate() &&
            itemDate.getMonth() === today.getMonth() &&
            itemDate.getFullYear() === today.getFullYear();

        return activeTab === 'today' ? isToday : !isToday;
    });

    return (
        <div className="h-full w-full flex font-serif bg-stone-50/30">
            {/* Left Sidebar: Inbox History */}
            <div className="w-[400px] h-full flex flex-col z-20 bg-white border-r border-stone-100 flex-shrink-0">
                <div className="flex items-center p-6 border-b border-stone-50">
                    <div className="flex items-center bg-stone-100/50 rounded-lg p-1 w-full">
                        <button
                            onClick={() => setActiveTab('today')}
                            className={`flex-1 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-md transition-all ${activeTab === 'today'
                                ? 'bg-white text-stone-900 shadow-sm'
                                : 'text-stone-400 hover:text-stone-600'
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setActiveTab('yesterday')}
                            className={`flex-1 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-md transition-all ${activeTab === 'yesterday'
                                ? 'bg-white text-stone-900 shadow-sm'
                                : 'text-stone-400 hover:text-stone-600'
                                }`}
                        >
                            Yesterday
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto w-full px-6 py-4 space-y-1 scrollbar-hide">
                    {filteredInbox.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-stone-300">
                            <span className="italic">No items yet</span>
                        </div>
                    ) : (
                        filteredInbox.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => onSelect(item)}
                                className="group w-full text-left py-4 border-b border-stone-100 hover:bg-stone-50 transition-colors px-2 -mx-2 rounded-lg cursor-pointer"
                            >
                                <p className="text-stone-700 font-serif text-lg leading-snug group-hover:text-stone-900 transition-colors line-clamp-2">
                                    {item.text}
                                </p>
                                <span className="text-[10px] text-stone-400 font-sans tracking-wider mt-1 block opacity-0 group-hover:opacity-100 transition-opacity">
                                    Process Item →
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Area: Capture Input */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 relative bg-white">
                <div className="w-full max-w-2xl flex flex-col items-center justify-center h-full pb-20">
                    <div className="mb-16 animate-fade-in-up text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 text-stone-900 font-bold font-sans text-sm mb-6 shadow-inner">
                            1
                        </div>
                        <h3 className="text-8xl font-serif text-stone-900 mb-6 tracking-tighter italic">Capture</h3>
                        <p className="text-lg text-stone-500 font-sans leading-relaxed max-w-lg mx-auto font-light">
                            Clear your mind. Type anything here, big or small. <br />It all goes to your inbox for later processing.
                        </p>
                    </div>

                    <div className="relative group w-full max-w-xl">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                placeholder="What's on your mind?"
                                className="w-full px-0 py-6 text-4xl bg-transparent border-b-2 border-stone-200 focus:border-stone-900 focus:outline-none placeholder-stone-300 text-stone-900 font-serif text-center transition-all duration-300 placeholder:italic focus:placeholder-stone-200"
                                autoFocus
                            />
                            <button
                                onClick={handleAdd}
                                className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 transition-transform active:scale-95 p-4"
                            >
                                <Plus size={32} strokeWidth={1} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

