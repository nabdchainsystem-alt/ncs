import React from 'react';
import { useToast } from '../../ui/Toast';
import { HomeCard } from './types';
import { DraggableCard } from './components/DraggableCard';
import { RemindersWidget, KPIWidget, ChartWidget, TaskListWidget, ProjectListWidget, WelcomeHeroWidget, StorageWidget, MiniCalendarWidget, SystemStatusFooter, LiveActionsWidget, TeamTasksWidget, FullCalendarWidget } from './components/DashboardWidgets';
import { DollarSign, Users, Briefcase, ShoppingBag } from 'lucide-react';

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
                            <WelcomeHeroWidget userName={userName} />
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

                        {/* Row 2 (Height: 2 units) - 5 Columns of Widgets */}
                        <div className="col-span-12 row-span-2 grid grid-cols-5 gap-4">
                            {/* My Tasks */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full overflow-hidden flex flex-col">
                                <TaskListWidget />
                            </div>
                            {/* Reminders */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full overflow-hidden flex flex-col">
                                <RemindersWidget />
                            </div>
                            {/* Team Status */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full overflow-hidden flex flex-col">
                                <TeamTasksWidget />
                            </div>
                            {/* Live Actions */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full overflow-hidden flex flex-col">
                                <LiveActionsWidget />
                            </div>
                            {/* Active Projects */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full overflow-hidden flex flex-col">
                                <ProjectListWidget />
                            </div>
                        </div>

                        {/* Row 3 (Height: 4 units) - Full Calendar */}
                        <div className="col-span-12 row-span-4 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
                            <FullCalendarWidget />
                        </div>
                        {/* System Status Footer (12 cols) */}
                        <div className="col-span-12 row-span-1 mt-2">
                            <SystemStatusFooter />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeView;