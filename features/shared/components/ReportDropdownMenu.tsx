import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    Activity,
    Settings,
    ShoppingCart,
    DollarSign,
    Award,
    Leaf,
    TrendingUp,
    Wallet,
    Users,
    Calendar,
    Lightbulb,
    Shield,
    Package,
    BarChart2,
    FileText,
    PieChart,
    Layout,
    Gauge,
    CreditCard,
    Plus
} from 'lucide-react';

interface ReportDropdownMenuProps {
    isOpen: boolean;
    categories: Record<string, any[]>;
    modules?: Record<string, any[]>;
    onSelectReport: (report: any, keepOpen?: boolean) => void;
    onClose: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    parentRef: React.RefObject<HTMLDivElement>;
}

const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('process')) return Settings;
    if (lower.includes('order') || lower.includes('po')) return ShoppingCart;
    if (lower.includes('spend') || lower.includes('cost')) return DollarSign;
    if (lower.includes('supplier') || lower.includes('quality')) return Award;
    if (lower.includes('sustainability') || lower.includes('csr')) return Leaf;
    if (lower.includes('improvement')) return TrendingUp;
    if (lower.includes('capital') || lower.includes('payment')) return Wallet;
    if (lower.includes('people') || lower.includes('training')) return Users;
    if (lower.includes('forecasting') || lower.includes('planning')) return Calendar;
    if (lower.includes('innovation')) return Lightbulb;
    if (lower.includes('compliance') || lower.includes('risk')) return Shield;
    if (lower.includes('inventory') || lower.includes('logistics')) return Package;
    return BarChart2;
};

const getChartIcon = (type: string) => {
    switch (type) {
        case 'KPI Card': return CreditCard;
        case 'Donut Chart':
        case 'Pie Chart': return PieChart;
        case 'Bar Chart': return BarChart2;
        case 'Line Chart': return Activity;
        case 'Treemap': return Layout;
        case 'Gauge Chart': return Gauge;
        default: return FileText;
    }
};

