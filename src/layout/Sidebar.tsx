import React, { useState, useRef, useEffect } from 'react';
import {
  Home, Folder, ChevronRight, ChevronDown, Plus, Settings, Users, Inbox, Target,
  Download, LogOut, CreditCard, Code, ChevronsLeft, ChevronsRight, Trash2, Edit2, MoreHorizontal, Layout, Rocket, Waves,
  Building2, Truck, Briefcase, LifeBuoy, ShoppingCart, Warehouse, Ship, Calendar, Car, Store, MapPin,
  Database, BarChart2, Bell, ListTodo, Shield, MessageSquare, Globe, ChevronsDown
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { roomService } from '../features/rooms/roomService';
import { taskService } from '../features/tasks/taskService';
import { downloadProjectSource } from '../utils/projectDownloader';
import { Room } from '../features/rooms/types';
import { CreateRoomModal } from '../features/rooms/CreateRoomModal';
import { User, Permissions } from '../types/shared';
import { permissionService } from '../services/permissionService';
import { getCompanyName, getLogoUrl } from '../utils/config';
import { ConfirmModal } from '../ui/ConfirmModal';

import { useNavigation } from '../contexts/NavigationContext';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  onLogout?: () => void;
  user: User | null;
}



const SidebarLabel = ({ children, isCollapsed }: { children: React.ReactNode, isCollapsed: boolean }) => (
  <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100 ms-2'}`}>
    {children}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ onLogout, user }) => {
  const { activePage, setActivePage: onNavigate, isImmersive } = useNavigation();
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsExpanded, setRoomsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar_roomsExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [departmentsExpanded, setDepartmentsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar_departmentsExpanded');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [supplyChainExpanded, setSupplyChainExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar_supplyChainExpanded');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sidebar_expandedItems');
    return saved !== null ? JSON.parse(saved) : {};
  });

  const [communicationsExpanded, setCommunicationsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar_communicationsExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [marketplaceExpanded, setMarketplaceExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar_marketplaceExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_isCollapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [isCreateRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<{ text: string, items?: string[], top: number } | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      // If we have a user, try to get their permissions. 
      // If email is missing (legacy/bug), getPermissions handles it by returning defaults.
      const perms = permissionService.getPermissions(user.email || '');
      setPermissions(perms);
    } else {
      setPermissions(null);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      fetchRooms();
    }
  }, [user?.id]);

  const fetchRooms = async () => {
    if (!user?.id) return;
    try {
      setLoadingRooms(true);
      const data = await roomService.getRooms(user.id);
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      showToast('Failed to load rooms', 'error');
    } finally {
      setLoadingRooms(false);
    }
  };
  useEffect(() => {
    localStorage.setItem('sidebar_roomsExpanded', JSON.stringify(roomsExpanded));
  }, [roomsExpanded]);

  useEffect(() => {
    localStorage.setItem('sidebar_departmentsExpanded', JSON.stringify(departmentsExpanded));
  }, [departmentsExpanded]);

  useEffect(() => {
    localStorage.setItem('sidebar_supplyChainExpanded', JSON.stringify(supplyChainExpanded));
  }, [supplyChainExpanded]);

  useEffect(() => {
    localStorage.setItem('sidebar_expandedItems', JSON.stringify(expandedItems));
  }, [expandedItems]);



  useEffect(() => {
    localStorage.setItem('sidebar_communicationsExpanded', JSON.stringify(communicationsExpanded));
  }, [communicationsExpanded]);

  useEffect(() => {
    localStorage.setItem('sidebar_marketplaceExpanded', JSON.stringify(marketplaceExpanded));
  }, [marketplaceExpanded]);

  useEffect(() => {
    localStorage.setItem('sidebar_isCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleCreateRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCreateRoomModalOpen(true);
  };

  const handleModalCreate = async (name: string, color: string) => {
    try {
      // Create as personal room for the current user
      const newRoom = await roomService.createRoom(name, color, user?.id, 'personal');
      setRooms(prev => [...prev, newRoom]);
      showToast('Private Room created!', 'success');
      onNavigate(newRoom.id);
    } catch (err) {
      showToast('Failed to create private room', 'error');
    }
  };


  const handleDeleteRoom = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRoomToDelete(id);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await roomService.deleteRoom(roomToDelete);
      setRooms(prev => prev.filter(s => s.id !== roomToDelete));
      if (activePage === roomToDelete) onNavigate('home');
      showToast('Private Room deleted', 'success');
    } catch (err) {
      showToast('Failed to delete private room', 'error');
    }
    setRoomToDelete(null);
  };

  const handleRenameRoom = async (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    const newName = prompt("Rename Private Room:", currentName);
    if (newName && newName !== currentName) {
      try {
        await roomService.updateRoom(id, { name: newName });
        setRooms(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
        showToast('Private Room renamed', 'success');
      } catch (err) {
        showToast('Failed to rename private room', 'error');
      }
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowWorkspaceMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNavClick = (pageId: string, message: string) => {
    onNavigate(pageId);
  };

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowWorkspaceMenu(false);
    showToast('Preparing JSON export...', 'info');

    try {
      const tasks = await taskService.getTasks();
      const exportData = {
        exportedAt: new Date().toISOString(),
        appName: "ClickUp Clone",
        version: "2.0.0",
        tasks: tasks,
        rooms: rooms
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `clickup_workspace_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Workspace data exported successfully!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to export data', 'error');
    }
  };

  const handleDownloadSource = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowWorkspaceMenu(false);
    showToast('Generating project ZIP...', 'info');
    try {
      await downloadProjectSource();
      showToast('Source code downloaded!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to generate ZIP', 'error');
    }
  };

  const getItemClass = (id: string) => {
    const base = activePage === id
      ? 'bg-clickup-hover text-white font-medium'
      : 'hover:bg-clickup-hover hover:text-white';

    // MacBook Dock style: Large scale, springy transition, shadow, and high z-index
    return `${base} ${isEffectiveCollapsed ? 'transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-[1.5] hover:z-50 hover:shadow-xl relative' : ''}`;
  };

  const getIconClass = (id: string, defaultColor: string = '') => {
    return activePage === id ? 'text-white' : (defaultColor || '');
  };

  const allDepartmentPaths = [
    'supply-chain', 'operations', 'business', 'support',
    'supply-chain/procurement', 'supply-chain/warehouse', 'supply-chain/shipping', 'supply-chain/planning', 'supply-chain/fleet', 'supply-chain/vendors',
    'operations/maintenance', 'operations/production', 'operations/quality',
    'business/sales', 'business/finance',
    'support/it', 'support/hr', 'support/marketing'
  ];

  const handleDeepToggleDepartments = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shouldExpand = !departmentsExpanded;
    setDepartmentsExpanded(shouldExpand);
    setSupplyChainExpanded(shouldExpand);

    setExpandedItems(prev => {
      const next = { ...prev };
      allDepartmentPaths.forEach(path => {
        next[path] = shouldExpand;
      });
      return next;
    });
  };

  const handleDeepToggleRooms = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRoomsExpanded(!roomsExpanded);
  };



  // Helper to check if any permission in a list is true
  const hasAnyPermission = (keys: string[]) => {
    if (!permissions) return false;
    return keys.some(key => permissions[key]);
  };

  const showDepartments = permissions?.departments || hasAnyPermission([
    'supply-chain', 'supply-chain/procurement', 'supply-chain/warehouse', 'supply-chain/shipping', 'supply-chain/planning', 'supply-chain/fleet', 'supply-chain/vendors',
    'operations', 'operations/maintenance', 'operations/production', 'operations/quality',
    'business', 'business/sales', 'business/finance',
    'support', 'support/it', 'support/hr', 'support/marketing'
  ]);



  const showMarketplace = permissions?.marketplace || hasAnyPermission([
    'marketplace/local', 'marketplace/foreign'
  ]);

  // Helper for tooltips that avoids overflow clipping
  const handleTooltipEnter = (e: React.MouseEvent, text: string, items?: string[]) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({ text, items, top: rect.top + rect.height / 2 });
  };

  const handleTooltipLeave = () => {
    setHoveredTooltip(null);
  };

  const [isHovered, setIsHovered] = useState(false);

  // ... (keep existing code)

  // Calculate effective width state
  const isEffectiveCollapsed = isCollapsed && !isHovered;

  return (
    <div
      className={`${isEffectiveCollapsed ? 'w-16' : 'w-64'} bg-clickup-sidebar text-gray-400 flex flex-col h-[calc(100vh-3rem)] flex-shrink-0 select-none relative transition-all duration-300 z-50 overflow-visible`}
      style={{ zoom: '110%' }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ConfirmModal
        isOpen={!!roomToDelete}
        onClose={() => setRoomToDelete(null)}
        onConfirm={confirmDeleteRoom}
        title="Delete Private Room"
        message="Are you sure you want to delete this private room? This action cannot be undone and all tasks within it will be permanently lost."
        confirmText="Delete Room"
        variant="danger"
      />
      {/* Floating Tooltip Portal-like rendering */}
      {isEffectiveCollapsed && hoveredTooltip && (
        <div
          className="fixed left-[4.5rem] px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-md z-[100] shadow-xl border border-gray-700/50 pointer-events-none animate-in fade-in zoom-in-95 duration-150 min-w-[120px]"
          style={{ top: hoveredTooltip.top, transform: 'translateY(-50%)' }}
        >
          <div className="font-bold text-gray-100 mb-0.5">{hoveredTooltip.text}</div>
          {hoveredTooltip.items && (
            <div className="space-y-0.5 mt-1 pt-1 border-t border-gray-700/50">
              {hoveredTooltip.items.map((item, idx) => (
                <div key={idx} className="text-gray-400 text-[10px] flex items-center">
                  <div className="w-1 h-1 rounded-full bg-gray-600 mr-1.5"></div>
                  {item}
                </div>
              ))}
            </div>
          )}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-[4px] border-transparent border-r-gray-900"></div>
        </div>
      )}

      {/* Collapse Toggle - Larger Hit Area */}
      {/* Collapse Toggle - Refined Design */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        onMouseEnter={(e) => e.stopPropagation()}
        className="absolute -right-3 top-2 w-6 h-6 bg-[#2a2e35] border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan-500/50 hover:shadow-[0_0_8px_rgba(6,182,212,0.4)] z-[100] transition-all duration-300 hover:scale-105 group"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronsRight size={14} className="group-hover:text-cyan-400 transition-colors" /> : <ChevronsLeft size={14} className="group-hover:text-cyan-400 transition-colors" />}
      </button>

      {/* Workspace Switcher / Settings Menu */}
      <div className="relative" ref={menuRef}>
        <div
          className={`p-3 flex items-center ${isEffectiveCollapsed ? 'justify-center' : 'justify-between'} cursor-pointer transition-colors group ${showWorkspaceMenu ? 'bg-clickup-hover' : 'hover:bg-clickup-hover'}`}
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/nabd-logo-light.svg" alt="NABD" className="w-full h-full object-contain" />
            </div>
            {!isEffectiveCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-gray-200 text-sm font-medium leading-tight group-hover:text-white transition-colors truncate">{user?.name || 'User'}</span>
              </div>
            )}
          </div>
          {!isEffectiveCollapsed && (
            <ChevronDown size={14} className={`text-gray-500 group-hover:text-gray-300 transition-all duration-200 ${showWorkspaceMenu ? 'rotate-180' : ''}`} />
          )}
        </div>

        {/* Dropdown Menu */}
        {showWorkspaceMenu && (
          <div className={`absolute top-full mt-1 bg-[#2a2e35] border border-gray-700 rounded-lg shadow-2xl z-50 py-1 animate-in slide-in-from-top-2 fade-in duration-150 overflow-hidden ${isEffectiveCollapsed ? 'left-14 w-56' : 'left-2 right-2'}`}>
            <div className="px-3 py-2 border-b border-gray-700/50 mb-1">
              <p className="text-xs font-semibold text-white">{user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-500">{user?.email || 'user@example.com'}</p>
            </div>

            <div className="px-1 space-y-0.5">
              <button
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors text-start"
                onClick={() => {
                  onNavigate('settings');
                  setShowWorkspaceMenu(false);
                }}
              >
                <Settings size={14} />
                <span>{t('common.settings')}</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors text-start">
                <Users size={14} />
                <span>{t('common.members')}</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors text-start">
                <CreditCard size={14} />
                <span>{t('common.billing')}</span>
              </button>
            </div>

            <div className="h-[1px] bg-gray-700/50 mx-2 my-1.5"></div>

            <div className="px-1 space-y-0.5">
              <button
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors text-start"
                onClick={handleExport}
              >
                <Download size={14} />
                <span>{t('common.export')}</span>
              </button>
              <button
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors text-start"
                onClick={handleDownloadSource}
              >
                <Code size={14} />
                <span>{t('common.download_source')}</span>
              </button>
              <button
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors text-start"
                onClick={() => {
                  if (onLogout) onLogout();
                }}
              >
                <LogOut size={14} />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div
        className="flex-1 overflow-y-auto overflow-x-visible custom-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
      >
        {/* Quick Actions & Navigation */}
        <div className="px-2 py-1 space-y-0.5">


          {/* Home */}
          {/* Home */}
          <div
            className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('home')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
            onClick={() => handleNavClick('home', 'Navigated to Home')}
            onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Home')}
            onMouseLeave={handleTooltipLeave}
          >
            <Home size={16} className={`${getIconClass('home')} shrink-0`} />
            <SidebarLabel isCollapsed={isEffectiveCollapsed}>{t('nav.home')}</SidebarLabel>
          </div>



          {/* INBOX Section */}
          {/* Communications Group */}
          <div className="mt-1 mb-2">
            <div
              className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors group ${['inbox', 'discussion', 'connections'].some(p => activePage === p) ? 'bg-clickup-hover text-white' : 'hover:bg-clickup-hover hover:text-white'} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
              onClick={() => {
                if (isEffectiveCollapsed) {
                  setIsCollapsed(false);
                  setCommunicationsExpanded(true);
                } else {
                  setCommunicationsExpanded(!communicationsExpanded);
                }
              }}
              onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Communications', ['Inbox', 'Discussion', 'Connections'])}
              onMouseLeave={handleTooltipLeave}
            >
              <MessageSquare size={16} className="shrink-0" />
              {!isEffectiveCollapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span>Communications</span>
                  {communicationsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              )}
            </div>

            {!isEffectiveCollapsed && communicationsExpanded && (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-700 pl-2">
                {/* Inbox */}
                {permissions?.inbox && (
                  <div
                    className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${activePage === 'inbox' ? 'bg-clickup-hover text-white font-medium' : 'hover:bg-clickup-hover hover:text-white text-gray-400'}`}
                    onClick={() => handleNavClick('inbox', 'Navigated to Inbox')}
                  >
                    <Inbox size={14} className="shrink-0" />
                    <div className="ml-2 flex-1 flex items-center justify-between w-full">
                      <span>{t('nav.inbox')}</span>
                      <span className="bg-clickup-dark text-xs px-1.5 py-0.5 rounded text-gray-400 transition-colors">0</span>
                    </div>
                  </div>
                )}

                {/* Discussion */}
                {permissions?.discussion && (
                  <div
                    className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${activePage === 'discussion' ? 'bg-clickup-hover text-white font-medium' : 'hover:bg-clickup-hover hover:text-white text-gray-400'}`}
                    onClick={() => handleNavClick('discussion', 'Navigated to Discussion')}
                  >
                    <MessageSquare size={14} className="shrink-0" />
                    <span className="ml-2">{t('nav.discussion')}</span>
                  </div>
                )}

                {/* Connections */}
                <div
                  className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${activePage === 'connections' ? 'bg-clickup-hover text-white font-medium' : 'hover:bg-clickup-hover hover:text-white text-gray-400'}`}
                  onClick={() => handleNavClick('connections', 'Navigated to Connections')}
                >
                  <Users size={14} className="shrink-0" />
                  <span className="ml-2">Connections</span>
                </div>
              </div>
            )}
          </div>

          {/* Reminders (Restored) */}
          {permissions?.reminders && (
            <div className="mb-2">
              <div
                className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${activePage === 'reminders' ? 'bg-clickup-hover text-white font-medium' : 'hover:bg-clickup-hover hover:text-white text-gray-400'} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                onClick={() => handleNavClick('reminders', 'Navigated to Reminders')}
                onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Reminders')}
                onMouseLeave={handleTooltipLeave}
              >
                <Bell size={16} className="shrink-0" />
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>{t('nav.reminders')}</SidebarLabel>
              </div>
            </div>
          )}

          <div className="mt-1 mb-2">

            {/* Overview */}
            {permissions?.overview && (
              <div
                className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('overview')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                onClick={() => handleNavClick('overview', 'Dashboards Overview')}
                onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Overview')}
                onMouseLeave={handleTooltipLeave}
              >
                <Layout size={16} className="shrink-0" />
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>{t('nav.overview')}</SidebarLabel>
              </div>
            )}

            {/* Goals */}
            {permissions?.goals && (
              <div
                className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('goals')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                onClick={() => handleNavClick('goals', 'Goals Dashboard')}
                onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Goals')}
                onMouseLeave={handleTooltipLeave}
              >
                <Target size={16} className="shrink-0" />
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>{t('nav.goals')}</SidebarLabel>
              </div>
            )}

            {/* Tasks */}
            {permissions?.tasks && (
              <div
                className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('tasks')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                onClick={() => handleNavClick('tasks', 'Navigated to Tasks')}
                onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Tasks')}
                onMouseLeave={handleTooltipLeave}
              >
                <ListTodo size={16} className="shrink-0" />
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>{t('nav.tasks')}</SidebarLabel>
              </div>
            )}

            {/* Vault */}
            {permissions?.vault && (
              <div
                className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('vault')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                onClick={() => handleNavClick('vault', 'Navigated to Vault')}
                onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Vault')}
                onMouseLeave={handleTooltipLeave}
              >
                <Shield size={16} className="shrink-0" />
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>{t('nav.vault')}</SidebarLabel>
              </div>
            )}



            {/* Teams */}
            {permissions?.teams && (
              <div
                className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('teams')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                onClick={() => handleNavClick('teams', 'Navigated to Teams')}
                onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Teams')}
                onMouseLeave={handleTooltipLeave}
              >
                <Users size={16} className="shrink-0" />
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>{t('nav.teams')}</SidebarLabel>
              </div>
            )}


          </div>

          <div className="h-[1px] bg-gray-800 mx-3 my-2 opacity-50"></div>

          {/* Departments Section */}
          {showDepartments && (
            <>
              <div
                className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors group ${['departments', 'supply-chain', 'operations', 'business', 'support'].some(p => activePage.startsWith(p)) ? 'bg-clickup-hover text-white' : 'hover:bg-clickup-hover hover:text-white'} ${isEffectiveCollapsed ? 'justify-center transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-[1.5] hover:z-50 hover:shadow-xl relative' : ''}`}
                onClick={() => {
                  if (isEffectiveCollapsed) {
                    setIsCollapsed(false);
                    setDepartmentsExpanded(true);
                  } else {
                    setDepartmentsExpanded(!departmentsExpanded);
                  }
                }}
                onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Departments', ['Supply Chain', 'Operations', 'Business', 'Support'])}
                onMouseLeave={handleTooltipLeave}
              >
                <Building2 size={16} className="shrink-0" />
                {!isEffectiveCollapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{t('nav.departments')}</span>
                    <div className="flex items-center space-x-1">
                      <div
                        onClick={handleDeepToggleDepartments}
                        className="p-0.5 hover:bg-gray-700 rounded transition-colors text-gray-500 hover:text-white"
                        title={departmentsExpanded ? "Collapse All" : "Expand All"}
                      >
                        {departmentsExpanded ? <ChevronsDown size={12} /> : <ChevronsRight size={12} />}
                      </div>
                      {departmentsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </div>
                )}
              </div>

              {/* Nested Departments */}
              {!isEffectiveCollapsed && departmentsExpanded && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-700 pl-2">

                  {/* Supply Chain Dropdown (Refactored for Nesting) */}
                  {(permissions?.['supply-chain'] || hasAnyPermission(['supply-chain/procurement', 'supply-chain/warehouse', 'supply-chain/shipping', 'supply-chain/planning', 'supply-chain/fleet', 'supply-chain/vendors'])) && (
                    <div>
                      <div
                        className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer group ${activePage.startsWith('supply-chain') ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        onClick={() => setSupplyChainExpanded(!supplyChainExpanded)}
                      >
                        <Truck size={14} className="shrink-0" />
                        <div className="ml-2 flex-1 flex items-center justify-between">
                          <span className="text-sm">{t('dept.supply_chain')}</span>
                          {supplyChainExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </div>
                      </div>

                      {/* Supply Chain Sub-menu */}
                      {supplyChainExpanded && (
                        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-700 pl-2">
                          {[
                            { id: 'procurement', label: t('dept.procurement'), icon: ShoppingCart },
                            { id: 'warehouse', label: t('dept.warehouse'), icon: Warehouse },
                            { id: 'shipping', label: t('dept.shipping'), icon: Ship },
                            { id: 'planning', label: t('dept.planning'), icon: Calendar },
                            { id: 'fleet', label: t('dept.fleet'), icon: Car },
                            { id: 'vendors', label: t('dept.vendors'), icon: Store },
                          ].filter(item => permissions?.[`supply-chain/${item.id}`]).map((item) => {
                            const itemPath = `supply-chain/${item.id}`;
                            const isItemExpanded = activePage.startsWith(itemPath) || (expandedItems[itemPath] !== undefined ? expandedItems[itemPath] : false);

                            return (
                              <div key={item.id}>
                                <div
                                  className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer group ${activePage.startsWith(itemPath) ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                  onClick={() => toggleExpand(itemPath)}
                                >
                                  <item.icon size={12} className="shrink-0" />
                                  <div className="ml-2 flex-1 flex items-center justify-between">
                                    <span className="text-xs font-medium">{item.label}</span>
                                    {isItemExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                  </div>
                                </div>

                                {isItemExpanded && (
                                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-700/50 pl-2">
                                    {[
                                      { id: 'data', label: t('common.data'), icon: Database },
                                      { id: 'analytics', label: t('common.analytics'), icon: BarChart2 }
                                    ].map(leaf => (
                                      <div
                                        key={leaf.id}
                                        className={`flex items-center px-2 py-1 rounded-md cursor-pointer ${activePage === `${itemPath}/${leaf.id}` ? 'text-white bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}
                                        onClick={() => handleNavClick(`${itemPath}/${leaf.id}`, `Opening ${item.label} ${leaf.label}`)}
                                      >
                                        <leaf.icon size={10} className="shrink-0" />
                                        <span className="ml-2 text-[10px] uppercase tracking-wide font-medium">{leaf.label}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}



                  {/* Dynamic Nested Departments */}
                  {[
                    {
                      id: 'operations',
                      label: t('dept.operations'),
                      icon: Settings,
                      children: [
                        { id: 'maintenance', label: t('dept.maintenance') },
                        { id: 'production', label: t('dept.production') },
                        { id: 'quality', label: t('dept.quality') },
                      ]
                    },
                    {
                      id: 'business',
                      label: t('dept.business'),
                      icon: Briefcase,
                      children: [
                        { id: 'sales', label: t('dept.sales') },
                        { id: 'finance', label: t('dept.finance') },
                      ]
                    },
                    {
                      id: 'support',
                      label: t('dept.support'),
                      icon: LifeBuoy,
                      children: [
                        { id: 'it', label: t('dept.it') },
                        { id: 'hr', label: t('dept.hr') },
                        { id: 'marketing', label: t('dept.marketing') },
                      ]
                    },
                  ].filter(dept => permissions?.[dept.id] || hasAnyPermission(dept.children.map(c => `${dept.id}/${c.id}`))).map((dept) => {
                    const isDeptExpanded = activePage.startsWith(dept.id) || (expandedItems[dept.id] !== undefined ? expandedItems[dept.id] : false);

                    return (
                      <div key={dept.id}>
                        <div
                          className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer group ${activePage.startsWith(dept.id) ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                          onClick={() => toggleExpand(dept.id)}
                        >
                          <dept.icon size={14} className="shrink-0" />
                          <div className="ml-2 flex-1 flex items-center justify-between">
                            <span className="text-sm">{dept.label}</span>
                            {isDeptExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </div>
                        </div>

                        {isDeptExpanded && (
                          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-700 pl-2">
                            {dept.children.filter(sub => permissions?.[`${dept.id}/${sub.id}`]).map(sub => {
                              const subPath = `${dept.id}/${sub.id}`;
                              const isSubExpanded = activePage.startsWith(subPath) || (expandedItems[subPath] !== undefined ? expandedItems[subPath] : false);

                              return (
                                <div key={sub.id}>
                                  <div
                                    className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer group ${activePage.startsWith(subPath) ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                    onClick={() => toggleExpand(subPath)}
                                  >
                                    <Folder size={12} className="shrink-0" />
                                    <div className="ml-2 flex-1 flex items-center justify-between">
                                      <span className="text-xs font-medium">{sub.label}</span>
                                      {isSubExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                    </div>
                                  </div>

                                  {isSubExpanded && (
                                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-700/50 pl-2">
                                      {[
                                        { id: 'data', label: t('common.data'), icon: Database },
                                        { id: 'analytics', label: t('common.analytics'), icon: BarChart2 }
                                      ].map(leaf => (
                                        <div
                                          key={leaf.id}
                                          className={`flex items-center px-2 py-1 rounded-md cursor-pointer ${activePage === `${subPath}/${leaf.id}` ? 'text-white bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}
                                          onClick={() => handleNavClick(`${subPath}/${leaf.id}`, `Opening ${sub.label} ${leaf.label}`)}
                                        >
                                          <leaf.icon size={10} className="shrink-0" />
                                          <span className="ml-2 text-[10px] uppercase tracking-wide font-medium">{leaf.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="h-[1px] bg-gray-800 mx-3 my-1 opacity-50"></div>

        {/* Rooms Section (Dynamic) */}
        <div className="px-2 py-2">
          <div className="mb-4">
            <div className={`flex items-center ${isEffectiveCollapsed ? 'justify-center' : 'justify-between'} text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-2 hover:text-gray-300 cursor-pointer group h-6`}>
              {!isEffectiveCollapsed && <span onClick={() => setRoomsExpanded(!roomsExpanded)}>{t('nav.private_rooms')}</span>}
              {isEffectiveCollapsed && (
                <span
                  className="text-[10px] cursor-pointer hover:text-white"
                  onClick={() => {
                    setIsCollapsed(false);
                    setRoomsExpanded(true);
                  }}
                >
                  PVT
                </span>
              )}

              {!isEffectiveCollapsed && (
                <div className="flex items-center space-x-1">
                  <div
                    className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity cursor-pointer"
                    onClick={handleCreateRoom}
                    title="Create Private Room"
                  >
                    <Plus size={14} />
                  </div>

                  <div onClick={() => setRoomsExpanded(!roomsExpanded)}>
                    {roomsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </div>
              )}
            </div>

            {roomsExpanded && !loadingRooms && (
              <div className="space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                {rooms.length === 0 && !isEffectiveCollapsed && (
                  <div
                    className="p-3 border border-dashed border-gray-700 rounded text-center text-xs text-gray-500 hover:text-gray-400 hover:border-gray-600 cursor-pointer transition-colors"
                    onClick={handleCreateRoom}
                  >
                    + Create your first Private Room
                  </div>
                )}

                {rooms.map(room => (
                  <div key={room.id} className="group relative">
                    <div
                      className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass(room.id)} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                      onClick={() => handleNavClick(room.id, `Viewing ${room.name}`)}
                      onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, room.name)}
                      onMouseLeave={handleTooltipLeave}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: room.color }}></div>
                      {!isEffectiveCollapsed && (
                        <span className="flex-1 truncate font-medium">{room.name}</span>
                      )}

                      {!isEffectiveCollapsed && (
                        <div className="hidden group-hover:flex items-center space-x-1">
                          <Edit2 size={10} className="text-gray-500 hover:text-white" onClick={(e) => handleRenameRoom(e, room.id, room.name)} />
                          <Trash2 size={10} className="text-gray-500 hover:text-red-400" onClick={(e) => handleDeleteRoom(e, room.id)} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-[1px] bg-gray-800 mx-3 my-2 opacity-50"></div>

          {/* Smart Tools Section */}




          <div className="h-[1px] bg-gray-800 mx-3 my-2 opacity-50"></div>

          {/* Market Place Section */}
          {showMarketplace && (
            <div className="mb-4">
              <div
                className={`flex items-center ${isEffectiveCollapsed ? 'justify-center' : 'justify-between'} text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-2 group cursor-pointer hover:text-gray-300`}
                onClick={() => setMarketplaceExpanded(!marketplaceExpanded)}
              >
                {!isEffectiveCollapsed && <span>{t('nav.marketplace')}</span>}
                {isEffectiveCollapsed && <span>MKT</span>}
                {!isEffectiveCollapsed && (
                  <div className="flex items-center space-x-1">
                    {marketplaceExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                )}
              </div>

              {marketplaceExpanded && (
                <div className="space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                  {/* Local Marketplace */}
                  {permissions?.['marketplace/local'] && (
                    <div
                      className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('marketplace/local')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                      onClick={() => handleNavClick('marketplace/local', 'Local Marketplace')}
                      title={isEffectiveCollapsed ? t('market.local') : ""}
                    >
                      <MapPin size={14} className="shrink-0" />
                      {!isEffectiveCollapsed && <span>{t('market.local')}</span>}
                    </div>
                  )}




                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite Section */}
      <div className="p-3 border-t border-gray-800">
        <div
          className={`bg-gray-900 hover:bg-black border border-gray-800 rounded-md p-2 text-white flex items-center ${isEffectiveCollapsed ? 'justify-center' : 'justify-center space-x-2'} cursor-pointer transition-all active:scale-95 group mb-2 shadow-md`}
          onClick={() => showToast('Invite dialog opened', 'info')}
          title="Invite Team"
        >
          <Users size={14} className="shrink-0" />
          {!isEffectiveCollapsed && <span className="text-sm font-medium">Invite Team</span>}
        </div>

        <div className={`flex items-center ${isEffectiveCollapsed ? 'flex-col space-y-2' : 'flex-row space-x-1 justify-center'}`}>
          {/* Games removed */}
        </div>


      </div>


      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setCreateRoomModalOpen(false)}
        onCreate={handleModalCreate}
      />
    </div >
  );
};

export default React.memo(Sidebar);
