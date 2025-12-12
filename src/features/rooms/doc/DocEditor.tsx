import React, { useState } from 'react';
import {
    FileText,
    Table,
    Columns,
    List,
    File,
    ArrowUpRight,
    Link,
    Plus,
    Type,
    Image as ImageIcon,
    Heading,
    MoreHorizontal,
    PanelRight,
    ArrowLeftRight,
    Wand2,
    SquareArrowUp
} from 'lucide-react';

export const DocEditor: React.FC = () => {
    const [title, setTitle] = useState('');
    const [isTitleFocused, setIsTitleFocused] = useState(false);
    const [hasStartedWriting, setHasStartedWriting] = useState(false);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const handleStartWriting = () => {
        setHasStartedWriting(true);
        // Small timeout to allow render
        setTimeout(() => {
            if (contentRef.current) {
                contentRef.current.focus();
            }
        }, 10);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleStartWriting();
        }
    };

    return (
        <div className="w-full min-h-full pb-32 flex flex-col items-center">

            {/* Right Floating Toolbar (Visual Only) */}
            <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-20 text-stone-300">
                <ToolButton icon={<PanelRight size={20} strokeWidth={1.5} />} label="Sidebar" />
                <ToolButton icon={<Type size={20} strokeWidth={1.5} />} label="Typography" />
                <ToolButton icon={<ArrowLeftRight size={20} strokeWidth={1.5} />} label="Connections" />
                <ToolButton icon={<Wand2 size={20} strokeWidth={1.5} />} label="AI Assistant" />
                <ToolButton icon={<SquareArrowUp size={20} strokeWidth={1.5} />} label="Share" />
            </div>

            <div className="w-full max-w-4xl px-8 sm:px-16 py-12 sm:py-20 relative animate-in fade-in duration-500">

                {/* Top Actions */}
                <div className="mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-4 text-sm text-stone-400">
                    <button className="flex items-center gap-1.5 hover:text-stone-700 dark:hover:text-stone-300 transition-colors">
                        <Link size={14} />
                        <span>Link Task or Doc</span>
                    </button>
                </div>

                {/* Title Area */}
                <div className="group relative mb-6">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onFocus={() => setIsTitleFocused(true)}
                        onBlur={() => setIsTitleFocused(false)}
                        className="w-full bg-transparent text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-700 outline-none border-none p-0 leading-tight"
                        placeholder="Untitled"
                        onKeyDown={handleTitleKeyDown}
                    />
                    {/* Add icon/cover hint - visible on hover or empty */}
                    <div className={`absolute -top-8 left-0 flex items-center gap-2 text-stone-400 text-sm transition-opacity ${isTitleFocused ? 'opacity-0 pointer-events-none' : (!title ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}`}>
                        <button className="hover:bg-stone-100 dark:hover:bg-stone-800 px-2 py-1 rounded flex items-center gap-1.5 transition-colors">
                            <span className="text-base">☺</span> Add icon
                        </button>
                        <button className="hover:bg-stone-100 dark:hover:bg-stone-800 px-2 py-1 rounded flex items-center gap-1.5 transition-colors">
                            <ImageIcon size={14} /> Add cover
                        </button>
                    </div>
                </div>

                {/* Initial Setup State */}
                {!hasStartedWriting && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-10 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">A</div>
                                <span className="text-stone-400">Owners:</span>
                                <span className="text-stone-800 dark:text-stone-200">You</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-stone-400">Last Updated:</span>
                                <span className="text-stone-800 dark:text-stone-200">Today at 2:01 pm</span>
                            </div>
                        </div>

                        {/* Quick Actions (Empty State) */}
                        <div className="space-y-1 mb-12">
                            <QuickActionItem
                                icon={<FileText size={16} />}
                                label="Start writing"
                                active
                                onClick={handleStartWriting}
                            />
                            <QuickActionItem icon={<File size={16} />} label="Blank wiki" />
                        </div>

                        {/* Add New Section */}
                        <div className="mt-8">
                            <div className="text-sm font-medium text-stone-500 mb-3 px-2">Add new</div>
                            <div className="flex flex-col gap-1">
                                <AddItem icon={<Table size={20} strokeWidth={1.5} />} label="Table" />
                                <AddItem icon={<Columns size={20} strokeWidth={1.5} />} label="Column" />
                                <AddItem icon={<List size={20} strokeWidth={1.5} />} label="ClickUp List" />
                                <AddItem icon={<FileText size={20} strokeWidth={1.5} />} label="Subpage" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Writing Content State */}
                {hasStartedWriting && (
                    <div className="animate-in fade-in duration-500 mt-4">
                        <div
                            ref={contentRef}
                            contentEditable
                            className="w-full min-h-[50vh] outline-none text-lg text-stone-800 dark:text-stone-200 leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-stone-400 cursor-text"
                            data-placeholder="Type '/' for commands"
                            onKeyDown={(e) => {
                                if (e.key === 'Backspace' && e.currentTarget.textContent === '') {
                                    // Optional: Could go back to setup state if desired, but sticking to simple flow for now
                                }
                            }}
                        />
                    </div>
                )}

            </div>

            {/* Bottom Status / Footer */}
            <div className="fixed bottom-4 right-6 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full shadow-sm text-xs text-stone-500 z-20">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="font-medium text-stone-700 dark:text-stone-300">1</span>
                <button className="hover:bg-stone-100 dark:hover:bg-stone-700 rounded p-0.5">
                    <ArrowUpRight size={12} />
                </button>
            </div>

        </div>
    );
};

// Sub-components for cleaner code
const QuickActionItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`
        flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all
        ${active
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium'
                : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:text-stone-800 dark:hover:text-stone-200'}
    `}>
        <span className="text-stone-400 dark:text-stone-500">{icon}</span>
        <span>{label}</span>
    </div>
);

const AddItem = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <div className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800/50 cursor-pointer transition-colors group">
        <span className="text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300 transition-colors">
            {icon}
        </span>
        <span className="text-stone-600 dark:text-stone-300 font-medium text-[15px]">{label}</span>
    </div>
);

const ToolButton = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <div className="group relative">
        <button className="p-1 text-stone-300 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            {icon}
        </button>
        <span className="absolute right-full top-1/2 -translate-y-1/2 mr-4 px-2 py-1 bg-stone-900 text-stone-100 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {label}
        </span>
    </div>
);
