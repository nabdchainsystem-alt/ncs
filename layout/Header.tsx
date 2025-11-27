
import React from 'react';
import {
  List, Kanban, Calendar, ChevronDown, Filter,
  ArrowDownUp, BrainCircuit, Share2, LayoutDashboard, Plus, LayoutTemplate, Sparkles
} from 'lucide-react';
import { ViewType } from '../types/shared';
import { useToast } from '../ui/Toast';

import { useNavigation } from '../contexts/NavigationContext';
import { useUI } from '../contexts/UIContext';

const Header: React.FC = () => {
  const { currentView, setCurrentView, getPageTitle, activePage } = useNavigation();
  const { setBrainOpen, setAddCardsOpen, setTemplateModalOpen } = useUI();
  const { showToast } = useToast();

  const pageTitle = getPageTitle();
  const isHome = activePage === 'home';

  const onOpenBrain = () => setBrainOpen(true);
  const onToggleAddCards = () => setAddCardsOpen(true); // Assuming toggle behavior is desired, but context has setOpen. App.tsx had toggle. Let's assume setOpen(true) is fine or we need a toggle in context. Context has setAddCardsOpen. Let's use that.
  const onOpenTemplates = () => setTemplateModalOpen(true);



  const isClearedHeaderPage = ['overview', 'goals', 'reminders', 'tasks', 'vault', 'teams'].includes(activePage);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between flex-shrink-0 z-20 select-none">
      <div className="flex items-center h-full">
        <div className={`flex items-center ${!isHome ? 'mr-4 pr-4 border-r border-gray-200' : ''} h-6`}>
          <span
            className="text-sm font-semibold text-gray-700 flex items-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
            onClick={() => showToast('Breadcrumb navigation', 'info')}
          >
            {pageTitle} {!isHome && <ChevronDown size={12} className="ml-1 text-gray-400" />}
          </span>
        </div>

        {!isHome && !isClearedHeaderPage && (
          <div className="flex space-x-1 bg-gray-100/50 p-0.5 rounded-lg">
            <button
              onClick={() => setCurrentView('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${currentView === 'list'
                ? 'bg-white text-gray-900 font-medium shadow-sm'
                : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'
                }`}
            >
              <List size={14} />
              <span>List</span>
            </button>
            <button
              onClick={() => setCurrentView('board')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${currentView === 'board'
                ? 'bg-white text-gray-900 font-medium shadow-sm'
                : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'
                }`}
            >
              <Kanban size={14} />
              <span>Board</span>
            </button>
            <button
              onClick={() => setCurrentView('calendar')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${currentView === 'calendar'
                ? 'bg-white text-gray-900 font-medium shadow-sm'
                : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'
                }`}
            >
              <Calendar size={14} />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${currentView === 'dashboard'
                ? 'bg-white text-gray-900 font-medium shadow-sm'
                : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'
                }`}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </button>
          </div>
        )}
      </div>

      {!isClearedHeaderPage && (
        <div className="flex items-center space-x-3">
          {isHome ? (
            <div className="flex items-center space-x-2">
              <button
                className="group flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-black/20 hover:bg-gray-900 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
                onClick={onToggleAddCards}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                  <Plus size={14} className="opacity-90" />
                </div>
                <span>Add Cards</span>
                <Sparkles size={14} className="opacity-80 group-hover:rotate-12 transition-transform" />
              </button>
              <button
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold text-black border border-black bg-white hover:bg-black hover:text-white shadow-sm hover:shadow-md active:scale-95 transition-all"
                onClick={onOpenTemplates}
              >
                <LayoutTemplate size={14} />
                <span>Add Report</span>
              </button>
            </div>
          ) : !activePage.startsWith('operations') && !activePage.startsWith('business') && !activePage.startsWith('support') && !activePage.startsWith('supply-chain') ? (
            <>
              <button
                onClick={onOpenBrain}
                className="group flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-white border border-purple-100 hover:border-purple-300 px-3 py-1.5 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <BrainCircuit size={16} className="text-clickup-purple group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-semibold text-gray-700 bg-clip-text bg-gradient-to-r from-clickup-purple to-indigo-600 group-hover:text-transparent">
                  Ask AI
                </span>
              </button>

              <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>

              <div className="flex items-center space-x-1 text-gray-500">
                <div className="relative group">
                  <div
                    className="flex -space-x-2 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => showToast('Manage Assignees', 'info')}
                  >
                    <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">A</div>
                    <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">S</div>
                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] text-gray-600 font-bold">+</div>
                  </div>
                </div>
              </div>

              <button
                className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => showToast('Share view options', 'info')}
              >
                <Share2 size={16} />
              </button>

              <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>

              <div className="flex items-center space-x-1 text-gray-500">
                <button
                  className="px-2 py-1.5 hover:bg-gray-100 rounded flex items-center space-x-1.5 text-xs font-medium transition-colors text-gray-600"
                  onClick={() => showToast('Filter menu', 'info')}
                >
                  <Filter size={14} />
                  <span className="hidden md:inline">Filter</span>
                </button>
                <button
                  className="px-2 py-1.5 hover:bg-gray-100 rounded flex items-center space-x-1.5 text-xs font-medium transition-colors text-gray-600"
                  onClick={() => showToast('Sort menu', 'info')}
                >
                  <ArrowDownUp size={14} />
                  <span className="hidden md:inline">Sort</span>
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </header>
  );
};

export default Header;
