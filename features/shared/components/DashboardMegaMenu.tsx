import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, LayoutDashboard, Activity } from 'lucide-react';

interface DashboardMegaMenuProps {
    isOpen: boolean;
    categories: Record<string, Record<string, any[]>>;
    onSelectModule: (moduleName: string, reports: any[]) => void;
    onClose: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    parentRef: React.RefObject<HTMLDivElement>;
}

const DashboardMegaMenu: React.FC<DashboardMegaMenuProps> = ({ isOpen, categories, onSelectModule, onClose, onMouseEnter, onMouseLeave, parentRef }) => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const categoryKeys = Object.keys(categories);

    // Set first category as active by default when opening
    useEffect(() => {
        if (isOpen && categoryKeys.length > 0 && !activeCategory) {
            setActiveCategory(categoryKeys[0]);
        }
    }, [isOpen, categoryKeys, activeCategory]);

    // Calculate position based on parent ref
    useEffect(() => {
        if (isOpen && parentRef.current) {
            const rect = parentRef.current.getBoundingClientRect();

            // Basic positioning
            let top = rect.top - 20;
            let left = rect.right; // Remove gap to ensure bridge

            // Viewport constraints
            const menuHeight = 600;
            const menuWidth = 900;
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Check bottom overflow
            if (top + menuHeight > viewportHeight - 20) {
                top = Math.max(20, viewportHeight - menuHeight - 20); // Align to bottom with padding
            }

            // Check right overflow (unlikely but safe)
            if (left + menuWidth > viewportWidth - 20) {
                left = Math.max(20, viewportWidth - menuWidth - 20);
            }

            setPosition({ top, left });
        }
    }, [isOpen, parentRef]);

    const menuContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed z-[9999] flex overflow-hidden bg-white/80 backdrop-blur-3xl border border-white/40 rounded-3xl shadow-2xl ring-1 ring-black/5"
                    style={{
                        top: position.top,
                        left: position.left,
                        width: '900px',
                        height: '600px',
                        maxWidth: '90vw',
                        maxHeight: '90vh'
                    }}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                >
                    {/* Left Sidebar: Categories */}
                    <div className="w-1/3 bg-white/50 border-r border-gray-100/50 p-4 overflow-y-auto backdrop-blur-sm no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style>{`
                            .no-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                        <div className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Categories
                        </div>
                        <div className="space-y-1">
                            {categoryKeys.map((category) => (
                                <button
                                    key={category}
                                    className={`w-full text-left px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${activeCategory === category
                                        ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/10 ring-1 ring-black/5'
                                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                                        }`}
                                    onMouseEnter={() => setActiveCategory(category)}
                                >
                                    <span className="relative z-10 truncate">{category}</span>
                                    {activeCategory === category && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-2xl"
                                        />
                                    )}
                                    {activeCategory === category && (
                                        <ChevronRight size={16} className="text-blue-500 relative z-10" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Content: Modules */}
                    <div className="w-2/3 p-8 bg-white/30 overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-bold text-gray-800 flex items-center tracking-tight">
                                {activeCategory && (
                                    <>
                                        <div className="p-2 bg-blue-100/50 rounded-xl mr-3 text-blue-600">
                                            <LayoutDashboard size={24} />
                                        </div>
                                        {activeCategory}
                                    </>
                                )}
                            </h3>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                                {activeCategory ? Object.keys(categories[activeCategory]).length : 0} Modules Available
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            {activeCategory && Object.entries(categories[activeCategory]).map(([moduleName, reports], index) => (
                                <motion.button
                                    key={moduleName}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.02, y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex flex-col items-start p-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm hover:border-blue-200/50 transition-all duration-300 group text-left relative overflow-hidden"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectModule(moduleName, reports);
                                    }}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <ChevronRight size={20} className="text-blue-500" />
                                    </div>

                                    <div className="flex items-center justify-between w-full mb-3">
                                        <div className="p-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 rounded-xl group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                            <Activity size={20} />
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-gray-800 mb-1.5 text-lg group-hover:text-blue-600 transition-colors">
                                        {moduleName}
                                    </h4>
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                        Includes {reports.length} reports like "{reports[0]["Report Title"]}"...
                                    </p>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return ReactDOM.createPortal(menuContent, document.body);
};

export default DashboardMegaMenu;
