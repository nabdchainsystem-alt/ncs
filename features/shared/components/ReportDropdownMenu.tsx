import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    Plus,
    Search,
    Layers,
    Brain,
    BrainCircuit,
    ThermometerSnowflake,
    ShieldCheck,
    Wrench,
    Bot,
    HardHat,
    Box,
    Route,
    Database,
    GitMerge,
    LineChart,
    CheckCircle,
    AlertCircle,
    Target,
    Briefcase,
    Clock,
    Globe,
    Zap,
    Truck,
    ClipboardCheck
} from 'lucide-react';

interface ReportDropdownMenuProps {
    isOpen: boolean;
    categories: Record<string, any[]>;
    modules?: Record<string, any[]>;
    layers?: Record<string, any[]>;
    tabs?: { id: string; label: string }[];
    customCategories?: string[];
    customModules?: string[];
    onSelectReport: (report: any, keepOpen?: boolean) => void;
    onClose: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    parentRef: React.RefObject<HTMLDivElement>;
}

const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();

    // Layer Categories
    if (lower.includes('advanced-intelligence')) return Brain;
    if (lower.includes('cognitive')) return BrainCircuit;
    if (lower.includes('decision')) return GitMerge;
    if (lower.includes('predictive')) return LineChart;
    if (lower.includes('prescriptive')) return CheckCircle;

    // Warehouse Categories
    if (lower.includes('ai ')) return Brain;
    if (lower.includes('cold chain')) return ThermometerSnowflake;
    if (lower.includes('compliance') || lower.includes('governance')) return ShieldCheck;
    if (lower.includes('dock') || lower.includes('yard')) return Truck;
    if (lower.includes('energy') || lower.includes('sustainability')) return Zap;
    if (lower.includes('equipment') || lower.includes('maintenance')) return Wrench;
    if (lower.includes('financial') || lower.includes('cost') || lower.includes('profitability')) return DollarSign;
    if (lower.includes('inventory') || lower.includes('stock') || lower.includes('replenishment')) return Package;
    if (lower.includes('labor') || lower.includes('workforce')) return Users;
    if (lower.includes('robotics') || lower.includes('automation')) return Bot;
    if (lower.includes('safety') || lower.includes('damage')) return HardHat;
    if (lower.includes('sku')) return BarChart2;
    if (lower.includes('slotting') || lower.includes('space') || lower.includes('storage')) return Box;
    if (lower.includes('transport') || lower.includes('shipping') || lower.includes('outbound') || lower.includes('inbound') || lower.includes('flow')) return Route;
    if (lower.includes('quality')) return ClipboardCheck;
    if (lower.includes('data') || lower.includes('digital twin')) return Database;
    if (lower.includes('optimization')) return TrendingUp;
    if (lower.includes('network')) return Globe;

    // General Fallbacks
    if (lower.includes('process')) return Settings;
    if (lower.includes('order') || lower.includes('po')) return ShoppingCart;
    if (lower.includes('spend')) return DollarSign;
    if (lower.includes('supplier')) return Award;
    if (lower.includes('improvement')) return TrendingUp;
    if (lower.includes('capital') || lower.includes('payment')) return Wallet;
    if (lower.includes('people') || lower.includes('training')) return Users;
    if (lower.includes('forecasting') || lower.includes('planning')) return Calendar;
    if (lower.includes('innovation')) return Lightbulb;
    if (lower.includes('risk')) return Shield;
    if (lower.includes('logistics')) return Truck;

    return Layers;
};

