import React, { useState, useEffect } from 'react';
import {
    Inbox,
    CheckCircle2,
    Briefcase,
    Clock,
    Plus,
    MoreHorizontal,
    Search,
    ChevronRight,
    ArrowRight,
    FolderInput,
    ListChecks,
    Play,
    Calendar,
    Bell,
    Layers,
    CheckSquare,
    Zap,
    Target,
    CloudSun,
    MapPin,
    Sun,
    Cloud,
    CloudRain,
    CloudSnow,
    CloudLightning,
    Wind
} from 'lucide-react';
import { goalsService } from '../../goals/goalsService';
import { discussionService } from '../../discussion/discussionService';
import { remindersService } from '../../reminders/remindersService';
import { GTDCapture } from './tools/GTDCapture';
import { GTDClarify } from './tools/GTDClarify';
import { GTDOrganize } from './tools/GTDOrganize';
import { GTDReview } from './tools/GTDReview';
import { GTDEngage } from './tools/GTDEngage';
import { GTDInfoModal } from './GTDInfoModal';
import { GTDExportModal } from './GTDExportModal';
import { Info } from 'lucide-react';
import { useToast } from '../../../ui/Toast';
import { gtdService } from '../gtdService';
import { authService } from '../../services/auth';
import { taskService } from '../../tasks/taskService';

export type GTDStatus = 'inbox' | 'actionable' | 'waiting' | 'someday' | 'reference' | 'done' | 'trash' | 'project';

export interface GTDItem {
    id: number;
    text: string;
    status: GTDStatus;
    createdAt: number;
    completedAt?: number;
    dueDate?: number;
    projectId?: number;
    delegatedTo?: string;
    description?: string;
    contextId?: string;
    time?: string;
    energy?: string;
    progress?: number;
}

export interface Project {
    id: number;
    name: string;
    status: 'active' | 'completed' | 'archived';
    items: number[];
}

export interface GTDSystemWidgetProps {
    userName?: string;
    onOpenQuickTask?: () => void;
    onOpenDiscussion?: () => void;
    onOpenNewGoal?: () => void;
    onOpenReminder?: () => void;
}

