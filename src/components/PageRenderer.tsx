import React, { Suspense, lazy, useMemo } from 'react';
import ErrorBoundary from '../ui/ErrorBoundary';
import LoadingScreen from '../ui/LoadingScreen';
import { useNavigation } from '../contexts/NavigationContext';
import { useWidgetManager } from '../hooks/useWidgetManager';
import { useLayout } from '../contexts/LayoutContext';
import { useTasks } from '../features/tasks/hooks/useTasks';
import { useHomeCards } from '../features/home/hooks/useHomeCards';
import { authService } from '../services/auth';
import { useUI } from '../contexts/UIContext';
import { Layers } from 'lucide-react';
import { UnderConstruction } from './UnderConstruction';


// Lazy Load Pages
const DepartmentAnalyticsPage = lazy(() => import('../features/shared/DepartmentAnalyticsPage'));
const TableBuilder = lazy(() => import('../ui/TableBuilder'));
const TaskListView = lazy(() => import('../features/tasks/TaskListView'));
const TaskBoardView = lazy(() => import('../features/tasks/TaskBoardView'));
const CalendarView = lazy(() => import('../features/tasks/CalendarView'));
const ReportViewPage = lazy(() => import('../features/reports/ReportViewPage'));
const AddCardsPanel = lazy(() => import('../ui/AddCardsPanel'));

// Pages
const HomePage = lazy(() => import('../features/home/HomePage'));
const InboxPage = lazy(() => import('../features/inbox/InboxPage'));
const DiscussionPage = lazy(() => import('../features/discussion/DiscussionPage'));
const RoomPage = lazy(() => import('../features/rooms/RoomPage'));
const RoomViewPage = lazy(() => import('../features/rooms/RoomViewPage'));


const VisionPage = lazy(() => import('../features/ai/VisionPage'));
const GoalsPage = lazy(() => import('../features/dashboards/GoalsPage'));
const OverviewPage = lazy(() => import('../features/dashboards/OverviewPage'));
const RemindersPage = lazy(() => import('../features/reminders/RemindersPage'));
const TasksPage = lazy(() => import('../features/dashboards/TasksPage'));
const VaultPage = lazy(() => import('../features/dashboards/VaultPage'));
const LocalMarketplacePage = lazy(() => import('../features/marketplace/LocalMarketplacePage'));

const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const TeamPage = lazy(() => import('../features/teams/TeamPage').then(module => ({ default: module.TeamPage })));

// Department Pages
const MaintenancePage = lazy(() => import('../features/operations/maintenance/MaintenancePage'));
const ProductionPage = lazy(() => import('../features/operations/production/ProductionPage'));
const QualityPage = lazy(() => import('../features/operations/quality/QualityPage'));
const SalesPage = lazy(() => import('../features/business/sales/SalesPage'));
const FinancePage = lazy(() => import('../features/business/finance/FinancePage'));
const ITPage = lazy(() => import('../features/support/it/ITPage'));
const HRPage = lazy(() => import('../features/support/hr/HRPage'));
const MarketingPage = lazy(() => import('../features/support/marketing/MarketingPage'));
const ProcurementPage = lazy(() => import('../features/supply-chain/procurement/ProcurementPage'));
const WarehousePage = lazy(() => import('../features/supply-chain/warehouse/WarehousePage'));
const ShippingPage = lazy(() => import('../features/supply-chain/shipping/ShippingPage'));
const PlanningPage = lazy(() => import('../features/supply-chain/planning/PlanningPage'));
const FleetPage = lazy(() => import('../features/supply-chain/fleet/FleetPage'));
const VendorsPage = lazy(() => import('../features/supply-chain/vendors/VendorsPage'));


// Placeholder
const PlaceholderView: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="flex-1 flex items-center justify-center text-gray-400 flex-col animate-in fade-in duration-500 bg-gray-50/50">
        <div className="mb-6 bg-white p-8 rounded-full shadow-sm border border-gray-100 text-clickup-purple">
            {/* Icon rendering handled by parent or simplified */}
            <span className="text-4xl">?</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 max-w-md text-center">{description}</p>
    </div>
);

// Lazy Load BrainModal
const BrainModal = lazy(() => import('../ui/BrainModal'));

