import React, { useState, useMemo } from 'react';
import { X, Search, LayoutGrid, List as ListIcon, Filter, ChevronRight, BarChart2, PieChart, Activity, Table } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import reportsData from '../../../data/reports/procurements_reports.json';
import ReportCard from './ReportCard';

interface AddReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddReport?: (report: any) => void;
}

const AddReportModal: React.FC<AddReportModalProps> = ({ isOpen, onClose, onAddReport }) => {
    const [selectedFilters, setSelectedFilters] = useState<{
        category: string[];
        module: string[];
        chartType: string[];
    }>({
        category: [],
        module: [],
        chartType: []
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'categories' | 'modules' | 'types'>('categories');

    // Extract unique values for filters
    const filterOptions = useMemo(() => {
        const categories = new Set<string>();
        const modules = new Set<string>();
        const chartTypes = new Set<string>();

        reportsData.forEach(r => {
            if (r["Category 1 (Detailed)"]) categories.add(r["Category 1 (Detailed)"]);
            if (r["Module (Category 2)"]) modules.add(r["Module (Category 2)"]);
            if (r["Chart Type (ECharts)"]) chartTypes.add(r["Chart Type (ECharts)"]);
        });

        return {
            categories: Array.from(categories).sort(),
            modules: Array.from(modules).sort(),
            chartTypes: Array.from(chartTypes).sort()
        };
    }, []);

    // Toggle filter selection
    const toggleFilter = (type: keyof typeof selectedFilters, value: string) => {
        setSelectedFilters(prev => {
            const current = prev[type];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [type]: updated };
        });
    };

    // Filter reports
    const filteredReports = useMemo(() => {
        return reportsData.filter(report => {
            const matchesCategory = selectedFilters.category.length === 0 || selectedFilters.category.includes(report["Category 1 (Detailed)"]);
            const matchesModule = selectedFilters.module.length === 0 || selectedFilters.module.includes(report["Module (Category 2)"]);
            const matchesChartType = selectedFilters.chartType.length === 0 || selectedFilters.chartType.includes(report["Chart Type (ECharts)"]);

            const matchesSearch = report["Report Title"].toLowerCase().includes(searchQuery.toLowerCase()) ||
                report["Module (Category 2)"].toLowerCase().includes(searchQuery.toLowerCase());

            return matchesCategory && matchesModule && matchesChartType && matchesSearch;
        });
    }, [selectedFilters, searchQuery]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-7xl h-[85vh] flex flex-col overflow-hidden border border-white/50 ring-1 ring-black/5"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200/50 bg-white/50 backdrop-blur-md">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Add Report</h2>
                                <p className="text-sm text-gray-500 mt-1">Select a report to add to your dashboard</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search reports..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2.5 bg-gray-100/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all w-64"
                                    />
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Sidebar - Advanced Filters */}
                            <div className="w-80 border-r border-gray-200/50 bg-gray-50/50 flex-shrink-0 flex flex-col backdrop-blur-sm">
                                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar h-full">

                                    {/* Categories Filter */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                                            Categories
                                            {selectedFilters.category.length > 0 && (
                                                <button
                                                    onClick={() => setSelectedFilters(prev => ({ ...prev, category: [] }))}
                                                    className="text-[10px] text-blue-600 hover:underline capitalize"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </h3>
                                        <div className="space-y-1.5">
                                            {filterOptions.categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => toggleFilter('category', cat)}
                                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group ${selectedFilters.category.includes(cat)
                                                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                                                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <span className="truncate">{cat}</span>
                                                    {selectedFilters.category.includes(cat) && (
                                                        <motion.div layoutId="activeFilter" className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Modules Filter */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                                            Modules
                                            {selectedFilters.module.length > 0 && (
                                                <button
                                                    onClick={() => setSelectedFilters(prev => ({ ...prev, module: [] }))}
                                                    className="text-[10px] text-blue-600 hover:underline capitalize"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </h3>
                                        <div className="space-y-1.5">
                                            {filterOptions.modules.map(mod => (
                                                <button
                                                    key={mod}
                                                    onClick={() => toggleFilter('module', mod)}
                                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group ${selectedFilters.module.includes(mod)
                                                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                                                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <span className="truncate">{mod}</span>
                                                    {selectedFilters.module.includes(mod) && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content - Reports Grid */}
                            <div className="flex-1 bg-white/30 p-8 overflow-y-auto custom-scrollbar">
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {filteredReports.length} Reports Found
                                    </h3>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex bg-gray-100/50 p-1 rounded-lg">
                                            <button
                                                onClick={() => setActiveTab('categories')}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'categories' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                By Category
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('modules')}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'modules' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                By Module
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('types')}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'types' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                All Reports
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {activeTab === 'types' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredReports.map((report, index) => (
                                            <motion.div
                                                key={report.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <ReportCard
                                                    report={report}
                                                    onAdd={() => onAddReport?.(report)}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {Object.entries(
                                            filteredReports.reduce((acc, report) => {
                                                const key = activeTab === 'categories'
                                                    ? report["Category 1 (Detailed)"]
                                                    : report["Module (Category 2)"];
                                                if (!acc[key]) acc[key] = [];
                                                acc[key].push(report);
                                                return acc;
                                            }, {} as Record<string, typeof filteredReports>)
                                        ).sort((a, b) => a[0].localeCompare(b[0])).map(([group, reports]) => (
                                            <div key={group}>
                                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                                                    {group}
                                                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-[10px]">
                                                        {reports.length}
                                                    </span>
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {reports.map((report) => (
                                                        <ReportCard
                                                            key={report.id}
                                                            report={report}
                                                            onAdd={() => onAddReport?.(report)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {filteredReports.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                        <Search size={48} className="mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No reports found</p>
                                        <p className="text-sm">Try adjusting your filters or search query</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddReportModal;
