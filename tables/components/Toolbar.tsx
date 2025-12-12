import React from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  User, 
  Layers, 
  GitBranch,
  Settings2
} from 'lucide-react';

export const Toolbar: React.FC = () => {
  return (
    <div className="flex flex-col border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      {/* Main Toolbar Row */}
      <div className="flex items-center h-14 px-5 gap-3">
        {/* Left Side: View Controls */}
        <div className="flex items-center gap-2">
          <button className="group flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-medium text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-sm transition-all">
            <Layers size={14} className="text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300" />
            <span>Group: None</span>
          </button>

          <button className="group flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-medium text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-sm transition-all">
            <GitBranch size={14} className="text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300" />
            <span>Subtasks</span>
          </button>
        </div>

        <div className="flex-1" />

        {/* Right Side: Filters & Search */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors">
            <Filter size={14} strokeWidth={2} />
            Filter
          </button>
          
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors">
            <CheckCircle2 size={14} strokeWidth={2} />
            Closed
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors">
            <User size={14} strokeWidth={2} />
            Assignee
          </button>

          {/* User Avatar Circle (M) */}
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-sans font-bold shadow-sm ring-2 ring-white dark:ring-stone-900 ms-1">
            M
          </div>

          <div className="h-4 w-px bg-stone-200 dark:bg-stone-700 mx-1"></div>

          {/* Search Input */}
          <div className="relative group">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-600 dark:group-focus-within:text-stone-300 transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-48 py-1.5 ps-8 pe-3 text-xs font-sans bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-300 dark:focus:ring-stone-600 focus:bg-white dark:focus:bg-stone-800 transition-all placeholder:text-stone-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};