import React, { useState, useEffect, useCallback } from 'react';
import RemindersSidebar from './components/RemindersSidebar';
import ReminderList from './components/ReminderList';
import ReminderDetail from './components/ReminderDetail';
import { Reminder, FilterType, Priority } from './types';
import { remindersService } from './remindersService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUI } from '../../contexts/UIContext';
import { v4 as uuidv4 } from 'uuid';

const RemindersPage: React.FC = () => {
    const { direction, t } = useLanguage();
    const { theme } = useUI();

    // --- State ---
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [activeFilter, setActiveFilter] = useState<FilterType>('inbox');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Layout Resizing State
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [listWidth, setListWidth] = useState(380);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const [isResizingList, setIsResizingList] = useState(false);

    // --- Data Loading ---
    useEffect(() => {
        const loadReminders = async () => {
            setLoading(true);
            try {
                const data = await remindersService.getReminders();
                setReminders(data);
            } catch (error) {
                console.error('Failed to load reminders', error);
            } finally {
                setLoading(false);
            }
        };
        loadReminders();

        const unsubscribe = remindersService.subscribe(() => {
            loadReminders();
        });
        return unsubscribe;
    }, []);

    // --- Handlers ---

    const handleResize = useCallback((e: MouseEvent) => {
        // Basic resizing logic adapted for both LTR and RTL
        const clientX = e.clientX;
        const windowWidth = window.innerWidth;

        // In RTL, the "Left" of the screen is x=0, but content starts from Right.
        // Sidebar is at Right. Resizer is at windowWidth - sidebarWidth.
        // If calculating width based on mouse:
        // LTR: Width = clientX
        // RTL: Width = windowWidth - clientX

        if (isResizingSidebar) {
            let newWidth = clientX;
            if (direction === 'rtl') {
                newWidth = windowWidth - clientX;
            }
            setSidebarWidth(Math.max(200, Math.min(400, newWidth)));
        } else if (isResizingList) {
            if (direction === 'rtl') {
                // In RTL: [Detail] [Resizer2] [List] [Resizer1] [Sidebar]
                // The visual order (DOM order is Sidebar, List, Detail)
                // Actually, Resizer2 is between List and Detail.
                // List Width calc is complex because it depends on Sidebar width.
                // Let's stick to simple delta if possible, or relative calculation.
                // Distance from Right Edge = windowWidth - clientX.
                // This distance includes SidebarWidth + ListWidth.
                // So ListWidth = (windowWidth - clientX) - sidebarWidth
                const distFromRight = windowWidth - clientX;
                const newListWidth = distFromRight - sidebarWidth;
                setListWidth(Math.max(300, Math.min(600, newListWidth)));
            } else {
                // LTR: [Sidebar] [Resizer1] [List] [Resizer2] [Detail]
                // Distance from Left = clientX.
                // ListWidth = clientX - sidebarWidth
                const newListWidth = clientX - sidebarWidth;
                setListWidth(Math.max(300, Math.min(600, newListWidth)));
            }
        }
    }, [isResizingSidebar, isResizingList, sidebarWidth, direction]);

    const stopResizing = useCallback(() => {
        setIsResizingSidebar(false);
        setIsResizingList(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, []);

    useEffect(() => {
        if (isResizingSidebar || isResizingList) {
            window.addEventListener('mousemove', handleResize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', handleResize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizingSidebar, isResizingList, handleResize, stopResizing]);

    const startResizeSidebar = () => {
        setIsResizingSidebar(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const startResizeList = () => {
        setIsResizingList(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    // CRUD Operations Wrapper
    const handleAddReminder = async (newReminder: any) => {
        // Optimistic UI or wait for reload? Service triggers reload via event.
        // We can just call service.
        await remindersService.addReminder({
            ...newReminder,
            // Ensure defaults
            priority: newReminder.priority || 'medium',
            completed: false,
            subtasks: [],
            tags: newReminder.tags || [],
            listId: 'inbox' // Default list
        });
        // Selection will happen on reload? Or manual? 
        // Ideally we select the new one. But ID is generated by backend/service.
        // Service.addReminder returns the object with ID.
    };

    const handleUpdateReminder = async (updated: Reminder) => {
        await remindersService.updateReminder(updated.id, {
            title: updated.title,
            notes: updated.notes,
            priority: updated.priority,
            completed: updated.completed,
            dueDate: updated.dueDate,
            time: updated.time,
            tags: updated.tags
        });
    };

    const handleDeleteReminder = async (id: string) => {
        await remindersService.deleteReminder(id);
        if (selectedId === id) setSelectedId(null);
    };

    const handleToggleStatus = async (id: string) => {
        const r = reminders.find(item => item.id === id);
        if (r) {
            await remindersService.updateReminder(id, { completed: !r.completed });
        }
    };

    // Derived State
    const selectedReminder = reminders.find(r => r.id === selectedId) || null;

    return (
        <div
            className="flex h-full w-full overflow-hidden text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-950"
            dir={direction}
        >

            {/* 1. Sidebar */}
            <RemindersSidebar
                activeFilter={activeFilter}
                onFilterChange={(f) => { setActiveFilter(f); setSelectedId(null); }}
                width={sidebarWidth}
                onAdd={handleAddReminder}
            />

            {/* Resize Handle 1 */}
            <div
                className="w-1 cursor-col-resize hover:bg-stone-300 dark:hover:bg-stone-700 active:bg-amber-500 transition-colors z-50 flex flex-col justify-center"
                onMouseDown={startResizeSidebar}
            >
                <div className="h-4 w-0.5 bg-stone-300 dark:bg-stone-600 mx-auto rounded-full" />
            </div>

            {/* 2. List Pane */}
            <ReminderList
                reminders={reminders}
                activeFilter={activeFilter}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={handleAddReminder}
                onToggleStatus={handleToggleStatus}
                width={listWidth}
            />

            {/* Resize Handle 2 */}
            <div
                className="w-1 cursor-col-resize hover:bg-stone-300 dark:hover:bg-stone-700 active:bg-amber-500 transition-colors z-50 flex flex-col justify-center"
                onMouseDown={startResizeList}
            >
                <div className="h-4 w-0.5 bg-stone-300 dark:bg-stone-600 mx-auto rounded-full" />
            </div>

            {/* 3. Detail Pane */}
            <ReminderDetail
                reminder={selectedReminder}
                onUpdate={handleUpdateReminder}
                onDelete={handleDeleteReminder}
                width={0} // Flex grow handles this
            />

        </div>
    );
};

export default RemindersPage;
