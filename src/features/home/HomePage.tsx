import React, { useState } from 'react';
import { useToast } from '../../ui/Toast';
import { HomeCard } from './types';
import { DraggableCard } from './components/DraggableCard';
import { CreateDiscussionModal } from '../discussion/CreateDiscussionModal';
import { discussionService } from '../discussion/discussionService';
import { useNavigation } from '../../contexts/NavigationContext';
import { RemindersWidget, KPIWidget, ChartWidget, TaskListWidget, ProjectListWidget, WelcomeHeroWidget, StorageWidget, MiniCalendarWidget, SystemStatusFooter, LiveActionsWidget, TeamTasksWidget, FullCalendarWidget } from './components/DashboardWidgets';
import { DollarSign, Users, Briefcase, ShoppingBag } from 'lucide-react';
import { QuickTaskModal } from './components/QuickTaskModal';
import { useRoomBoardData } from '../rooms/hooks/useRoomBoardData';
import { Room } from '../rooms/types';
import { IBoard, INITIAL_DATA } from '../rooms/boardTypes';
import { authService } from '../../services/auth';
import { GTDSystemWidget } from './components/GTDSystemWidget';
import { ProductivityAnalytics } from './components/ProductivityAnalytics';
import { CreateGoalModal } from '../goals/components/CreateGoalModal';
import { CreateReminderModal } from '../reminders/components/CreateReminderModal';

const AVAILABLE_ROOMS_KEY = "available_rooms";
const MAIN_BOARD_KEY = "taskboard-state";

interface HomeViewProps {
    cards?: HomeCard[];
    onUpdateCard?: (card: HomeCard) => void;
    onRemoveCard?: (id: string) => void;
    onOpenCustomize?: () => void;
    userName?: string;
}

// --- Main Home View ---

