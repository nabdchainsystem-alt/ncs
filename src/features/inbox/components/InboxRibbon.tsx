import React, { useState } from 'react';
import {
    Plus,
    Trash2, Archive, AlertOctagon,
    Mail, CornerUpLeft, ChevronsLeft, CornerUpRight,
    FolderInput, FolderPlus, Tag,
    MailOpen, Flag, Pin,
    Search, RefreshCw,
    LayoutList, LayoutGrid, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InboxRibbonProps {
    colors: any;
    isRTL: boolean;
    isDark: boolean;
    activeFolder: string;
    selectedEmail: any;
    // Handlers
    onCompose: () => void;
    onDelete: () => void;
    onArchive: () => void;
    onReport: () => void;
    onReply: (type: 'reply' | 'replyAll' | 'forward') => void;
    onMove: () => void;
    onRefresh: () => void; // For Sent folder fix
    onToggleRead: () => void;
    onToggleFlag: () => void;
    onTogglePin: () => void;
    // Search
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

export const InboxRibbon: React.FC<InboxRibbonProps> = (props) => {
    const { colors, isRTL, isDark, selectedEmail } = props;
    const [activeTab, setActiveTab] = useState<'home' | 'view'>('home');

    // --- Helper Components ---
    const RibbonTab = ({ id, label }: { id: 'home' | 'view', label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-1 text-xs md:text-sm font-medium rounded-t-lg transition-colors relative ${activeTab === id
                    ? `${colors.bg} ${colors.text} border-t border-x ${colors.border} z-10 bottom-[-1px]`
                    : `${colors.textMuted} hover:${colors.text} hover:bg-black/5 dark:hover:bg-white/5`
                }`}
        >
            {label}
            {activeTab === id && <div className={`absolute bottom-[-1px] left-0 right-0 h-px ${colors.bg}`} />}
        </button>
    );

    const RibbonGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
        <div className={`flex flex-col items-center justify-center px-2 h-full border-${isRTL ? 'l' : 'r'} ${colors.border} min-w-max`}>
            <div className="flex items-center gap-1 mb-1">
                {children}
            </div>
            <span className={`text-[10px] ${colors.textMuted} uppercase tracking-wider font-medium`}>{label}</span>
        </div>
    );

    const RibbonBtn = ({ icon: Icon, label, onClick, active = false, large = false, disabled = false }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center justify-center gap-1 rounded transition-all ${large ? 'px-3 py-1.5' : 'p-1.5'
                } ${active ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    disabled ? 'opacity-40 cursor-not-allowed' : `hover:bg-black/5 dark:hover:bg-white/10 ${colors.text}`
                }`}
            title={label}
        >
            <Icon size={large ? 20 : 18} strokeWidth={large ? 2 : 1.5} />
            {large && <span className="text-xs font-medium">{label}</span>}
        </button>
    );

    return (
        <div className={`flex flex-col w-full ${colors.ribbon} border-b ${colors.border} shadow-sm z-50`}>
            {/* --- Tabs Row --- */}
            <div className={`flex items-center px-4 pt-2 border-b ${colors.border} ${isDark ? 'bg-black/10' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-1">
                    <RibbonTab id="home" label={isRTL ? "الرئيسية" : "Home"} />
                    <RibbonTab id="view" label={isRTL ? "عرض" : "View"} />
                </div>
            </div>

            {/* --- Toolbar Row --- */}
            <div className="h-20 flex items-center px-2 overflow-x-auto no-scrollbar relative">

                {/* Search (Absolute Right) */}
                <div className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-48 md:w-64 z-20`}>
                    <div className="relative group">
                        <Search className={`absolute top-1/2 -translate-y-1/2 ${colors.textMuted} w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
                        <input
                            type="text"
                            value={props.searchQuery}
                            onChange={(e) => props.onSearchChange(e.target.value)}
                            placeholder={isRTL ? "بحث..." : "Search"}
                            className={`w-full ${isDark ? 'bg-black/20 focus:bg-black/40' : 'bg-gray-100 focus:bg-white'} border ${colors.border} rounded-lg py-2 ${isRTL ? 'pr-9 pl-2' : 'pl-9 pr-2'} text-sm ${colors.text} focus:border-blue-500/50 transition-all outline-none shadow-inner`}
                        />
                    </div>
                </div>

                {/* --- HOME TAB --- */}
                {activeTab === 'home' && (
                    <div className="flex items-center h-full gap-2 pl-2">

                        {/* New Group */}
                        <RibbonGroup label={isRTL ? "جديد" : "New"}>
                            <button
                                onClick={props.onCompose}
                                className="flex flex-col items-center justify-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded shadow-md transition-transform active:scale-95"
                            >
                                <Plus size={20} />
                                <span className="text-xs font-medium">{isRTL ? "رسالة جديدة" : "New Email"}</span>
                            </button>
                        </RibbonGroup>

                        {/* Delete Group */}
                        <RibbonGroup label={isRTL ? "حذف" : "Delete"}>
                            <RibbonBtn icon={Trash2} label="Delete" onClick={props.onDelete} disabled={!selectedEmail} />
                            <RibbonBtn icon={Archive} label="Archive" onClick={props.onArchive} disabled={!selectedEmail} />
                            <RibbonBtn icon={AlertOctagon} label="Spam" onClick={props.onReport} disabled={!selectedEmail} />
                        </RibbonGroup>

                        {/* Respond Group */}
                        <RibbonGroup label={isRTL ? "رد" : "Respond"}>
                            <RibbonBtn icon={Mail} label="Reply" onClick={() => props.onReply('reply')} disabled={!selectedEmail} />
                            <RibbonBtn icon={ChevronsLeft} label="Reply All" onClick={() => props.onReply('replyAll')} disabled={!selectedEmail} />
                            <RibbonBtn icon={CornerUpRight} label="Forward" onClick={() => props.onReply('forward')} disabled={!selectedEmail} />
                        </RibbonGroup>

                        {/* Actions Group */}
                        <RibbonGroup label={isRTL ? "إجراءات" : "Actions"}>
                            <div className="flex flex-col gap-1">
                                <div className="flex gap-1">
                                    <RibbonBtn icon={FolderInput} label="Move" onClick={props.onMove} disabled={!selectedEmail} />
                                    <RibbonBtn icon={MailOpen} label="Read" onClick={props.onToggleRead} active={selectedEmail && !selectedEmail.read} disabled={!selectedEmail} />
                                </div>
                                <div className="flex gap-1">
                                    <RibbonBtn icon={Flag} label="Flag" onClick={props.onToggleFlag} active={selectedEmail?.priority === 'high'} disabled={!selectedEmail} />
                                    <RibbonBtn icon={Pin} label="Pin" onClick={props.onTogglePin} active={selectedEmail?.pinned} disabled={!selectedEmail} />
                                </div>
                            </div>
                        </RibbonGroup>

                        {/* Sync Group */}
                        <RibbonGroup label={isRTL ? "مزامنة" : "Sync"}>
                            <RibbonBtn icon={RefreshCw} label="Refresh" onClick={props.onRefresh} large />
                        </RibbonGroup>

                    </div>
                )}

                {/* --- VIEW TAB --- */}
                {activeTab === 'view' && (
                    <div className="flex items-center h-full gap-2 pl-2">
                        <RibbonGroup label="Layout">
                            <RibbonBtn icon={LayoutList} label="List" active />
                            <RibbonBtn icon={LayoutGrid} label="Grid" disabled />
                        </RibbonGroup>

                        <RibbonGroup label="Window">
                            <RibbonBtn icon={Eye} label="Reading Pane" active />
                        </RibbonGroup>
                    </div>
                )}

            </div>
        </div>
    );
};
