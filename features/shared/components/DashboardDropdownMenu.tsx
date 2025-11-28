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
    Truck,
    ClipboardCheck,
    AlertCircle,
    PieChart,
    Target,
    Briefcase,
    Clock,
    CreditCard,
    Globe,
    Zap,
    Plus
} from 'lucide-react';

interface DashboardDropdownMenuProps {
    isOpen: boolean;
    categories: Record<string, Record<string, any[]>>;
    modules?: Record<string, any[]>;
    onSelectModule: (moduleName: string, reports: any[], keepOpen?: boolean) => void;
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

const getModuleIcon = (module: string) => {
    const lower = module.toLowerCase();
    if (lower.includes('invoice')) return FileText;
    if (lower.includes('order') || lower.includes('requisition')) return ShoppingCart;
    if (lower.includes('contract')) return Briefcase;
    if (lower.includes('supplier') || lower.includes('vendor')) return Truck;
    if (lower.includes('audit') || lower.includes('compliance')) return ClipboardCheck;
    if (lower.includes('risk') || lower.includes('issue')) return AlertCircle;
    if (lower.includes('spend') || lower.includes('budget')) return PieChart;
    if (lower.includes('kpi') || lower.includes('performance')) return Target;
    if (lower.includes('time') || lower.includes('cycle')) return Clock;
    if (lower.includes('payment') || lower.includes('card')) return CreditCard;
    if (lower.includes('global') || lower.includes('region')) return Globe;
    if (lower.includes('efficiency') || lower.includes('automation')) return Zap;
    return Activity;
};

const DashboardDropdownMenu: React.FC<DashboardDropdownMenuProps> = ({
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
                        top: position.top - 4, // Align slightly up to match menu item
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
                        className="bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-xl shadow-2xl py-2 w-72 ring-1 ring-black/5 max-h-[85vh] overflow-y-auto no-scrollbar"
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

                                        {/* Accordion Content - Modules */}
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
                                                        {Object.entries(categories[category]).map(([moduleName, reports]) => {
                                                            const ModuleIcon = getModuleIcon(moduleName);
                                                            return (
                                                                <div key={moduleName} className="flex items-center group/module w-full hover:bg-blue-100/50 rounded-lg transition-colors pr-1">
                                                                    <button
                                                                        className="flex-1 text-left px-3 py-2 text-sm text-gray-600 hover:text-blue-600 flex items-center transition-all"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            props.onSelectModule(moduleName, reports);
                                                                            onClose();
                                                                        }}
                                                                    >
                                                                        <div className="p-1 rounded-md mr-2.5 text-gray-400 group-hover/module:text-blue-500 transition-colors">
                                                                            <ModuleIcon size={14} />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="font-medium truncate">{moduleName}</div>
                                                                            <div className="text-[10px] text-gray-400 truncate">
                                                                                {reports.length} reports
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                    <button
                                                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-200 rounded opacity-0 group-hover/module:opacity-100 transition-all"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            props.onSelectModule(moduleName, reports, true);
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
                                    const ModuleIcon = getModuleIcon(moduleName);
                                    return (
                                        <div key={moduleName} className="flex items-center group/module w-full hover:bg-blue-100/50 rounded-lg transition-colors pr-1">
                                            <button
                                                className="flex-1 text-left px-3 py-2 text-sm text-gray-600 hover:text-blue-600 flex items-center transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    props.onSelectModule(moduleName, reports);
                                                    onClose();
                                                }}
                                            >
                                                <div className="p-1 rounded-md mr-2.5 text-gray-400 group-hover/module:text-blue-500 transition-colors">
                                                    <ModuleIcon size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{moduleName}</div>
                                                    <div className="text-[10px] text-gray-400 truncate">
                                                        {reports.length} reports
                                                    </div>
                                                </div>
                                            </button>
                                            <button
                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-200 rounded opacity-0 group-hover/module:opacity-100 transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    props.onSelectModule(moduleName, reports, true);
                                                }}
                                                title="Add and keep menu open"
                                            >
                                                <Plus size={14} />
                                            </button>
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

export default DashboardDropdownMenu;