// ... (in component)
export const GTDSystemWidget: React.FC<GTDSystemWidgetProps> = ({
    userName = 'User',
    onOpenQuickTask,
    onOpenDiscussion,
    onOpenNewGoal,
    onOpenReminder
}: GTDSystemWidgetProps) => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'capture' | 'clarify' | 'organize' | 'review' | 'engage'>('capture');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    // ... (imports)


    // -- Data Initial State --
    const [items, setItems] = useState<GTDItem[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            const loadedItems = await gtdService.getItems();
            const loadedProjects = await gtdService.getProjects();
            setItems(loadedItems);
            setProjects(loadedProjects);
        };
        loadData();
    }, []);

    // NOTE: We are NOT using simple effects to save 'items' array because that would require overwriting the whole table or complex diffing.
    // Instead we will update the handlers to save specific items.




    const [clarifyingId, setClarifyingId] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
    const [locationName, setLocationName] = useState<string>('Locating...');

    // -- Export State --
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportType, setExportType] = useState<'task' | 'goal' | 'reminder' | 'discussion' | null>(null);
    const [exportItem, setExportItem] = useState<GTDItem | null>(null);
    const [exportOptions, setExportOptions] = useState<{ id: string; name: string; }[]>([]);

    const handleExport = async (item: GTDItem, type: 'task' | 'goal' | 'reminder' | 'discussion') => {
        setExportItem(item);
        setExportType(type);

        // Fetch Options based on type
        let options: { id: string; name: string; }[] = [];

        if (type === 'task') {
            const spaces = await taskService.getSpaces();
            // Use 'name' from space, fallback to 'Unnamed Space'
            options = spaces.map(s => ({ id: s.id, name: s.name || 'Unnamed Space' }));
        } else if (type === 'goal') {
            const goals = await goalsService.getGoals();
            options = goals.map(g => ({ id: g.id, name: g.title }));
        } else if (type === 'reminder') {
            const lists = await remindersService.getLists();
            options = lists.map(l => ({ id: l.id, name: l.name }));
        } else if (type === 'discussion') {
            const channels = await discussionService.getChannels();
            options = channels.map(c => ({ id: c.id, name: c.name }));
        }

        setExportOptions(options);
        setExportModalOpen(true);
    };

    const handleConfirmExport = async (action: 'new' | 'existing', targetId?: string, newName?: string) => {
        if (!exportItem || !exportType) return;

        try {
            if (exportType === 'task') {
                let spaceId = targetId;
                // If 'new', we ideally create a space, but strictly for now let's use default if user tries to "Create New Group" logic mapping to Space.
                // Or we can treat 'newName' as the Task Title prefix? No, usually it's the container.
                // For simplified GTD->Task, let's assume we pick an Existing Space usually.
                // If they want 'new', we'll default to the first available space but maybe prefix the title?
                // Actually, let's just pick the first space if 'new' is chosen as we lack createSpace here.
                if (action === 'new' || !spaceId) {
                    const spaces = await taskService.getSpaces();
                    spaceId = spaces.length > 0 ? spaces[0].id : 'default';
                }

                await taskService.createTask({
                    title: exportItem.text,
                    status: 'Todo',
                    priority: 'Normal',
                    dueDate: exportItem.dueDate ? new Date(exportItem.dueDate).toISOString() : undefined,
                    spaceId: spaceId,
                    assignees: [],
                    tags: []
                } as any);

            } else if (exportType === 'goal') {
                if (action === 'new' && newName) {
                    await goalsService.createGoal({
                        title: newName,
                        description: exportItem.text,
                        category: 'Work',
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        progress: 0,
                        subGoals: [],
                        status: 'on-track',
                        priority: 'Medium',
                        impact: 'Medium'
                    });
                } else if (action === 'existing' && targetId) {
                    const goals = await goalsService.getGoals();
                    const goal = goals.find(g => g.id === targetId);
                    if (goal) {
                        const newSubGoal = {
                            id: Date.now().toString(),
                            title: exportItem.text,
                            completed: false
                        };
                        await goalsService.updateGoal({
                            ...goal,
                            subGoals: [...goal.subGoals, newSubGoal]
                        });
                    }
                }

            } else if (exportType === 'reminder') {
                let listId = targetId;
                if (action === 'new' && newName) {
                    const newList = await remindersService.addList({ name: newName, type: 'project', color: 'text-black' });
                    listId = newList.id;
                }

                if (listId) {
                    await remindersService.addReminder({
                        title: exportItem.text,
                        listId: listId,
                        dueDate: exportItem.dueDate ? new Date(exportItem.dueDate).toISOString().split('T')[0] : undefined,
                        priority: 'none',
                        tags: [],
                        completed: false,
                        subtasks: []
                    });
                }

            } else if (exportType === 'discussion') {
                let channelId = targetId;
                if (action === 'new' && newName) {
                    const newChannel = await discussionService.createChannel(newName, []);
                    channelId = newChannel.id;
                }

                if (channelId) {
                    const currentUser = authService.getCurrentUser();
                    const userId = currentUser?.id || 'u1';
                    await discussionService.sendMessage(channelId, `Added from Engage: ${exportItem.text}`, userId);
                }
            }

        } catch (e) {
            console.error("Export failed", e);
        }

        setExportModalOpen(false);
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationName('Location unavailable');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // 1. Fetch Weather
                    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);
                    const weatherData = await weatherRes.json();

                    if (weatherData.current) {
                        setWeather({
                            temp: weatherData.current.temperature_2m,
                            code: weatherData.current.weather_code
                        });
                    }

                    // 2. Fetch Location Name (Reverse Geocoding)
                    // Using BigDataCloud's free client-side API which is generous for this use case
                    const locationRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                    const locationData = await locationRes.json();

                    const city = locationData.city || locationData.locality || 'Unknown Location';
                    const region = locationData.principalSubdivisionCode || '';
                    setLocationName(`${city}${region ? `, ${region}` : ''}`);

                } catch (error) {
                    console.error("Failed to fetch weather/location", error);
                    setLocationName('Weather unavailable');
                }
            },
            (error) => {
                console.warn("Location permission denied", error);
                setLocationName('Location denied');
            }
        );
    }, []);

    const getWeatherIcon = (code: number) => {
        if (code === 0 || code === 1) return <Sun size={10} />;
        if (code === 2 || code === 3) return <Cloud size={10} />;
        if (code >= 51 && code <= 67) return <CloudRain size={10} />;
        if (code >= 71 && code <= 77) return <CloudSnow size={10} />;
        if (code >= 95) return <CloudLightning size={10} />;
        return <CloudSun size={10} />;
    };

    // -- Helpers --
    const inboxItems = items.filter(i => i.status === 'inbox').sort((a, b) => b.createdAt - a.createdAt);
    const nextActions = items.filter(i => i.status === 'actionable' && !i.dueDate);
    const scheduled = items.filter(i => (i.status === 'actionable' || i.status === 'waiting') && i.dueDate).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
    const waitingFor = items.filter(i => i.status === 'waiting');
    const somedayItems = items.filter(i => i.status === 'someday');
    const referenceItems = items.filter(i => i.status === 'reference');

    const handleCapture = (text: string) => {
        const lowerText = text.toLowerCase();
        let status: GTDStatus = 'inbox';
        let cleanText = text;
        let isProject = false;

        if (lowerText.startsWith('@task ')) {
            status = 'actionable';
            cleanText = text.slice(6);
        } else if (lowerText.startsWith('@project ')) {
            isProject = true;
            cleanText = text.slice(9);
        } else if (lowerText.startsWith('@waiting ')) {
            status = 'waiting';
            cleanText = text.slice(9);
        } else if (lowerText.startsWith('@someday ')) {
            status = 'someday';
            cleanText = text.slice(9);
        } else if (lowerText.startsWith('@read ')) {
            status = 'reference';
            cleanText = text.slice(6);
        }

        if (isProject) {
            const newProject: Project = {
                id: Date.now(),
                name: cleanText,
                status: 'active',
                items: []
            };
            setProjects([newProject, ...projects]);
            gtdService.saveProject(newProject).catch(() => {
                showToast('Failed to save project!', 'error');
            });
        } else {
            const newItem: GTDItem = {
                id: Date.now(),
                text: cleanText,
                status,
                createdAt: Date.now()
            };
            setItems([newItem, ...items]);
            gtdService.saveItem(newItem).catch(() => {
                showToast('Failed to save item!', 'error');
            });
        }
    };

    const handleProcessItem = (id: number, updates: Partial<GTDItem>) => {
        let updatedItem: GTDItem | undefined;
        setItems(items.map(i => {
            if (i.id === id) {
                const newStatus = updates.status;
                const isCompleting = newStatus === 'done' && i.status !== 'done';
                updatedItem = {
                    ...i,
                    ...updates,
                    completedAt: isCompleting ? Date.now() : i.completedAt
                };
                return updatedItem;
            }
            return i;
        }));

        if (updatedItem) {
            gtdService.saveItem(updatedItem);
        }

        // Auto-advance logic for Clarify mode
        if (id === clarifyingId) {
            const currentInbox = items.filter(i => i.status === 'inbox' && i.id !== id);
            // Logic to find next item
            const nextIndex = inboxItems.findIndex(i => i.id === id) + 1;
            // This logic is slightly tricky because 'items' state is not yet updated in this closure
            // Effectively we just clear for now, or the child component handles "next"
            setClarifyingId(null);
        }
    };

    const handleCreateProject = (name: string, initialTasks: string[] = []) => {
        const newProject: Project = {
            id: Date.now(),
            name,
            status: 'active',
            items: []
        };

        const newTasks = initialTasks.map((t, idx) => ({
            id: Date.now() + idx + 1,
            text: t,
            status: 'actionable' as const,
            projectId: newProject.id,
            createdAt: Date.now()
        }));

        // Sync with Goals System
        goalsService.createGoal({
            title: name,
            category: 'Work', // Default to work
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 1 week due
            progress: 0,
            subGoals: initialTasks.map((t, i) => ({ id: `${Date.now()}_${i}`, title: t, completed: false })),
            status: 'on-track',
            priority: 'Medium',
            impact: 'Medium',
            description: 'Generated from GTD Project'
        }).catch(err => console.error("Failed to sync project to goals", err));

        setProjects([...projects, newProject]);
        setItems([...items, ...newTasks]);

        gtdService.saveProject(newProject);
        newTasks.forEach(t => gtdService.saveItem(t));
    };

    const handleDelete = (id: number) => {
        setItems(items.filter(i => i.id !== id));
        gtdService.deleteItem(id);
    };

    const handleQuickAdd = (item: Partial<GTDItem>) => {
        const newItem: GTDItem = {
            id: Date.now(),
            text: item.text || '',
            status: item.status || 'inbox',
            createdAt: Date.now(),
            projectId: item.projectId,
            delegatedTo: item.delegatedTo,
            dueDate: item.dueDate
        };
        setItems([newItem, ...items]);
        gtdService.saveItem(newItem);
    };

    const sendToTaskBoard = async (text: string) => {
        try {
            // Default to the first available space
            const spaces = await taskService.getSpaces();
            const targetSpaceId = spaces.length > 0 ? spaces[0].id : 'default';

            await taskService.createTask({
                title: text,
                status: 'Todo',
                priority: 'Normal',
                spaceId: targetSpaceId,
                dueDate: new Date().toISOString(),
                assignees: [],
                tags: []
            } as any);

            showToast('Task created!', 'success');
        } catch (e) {
            console.error("Failed to export to Task Board", e);
            showToast('Failed to create task', 'error');
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'capture':
                return <GTDCapture
                    items={items}
                    projects={projects}
                    onCapture={handleCapture}
                    onSelect={(id) => { setClarifyingId(id); setActiveTab('clarify'); }}
                    onDelete={handleDelete}
                />;
            case 'clarify':
                // Navigation Logic
                const currentIndex = inboxItems.findIndex(i => i.id === (clarifyingId || inboxItems[0]?.id));
                const currentItem = clarifyingId ? items.find(i => i.id === clarifyingId) : inboxItems[0];

                const handleNext = () => {
                    if (currentIndex < inboxItems.length - 1) {
                        setClarifyingId(inboxItems[currentIndex + 1].id);
                    }
                };

                const handlePrev = () => {
                    if (currentIndex > 0) {
                        setClarifyingId(inboxItems[currentIndex - 1].id);
                    }
                };

                return <GTDClarify
                    item={currentItem}
                    onProcess={handleProcessItem}
                    onCreateProject={handleCreateProject}
                    onNavigate={(tab) => setActiveTab(tab)}
                    onExportToBoard={sendToTaskBoard}
                    projects={projects}
                    hasMore={inboxItems.length > 0}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    canNext={currentIndex < inboxItems.length - 1}
                    canPrev={currentIndex > 0}
                />;
            case 'organize':
                return <GTDOrganize
                    projects={projects}
                    items={items}
                    onUpdateItem={handleProcessItem}
                    onAddProject={handleCreateProject}
                    onAddItem={handleQuickAdd}
                    onDelete={handleDelete}
                />;
            case 'review':
                return <GTDReview
                    items={items}
                    projects={projects}
                    onUpdate={handleProcessItem}
                    onDelete={handleDelete}
                />;
            case 'engage':
                return <GTDEngage
                    items={items}
                    projects={projects}
                    onExport={handleExport}
                />;
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'capture', label: 'Capture', icon: Inbox, color: 'text-blue-600', count: inboxItems.length },
        { id: 'clarify', label: 'Clarify', icon: CheckCircle2, color: 'text-amber-600', count: clarifyingId ? 1 : 0 },
        { id: 'organize', label: 'Organize', icon: Layers, color: 'text-indigo-600', count: 0 },
        { id: 'review', label: 'Reflect', icon: CheckSquare, color: 'text-emerald-600', count: 0 },
        { id: 'engage', label: 'Engage', icon: Zap, color: 'text-orange-600', count: 0 }
    ] as const;

    return (
        <div className="min-h-[600px] h-fit w-full bg-stone-50 rounded-[2.5rem] p-6 shadow-inner ring-1 ring-stone-900/5 flex flex-col font-serif relative">
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>

            {/* Header Section - Clean & Functional */}
            <div className="flex-none pt-10 pb-6 z-10 relative px-8">

                <div className="flex items-end justify-between w-full mb-8">
                    {/* Left: Greeting & Context */}
                    <div>
                        <div>
                            <h2 className="text-4xl md:text-5xl font-serif italic text-stone-900 tracking-tight leading-none mb-2">
                                {(() => {
                                    const hour = currentTime.getHours();
                                    if (hour < 12) return 'Good morning';
                                    if (hour < 18) return 'Good afternoon';
                                    return 'Good evening';
                                })()}, {userName.split(' ')[0]}
                            </h2>
                            <div className="flex items-center gap-3 text-xs font-bold font-sans text-stone-400 uppercase tracking-widest pl-1">
                                <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                <span>•</span>
                                <span>{currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><MapPin size={10} /> {locationName}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    {weather ? getWeatherIcon(weather.code) : <CloudSun size={10} />}
                                    {weather ? `${Math.round(weather.temp)}°C` : '--°C'}
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4 pb-2">
                        <button onClick={onOpenQuickTask} className="bg-white border border-stone-200 text-stone-900 px-5 py-2.5 rounded-xl shadow-sm hover:bg-stone-50 hover:-translate-y-0.5 transition-all text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                            <Plus size={14} strokeWidth={2} className="text-stone-400" />
                            <span>Task</span>
                        </button>
                        <button onClick={onOpenDiscussion} className="bg-white border border-stone-200 text-stone-900 px-5 py-2.5 rounded-xl shadow-sm hover:bg-stone-50 hover:-translate-y-0.5 transition-all text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                            <Zap size={14} strokeWidth={2} className="text-stone-400" />
                            <span>Discussion</span>
                        </button>
                        <button onClick={onOpenNewGoal} className="bg-white border border-stone-200 text-stone-900 px-5 py-2.5 rounded-xl shadow-sm hover:bg-stone-50 hover:-translate-y-0.5 transition-all text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                            <Target size={14} strokeWidth={2} className="text-stone-400" />
                            <span>New Goal</span>
                        </button>
                        <button onClick={onOpenReminder} className="bg-white border border-stone-200 text-stone-900 px-5 py-2.5 rounded-xl shadow-sm hover:bg-stone-50 hover:-translate-y-0.5 transition-all text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                            <Bell size={14} strokeWidth={2} className="text-stone-400" />
                            <span>Reminder</span>
                        </button>
                    </div>
                </div>

                {/* System Title - Enhanced Placement */}
                <div className="text-center mb-10 mt-16">
                    <h1 className="text-3xl font-serif italic text-stone-900 tracking-tight flex items-center justify-center gap-3">
                        Getting Things Done
                        <button
                            onClick={() => setIsInfoModalOpen(true)}
                            className="p-1.5 rounded-full bg-stone-100/50 text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors"
                            title="How it works"
                        >
                            <Info size={16} strokeWidth={2.5} />
                        </button>
                    </h1>
                </div>

                {/* Navigation Tabs - Centered & Clean */}
                <div className="flex justify-center relative z-20">
                    <div className="flex items-center space-x-2">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                            relative px-8 py-2.5 rounded-xl flex items-center gap-2.5 transition-all duration-300
                                            ${isActive
                                            ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5'
                                            : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200/50'
                                        }
                                        `}
                                >
                                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? tab.color : 'text-stone-400'} />
                                    <span className={`text-[11px] font-bold tracking-widest uppercase ${isActive ? 'opacity-100' : 'opacity-100'}`}>
                                        {tab.label}
                                    </span>
                                    {tab.count > 0 && (
                                        <span className={`flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full text-[9px] font-extrabold ${isActive ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'}`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex bg-white/30 relative">
                <div className="flex-1 w-full relative z-10">
                    {renderContent()}
                </div>
            </div>

            <GTDInfoModal
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
            />

            <GTDExportModal
                isOpen={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                type={exportType}
                itemText={exportItem?.text || ''}
                existingOptions={exportOptions}
                onConfirm={handleConfirmExport}
            />
        </div>
    );
};