const HomeView: React.FC<HomeViewProps> = ({
    cards = [],
    onUpdateCard = (_card) => { },
    onRemoveCard = (_id) => { },
    onOpenCustomize = () => { },
    userName = 'User'
}) => {
    const { showToast } = useToast();
    const { setActivePage } = useNavigation();
    const [isDiscussionModalOpen, setDiscussionModalOpen] = useState(false);
    const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

    // Load rooms
    React.useEffect(() => {
        const loadRooms = () => {
            try {
                const saved = localStorage.getItem(AVAILABLE_ROOMS_KEY);
                if (saved) {
                    setAvailableRooms(JSON.parse(saved));
                }
            } catch (e) {
                console.error("Failed to load rooms for QuickTask", e);
            }
        };
        loadRooms();
    }, []);

    // Task Logic
    const defaultColumns = INITIAL_DATA.groups[0]?.columns || [];

    const handleSendToMainTasks = (draftBoard: IBoard) => {
        console.log("Debug: Handle Send", draftBoard);
        try {
            const user = authService.getCurrentUser();
            const mainBoardKey = user ? `taskboard-${user.id}` : 'taskboard-default';
            console.log("Debug: Sending tasks to", mainBoardKey);

            const mainBoardData = localStorage.getItem(mainBoardKey);
            let mainBoard: IBoard = mainBoardData ? JSON.parse(mainBoardData) : {
                id: 'main', name: 'My Tasks', groups: [], columns: [], users: [], version: 1
            };
            console.log("Debug: Main board before merge", mainBoard);

            const normalizedGroups = (draftBoard.groups || []).map(g => ({
                ...g,
                id: g.id || crypto.randomUUID(),
                title: g.title || 'Quick Tasks',
                color: g.color || '#579bfc',
                columns: Array.isArray(g.columns) && g.columns.length ? g.columns : defaultColumns,
                tasks: Array.isArray(g.tasks) ? g.tasks : []
            }));

            normalizedGroups.forEach(draftGroup => {
                if (draftGroup.tasks.length > 0) {
                    const baseTitle = draftGroup.title || 'Quick Tasks';

                    // Find existing group with same title (case-insensitive for better UX?) 
                    // Let's stick to exact match to match boardTypes behavior or simple string compare
                    const existingGroupIndex = mainBoard.groups.findIndex(g => g.title === baseTitle);

                    if (existingGroupIndex >= 0) {
                        // Merge into existing group
                        const existingGroup = mainBoard.groups[existingGroupIndex];

                        // Ensure tasks have valid IDs and properties (though they should from draft)
                        // We append new tasks to the end of the existing group's task list
                        const tasksToAdd = draftGroup.tasks.map(t => ({
                            ...t,
                            id: t.id || crypto.randomUUID() // Ensure ID exists
                        }));

                        existingGroup.tasks = [...existingGroup.tasks, ...tasksToAdd];
                        mainBoard.groups[existingGroupIndex] = existingGroup;
                    } else {
                        // Create new group if it doesn't exist
                        const newGroup = {
                            ...draftGroup,
                            id: crypto.randomUUID(),
                            title: baseTitle,
                            tasks: [...draftGroup.tasks]
                        };
                        mainBoard.groups = [newGroup, ...mainBoard.groups];
                    }
                }
            });

            localStorage.setItem(mainBoardKey, JSON.stringify(mainBoard));
            console.log("Debug: Saved to localStorage", mainBoardKey, mainBoard);
            showToast("Tasks sent to My Tasks successfully", "success");
            setActivePage('tasks');
            // Trigger storage event for other tabs/components
            window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key: mainBoardKey } }));
            window.dispatchEvent(new Event('storage')); // For cross-tab (optional if we want to rely on native behavior which is automatic)
        } catch (e) {
            console.error("Failed to merge to main tasks", e);
            showToast("Failed to send tasks", "error");
        }
    };

    const executeSendToRoom = (draftBoard: IBoard, room: Room) => {
        try {
            const roomKey = `room_board_${room.id}`;
            const roomData = localStorage.getItem(roomKey);
            let roomBoard: IBoard = roomData ? JSON.parse(roomData) : {
                id: room.id, name: room.name, groups: [], columns: [], users: [], version: 1
            };

            draftBoard.groups.forEach(draftGroup => {
                if (draftGroup.tasks.length > 0) {
                    let targetGroup = roomBoard.groups.find(g => g.title === draftGroup.title);
                    if (!targetGroup) {
                        targetGroup = { ...draftGroup, id: crypto.randomUUID(), tasks: [] };
                        roomBoard.groups.push(targetGroup);
                    }
                    targetGroup.tasks = [...targetGroup.tasks, ...draftGroup.tasks];
                }
            });

            localStorage.setItem(roomKey, JSON.stringify(roomBoard));
            showToast(`Tasks sent to ${room.name}`, "success");
            window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key: roomKey } }));
            window.dispatchEvent(new Event('storage'));
        } catch (e) {
            console.error("Failed to send to room", e);
            showToast("Failed to send to room", "error");
        }
    };

    const handleQuickTaskSend = (boardData: IBoard, destination: { type: 'main' | 'room', roomId?: string }) => {
        setIsQuickTaskOpen(false);
        if (destination.type === 'main') {
            handleSendToMainTasks(boardData);
        } else if (destination.type === 'room' && destination.roomId) {
            const targetRoom = availableRooms.find(r => r.id === destination.roomId);
            if (targetRoom) {
                executeSendToRoom(boardData, targetRoom);
            } else {
                showToast("Room not found", "error");
            }
        }
    };

    const handleOpenDiscussion = () => {
        setDiscussionModalOpen(true);
    };

    const handleCreateDiscussion = async (name: string, participants: string[]) => {
        try {
            const newChannel = await discussionService.createChannel(name, participants);
            showToast('Discussion created successfully!', 'success');

            // Store the new channel ID to auto-open it
            localStorage.setItem('autoOpenChannelId', newChannel.id);

            setDiscussionModalOpen(false);
            setActivePage('discussion');
        } catch (error) {
            console.error('Failed to create discussion:', error);
            showToast('Failed to create discussion', 'error');
        }
    };

    // We are ignoring the 'cards' prop for the static Bento Grid layout
    // but keeping the prop interface to avoid breaking parent components.

    return (
        <div className="flex-1 bg-brand-surface flex flex-col h-full overflow-hidden relative">
            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto scrollbar-hide w-full h-full bg-white relative">
                <div className="w-full mx-auto p-4 pb-48 flex flex-col h-full min-h-[800px]">

                    {/* GTD System with Merged Greeting */}
                    <div className="flex-1 w-full animate-fade-in-up">
                        <GTDSystemWidget
                            userName={userName}
                            onOpenQuickTask={() => setIsQuickTaskOpen(true)}
                            onOpenDiscussion={handleOpenDiscussion}
                            onOpenNewGoal={() => setIsGoalModalOpen(true)}
                            onOpenReminder={() => setIsReminderModalOpen(true)}
                        />

                        {/* Productivity Analytics Section */}
                        <ProductivityAnalytics />
                    </div>

                </div>
            </div>

            <QuickTaskModal
                isOpen={isQuickTaskOpen}
                onClose={() => setIsQuickTaskOpen(false)}
                onSend={handleQuickTaskSend}
                rooms={availableRooms}
                darkMode={false}
            />

            <CreateDiscussionModal
                isOpen={isDiscussionModalOpen}
                onClose={() => setDiscussionModalOpen(false)}
                onCreate={handleCreateDiscussion}
            />

            <CreateGoalModal
                isOpen={isGoalModalOpen}
                onClose={() => setIsGoalModalOpen(false)}
            />

            <CreateReminderModal
                isOpen={isReminderModalOpen}
                onClose={() => setIsReminderModalOpen(false)}
            />
        </div >
    );
};

export default HomeView;
