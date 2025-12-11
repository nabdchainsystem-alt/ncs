import React, { useState, useRef } from 'react';
import {
    Inbox,
    FileText,
    Send,
    Trash2,
    History,
    Ban,
    Archive,
    ChevronRight,
    ChevronDown,
    ChevronLeft,
    Plus,
    PenSquare,
    Sparkles,
    Minus,
    Moon,
    Sun,
    ArrowRightLeft,
    CornerDownLeft
} from 'lucide-react';
import { ViewState, Translations } from '../types';

interface SidebarProps {
    currentView: ViewState;
    onChangeView: (view: ViewState) => void;
    inboxCount: number;
    onCompose: () => void;
    onCapture: (content: string) => void;
    theme: 'light' | 'nexus' | 'sketch';
    setTheme: (theme: 'light' | 'nexus' | 'sketch') => void;
    direction: 'ltr' | 'rtl';
    setDirection: (dir: 'ltr' | 'rtl') => void;
    t: Translations;
}

interface Folder {
    id: string;
    name: string;
    icon?: React.ElementType;
    subFolders?: Folder[];
    isOpen?: boolean;
}

interface FolderItemProps {
    folder: Folder;
    depth?: number;
    isStandard?: boolean;
    onToggle: (id: string) => void;
    onCreateFolder: (parentId?: string) => void;
    onDeleteFolder: (id: string) => void;
    direction: 'ltr' | 'rtl';
}

