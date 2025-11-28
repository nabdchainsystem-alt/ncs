import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, PlusCircle, HelpCircle, Bell, CheckCircle2, Calendar, Video, Clock, FileText, Menu, Command, LogOut, Zap } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { User } from '../types/shared';

import { useNavigation } from '../contexts/NavigationContext';
import { useUI } from '../contexts/UIContext';

interface TopBarProps {
  user: User | null;
  onLogout?: () => void;
  onActivate?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ user, onLogout, onActivate }) => {
  const { setBrainOpen } = useUI();
  const onOpenBrain = () => setBrainOpen(true);
  const { showToast } = useToast();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="h-12 bg-clickup-sidebar flex items-center justify-between px-4 flex-shrink-0 z-40 text-gray-300 shadow-md select-none">

      {/* LEFT: Logo */}
      <div className="flex items-center w-[280px] shrink-0">
        <div className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition-opacity group">
          <img src="/nabd_logo_icon.png" alt="Icon" className="w-8 h-8 rounded-lg shadow-lg shadow-brand-primary/20 group-hover:shadow-brand-primary/40 transition-all" />
          <span className="font-bold text-white tracking-tight hidden md:block group-hover:text-brand-accent transition-colors">NABD Chain System</span>
        </div>
      </div>

      {/* CENTER: Search Bar */}
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

      {/* RIGHT: Actions */}
      <div className="flex items-center justify-end w-[280px] shrink-0 space-x-1 md:space-x-3">



        {/* Profile */}
        <div className="relative" ref={profileRef}>
          {user ? (
            <div
              className="ml-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:border-white transition-all shadow-md ring-2 ring-transparent hover:ring-gray-500/50 bg-gray-900 hover:bg-black border border-gray-700 overflow-hidden"
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
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-clickup-purple hover:text-white flex items-center space-x-2 transition-colors"
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

export default TopBar;