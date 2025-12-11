import React, { useState, useCallback, useEffect } from 'react';
import { InboxItem, Translations } from '../types';
import { InboxItemCard } from './InboxItemCard';
import { clarifyInboxItem } from '../services/geminiService';
import {
    Trash2,
    CheckCircle2,
    Sparkles,
    Reply,
    ReplyAll,
    Forward,
    Archive,
    FolderInput,
    Flag,
    RefreshCw,
    Ban,
    MoreHorizontal,
    Send,
    Bold,
    Italic,
    Underline,
    List,
    Link as LinkIcon,
    Paperclip,
    Eraser,
    X,
    Printer,
    Undo,
    ChevronDown,
    ChevronUp,
    User,
    Accessibility,
    PenTool,
    Type as TypeIcon,
    ListOrdered,
    Indent,
    Outdent,
    ExternalLink,
    Clipboard,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Mail,
    Pin,
    Clock,
    Tag,
    ShieldAlert,
    Languages,
    Copy,
    BookOpen
} from 'lucide-react';

interface InboxMainViewProps {
    items: InboxItem[];
    onCapture: (content: string) => void;
    onDeleteItem: (id: string) => void;
    onCompleteItem: (id: string) => void;
    onUpdateItem: (id: string, updates: Partial<InboxItem>) => void;
    rightPanelMode: 'read' | 'compose' | 'capture';
    setRightPanelMode: (mode: 'read' | 'compose' | 'capture') => void;
    direction: 'ltr' | 'rtl';
    t: Translations;
    locale: string;
}

