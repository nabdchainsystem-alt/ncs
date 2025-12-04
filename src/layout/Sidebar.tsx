import React, { useState, useRef, useEffect } from 'react';
import {
  Home, Folder, ChevronRight, ChevronDown, Plus, Settings, Users, Inbox, Target,
  Download, LogOut, CreditCard, Code, ChevronsLeft, ChevronsRight, Trash2, Edit2, MoreHorizontal, Layout, BrainCircuit, Rocket, Waves,
  Building2, Truck, Briefcase, LifeBuoy, ShoppingCart, Warehouse, Ship, Calendar, Car, Store, MapPin,
  Database, BarChart2, Gamepad2, Bell, ListTodo, Shield, LayoutDashboard, ChevronsDown, MessageSquare, Castle, Orbit, Club, Globe
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

interface SidebarProps {
  onLogout?: () => void;
  user: User | null;
}



const SidebarLabel = ({ children, isCollapsed }: { children: React.ReactNode, isCollapsed: boolean }) => (
  <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100 ml-2'}`}>
    {children}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ onLogout, user }) => {
  const { activePage, setActivePage: onNavigate, isImmersive } = useNavigation();
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
  const [smartToolsExpanded, setSmartToolsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar_smartToolsExpanded');
    return saved !== null ? JSON.parse(saved) : false;
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
    localStorage.setItem('sidebar_smartToolsExpanded', JSON.stringify(smartToolsExpanded));
  }, [smartToolsExpanded]);

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

  const handleDeepToggleSmartTools = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSmartToolsExpanded(!smartToolsExpanded);
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

  const showSmartTools = permissions?.smartTools || hasAnyPermission([
    'smart-tools/mind-map', 'smart-tools/dashboard'
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
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors text-left"
                onClick={() => {
                  onNavigate('settings');
                  setShowWorkspaceMenu(false);
                }}
              >
                <Settings size={14} />
                <span>Settings</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors text-left">
                <Users size={14} />
                <span>Members</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors text-left">
                <CreditCard size={14} />
                <span>Billing</span>
              </button>
            </div>

            <div className="h-[1px] bg-gray-700/50 mx-2 my-1.5"></div>

            <div className="px-1 space-y-0.5">
              <button
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors text-left"
                onClick={handleExport}
              >
                <Download size={14} />
                <span>Export Data (JSON)</span>
              </button>
              <button
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors text-left"
                onClick={handleDownloadSource}
              >
                <Code size={14} />
                <span>Download Source</span>
              </button>
              <button
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors text-left"
                onClick={() => {
                  if (onLogout) onLogout();
                }}
              >
                <LogOut size={14} />
                <span>Logout</span>
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
            <SidebarLabel isCollapsed={isEffectiveCollapsed}>Home</SidebarLabel>
          </div>

          {/* Overview */}
          {permissions?.overview && (
            <div
              className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('overview')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
              onClick={() => handleNavClick('overview', 'Dashboards Overview')}
              onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Overview')}
              onMouseLeave={handleTooltipLeave}
            >
              <Layout size={16} className="shrink-0" />
              <SidebarLabel isCollapsed={isEffectiveCollapsed}>Overview</SidebarLabel>
            </div>
          )}

          {/* INBOX Section */}
          <div className="mt-1 mb-2">
            {/* Inbox */}
            {permissions?.inbox && (
              <div
                className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('inbox')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                onClick={() => handleNavClick('inbox', 'Navigated to Inbox')}
                onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Inbox')}
                onMouseLeave={handleTooltipLeave}
              >
                <Inbox size={16} className={`${activePage === 'inbox' ? 'text-white' : ''} shrink-0`} />
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>
                  <div className="flex-1 flex items-center justify-between w-full">
                    <span>Inbox</span>
                    <span className="bg-clickup-dark text-xs px-1.5 py-0.5 rounded text-gray-400 group-hover:text-white transition-colors ml-2">0</span>
                  </div>
                </SidebarLabel>
              </div>
            )}

            {/* Discussion */}
            {permissions?.discussion && (
              <div
                className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('discussion')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                onClick={() => handleNavClick('discussion', 'Navigated to Discussion')}
                onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Discussion')}
                onMouseLeave={handleTooltipLeave}
              >
                <MessageSquare size={16} className="shrink-0" />
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>Discussion</SidebarLabel>
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
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>Goals</SidebarLabel>
              </div>
            )}

            {/* Reminders */}
            {permissions?.reminders && (
              <div
                className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('reminders')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                onClick={() => handleNavClick('reminders', 'Navigated to Reminders')}
                onMouseEnter={(e) => isEffectiveCollapsed && handleTooltipEnter(e, 'Reminders')}
                onMouseLeave={handleTooltipLeave}
              >
                <Bell size={16} className="shrink-0" />
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>Reminders</SidebarLabel>
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
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>Tasks</SidebarLabel>
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
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>Vault</SidebarLabel>
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
                <SidebarLabel isCollapsed={isEffectiveCollapsed}>Teams</SidebarLabel>
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
                    <span>Departments</span>
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
                          <span className="text-sm">Supply Chain</span>
                          {supplyChainExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </div>
                      </div>

                      {/* Supply Chain Sub-menu */}
                      {supplyChainExpanded && (
                        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-700 pl-2">
                          {[
                            { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
                            { id: 'warehouse', label: 'Warehouse', icon: Warehouse },
                            { id: 'shipping', label: 'Shipping', icon: Ship },
                            { id: 'planning', label: 'Planning', icon: Calendar },
                            { id: 'fleet', label: 'Fleet', icon: Car },
                            { id: 'vendors', label: 'Vendors', icon: Store },
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
                                      { id: 'data', label: 'Data', icon: Database },
                                      { id: 'analytics', label: 'Analytics', icon: BarChart2 }
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
                      label: 'Operations',
                      icon: Settings,
                      children: [
                        { id: 'maintenance', label: 'Maintenance' },
                        { id: 'production', label: 'Production' },
                        { id: 'quality', label: 'Quality' },
                      ]
                    },
                    {
                      id: 'business',
                      label: 'Business',
                      icon: Briefcase,
                      children: [
                        { id: 'sales', label: 'Sales' },
                        { id: 'finance', label: 'Finance' },
                      ]
                    },
                    {
                      id: 'support',
                      label: 'Business Support',
                      icon: LifeBuoy,
                      children: [
                        { id: 'it', label: 'IT' },
                        { id: 'hr', label: 'HR' },
                        { id: 'marketing', label: 'Marketing' },
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
                                        { id: 'data', label: 'Data', icon: Database },
                                        { id: 'analytics', label: 'Analytics', icon: BarChart2 }
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
              {!isEffectiveCollapsed && <span onClick={() => setRoomsExpanded(!roomsExpanded)}>Private Rooms</span>}
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
          {showSmartTools && (
            <div className="mb-4">
              <div
                className={`flex items-center ${isEffectiveCollapsed ? 'justify-center' : 'justify-between'} text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-2 group cursor-pointer hover:text-gray-300`}
                onClick={() => !isEffectiveCollapsed && setSmartToolsExpanded(!smartToolsExpanded)}
              >
                {!isEffectiveCollapsed && <span>Smart Tools</span>}
                {isEffectiveCollapsed && <span>SMT</span>}
                {!isEffectiveCollapsed && (
                  <div className="flex items-center space-x-1">

                    {smartToolsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                )}
              </div>

              {smartToolsExpanded && !isEffectiveCollapsed && (
                <div className="space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                  {permissions?.['smart-tools/mind-map'] && (
                    <div
                      className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('smart-tools/mind-map')}`}
                      onClick={() => handleNavClick('smart-tools/mind-map', 'Mind Mapping')}
                    >
                      <BrainCircuit size={14} className="shrink-0" />
                      <span>Mind Mapping</span>
                    </div>
                  )}
                  {permissions?.['smart-tools/dashboard'] && (
                    <div
                      className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('smart-tools/dashboard')}`}
                      onClick={() => handleNavClick('smart-tools/dashboard', 'Smart Dashboard')}
                    >
                      <LayoutDashboard size={14} className="shrink-0" />
                      <span>Smart Dashboard</span>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsed View for Smart Tools */}
              {isEffectiveCollapsed && (
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className={`p-2 rounded-md cursor-pointer hover:bg-clickup-hover hover:text-white ${activePage.startsWith('smart-tools') ? 'text-clickup-purple' : ''}`}
                    title="Smart Tools"
                  >
                    <BrainCircuit size={16} />
                  </div>
                </div>
              )}
            </div>
          )}



          <div className="h-[1px] bg-gray-800 mx-3 my-2 opacity-50"></div>

          {/* Market Place Section */}
          {showMarketplace && (
            <div className="mb-4">
              <div
                className={`flex items-center ${isEffectiveCollapsed ? 'justify-center' : 'justify-between'} text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-2 group cursor-pointer hover:text-gray-300`}
                onClick={() => setMarketplaceExpanded(!marketplaceExpanded)}
              >
                {!isEffectiveCollapsed && <span>Marketplace</span>}
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
                      title={isEffectiveCollapsed ? "Local Marketplace" : ""}
                    >
                      <MapPin size={14} className="shrink-0" />
                      {!isEffectiveCollapsed && <span>Local Marketplace</span>}
                    </div>
                  )}

                  {/* Foreign Marketplace */}
                  {permissions?.['marketplace/foreign'] && (
                    <div
                      className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('marketplace/foreign')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                      onClick={() => handleNavClick('marketplace/foreign', 'Foreign Marketplace')}
                      title={isEffectiveCollapsed ? "Foreign Marketplace" : ""}
                    >
                      <Store size={14} className="shrink-0" />
                      {!isEffectiveCollapsed && <span>Forigen Marketplace</span>}
                    </div>
                  )}

                  {/* Global Industries Master */}
                  <div
                    className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('marketplace/global-industries-master')} ${isEffectiveCollapsed ? 'justify-center' : ''}`}
                    onClick={() => handleNavClick('marketplace/global-industries-master', 'Global Industries Master')}
                    title={isEffectiveCollapsed ? "Global Industries Master" : ""}
                  >
                    <Globe size={14} className="shrink-0" />
                    {!isEffectiveCollapsed && <span>Global Industries Master</span>}
                  </div>
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
          {/* Space Button - Cosmos */}
          <div
            className={`h-9 transition-all duration-300 ease-out overflow-hidden flex items-center justify-center rounded-lg cursor-pointer group relative shrink-0 ${isEffectiveCollapsed ? 'w-full' : 'w-9 hover:w-24'} ${activePage === 'cosmos' ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-900 text-white' : 'bg-transparent hover:bg-gradient-to-br hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-purple-500 hover:text-white hover:shadow-lg hover:shadow-purple-500/40'}`}
            onClick={() => handleNavClick('cosmos', 'Entering Cosmos...')}
            title="Cosmos"
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-white/25 to-transparent z-20"></div>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="flex items-center justify-center w-9 h-9 shrink-0 relative z-10">
              <Orbit size={18} className="group-hover:rotate-180 transition-transform duration-700 drop-shadow-md" />
            </div>
            {!isEffectiveCollapsed && (
              <span className="text-[10px] font-bold tracking-tighter relative z-10 drop-shadow-sm text-shadow-sm whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-[60px] opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out">
                Cosmos
              </span>
            )}
          </div>

          {/* Tower Game Button */}
          <div
            className={`h-9 transition-all duration-300 ease-out overflow-hidden flex items-center justify-center rounded-lg cursor-pointer group relative shrink-0 ${isEffectiveCollapsed ? 'w-full' : 'w-9 hover:w-24'} ${activePage === 'tower-game' ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white shadow-orange-500/30 ring-2 ring-orange-400 ring-offset-1 ring-offset-gray-900' : 'bg-transparent hover:bg-gradient-to-br hover:from-amber-500 hover:via-orange-500 hover:to-red-500 text-orange-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/40'}`}
            onClick={() => handleNavClick('tower-game', 'Enter Tower Game')}
            title="Tower Game"
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-amber-400/20 to-transparent z-20"></div>
            <div className={`absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${activePage === 'tower-game' ? 'animate-pulse' : ''}`}></div>

            <div className="flex items-center justify-center w-9 h-9 shrink-0 relative z-10">
              <Castle size={18} className={`transition-transform duration-300 group-hover:scale-110 drop-shadow-md ${activePage === 'tower-game' ? 'animate-bounce-subtle' : ''}`} />
            </div>
            {!isEffectiveCollapsed && (
              <span className="text-[10px] font-bold tracking-tighter relative z-10 drop-shadow-sm whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-[60px] opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out">
                Tower
              </span>
            )}
          </div>

          {/* River Raid Button */}
          <div
            className={`h-9 transition-all duration-300 ease-out overflow-hidden flex items-center justify-center rounded-lg cursor-pointer group relative shrink-0 ${isEffectiveCollapsed ? 'w-full' : 'w-9 hover:w-24'} ${activePage === 'river-raid' ? 'bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-600 text-white shadow-cyan-400/50 ring-2 ring-cyan-400 ring-offset-1 ring-offset-gray-900' : 'bg-transparent hover:bg-gradient-to-br hover:from-cyan-500 hover:via-blue-500 hover:to-blue-600 text-cyan-500 hover:text-white hover:shadow-lg hover:shadow-cyan-500/40'}`}
            onClick={() => handleNavClick('river-raid', 'Enter River Raid')}
            title="River Raid"
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent z-20"></div>
            <div className={`absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${activePage === 'river-raid' ? 'animate-pulse' : ''}`}></div>

            <div className="flex items-center justify-center w-9 h-9 shrink-0 relative z-10">
              <Gamepad2 size={18} className={`transition-transform duration-300 group-hover:rotate-12 drop-shadow-md ${activePage === 'river-raid' ? 'animate-bounce-subtle' : ''}`} />
            </div>
            {!isEffectiveCollapsed && (
              <span className="text-[10px] font-bold tracking-tighter relative z-10 drop-shadow-sm whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-[60px] opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out">
                Raid
              </span>
            )}
          </div>



          {/* Solitaire Button */}
          <div
            className={`h-9 transition-all duration-300 ease-out overflow-hidden flex items-center justify-center rounded-lg cursor-pointer group relative shrink-0 ${isEffectiveCollapsed ? 'w-full' : 'w-9 hover:w-24'} ${activePage === 'solitaire' ? 'bg-gradient-to-br from-red-500 via-rose-500 to-rose-600 text-white shadow-red-400/50 ring-2 ring-red-400 ring-offset-1 ring-offset-gray-900' : 'bg-transparent hover:bg-gradient-to-br hover:from-red-500 hover:via-rose-500 hover:to-rose-600 text-rose-500 hover:text-white hover:shadow-lg hover:shadow-red-500/40'}`}
            onClick={() => handleNavClick('solitaire', 'Enter Solitaire')}
            title="Solitaire"
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-red-400/30 to-transparent z-20"></div>
            <div className={`absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${activePage === 'solitaire' ? 'animate-pulse' : ''}`}></div>

            <div className="flex items-center justify-center w-9 h-9 shrink-0 relative z-10">
              <Club size={18} className={`transition-transform duration-300 group-hover:rotate-12 drop-shadow-md ${activePage === 'solitaire' ? 'animate-bounce-subtle' : ''}`} />
            </div>
            {!isEffectiveCollapsed && (
              <span className="text-[10px] font-bold tracking-tighter relative z-10 drop-shadow-sm whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-[60px] opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out">
                Solitaire
              </span>
            )}
          </div>
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
