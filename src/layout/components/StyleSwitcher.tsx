
import React, { useState, useRef, useEffect } from 'react';
import { Palette, Layout, Sparkles, Check, Moon, Sun, Laptop, PenTool } from 'lucide-react';

interface StyleSwitcherProps {
    currentStyle: 'main' | 'floating';
    onStyleChange: (style: 'main' | 'floating') => void;
    currentTheme: string;
    onThemeChange: (theme: string) => void;
}

export const StyleSwitcher: React.FC<StyleSwitcherProps> = ({
    currentStyle,
    onStyleChange,
    currentTheme,
    onThemeChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const toggleOpen = () => setIsOpen(!isOpen);

    const isLight = currentTheme === 'light';

    return (
        <div className="relative" ref={menuRef}>
            <button
                className={`flex items-center justify-center w-8 h-8 text-white hover:bg-white/10 rounded-md transition-colors ${isOpen ? 'bg-white/10' : ''}`}
                onClick={toggleOpen}
                title="Change Layout Style"
            >
                <Palette size={20} />
            </button>

            {isOpen && (
                <div className="absolute end-0 top-full mt-2 w-64 bg-white dark:bg-[#1e2124] rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-2 z-[9999] animate-in fade-in zoom-in-95 duration-200 origin-top-right rtl:origin-top-left">

                    <div className="px-3 py-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Interface</h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    onStyleChange('main');
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${currentStyle === 'main'
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Layout size={16} />
                                    <span className="font-medium">Standard</span>
                                </div>
                                {currentStyle === 'main' && <Check size={14} />}
                            </button>

                            <button
                                onClick={() => {
                                    onStyleChange('floating');
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${currentStyle === 'floating'
                                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Sparkles size={16} />
                                    <span className="font-medium">Floating</span>
                                </div>
                                {currentStyle === 'floating' && <Check size={14} />}
                            </button>
                        </div>
                    </div>



                </div>
            )}
        </div>
    );
};
