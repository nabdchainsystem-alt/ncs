import React, { useState, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { ProjectTable } from './components/ProjectTable';
import { Moon, Sun } from 'lucide-react';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-50 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 transition-colors duration-300">
      
      {/* Main Content Area - The "Paper" */}
      {/* Changed margins to md:m-2 to center the paper on the desk since sidebar is gone */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-stone-900 relative shadow-2xl shadow-stone-200/50 dark:shadow-black/50 z-10 m-0 md:m-2 md:rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
        
        {/* Top Header / Toolbar */}
        <header className="flex-shrink-0 z-30">
          <Toolbar />
        </header>

        {/* Content View (Table/Dashboard) */}
        <section className="flex-1 flex flex-col min-h-0 relative">
          <ProjectTable />
        </section>

        {/* Theme Toggle (Floating for easy access in demo) */}
        <button 
          onClick={toggleTheme}
          className="absolute bottom-6 right-6 p-3 rounded-full bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-900 shadow-lg hover:scale-105 transition-transform z-50 opacity-50 hover:opacity-100"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

      </main>
    </div>
  );
};

export default App;