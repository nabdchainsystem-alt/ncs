import React from 'react';
import {
    Trash2, Archive, AlertOctagon, MailOpen,
    Reply, ReplyAll, Forward, Move, Tag, MoreHorizontal,
    RefreshCw, Filter, CheckCircle2
} from 'lucide-react';

interface InboxCommandBarProps {
    onAction: (action: string) => void;
    selectionCount: number;
    colors: any;
    isRTL: boolean;
}

export const InboxCommandBar: React.FC<InboxCommandBarProps> = ({ onAction, selectionCount, colors, isRTL }) => {

    const CommandBtn = ({ icon: Icon, label, action, active = false, danger = false }: any) => (
        <button
            onClick={() => onAction(action)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${active ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' :
                danger ? 'hover:text-red-600' : 'text-gray-700 dark:text-gray-300'
                }`}
        >
            <Icon size={16} strokeWidth={1.5} />
            <span className="text-sm font-medium hidden md:inline">{label}</span>
        </button>
    );

    const Separator = () => <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1" />;

    return (
        <div className={`h-12 w-full flex items-center px-4 border-b border-gray-200 dark:border-[#2f2f2f] bg-white dark:bg-[#1a1a1a] ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Left: Selection Actions (In RTL this becomes visually Right) */}
            <div className="flex items-center gap-1">
                {selectionCount === 0 ? (
                    <>
                        <CommandBtn icon={CheckCircle2} label="Select all" action="selectAll" />
                    </>
                ) : (
                    <>
                        <span className="text-sm font-medium mr-2 text-blue-600">{selectionCount} selected</span>
                        <Separator />
                    </>
                )}

                <CommandBtn icon={Trash2} label="Delete" action="delete" danger />
                <CommandBtn icon={Archive} label="Archive" action="archive" />
                <CommandBtn icon={Move} label="Move" action="move" />

                <Separator />

                <CommandBtn icon={Reply} label="Reply" action="reply" className={isRTL ? 'scale-x-[-1]' : ''} />
                <CommandBtn icon={ReplyAll} label="Reply all" action="replyAll" className={isRTL ? 'scale-x-[-1]' : ''} />
                <CommandBtn icon={Forward} label="Forward" action="forward" className={isRTL ? 'scale-x-[-1]' : ''} />

                <Separator />

                <CommandBtn icon={MailOpen} label="Read / Unread" action="toggleRead" />
                <CommandBtn icon={Tag} label="Tag" action="tag" />

            </div>

            {/* Right: View Actions (In RTL this becomes visually Left) */}
            <div className={`flex items-center gap-2 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
                <CommandBtn icon={RefreshCw} label="Sync" action="refresh" />
                <CommandBtn icon={MoreHorizontal} label="" action="more" />
            </div>
        </div>
    );
};
