import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Plus,
    Pencil,
    Link2,
    Star,
    Settings,
    Pin,
    Lock,
    ShieldCheck,
    Save,
    CheckCircle,
    Sparkles,
    CopyPlus,
    Trash2,
    Share2,
    Layout,
    List,
    Calendar as CalendarIcon,
    FileText,
    Kanban,
    FormInput,
    Table as TableIcon,
    BarChart,
    Clock,
    Activity,
    Users,
    BrainCircuit,
    Map as MapIcon,
    MessageSquare,
    Search,
    User,
    Filter,
    ArrowUpDown,
    EyeOff,
    Layers,
    Zap,
    LayoutDashboard,
    Download
} from 'lucide-react';
import TaskBoard from '../../ui/TaskBoard';
import KanbanBoard from '../../ui/KanbanBoard';
import { roomService } from './roomService';
import { authService } from '../../services/auth';
import RoomCalendar from './RoomCalendar';
import RoomOverview from './RoomOverview';
import RoomTable from './RoomTable';
import Whiteboard from './Whiteboard';
import Lists from './lists/Lists';
import { ConfirmModal } from '../../ui/ConfirmModal';


interface RoomViewPageProps {
    roomName: string;
    roomId: string;
}

type ViewType = 'list' | 'calendar' | 'overview' | 'placeholder' | 'board' | 'whiteboard' | 'simple-list' | 'table';


interface ViewConfig {
    id: string;
    type: ViewType;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: 'popular' | 'more';
}

interface SavedViews {
    views: ViewConfig[];
    activeViewId: string | null;
}

type ContextMenuState = {
    viewId: string;
    x: number;
    y: number;
} | null;

import { useStore } from '../../contexts/StoreContext';