const ReportDropdownMenu: React.FC<ReportDropdownMenuProps> = ({
    isOpen,
    categories,
    onClose,
    ...props
}) => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'category' | 'module'>('category');
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const categoryKeys = Object.keys(categories);
    const moduleKeys = props.modules ? Object.keys(props.modules).sort() : [];

    useEffect(() => {
        if (isOpen && props.parentRef.current) {
            const rect = props.parentRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top,
                left: rect.right
            });
        }
    }, [isOpen, props.parentRef]);

    const menuContent = (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed z-[9999]"
                    style={{
                        top: position.top - 4,
                        left: position.left,
                    }}
                    onMouseEnter={props.onMouseEnter}
                    onMouseLeave={props.onMouseLeave}
                >
                    {/* Main Category Menu */}
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-xl shadow-2xl py-2 w-80 ring-1 ring-black/5 max-h-[85vh] overflow-y-auto no-scrollbar"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <style>{`
                            .no-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>

                        <div className="px-3 py-2 mb-2">
                            {props.modules && (
                                <div className="flex bg-gray-100/50 p-1 rounded-lg w-full">
                                    <button
                                        onClick={() => setViewMode('category')}
                                        className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'category' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Category
                                    </button>
                                    <button
                                        onClick={() => setViewMode('module')}
                                        className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'module' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Module
                                    </button>
                                </div>
                            )}
                        </div>

                        {viewMode === 'category' ? (
                            categoryKeys.map((category) => {
                                const CategoryIcon = getCategoryIcon(category);
                                return (
                                    <div
                                        key={category}
                                        className="relative"
                                    >
                                        <button
                                            onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                                            className={`w-full text-left px-3 py-2.5 text-sm font-medium flex items-center justify-between transition-colors ${activeCategory === category
                                                ? 'text-blue-600 bg-blue-50/50'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center truncate mr-2">
                                                <CategoryIcon size={16} className={`mr-2.5 flex-shrink-0 ${activeCategory === category ? 'text-blue-600' : 'text-gray-500'}`} />
                                                <span className={`truncate ${activeCategory === category ? 'font-bold text-blue-700' : 'font-semibold text-gray-700'}`}>{category}</span>
                                            </div>
                                            <ChevronRight
                                                size={14}
                                                className={`flex-shrink-0 transition-transform duration-200 ${activeCategory === category ? 'text-blue-500 rotate-90' : 'text-gray-400'
                                                    }`}
                                            />
                                        </button>

                                        {/* Accordion Content - Reports */}
                                        <AnimatePresence>
                                            {activeCategory === category && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                                    className="overflow-hidden bg-gray-50/50"
                                                >
                                                    <div className="py-1 px-2 space-y-0.5">
                                                        {categories[category].map((report) => {
                                                            const ChartIcon = getChartIcon(report["Chart Type (ECharts)"]);
                                                            return (
                                                                <div key={report.id} className="flex items-center group/report w-full hover:bg-blue-100/50 rounded-lg transition-colors pr-1">
                                                                    <button
                                                                        className="flex-1 text-left px-3 py-2 text-sm text-gray-600 hover:text-blue-600 flex items-center transition-all"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            props.onSelectReport(report);
                                                                            onClose();
                                                                        }}
                                                                    >
                                                                        <div className="p-1 rounded-md mr-2.5 text-gray-400 group-hover/report:text-blue-500 transition-colors">
                                                                            <ChartIcon size={14} />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="font-medium truncate">{report["Report Title"]}</div>
                                                                        </div>
                                                                    </button>
                                                                    <button
                                                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-200 rounded opacity-0 group-hover/report:opacity-100 transition-all"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            props.onSelectReport(report, true);
                                                                        }}
                                                                        title="Add and keep menu open"
                                                                    >
                                                                        <Plus size={14} />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })
                        ) : (
                            // Module View
                            <div className="py-1 px-2 space-y-0.5">
                                {moduleKeys.map((moduleName) => {
                                    const reports = props.modules![moduleName];
                                    // Reuse getCategoryIcon or define getModuleIcon if needed. 
                                    // Since we don't have getModuleIcon in this file, let's use FileText or similar.
                                    // Actually, let's try to import getModuleIcon or just use a generic icon.
                                    // For now, let's use a generic icon for the module header if we were grouping by module -> reports.
                                    // Wait, the structure for modules is Record<string, any[]>.
                                    // So we have Module Name -> List of Reports.
                                    // We can render this as an accordion too? Or just a list of modules that expand?
                                    // The plan said "group by Module (Module -> Reports)".
                                    // So yes, it should be an accordion of modules.

                                    // Let's use a simple icon for now.
                                    return (
                                        <div key={moduleName} className="relative">
                                            <button
                                                onClick={() => setActiveCategory(activeCategory === moduleName ? null : moduleName)}
                                                className={`w-full text-left px-3 py-2.5 text-sm font-medium flex items-center justify-between transition-colors ${activeCategory === moduleName
                                                    ? 'text-blue-600 bg-blue-50/50'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center truncate mr-2">
                                                    <FileText size={16} className={`mr-2.5 flex-shrink-0 ${activeCategory === moduleName ? 'text-blue-600' : 'text-gray-500'}`} />
                                                    <span className={`truncate ${activeCategory === moduleName ? 'font-bold text-blue-700' : 'font-semibold text-gray-700'}`}>{moduleName}</span>
                                                </div>
                                                <ChevronRight
                                                    size={14}
                                                    className={`flex-shrink-0 transition-transform duration-200 ${activeCategory === moduleName ? 'text-blue-500 rotate-90' : 'text-gray-400'
                                                        }`}
                                                />
                                            </button>

                                            <AnimatePresence>
                                                {activeCategory === moduleName && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                                        className="overflow-hidden bg-gray-50/50"
                                                    >
                                                        <div className="py-1 px-2 space-y-0.5">
                                                            {reports.map((report: any) => {
                                                                const ChartIcon = getChartIcon(report["Chart Type (ECharts)"]);
                                                                return (
                                                                    <div key={report.id} className="flex items-center group/report w-full hover:bg-blue-100/50 rounded-lg transition-colors pr-1">
                                                                        <button
                                                                            className="flex-1 text-left px-3 py-2 text-sm text-gray-600 hover:text-blue-600 flex items-center transition-all"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                props.onSelectReport(report);
                                                                                onClose();
                                                                            }}
                                                                        >
                                                                            <div className="p-1 rounded-md mr-2.5 text-gray-400 group-hover/report:text-blue-500 transition-colors">
                                                                                <ChartIcon size={14} />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="font-medium truncate">{report["Report Title"]}</div>
                                                                            </div>
                                                                        </button>
                                                                        <button
                                                                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-200 rounded opacity-0 group-hover/report:opacity-100 transition-all"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                props.onSelectReport(report, true);
                                                                            }}
                                                                            title="Add and keep menu open"
                                                                        >
                                                                            <Plus size={14} />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return ReactDOM.createPortal(menuContent, document.body);
};

export default ReportDropdownMenu;