const getModuleIcon = (module: string) => {
    const lower = module.toLowerCase();

    // Warehouse Modules
    if (lower.includes('ai ') || lower.includes('prediction') || lower.includes('forecast') || lower.includes('detection')) return BrainCircuit;
    if (lower.includes('picking') || lower.includes('putaway') || lower.includes('batch') || lower.includes('cluster') || lower.includes('zone')) return Package;
    if (lower.includes('dock') || lower.includes('load') || lower.includes('unload')) return Truck;
    if (lower.includes('cost') || lower.includes('profit') || lower.includes('financial')) return DollarSign;
    if (lower.includes('labor') || lower.includes('workforce') || lower.includes('shift')) return Users;
    if (lower.includes('equipment') || lower.includes('breakdown') || lower.includes('health')) return Wrench;
    if (lower.includes('sku')) return BarChart2;
    if (lower.includes('inventory') || lower.includes('stock') || lower.includes('aging') || lower.includes('movers')) return Box;
    if (lower.includes('route') || lower.includes('mapping') || lower.includes('network')) return Route;
    if (lower.includes('heatmap')) return Activity;
    if (lower.includes('sla') || lower.includes('benchmark') || lower.includes('comparison')) return Target;
    if (lower.includes('risk') || lower.includes('exception')) return AlertCircle;
    if (lower.includes('storage') || lower.includes('bin') || lower.includes('capacity')) return Database;
    if (lower.includes('cycle') || lower.includes('turnover') || lower.includes('velocity')) return Clock;
    if (lower.includes('optimization') || lower.includes('efficiency')) return TrendingUp;
    if (lower.includes('accuracy') || lower.includes('quality')) return CheckCircle;

    // General Fallbacks
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

interface FlattenedItem {
    type: 'header' | 'report' | 'empty';
    id: string;
    label: string;
    data?: any;
    depth: number;
    isExpanded?: boolean;
    icon?: any;
    count?: number;
}

const ReportDropdownMenu: React.FC<ReportDropdownMenuProps> = ({
    isOpen,
    categories,
    onClose,
    tabs = [{ id: 'category', label: 'Category' }, { id: 'layer', label: 'Layer' }, { id: 'module', label: 'Module' }],
    customCategories,
    customModules,
    ...props
}) => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<string>(tabs[0].id);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    const categoryKeys = useMemo(() => categories ? Object.keys(categories) : [], [categories]);
    const moduleKeys = useMemo(() => props.modules ? Object.keys(props.modules).sort() : [], [props.modules]);
    const layerKeys = useMemo(() => props.layers ? Object.keys(props.layers).sort() : [], [props.layers]);

    useEffect(() => {
        if (isOpen && props.parentRef.current) {
            const rect = props.parentRef.current.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const menuWidth = 450; // Increased width for longer titles

            // Default to opening to the right
            let left = rect.right;

            // If not enough space on the right, open to the left
            if (left + menuWidth > windowWidth) {
                left = rect.left - menuWidth;
            }

            // Align top with the trigger element
            let top = rect.top - 4; // Slight adjustment for alignment

            // Ensure it doesn't go off the bottom of the screen
            const windowHeight = window.innerHeight;
            const menuHeight = 600; // Max height
            if (top + menuHeight > windowHeight) {
                top = windowHeight - menuHeight - 10;
            }

            setPosition({
                top: top,
                left: left
            });
            // Reset search when opening
            setSearchQuery('');
        }
    }, [isOpen, props.parentRef]);

    // Flatten items for rendering (with limit)
    const flattenedItems = useMemo(() => {
        const items: FlattenedItem[] = [];
        const query = searchQuery.toLowerCase().trim();
        const isSearching = !!query;

        if (viewMode === 'category') {
            const cats = customCategories || categoryKeys;
            const filteredCats = cats.filter(cat => {
                if (!isSearching) return true;
                if (cat.toLowerCase().includes(query)) return true;
                // Check if any reports match
                return categories[cat]?.some(r => r["Report Title"].toLowerCase().includes(query));
            });

            if (filteredCats.length === 0) {
                items.push({ type: 'empty', id: 'empty', label: 'No categories found', depth: 0 });
            } else {
                filteredCats.sort().forEach(cat => {
                    const reports = categories[cat] || [];
                    const matchingReports = isSearching
                        ? reports.filter(r => r["Report Title"].toLowerCase().includes(query) || cat.toLowerCase().includes(query))
                        : reports;

                    if (isSearching && matchingReports.length === 0 && !cat.toLowerCase().includes(query)) return;

                    const isExpanded = isSearching || activeCategory === cat;

                    items.push({
                        type: 'header',
                        id: `cat-${cat}`,
                        label: cat,
                        depth: 0,
                        isExpanded,
                        icon: getCategoryIcon(cat),
                        count: matchingReports.length
                    });

                    if (isExpanded) {
                        if (matchingReports.length === 0) {
                            items.push({ type: 'empty', id: `empty-${cat}`, label: 'No reports configured', depth: 1 });
                        } else {
                            matchingReports.forEach(report => {
                                items.push({
                                    type: 'report',
                                    id: report.id || report["Report Title"],
                                    label: report["Report Title"],
                                    data: report,
                                    depth: 1,
                                    icon: getChartIcon(report["Chart Type (ECharts)"])
                                });
                            });
                        }
                    }
                });
            }
        } else if (viewMode === 'layer' && props.layers) {
            const layers = layerKeys;
            const filteredLayers = layers.filter(layer => {
                if (!isSearching) return true;
                if (layer.toLowerCase().includes(query)) return true;
                return props.layers![layer].some((r: any) => r["Report Title"].toLowerCase().includes(query));
            });

            if (filteredLayers.length === 0) {
                items.push({ type: 'empty', id: 'empty', label: 'No layers found', depth: 0 });
            } else {
                filteredLayers.sort().forEach(layer => {
                    const reports = props.layers![layer] || [];
                    const matchingReports = isSearching
                        ? reports.filter((r: any) => r["Report Title"].toLowerCase().includes(query) || layer.toLowerCase().includes(query))
                        : reports;

                    if (isSearching && matchingReports.length === 0 && !layer.toLowerCase().includes(query)) return;

                    const isExpanded = isSearching || activeCategory === layer;

                    items.push({
                        type: 'header',
                        id: `layer-${layer}`,
                        label: layer,
                        depth: 0,
                        isExpanded,
                        icon: getCategoryIcon(layer),
                        count: matchingReports.length
                    });

                    if (isExpanded) {
                        // Group by Sub-Layer
                        const subLayers: Record<string, any[]> = {};
                        matchingReports.forEach((r: any) => {
                            const sub = r["Sub-Layer"] || "General";
                            if (!subLayers[sub]) subLayers[sub] = [];
                            subLayers[sub].push(r);
                        });

                        const subLayerKeys = Object.keys(subLayers).sort();

                        if (subLayerKeys.length === 0) {
                            items.push({ type: 'empty', id: `empty-${layer}`, label: 'No reports found', depth: 1 });
                        } else {
                            subLayerKeys.forEach(sub => {
                                const subReports = subLayers[sub];
                                // Add Sub-Layer Header
                                items.push({
                                    type: 'header', // Re-using header type for sub-layer
                                    id: `sub-${layer}-${sub}`,
                                    label: sub,
                                    depth: 1,
                                    isExpanded: true, // Always expanded for now, or could be toggleable
                                    count: subReports.length,
                                    icon: <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">{sub.charAt(0)}</div>
                                });

                                // Add Reports
                                subReports.forEach((report: any) => {
                                    items.push({
                                        type: 'report',
                                        id: report.id || report["Report Title"],
                                        label: report["Report Title"],
                                        data: report,
                                        depth: 2, // Increased depth
                                        icon: getChartIcon(report["Chart Type (ECharts)"])
                                    });
                                });
                            });
                        }
                    }
                });
            }
        } else if (viewMode === 'module' && (customModules || props.modules)) {
            const mods = customModules || moduleKeys;
            const filteredMods = mods.filter(mod => {
                if (!isSearching) return true;
                if (mod.toLowerCase().includes(query)) return true;
                return props.modules?.[mod]?.some((r: any) => r["Report Title"].toLowerCase().includes(query));
            });

            if (filteredMods.length === 0) {
                items.push({ type: 'empty', id: 'empty', label: 'No modules found', depth: 0 });
            } else {
                filteredMods.sort().forEach(mod => {
                    const reports = props.modules?.[mod] || [];
                    const matchingReports = isSearching
                        ? reports.filter((r: any) => r["Report Title"].toLowerCase().includes(query) || mod.toLowerCase().includes(query))
                        : reports;

                    if (isSearching && matchingReports.length === 0 && !mod.toLowerCase().includes(query)) return;

                    const isExpanded = isSearching || activeCategory === mod;

                    items.push({
                        type: 'header',
                        id: `mod-${mod}`,
                        label: mod,
                        depth: 0,
                        isExpanded,
                        icon: getModuleIcon(mod),
                        count: matchingReports.length
                    });

                    if (isExpanded) {
                        if (matchingReports.length === 0) {
                            items.push({ type: 'empty', id: `empty-${mod}`, label: 'No reports configured', depth: 1 });
                        } else {
                            matchingReports.forEach((report: any) => {
                                items.push({
                                    type: 'report',
                                    id: report.id || report["Report Title"],
                                    label: report["Report Title"],
                                    data: report,
                                    depth: 1,
                                    icon: getChartIcon(report["Chart Type (ECharts)"])
                                });
                            });
                        }
                    }
                });
            }
        }

        return items;
    }, [viewMode, activeCategory, searchQuery, categories, categoryKeys, props.layers, layerKeys, props.modules, moduleKeys, customCategories, customModules]);

    // Limit displayed items to improve performance without virtualization
    const MAX_ITEMS = 100;
    const displayedItems = flattenedItems.slice(0, MAX_ITEMS);
    const hasMore = flattenedItems.length > MAX_ITEMS;

    const menuContent = (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed z-[9999]"
                    style={{
                        top: position.top,
                        left: position.left,
                    }}
                    onMouseEnter={props.onMouseEnter}
                    onMouseLeave={props.onMouseLeave}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-xl shadow-2xl py-2 w-[450px] ring-1 ring-black/5 flex flex-col"
                        style={{ maxHeight: '600px' }}
                    >
                        {/* Search Bar */}
                        <div className="px-3 pb-2 pt-1 sticky top-0 bg-white/95 backdrop-blur-xl z-10">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search reports..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="px-3 py-2 mb-2">
                            {props.modules && (
                                <div className="flex bg-gray-100/50 p-1 rounded-lg w-full">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setViewMode(tab.id)}
                                            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <style>{`
                                .no-scrollbar::-webkit-scrollbar {
                                    display: none;
                                }
                                .no-scrollbar {
                                    -ms-overflow-style: none;
                                    scrollbar-width: none;
                                }
                            `}</style>
                            {displayedItems.map((item, index) => {
                                const Icon = item.icon;

                                if (item.type === 'empty') {
                                    return (
                                        <div key={item.id} className="px-4 py-2 text-sm text-gray-400 italic flex items-center">
                                            {item.label}
                                        </div>
                                    );
                                }

                                if (item.type === 'header') {
                                    return (
                                        <div key={item.id} className="px-0">
                                            <button
                                                onClick={() => setActiveCategory(activeCategory === item.label ? null : item.label)}
                                                className={`w-full text-left px-3 py-2 text-sm font-medium flex items-center justify-between transition-colors ${item.isExpanded
                                                    ? 'text-blue-600 bg-blue-50/50'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center truncate mr-2">
                                                    {React.isValidElement(Icon) ? (
                                                        <div className="mr-2.5 flex-shrink-0">
                                                            {Icon}
                                                        </div>
                                                    ) : (
                                                        Icon && <Icon size={16} className={`mr-2.5 flex-shrink-0 ${item.isExpanded ? 'text-blue-600' : 'text-gray-500'}`} />
                                                    )}
                                                    <span className={`truncate ${item.isExpanded ? 'font-bold text-blue-700' : 'font-semibold text-gray-700'}`}>
                                                        {item.label}
                                                        {searchQuery.trim() && <span className="ml-2 text-xs font-normal text-blue-400 opacity-75">({item.count})</span>}
                                                    </span>
                                                </div>
                                                {!searchQuery.trim() && (
                                                    <ChevronRight
                                                        size={14}
                                                        className={`flex-shrink-0 transition-transform duration-200 ${item.isExpanded ? 'text-blue-500 rotate-90' : 'text-gray-400'}`}
                                                    />
                                                )}
                                            </button>
                                        </div>
                                    );
                                }

                                if (item.type === 'report') {
                                    return (
                                        <div key={item.id} className="px-0 bg-gray-50/50">
                                            <div className="flex items-center group/report w-full hover:bg-blue-100/50 transition-colors pr-1">
                                                <button
                                                    className="flex-1 text-left px-3 py-1 text-sm text-gray-600 hover:text-blue-600 flex items-center transition-all"
                                                    style={{ paddingLeft: `${(item.depth * 12) + 12}px` }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        props.onSelectReport(item.data);
                                                        onClose();
                                                    }}
                                                >
                                                    <div className="p-1 rounded-md mr-2.5 text-gray-400 group-hover/report:text-blue-500 transition-colors">
                                                        {Icon && <Icon size={14} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{item.label}</div>
                                                    </div>
                                                </button>
                                                <button
                                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-200 rounded opacity-0 group-hover/report:opacity-100 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        props.onSelectReport(item.data, true);
                                                    }}
                                                    title="Add and keep menu open"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}

                            {hasMore && (
                                <div className="px-4 py-2 text-xs text-center text-gray-400 italic border-t border-gray-100">
                                    Showing first {MAX_ITEMS} results. Refine search to see more.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return ReactDOM.createPortal(menuContent, document.body);
};

export default ReportDropdownMenu;