export const PageRenderer: React.FC = () => {
    const { activePage, currentView, getPageTitle } = useNavigation();
    const { widgets, deleteWidget, updateWidget, pageWidgets, handleInsert } = useWidgetManager();
    const { getTabsForPage, getActiveTabId } = useLayout();
    const { isAddCardsOpen, setAddCardsOpen, isBrainOpen, setBrainOpen, floatingTaskState, setFloatingTaskState, isTableBuilderOpen, setTableBuilderOpen } = useUI();

    // Data hooks
    const { tasks, isLoading, handleStatusChange, handleUpdateTask, handleReorder, handleQuickCreate } = useTasks('app', activePage);
    const { homeCards, handleAddHomeCard, handleUpdateHomeCard, handleRemoveHomeCard, handleRemoveHomeCardByType } = useHomeCards();
    const user = authService.getCurrentUser();

    // Helper to get active tab name
    const activeTabId = getActiveTabId(activePage);
    const activeTab = getTabsForPage(activePage).find(t => t.id === activeTabId);
    const activeTabName = activeTab ? activeTab.name : undefined;

    // Filter tasks based on activePage
    const filteredTasks = useMemo(() => {
        switch (activePage) {
            case 'inbox':
            case 'home':
                return [];
            case 'backend':
                return tasks.filter(t => t.tags.includes('Backend') || t.tags.includes('API') || t.tags.includes('Auth'));
            case 'sprints':
                return tasks.filter(t => t.tags.includes('Feature') || t.tags.includes('Bug'));
            case 'frontend':
                return tasks;
            default:
                return tasks;
        }
    }, [tasks, activePage]);

    // Render Logic
    let pageContent: React.ReactNode = null;

    if (activePage === 'home') {
        pageContent = (
            <>
                <HomePage
                    cards={homeCards}
                    onUpdateCard={handleUpdateHomeCard}
                    onRemoveCard={handleRemoveHomeCard}
                    onOpenCustomize={() => setAddCardsOpen(true)}
                    userName={user?.name}
                />
                {isAddCardsOpen && (
                    <AddCardsPanel
                        isOpen={isAddCardsOpen}
                        onClose={() => setAddCardsOpen(false)}
                        onAddCard={handleAddHomeCard}
                        onRemoveCard={handleRemoveHomeCardByType}
                        addedCardTypes={homeCards.map(c => c.typeId)}
                    />
                )}
            </>
        );
    } else if (activePage === 'inbox') {
        pageContent = <InboxPage />;
    } else if (activePage === 'discussion') {
        pageContent = <DiscussionPage />;
    } else if (activePage === 'connections') {
        pageContent = (
            <UnderConstruction
                title="Connections"
                description="Manage your professional network."
                message="Build and manage your network of contacts, clients, and partners."
                features={['Contact Management', 'CRM Integration', 'Relationship Tracking']}
            />
        );
    } else if (activePage === 'vision') {
        pageContent = <VisionPage />;
    } else if (activePage === 'settings') {
        pageContent = <SettingsPage onUpdateUser={async (updates) => {
            await authService.updateCurrentUser(updates);
            // User update handled by authService/StoreContext usually, but App.tsx had local state.
            // We assume StoreContext handles it now or a page refresh might be needed if not using context.
        }} />;
    } else if (activePage === 'space') {
        pageContent = <RoomPage />;
    } else if (activePage.startsWith('SPACE-')) {
        pageContent = <RoomViewPage key={activePage} roomId={activePage} roomName={activePage.replace('SPACE-', 'Room ')} />;
    }
    // Games
    // Removed Games

    // Dashboards
    else if (activePage === 'overview') {
        pageContent = <OverviewPage />;
    } else if (activePage === 'goals') {
        pageContent = <GoalsPage />;
    } else if (activePage === 'reminders') {
        pageContent = <RemindersPage />;
    } else if (activePage === 'tasks') {
        pageContent = <TasksPage />;
    } else if (activePage === 'vault') {
        pageContent = <VaultPage />;
    } else if (activePage === 'teams') {
        pageContent = <TeamPage />;
    }
    // Marketplace
    else if (activePage === 'marketplace/local') {
        pageContent = <LocalMarketplacePage />;

    }

    // Supply Chain Visuals
    // Removed Supply Chain Map (Cosmos)

    // Reports
    else if (activePage.startsWith('reports/') || activePage.startsWith('report-')) {
        const reportId = activePage.replace('reports/', '').replace('report-', '');
        pageContent = <ReportViewPage reportId={reportId} />;
    }
    // Departments & Shared Analytics Pages
    else {
        const sharedProps = {
            widgets,
            onDeleteWidget: deleteWidget,
            onUpdateWidget: updateWidget,
            onInsert: handleInsert,
            activeTabName,
            activePage,
            allPageWidgets: pageWidgets
        };

        if (activePage.endsWith('/data') || activePage.endsWith('/analytics')) {
            pageContent = <DepartmentAnalyticsPage {...sharedProps} />;
        } else if (activePage.startsWith('operations/')) {
            if (activePage === 'operations/maintenance') {
                pageContent = <MaintenancePage {...sharedProps} />;
            } else if (activePage === 'operations/production') {
                pageContent = <ProductionPage {...sharedProps} />;
            } else if (activePage === 'operations/quality') {
                pageContent = <QualityPage {...sharedProps} />;
            }
        } else if (activePage.startsWith('business/')) {
            if (activePage === 'business/sales') {
                pageContent = <SalesPage {...sharedProps} />;
            } else if (activePage === 'business/finance') {
                pageContent = <FinancePage {...sharedProps} />;
            }
        } else if (activePage.startsWith('support/')) {
            if (activePage === 'support/it') {
                pageContent = <ITPage {...sharedProps} />;
            } else if (activePage === 'support/hr') {
                pageContent = <HRPage {...sharedProps} />;
            } else if (activePage === 'support/marketing') {
                pageContent = <MarketingPage {...sharedProps} />;
            }
        } else if (activePage.startsWith('supply-chain/')) {
            if (activePage === 'supply-chain/procurement') {
                pageContent = <ProcurementPage {...sharedProps} />;
            } else if (activePage === 'supply-chain/warehouse') {
                pageContent = <WarehousePage {...sharedProps} />;
            } else if (activePage === 'supply-chain/shipping') {
                pageContent = <ShippingPage {...sharedProps} />;
            } else if (activePage === 'supply-chain/planning') {
                pageContent = <PlanningPage {...sharedProps} />;
            } else if (activePage === 'supply-chain/fleet') {
                pageContent = <FleetPage {...sharedProps} />;
            } else if (activePage === 'supply-chain/vendors') {
                pageContent = <VendorsPage {...sharedProps} />;
            }
        }
        // Engineering Views (using TaskBoard/List)
        else if (['sprints', 'frontend', 'backend'].includes(activePage)) {
            if (currentView === 'board') {
                if (floatingTaskState.isOpen && floatingTaskState.config?.activePage === activePage) {
                    pageContent = (
                        <div className="flex-1 flex items-center justify-center text-gray-400 flex-col animate-in fade-in duration-500">
                            <div className="mb-4 bg-gray-50 p-6 rounded-full border border-gray-100">
                                <Layers size={48} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-600">This board is floating</h3>
                            <p className="text-gray-400 max-w-xs text-center mt-2">Check the bottom right corner to access it.</p>
                            <button
                                onClick={() => setFloatingTaskState({ isOpen: false, isExpanded: false, config: null })}
                                className="mt-6 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 transition-colors shadow-sm text-sm"
                            >
                                Restore Board
                            </button>
                        </div>
                    );
                } else {
                    pageContent = (
                        <TaskBoardView
                            activePage={activePage}
                            tasks={filteredTasks}
                            isLoading={isLoading}
                            onAddTask={handleQuickCreate}
                            onStatusChange={handleStatusChange}
                        />
                    );
                }
            } else if (currentView === 'calendar') {
                pageContent = (
                    <CalendarView
                        tasks={filteredTasks}
                        isLoading={isLoading}
                        onAddTask={handleQuickCreate}
                    />
                );
            } else {
                pageContent = (
                    <TaskListView
                        tasks={filteredTasks}
                        isLoading={isLoading}
                        onStatusChange={handleStatusChange}
                        onAddTask={handleQuickCreate}
                        onReorder={handleReorder}
                        onUpdateTask={handleUpdateTask}
                    />
                );
            }
        }

        // Fallback for any other sub-pages
        else if ((activePage.startsWith('operations/') || activePage.startsWith('business/') || activePage.startsWith('support/') || activePage.startsWith('supply-chain/'))) {
            pageContent = (
                <PlaceholderView
                    icon={<span className="text-4xl">🚧</span>}
                    title={getPageTitle()}
                    description="This module is currently being built."
                />
            );
        } else {
            pageContent = <DepartmentAnalyticsPage {...sharedProps} />;
        }
    }

    return (
        <ErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
                {pageContent}
            </Suspense>
            <BrainModal
                isOpen={isBrainOpen}
                onClose={() => setBrainOpen(false)}
                tasks={tasks}
            />
            {isTableBuilderOpen && (
                <TableBuilder
                    isOpen={isTableBuilderOpen}
                    onClose={() => setTableBuilderOpen(false)}
                    onAdd={(config) => handleInsert('table-template', config)}
                />
            )}

        </ErrorBoundary>
    );
};
