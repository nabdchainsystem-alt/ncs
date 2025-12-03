import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, PlusCircle, HelpCircle, Bell, CheckCircle2, Calendar, Video, Clock, FileText, Menu, Command, LogOut, Zap, Grip, User, Timer, NotebookPen, AlarmClock, Hash, FilePlus, PenTool, Users, BarChart3, Palette, Layout, BrainCircuit } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { User as UserType } from '../types/shared';
import { getCompanyName, getLogoUrl } from '../utils/config';

import { useNavigation } from '../contexts/NavigationContext';
import { useUI } from '../contexts/UIContext';

import { CalendarModal } from '../ui/CalendarModal';
import { NotepadModal } from '../ui/NotepadModal';

import { FloatingNavigation } from './FloatingNavigation';

interface TopBarProps {
  user: UserType | null;
  onLogout?: () => void;
  onActivate?: () => void;
  currentStyle?: 'main' | 'floating';
  onStyleChange?: (style: 'main' | 'floating') => void;
  className?: string;
  isSystemGenerated?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ user, onLogout, onActivate, currentStyle = 'main', onStyleChange, className = '', isSystemGenerated = false }) => {
  const { setBrainOpen, appStyle, setAppStyle, theme, setTheme } = useUI();
  const { activePage, setActivePage } = useNavigation();
  const onOpenBrain = () => setBrainOpen(true);

  // Use context state if available, otherwise fall back to props (for backward compatibility)
  const effectiveStyle = appStyle || currentStyle;
  const handleStyleChange = (style: 'main' | 'floating') => {
    setAppStyle(style);
    if (onStyleChange) onStyleChange(style);
  };
  const { showToast } = useToast();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const appsMenuRef = useRef<HTMLDivElement>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (appsMenuRef.current && !appsMenuRef.current.contains(event.target as Node)) {
        setIsAppsMenuOpen(false);
      }
      if (styleMenuRef.current && !styleMenuRef.current.contains(event.target as Node)) {
        setIsStyleMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`h-12 bg-clickup-sidebar flex items-center justify-between px-4 flex-shrink-0 z-40 text-gray-300 shadow-md select-none overflow-visible ${className}`}>
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
      <NotepadModal isOpen={isNotepadOpen} onClose={() => setIsNotepadOpen(false)} />

      {/* LEFT: Logo */}
      <div className="flex items-center w-[280px] shrink-0">
        <div className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition-opacity group">
          {getLogoUrl() ? (
            <img src={getLogoUrl()!} alt={getCompanyName()} className="w-8 h-8 object-contain" />
          ) : (
            <img src="/nabd_logo_icon.png" alt="Icon" className="w-8 h-8 rounded-lg shadow-lg shadow-brand-primary/20 group-hover:shadow-brand-primary/40 transition-all" />
          )}
          <span className="font-bold text-white tracking-tight hidden md:block group-hover:text-brand-accent transition-colors">{getCompanyName()}</span>
        </div>
      </div>

      {/* CENTER: Search Bar or Floating Navigation */}
      {effectiveStyle !== 'floating' && (
        <div className="flex-1 flex justify-center px-4 min-w-0">
          <div className="w-full max-w-xl relative group">
            <div className="flex items-center bg-[#3E4147] hover:bg-[#4B4E55] transition-colors rounded-lg px-3 py-1.5 cursor-text border border-transparent group-focus-within:border-brand-primary/50 group-focus-within:bg-[#2B2D31] h-8 shadow-inner">
              <Search size={14} className="text-gray-400 group-focus-within:text-brand-primary mr-2 transition-colors" />
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent border-none outline-none text-sm text-gray-200 placeholder-gray-400 w-full group-focus-within:text-white"
                onKeyDown={(e) => e.key === 'Enter' && showToast('Global Search...', 'info')}
              />
              <div className="flex items-center space-x-1 ml-2">
                <div className="hidden md:flex items-center space-x-1 bg-gray-600/50 px-1.5 py-0.5 rounded text-[10px] text-gray-300 border border-gray-500/30 shadow-sm">
                  <Command size={10} />
                  <span>K</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {effectiveStyle === 'floating' && (
        <div className="flex-1 flex justify-center px-4 min-w-0 h-full">
          <FloatingNavigation onNavigate={(page) => setActivePage(page)} activePage={activePage} />
        </div>
      )}

      {/* RIGHT: Actions */}
      <div className={`flex items-center justify-end shrink-0 gap-3 w-[280px]`}>

        {/* Vision Link */}
        <button
          className="hidden md:flex items-center justify-center w-8 h-8 text-white hover:bg-white/10 rounded-md transition-colors"
          onClick={() => setActivePage('vision')}
          title="Vision"
        >
          <BrainCircuit size={20} className="text-purple-400" />
        </button>

        <div className="relative" ref={appsMenuRef}>
          <button
            className={`hidden md:flex items-center justify-center w-8 h-8 text-white hover:bg-white/10 rounded-md transition-colors ${isAppsMenuOpen ? 'bg-white/10' : ''}`}
            onClick={() => setIsAppsMenuOpen(!isAppsMenuOpen)}
          >
            <Grip size={20} />
          </button>

          {isAppsMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-[320px] bg-white rounded-xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 border border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'My Profile', icon: User, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'My Work', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Calendar', icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50' },
                  { label: 'Track Time', icon: Timer, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Notepad', icon: NotebookPen, color: 'text-orange-600', bg: 'bg-orange-50' },
                  { label: 'Clips', icon: Video, color: 'text-red-600', bg: 'bg-red-50' },
                  { label: 'Reminder', icon: AlarmClock, color: 'text-gray-700', bg: 'bg-gray-100' },
                  { label: 'Chat', icon: Hash, color: 'text-gray-700', bg: 'bg-gray-100' },
                  { label: 'New Doc', icon: FilePlus, color: 'text-gray-700', bg: 'bg-gray-100' },
                  { label: 'Whiteboard', icon: PenTool, color: 'text-gray-700', bg: 'bg-gray-100' },
                  { label: 'People', icon: Users, color: 'text-gray-700', bg: 'bg-gray-100' },
                  { label: 'Dashboard', icon: BarChart3, color: 'text-gray-700', bg: 'bg-gray-100' },
                  { label: 'AI Notetaker', icon: Sparkles, color: 'text-gray-700', bg: 'bg-gray-100' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center gap-2 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => {
                      if (item.label === 'Calendar') {
                        setIsCalendarOpen(true);
                      } else if (item.label === 'Notepad') {
                        setIsNotepadOpen(true);
                      } else {
                        showToast(`Opened ${item.label}`, 'info');
                      }
                      setIsAppsMenuOpen(false);
                    }}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm group-hover:shadow-md transition-all ${item.bg}`}>
                      <item.icon size={24} className={item.color} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Style Switcher */}
        <div className="relative" ref={styleMenuRef}>
          <button
            className={`flex items-center justify-center w-8 h-8 text-white hover:bg-white/10 rounded-md transition-colors ${isStyleMenuOpen ? 'bg-white/10' : ''}`}
            onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
            title="Change Layout Style"
          >
            <Palette size={20} />
          </button>

          {isStyleMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#2a2e35] border border-gray-700 rounded-lg shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-gray-700/50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Interface Style</p>
              </div>
              <div className="py-1">
                <button
                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors ${effectiveStyle === 'main' ? 'bg-brand-primary/20 text-brand-primary' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                  onClick={() => {
                    handleStyleChange('main');
                    setIsStyleMenuOpen(false);
                  }}
                >
                  <Layout size={14} />
                  <span>NABD Main</span>
                  {effectiveStyle === 'main' && <CheckCircle2 size={12} className="ml-auto" />}
                </button>
                <button
                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors ${effectiveStyle === 'floating' ? 'bg-brand-primary/20 text-brand-primary' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                  onClick={() => {
                    handleStyleChange('floating');
                    setIsStyleMenuOpen(false);
                  }}
                >
                  <Sparkles size={14} />
                  <span>NABD Floating</span>
                  {effectiveStyle === 'floating' && <CheckCircle2 size={12} className="ml-auto" />}
                </button>
              </div>

              <div className="px-4 py-2 border-t border-b border-gray-700/50 mt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Color Theme</p>
              </div>
              <div className="py-1">
                <button
                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors ${theme === 'light' ? 'bg-brand-primary/20 text-brand-primary' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                  onClick={() => {
                    setTheme('light');
                    setIsStyleMenuOpen(false);
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-white border border-gray-400" />
                  <span>NABD Main</span>
                  {theme === 'light' && <CheckCircle2 size={12} className="ml-auto" />}
                </button>
                <button
                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors ${theme === 'nexus' ? 'bg-brand-primary/20 text-brand-primary' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                  onClick={() => {
                    setTheme('nexus');
                    setIsStyleMenuOpen(false);
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-[#0f1115] border border-gray-600" />
                  <span>NABD Nexus</span>
                  {theme === 'nexus' && <CheckCircle2 size={12} className="ml-auto" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          {user ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:border-white transition-all shadow-md ring-2 ring-transparent hover:ring-gray-500/50 bg-gray-900 hover:bg-black border border-gray-700 overflow-hidden"
              title={user.name}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.avatar
              )}
            </div>
          ) : (
            <div className="ml-2 w-8 h-8 rounded-full bg-gray-600 animate-pulse"></div>
          )}

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#2a2e35] border border-gray-700 rounded-lg shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-gray-700/50">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
              </div>
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center space-x-2 transition-colors"
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onActivate) onActivate();
                  }}
                >
                  <Zap size={14} className="text-yellow-400" />
                  <span>Activate</span>
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 flex items-center space-x-2 transition-colors"
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onLogout) onLogout();
                  }}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>

  );
};

export default React.memo(TopBar);