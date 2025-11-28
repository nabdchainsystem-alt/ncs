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
import TemplateModal from './features/home/components/TemplateModal';
import { ViewType, Status, User } from './types/shared';
import { Task } from './features/tasks/types';
import { HomeCard } from './features/home/types';
import { ToastProvider, useToast } from './ui/Toast';
import { generateMockData } from './utils/mockDataGenerator';
import { useTasks } from './features/tasks/hooks/useTasks';
import { useHomeCards } from './features/home/hooks/useHomeCards';
import { useWidgets } from './features/dashboards/hooks/useWidgets';
import { authService } from './services/auth';
import { Layout, LayoutDashboard, X } from 'lucide-react';


import ReportViewPage from './features/reports/ReportViewPage';

// Pages
import HomePage from './features/home/HomePage';
import InboxPage from './features/inbox/InboxPage';
import DiscussionPage from './features/discussion/DiscussionPage';
import SpacePage from './features/space/SpacePage';
import SpaceViewPage from './features/space/SpaceViewPage';
import TowerGamePage from './features/tower/TowerGamePage';
import MindMapPage from './features/mind-map/MindMapPage';
import GoalsPage from './features/dashboards/GoalsPage';
import OverviewPage from './features/dashboards/OverviewPage';
import RemindersPage from './features/dashboards/RemindersPage';
import TasksPage from './features/dashboards/TasksPage';
import VaultPage from './features/dashboards/VaultPage';
import LocalMarketplacePage from './features/marketplace/LocalMarketplacePage';
import SettingsPage from './features/settings/SettingsPage';
import { TeamPage } from './features/teams/TeamPage';

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
  const { isAddCardsOpen, setAddCardsOpen, isBrainOpen, setBrainOpen, isTableBuilderOpen, setTableBuilderOpen, isTemplateModalOpen, setTemplateModalOpen } = useUI();

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
    const nextIndex = existingTabs.length + 1;
    const tabName = `Dashboard ${nextIndex}`;
    const newTabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTab = { id: newTabId, name: tabName };

    setPageTabs(prev => {
      const current = (prev[activePage] || []).filter(t => t.id !== 'main');
      return { ...prev, [activePage]: [...current, newTab] };
    });

    setActiveTabByPage(prev => ({ ...prev, [activePage]: newTabId }));
    onUpdateWidget(`${activePage}::${newTabId}`, []);
    showToast(`Created "${tabName}"`, 'success');
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
        return tasks;
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
            if (isImmersive || activePage === 'inbox' || activePage === 'discussion' || activePage.includes('mind-map') || activePage === 'marketplace/local' || activePage === 'tower-game' || isUserSpace || activePage === 'settings') {
              return null;
            }

            // Get active tab name
            const activeTab = getTabsForPage(activePage).find(t => t.id === activeTabId);
            const activeTabName = activeTab ? activeTab.name : undefined;

            // Render appropriate header
            return (
              <>
                {/* Header - Conditional Rendering */}
                {(activePage.startsWith('operations/') || activePage.startsWith('business/') || activePage.startsWith('support/') || activePage.startsWith('supply-chain/') || activePage.startsWith('smart-tools/')) ? (
                  <DepartmentHeader
                    activeTabName={activeTabName}
                    onInsert={(type, data) => {
                      if (type === 'custom-table') setTableBuilderOpen(true);
                      if (type === 'layout-clear') {
                        replaceWidgets([]);

                        // Clear dashboard tabs
                        setPageTabs(prev => {
                          const next = { ...prev };
                          delete next[activePage];
                          return next;
                        });

                        // Reset active tab
                        setActiveTabByPage(prev => {
                          const next = { ...prev };
                          delete next[activePage];
                          return next;
                        });

                        showToast('Cleared layout and dashboards', 'success');
                        return;
                      }
                      if (type === 'dashboard') {
                        if (activePage.includes('/data')) return;
                        handleCreateDashboardTab();
                        return;
                      }
                      if (type === 'table-template' && data) {
                        const template = data;
                        const newWidget = {
                          type: 'custom-table',
                          id: Date.now().toString(),
                          title: template.title,
                          showBorder: true,
                          columns: template.columns.map((col: any) => ({
                            ...col,
                            width: col.width || 150 // Default width if not specified
                          })),
                          rows: []
                        };
                        const currentWidgets = getCurrentWidgetList();
                        replaceWidgets([...currentWidgets, newWidget]);
                        return;
                      }

                      if (type === 'requests-table') {
                        const newWidget = {
                          type: 'custom-table',
                          id: Date.now().toString(),
                          title: 'Requests Table',
                          showBorder: true,
                          columns: [
                            { id: 'c1', name: 'No', type: 'number', width: 60 },
                            { id: 'c2', name: 'PR Number', type: 'text', width: 120 },
                            { id: 'c3', name: 'Item Code', type: 'text', width: 120 },
                            { id: 'c4', name: 'Item Description', type: 'text', width: 200 },
                            { id: 'c5', name: 'Quantity', type: 'number', width: 100 },
                            { id: 'c6', name: 'UOM', type: 'text', width: 80 },
                            { id: 'c7', name: 'Date Requested', type: 'date', width: 150 },
                            { id: 'c8', name: 'Warehouse', type: 'text', width: 150 },
                            { id: 'c9', name: 'Department Requested', type: 'text', width: 180 },
                            { id: 'c10', name: 'Priority', type: 'text', width: 120 },
                            { id: 'c11', name: 'Approval Status', type: 'text', width: 140 },
                            { id: 'c12', name: 'PR Status', type: 'text', width: 120 }
                          ],
                          rows: []
                        };
                        const currentWidgets = getCurrentWidgetList();
                        replaceWidgets([...currentWidgets, newWidget]);
                        return;
                      }

                      if (type === 'dashboard-template' && data) {
                        const { moduleName, reports } = data;

                        // 1. Create a new Dashboard Tab
                        const newTabId = `tab-${Date.now()}`;
                        const newTab = { id: newTabId, name: moduleName };

                        setPageTabs(prev => {
                          const current = getTabsForPage(activePage);
                          return { ...prev, [activePage]: [...current, newTab] };
                        });

                        // 2. Switch to the new tab
                        setActiveTabByPage(prev => ({ ...prev, [activePage]: newTabId }));

                        // 3. Generate Widgets for all reports
                        // We need to wait a tick for the tab switch to propagate if we were using state directly,
                        // but here we can just target the new tab ID directly in onUpdateWidget.

                        const newWidgets = reports.map((report: any, index: number) => {
                          const chartTypeRaw = report["Chart Type (ECharts)"] || 'Bar Chart';
                          let widgetType = 'chart';
                          let chartType = 'bar';

                          if (chartTypeRaw.includes('KPI')) widgetType = 'kpi-card';
                          else if (chartTypeRaw.includes('Bar')) chartType = 'bar';
                          else if (chartTypeRaw.includes('Line')) chartType = 'line';
                          else if (chartTypeRaw.includes('Pie') || chartTypeRaw.includes('Donut')) chartType = 'pie';
                          else if (chartTypeRaw.includes('Gauge')) chartType = 'gauge';
                          else if (chartTypeRaw.includes('Funnel')) chartType = 'funnel';
                          else if (chartTypeRaw.includes('Radar')) chartType = 'radar';
                          else if (chartTypeRaw.includes('Scatter')) chartType = 'scatter';
                          else if (chartTypeRaw.includes('Heatmap')) chartType = 'heatmap';
                          else if (chartTypeRaw.includes('Treemap')) chartType = 'treemap';
                          else if (chartTypeRaw.includes('Map')) chartType = 'map';
                          else if (chartTypeRaw.includes('Table')) widgetType = 'custom-table';

                          // Smart Logic (Simplified for bulk generation)
                          let sourceTableId = null;
                          let sourceTableIds: Record<string, string> = {};
                          let smartLogic = report.logic;
                          let connectedCount = 0;
                          let totalSources = 0;

                          // Try to find matching tables in the GLOBAL scope (since we are in a new tab, it's empty)
                          // But we can look at existing widgets in the main tab or other tabs if needed.
                          // For now, let's look at ALL widgets on the page across all tabs to find data sources.
                          const allPageWidgets = Object.values(pageWidgets).flat();
                          const availableTables = allPageWidgets.filter((w: any) => w.type === 'custom-table');

                          if (smartLogic) {
                            if (smartLogic.sources && Array.isArray(smartLogic.sources)) {
                              totalSources = smartLogic.sources.length;
                              smartLogic.sources.forEach((source: any, idx: number) => {
                                if (source.table_keywords) {
                                  const match = availableTables.find((t: any) =>
                                    source.table_keywords.some((k: string) => t.title.toLowerCase().includes(k.toLowerCase()))
                                  );
                                  if (match) {
                                    sourceTableIds[`source_${idx}`] = match.id;
                                    if (!sourceTableId) sourceTableId = match.id;
                                    connectedCount++;
                                  }
                                }
                              });
                            } else if (smartLogic.source && smartLogic.source.table_keywords) {
                              totalSources = 1;
                              const keywords = smartLogic.source.table_keywords;
                              const match = availableTables.find((t: any) =>
                                keywords.some((k: string) => t.title.toLowerCase().includes(k.toLowerCase()))
                              );
                              if (match) {
                                sourceTableId = match.id;
                                sourceTableIds['primary'] = match.id;
                                connectedCount = 1;
                              }
                            }
                          }

                          const mockData = generateMockData(report);

                          const widget: any = {
                            id: Date.now().toString() + index, // Ensure unique IDs
                            title: report["Report Title"],
                            subtext: report.benefit || (connectedCount > 0 ? `Connected (${connectedCount}/${totalSources})` : 'Connect to data source'),
                            sourceTableId: sourceTableId,
                            sourceTableIds: sourceTableIds,
                            type: widgetType,
                            chartType: chartType,
                            // Generate Mock Data
                            data: chartType === 'heatmap' ? {
                              xLabels: ['Financial', 'Operational', 'Geopolitical', 'Legal', 'Reputational'],
                              yLabels: ['Low', 'Medium', 'High', 'Critical'],
                              values: Array.from({ length: 20 }, (_, i) => [
                                i % 5, // x
                                Math.floor(i / 5), // y
                                Math.floor(Math.random() * 100) // value
                              ])
                            } : (chartType === 'treemap' ? {
                              name: 'Root',
                              children: [
                                { name: 'Category A', value: 100, children: [{ name: 'Item A1', value: 40 }, { name: 'Item A2', value: 60 }] },
                                { name: 'Category B', value: 80, children: [{ name: 'Item B1', value: 30 }, { name: 'Item B2', value: 50 }] },
                                { name: 'Category C', value: 60, children: [{ name: 'Item C1', value: 20 }, { name: 'Item C2', value: 40 }] }
                              ]
                            } : (chartType === 'map' ? {
                              data: [
                                { name: 'USA', value: 100 },
                                { name: 'China', value: 80 },
                                { name: 'Germany', value: 60 },
                                { name: 'Japan', value: 40 },
                                { name: 'India', value: 20 }
                              ]
                            } : mockData)),
                            // Store logic for future reference
                            logic: smartLogic,
                            // Default layout (auto-arrange)
                            layout: { i: '', x: (index % 3) * 4, y: Math.floor(index / 3) * 4, w: 4, h: 4 }
                          };

                          if (widgetType === 'kpi-card') {
                            // KPI specific overrides if needed, but generateMockData handles values
                            widget.icon = 'Activity';
                            widget.value = mockData.value;
                            widget.trend = { value: mockData.trendValue, direction: mockData.trend };
                          } else if (widgetType === 'custom-table') {
                            widget.showBorder = true;
                            widget.columns = [
                              { id: 'c1', name: 'Column 1', type: 'text', width: 150 },
                              { id: 'c2', name: 'Column 2', type: 'number', width: 100 }
                            ];
                            widget.rows = [];
                          }

                          return widget;
                        });

                        // Update widgets for the NEW tab
                        onUpdateWidget(`${activePage}::${newTabId}`, newWidgets);
                        showToast(`Generated ${newWidgets.length} widgets for ${moduleName}`, 'success');
                        return;
                      }

                      if (type === 'report-template' && data) {
                        const report = data;
                        const chartTypeRaw = report["Chart Type (ECharts)"] || 'Bar Chart';
                        let widgetType = 'chart';
                        let chartType = 'bar';

                        // Map chart types
                        if (chartTypeRaw.includes('KPI')) widgetType = 'kpi-card';
                        else if (chartTypeRaw.includes('Bar')) chartType = 'bar';
                        else if (chartTypeRaw.includes('Line')) chartType = 'line';
                        else if (chartTypeRaw.includes('Pie') || chartTypeRaw.includes('Donut')) chartType = 'pie';
                        else if (chartTypeRaw.includes('Gauge')) chartType = 'gauge';
                        else if (chartTypeRaw.includes('Funnel')) chartType = 'funnel';
                        else if (chartTypeRaw.includes('Radar')) chartType = 'radar';
                        else if (chartTypeRaw.includes('Scatter')) chartType = 'scatter';
                        else if (chartTypeRaw.includes('Heatmap')) chartType = 'heatmap';
                        else if (chartTypeRaw.includes('Treemap')) chartType = 'treemap';
                        else if (chartTypeRaw.includes('Map')) chartType = 'map';
                        else if (chartTypeRaw.includes('Table')) widgetType = 'custom-table';

                        // Smart Logic: Try to find a matching data source
                        let sourceTableId = null;
                        let sourceTableIds: Record<string, string> = {};
                        let smartLogic = report.logic;
                        let connectedCount = 0;
                        let totalSources = 0;

                        const allWidgets = Object.values(pageWidgets).flat();
                        const availableTables = allWidgets.filter((w: any) => w.type === 'custom-table');

                        if (smartLogic) {
                          // Handle Multi-Source
                          if (smartLogic.sources && Array.isArray(smartLogic.sources)) {
                            totalSources = smartLogic.sources.length;
                            smartLogic.sources.forEach((source: any, index: number) => {
                              if (source.table_keywords) {
                                const match = availableTables.find((t: any) =>
                                  source.table_keywords.some((k: string) => t.title.toLowerCase().includes(k.toLowerCase()))
                                );
                                if (match) {
                                  sourceTableIds[`source_${index}`] = match.id;
                                  // Set primary source as the first one found
                                  if (!sourceTableId) sourceTableId = match.id;
                                  connectedCount++;
                                }
                              }
                            });

                            if (connectedCount > 0) {
                              showToast(`Connected to ${connectedCount}/${totalSources} sources`, 'success');
                            }
                          }
                          // Handle Single Source (Legacy/Simple)
                          else if (smartLogic.source && smartLogic.source.table_keywords) {
                            totalSources = 1;
                            const keywords = smartLogic.source.table_keywords;
                            const match = availableTables.find((t: any) =>
                              keywords.some((k: string) => t.title.toLowerCase().includes(k.toLowerCase()))
                            );

                            if (match) {
                              sourceTableId = match.id;
                              sourceTableIds['primary'] = match.id;
                              connectedCount = 1;
                              showToast(`Auto-connected to ${match.title}`, 'success');
                            }
                          }
                        }

                        const newWidget: any = {
                          id: Date.now().toString(),
                          title: report["Report Title"],
                          subtext: report.benefit || (connectedCount > 0 ? `Connected (${connectedCount}/${totalSources})` : 'Connect to data source'),
                          sourceTableId: sourceTableId, // Primary source for backward compatibility
                          config: {
                            reportId: report.id,
                            category: report["Category 1 (Detailed)"],
                            module: report["Module (Category 2)"],
                            smartLogic: smartLogic,
                            sourceTableIds: sourceTableIds // Store all connections
                          }
                        };

                        const mockData = generateMockData(report);

                        if (widgetType === 'kpi-card') {
                          newWidget.type = 'kpi-card';
                          newWidget.value = mockData.value;
                          newWidget.icon = 'Activity';
                          newWidget.trend = { value: mockData.trendValue, direction: mockData.trend };
                        } else if (widgetType === 'chart') {
                          newWidget.type = 'chart';
                          newWidget.chartType = chartType;
                          newWidget.data = chartType === 'heatmap' ? {
                            xLabels: ['Financial', 'Operational', 'Geopolitical', 'Legal', 'Reputational'],
                            yLabels: ['Low', 'Medium', 'High', 'Critical'],
                            values: Array.from({ length: 20 }, (_, i) => [
                              i % 5, // x
                              Math.floor(i / 5), // y
                              Math.floor(Math.random() * 100) // value
                            ])
                          } : (chartType === 'treemap' ? {
                            name: 'Root',
                            children: [
                              { name: 'Category A', value: 100, children: [{ name: 'Item A1', value: 40 }, { name: 'Item A2', value: 60 }] },
                              { name: 'Category B', value: 80, children: [{ name: 'Item B1', value: 30 }, { name: 'Item B2', value: 50 }] },
                              { name: 'Category C', value: 60, children: [{ name: 'Item C1', value: 20 }, { name: 'Item C2', value: 40 }] }
                            ]
                          } : (chartType === 'map' ? {
                            data: [
                              { name: 'USA', value: 100 },
                              { name: 'China', value: 80 },
                              { name: 'Germany', value: 60 },
                              { name: 'Japan', value: 40 },
                              { name: 'India', value: 20 }
                            ]
                          } : mockData));
                        }

                        const currentWidgets = getCurrentWidgetList();
                        replaceWidgets([...currentWidgets, newWidget]);
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
              <div className="h-12 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center px-6 gap-2 flex-shrink-0 overflow-x-auto no-scrollbar">
                {getTabsForPage(activePage).length === 0 ? (
                  <div className="flex items-center text-sm text-gray-400 italic">
                    <LayoutDashboard size={14} className="mr-2" />
                    Insert a dashboard from the menu to get started...
                  </div>
                ) : (
                  getTabsForPage(activePage).map(tab => {
                    const isActive = tab.id === activeTabId;
                    return (
                      <div
                        key={tab.id}
                        className={`
                          group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer border
                          ${isActive
                            ? 'bg-black text-white border-black shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <span className="truncate max-w-[150px]">{tab.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDashboardTab(tab.id);
                          }}
                          className={`
                            p-0.5 rounded-md transition-all
                            ${isActive
                              ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                              : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500'
                            }
                          `}
                          title="Close tab"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activePage === 'inbox' && <InboxPage />}
            {activePage === 'settings' && <SettingsPage onUpdateUser={async (updates) => {
              const updated = await authService.updateCurrentUser(updates);
              if (updated) setUser(updated);
            }} />}
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
            {activePage === 'teams' && <TeamPage />}
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
            {activePage === 'tower-game' && <TowerGamePage />}

            {/* User-created Spaces */}
            {activePage.startsWith('SPACE-') && (
              <SpaceViewPage
                spaceName={activePage.replace('SPACE-', 'Space ')}
                spaceId={activePage}
              />
            )}

            {/* Report View Page */}
            {activePage.startsWith('report-') && (
              <ReportViewPage
                reportId={activePage.replace('report-', '')}
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
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
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