// Simple PenSquare Icon Component locally if not imported
function PenSquare(props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

export const InboxMainView: React.FC<InboxMainViewProps> = ({
    items,
    onCapture,
    onDeleteItem,
    onCompleteItem,
    onUpdateItem,
    rightPanelMode,
    setRightPanelMode,
    direction,
    t,
    locale
}) => {
    const [selectedItemId, setSelectedItemId] = useState<string | null>(items.length > 0 ? items[0].id : null);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

    // Resizing state
    const [listWidth, setListWidth] = useState(380);
    const [isResizingList, setIsResizingList] = useState(false);

    // Compose State
    const [composeSubject, setComposeSubject] = useState('');
    const [composeTo, setComposeTo] = useState('');
    const [composeBody, setComposeBody] = useState('');

    // Capture View State
    const [captureText, setCaptureText] = useState('');

    // Switch to read mode if an item is selected manually
    const handleSelectItem = (id: string) => {
        setSelectedItemId(id);
        setRightPanelMode('read');
    };

    const selectedItem = items.find(i => i.id === selectedItemId);

    const handleReply = (type: 'reply' | 'replyAll' | 'forward') => {
        if (selectedItem) {
            let prefix = type === 'forward' ? 'Fwd: ' : 'Re: ';
            setComposeSubject(prefix + (selectedItem.content.split('\n')[0].substring(0, 30) + '...'));
            setComposeTo('Sender Name <sender@example.com>'); // Mock
            setComposeBody('\n\n\n------------------\nOriginal Message:\n' + selectedItem.content);
            setRightPanelMode('compose');
        }
    };

    const handleComposeNew = () => {
        setComposeSubject('');
        setComposeTo('');
        setComposeBody('');
        setRightPanelMode('compose');
    };

    // Reset fields when mode changes to read
    useEffect(() => {
        if (rightPanelMode === 'read') {
            setComposeSubject('');
            setComposeBody('');
        }
    }, [rightPanelMode]);

    const [activeTab, setActiveTab] = useState<'focused' | 'other'>('focused');

    const displayItems = items
        .filter(i => {
            const isDone = i.status === 'done' || i.status === 'organized';
            if (isDone) return false;

            const itemIsFocused = i.isFocused ?? true;
            return activeTab === 'focused' ? itemIsFocused : !itemIsFocused;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const handleClarify = async (item: InboxItem) => {
        setProcessingIds(prev => new Set(prev).add(item.id));
        try {
            const suggestion = await clarifyInboxItem(item.content);
            if (suggestion) {
                onUpdateItem(item.id, {
                    status: 'clarified',
                    aiSuggestions: suggestion
                });
            }
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    const handleOrganize = (item: InboxItem) => {
        onUpdateItem(item.id, { status: 'organized' });
        const currentIndex = displayItems.findIndex(i => i.id === item.id);
        if (currentIndex < displayItems.length - 1) {
            handleSelectItem(displayItems[currentIndex + 1].id);
        } else if (displayItems.length > 1) {
            handleSelectItem(displayItems[0].id);
        } else {
            setSelectedItemId(null);
        }
    };

    const handleCaptureSubmit = () => {
        if (captureText.trim()) {
            onCapture(captureText);
            setCaptureText('');
            setRightPanelMode('read');
        }
    };

    const isProcessing = selectedItem ? processingIds.has(selectedItem.id) : false;

    const startResizingList = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingList(true);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingList) {
                const delta = direction === 'rtl' ? -e.movementX : e.movementX;
                setListWidth(prev => {
                    const newWidth = prev + delta;
                    if (newWidth < 280) return 280;
                    if (newWidth > 500) return 500;
                    return newWidth;
                });
            }
        };

        const handleMouseUp = () => {
            setIsResizingList(false);
        };

        if (isResizingList) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        } else {
            document.body.style.cursor = 'default';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizingList, direction]);

    const handleDiscard = () => {
        if (composeSubject || composeBody) {
            if (window.confirm(t.discard + "?")) {
                setComposeSubject('');
                setComposeTo('');
                setComposeBody('');
                setRightPanelMode('read');
            }
        } else {
            setRightPanelMode('read');
        }
    };

    // --- Toolbar Components ---

    const ToolbarButton = ({ icon: Icon, label, onClick, active = false, className = '' }: any) => (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-md transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${active ? 'text-stone-900 bg-stone-100 dark:bg-stone-800 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'} ${className}`}
            title={label}
        >
            <Icon className="w-4 h-4 rtl:flip" />
            <span className="text-[10px] font-sans font-medium">{label}</span>
        </button>
    );

    const Divider = () => <div className="w-px h-5 bg-stone-300 dark:bg-stone-700 mx-2 self-center"></div>;

    const ReadToolbar = () => (
        <div className="flex items-center gap-1 animate-in fade-in duration-300 w-full overflow-x-auto no-scrollbar">
            {/* Triage */}
            <ToolbarButton icon={Trash2} label={t.delete} onClick={() => selectedItem && onDeleteItem(selectedItem.id)} />
            <ToolbarButton icon={Archive} label={t.archive} onClick={() => selectedItem && handleOrganize(selectedItem)} />
            <ToolbarButton icon={Mail} label="Read / Unread" />
            <Divider />

            {/* Respond */}
            <ToolbarButton icon={Reply} label={t.reply} onClick={() => handleReply('reply')} />
            <ToolbarButton icon={ReplyAll} label={t.replyAll} onClick={() => handleReply('replyAll')} />
            <ToolbarButton icon={Forward} label={t.forward} onClick={() => handleReply('forward')} />
            <Divider />

            {/* Organize */}
            <ToolbarButton icon={FolderInput} label={t.move} />
            <ToolbarButton icon={Copy} label="Copy" />
            <ToolbarButton icon={Tag} label="Categorize" />
            <ToolbarButton icon={Pin} label="Pin" />
            <ToolbarButton icon={Clock} label="Snooze" />
            <ToolbarButton icon={Flag} label={t.flag} />
            <Divider />

            {/* Safety & Sync */}
            <ToolbarButton icon={RefreshCw} label={t.sync} />
            <ToolbarButton icon={ShieldAlert} label="Report" />
            <ToolbarButton icon={Ban} label={t.block} />

            <div className="flex-1"></div>

            {/* Output & More */}
            <ToolbarButton icon={Languages} label="Translate" />
            <ToolbarButton icon={Printer} label={t.print} />
            <ToolbarButton icon={MoreHorizontal} label={t.more} />
        </div>
    );

    // --- New Compose Format Toolbar ---
    const FormatToolbar = () => {
        const IconBtn = ({ icon: Icon, active = false }: any) => (
            <button className={`p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 ${active ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100' : ''}`}>
                <Icon className="w-4 h-4 rtl:flip" />
            </button>
        );

        return (
            <div className="flex items-center px-4 py-2 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 overflow-x-auto gap-1">
                <IconBtn icon={Undo} />
                <button className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 mr-2 me-2 flex items-center">
                    <span className="text-xs font-sans">{t.undo}</span>
                    <ChevronDown className="w-3 h-3 ms-1" />
                </button>
                <IconBtn icon={Clipboard} />

                <Divider />

                <div className="flex items-center bg-stone-200/50 dark:bg-stone-800/50 rounded px-2 py-1 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-800">
                    <span className="text-xs font-sans font-medium text-stone-700 dark:text-stone-300 me-2 w-16">Aptos</span>
                    <ChevronDown className="w-3 h-3 text-stone-500" />
                </div>
                <div className="flex items-center bg-stone-200/50 dark:bg-stone-800/50 rounded px-2 py-1 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-800">
                    <span className="text-xs font-sans font-medium text-stone-700 dark:text-stone-300 me-1">12</span>
                </div>

                <IconBtn icon={Eraser} />
                <div className="flex items-center gap-1 mx-1">
                    <IconBtn icon={TypeIcon} />
                    <ChevronDown className="w-3 h-3 text-stone-400 -ms-1" />
                </div>
                <div className="flex items-center gap-1 mx-1">
                    <IconBtn icon={PenTool} />
                    <ChevronDown className="w-3 h-3 text-stone-400 -ms-1" />
                </div>

                <IconBtn icon={Bold} active />
                <IconBtn icon={Italic} />
                <IconBtn icon={Underline} />

                <Divider />

                <div className="flex items-center gap-1 mx-1">
                    <IconBtn icon={List} />
                    <ChevronDown className="w-3 h-3 text-stone-400 -ms-1" />
                </div>
                <div className="flex items-center gap-1 mx-1">
                    <IconBtn icon={ListOrdered} />
                    <ChevronDown className="w-3 h-3 text-stone-400 -ms-1" />
                </div>

                <IconBtn icon={Outdent} />
                <IconBtn icon={Indent} />

                <div className="flex items-center gap-1 mx-1">
                    <IconBtn icon={AlignLeft} />
                    <ChevronDown className="w-3 h-3 text-stone-400 -ms-1" />
                </div>

                <div className="flex items-center gap-1 mx-1">
                    <IconBtn icon={AlignJustify} />
                    <ChevronDown className="w-3 h-3 text-stone-400 -ms-1" />
                </div>

                <Divider />

                <IconBtn icon={LinkIcon} />
                <IconBtn icon={MoreHorizontal} />
            </div>
        );
    };

    // --- Compose Header Action Toolbar (Send, Discard, etc.) ---
    const TopComposeActionToolbar = () => (
        <div className="flex items-center gap-6 px-6 py-3 bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
            <button
                onClick={() => { alert("Sent!"); setRightPanelMode('read'); }}
                className="flex items-center gap-2 px-6 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded hover:bg-stone-800 dark:hover:bg-white/90 transition-colors shadow-sm group"
            >
                <Send className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform rtl:flip" />
                <span className="text-sm font-bold font-sans">{t.send}</span>
            </button>

            <button
                onClick={handleDiscard}
                className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
            >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-medium font-sans">{t.discard}</span>
            </button>

            <button className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
                <Paperclip className="w-5 h-5" />
                <span className="text-sm font-medium font-sans">{t.attach}</span>
            </button>

            <button className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
                <PenTool className="w-5 h-5" />
                <span className="text-sm font-medium font-sans">{t.signature}</span>
            </button>

            <button className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
                <PenSquare className="w-5 h-5" />
                <span className="text-sm font-medium font-sans">{t.editor}</span>
            </button>

            <button className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
                <Accessibility className="w-5 h-5" />
                <span className="text-sm font-medium font-sans">{t.checkAccess}</span>
            </button>

            <div className="flex-1"></div>

            <button className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200">
                <MoreHorizontal className="w-6 h-6" />
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden bg-stone-50 dark:bg-stone-900">

            {/* ---------------- TOP TOOLBAR (Contextual) ---------------- */}
            {/* Only show standard toolbar if NOT in compose mode (Compose has its own internal toolbar now) */}
            <div className={`flex-none h-14 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md flex items-center px-4 z-20 shadow-sm transition-all duration-300 ${rightPanelMode === 'compose' ? 'hidden' : ''}`}>
                <div className="w-full">
                    <ReadToolbar />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* ---------------- MIDDLE PANE: LIST VIEW ---------------- */}
                <div
                    style={{ width: listWidth }}
                    className="flex-shrink-0 flex flex-col border-e border-stone-200 dark:border-stone-800 bg-stone-100/30 dark:bg-stone-900/30 relative"
                >
                    <div
                        onMouseDown={startResizingList}
                        className="absolute right-0 rtl:right-auto rtl:left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-stone-300 dark:hover:bg-stone-700 active:bg-stone-400 transition-colors z-50 translate-x-[0.5px] rtl:-translate-x-[0.5px]"
                    />

                    {/* Focused / Other Toggle */}
                    <div className="px-4 py-3 bg-transparent">
                        <div className="flex bg-stone-200/50 dark:bg-stone-800 rounded-full p-1 relative h-9">
                            <button
                                onClick={() => setActiveTab('focused')}
                                className={`flex-1 flex items-center justify-center rounded-full text-sm font-sans font-semibold transition-all relative z-10 ${activeTab === 'focused' ? 'bg-white dark:bg-stone-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'}`}
                            >
                                Focused
                            </button>
                            <button
                                onClick={() => setActiveTab('other')}
                                className={`flex-1 flex items-center justify-center rounded-full text-sm font-sans font-semibold transition-all relative z-10 ${activeTab === 'other' ? 'bg-white dark:bg-stone-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'}`}
                            >
                                Other
                            </button>
                        </div>
                    </div>

                    {/* List Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-0">
                        {displayItems.length === 0 ? (
                            <div className="p-8 text-center opacity-40 mt-10">
                                <p className="font-serif italic text-stone-500 dark:text-stone-500">{t.inboxZero}</p>
                            </div>
                        ) : (
                            displayItems.map(item => (
                                <InboxItemCard
                                    key={item.id}
                                    item={item}
                                    isSelected={rightPanelMode === 'read' && selectedItemId === item.id}
                                    onClick={() => handleSelectItem(item.id)}
                                    locale={locale}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* ---------------- RIGHT PANE ---------------- */}
                <div className="flex-1 flex flex-col h-full bg-white dark:bg-stone-900 relative overflow-hidden min-w-[300px]">

                    {/* MODE: CAPTURE OVERLAY (Still supported for other trigger points, though sidebar is main now) */}
                    {rightPanelMode === 'capture' && (
                        <div className="absolute inset-0 z-30 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
                            <div className="w-full max-w-xl">
                                <button
                                    onClick={() => setRightPanelMode('read')}
                                    className="absolute top-8 right-8 rtl:right-auto rtl:left-8 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-100 text-center mb-8 tracking-tight">{t.capture}</h1>

                                <div className="bg-white dark:bg-stone-900 p-6 shadow-xl rounded-xl border border-stone-200 dark:border-stone-800">
                                    <textarea
                                        autoFocus
                                        value={captureText}
                                        onChange={(e) => setCaptureText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleCaptureSubmit();
                                            }
                                        }}
                                        placeholder={t.writeDown}
                                        className="w-full bg-transparent font-serif text-xl text-stone-800 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none resize-none min-h-[120px]"
                                    />
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                                        <span className="text-xs text-stone-400 font-sans">Enter to save</span>
                                        <button
                                            onClick={handleCaptureSubmit}
                                            className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-sm font-sans font-medium hover:bg-stone-800 dark:hover:bg-stone-200"
                                        >
                                            {t.save}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODE: COMPOSE MAIL / REPLY / FORWARD (Slide Up Animation) */}
                    <div
                        className={`
               absolute inset-0 z-30 bg-white dark:bg-stone-900 flex flex-col transition-transform duration-500 ease-in-out shadow-2xl
               ${rightPanelMode === 'compose' ? 'translate-y-0 opacity-100' : 'translate-y-[110%] opacity-0 pointer-events-none'}
             `}
                    >
                        {/* 1. Send/Discard Toolbar (Now on Top) */}
                        <div className="flex-none">
                            <TopComposeActionToolbar />
                        </div>

                        {/* 2. Formatting Toolbar */}
                        <div className="flex-none">
                            <FormatToolbar />
                        </div>

                        <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-stone-900">
                            <div className="px-8 py-4 space-y-0 max-w-5xl mx-auto w-full">

                                {/* From Field */}
                                <div className="flex items-center py-2 border-b border-stone-100 dark:border-stone-800">
                                    <span className="text-sm font-sans text-stone-500 w-20">{t.from}:</span>
                                    <span className="text-sm font-sans text-stone-800 dark:text-stone-300">Mohamed Ali (mohamedali89114@gmail.com)</span>
                                    <div className="ms-auto flex gap-2 text-stone-400">
                                        <ChevronUp className="w-4 h-4" />
                                        <ExternalLink className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* To Field */}
                                <div className="flex items-center py-2 border-b-2 border-blue-500 relative group">
                                    <span className="text-sm font-sans text-stone-500 w-20">{t.to}:</span>
                                    <input
                                        type="text"
                                        value={composeTo}
                                        onChange={(e) => setComposeTo(e.target.value)}
                                        className="flex-1 focus:outline-none font-sans text-stone-900 dark:text-stone-100 dark:bg-stone-900 py-1"
                                        autoFocus
                                    />
                                    <div className="ms-auto flex gap-3 text-stone-600 dark:text-stone-400 text-xs font-sans">
                                        <button className="hover:underline">{t.cc}</button>
                                        <button className="hover:underline">{t.bcc}</button>
                                        <User className="w-4 h-4 border border-stone-300 dark:border-stone-600 rounded p-0.5" />
                                    </div>
                                </div>

                                {/* Subject Field */}
                                <div className="flex items-center py-2 border-b border-stone-100 dark:border-stone-800 group focus-within:border-stone-400 transition-colors">
                                    <span className="text-sm font-sans text-stone-500 w-20">{t.subject}:</span>
                                    <input
                                        type="text"
                                        value={composeSubject}
                                        onChange={(e) => setComposeSubject(e.target.value)}
                                        className="flex-1 focus:outline-none font-sans text-stone-900 dark:text-stone-100 dark:bg-stone-900 py-1"
                                    />
                                    <div className="ms-auto flex items-center gap-1 text-stone-500 text-xs font-sans">
                                        <span>{t.importance}</span>
                                        <ChevronDown className="w-3 h-3" />
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <textarea
                                        value={composeBody}
                                        onChange={(e) => setComposeBody(e.target.value)}
                                        className="w-full h-[50vh] font-serif text-lg text-stone-800 dark:text-stone-200 bg-transparent focus:outline-none resize-none leading-relaxed"
                                        placeholder=""
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MODE: READ (Default Layer) */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {selectedItem ? (
                            <>
                                {/* Reading Pane Header */}
                                <div className="flex-none px-8 py-6 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between bg-white dark:bg-stone-900 sticky top-0 z-10">
                                    <div className="flex gap-4 overflow-hidden flex-1">
                                        <div className={`
                        flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-serif font-bold border shadow-sm
                        ${selectedItem.aiSuggestions
                                                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50'
                                                : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'}
                      `}>
                                            {selectedItem.content.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h1 className="font-serif text-2xl text-stone-900 dark:text-stone-100 leading-tight mb-1 truncate">
                                                {selectedItem.status === 'clarified' && selectedItem.aiSuggestions
                                                    ? selectedItem.aiSuggestions.nextAction
                                                    : 'New Note'}
                                            </h1>
                                            <div className="flex items-center gap-2 text-xs font-sans text-stone-400 dark:text-stone-500">
                                                <span className="font-semibold text-stone-600 dark:text-stone-400">You</span>
                                                <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600"></span>
                                                <span>{selectedItem.createdAt.toLocaleString(locale)}</span>
                                                {selectedItem.status === 'clarified' && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600"></span>
                                                        <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">Clarified</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reading Pane Content */}
                                <div className="flex-1 overflow-y-auto p-8 md:px-12 scroll-smooth">
                                    {/* Body Text */}
                                    <div className="max-w-3xl">
                                        <p className="font-serif text-xl leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
                                            {selectedItem.content}
                                        </p>
                                    </div>


                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-stone-300 dark:text-stone-600">
                                <div className="w-20 h-20 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 flex items-center justify-center mb-4 rotate-3 rtl:-rotate-3">
                                    <div className="w-16 h-2 bg-stone-200 dark:bg-stone-700 rounded-full mb-2"></div>
                                    <div className="w-12 h-2 bg-stone-200 dark:bg-stone-700 rounded-full"></div>
                                </div>
                                <p className="font-serif italic text-lg text-stone-400 dark:text-stone-500">{t.selectItem}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
