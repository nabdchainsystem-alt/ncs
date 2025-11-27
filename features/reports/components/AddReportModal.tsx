import React, { useState, useMemo } from 'react';
import { X, Search, LayoutGrid, List as ListIcon } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add Report</h2>
                        <p className="text-sm text-gray-500">Select a report to add to your dashboard</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar - Advanced Filters */}
                    <div className="w-72 border-r border-gray-200 bg-gray-50 flex-shrink-0 flex flex-col overflow-y-auto custom-scrollbar">
                        <div className="p-4 space-y-6">
                            {/* Categories Filter */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
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
                                <div className="space-y-1">
                                    {filterOptions.categories.map(category => (
                                        <label key={category} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer group">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFilters.category.includes(category)
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-gray-300 bg-white group-hover:border-blue-400'
                                                }`}>
                                                {selectedFilters.category.includes(category) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <span className={`text-sm ${selectedFilters.category.includes(category) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                                {category}
                                            </span>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedFilters.category.includes(category)}
                                                onChange={() => toggleFilter('category', category)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-gray-200" />

                            {/* Modules Filter */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
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
                                <div className="space-y-1">
                                    {filterOptions.modules.map(module => (
                                        <label key={module} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer group">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFilters.module.includes(module)
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-gray-300 bg-white group-hover:border-blue-400'
                                                }`}>
                                                {selectedFilters.module.includes(module) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <span className={`text-sm ${selectedFilters.module.includes(module) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                                {module}
                                            </span>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedFilters.module.includes(module)}
                                                onChange={() => toggleFilter('module', module)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-gray-200" />

                            {/* Chart Types Filter */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                                    Chart Types
                                    {selectedFilters.chartType.length > 0 && (
                                        <button
                                            onClick={() => setSelectedFilters(prev => ({ ...prev, chartType: [] }))}
                                            className="text-[10px] text-blue-600 hover:underline capitalize"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </h3>
                                <div className="space-y-1">
                                    {filterOptions.chartTypes.map(type => (
                                        <label key={type} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer group">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFilters.chartType.includes(type)
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-gray-300 bg-white group-hover:border-blue-400'
                                                }`}>
                                                {selectedFilters.chartType.includes(type) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <span className={`text-sm ${selectedFilters.chartType.includes(type) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                                {type}
                                            </span>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedFilters.chartType.includes(type)}
                                                onChange={() => toggleFilter('chartType', type)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col bg-gray-50/50">
                        {/* Toolbar */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search reports..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-3 ml-auto">
                                {(selectedFilters.category.length > 0 || selectedFilters.module.length > 0 || selectedFilters.chartType.length > 0) && (
                                    <button
                                        onClick={() => setSelectedFilters({ category: [], module: [], chartType: [] })}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Reset Filters
                                    </button>
                                )}
                                <div className="text-sm text-gray-500">
                                    Showing <span className="font-semibold text-gray-900">{filteredReports.length}</span> reports
                                </div>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {filteredReports.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredReports.map((report) => (
                                        <ReportCard
                                            key={report.id}
                                            report={report as any}
                                            onClick={(r) => {
                                                onAddReport?.(r);
                                                onClose();
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                                        <Search size={32} className="text-gray-400" />
                                    </div>
                                    <p className="text-lg font-medium">No reports found</p>
                                    <p className="text-sm">Try adjusting your filters or search query</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddReportModal;
