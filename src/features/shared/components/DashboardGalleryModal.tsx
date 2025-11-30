import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, LayoutGrid, List, ChevronRight, Layers, Box, FolderOpen } from 'lucide-react';
import AnimatedChartThumbnail from '../../shared/components/AnimatedChartThumbnail';

interface DashboardGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Record<string, Record<string, any[]>>;
    modules?: Record<string, any[]>;
    layers?: Record<string, Record<string, any[]>>;
    onSelectModule: (moduleName: string, reports: any[]) => void;
}

const ITEMS_PER_PAGE = 24;

const DashboardGalleryModal: React.FC<DashboardGalleryModalProps> = ({ isOpen, onClose, categories, modules, layers, onSelectModule }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'categories' | 'modules' | 'layers'>('categories');
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    // Reset visible count when tab or filter changes
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [activeTab, selectedFilter, searchQuery]);

    // Reset filter when tab changes
    const handleTabChange = (tab: 'categories' | 'modules' | 'layers') => {
        setActiveTab(tab);
        setSelectedFilter(null);
    };

    const categoryKeys = useMemo(() => Object.keys(categories).sort(), [categories]);
    const moduleKeys = useMemo(() => modules ? Object.keys(modules).sort() : [], [modules]);
    const layerKeys = useMemo(() => layers ? Object.keys(layers).sort() : [], [layers]);

    // Flatten items based on active tab
    const allItems = useMemo(() => {
        let items: { name: string; tag: string; reports: any[] }[] = [];

        if (activeTab === 'categories') {
            Object.entries(categories).forEach(([catName, catModules]) => {
                if (selectedFilter && catName !== selectedFilter) return;
                Object.entries(catModules).forEach(([modName, reports]) => {
                    items.push({
                        name: modName,
                        tag: catName,
                        reports: reports
                    });
                });
            });
        } else if (activeTab === 'modules') {
            if (modules) {
                Object.entries(modules).forEach(([modName, reports]) => {
                    if (selectedFilter && modName !== selectedFilter) return;
                    items.push({
                        name: modName,
                        tag: 'Module',
                        reports: reports
                    });
                });
            }
        } else if (activeTab === 'layers') {
            if (layers) {
                Object.entries(layers).forEach(([layerName, layerModules]) => {
                    if (selectedFilter && layerName !== selectedFilter) return;
                    Object.entries(layerModules).forEach(([modName, reports]) => {
                        items.push({
                            name: modName,
                            tag: layerName,
                            reports: reports
                        });
                    });
                });
            }
        }

        // Apply Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.tag.toLowerCase().includes(query)
            );
        }

        return items;
    }, [categories, modules, layers, activeTab, selectedFilter, searchQuery]);

    const displayItems = useMemo(() => {
        return allItems.slice(0, visibleCount);
    }, [allItems, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, allItems.length));
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[1400px] h-[85vh] flex overflow-hidden border border-gray-200"
                    >
                        {/* Sidebar */}
                        <div className="w-72 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-100">
                                <button
                                    onClick={() => handleTabChange('categories')}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Categories
                                </button>
                                <button
                                    onClick={() => handleTabChange('modules')}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'modules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Modules
                                </button>
                                <button
                                    onClick={() => handleTabChange('layers')}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'layers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Layers
                                </button>
                            </div>

                            {/* Filter List */}
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                <button
                                    onClick={() => setSelectedFilter(null)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${selectedFilter === null
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <LayoutGrid size={16} className="mr-2" />
                                    All {activeTab === 'categories' ? 'Categories' : activeTab === 'modules' ? 'Modules' : 'Layers'}
                                </button>

                                {activeTab === 'categories' && categoryKeys.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedFilter(cat)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${selectedFilter === cat
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <FolderOpen size={16} className="mr-2 opacity-70" />
                                        <span className="truncate">{cat}</span>
                                    </button>
                                ))}

                                {activeTab === 'modules' && moduleKeys.map(mod => (
                                    <button
                                        key={mod}
                                        onClick={() => setSelectedFilter(mod)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${selectedFilter === mod
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Box size={16} className="mr-2 opacity-70" />
                                        <span className="truncate">{mod}</span>
                                    </button>
                                ))}

                                {activeTab === 'layers' && layerKeys.map(layer => (
                                    <button
                                        key={layer}
                                        onClick={() => setSelectedFilter(layer)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${selectedFilter === layer
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Layers size={16} className="mr-2 opacity-70" />
                                        <span className="truncate">{layer}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Total Count Footer */}
                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                    Total Reports
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {allItems.reduce((acc, item) => acc + item.reports.length, 0).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col bg-gray-50/30">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between gap-4">
                                <div className="flex-1 max-w-md relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder={`Search ${activeTab}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="font-medium text-gray-900 mr-1">{allItems.length}</span>
                                        Dashboards
                                    </div>
                                    <div className="h-6 w-px bg-gray-200"></div>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <LayoutGrid size={18} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <List size={18} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Grid/List View */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50" id="gallery-scroll-container">
                                {displayItems.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <Search size={48} className="mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No dashboards found</p>
                                        <p className="text-sm">Try adjusting your search or filter</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-2"}>
                                            {displayItems.map((item, idx) => (
                                                <motion.div
                                                    key={`${item.name}-${idx}`}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                                                    className={`bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer group transition-all duration-300 ${viewMode === 'list' ? 'flex items-center p-3 hover:bg-blue-50/50' : 'flex flex-col h-full shadow-sm hover:border-blue-300'
                                                        }`}
                                                    onClick={() => {
                                                        onSelectModule(item.name, item.reports);
                                                        onClose();
                                                    }}
                                                    onMouseEnter={() => setHoveredItem(`${item.name}-${idx}`)}
                                                    onMouseLeave={() => setHoveredItem(null)}
                                                >
                                                    {viewMode === 'grid' && (
                                                        <div className="h-48 p-6 flex items-center justify-center border-b border-gray-100 relative overflow-hidden bg-white">
                                                            <div className="w-full h-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                                                                {/* Enhanced Chart Preview - Wireframe Style - Animate only on hover */}
                                                                <div className="w-full h-full opacity-80 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300">
                                                                    <AnimatedChartThumbnail
                                                                        type={item.reports[0]?.["Chart Type (ECharts)"] || 'Bar Chart'}
                                                                        animate={hoveredItem === `${item.name}-${idx}`}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="absolute top-3 right-3 bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                                                {item.reports[0]?.["Chart Type (ECharts)"] || 'CHART'}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={viewMode === 'list' ? "flex-1 ml-4" : "p-5 flex-1 flex flex-col"}>
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm leading-snug">
                                                                {item.name}
                                                            </h3>
                                                            {viewMode === 'list' && (
                                                                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500 ml-2 whitespace-nowrap">
                                                                    {item.tag}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {viewMode === 'grid' && (
                                                            <>
                                                                <div className="mt-auto pt-4 flex items-center justify-between">
                                                                    <div className="flex items-center text-xs text-gray-400 font-medium">
                                                                        <Layers size={12} className="mr-1.5" />
                                                                        {item.tag}
                                                                    </div>
                                                                    <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Load More Trigger */}
                                        {visibleCount < allItems.length && (
                                            <div className="mt-8 flex justify-center">
                                                <button
                                                    onClick={handleLoadMore}
                                                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                                >
                                                    Load More ({allItems.length - visibleCount} remaining)
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default DashboardGalleryModal;
