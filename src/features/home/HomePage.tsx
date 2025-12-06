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
import { IBoard } from '../rooms/boardTypes';
import { authService } from '../../services/auth';
import { GTDSystemWidget } from './components/GTDSystemWidget';

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

            draftBoard.groups.forEach(draftGroup => {
                if (draftGroup.tasks.length > 0) {
                    // Check if group exists in main board
                    let targetGroup = mainBoard.groups.find(g => g.title === draftGroup.title);
                    if (!targetGroup) {
                        targetGroup = { ...draftGroup, id: crypto.randomUUID(), tasks: [] }; // Create new group structure
                        mainBoard.groups.push(targetGroup);
                    }
                    // Append tasks
                    targetGroup.tasks = [...targetGroup.tasks, ...draftGroup.tasks];
                }
            });

            localStorage.setItem(mainBoardKey, JSON.stringify(mainBoard));
            console.log("Debug: Saved to localStorage", mainBoardKey, mainBoard);
            showToast("Tasks sent to My Tasks successfully", "success");
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
            <div className="flex-1 overflow-y-auto scrollbar-hide w-full h-full">
                <div className="w-full p-6 pb-24">
                    <div className="grid grid-cols-12 gap-4 auto-rows-[140px]">

                        {/* Row 1 (Height: 2 units) */}
                        {/* Welcome Hero (8 cols) */}
                        <div className="col-span-8 row-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
                            <WelcomeHeroWidget userName={userName} onOpenDiscussion={handleOpenDiscussion} onNewTask={() => setIsQuickTaskOpen(true)} />
                        </div>
                        {/* KPIs (4 cols, 2x2 grid) */}
                        <div className="col-span-2 row-span-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <KPIWidget title="Revenue" value="$53k" trend="+55%" isPositive={true} icon={DollarSign} />
                        </div>
                        <div className="col-span-2 row-span-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <KPIWidget title="Users" value="2.3k" trend="+3%" isPositive={true} icon={Users} />
                        </div>
                        <div className="col-span-2 row-span-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <KPIWidget title="Clients" value="+342" trend="-2%" isPositive={false} icon={Briefcase} />
                        </div>
                        <div className="col-span-2 row-span-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <KPIWidget title="Sales" value="$103k" trend="+5%" isPositive={true} icon={ShoppingBag} />
                        </div>

                        {/* GTD System (Replaces all previous widgets) */}
                        <div className="col-span-12 row-span-4 h-[600px]">
                            <GTDSystemWidget />
                        </div>
                        {/* System Status Footer (12 cols) */}
                        <div className="col-span-12 row-span-1 mt-2">
                            <SystemStatusFooter />
                        </div>
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
        </div >
    );
};

export default HomeView;