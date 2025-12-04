import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import DepartmentHeader from './layout/DepartmentHeader';
import Footer from './layout/Footer';
import { GenerateSystemButton } from './ui/GenerateSystemButton';
import TopBar from './layout/TopBar';
import LoadingScreen from './ui/LoadingScreen';
import LandingPage from './layout/LandingPage';
import LoginPage from './layout/LoginPage';
import PreMainAppPage from './layout/PreMainAppPage';
import { User } from './types/shared';
import { NexusBackground } from './ui/NexusBackground';
import { ToastProvider, useToast } from './ui/Toast';
import { authService } from './services/auth';
import { LayoutDashboard, X } from 'lucide-react';

// Contexts
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { StoreProvider } from './contexts/StoreContext';
import { LayoutProvider, useLayout } from './contexts/LayoutContext';
import ErrorBoundary from './ui/ErrorBoundary';

// New Architecture Components
import { PageRenderer } from './components/PageRenderer';
import { useWidgetManager } from './hooks/useWidgetManager';

// Lazy load modals

const TableBuilder = lazy(() => import('./ui/TableBuilder'));
const TemplateModal = lazy(() => import('./features/home/components/TemplateModal'));

const AppContent: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [viewState, setViewState] = useState<'landing' | 'login' | 'loading' | 'pre-main' | 'app'>('landing');
  const [isSystemGenerated, setIsSystemGenerated] = useState(() => {
    const saved = localStorage.getItem('isSystemGenerated');
    return saved ? JSON.parse(saved) : false;
  });

  const { activePage, setActivePage, isImmersive } = useNavigation();
  const { isBrainOpen, setBrainOpen, isTableBuilderOpen, setTableBuilderOpen, isTemplateModalOpen, setTemplateModalOpen, appStyle, theme } = useUI();
  const { showToast } = useToast();

  // Layout & Widgets
  const { getTabsForPage, getActiveTabId, setActiveTab, handleDeleteDashboardTab } = useLayout();
  const { handleInsert } = useWidgetManager();

  const activeTabId = getActiveTabId(activePage);
  const activeTab = getTabsForPage(activePage).find(t => t.id === activeTabId);
  const activeTabName = activeTab ? activeTab.name : undefined;

  // Check for existing session on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setViewState('app');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('isSystemGenerated', JSON.stringify(isSystemGenerated));
  }, [isSystemGenerated]);

  const handleLoginSuccess = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    setViewState('loading');
    setTimeout(() => {
      const savedPref = localStorage.getItem('app-preference');
      if (savedPref === 'vision') {
        setActivePage('vision');
        setViewState('app');
      } else if (savedPref === 'main') {
        setActivePage('home');
        setViewState('app');
      } else {
        setViewState('pre-main');
      }
      showToast(`Welcome back, ${loggedInUser.name}!`, 'success');
    }, 2500);
  }, [showToast, setActivePage]);

  const handleLogout = useCallback(() => {
    authService.logout();
    setUser(null);
    setViewState('landing');
    showToast('Logged out successfully', 'info');
  }, [showToast]);

  const handleActivate = useCallback(() => {
    showToast('Account activated successfully!', 'success');
  }, [showToast]);

  if (viewState === 'landing') {
    return <LandingPage onLoginClick={() => setViewState('login')} />;
  }

  if (viewState === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setViewState('landing')} />;
  }

  if (viewState === 'loading') {
    return <LoadingScreen />;
  }

  if (viewState === 'pre-main') {
    return (
      <PreMainAppPage
        onSelectApp={(app, save) => {
          if (save) {
            localStorage.setItem('app-preference', app);
          }
          if (app === 'vision') {
            setActivePage('vision');
          } else {
            setActivePage('home');
          }
          setViewState('app');
        }}
      />
    );
  }

  // --- Main App (Authenticated) ---
  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-sans antialiased selection:bg-purple-100 selection:text-purple-900 relative transition-colors duration-500 ${theme === 'nexus' ? 'bg-[#0f1115] text-gray-200 theme-nexus' : 'bg-white text-clickup-text'}`}>

      {theme === 'nexus' && <NexusBackground />}

      {appStyle === 'main' && activePage !== 'vision' && (
        <TopBar
          user={user}
          onLogout={handleLogout}
          onActivate={handleActivate}
        />
      )}

      {appStyle === 'floating' && activePage !== 'vision' && (
        <div className="fixed top-4 left-4 right-4 z-50 shadow-2xl pointer-events-auto">
          <TopBar
            user={user}
            onLogout={handleLogout}
            onActivate={handleActivate}
            isSystemGenerated={isSystemGenerated}
            className="rounded-2xl border border-gray-700/50 backdrop-blur-md bg-clickup-sidebar/90"
          />
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {appStyle === 'main' && activePage !== 'vision' && (
          <Sidebar
            onLogout={handleLogout}
            user={user}
          />
        )}

        <div className={`flex flex-col flex-1 min-w-0 relative ${appStyle === 'floating' ? 'pt-24' : ''} ${theme === 'nexus' ? 'bg-transparent' : 'bg-white'}`}>
          {appStyle === 'floating' && !isSystemGenerated && (
            <div className="absolute inset-0 bg-[#F8F9FC] z-40 flex items-center justify-center">
              <GenerateSystemButton onGenerate={() => setIsSystemGenerated(true)} />
            </div>
          )}

          <Suspense fallback={<LoadingScreen />}>
            {(() => {
              if (appStyle === 'floating' && !isSystemGenerated) {
                return null; // Don't render content until generated
              }
              // Check if this is a user-created space (spaces have IDs like SPACE-{timestamp})
              const isUserSpace = activePage.startsWith('SPACE-');

              // Don't render header for these pages
              if (isImmersive || activePage === 'inbox' || activePage === 'discussion' || activePage.includes('mind-map') || activePage === 'marketplace/local' || activePage === 'marketplace/global-industries-master' || activePage === 'tower-game' || activePage === 'river-raid' || activePage === 'baloot' || activePage === 'solitaire' || isUserSpace || activePage === 'settings' || activePage === 'vision') {
                return null;
              }

              // Render appropriate header
              return (
                <>
                  {/* Header - Conditional Rendering */}
                  {(activePage.startsWith('operations/') || activePage.startsWith('business/') || activePage.startsWith('support/') || activePage.startsWith('supply-chain/') || activePage.startsWith('smart-tools/')) ? (
                    <DepartmentHeader
                      activeTabName={activeTabName}
                      onInsert={handleInsert}
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

              {/* Main Page Content */}
              <PageRenderer />

            </div>

            {/* Global Footer */}
            {(() => {
              const excludedPages = ['tower-game', 'river-raid', 'baloot', 'solitaire', 'marketplace/local'];
              const shouldShowFooter = !excludedPages.includes(activePage) && !activePage.startsWith('SPACE-');

              if (!shouldShowFooter) return null;
              if (activePage === 'teams') return null;

              return (
                <Footer
                  leftContent={
                    <div className="flex items-center">
                      <span className="font-medium text-gray-600">Workspace Active</span>
                    </div>
                  }
                />
              );
            })()}
          </Suspense>
        </div>
      </div>

      <ErrorBoundary>
        <Suspense fallback={null}>


          <TableBuilder
            isOpen={isTableBuilderOpen}
            onClose={() => setTableBuilderOpen(false)}
            onAdd={(config) => handleInsert('custom-table', config)}
          />
          <TemplateModal
            isOpen={isTemplateModalOpen}
            onClose={() => setTemplateModalOpen(false)}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <StoreProvider>
          <NavigationProvider>
            <UIProvider>
              <LayoutProvider>
                <AppContent />
              </LayoutProvider>
            </UIProvider>
          </NavigationProvider>
        </StoreProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
