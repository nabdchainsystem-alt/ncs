import React, { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUI } from '../../contexts/UIContext';
import { InboxMainView } from './components/InboxMainView';
import { InboxSidebar } from './components/InboxSidebar';
import { InboxItem, ViewState, Translations } from './types';
import { Menu, X, Sun, Moon } from 'lucide-react';

// Translation Dictionary (from inbox/App.tsx)
const translations: Record<'en' | 'ar', Translations> = {
    en: {
        newMail: "New Mail",
        capture: "Capture",
        inbox: "Inbox",
        archive: "Archive",
        drafts: "Drafts",
        sent: "Sent",
        deleted: "Deleted Items",
        history: "Conversation History",
        junk: "Junk Email",
        folders: "Folders",
        createFolder: "Create new folder",
        capturePlaceholder: "Capture Your Thought",
        save: "Add",
        delete: "Delete",
        reply: "Reply",
        replyAll: "Reply All",
        forward: "Forward",
        move: "Move",
        flag: "Flag",
        sync: "Sync",
        block: "Block",
        print: "Print",
        more: "More",
        from: "From",
        to: "To",
        subject: "Subject",
        send: "Send",
        discard: "Discard",
        attach: "Attach File",
        signature: "Signature",
        editor: "Editor",
        checkAccess: "Check Accessibility",
        smartProcessing: "Smart Processing",
        clarifyAi: "Clarify with AI",
        thinking: "Thinking...",
        aiResult: "AI Analysis Result",
        nextAction: "Next Action",
        project: "Project",
        context: "Context",
        why: "Why",
        edit: "Edit Details",
        confirm: "Confirm & Organize",
        selectItem: "Select an item to read",
        undo: "Undo",
        importance: "Importance",
        cc: "Cc",
        bcc: "Bcc",
        personal: "Personal",
        receipts: "Receipts",
        travel: "Travel Plans",
        work: "Work Projects",
        writeDown: "Write it down...",
        search: "Search",
        inboxZero: "Inbox zero."
    },
    ar: {
        newMail: "بريد جديد",
        capture: "تدوين",
        inbox: "البريد الوارد",
        archive: "الأرشيف",
        drafts: "المسودات",
        sent: "البريد المرسل",
        deleted: "المحذوفات",
        history: "سجل المحادثات",
        junk: "البريد العشوائي",
        folders: "المجلدات",
        createFolder: "إنشاء مجلد جديد",
        capturePlaceholder: "التقط أفكارك...",
        save: "إضافة",
        delete: "حذف",
        reply: "رد",
        replyAll: "رد على الكل",
        forward: "إعادة توجيه",
        move: "نقل",
        flag: "متابعة",
        sync: "مزامنة",
        block: "حظر",
        print: "طباعة",
        more: "المزيد",
        from: "من",
        to: "إلى",
        subject: "الموضوع",
        send: "إرسال",
        discard: "تجاهل",
        attach: "إرفاق ملف",
        signature: "التوقيع",
        editor: "المحرر",
        checkAccess: "التحقق من الوصول",
        smartProcessing: "المعالج الذكي",
        clarifyAi: "توضيح بالذكاء الاصطناعي",
        thinking: "جاري التفكير...",
        aiResult: "نتائج التحليل الذكي",
        nextAction: "الإجراء التالي",
        project: "المشروع",
        context: "السياق",
        why: "السبب",
        edit: "تعديل التفاصيل",
        confirm: "تأكيد وتنظيم",
        selectItem: "حدد عنصرًا للقراءة",
        undo: "تراجع",
        importance: "الأهمية",
        cc: "نسخة",
        bcc: "مخفية",
        personal: "شخصي",
        receipts: "إيصالات",
        travel: "خطط السفر",
        work: "مشاريع العمل",
        writeDown: "اكتب أفكارك...",
        search: "بحث",
        inboxZero: "صندوق الوارد فارغ."
    }
};