const FolderItem: React.FC<FolderItemProps> = ({ folder, depth = 0, isStandard = false, onToggle, onCreateFolder, onDeleteFolder, direction }) => {
    const Icon = folder.icon as any;
    // Use logical padding
    const paddingStart = depth * 12 + 12;

    // Choose chevron based on state and direction
    const ChevronClosed = direction === 'rtl' ? ChevronLeft : ChevronRight;

    return (
        <div className="select-none">
            <div
                className={`
          group flex items-center gap-2 pe-3 py-1.5 rounded-md cursor-pointer transition-colors duration-200 relative
          ${!isStandard && 'hover:bg-stone-100 dark:hover:bg-stone-800'}
          ${isStandard && folder.id === 'inbox' ? 'bg-stone-100/80 dark:bg-stone-800/80 font-medium text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'}
        `}
                style={{ paddingInlineStart: `${paddingStart}px` }}
                onClick={() => folder.subFolders ? onToggle(folder.id) : undefined}
            >
                {/* Chevron for expandable folders */}
                {!isStandard && (
                    <div className="w-4 h-4 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300" onClick={(e) => { e.stopPropagation(); onToggle(folder.id); }}>
                        {folder.subFolders && (folder.isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronClosed className="w-3 h-3" />)}
                    </div>
                )}

                {Icon && <Icon className={`w-4 h-4 ${folder.id === 'inbox' ? 'text-blue-600 dark:text-blue-400' : 'text-stone-400 dark:text-stone-500'}`} />}

                <span className="font-sans text-sm truncate flex-1">{folder.name}</span>

                {/* Folder Actions (Add Sub / Delete) */}
                {!isStandard && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity absolute right-2 rtl:right-auto rtl:left-2 bg-stone-100/80 dark:bg-stone-800/80 backdrop-blur-sm rounded">
                        <button
                            onClick={(e) => { e.stopPropagation(); onCreateFolder(folder.id); }}
                            className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-all"
                            title="Add sub-folder"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-stone-400 hover:text-red-500 dark:text-stone-500 dark:hover:text-red-400 transition-all"
                            title="Delete folder"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* Render Subfolders */}
            {folder.isOpen && folder.subFolders && folder.subFolders.length > 0 && (
                <div>
                    {folder.subFolders.map(sub => (
                        <FolderItem
                            key={sub.id}
                            folder={sub}
                            depth={depth + 1}
                            onToggle={onToggle}
                            onCreateFolder={onCreateFolder}
                            onDeleteFolder={onDeleteFolder}
                            direction={direction}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const InboxSidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onCompose, onCapture, theme, setTheme, direction, setDirection, t }) => {
    // Capture State for Expanding Button
    const [isCaptureOpen, setIsCaptureOpen] = useState(false);
    const [captureText, setCaptureText] = useState('');
    const captureInputRef = useRef<HTMLTextAreaElement>(null);

    const handleCaptureSubmit = () => {
        if (captureText.trim()) {
            onCapture(captureText);
            setCaptureText('');
            setIsCaptureOpen(false);
        }
    };

    // Standard Outlook-style folders
    const standardFolders = [
        { id: 'inbox', name: t.inbox, icon: Inbox, view: ViewState.INBOX },
        { id: 'archive', name: t.archive, icon: Archive, view: ViewState.PROJECTS },
        { id: 'drafts', name: t.drafts, icon: FileText, view: ViewState.NEXT_ACTIONS },
        { id: 'sent', name: t.sent, icon: Send, view: ViewState.INBOX },
        { id: 'deleted', name: t.deleted, icon: Trash2, view: ViewState.INBOX },
        { id: 'history', name: t.history, icon: History, view: ViewState.INBOX },
        { id: 'junk', name: t.junk, icon: Ban, view: ViewState.INBOX },
    ];

    // Mock User Folders state
    const [userFolders, setUserFolders] = useState<Folder[]>([
        {
            id: 'personal',
            name: t.personal,
            isOpen: true,
            subFolders: [
                { id: 'receipts', name: t.receipts },
                { id: 'travel', name: t.travel }
            ]
        },
        {
            id: 'work',
            name: t.work,
            isOpen: false,
            subFolders: []
        }
    ]);

    const toggleFolder = (folderId: string) => {
        const toggleRecursive = (folders: Folder[]): Folder[] => {
            return folders.map(f => {
                if (f.id === folderId) return { ...f, isOpen: !f.isOpen };
                if (f.subFolders) return { ...f, subFolders: toggleRecursive(f.subFolders) };
                return f;
            });
        };
        setUserFolders(prev => toggleRecursive(prev));
    };

    const handleCreateFolder = (parentId?: string) => {
        // In a real app we might want a modal instead of prompt
        const name = prompt(t.createFolder + ":");
        if (!name) return;

        const newFolder: Folder = { id: Date.now().toString(), name, subFolders: [] };

        if (!parentId) {
            setUserFolders(prev => [...prev, newFolder]);
        } else {
            const addRecursive = (folders: Folder[]): Folder[] => {
                return folders.map(f => {
                    if (f.id === parentId) {
                        return { ...f, subFolders: [...(f.subFolders || []), newFolder], isOpen: true };
                    }
                    if (f.subFolders) return { ...f, subFolders: addRecursive(f.subFolders) };
                    return f;
                });
            };
            setUserFolders(prev => addRecursive(prev));
        }
    };

    const handleDeleteFolder = (folderId: string) => {
        if (!confirm(t.delete + "?")) return;

        const deleteRecursive = (folders: Folder[]): Folder[] => {
            return folders
                .filter(f => f.id !== folderId)
                .map(f => ({
                    ...f,
                    subFolders: f.subFolders ? deleteRecursive(f.subFolders) : []
                }));
        };
        setUserFolders(prev => deleteRecursive(prev));
    };

    return (
        <div className="w-full flex-shrink-0 flex flex-col h-full bg-stone-50/50 dark:bg-stone-900/50 p-3 md:p-3 pt-2 backdrop-blur-xl border-e border-stone-200 dark:border-stone-800 transition-colors duration-200">

            {/* Primary Actions */}
            <div className="mb-4 space-y-3 px-1">
                <button
                    onClick={onCompose}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] group"
                >
                    <PenSquare className="w-4 h-4 rtl:flip" />
                    <span className="font-sans text-sm font-semibold tracking-wide">{t.newMail}</span>
                </button>

                {/* Expanding Capture Button */}
                <div className={`
          flex flex-col w-full bg-white dark:bg-stone-800 border rounded-lg shadow-sm hover:shadow transition-all group overflow-hidden
          ${isCaptureOpen ? 'border-stone-300 dark:border-stone-600 ring-2 ring-stone-100 dark:ring-stone-700' : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'}
        `}>
                    <button
                        onClick={() => {
                            setIsCaptureOpen(!isCaptureOpen);
                            if (!isCaptureOpen) {
                                setTimeout(() => captureInputRef.current?.focus(), 100);
                            }
                        }}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-transparent"
                    >
                        <div className={`
               w-5 h-5 rounded-full flex items-center justify-center transition-colors
               ${isCaptureOpen ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200 group-hover:bg-stone-200 dark:group-hover:bg-stone-600'}
            `}>
                            <Sparkles className="w-3 h-3" />
                        </div>
                        <span className={`
               font-serif text-sm italic transition-colors
               ${isCaptureOpen ? 'text-stone-900 dark:text-stone-100 font-medium' : 'text-stone-600 dark:text-stone-300 group-hover:text-stone-800 dark:group-hover:text-stone-100'}
            `}>
                            {t.capture}
                        </span>
                    </button>

                    {/* Expanded Content */}
                    {isCaptureOpen && (
                        <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 duration-200">
                            <textarea
                                ref={captureInputRef}
                                value={captureText}
                                onChange={(e) => setCaptureText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleCaptureSubmit();
                                    }
                                }}
                                placeholder={t.capturePlaceholder}
                                className="w-full bg-stone-50 dark:bg-stone-900/50 rounded-md p-2 text-sm font-serif border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 resize-none h-20 mb-2 placeholder:text-stone-400 text-stone-800 dark:text-stone-200"
                            />
                            <button
                                onClick={handleCaptureSubmit}
                                disabled={!captureText.trim()}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded text-xs font-bold uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
                            >
                                {t.save} <CornerDownLeft className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Standard Folders List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5 mb-4">
                {standardFolders.map(folder => (
                    <FolderItem
                        key={folder.id}
                        folder={folder}
                        isStandard={true}
                        onToggle={toggleFolder}
                        onCreateFolder={handleCreateFolder}
                        onDeleteFolder={handleDeleteFolder}
                        direction={direction}
                    />
                ))}

                {/* Separator */}
                <div className="my-4 border-t border-stone-200 dark:border-stone-700 mx-2"></div>

                {/* Header for Custom Folders */}
                <div className="px-3 py-1 flex items-center justify-between group cursor-pointer mb-1" onClick={() => handleCreateFolder()}>
                    <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider font-sans">{t.folders}</span>
                    <button className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 rounded p-0.5 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* User Custom Folders */}
                <div className="space-y-0.5">
                    {userFolders.map(folder => (
                        <FolderItem
                            key={folder.id}
                            folder={folder}
                            onToggle={toggleFolder}
                            onCreateFolder={handleCreateFolder}
                            onDeleteFolder={handleDeleteFolder}
                            direction={direction}
                        />
                    ))}
                </div>
            </div>


        </div>
    );
};
