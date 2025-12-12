import React from 'react';
import { 
  Inbox, 
  Calendar, 
  Layers, 
  Star, 
  Settings, 
  ChevronRight, 
  Hash,
  Plus
} from 'lucide-react';
import { SidebarItem } from '../types';

interface SidebarProps {
  className?: string;
}

const NavItem: React.FC<{ item: SidebarItem }> = ({ item }) => (
  <button 
    className={`
      w-full flex items-center gap-3 px-3 py-1.5 text-sm transition-all duration-200 rounded-md
      group relative
      ${item.active 
        ? 'bg-stone-200/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 font-medium' 
        : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900/50 hover:text-stone-900 dark:hover:text-stone-200'
      }
    `}
  >
    <item.icon 
      size={16} 
      strokeWidth={1.5} 
      className={`${item.active ? 'text-stone-800 dark:text-stone-200' : 'text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300'}`} 
    />
    <span className="font-sans flex-1 text-start">{item.label}</span>
    {item.count !== undefined && (
      <span className="text-xs font-sans text-stone-400 dark:text-stone-600">{item.count}</span>
    )}
  </button>
);

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center justify-between px-3 mt-6 mb-2 group">
    <span className="text-[11px] font-sans font-semibold tracking-wider text-stone-400 dark:text-stone-500 uppercase">
      {label}
    </span>
    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
      <Plus size={14} />
    </button>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const mainNav: SidebarItem[] = [
    { icon: Inbox, label: 'Inbox', count: 4 },
    { icon: Star, label: 'Today', count: 2 },
    { icon: Calendar, label: 'Upcoming' },
    { icon: Layers, label: 'Projects', active: true },
  ];

  const projects: SidebarItem[] = [
    { icon: Hash, label: 'Q3 Marketing' },
    { icon: Hash, label: 'Website Redesign' },
    { icon: Hash, label: 'Hiring Pipeline' },
  ];

  return (
    <aside 
      className={`
        flex flex-col h-full bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-xl 
        border-e border-stone-200 dark:border-stone-800 
        pt-4 pb-4 select-none ${className}
      `}
    >
      {/* User Profile / Workspace Switcher */}
      <div className="px-3 mb-6">
        <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/50 cursor-pointer transition-colors">
          <div className="w-5 h-5 rounded bg-stone-800 dark:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center justify-center text-xs font-serif font-bold">
            J
          </div>
          <span className="font-serif text-sm font-medium truncate text-stone-800 dark:text-stone-200">Journal Workspace</span>
          <ChevronRight size={14} className="ms-auto text-stone-400" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {mainNav.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}

        <SectionLabel label="Favorites" />
        <NavItem item={{ icon: Hash, label: 'Design System' }} />
        
        <SectionLabel label="Projects" />
        {projects.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}
      </nav>

      <div className="px-2 mt-auto pt-2 border-t border-stone-200 dark:border-stone-800">
         <NavItem item={{ icon: Settings, label: 'Settings' }} />
      </div>
    </aside>
  );
};