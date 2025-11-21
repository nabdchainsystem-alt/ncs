import React, { useState, useRef, useEffect } from 'react';
import {
  Home, Folder, ChevronRight, ChevronDown, Plus, Settings, Users, Inbox, Target,
  Download, LogOut, CreditCard, Code, ChevronsLeft, ChevronsRight, Trash2, Edit2, MoreHorizontal, Layout, BrainCircuit, Rocket, Waves,
  Building2, Truck, Briefcase, LifeBuoy, ShoppingCart, Warehouse, Ship, Calendar, Car, Store, MapPin,
  Database, BarChart2, Gamepad2
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { spaceService } from '../features/space/spaceService';
import { taskService } from '../features/tasks/taskService';
import { downloadProjectSource } from '../utils/projectDownloader';
import { Space } from '../types';

import { useNavigation } from '../contexts/NavigationContext';

interface SidebarProps {
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const { activePage, setActivePage: onNavigate, isImmersive } = useNavigation();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spacesExpanded, setSpacesExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar_spacesExpanded');
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
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loadingSpaces, setLoadingSpaces] = useState(true);

  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSpaces();
  }, []);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('sidebar_spacesExpanded', JSON.stringify(spacesExpanded));
  }, [spacesExpanded]);

  useEffect(() => {
    localStorage.setItem('sidebar_departmentsExpanded', JSON.stringify(departmentsExpanded));
  }, [departmentsExpanded]);

  useEffect(() => {
    localStorage.setItem('sidebar_supplyChainExpanded', JSON.stringify(supplyChainExpanded));
  }, [supplyChainExpanded]);

  useEffect(() => {
    localStorage.setItem('sidebar_expandedItems', JSON.stringify(expandedItems));
  }, [expandedItems]);

  const fetchSpaces = async () => {
    try {
      const data = await spaceService.getSpaces();
      setSpaces(data);
    } catch (e) {
      console.error("Failed to load spaces", e);
    } finally {
      setLoadingSpaces(false);
    }
  };

  const handleCreateSpace = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt("Enter Space Name:");
    if (name) {
      try {
        const newSpace = await spaceService.createSpace(name);
        setSpaces(prev => [...prev, newSpace]);
        showToast('Space created!', 'success');
        onNavigate(newSpace.id);
      } catch (err) {
        showToast('Failed to create space', 'error');
      }
    }
  };

  const handleDeleteSpace = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this space and all its tasks?")) {
      try {
        await spaceService.deleteSpace(id);
        setSpaces(prev => prev.filter(s => s.id !== id));
        if (activePage === id) onNavigate('home');
        showToast('Space deleted', 'success');
      } catch (err) {
        showToast('Failed to delete space', 'error');
      }
    }
  };

  const handleRenameSpace = async (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    const newName = prompt("Rename Space:", currentName);
    if (newName && newName !== currentName) {
      try {
        await spaceService.updateSpace(id, { name: newName });
        setSpaces(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
        showToast('Space renamed', 'success');
      } catch (err) {
        showToast('Failed to rename space', 'error');
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
        spaces: spaces
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
    return activePage === id
      ? 'bg-clickup-hover text-white font-medium'
      : 'hover:bg-clickup-hover hover:text-white';
  };

  const getIconClass = (id: string, defaultColor: string = '') => {
    return activePage === id ? 'text-clickup-purple' : (defaultColor || '');
  };

  return (
    <div
      className={`${isCollapsed ? 'w-16' : 'w-64'} bg-clickup-sidebar text-gray-400 flex flex-col h-[calc(100vh-3rem)] flex-shrink-0 select-none relative transition-all duration-300 z-50`}
    >

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 bg-clickup-sidebar border border-gray-700 rounded-full p-0.5 text-gray-400 hover:text-white hover:bg-gray-700 z-50 shadow-md transition-colors"
      >
        {isCollapsed ? <ChevronsRight size={12} /> : <ChevronsLeft size={12} />}
      </button>

      {/* Workspace Switcher / Settings Menu */}
      <div className="relative" ref={menuRef}>
        <div
          className={`p-3 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} cursor-pointer transition-colors group ${showWorkspaceMenu ? 'bg-clickup-hover' : 'hover:bg-clickup-hover'}`}
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:shadow transition-shadow shrink-0">
              G
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-gray-200 text-sm font-medium leading-tight group-hover:text-white transition-colors truncate">Gemini Corp</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <ChevronDown size={14} className={`text-gray-500 group-hover:text-gray-300 transition-all duration-200 ${showWorkspaceMenu ? 'rotate-180' : ''}`} />
          )}
        </div>

        {/* Dropdown Menu */}
        {showWorkspaceMenu && (
          <div className={`absolute top-full mt-1 bg-[#2a2e35] border border-gray-700 rounded-lg shadow-2xl z-50 py-1 animate-in slide-in-from-top-2 fade-in duration-150 overflow-hidden ${isCollapsed ? 'left-14 w-56' : 'left-2 right-2'}`}>
            <div className="px-3 py-2 border-b border-gray-700/50 mb-1">
              <p className="text-xs font-semibold text-white">Gemini Corp</p>
              <p className="text-[10px] text-gray-500">owner@example.com</p>
            </div>

            <div className="px-1 space-y-0.5">
              <button className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-clickup-purple hover:text-white rounded transition-colors text-left">
                <Settings size={14} />
                <span>Settings</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-clickup-purple hover:text-white rounded transition-colors text-left">
                <Users size={14} />
                <span>Members</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-clickup-purple hover:text-white rounded transition-colors text-left">
                <CreditCard size={14} />
                <span>Billing</span>
              </button>
            </div>

            <div className="h-[1px] bg-gray-700/50 mx-2 my-1.5"></div>

            <div className="px-1 space-y-0.5">
              <button
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-clickup-purple hover:text-white rounded transition-colors text-left"
                onClick={handleExport}
              >
                <Download size={14} />
                <span>Export Data (JSON)</span>
              </button>
              <button
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-clickup-purple hover:text-white rounded transition-colors text-left"
                onClick={handleDownloadSource}
              >
                <Code size={14} />
                <span>Download Source</span>
              </button>
              <button
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors text-left"
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {/* Quick Actions & Navigation */}
        <div className="px-2 py-1 space-y-0.5">


          {/* Home */}
          <div
            className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('home')} ${isCollapsed ? 'justify-center' : ''}`}
            onClick={() => handleNavClick('home', 'Navigated to Home')}
            title={isCollapsed ? "Home" : ""}
          >
            <Home size={16} className={`${getIconClass('home')} shrink-0`} />
            {!isCollapsed && <span>Home</span>}
          </div>

          {/* Inbox */}
          <div
            className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('inbox')} ${isCollapsed ? 'justify-center' : ''}`}
            onClick={() => handleNavClick('inbox', 'Navigated to Inbox')}
            title={isCollapsed ? "Inbox" : ""}
          >
            <Inbox size={16} className={`${activePage === 'inbox' ? 'text-blue-400' : ''} shrink-0`} />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between">
                <span>Inbox</span>
                <span className="bg-clickup-dark text-xs px-1.5 py-0.5 rounded text-gray-400 group-hover:text-white transition-colors">4</span>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-gray-800 mx-3 my-2 opacity-50"></div>

          {/* Departments Section */}
          <div
            className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors group ${['departments', 'supply-chain', 'operations', 'business', 'support'].some(p => activePage.startsWith(p)) ? 'bg-clickup-hover text-white' : 'hover:bg-clickup-hover hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
            onClick={() => !isCollapsed && setDepartmentsExpanded(!departmentsExpanded)}
            title={isCollapsed ? "Departments" : ""}
          >
            <Building2 size={16} className="shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between">
                <span>Departments</span>
                {departmentsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            )}
          </div>

          {/* Nested Departments */}
          {!isCollapsed && departmentsExpanded && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-700 pl-2">

              {/* Supply Chain Dropdown (Refactored for Nesting) */}
              <div>
                <div
                  className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer group ${activePage.startsWith('supply-chain') ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
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
                    ].map((item) => {
                      const itemPath = `supply-chain/${item.id}`;
                      const isItemExpanded = activePage.startsWith(itemPath) || (expandedItems[itemPath] !== undefined ? expandedItems[itemPath] : false);

                      return (
                        <div key={item.id}>
                          <div
                            className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer group ${activePage.startsWith(itemPath) ? 'text-blue-300' : 'text-gray-500 hover:text-gray-300'}`}
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
                                  className={`flex items-center px-2 py-1 rounded-md cursor-pointer ${activePage === `${itemPath}/${leaf.id}` ? 'text-clickup-purple bg-[#2a2e35]' : 'text-gray-500 hover:text-gray-300'}`}
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
              ].map((dept) => {
                const isDeptExpanded = activePage.startsWith(dept.id) || (expandedItems[dept.id] !== undefined ? expandedItems[dept.id] : false);

                return (
                  <div key={dept.id}>
                    <div
                      className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer group ${activePage.startsWith(dept.id) ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
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
                        {dept.children.map(sub => {
                          const subPath = `${dept.id}/${sub.id}`;
                          const isSubExpanded = activePage.startsWith(subPath) || (expandedItems[subPath] !== undefined ? expandedItems[subPath] : false);

                          return (
                            <div key={sub.id}>
                              <div
                                className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer group ${activePage.startsWith(subPath) ? 'text-blue-300' : 'text-gray-500 hover:text-gray-300'}`}
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
                                      className={`flex items-center px-2 py-1 rounded-md cursor-pointer ${activePage === `${subPath}/${leaf.id}` ? 'text-clickup-purple bg-[#2a2e35]' : 'text-gray-500 hover:text-gray-300'}`}
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
        </div>

        <div className="h-[1px] bg-gray-800 mx-3 my-1 opacity-50"></div>

        {/* Spaces Section (Dynamic) */}
        <div className="px-2 py-2">
          <div className="mb-4">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-2 hover:text-gray-300 cursor-pointer group h-6`}>
              {!isCollapsed && <span onClick={() => setSpacesExpanded(!spacesExpanded)}>Spaces</span>}
              {isCollapsed && <span className="text-[10px]">SPC</span>}

              {!isCollapsed && (
                <div className="flex items-center space-x-1">
                  <div
                    className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity cursor-pointer"
                    onClick={handleCreateSpace}
                    title="Create Space"
                  >
                    <Plus size={14} />
                  </div>
                  <div onClick={() => setSpacesExpanded(!spacesExpanded)}>
                    {spacesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </div>
              )}
            </div>

            {spacesExpanded && !loadingSpaces && (
              <div className="space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                {spaces.length === 0 && !isCollapsed && (
                  <div
                    className="p-3 border border-dashed border-gray-700 rounded text-center text-xs text-gray-500 hover:text-gray-400 hover:border-gray-600 cursor-pointer transition-colors"
                    onClick={handleCreateSpace}
                  >
                    + Create your first Space
                  </div>
                )}

                {spaces.map(space => (
                  <div key={space.id} className="group relative">
                    <div
                      className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass(space.id)} ${isCollapsed ? 'justify-center' : ''}`}
                      onClick={() => handleNavClick(space.id, `Viewing ${space.name}`)}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: space.color }}></div>
                      {!isCollapsed && (
                        <span className="flex-1 truncate font-medium">{space.name}</span>
                      )}

                      {!isCollapsed && (
                        <div className="hidden group-hover:flex items-center space-x-1">
                          <Edit2 size={10} className="text-gray-500 hover:text-white" onClick={(e) => handleRenameSpace(e, space.id, space.name)} />
                          <Trash2 size={10} className="text-gray-500 hover:text-red-400" onClick={(e) => handleDeleteSpace(e, space.id)} />
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
          <div className="mb-4">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-2 group`}>
              {!isCollapsed && <span>Smart Tools</span>}
              {isCollapsed && <span>SMT</span>}
            </div>
            <div
              className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('mind-map')} ${isCollapsed ? 'justify-center' : ''}`}
              onClick={() => handleNavClick('mind-map', 'Mind Mapping')}
              title={isCollapsed ? "Mind Mapping" : ""}
            >
              <BrainCircuit size={14} className="shrink-0" />
              {!isCollapsed && <span>Mind Mapping</span>}
            </div>
          </div>

          <div className="h-[1px] bg-gray-800 mx-3 my-2 opacity-50"></div>

          <div className="mb-4">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-2 group`}>
              {!isCollapsed && <span>Dashboards</span>}
              {isCollapsed && <span>DBD</span>}
              {!isCollapsed && <Plus size={14} className="cursor-pointer hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => showToast('New Dashboard', 'info')} />}
            </div>
            <div
              className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('overview')} ${isCollapsed ? 'justify-center' : ''}`}
              onClick={() => handleNavClick('overview', 'Dashboards Overview')}
              title={isCollapsed ? "Dashboards Overview" : ""}
            >
              <Layout size={14} className="shrink-0" />
              {!isCollapsed && <span>Overview</span>}
            </div>
            <div
              className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('goals')} ${isCollapsed ? 'justify-center' : ''}`}
              onClick={() => handleNavClick('goals', 'Goals Dashboard')}
              title={isCollapsed ? "Goals" : ""}
            >
              <Target size={14} className="shrink-0" />
              {!isCollapsed && <span>Goals</span>}
            </div>
          </div>

          <div className="h-[1px] bg-gray-800 mx-3 my-2 opacity-50"></div>

          {/* Market Place Section */}
          <div className="mb-4">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-2 group`}>
              {!isCollapsed && <span>Market Place</span>}
              {isCollapsed && <span>MKT</span>}
            </div>

            {/* Local Marketplace */}
            <div
              className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('marketplace/local')} ${isCollapsed ? 'justify-center' : ''}`}
              onClick={() => handleNavClick('marketplace/local', 'Local Marketplace')}
              title={isCollapsed ? "Local Marketplace" : ""}
            >
              <MapPin size={14} className="shrink-0" />
              {!isCollapsed && <span>Local Marketplace</span>}
            </div>

            {/* Foreign Marketplace */}
            <div
              className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${getItemClass('marketplace/foreign')} ${isCollapsed ? 'justify-center' : ''}`}
              onClick={() => handleNavClick('marketplace/foreign', 'Foreign Marketplace')}
              title={isCollapsed ? "Foreign Marketplace" : ""}
            >
              <Store size={14} className="shrink-0" />
              {!isCollapsed && <span>Forigen Marketplace</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Section */}
      <div className="p-3 border-t border-gray-800">
        <div
          className={`bg-gray-900 hover:bg-black border border-gray-800 rounded-md p-2 text-white flex items-center ${isCollapsed ? 'justify-center' : 'justify-center space-x-2'} cursor-pointer transition-all active:scale-95 group mb-2 shadow-md`}
          onClick={() => showToast('Invite dialog opened', 'info')}
          title="Invite Team"
        >
          <Users size={14} className="shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Invite Team</span>}
        </div>

        <div className={`flex ${isCollapsed ? 'flex-col space-y-2' : 'flex-row space-x-2'}`}>
          {/* Space Button (50%) */}
          <div
            className={`flex-1 bg-gray-900 hover:bg-black border border-gray-800 rounded-md p-2 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 group shadow-md`}
            onClick={() => handleNavClick('space', 'Entering Space...')}
            title="Space"
          >
            <Rocket size={14} className="shrink-0" />
            {!isCollapsed && <span className="text-xs font-bold tracking-wide ml-1">Space</span>}
          </div>

          {/* Ocean Button (50%) */}
          <div
            className={`flex-1 bg-gray-900 hover:bg-black border border-gray-800 rounded-md p-2 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 group shadow-md`}
            onClick={() => handleNavClick('ocean', 'Diving Deep...')}
            title="Deep Ocean"
          >
            <Waves size={14} className="shrink-0" />
            {!isCollapsed && <span className="text-xs font-bold tracking-wide ml-1">Ocean</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;