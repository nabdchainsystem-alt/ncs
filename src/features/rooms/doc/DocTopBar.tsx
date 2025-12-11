import React from 'react';
import {
    Star,
    MessageSquare,
    MoreHorizontal,
    Sparkles,
    PanelLeftClose,
    Unlock,
    Plus
} from 'lucide-react';
import { Theme } from './types';

interface TopBarProps {
    theme: Theme;
    toggleTheme: () => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

export const DocTopBar: React.FC<TopBarProps> = ({ theme, toggleTheme, isSidebarOpen, toggleSidebar }) => {
    return (
        <header className="h-12 flex items-center justify-between px-4 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 sticky top-0 z-10">

            {/* Left: Breadcrumbs & Sidebar Toggle */}
            <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                {isSidebarOpen && (
                    <button
                        onClick={toggleSidebar}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors me-2"
                        title="Close sidebar"
                    >
                        <PanelLeftClose size={16} />
                    </button>
                )}



                <div className="flex items-center gap-1.5 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer transition-colors">
                    <span className="font-medium">maxxx</span>
                </div>
                <span className="text-stone-300 dark:text-stone-700">/</span>
                <div className="flex items-center gap-1.5 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer transition-colors">
                    <span className="opacity-70">List</span>
                </div>
                <span className="text-stone-300 dark:text-stone-700">/</span>
                <div className="flex items-center gap-1.5 text-stone-900 dark:text-stone-100 font-medium cursor-pointer">
                    <span className="text-blue-500">📄</span>
                    <span>Doc</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-3">
                {/* Edit Status */}
                <span className="hidden md:flex text-xs text-stone-400 items-center gap-1 me-2">
                    <Unlock size={12} />
                    <span>Edited 2m ago</span>
                </span>

                <button className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-900/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium rounded-full hover:shadow-sm transition-all border border-indigo-100 dark:border-indigo-900/50">
                    <Sparkles size={12} className="text-indigo-500" />
                    Ask AI
                </button>

                <div className="h-4 w-[1px] bg-stone-200 dark:bg-stone-800 mx-1 hidden sm:block"></div>

                <button className="p-1.5 text-stone-400 hover:text-amber-500 hover:bg-stone-50 dark:hover:bg-stone-800 rounded transition-colors">
                    <Star size={16} />
                </button>

                <button className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 rounded transition-colors">
                    <MessageSquare size={16} />
                </button>

                <button
                    onClick={toggleTheme}
                    className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 rounded transition-colors"
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                    )}
                </button>

                <button className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 rounded transition-colors">
                    <MoreHorizontal size={16} />
                </button>
            </div>
        </header>
    );
};
