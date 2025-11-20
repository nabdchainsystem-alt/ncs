import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DepartmentHeader from './components/DepartmentHeader';
import TableBuilder from './components/tools/TableBuilder';
import TopBar from './components/TopBar';
import TaskListView from './components/TaskListView';
import TaskBoardView from './components/TaskBoardView';
import CalendarView from './components/CalendarView';
import BrainModal from './components/BrainModal';
import AddCardsPanel from './components/AddCardsPanel';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import { ViewType, Task, Status, HomeCard, User } from './types';
import { ToastProvider, useToast } from './components/Toast';
import { api } from './services/api';
import { authService } from './services/auth';
import { Layout } from 'lucide-react';

// Pages
import HomePage from './pages/home/HomePage';
import InboxPage from './pages/inbox/InboxPage';
import SpacePage from './pages/space/SpacePage';
import OceanPage from './pages/ocean/OceanPage';
import MindMapPage from './pages/mind-map/MindMapPage';
import GoalsPage from './pages/dashboards/GoalsPage';
import OverviewPage from './pages/dashboards/OverviewPage';
import LocalMarketplacePage from './pages/marketplace/LocalMarketplacePage';

// Department Pages
import MaintenancePage from './pages/operations/maintenance/MaintenancePage';
import ProductionPage from './pages/operations/production/ProductionPage';
import QualityPage from './pages/operations/quality/QualityPage';
import SalesPage from './pages/business/sales/SalesPage';
import FinancePage from './pages/business/finance/FinancePage';
import ITPage from './pages/support/it/ITPage';
import HRPage from './pages/support/hr/HRPage';
import MarketingPage from './pages/support/marketing/MarketingPage';
import ProcurementPage from './pages/supply-chain/procurement/ProcurementPage';
import WarehousePage from './pages/supply-chain/warehouse/WarehousePage';
import ShippingPage from './pages/supply-chain/shipping/ShippingPage';
import PlanningPage from './pages/supply-chain/planning/PlanningPage';
import FleetPage from './pages/supply-chain/fleet/FleetPage';
import VendorsPage from './pages/supply-chain/vendors/VendorsPage';

// Placeholder for pages that aren't fully implemented but show navigation works
const PlaceholderView: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex-1 flex items-center justify-center text-gray-400 flex-col animate-in fade-in duration-500 bg-gray-50/50">
    <div className="mb-6 bg-white p-8 rounded-full shadow-sm border border-gray-100 text-clickup-purple">
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 64 }) : icon}
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 max-w-md text-center">{description}</p>
  </div>
);

