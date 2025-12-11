import React, { useState } from 'react';
import {
    LayoutGrid,
    Zap,
    BarChart2,
    Archive,
    Settings,
    Users,
    Target,
    PenTool,
    Check
} from 'lucide-react';
import Avatar from './Avatar';
import { useLanguage } from '../../../contexts/LanguageContext';

interface TeamsSidebarProps {
    direction?: 'ltr' | 'rtl';
    onInviteClick: () => void;
}

const TeamsSidebar: React.FC<TeamsSidebarProps> = ({ direction = 'ltr', onInviteClick }) => {
    const { t } = useLanguage();
    // Fixed width for now to avoid conflict with global sidebar resizing
    const width = 256;
    const [isCaptureOpen, setIsCaptureOpen] = useState(false);
    const [captureText, setCaptureText] = useState("");

    const menuItems = [
        { icon: LayoutGrid, label: t('teams.dashboard'), active: true },
        { icon: Zap, label: t('teams.updates'), active: false },
        { icon: BarChart2, label: t('teams.analytics'), active: false },
    ];

    const toolItems = [
        { icon: Target, label: t('teams.goals'), active: false },
        { icon: Archive, label: t('teams.archive'), active: false },
        { icon: Settings, label: t('teams.settings'), active: false },
    ];

    const handleCaptureSubmit = () => {
        if (captureText.trim()) {
            console.log("Captured:", captureText);
            setCaptureText("");
            setIsCaptureOpen(false);
        }
    };

    return (
        <aside
            style={{ width: `${width}px` }}
            className="relative flex-shrink-0 h-full flex flex-col bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-xl border-e border-stone-200 dark:border-stone-800 hidden md:flex transition-all duration-300 ease-in-out"
        >

            {/* Header / Brand */}
            <div className="p-6 pb-4 flex-shrink-0">
                <div className="flex items-center gap-3 text-stone-900 dark:text-stone-100 mb-8 overflow-hidden whitespace-nowrap">
                    <div className="h-8 w-8 min-w-[2rem] bg-stone-900 dark:bg-stone-100 rounded-lg flex items-center justify-center">
                        <span className="font-serif font-bold text-lg text-stone-50 dark:text-stone-900 italic">C</span>
                    </div>
                    <span className="font-serif font-semibold text-lg tracking-tight">{t('teams.title')}</span>
                </div>

                {/* Primary Actions */}
                <div className="space-y-3">
                    <button
                        onClick={onInviteClick}
                        className="w-full group relative flex items-center justify-center py-2.5 px-4 bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden whitespace-nowrap"
                    >
                        <Users className="w-4 h-4 me-2 opacity-80 flex-shrink-0 rtl:flip" />
                        <span className="font-serif font-medium text-sm tracking-wide">{t('teams.invite')}</span>
                    </button>

                    {/* Capture Section */}
                    <div className="relative">
                        <button
                            onClick={() => setIsCaptureOpen(!isCaptureOpen)}
                            className={`w-full group flex items-center justify-center py-2.5 px-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors overflow-hidden whitespace-nowrap ${isCaptureOpen ? 'ring-2 ring-stone-900 dark:ring-stone-100 border-transparent' : ''}`}
                        >
                            <PenTool className="w-4 h-4 me-2 opacity-60 flex-shrink-0 rtl:flip" />
                            <span className="font-sans text-sm font-medium">{t('teams.capture')}</span>
                        </button>

                        {/* Expandable Capture Input */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCaptureOpen ? 'max-h-48 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2 shadow-sm">
                                <textarea
                                    value={captureText}
                                    onChange={(e) => setCaptureText(e.target.value)}
                                    className="w-full bg-transparent border-0 text-stone-800 dark:text-stone-200 text-sm font-serif placeholder-stone-400 focus:ring-0 resize-none p-1"
                                    placeholder={t('gtd.capture.placeholder')}
                                    rows={3}
                                    autoFocus={isCaptureOpen}
                                />
                                <div className="flex justify-end pt-2 border-t border-stone-100 dark:border-stone-700 mt-1">
                                    <button
                                        onClick={handleCaptureSubmit}
                                        className="p-1 rounded bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 transition-colors"
                                    >
                                        <Check className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 overflow-y-auto overflow-x-hidden space-y-8">

                {/* Workspace Section */}
                <div>
                    <h3 className="px-2 text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest mb-3">
                        {t('teams.workspace')}
                    </h3>
                    <ul className="space-y-1">
                        {menuItems.map((item, idx) => (
                            <li key={idx}>
                                <button
                                    className={`
                      w-full flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200 font-sans group whitespace-nowrap
                      ${item.active
                                            ? 'bg-stone-200/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium'
                                            : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-200'}
                    `}
                                >
                                    <item.icon className={`me-3 h-4 w-4 flex-shrink-0 rtl:flip transition-colors ${item.active ? 'text-stone-800 dark:text-stone-200' : 'text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300'}`} />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Tools Section */}
                <div>
                    <h3 className="px-2 text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest mb-3">
                        {t('teams.tools')}
                    </h3>
                    <ul className="space-y-1">
                        {toolItems.map((item, idx) => (
                            <li key={idx}>
                                <button
                                    className="w-full flex items-center px-3 py-2 text-sm text-stone-500 dark:text-stone-400 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-200 transition-colors font-sans group whitespace-nowrap"
                                >
                                    <item.icon className="me-3 h-4 w-4 flex-shrink-0 rtl:flip text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors" />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

            </nav>

            {/* Footer / User */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex-shrink-0">
                <button className="flex items-center w-full p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group overflow-hidden">
                    <Avatar
                        src="https://picsum.photos/200/200?random=99"
                        alt="User"
                        size="sm"
                        className="ring-2 ring-white dark:ring-stone-950 flex-shrink-0"
                    />
                    <div className="ms-3 text-start flex-1 transition-opacity duration-200 whitespace-nowrap">
                        <p className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100 group-hover:underline decoration-stone-300 dark:decoration-stone-600 underline-offset-2">
                            Alex Morgan
                        </p>
                        <p className="text-[10px] text-stone-500 font-sans uppercase tracking-wide">
                            Product Lead
                        </p>
                    </div>
                    <Settings className="h-4 w-4 text-stone-400 group-hover:rotate-90 transition-transform duration-500 flex-shrink-0 ms-auto rtl:flip" />
                </button>
            </div>

        </aside>
    );
};

export default TeamsSidebar;
