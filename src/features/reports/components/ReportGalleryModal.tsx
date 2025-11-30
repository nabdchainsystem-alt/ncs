import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, LayoutGrid, List, Info, ChevronRight, BarChart2, FileText, Target, Zap, Database, ChevronLeft, ChevronDown } from 'lucide-react';
import AnimatedChartThumbnail from '../../shared/components/AnimatedChartThumbnail';

interface ReportGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    reports: any[];
    categories: Record<string, any[]>;
    onSelectReport: (report: any) => void;
}

const ITEMS_PER_PAGE = 24;

const ReportGalleryModal: React.FC<ReportGalleryModalProps> = ({ isOpen, onClose, reports, categories, onSelectReport }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory]);

    const categoryKeys = useMemo(() => Object.keys(categories).sort(), [categories]);

    // Calculate Summary Stats
    const stats = useMemo(() => {
        const totalReports = reports.length;
        const categoryCounts = categoryKeys.map(cat => ({
            name: cat,
            count: categories[cat]?.length || 0
        })).sort((a, b) => b.count - a.count);

        return { totalReports, categoryCounts };
    }, [reports, categories, categoryKeys]);

    const filteredReports = useMemo(() => {
        let filtered = reports;

        if (selectedCategory) {
            filtered = categories[selectedCategory] || [];
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r["Report Title"].toLowerCase().includes(query) ||
                (r["Category 1 (Detailed)"] && r["Category 1 (Detailed)"].toLowerCase().includes(query)) ||
                (r["Module (Category 2)"] && r["Module (Category 2)"].toLowerCase().includes(query))
            );
        }

        return filtered;
    }, [reports, categories, selectedCategory, searchQuery]);

    // Group reports by Module for better organization
    const groupedReports = useMemo(() => {
        const groups: Record<string, any[]> = {};
        filteredReports.forEach(report => {
            const moduleName = report["Module (Category 2)"] || "Other";
            if (!groups[moduleName]) groups[moduleName] = [];
            groups[moduleName].push(report);
        });
        return groups;
    }, [filteredReports]);

    const moduleKeys = useMemo(() => Object.keys(groupedReports).sort(), [groupedReports]);

    // Pagination Logic (applied to flattened list for simplicity in grid view, or per module?)
    // For better UX, let's paginate the *modules* if grouped, or just paginate the flat list if not.
    // Actually, simple flat pagination is easiest and most performant for the grid.
    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredReports, currentPage]);

    const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);

    return ReactDOM.createPortal(
        <>
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
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden border border-gray-200"
                        >
                            {/* Sidebar - Categories */}
                            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col hidden md:flex">
                                <div className="p-5 border-b border-gray-200 bg-white">
                                    <h2 className="font-bold text-gray-800 flex items-center text-lg">
                                        <Filter size={20} className="mr-2.5 text-blue-600" />
                                        Categories
                                    </h2>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedCategory === null
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                            : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                            }`}
                                    >
                                        All Categories
                                    </button>
                                    {categoryKeys.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all truncate ${selectedCategory === cat
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                                }`}
                                            title={cat}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                {/* Mini Stats in Sidebar */}
                                <div className="p-4 bg-gray-100 border-t border-gray-200">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Reports</div>
                                    <div className="text-2xl font-bold text-gray-800">{stats.totalReports}</div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 flex flex-col bg-gray-50/30 relative">
                                {/* Header Bar */}
                                <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between gap-4 z-10 shadow-sm">
                                    <div className="flex-1 max-w-xl relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Search reports by title, category, or module..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none text-sm"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                                            <button
                                                onClick={() => setViewMode('grid')}
                                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                title="Grid View"
                                            >
                                                <LayoutGrid size={20} />
                                            </button>
                                            <button
                                                onClick={() => setViewMode('list')}
                                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                title="List View"
                                            >
                                                <List size={20} />
                                            </button>
                                        </div>
                                        <div className="h-8 w-px bg-gray-200 mx-1"></div>
                                        <button
                                            onClick={onClose}
                                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                                    {filteredReports.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                                <Search size={40} className="opacity-40" />
                                            </div>
                                            <p className="text-xl font-semibold text-gray-600 mb-2">No reports found</p>
                                            <p className="text-gray-500">Try adjusting your search or category filter</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Grouped View (Optional - if we want to show headers) */}
                                            {/* For now, sticking to paginated grid for performance, but adding module tags */}

                                            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-3"}>
                                                {paginatedReports.map((report) => (
                                                    <motion.div
                                                        key={report.id || report["Report Title"]}
                                                        layoutId={report.id || report["Report Title"]}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        whileHover={{ y: -4, boxShadow: "0 12px 20px -8px rgba(0, 0, 0, 0.15)" }}
                                                        className={`bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group transition-all duration-300 ${viewMode === 'list' ? 'flex items-center p-4 hover:border-blue-300' : 'flex flex-col h-full shadow-sm hover:border-blue-300'
                                                            }`}
                                                        onClick={() => setSelectedReport(report)}
                                                    >
                                                        {viewMode === 'grid' && (
                                                            <div className="h-44 bg-gray-50/50 p-6 flex items-center justify-center border-b border-gray-100 relative overflow-hidden group-hover:bg-blue-50/30 transition-colors">
                                                                <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-500">
                                                                    {/* Use static=true for performance in grid */}
                                                                    <AnimatedChartThumbnail
                                                                        type={report["Chart Type (ECharts)"] || 'Bar Chart'}
                                                                        animate={false}
                                                                    />
                                                                </div>
                                                                <div className="absolute top-3 right-3">
                                                                    <span className="px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-bold text-gray-500 uppercase tracking-wider rounded-md border border-gray-200 shadow-sm">
                                                                        {report["Chart Type (ECharts)"]?.split(' ')[0] || 'Chart'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className={viewMode === 'list' ? "flex-1 ml-6" : "p-5 flex-1 flex flex-col"}>
                                                            <div className="mb-2">
                                                                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 mb-1.5">
                                                                    <span className="bg-blue-50 px-2 py-0.5 rounded-md">{report["Module (Category 2)"]}</span>
                                                                </div>
                                                                <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 text-base leading-snug">
                                                                    {report["Report Title"]}
                                                                </h3>
                                                            </div>

                                                            {viewMode === 'list' && (
                                                                <p className="text-sm text-gray-500 line-clamp-1 mt-1">{report["benefit"]}</p>
                                                            )}

                                                            {viewMode === 'grid' && (
                                                                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <Target size={12} />
                                                                        Strategic
                                                                    </span>
                                                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Pagination Controls */}
                                            {totalPages > 1 && (
                                                <div className="mt-8 flex items-center justify-center gap-4 pb-4">
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1}
                                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <ChevronLeft size={20} />
                                                    </button>
                                                    <span className="text-sm font-medium text-gray-600">
                                                        Page {currentPage} of {totalPages}
                                                    </span>
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <ChevronRight size={20} />
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
            </AnimatePresence>

            {/* Report Details Modal */}
            <AnimatePresence>
                {isOpen && selectedReport && (
                    <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setSelectedReport(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
                        >
                            {/* Left Side: Visuals */}
                            <div className="w-full md:w-[400px] bg-gray-50 p-8 flex flex-col border-r border-gray-200">
                                <div className="aspect-[4/3] bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 flex items-center justify-center relative overflow-hidden group">
                                    <div className="w-full h-full transform scale-100 group-hover:scale-110 transition-transform duration-700">
                                        {/* Animate here for effect */}
                                        <AnimatedChartThumbnail type={selectedReport["Chart Type (ECharts)"] || 'Bar Chart'} animate={true} />
                                    </div>
                                </div>
                                <div className="mt-auto space-y-4">
                                    <button
                                        onClick={() => {
                                            onSelectReport(selectedReport);
                                            onClose();
                                        }}
                                        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                                    >
                                        <LayoutGrid size={20} />
                                        Insert Report
                                    </button>
                                    <button
                                        onClick={() => setSelectedReport(null)}
                                        className="w-full py-3 px-6 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            {/* Right Side: Details */}
                            <div className="flex-1 p-8 overflow-y-auto bg-white">
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm text-blue-600 font-bold mb-3 uppercase tracking-wide">
                                            <span className="px-3 py-1 bg-blue-50 rounded-full">{selectedReport["Category 1 (Detailed)"]}</span>
                                            <ChevronRight size={14} className="text-gray-300" />
                                            <span>{selectedReport["Module (Category 2)"]}</span>
                                        </div>
                                        <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">{selectedReport["Report Title"]}</h2>
                                        <p className="text-gray-500 text-lg">{selectedReport["benefit"]}</p>
                                    </div>
                                    <button onClick={() => setSelectedReport(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <DetailItem
                                            icon={BarChart2}
                                            label="KPI Definition"
                                            value={selectedReport["kpi_definition"]}
                                            color="blue"
                                        />
                                        <DetailItem
                                            icon={Zap}
                                            label="Formula"
                                            value={selectedReport["formula"]}
                                            color="amber"
                                        />
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                                <Database size={20} />
                                            </div>
                                            <h3 className="font-bold text-gray-900">Data Sources</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedReport["data_needed"]?.split(',').map((source: string, i: number) => (
                                                <span key={i} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">
                                                    {source.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                <FileText size={20} />
                                            </div>
                                            <h3 className="font-bold text-gray-900">Detailed Explanation</h3>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">
                                            {selectedReport["detailed_explanation"]}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
};

// Helper component for detail items
const DetailItem = ({ icon: Icon, label, value, color = "blue" }: { icon: any, label: string, value: string, color?: string }) => {
    if (!value) return null;

    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        amber: "bg-amber-50 text-amber-600",
        purple: "bg-purple-50 text-purple-600",
        green: "bg-green-50 text-green-600",
    }[color] || "bg-gray-50 text-gray-600";

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                <Icon size={14} />
                {label}
            </div>
            <div className={`p-4 rounded-xl border border-gray-100 ${color === 'blue' ? 'bg-blue-50/30' : 'bg-amber-50/30'}`}>
                <p className="text-sm font-medium text-gray-800 leading-relaxed">{value}</p>
            </div>
        </div>
    );
};

export default ReportGalleryModal;
