import React, { useState, useEffect } from 'react';
import { DocSidebar } from './DocSidebar';
import { DocTopBar } from './DocTopBar';
import { DocEditor } from './DocEditor';
import { Theme } from './types';
import { PanelLeftOpen, Plus } from 'lucide-react';

interface DocViewProps {
    roomId: string;
}

export const DocView: React.FC<DocViewProps> = ({ roomId }) => {
    const [theme, setTheme] = useState<Theme>('light');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Initialize theme based on system preference or default
    useEffect(() => {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, []);

    // Apply theme class to document
    // NOTE: This might interfere with global theme, but keeping as per request to copy behavior
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans transition-colors duration-300">
            {/* Sidebar Area */}
            <div
                className={`
          flex-shrink-0 border-e border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-xl
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64' : 'w-0 opacity-0 overflow-hidden'}
        `}
            >
                <DocSidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0 h-full relative bg-white dark:bg-stone-900 transition-colors duration-300">

                {/* Top Navigation Bar */}
                <DocTopBar
                    theme={theme}
                    toggleTheme={toggleTheme}
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                />

                {/* Document Canvas */}
                <main className="flex-1 overflow-y-auto relative">
                    {/* Sidebar Toggle Floating Button (Visible when sidebar is closed) */}
                    {!isSidebarOpen && (
                        <button
                            onClick={toggleSidebar}
                            className="absolute top-4 start-4 z-20 p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
                            aria-label="Open sidebar"
                        >
                            <PanelLeftOpen size={20} />
                        </button>
                    )}

                    {/* Add Page Button (Corner Left) */}
                    <div className="absolute top-4 left-4 z-20">
                        <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-sm hover:shadow-md text-stone-600 dark:text-stone-300 text-sm font-medium transition-all group">
                            <Plus size={16} className="text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200" />
                            Add page
                        </button>
                    </div>

                    <DocEditor />
                </main>
            </div>
        </div>
    );
};