const InboxPage: React.FC = () => {
    // Global Contexts
    const { language, setLanguage } = useLanguage();
    const { theme, setTheme } = useUI();
    const direction = language === 'ar' ? 'rtl' : 'ltr';

    // Local UI State
    const [currentView, setCurrentView] = useState<ViewState>(ViewState.INBOX);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Sidebar Resize State
    const [sidebarWidth, setSidebarWidth] = useState(240);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);

    // Right Panel State
    const [rightPanelMode, setRightPanelMode] = useState<'read' | 'compose' | 'capture'>('read');

    // Items State (Mock data for now, matching the inbox folder implementation)
    // Ideally this would come from a service or backend if strictly requested, 
    // but the instruction "replace with the content in folder inbox" prioritizes the inbox folder's state.
    const [items, setItems] = useState<InboxItem[]>([
        {
            id: '1',
            sender: 'Alice Finance',
            subject: 'Financial Update',
            content: 'Review the quarterly budget proposal from finance team. We need to finalize the allocation for the new marketing campaign by Friday.',
            createdAt: new Date(Date.now() - 1000 * 60 * 5),
            status: 'inbox',
            isFocused: true,
        },
        {
            id: '2',
            sender: 'Mom',
            subject: 'Family Reunion',
            content: 'Call Mom to wish her happy birthday. Also ask about the family reunion dates in August so I can book flights.',
            createdAt: new Date(Date.now() - 1000 * 60 * 45),
            status: 'inbox',
            isFocused: true,
        },
        {
            id: '3',
            sender: 'Office Manager',
            subject: 'Office Furniture',
            content: 'Research standing desks. Look for options with solid wood tops, ideally walnut. Budget around $800. Check Wirecutter reviews first.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
            status: 'inbox',
            isFocused: false,
        },
        {
            id: '4',
            sender: 'Bob Project Lead',
            subject: 'Project Phoenix',
            content: 'Draft the initial concept for the "Project Phoenix" redesign. Focus on the user onboarding flow and simplified navigation structure.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
            status: 'inbox',
            isFocused: true,
        }
    ]);

    const handleCapture = (content: string) => {
        const newItem: InboxItem = {
            id: Date.now().toString(),
            content,
            createdAt: new Date(),
            status: 'inbox',
        };
        setItems(prev => [newItem, ...prev]);
    };

    const handleDelete = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleComplete = (id: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, status: 'done' } : item
        ));
    };

    const handleUpdate = (id: string, updates: Partial<InboxItem>) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    };

    const inboxCount = items.filter(i => i.status === 'inbox' || i.status === 'clarified').length;

    // Sidebar Resizing Logic
    const startResizingSidebar = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingSidebar(true);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingSidebar) {
                const delta = direction === 'rtl' ? -e.movementX : e.movementX;
                setSidebarWidth(prev => {
                    const newWidth = prev + delta;
                    if (newWidth < 180) return 180;
                    if (newWidth > 400) return 400;
                    return newWidth;
                });
            }
        };

        const handleMouseUp = () => {
            setIsResizingSidebar(false);
        };

        if (isResizingSidebar) {
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
    }, [isResizingSidebar, direction]);

    const t = translations[language];

    const handleDirectionToggle = (dir: 'ltr' | 'rtl') => {
        setLanguage(dir === 'ltr' ? 'en' : 'ar');
    };

    // Wrap setTheme if needed, or just pass direct setter
    const handleSetTheme = (newTheme: 'light' | 'nexus' | 'sketch') => {
        setTheme(newTheme);
    };

    // Sync theme with HTML class
    useEffect(() => {
        if (theme === 'nexus' || theme === 'sketch') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    return (
        <div className="flex h-full bg-stone-50 dark:bg-black overflow-hidden text-stone-800 dark:text-stone-200 font-sans selection:bg-stone-200 dark:selection:bg-stone-700 selection:text-stone-900 dark:selection:text-stone-100 transition-colors duration-200 relative">


            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm md:hidden transition-opacity" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute left-0 rtl:left-auto rtl:right-0 top-0 bottom-0 w-72 bg-white dark:bg-black shadow-2xl transform transition-transform" onClick={e => e.stopPropagation()}>
                        <InboxSidebar
                            currentView={currentView}
                            onChangeView={(view) => { setCurrentView(view); setMobileMenuOpen(false); }}
                            inboxCount={inboxCount}
                            onCompose={() => { setRightPanelMode('compose'); setMobileMenuOpen(false); }}
                            onCapture={handleCapture}
                            theme={theme}
                            setTheme={handleSetTheme}
                            direction={direction}
                            setDirection={handleDirectionToggle}
                            t={t}
                        />
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <div
                style={{ width: sidebarWidth }}
                className="hidden md:flex h-full shadow-[1px_0_20px_rgba(0,0,0,0.02)] z-10 relative flex-shrink-0 border-e border-stone-100 dark:border-stone-800"
            >
                <InboxSidebar
                    currentView={currentView}
                    onChangeView={setCurrentView}
                    inboxCount={inboxCount}
                    onCompose={() => setRightPanelMode('compose')}
                    onCapture={handleCapture}
                    theme={theme}
                    setTheme={handleSetTheme}
                    direction={direction}
                    setDirection={handleDirectionToggle}
                    t={t}
                />

                {/* Resize Handle */}
                <div
                    onMouseDown={startResizingSidebar}
                    className="absolute right-0 rtl:right-auto rtl:left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-stone-300 dark:hover:bg-stone-600 active:bg-stone-400 transition-colors z-50 translate-x-[0.5px] rtl:-translate-x-[0.5px]"
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-stone-50 dark:bg-stone-900">
                {/* Mobile Header Toggle */}
                <div className="md:hidden absolute top-4 left-4 rtl:left-auto rtl:right-4 z-30">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 bg-white/80 dark:bg-stone-800/80 backdrop-blur rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
                <main className="flex-1 h-full overflow-hidden">
                    {currentView === ViewState.INBOX && (
                        <InboxMainView
                            items={items}
                            onCapture={handleCapture}
                            onDeleteItem={handleDelete}
                            onCompleteItem={handleComplete}
                            onUpdateItem={handleUpdate}
                            rightPanelMode={rightPanelMode}
                            setRightPanelMode={setRightPanelMode}
                            direction={direction}
                            t={t}
                            locale={language === 'ar' ? 'ar-EG' : 'en-US'}
                        />
                    )}
                    {currentView !== ViewState.INBOX && (
                        <div className="flex flex-col items-center justify-center h-full text-stone-400 dark:text-stone-600 bg-stone-50 dark:bg-stone-950">
                            <span className="font-serif text-2xl italic mb-2 text-stone-300 dark:text-stone-700">Section Under Construction</span>
                            <p className="text-sm font-sans">{t.folders} view coming soon</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default InboxPage;