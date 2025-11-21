import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import DepartmentHeader from './layout/DepartmentHeader';
import TableBuilder from './ui/TableBuilder';
import TopBar from './layout/TopBar';
import TaskListView from './features/tasks/TaskListView';
import TaskBoardView from './features/tasks/TaskBoardView';
import CalendarView from './features/tasks/CalendarView';
import BrainModal from './ui/BrainModal';
import AddCardsPanel from './ui/AddCardsPanel';
import LandingPage from './layout/LandingPage';
import LoginPage from './layout/LoginPage';
import { ViewType, Status, User } from './types/shared';
import { Task } from './features/tasks/types';
import { HomeCard } from './features/home/types';
import { ToastProvider, useToast } from './ui/Toast';
import { useTasks } from './features/tasks/hooks/useTasks';
import { useHomeCards } from './features/home/hooks/useHomeCards';
import { useWidgets } from './features/dashboards/hooks/useWidgets';
import { authService } from './services/auth';
import { Layout } from 'lucide-react';


// Pages
import HomePage from './features/home/HomePage';
import InboxPage from './features/inbox/InboxPage';
import SpacePage from './features/space/SpacePage';
import OceanPage from './features/ocean/OceanPage';
import MindMapPage from './features/mind-map/MindMapPage';
import GoalsPage from './features/dashboards/GoalsPage';
import OverviewPage from './features/dashboards/OverviewPage';
import LocalMarketplacePage from './features/marketplace/LocalMarketplacePage';

// Department Pages
import MaintenancePage from './features/maintenance/MaintenancePage';
import ProductionPage from './features/production/ProductionPage';
import QualityPage from './features/quality/QualityPage';
import SalesPage from './features/sales/SalesPage';
import FinancePage from './features/finance/FinancePage';
import ITPage from './features/it/ITPage';
import HRPage from './features/hr/HRPage';
import MarketingPage from './features/marketing/MarketingPage';
import ProcurementPage from './features/procurement/ProcurementPage';
import WarehousePage from './features/warehouse/WarehousePage';
import ShippingPage from './features/shipping/ShippingPage';
import PlanningPage from './features/planning/PlanningPage';
import FleetPage from './features/fleet/FleetPage';
import VendorsPage from './features/vendors/VendorsPage';

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
  // --- App State ---
  const { activePage, setActivePage, currentView, setCurrentView, getPageTitle, isImmersive } = useNavigation();
  const { isAddCardsOpen, setAddCardsOpen, isBrainOpen, setBrainOpen, isTableBuilderOpen, setTableBuilderOpen } = useUI();

  const { tasks, isLoading, handleStatusChange, handleUpdateTask, handleReorder, handleQuickCreate } = useTasks(viewState, activePage);
  const { homeCards, handleAddHomeCard, handleUpdateHomeCard, handleRemoveHomeCard, handleRemoveHomeCardByType } = useHomeCards();
  const { pageWidgets, setPageWidgets, onUpdateWidget } = useWidgets(viewState);


  const { showToast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setViewState('app');
    }
  }, []);

  // Persist activePage - Handled in NavigationContext




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

  // getPageTitle and isImmersive are now in NavigationContext


  // --- Routing Logic ---

  if (viewState === 'landing') {
    return <LandingPage onLoginClick={() => setViewState('login')} />;
  }

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

  if (viewState === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setViewState('landing')} />;
  }

  // --- Main App (Authenticated) ---

  return (
    <div className="flex flex-col h-screen w-screen bg-white overflow-hidden text-clickup-text font-sans antialiased selection:bg-purple-100 selection:text-purple-900">

      <TopBar
        user={user}
        onLogout={handleLogout}
        onActivate={handleActivate}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        <Sidebar
          onLogout={handleLogout}
        />

        <div className="flex flex-col flex-1 min-w-0 bg-white relative">

          {!isImmersive && activePage !== 'inbox' && activePage !== 'mind-map' && activePage !== 'marketplace/local' && (
            <>
              {/* Header - Conditional Rendering */}
              {(activePage.startsWith('operations/') || activePage.startsWith('business/') || activePage.startsWith('support/') || activePage.startsWith('supply-chain/')) ? (
                <DepartmentHeader
                  onInsert={(type) => {
                    if (type === 'custom-table') setTableBuilderOpen(true);
                    if (type === 'kpi-card') {
                      const newWidget = {
                        type: 'kpi-card',
                        id: Date.now().toString(),
                        title: 'New KPI',
                        value: null, // Empty state
                        icon: 'Activity',
                        trend: null,
                        subtext: 'Connect to data source'
                      };
                      const currentWidgets = pageWidgets[activePage] || [];
                      onUpdateWidget(activePage, [...currentWidgets, newWidget]);
                    }
                    if (type.startsWith('chart')) {
                      const chartType = type.replace('chart-', '') || 'bar';
                      const newWidget = {
                        type: 'chart',
                        id: Date.now().toString(),
                        title: `New ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
                        chartType: chartType,
                        data: null, // Empty state
                        sourceTableId: null
                      };
                      const currentWidgets = pageWidgets[activePage] || [];
                      onUpdateWidget(activePage, [...currentWidgets, newWidget]);
                    }
                  }}
                />
              ) : (
                <Header />
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
                onOpenCustomize={() => setAddCardsOpen(true)}
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
                activePage={activePage}
                allPageWidgets={pageWidgets}
                widgets={pageWidgets[activePage] || []}
                onDeleteWidget={(id) => {
                  setPageWidgets(prev => ({
                    ...prev,
                    [activePage]: (prev[activePage] || []).filter(w => w.id !== id)
                  }));
                }}
                onUpdateWidget={(id, updates) => {
                  const updatedPageWidgets = (pageWidgets[activePage] || []).map(w =>
                    w.id === id ? { ...w, ...updates } : w
                  );
                  onUpdateWidget(activePage, updatedPageWidgets);
                }}
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
              !activePage.startsWith('supply-chain/') &&
              !activePage.startsWith('marketplace/') && (
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
                onClose={() => setAddCardsOpen(false)}
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
        onClose={() => setBrainOpen(false)}
        tasks={tasks}
      />

      <TableBuilder
        isOpen={isTableBuilderOpen}
        onClose={() => setTableBuilderOpen(false)}
        onAdd={(config) => {
          const newWidget = { type: 'custom-table', id: Date.now().toString(), ...config };
          const currentWidgets = pageWidgets[activePage] || [];
          onUpdateWidget(activePage, [...currentWidgets, newWidget]);
        }}
      />
    </div>
  );
};

import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { UIProvider, useUI } from './contexts/UIContext';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <NavigationProvider>
        <UIProvider>
          <AppContent />
        </UIProvider>
      </NavigationProvider>
    </ToastProvider>
  );
};

export default App;