const AppContent: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [viewState, setViewState] = useState<'landing' | 'login' | 'app'>('landing');

  // --- App State ---
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [activePage, setActivePage] = useState(() => localStorage.getItem('activePage') || 'home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCardsOpen, setIsAddCardsOpen] = useState(false);
  const [isBrainOpen, setIsBrainOpen] = useState(false);
  const [isTableBuilderOpen, setIsTableBuilderOpen] = useState(false);
  const [pageWidgets, setPageWidgets] = useState<Record<string, any[]>>({});
  const [homeCards, setHomeCards] = useState<HomeCard[]>([]);

  const { showToast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setViewState('app');
    }
  }, []);

  // Persist activePage
  useEffect(() => {
    localStorage.setItem('activePage', activePage);
  }, [activePage]);

  // Fetch Tasks when entering App
  useEffect(() => {
    if (viewState === 'app') {
      fetchTasks();
    }
  }, [viewState]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const data = await api.getTasks();
      // Sort by order if available
      const sortedData = data.sort((a, b) => (a.order || 0) - (b.order || 0));
      setTasks(sortedData);
    } catch (error) {
      showToast('Failed to load tasks from backend', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setViewState('app');
    showToast(`Welcome back, ${loggedInUser.name}!`, 'success');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setViewState('landing');
    showToast('Logged out successfully', 'info');
  };

  const handleActivate = () => {
    showToast('Account activated successfully!', 'success');
  };

  const handleStatusChange = async (taskId: string, newStatus: Status) => {
    // Optimistic Update: Update UI immediately
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ));

    try {
      await api.updateTask(taskId, { status: newStatus });
    } catch (error) {
      // Revert on error
      setTasks(previousTasks);
      showToast('Failed to update task status', 'error');
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    // Optimistic Update
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ));

    try {
      await api.updateTask(taskId, updates);
      showToast('Task updated', 'success');
    } catch (error) {
      setTasks(previousTasks);
      showToast('Failed to update task', 'error');
    }
  };

  const handleReorder = (newTasks: Task[]) => {
    // Update local state immediately for smoothness
    setTasks(newTasks);

    // In a real app, we would debounce this and save the order to the backend
    // For now, we'll just update the local state as the API doesn't support bulk order update yet
    // But we can iterate and update 'order' field if we want persistence
    // newTasks.forEach((t, index) => {
    //    if (t.order !== index) api.updateTask(t.id, { order: index });
    // });
  };

  const handleQuickCreate = async () => {
    const title = prompt("Enter task title:");
    if (!title) return;

    showToast('Creating task...', 'info');
    try {
      const newTask = await api.createTask({
        title,
        status: Status.Todo,
        priority: 'None' as any,
        assignees: [],
        tags: activePage === 'backend' ? ['Backend'] : [],
        description: '',
        order: tasks.length, // Append to end
        spaceId: 'default' // Required field
      });
      setTasks(prev => [...prev, newTask]);
      showToast('Task created successfully', 'success');
    } catch (e) {
      showToast('Failed to create task', 'error');
    }
  };

  const handleAddHomeCard = (cardType: { id: string; title: string; color: string }) => {
    let defaultW = 400;
    let defaultH = 320;

    if (cardType.id === 'agenda') {
      defaultH = 500;
    } else if (cardType.id === 'lineup') {
      defaultH = 400;
    }

    const GRID_COLUMNS = 3;
    const GAP = 30;
    const START_X = 32; // Align with header padding (px-8 = 32px)
    const START_Y = 20; // Reduced top space

    const index = homeCards.length;
    const col = index % GRID_COLUMNS;

    const cardsInThisCol = homeCards.filter((_, i) => i % GRID_COLUMNS === col);
    const lastCardInCol = cardsInThisCol[cardsInThisCol.length - 1];

    const x = START_X + (col * (defaultW + GAP));
    const y = lastCardInCol ? (lastCardInCol.y + lastCardInCol.h + GAP) : START_Y;

    const newCard: HomeCard = {
      instanceId: Date.now().toString(),
      typeId: cardType.id,
      title: cardType.title,
      color: cardType.color,
      x: x,
      y: y,
      w: defaultW,
      h: defaultH,
      zIndex: homeCards.length + 1
    };
    setHomeCards(prev => [...prev, newCard]);
  };

  const handleUpdateHomeCard = (updatedCard: HomeCard) => {
    setHomeCards(prev => prev.map(c => c.instanceId === updatedCard.instanceId ? updatedCard : c));
  };

  const handleRemoveHomeCard = (instanceId: string) => {
    setHomeCards(prev => prev.filter(c => c.instanceId !== instanceId));
  };

  const handleRemoveHomeCardByType = (typeId: string) => {
    setHomeCards(prev => prev.filter(c => c.typeId !== typeId));
  };

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
      default:
        return tasks;
    }
  }, [tasks, activePage]);

  const getPageTitle = () => {
    const map: Record<string, string> = {
      home: 'Home',
      inbox: 'Inbox',
      sprints: 'Engineering / Sprints',
      frontend: 'Engineering / Frontend App',
      backend: 'Engineering / Backend API',
      overview: 'Dashboards / Overview',
      goals: 'Dashboards / Goals',
      space: 'Space',
      ocean: 'Deep Ocean',
      'supply-chain/procurement': 'Supply Chain / Procurement',
      'supply-chain/warehouse': 'Supply Chain / Warehouse',
      'supply-chain/shipping': 'Supply Chain / Shipping',
      'supply-chain/planning': 'Supply Chain / Planning',
      'supply-chain/fleet': 'Supply Chain / Fleet',
      operations: 'Departments / Operations',
      business: 'Departments / Business',
      support: 'Departments / Business Support'
    };

    if (map[activePage]) return map[activePage];

    if (activePage.startsWith('supply-chain/')) {
      const parts = activePage.split('/');
      // Handle 3 levels: supply-chain / procurement / data
      if (parts.length >= 3) {
        return `Supply Chain / ${parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1)} / ${parts[2]?.charAt(0).toUpperCase() + parts[2]?.slice(1)}`;
      }
      // Fallback for 2 levels if any (though we moved to 3)
      return `Supply Chain / ${parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1)}`;
    }
    if (activePage.startsWith('operations/')) {
      const parts = activePage.split('/');
      return `Operations / ${parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1)} / ${parts[2]?.charAt(0).toUpperCase() + parts[2]?.slice(1)}`;
    }
    if (activePage.startsWith('business/')) {
      const parts = activePage.split('/');
      return `Business / ${parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1)} / ${parts[2]?.charAt(0).toUpperCase() + parts[2]?.slice(1)}`;
    }
    if (activePage.startsWith('support/')) {
      const parts = activePage.split('/');
      return `Business Support / ${parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1)} / ${parts[2]?.charAt(0).toUpperCase() + parts[2]?.slice(1)}`;
    }

    return 'Space';
  };

  const isImmersive = ['space', 'ocean'].includes(activePage);

  // --- Routing Logic ---

  if (viewState === 'landing') {
    return <LandingPage onLoginClick={() => setViewState('login')} />;
  }

  if (viewState === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setViewState('landing')} />;
  }

  // --- Main App (Authenticated) ---

  return (
    <div className="flex flex-col h-screen w-screen bg-white overflow-hidden text-clickup-text font-sans antialiased selection:bg-purple-100 selection:text-purple-900">

      <TopBar
        onOpenBrain={() => setIsBrainOpen(true)}
        user={user}
        isImmersive={isImmersive}
        onLogout={handleLogout}
        onActivate={handleActivate}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={handleLogout}
          isImmersive={isImmersive}
        />

        <div className="flex flex-col flex-1 min-w-0 bg-white relative">

          {!isImmersive && activePage !== 'inbox' && activePage !== 'mind-map' && activePage !== 'marketplace/local' && (
            <>
              {/* Header - Conditional Rendering */}
              {(activePage.startsWith('operations/') || activePage.startsWith('business/') || activePage.startsWith('support/') || activePage.startsWith('supply-chain/')) ? (
                <DepartmentHeader
                  pageTitle={getPageTitle()}
                  activePage={activePage}
                  onInsert={(type) => {
                    if (type === 'custom-table') setIsTableBuilderOpen(true);
                  }}
                />
              ) : (
                <Header
                  currentView={currentView}
                  setCurrentView={setCurrentView}
                  pageTitle={getPageTitle()}
                  activePage={activePage}
                  onToggleAddCards={() => setIsAddCardsOpen(prev => !prev)}
                  onOpenBrain={() => setIsBrainOpen(true)}
                />
              )}
            </>
          )}



          <div className="flex-1 flex flex-col min-h-0 relative">
            {activePage === 'inbox' && <InboxPage />}
            {activePage === 'marketplace/local' && <LocalMarketplacePage />}
            {activePage === 'home' && (
              <HomePage
                cards={homeCards}
                onUpdateCard={handleUpdateHomeCard}
                onRemoveCard={handleRemoveHomeCard}
                onOpenCustomize={() => setIsAddCardsOpen(true)}
              />
            )}

            {activePage === 'overview' && <OverviewPage />}

            {activePage === 'goals' && <GoalsPage />}
            {activePage === 'mind-map' && <MindMapPage />}
            {activePage === 'space' && <SpacePage />}
            {activePage === 'ocean' && <OceanPage />}

            {activePage === 'ocean' && <OceanPage />}

            {/* Operations */}
            {activePage.startsWith('operations/maintenance') && (
              <MaintenancePage
                widgets={pageWidgets['operations/maintenance'] || []}
              />
            )}
            {activePage.startsWith('operations/production') && <ProductionPage />}
            {activePage.startsWith('operations/quality') && <QualityPage />}

            {/* Business */}
            {activePage.startsWith('business/sales') && <SalesPage />}
            {activePage.startsWith('business/finance') && <FinancePage />}

            {/* Support */}
            {activePage.startsWith('support/it') && <ITPage />}
            {activePage.startsWith('support/hr') && <HRPage />}
            {activePage.startsWith('support/marketing') && <MarketingPage />}

            {/* Supply Chain */}
            {activePage.startsWith('supply-chain/procurement') && <ProcurementPage />}
            {activePage.startsWith('supply-chain/warehouse') && <WarehousePage />}
            {activePage.startsWith('supply-chain/shipping') && <ShippingPage />}
            {activePage.startsWith('supply-chain/planning') && <PlanningPage />}
            {activePage.startsWith('supply-chain/fleet') && <FleetPage />}
            {activePage.startsWith('supply-chain/vendors') && <VendorsPage />}

            {/* Fallback for any other sub-pages or deeply nested pages not explicitly caught above but starting with these prefixes */}
            {(activePage.startsWith('operations/') || activePage.startsWith('business/') || activePage.startsWith('support/') || activePage.startsWith('supply-chain/')) &&
              !['operations/maintenance', 'operations/production', 'operations/quality',
                'business/sales', 'business/finance',
                'support/it', 'support/hr', 'support/marketing',
                'supply-chain/procurement', 'supply-chain/warehouse', 'supply-chain/shipping', 'supply-chain/planning', 'supply-chain/fleet', 'supply-chain/vendors'
              ].some(path => activePage.startsWith(path)) && (
                <PlaceholderView
                  icon={<Layout />}
                  title={getPageTitle()}
                  description="This module is currently being built."
                />
              )}

            {!['overview', 'goals', 'inbox', 'home', 'mind-map', 'space', 'ocean'].includes(activePage) &&
              !activePage.startsWith('operations/') &&
              !activePage.startsWith('business/') &&
              !activePage.startsWith('support/') &&
              !activePage.startsWith('supply-chain/') && (
                <>
                  {currentView === 'list' && (
                    <TaskListView
                      tasks={filteredTasks}
                      isLoading={isLoading}
                      onStatusChange={handleStatusChange}
                      onAddTask={handleQuickCreate}
                      onReorder={handleReorder}
                      onUpdateTask={handleUpdateTask}
                    />
                  )}
                  {currentView === 'board' && (
                    <TaskBoardView
                      tasks={filteredTasks}
                      isLoading={isLoading}
                      onAddTask={handleQuickCreate}
                      onStatusChange={handleStatusChange}
                    />
                  )}
                  {currentView === 'calendar' && (
                    <CalendarView
                      tasks={filteredTasks}
                      isLoading={isLoading}
                      onAddTask={handleQuickCreate}
                    />
                  )}
                </>
              )}

            {isAddCardsOpen && (
              <AddCardsPanel
                isOpen={isAddCardsOpen}
                onClose={() => setIsAddCardsOpen(false)}
                onAddCard={handleAddHomeCard}
                onRemoveCard={handleRemoveHomeCardByType}
                addedCardTypes={homeCards.map(c => c.typeId)}
              />
            )}
          </div>
        </div>
      </div>

      <BrainModal
        isOpen={isBrainOpen}
        onClose={() => setIsBrainOpen(false)}
        tasks={tasks}
      />

      <TableBuilder
        isOpen={isTableBuilderOpen}
        onClose={() => setIsTableBuilderOpen(false)}
        onAdd={(config) => {
          const newWidget = { type: 'custom-table', id: Date.now().toString(), ...config };
          setPageWidgets(prev => ({
            ...prev,
            [activePage]: [...(prev[activePage] || []), newWidget]
          }));
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