const RoomViewPage: React.FC<RoomViewPageProps> = ({ roomName: initialRoomName, roomId }) => {
    const { tasks, updateTask } = useStore();
    const storageKey = useMemo(() => `room-views-${roomId}`, [roomId]);


    const viewOptions: ViewConfig[] = [
        { id: 'overview', type: 'overview', name: 'Overview', description: 'Drag, resize, and track cards', icon: <Layout className="text-indigo-500" />, category: 'popular' },
        { id: 'list', type: 'list', name: 'Tasks', description: 'Track tasks, bugs, people & more', icon: <List className="text-blue-500" />, category: 'popular' },
        { id: 'simple-list', type: 'simple-list', name: 'List', description: 'Simple list view', icon: <List className="text-blue-500" />, category: 'popular' },

        { id: 'board', type: 'board', name: 'Kanban', description: 'Move tasks between columns', icon: <Kanban className="text-purple-500" />, category: 'popular' },
        { id: 'calendar', type: 'calendar', name: 'Calendar', description: 'Plan, schedule, & delegate', icon: <CalendarIcon className="text-green-500" />, category: 'popular' },
        { id: 'gantt', type: 'placeholder', name: 'Gantt', description: 'Plan dependencies & time', icon: <Activity className="text-orange-500" />, category: 'popular' },
        { id: 'doc', type: 'placeholder', name: 'Doc', description: 'Collaborate & document anything', icon: <FileText className="text-pink-500" />, category: 'popular' },
        { id: 'form', type: 'placeholder', name: 'Form', description: 'Collect, track, & report data', icon: <FormInput className="text-teal-500" />, category: 'popular' },
        { id: 'table', type: 'table', name: 'Table', description: 'Structured table format', icon: <TableIcon className="text-cyan-500" />, category: 'more' },
        { id: 'dashboard', type: 'placeholder', name: 'Dashboard', description: 'Track metrics & insights', icon: <BarChart className="text-red-500" />, category: 'more' },
        { id: 'timeline', type: 'placeholder', name: 'Timeline', description: 'See tasks by start & due date', icon: <Clock className="text-yellow-500" />, category: 'more' },
        { id: 'activity', type: 'placeholder', name: 'Activity', description: 'Real-time activity feed', icon: <Activity className="text-indigo-400" />, category: 'more' },
        { id: 'workload', type: 'placeholder', name: 'Workload', description: 'Visualize team capacity', icon: <BarChart className="text-emerald-500" />, category: 'more' },
        { id: 'whiteboard', type: 'whiteboard', name: 'Whiteboard', description: 'Visualize & brainstorm ideas', icon: <Layout className="text-violet-500" />, category: 'more' },
        { id: 'team', type: 'placeholder', name: 'Team', description: 'Monitor work being done', icon: <Users className="text-blue-400" />, category: 'more' },
        { id: 'mindmap', type: 'placeholder', name: 'Mind Map', description: 'Visual brainstorming of ideas', icon: <BrainCircuit className="text-fuchsia-500" />, category: 'more' },
        { id: 'map', type: 'placeholder', name: 'Map', description: 'Tasks visualized by address', icon: <MapIcon className="text-rose-500" />, category: 'more' },
        { id: 'chat', type: 'placeholder', name: 'Chat', description: 'Communicate with your team', icon: <MessageSquare className="text-sky-500" />, category: 'more' },
    ];

    const loadSaved = (): SavedViews => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.views) {
                    const hydratedViews = parsed.views.map((savedView: ViewConfig) => {
                        const template = viewOptions.find(v => v.id === savedView.id);
                        if (template) {
                            return { ...savedView, name: template.name, description: template.description, icon: template.icon };
                        }
                        // Fallback for dynamically added views of type 'list'
                        if (savedView.type === 'list' && savedView.name === 'List') {
                            return { ...savedView, name: 'Tasks' };
                        }
                        return savedView;
                    });
                    return { ...parsed, views: hydratedViews };
                }
            }
        } catch (e) {
            console.warn('Failed to load saved views', e);
        }
        return { views: [], activeViewId: null };
    };

    const initialSaved = useMemo(() => loadSaved(), [storageKey]);
    const [views, setViews] = useState<ViewConfig[]>(() => {
        const saved = initialSaved.views || [];
        const hasOverview = saved.some(v => v.id === 'overview');
        return hasOverview ? saved : [viewOptions[0], ...saved];
    });
    const [activeViewId, setActiveViewId] = useState<string | null>(() => initialSaved.activeViewId || 'overview');
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [roomName, setRoomName] = useState(initialRoomName);
    const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

    // Fetch actual room name from API
    useEffect(() => {
        const fetchRoomName = async () => {
            try {
                const currentUser = authService.getCurrentUser();
                if (currentUser) {
                    const rooms = await roomService.getRooms(currentUser.id);
                    const currentRoom = rooms.find(room => room.id === roomId);
                    if (currentRoom) {
                        setRoomName(currentRoom.name);
                    }
                }
            } catch (e) {
                console.error('Failed to load room name:', e);
            }
        };
        fetchRoomName();
    }, [roomId]);

    const saveViews = (nextViews: ViewConfig[], nextActive: string | null) => {
        try {
            const viewsToSave = nextViews.map(({ icon, ...rest }) => rest);
            localStorage.setItem(storageKey, JSON.stringify({ views: viewsToSave, activeViewId: nextActive }));
        } catch (e) {
            console.warn('Failed to save views', e);
        }
    };

    useEffect(() => {
        if (!activeViewId && views.length > 0) {
            setActiveViewId(views[0].id);
        }
    }, [activeViewId, views]);

    useEffect(() => {
        saveViews(views, activeViewId || null);
    }, [views, activeViewId]);

    const openContextMenu = (event: React.MouseEvent, viewId: string) => {
        event.preventDefault();
        setShowAddMenu(false);

        const menuWidth = 300;
        const menuHeight = 420;
        const x = Math.min(Math.max(8, event.clientX), window.innerWidth - menuWidth - 8);
        const y = Math.min(Math.max(8, event.clientY), window.innerHeight - menuHeight - 8);

        setContextMenu({ viewId, x, y });
    };

    const handleAddView = (view: ViewConfig) => {
        const existing = views.find(v => v.id === view.id);
        if (existing) {
            setActiveViewId(existing.id);
            setShowAddMenu(false);
            return;
        }
        const nextViews = [...views, view];
        setViews(nextViews);
        setActiveViewId(view.id);
        setShowAddMenu(false);
    };

    const ensureListView = () => {
        const listOption = viewOptions.find(v => v.id === 'list');
        if (!listOption) return;
        const existing = views.find(v => v.id === listOption.id);
        if (existing) {
            setActiveViewId(existing.id);
        } else {
            handleAddView(listOption);
        }
    };

    const activeView = views.find(v => v.id === activeViewId) || null;
    const contextMenuView = contextMenu ? views.find(v => v.id === contextMenu.viewId) : null;

    const [viewToDelete, setViewToDelete] = useState<string | null>(null);

    const handleDeleteViewClick = (viewId: string) => {
        setViewToDelete(viewId);
        setContextMenu(null);
    };

    const confirmDeleteView = () => {
        if (!viewToDelete) return;

        const viewId = viewToDelete;
        const viewToDeleteConfig = views.find(v => v.id === viewId);
        const updatedViews = views.filter(v => v.id !== viewId);

        if (viewToDeleteConfig) {
            const taskBoardViews = ['list', 'board', 'calendar'];

            // If deleting a view that uses taskboard data
            if (taskBoardViews.includes(viewToDeleteConfig.type)) {
                // Check if any other views using taskboard data remain
                const hasRemainingTaskView = updatedViews.some(v => taskBoardViews.includes(v.type));
                if (!hasRemainingTaskView) {
                    localStorage.removeItem(`taskboard-${roomId}`);
                }
            }

            // If deleting overview
            if (viewToDeleteConfig.type === 'overview') {
                const hasRemainingOverview = updatedViews.some(v => v.type === 'overview');
                if (!hasRemainingOverview) {
                    localStorage.removeItem(`overview-${roomId}`);
                }
            }
        }

        setViews(updatedViews);
        if (activeViewId === viewId) {
            setActiveViewId(updatedViews[0]?.id || null);
        }
        setViewToDelete(null);
    };

    // State for rename
    const [viewToRename, setViewToRename] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const handleRenameClick = (viewId: string, currentName: string) => {
        setViewToRename(viewId);
        setRenameValue(currentName);
        setContextMenu(null);
    };

    const confirmRename = () => {
        if (!viewToRename) return;
        setViews(views.map(v => v.id === viewToRename ? { ...v, name: renameValue } : v));
        setViewToRename(null);
        setRenameValue('');
    };

    const handleCopyLink = (viewId: string) => {
        const url = `${window.location.origin}/rooms/${roomId}/views/${viewId}`;
        navigator.clipboard.writeText(url);
        // Toast logic could go here
        setContextMenu(null);
        alert('Link copied to clipboard'); // Simple feedback
    };

    const handleDuplicateView = (viewId: string) => {
        const viewToDuplicate = views.find(v => v.id === viewId);
        if (!viewToDuplicate) return;

        const newView = {
            ...viewToDuplicate,
            id: crypto.randomUUID(),
            name: `${viewToDuplicate.name} (Copy)`
        };
        const insertIndex = views.findIndex(v => v.id === viewId) + 1;
        const nextViews = [...views];
        nextViews.splice(insertIndex, 0, newView);
        setViews(nextViews);
        setContextMenu(null);
    };

    // Assuming we have toggleable properties in ViewConfig or auxiliary state.
    // Since ViewConfig doesn't have these props yet, I'll extend it or use local state map for demo.
    // For now, I'll store these in a separate state object since changing ViewConfig interface might affect other files.
    // However, to be "functionable", ideally they should persist.
    // Let's add extended state management for these properties.
    const [viewSettings, setViewSettings] = useState<Record<string, { pinned?: boolean, public?: boolean, autosave?: boolean, isDefault?: boolean, favorite?: boolean }>>({});

    // Load/Save view settings
    useEffect(() => {
        const saved = localStorage.getItem(`room-view-settings-${roomId}`);
        if (saved) {
            try {
                setViewSettings(JSON.parse(saved));
            } catch (e) { }
        }
    }, [roomId]);

    useEffect(() => {
        localStorage.setItem(`room-view-settings-${roomId}`, JSON.stringify(viewSettings));
    }, [viewSettings, roomId]);

    const toggleSetting = (viewId: string, parsedSetting: 'pinned' | 'public' | 'autosave' | 'isDefault' | 'favorite') => {
        setViewSettings(prev => {
            const current = prev[viewId] || {};
            // If setting default, unset others? Not strictly requested but logical. Let's keep specific.
            return {
                ...prev,
                [viewId]: {
                    ...current,
                    [parsedSetting]: !current[parsedSetting]
                }
            };
        });
        // We do not close the menu here so user can toggle multiple things
    };

    // Helper to get setting
    const getSetting = useCallback((viewId: string, setting: 'pinned' | 'public' | 'autosave' | 'isDefault' | 'favorite') => {
        return viewSettings[viewId]?.[setting] || false;
    }, [viewSettings]);

    // Sorting logic for views: Overview -> Pinned -> Rest (in original order)
    const sortedViews = useMemo(() => {
        // Create a map of indices to preserve original order stability
        const originalIndices = new Map(views.map((v, i) => [v.id, i]));

        return [...views].sort((a, b) => {
            // 1. Overview always comes first
            // Check both id and type to be safe
            const aIsOverview = a.id === 'overview' || a.type === 'overview';
            const bIsOverview = b.id === 'overview' || b.type === 'overview';

            if (aIsOverview && !bIsOverview) return -1;
            if (!aIsOverview && bIsOverview) return 1;
            if (aIsOverview && bIsOverview) return 0;

            // 2. Pinned items come next
            const aPinned = getSetting(a.id, 'pinned');
            const bPinned = getSetting(b.id, 'pinned');
            if (aPinned !== bPinned) {
                return aPinned ? -1 : 1;
            }

            // 3. Fallback to original order
            return (originalIndices.get(a.id) || 0) - (originalIndices.get(b.id) || 0);
        });
    }, [views, getSetting]);

    return (
        <div className="flex flex-col flex-1 bg-white">


            {/* Second Header Bar - Breadcrumb and Tabs */}
            <header className="relative z-[100] h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">


                <div className="flex items-center space-x-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm text-gray-600">
                        <span>Private Rooms</span>
                        <span className="mx-2 text-gray-400">/</span>
                        <span className="font-medium text-gray-800">{roomName}</span>
                    </div>

                    {/* Separator */}
                    <div className="h-6 w-px bg-gray-300"></div>

                    {/* Dynamic Tabs */}
                    <div className="flex items-center space-x-2">
                        {sortedViews.map((view) => (
                            <button
                                key={view.id}
                                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors border-b-2 flex items-center gap-2 ${activeViewId === view.id ? 'text-gray-900 border-gray-800' : 'text-gray-500 border-transparent hover:text-gray-800'}`}
                                onClick={() => {
                                    setActiveViewId(view.id);
                                    setContextMenu(null);
                                }}
                                onContextMenu={(e) => openContextMenu(e, view.id)}
                            >
                                {view.icon && (
                                    <span className="w-4 h-4 flex items-center justify-center">
                                        {React.isValidElement(view.icon)
                                            ? React.cloneElement(view.icon as React.ReactElement<any>, { size: 16 })
                                            : view.icon}
                                    </span>
                                )}
                                {view.name}
                            </button>
                        ))}

                        <div className="relative">
                            <button
                                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                onClick={() => setShowAddMenu(!showAddMenu)}
                            >
                                <Plus size={14} />
                                <span>Add</span>
                            </button>

                            {showAddMenu && (
                                <>
                                    <div className="fixed inset-0 z-[49]" onClick={() => setShowAddMenu(false)}></div>
                                    <div className="absolute top-full left-0 mt-2 w-[520px] bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 max-h-[600px] overflow-y-auto">

                                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Popular</h3>
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            {viewOptions.filter(v => v.category === 'popular').map((option) => (
                                                <button
                                                    key={option.id}
                                                    className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                                    onClick={() => handleAddView(option)}
                                                >
                                                    <span className="mr-3">{option.icon}</span>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{option.name}</div>
                                                        <div className="text-xs text-gray-500">{option.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 pt-2 border-t">More views</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {viewOptions.filter(v => v.category === 'more').map((option) => (
                                                <button
                                                    key={option.id}
                                                    className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                                    onClick={() => handleAddView(option)}
                                                >
                                                    <span className="mr-3">{option.icon}</span>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{option.name}</div>
                                                        <div className="text-xs text-gray-500">{option.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>



            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden bg-gray-50">
                {activeView?.type === 'list' && (
                    <TaskBoard
                        key={`list-${activeView.id}`}
                        storageKey={`taskboard-${roomId}-${activeView.id}`}
                    />
                )}
                {activeView?.type === 'simple-list' && (
                    <Lists key={`simple-list-${activeView.id}`} roomId={roomId} viewId={activeView.id} />
                )}
                {activeView?.type === 'table' && (
                    <RoomTable key={`table-${activeView.id}`} roomId={roomId} viewId={activeView.id} />
                )}


                {activeView?.type === 'board' && (
                    <KanbanBoard
                        key={`board-${activeView.id}`}
                        storageKey={`taskboard-${roomId}-${activeView.id}`}
                    />
                )}
                {activeView?.type === 'calendar' && <RoomCalendar key={`calendar-${roomId}`} refreshTrigger={activeView.id} />}
                {activeView?.type === 'overview' && <RoomOverview key={`overview-${roomId}`} storageKey={`overview-${roomId}`} />}
                {activeView?.type === 'whiteboard' && <Whiteboard key={`whiteboard-${roomId}`} />}

                {/* Placeholders for other views */}
                {!['list', 'board', 'calendar', 'overview', 'whiteboard', 'simple-list'].includes(activeView?.type || '') && (

                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <LayoutDashboard size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">View not implemented yet</p>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!viewToDelete}
                onClose={() => setViewToDelete(null)}
                onConfirm={confirmDeleteView}
                title="Delete View"
                message="Are you sure you want to delete this view? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
            <ConfirmModal
                isOpen={!!viewToRename}
                onClose={() => setViewToRename(null)}
                onConfirm={confirmRename}
                title="Rename View"
                message={
                    <div>
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="View Name"
                            autoFocus
                        />
                    </div>
                }
                confirmText="Rename"
            />

            {contextMenu && contextMenuView && (
                <>
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setContextMenu(null)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu(null);
                        }}
                    />
                    <div
                        className="fixed z-[101] w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <div className="py-1">
                            <button
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                                onClick={() => handleRenameClick(contextMenu.viewId, contextMenuView?.name || '')}
                            >
                                <Pencil size={16} className="text-gray-500" />
                                Rename
                            </button>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                                onClick={() => handleCopyLink(contextMenu.viewId)}
                            >
                                <Link2 size={16} className="text-gray-500" />
                                Copy link to view
                            </button>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                                onClick={() => toggleSetting(contextMenu.viewId, 'favorite')}
                            >
                                <Star size={16} className={getSetting(contextMenu.viewId, 'favorite') ? "text-yellow-400 fill-yellow-400" : "text-gray-500"} />
                                {getSetting(contextMenu.viewId, 'favorite') ? 'Remove from favorites' : 'Add to favorites'}
                            </button>
                        </div>

                        <div className="border-t border-gray-200 my-1" />

                        <div className="py-1">
                            {[
                                { icon: Pin, label: 'Pin view', setting: 'pinned' as const },
                                { icon: Lock, label: 'Public view', setting: 'public' as const },
                                { icon: Save, label: 'Autosave for me', setting: 'autosave' as const },
                                { icon: CheckCircle, label: 'Set as default view', setting: 'isDefault' as const },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                                    onClick={() => toggleSetting(contextMenu.viewId, item.setting)}
                                >
                                    <item.icon size={16} className="text-gray-500" />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${getSetting(contextMenu.viewId, item.setting) ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${getSetting(contextMenu.viewId, item.setting) ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 my-1" />

                        <div className="py-1">
                            <button
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                                onClick={() => handleDuplicateView(contextMenu.viewId)}
                            >
                                <CopyPlus size={16} className="text-gray-500" />
                                Duplicate view
                            </button>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteViewClick(contextMenu.viewId)}
                            >
                                <Trash2 size={16} className="text-red-500" />
                                Delete view
                            </button>
                        </div>

                        <div className="border-t border-gray-200 my-1" />

                        <button
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
                            onClick={() => {/* TODO: Implement Sharing */ }}
                        >
                            <Share2 size={16} />
                            Sharing & Permissions
                        </button>
                    </div>
                </>
            )}
        </div>

    );
};

export default RoomViewPage;
