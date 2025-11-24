import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import DepartmentHeader from './layout/DepartmentHeader';
import DepartmentAnalyticsPage from './features/shared/DepartmentAnalyticsPage';
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
import { Layout, LayoutDashboard, X } from 'lucide-react';


// Pages
import HomePage from './features/home/HomePage';
import InboxPage from './features/inbox/InboxPage';
import DiscussionPage from './features/discussion/DiscussionPage';
import SpacePage from './features/space/SpacePage';
import SpaceViewPage from './features/space/SpaceViewPage';
import OceanPage from './features/ocean/OceanPage';
import MindMapPage from './features/mind-map/MindMapPage';
import GoalsPage from './features/dashboards/GoalsPage';
import OverviewPage from './features/dashboards/OverviewPage';
import RemindersPage from './features/dashboards/RemindersPage';
import TasksPage from './features/dashboards/TasksPage';
import VaultPage from './features/dashboards/VaultPage';
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
  const [pageTabs, setPageTabs] = useState<Record<string, { id: string; name: string }[]>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem('page-tabs');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [activeTabByPage, setActiveTabByPage] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem('active-tab-by-page');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

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

  // Persist tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('page-tabs', JSON.stringify(pageTabs));
    } catch (err) {
      console.warn('Failed to persist tabs', err);
    }
  }, [pageTabs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('active-tab-by-page', JSON.stringify(activeTabByPage));
    } catch (err) {
      console.warn('Failed to persist active tab', err);
    }
  }, [activeTabByPage]);

  // Ensure each page has a default tab
  useEffect(() => {
    if (!pageTabs[activePage]) return;
    setActiveTabByPage(prev => {
      if (prev[activePage] && pageTabs[activePage]?.some(t => t.id === prev[activePage])) return prev;
      const firstTab = pageTabs[activePage][0]?.id;
      if (!firstTab) return prev;
      return { ...prev, [activePage]: firstTab };
    });
  }, [activePage, pageTabs]);

  const getTabsForPage = (pageId: string) => (pageTabs[pageId] || []).filter(t => t.id !== 'main');
  const getActiveTabId = (pageId: string) => {
    const tabs = getTabsForPage(pageId);
    const stored = activeTabByPage[pageId];
    if (stored && tabs.some(t => t.id === stored)) return stored;
    return tabs[0]?.id;
  };

  const activeTabId = getActiveTabId(activePage);
  const widgetPageKey = activeTabId ? `${activePage}::${activeTabId}` : activePage;
  const widgetsForPage = activeTabId ? (pageWidgets[widgetPageKey] || []) : (pageWidgets[activePage] || []);

  const replaceWidgets = (widgets: any[]) => {
    if (activeTabId) {
      onUpdateWidget(widgetPageKey, widgets);
    } else {
      onUpdateWidget(activePage, widgets);
    }
  };

  const getCurrentWidgetList = () =>
    activeTabId
      ? (pageWidgets[widgetPageKey] || [])
      : (pageWidgets[activePage] || []);

  const deleteWidget = (id: string) => {
    const list = getCurrentWidgetList();
    replaceWidgets(list.filter(w => w.id !== id));
  };

  const updateWidget = (id: string, updates: any) => {
    const list = getCurrentWidgetList();
    replaceWidgets(list.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const setActiveTab = (tabId: string) => setActiveTabByPage(prev => ({ ...prev, [activePage]: tabId }));

  const handleDeleteDashboardTab = (tabId: string) => {
    setPageTabs(prev => {
      const current = getTabsForPage(activePage).filter(t => t.id !== tabId);
      const nextTabs = { ...prev, [activePage]: current };
      return nextTabs;
    });
    setActiveTabByPage(prev => {
      if (prev[activePage] === tabId) {
        const fallback = getTabsForPage(activePage).filter(t => t.id !== tabId)[0]?.id;
        const next = { ...prev };
        if (fallback) next[activePage] = fallback;
        else delete next[activePage];
        return next;
      }
      return prev;
    });
    // Clear widgets for that tab
    onUpdateWidget(`${activePage}::${tabId}`, []);
    setPageWidgets(prev => {
      const clone = { ...prev };
      delete clone[`${activePage}::${tabId}`];
      return clone;
    });
  };

  const handleCreateDashboardTab = () => {
    const existingTabs = getTabsForPage(activePage);
    const suggestedName = `Dashboard ${existingTabs.length}`;
    const nameInput = window.prompt('Name this dashboard tab', suggestedName);
    if (nameInput === null) return; // Cancelled
    const tabName = nameInput.trim() ? nameInput.trim() : suggestedName;
    const newTab = { id: `tab-${Date.now()}`, name: tabName };
    setPageTabs(prev => {
      const current = getTabsForPage(activePage);
      return { ...prev, [activePage]: [...current, newTab] };
    });
    setActiveTabByPage(prev => ({ ...prev, [activePage]: newTab.id }));
    onUpdateWidget(`${activePage}::${newTab.id}`, []);
    showToast(`Created dashboard "${tabName}"`, 'success');
  };

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

  const widgetProps = {
    activePage,
    allPageWidgets: pageWidgets,
    widgets: widgetsForPage,
    onDeleteWidget: deleteWidget,
    onUpdateWidget: updateWidget
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
          user={user}
        />

        <div className="flex flex-col flex-1 min-w-0 bg-white relative">

          {(() => {
            // Check if this is a user-created space (spaces have IDs like SPACE-{timestamp})
            const isUserSpace = activePage.startsWith('SPACE-');

            // Don't render header for these pages (they have their own headers or no header)
            if (isImmersive || activePage === 'inbox' || activePage === 'discussion' || activePage.includes('mind-map') || activePage === 'marketplace/local' || isUserSpace) {
              return null;
            }

            // Render appropriate header
            return (
              <>
                {/* Header - Conditional Rendering */}
                {(activePage.startsWith('operations/') || activePage.startsWith('business/') || activePage.startsWith('support/') || activePage.startsWith('supply-chain/') || activePage.startsWith('smart-tools/')) ? (
                  <DepartmentHeader
                    onInsert={(type) => {
                      if (type === 'custom-table') setTableBuilderOpen(true);
                      if (type === 'layout-clear') {
                        replaceWidgets([]);
                        showToast('Cleared layout for this page', 'success');
                        return;
                      }
                      if (type === 'dashboard') {
                        if (activePage.includes('/data')) return;
                        handleCreateDashboardTab();
                        return;
                      }
                      if (type.startsWith('kpi-card')) {
                        const count = parseInt(type.split('-')[2] || '1', 10);
                        const newWidgets = Array.from({ length: count }).map(() => ({
                          type: 'kpi-card',
                          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                          title: 'New KPI',
                          value: null, // Empty state
                          icon: 'Activity',
                          trend: null,
                          subtext: 'Connect to data source'
                        }));
                        const currentWidgets = getCurrentWidgetList();
                        replaceWidgets([...currentWidgets, ...newWidgets]);
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
                        const currentWidgets = getCurrentWidgetList();
                        replaceWidgets([...currentWidgets, newWidget]);
                      }
                      if (type === 'layout-4kpi-1chart') {
                        const timestamp = Date.now();
                        const layoutGroup = `layout-${timestamp}`;
                        const newWidgets = [
                          { type: 'kpi-card', id: `${timestamp}-1`, title: 'KPI 1', value: null, icon: 'Activity', subtext: 'Connect data', layoutGroup, layoutPosition: 1 },
                          { type: 'kpi-card', id: `${timestamp}-2`, title: 'KPI 2', value: null, icon: 'Activity', subtext: 'Connect data', layoutGroup, layoutPosition: 2 },
                          { type: 'kpi-card', id: `${timestamp}-3`, title: 'KPI 3', value: null, icon: 'Activity', subtext: 'Connect data', layoutGroup, layoutPosition: 3 },
                          { type: 'kpi-card', id: `${timestamp}-4`, title: 'KPI 4', value: null, icon: 'Activity', subtext: 'Connect data', layoutGroup, layoutPosition: 4 },
                          { type: 'chart', id: `${timestamp}-5`, title: 'Main Chart', chartType: 'bar', data: null, sourceTableId: null, layoutGroup, layoutPosition: 5 }
                        ];
                        const currentWidgets = getCurrentWidgetList();
                        replaceWidgets([...currentWidgets, ...newWidgets]);
                      }
                    }}
                  />
                ) : (
                  <Header />
                )}
              </>
            );
          })()}



          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Dashboard Tabs */}
            {(activePage.startsWith('operations/') || activePage.startsWith('business/') || activePage.startsWith('support/') || activePage.startsWith('supply-chain/') || activePage.startsWith('smart-tools/')) && !activePage.includes('/data') && (
              <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0 overflow-x-auto">
                {getTabsForPage(activePage).length === 0 ? (
                  <span className="text-sm text-gray-500">Insert your Dashboard from Insert Menu</span>
                ) : (
                  getTabsForPage(activePage).map(tab => {
                    const isActive = tab.id === activeTabId;
                    return (
                      <div key={tab.id} className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab(tab.id)}
                          className={`text-sm font-medium transition-colors ${isActive ? 'text-clickup-purple underline decoration-2 underline-offset-4' : 'text-gray-700 hover:text-clickup-purple'}`}
                        >
                          {tab.name}
                        </button>
                        <button
                          onClick={() => handleDeleteDashboardTab(tab.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete dashboard tab"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activePage === 'inbox' && <InboxPage />}
            {activePage === 'discussion' && <DiscussionPage />}
            {activePage === 'marketplace/local' && <LocalMarketplacePage />}
            {activePage === 'home' && (
              <HomePage
                cards={homeCards}
                onUpdateCard={handleUpdateHomeCard}
                onRemoveCard={handleRemoveHomeCard}
                onOpenCustomize={() => setAddCardsOpen(true)}
                userName={user?.name}
              />
            )}

            {activePage === 'overview' && <OverviewPage />}
            {activePage === 'reminders' && <RemindersPage />}
            {activePage === 'tasks' && <TasksPage />}
            {activePage === 'vault' && <VaultPage />}
            {activePage === 'goals' && <GoalsPage />}
            {(activePage === 'mind-map' || activePage === 'smart-tools/mind-map') && <MindMapPage />}
            {activePage === 'smart-tools/dashboard' && (
              <DepartmentAnalyticsPage
                {...widgetProps}
                placeholderTitle="Smart Dashboard"
                placeholderDescription="Your central hub for intelligence."
                placeholderIcon={<LayoutDashboard />}
              />
            )}
            {activePage === 'space' && <SpacePage />}
            {activePage === 'ocean' && <OceanPage />}

            {/* User-created Spaces */}
            {activePage.startsWith('SPACE-') && (
              <SpaceViewPage
                spaceName={activePage.replace('SPACE-', 'Space ')}
                spaceId={activePage}
              />
            )}

            {/* Operations */}
            {activePage.startsWith('operations/maintenance') && (
              <MaintenancePage {...widgetProps} />
            )}
            {activePage.startsWith('operations/production') && (
              <ProductionPage {...widgetProps} />
            )}
            {activePage.startsWith('operations/quality') && (
              <QualityPage {...widgetProps} />
            )}

            {/* Business */}
            {activePage.startsWith('business/sales') && (
              <SalesPage {...widgetProps} />
            )}
            {activePage.startsWith('business/finance') && (
              <FinancePage {...widgetProps} />
            )}

            {/* Support */}
            {activePage.startsWith('support/it') && (
              <ITPage {...widgetProps} />
            )}
            {activePage.startsWith('support/hr') && (
              <HRPage {...widgetProps} />
            )}
            {activePage.startsWith('support/marketing') && (
              <MarketingPage {...widgetProps} />
            )}

            {/* Supply Chain */}
            {activePage.startsWith('supply-chain/procurement') && (
              <ProcurementPage {...widgetProps} />
            )}
            {activePage.startsWith('supply-chain/warehouse') && (
              <WarehousePage {...widgetProps} />
            )}
            {activePage.startsWith('supply-chain/shipping') && (
              <ShippingPage {...widgetProps} />
            )}
            {activePage.startsWith('supply-chain/planning') && (
              <PlanningPage {...widgetProps} />
            )}
            {activePage.startsWith('supply-chain/fleet') && (
              <FleetPage {...widgetProps} />
            )}
            {activePage.startsWith('supply-chain/vendors') && (
              <VendorsPage {...widgetProps} />
            )}

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

            {(() => {
              // Check if this is a user-created space (spaces have IDs like SPACE-{timestamp})
              const isUserSpace = activePage.startsWith('SPACE-');

              // Only show task views if NOT a special page and NOT a user-created space
              const shouldShowTaskViews = !['overview', 'goals', 'inbox', 'discussion', 'home', 'mind-map', 'space', 'ocean', 'reminders', 'tasks', 'vault', 'teams'].includes(activePage) &&
                !activePage.startsWith('operations/') &&
                !activePage.startsWith('business/') &&
                !activePage.startsWith('support/') &&
                !activePage.startsWith('supply-chain/') &&
                !activePage.startsWith('marketplace/') &&
                !activePage.startsWith('smart-tools/') &&
                !isUserSpace;

              if (!shouldShowTaskViews) return null;

              return (
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
              );
            })()}

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
          const currentWidgets = getCurrentWidgetList();
          replaceWidgets([...currentWidgets, newWidget]);
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
