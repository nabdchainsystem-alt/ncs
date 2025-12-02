import React, { useState, useMemo, useRef } from 'react';
import { ChevronDown, Table, BarChart, Image, CreditCard, PieChart, Activity, Square, Columns, Layout, Grid, LayoutDashboard, FileText, Edit, Eye, Monitor, HelpCircle, XCircle, Database, BarChart2, ShoppingCart, Warehouse, Ship, Calendar, Car, PlusIcon, ChevronRight, Gauge, Plus } from 'lucide-react';

import { useToast } from '../ui/Toast';

import { useNavigation } from '../contexts/NavigationContext';
import { useUI } from '../contexts/UIContext';
import PaymentRequestModal from '../features/vendors/components/PaymentRequestModal';
import AddReportModal from '../features/reports/components/AddReportModal';
import procurementTemplates from '../data/templates/procurement_tables.json';
import financeTemplates from '../data/templates/finance_tables.json';
import TableTemplateModal from '../features/home/components/TableTemplateModal';
import procurementReports from '../data/reports/supply_chain_reports/procurement/procurement_reports.json';
import warehouseReports from '../data/reports/supply_chain_reports/warehouse/warehouse_reports.json';
import shippingReports from '../data/reports/supply_chain_reports/shipping/shipping_reports.json';
import DashboardDropdownMenu from '../features/shared/components/DashboardDropdownMenu';
import ReportDropdownMenu from '../features/shared/components/ReportDropdownMenu';
import procurementTables from '../data/reports/supply_chain_reports/procurement/procurement_tables.json';
import warehouseTables from '../data/reports/supply_chain_reports/warehouse/warehouse_tables.json';
import shippingTables from '../data/reports/supply_chain_reports/shipping/shipping_tables.json';
import planningReports from '../data/reports/supply_chain_reports/planning/planning_reports.json';
import planningTables from '../data/reports/supply_chain_reports/planning/planning_tables.json';
import fleetReports from '../data/reports/supply_chain_reports/fleet/fleet_reports.json';
import fleetTables from '../data/reports/supply_chain_reports/fleet/fleet_tables.json';
import vendorsReports from '../data/reports/supply_chain_reports/vendors/vendors_reports.json';
import vendorsTables from '../data/reports/supply_chain_reports/vendors/vendors_tables.json';

const WAREHOUSE_CATEGORIES = [
    "AI Optimization Intelligence",
    "AI Root-Cause Engine",
    "Automation ROI Analytics",
    "Cognitive Behavior Prediction",
    "Cold Chain Analytics",
    "Compliance & Governance",
    "Cycle Counting",
    "Damage & Safety",
    "Data Quality & Trust",
    "Decision AI Recommendations",
    "Digital Twin Analytics",
    "Dock & Yard Intelligence",
    "Dock Management",
    "End-to-End Flow Optimization",
    "End-to-End Warehouse Cycle",
    "Energy & Sustainability Intelligence",
    "Energy Consumption",
    "Equipment Health Prediction",
    "Equipment Maintenance",
    "Equipment Utilization",
    "Financial Impact Modeling",
    "Inbound Operations",
    "Inventory Accuracy",
    "Inventory Aging",
    "Inventory Health",
    "Inventory Stability",
    "Labor Productivity",
    "Labor Scheduling",
    "Micro-Decision Signals",
    "Multi-Warehouse Network",
    "Multi-Warehouse Optimization",
    "Outbound Operations",
    "Picking Productivity",
    "Picking Quality",
    "Predictive Disruption",
    "Process Mining & Discovery",
    "Putaway Operations",
    "Replenishment Flow",
    "Robotics Analytics",
    "Safety Intelligence",
    "SKU Aging",
    "SKU Damage Rate",
    "SKU Demand Forecast",
    "SKU Exceptions & Risk",
    "SKU Pick Frequency",
    "SKU Profitability",
    "SKU Replenishment Need",
    "SKU Slotting",
    "SKU Stock Health",
    "SKU Velocity",
    "SLA Intelligence",
    "Slotting Optimization",
    "Space Utilization",
    "Spatial Analytics",
    "Storage Systems",
    "Supplier-Warehouse-Shipping Chain Analytics",
    "Sustainability (Green Ops)",
    "Warehouse Cost",
    "Warehouse Exceptions",
    "Warehouse Financial Analytics",
    "Warehouse Flow Efficiency",
    "Warehouse Routing",
    "Workforce Behavioral Analytics",
    "Workforce Cognitive Load",
    "Yard Management"
];

const WAREHOUSE_MODULES = [
    "AI Anomaly Detection",
    "AI Operational Forecast",
    "AI SKU Drift Detection",
    "Batch Picking",
    "Bottleneck Mapping",
    "Capacity Forecasting",
    "Cluster Picking",
    "Cost Breakdown Engine",
    "Cost-to-Serve Model",
    "Cycle Count Strategy",
    "Cycle Count Variance Detection",
    "Dead Stock Analysis",
    "Demand-SKU Correlation",
    "Dock Load Efficiency",
    "Dock Unload Efficiency",
    "Equipment Breakdown Prediction",
    "Equipment Health Index",
    "Exception Classification Engine",
    "Inbound Accuracy",
    "Inventory Aging Engine",
    "Labor Productivity Model",
    "Labor Shift Utilization",
    "Labor-SKU Interaction Analytics",
    "Multi-Warehouse Benchmark",
    "Network Comparison Model",
    "Operational Delay Detection",
    "Outbound Accuracy",
    "Performance Heatmap",
    "Picking Route Engine",
    "Putaway Accuracy",
    "Putaway Speed",
    "Replenishment Prediction",
    "Replenishment Timing",
    "SKU ABC Classification",
    "SKU Cycle Time Analytics",
    "SKU Damage Tracking",
    "SKU Demand Forecast",
    "SKU Exception Detection",
    "SKU Expiry Tracking",
    "SKU Pattern Mining",
    "SKU Picking Time Analysis",
    "SKU Profit Model",
    "SKU Service Impact Model",
    "SKU Storage Footprint",
    "SKU Turnover Rate",
    "SKU Velocity Heatmap",
    "SKU XYZ Classification",
    "SKU-Level Route Mapping",
    "SKU-Loss Prevention",
    "Slow Movers",
    "Storage Bin Optimization",
    "Top Movers",
    "Warehouse Forecast Engine",
    "Warehouse Heatmap Engine",
    "Warehouse Risk Scoring",
    "Warehouse SLA Mapping",
    "Zone Picking"
];

interface DepartmentHeaderProps {
    onInsert?: (type: string, data?: any) => void;
    activeTabName?: string;
}

const DepartmentHeader: React.FC<DepartmentHeaderProps> = ({ onInsert, activeTabName }) => {
    const { getPageTitle, activePage, setActivePage } = useNavigation();

    const reportsData = useMemo(() => {
        if (activePage.includes('supply-chain/warehouse')) {
            return warehouseReports as any[];
        }
        if (activePage.includes('supply-chain/shipping')) {
            return shippingReports as any[];
        }
        if (activePage.includes('supply-chain/planning')) {
            return planningReports as any[];
        }
        if (activePage.includes('supply-chain/fleet')) {
            return fleetReports as any[];
        }
        if (activePage.includes('supply-chain/vendors')) {
            return vendorsReports as any[];
        }
        return procurementReports as any[];
    }, [activePage]);
    const pageTitle = getPageTitle();
    const { showToast } = useToast();
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isPaymentRequestOpen, setIsPaymentRequestOpen] = useState(false);
    const [isAddReportOpen, setIsAddReportOpen] = useState(false);
    const [isTableTemplateOpen, setIsTableTemplateOpen] = useState(false);
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

    // Dashboard Mega Menu State
    const [isDashboardMegaMenuOpen, setIsDashboardMegaMenuOpen] = useState(false);
    const dashboardMenuRef = useRef<HTMLDivElement>(null);

    // Report Mega Menu State
    const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
    const reportMenuRef = useRef<HTMLDivElement>(null);

    // Shared Menu Closing Logic
    const activeMenuCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const clearActiveMenuCloseTimeout = () => {
        if (activeMenuCloseTimeoutRef.current) {
            clearTimeout(activeMenuCloseTimeoutRef.current);
            activeMenuCloseTimeoutRef.current = null;
        }
    };

    // Submenu Closing Logic
    const activeSubMenuCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const clearActiveSubMenuCloseTimeout = () => {
        if (activeSubMenuCloseTimeoutRef.current) {
            clearTimeout(activeSubMenuCloseTimeoutRef.current);
            activeSubMenuCloseTimeoutRef.current = null;
        }
    };

    const handleActiveMenuLeave = () => {
        clearActiveMenuCloseTimeout();
        activeMenuCloseTimeoutRef.current = setTimeout(() => {
            setActiveMenu(null);
            setIsDashboardMegaMenuOpen(false);
            setIsReportMenuOpen(false);
        }, 300);
    };

    const handleMenuEnter = () => {
        clearActiveMenuCloseTimeout();
        setIsReportMenuOpen(false); // Close other mega menu
        setIsDashboardMegaMenuOpen(true);
    };

    const handleMenuLeave = () => {
        // Delegate to shared closer
        handleActiveMenuLeave();
    };

    const handleReportMenuEnter = () => {
        clearActiveMenuCloseTimeout();
        setIsDashboardMegaMenuOpen(false); // Close other mega menu
        setIsReportMenuOpen(true);
    };

    const handleReportMenuLeave = () => {
        // Delegate to shared closer
        handleActiveMenuLeave();
    };

    // Determine which templates to show based on active page
    const getTableTemplates = () => {
        if (activePage.includes('supply-chain/procurement')) {
            return procurementTables;
        }
        if (activePage.includes('supply-chain/warehouse')) {
            return warehouseTables;
        }
        if (activePage.includes('supply-chain/shipping')) {
            return shippingTables;
        }
        if (activePage.includes('supply-chain/planning')) {
            return planningTables;
        }
        if (activePage.includes('supply-chain/fleet')) {
            return fleetTables;
        }
        if (activePage.includes('supply-chain/vendors')) {
            return vendorsTables;
        }
        // Add other departments here in the future
        return [];
    };

    // Helper to check if we are on an analytics page
    const isAnalyticsPage = activePage.includes('/analytics');
    // Helper to check if we are on a data page
    const isDataPage = activePage.includes('/data');

    // Group reports for Dashboard menu
    const dashboardCategories = useMemo(() => {
        const categories: Record<string, Record<string, any[]>> = {};

        if (activePage.includes('supply-chain/procurement') || activePage.includes('supply-chain/warehouse') || activePage.includes('supply-chain/shipping') || activePage.includes('supply-chain/planning') || activePage.includes('supply-chain/fleet') || activePage.includes('supply-chain/vendors')) {
            reportsData.forEach((report: any) => {
                const cat = report["Category 1 (Detailed)"];
                const mod = report["Module (Category 2)"];

                if (!categories[cat]) categories[cat] = {};
                if (!categories[cat][mod]) categories[cat][mod] = [];

                categories[cat][mod].push(report);
            });
        }

        return categories;
    }, [activePage]);

    const dashboardModules = useMemo(() => {
        const modules: Record<string, any[]> = {};

        if (activePage.includes('supply-chain/procurement') || activePage.includes('supply-chain/warehouse') || activePage.includes('supply-chain/shipping') || activePage.includes('supply-chain/planning') || activePage.includes('supply-chain/fleet') || activePage.includes('supply-chain/vendors')) {
            reportsData.forEach((report: any) => {
                const mod = report["Module (Category 2)"];
                if (!modules[mod]) modules[mod] = [];
                modules[mod].push(report);
            });
        }

        return modules;
    }, [activePage]);

    // Group reports for Add Report menu (Category -> Reports)
    const reportCategories = useMemo(() => {
        if (!activePage.includes('supply-chain/procurement') && !activePage.includes('supply-chain/warehouse') && !activePage.includes('supply-chain/shipping') && !activePage.includes('supply-chain/planning') && !activePage.includes('supply-chain/fleet') && !activePage.includes('supply-chain/vendors')) return {};

        const categories: Record<string, any[]> = {};

        reportsData.forEach((report: any) => {
            const cat = report["Category 1 (Detailed)"];
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(report);
        });

        return categories;
    }, [activePage]);

    const reportModules = useMemo(() => {
        if (!activePage.includes('supply-chain/procurement') && !activePage.includes('supply-chain/warehouse') && !activePage.includes('supply-chain/shipping') && !activePage.includes('supply-chain/planning') && !activePage.includes('supply-chain/fleet') && !activePage.includes('supply-chain/vendors')) return {};
        const modules: Record<string, any[]> = {};
        reportsData.forEach((report: any) => {
            const mod = report["Module (Category 2)"];
            if (!modules[mod]) modules[mod] = [];
            modules[mod].push(report);
        });
        return modules;
    }, [activePage]);

    const reportLayers = useMemo(() => {
        if (!activePage.includes('supply-chain/procurement') && !activePage.includes('supply-chain/warehouse') && !activePage.includes('supply-chain/shipping') && !activePage.includes('supply-chain/planning') && !activePage.includes('supply-chain/fleet') && !activePage.includes('supply-chain/vendors')) return {};
        const layers: Record<string, any[]> = {};
        reportsData.forEach((report: any) => {
            // Check if Layer exists, if not use "General" or skip
            const layer = report["Layer"] || "General";
            if (!layers[layer]) layers[layer] = [];
            layers[layer].push(report);
        });
        return layers;
    }, [activePage]);

    // Compute layers for dashboards (Layer -> Module -> Reports)
    const dashboardLayers = useMemo(() => {
        const layers: Record<string, Record<string, any[]>> = {};
        reportsData.forEach((report: any) => {
            const layer = report["Layer"] || "General";
            // Use Sub-Layer for grouping in Layer view, fallback to Module if needed, or 'General'
            const sub = report["Sub-Layer"] || report["Module (Category 2)"] || "General";

            if (!layers[layer]) {
                layers[layer] = {};
            }
            if (!layers[layer][sub]) {
                layers[layer][sub] = [];
            }
            layers[layer][sub].push(report);
        });
        return layers;
    }, [activePage]);

    const handleAddReport = (report: any, keepOpen?: boolean) => {
        onInsert?.('report-template', report);
        showToast(`Added "${report["Report Title"]}" to dashboard`, 'success');
        if (!keepOpen) {
            setIsAddReportOpen(false);
            setActiveMenu(null);
            setIsReportMenuOpen(false);
        }
    };

    const handleAddTableTemplate = (template: any, keepOpen?: boolean) => {
        onInsert?.('table-template', template);
        showToast(`Added "${template.title}" table`, 'success');
        if (!keepOpen) {
            setIsTableTemplateOpen(false);
            setActiveMenu(null);
        }
    };

    const handleCreateDashboardTemplate = (moduleName: string, reports: any[], keepOpen?: boolean) => {
        onInsert?.('dashboard-template', { moduleName, reports });
        showToast(`Creating dashboard for ${moduleName}...`, 'success');
        if (!keepOpen) {
            setActiveMenu(null);
            setIsDashboardMegaMenuOpen(false);
        }
    };

    const menuItems = [
        { name: 'File', icon: FileText },
        { name: 'Edit', icon: Edit },
        { name: 'Insert', icon: PlusIcon },
        ...(!isDataPage ? [{ name: 'Layout', icon: Layout }] : []),
        { name: 'View', icon: Eye },
        { name: 'Window', icon: Monitor },
        { name: 'Help', icon: HelpCircle }
    ];

    return (
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between flex-shrink-0 z-40 select-none">
            <div className="flex items-center h-full">
                {/* Breadcrumb / Title */}
                <div className="flex items-center mr-4 pr-4 border-r border-gray-200 h-6 min-w-[320px] flex-shrink-0 relative">
                    <span
                        className="text-sm font-semibold text-gray-700 flex items-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors whitespace-nowrap"
                        onClick={() => setActiveMenu(activeMenu === 'breadcrumb' ? null : 'breadcrumb')}
                    >
                        {pageTitle}
                        {activeTabName && <span className="text-gray-400 font-normal mx-2">/</span>}
                        {activeTabName && <span className="text-gray-600 font-medium">{activeTabName}</span>}
                        <ChevronDown size={12} className="ml-1 text-gray-400 flex-shrink-0" />
                    </span>

                    {activeMenu === 'breadcrumb' && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-20 py-2 animate-in fade-in zoom-in-95 duration-100">
                                {activePage.includes('/') && (
                                    <>
                                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Switch View
                                        </div>
                                        <div className="px-2 pb-2">
                                            <button
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center ${activePage.endsWith('/data') ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                                onClick={() => {
                                                    const isSubPage = activePage.endsWith('/data') || activePage.endsWith('/analytics');
                                                    const basePath = isSubPage ? activePage.substring(0, activePage.lastIndexOf('/')) : activePage;
                                                    setActivePage(`${basePath}/data`);
                                                    setActiveMenu(null);
                                                }}
                                            >
                                                <Database size={14} className="mr-2" />
                                                Data
                                            </button>
                                            <button
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center ${activePage.endsWith('/analytics') ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                                onClick={() => {
                                                    const isSubPage = activePage.endsWith('/data') || activePage.endsWith('/analytics');
                                                    const basePath = isSubPage ? activePage.substring(0, activePage.lastIndexOf('/')) : activePage;
                                                    setActivePage(`${basePath}/analytics`);
                                                    setActiveMenu(null);
                                                }}
                                            >
                                                <BarChart2 size={14} className="mr-2" />
                                                Analytics
                                            </button>
                                        </div>
                                        <div className="border-t border-gray-100 my-1"></div>
                                    </>
                                )}

                                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Departments
                                </div>
                                <div className="px-2 max-h-64 overflow-y-auto">
                                    {[
                                        { id: 'supply-chain/procurement', name: 'Procurement', icon: ShoppingCart },
                                        { id: 'supply-chain/warehouse', name: 'Warehouse', icon: Warehouse },
                                        { id: 'supply-chain/shipping', name: 'Shipping', icon: Ship },
                                        { id: 'supply-chain/planning', name: 'Planning', icon: Calendar },
                                        { id: 'supply-chain/fleet', name: 'Fleet', icon: Car },
                                    ].map(dept => (
                                        <button
                                            key={dept.id}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center ${activePage.includes(dept.id) ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                            onClick={() => {
                                                // Default to data view when switching departments
                                                setActivePage(`${dept.id}/data`);
                                                setActiveMenu(null);
                                            }}
                                        >
                                            <dept.icon size={14} className="mr-2" />
                                            {dept.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div >

                {/* Department Menu Bar */}
                <div className="flex items-center space-x-1" onMouseLeave={handleActiveMenuLeave} onMouseEnter={clearActiveMenuCloseTimeout}>
                    {
                        menuItems.map((menu) => (
                            <div key={menu.name} className="relative"
                                onMouseEnter={() => {
                                    clearActiveMenuCloseTimeout();
                                    if (activeMenu) setActiveMenu(menu.name);
                                }}
                            >
                                <button
                                    className={`relative z-30 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-1.5 ${activeMenu === menu.name ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                    onClick={() => setActiveMenu(activeMenu === menu.name ? null : menu.name)}
                                >
                                    <span>{menu.name}</span>
                                </button>
                                {activeMenu === menu.name && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                                        <div
                                            className="absolute top-full left-0 mt-1 w-72 bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-xl py-1.5 z-50 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
                                            onMouseEnter={clearActiveMenuCloseTimeout}
                                            onMouseLeave={handleActiveMenuLeave}
                                        >
                                            {menu.name === 'Layout' ? (
                                                <>
                                                    <button
                                                        className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-600 flex items-center justify-between group rounded-lg transition-colors"
                                                        onClick={() => {
                                                            if (onInsert) onInsert('layout-clear');
                                                            setActiveMenu(null);
                                                        }}
                                                    >
                                                        <div className="flex items-center">
                                                            <XCircle size={16} className="mr-2.5 text-red-400 group-hover:text-red-500 transition-colors" />
                                                            <span>Clear layout</span>
                                                        </div>
                                                    </button>
                                                    <div className="border-t border-gray-100 my-1" />
                                                </>
                                            ) : null}
                                            {menu.name === 'Layout' ? (
                                                <button
                                                    className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors"
                                                    onClick={() => {
                                                        if (onInsert) onInsert('layout-4kpi-1chart');
                                                        setActiveMenu(null);
                                                    }}
                                                >
                                                    <div className="flex items-center">
                                                        <Layout size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                        <span>4 KPI 1 Chart</span>
                                                    </div>
                                                </button>
                                            ) : menu.name === 'Insert' ? (
                                                <>
                                                    {/* Table Template Option - Visible on Data Pages */}
                                                    {isDataPage && (activePage.includes('supply-chain/procurement') || activePage.includes('supply-chain/warehouse') || activePage.includes('supply-chain/shipping') || activePage.includes('supply-chain/planning') || activePage.includes('supply-chain/fleet') || activePage.includes('supply-chain/vendors')) && (
                                                        <div className="relative group/table px-1">
                                                            <button
                                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors"
                                                            >
                                                                <div className="flex items-center">
                                                                    <Table size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                                    <span>Table</span>
                                                                </div>
                                                                <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-500" />
                                                            </button>

                                                            {/* Table Submenu */}
                                                            <div className="absolute left-full top-0 ml-1 w-64 bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-xl py-1.5 hidden group-hover/table:block animate-in fade-in zoom-in-95 duration-100 z-50">
                                                                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
                                                                    {activePage.includes('supply-chain/procurement') ? 'Procurement Tables' : activePage.includes('supply-chain/warehouse') ? 'Warehouse Tables' : activePage.includes('supply-chain/shipping') ? 'Shipping Tables' : activePage.includes('supply-chain/planning') ? 'Planning Tables' : activePage.includes('supply-chain/fleet') ? 'Fleet Tables' : 'Vendors Tables'}
                                                                </div>
                                                                <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                                                                    {(activePage.includes('supply-chain/procurement') ? procurementTables : activePage.includes('supply-chain/warehouse') ? warehouseTables : activePage.includes('supply-chain/shipping') ? shippingTables : activePage.includes('supply-chain/planning') ? planningTables : activePage.includes('supply-chain/fleet') ? fleetTables : vendorsTables).map((table) => (
                                                                        <button
                                                                            key={table.table_id}
                                                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center group/item transition-colors"
                                                                            onClick={() => {
                                                                                if (onInsert) {
                                                                                    onInsert('table-template', {
                                                                                        title: table.display_name,
                                                                                        columns: table.columns.map(col => ({
                                                                                            id: col.name,
                                                                                            name: col.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                                                                                            type: col.type === 'string' ? 'text' : (col.type === 'number' ? 'number' : 'text'),
                                                                                            width: 150
                                                                                        }))
                                                                                    });
                                                                                }
                                                                                setActiveMenu(null);
                                                                            }}
                                                                        >
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2.5 group-hover/item:bg-blue-500 transition-colors"></div>
                                                                            <span className="truncate">{table.display_name}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}




                                                    {!isDataPage && (
                                                        <div
                                                            className="relative group/dashboard px-1"
                                                            onMouseEnter={handleMenuEnter}
                                                            onMouseLeave={handleMenuLeave}
                                                            ref={dashboardMenuRef}
                                                        >
                                                            <button
                                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors"
                                                                onClick={() => {
                                                                    if (onInsert) onInsert('dashboard');
                                                                    setActiveMenu(null);
                                                                }}
                                                            >
                                                                <div className="flex items-center">
                                                                    <LayoutDashboard size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                                    <span>Dashboard</span>
                                                                </div>
                                                                {/* Show chevron only if we have categories (Procurement) */}
                                                                {Object.keys(dashboardCategories).length > 0 && (
                                                                    <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-500" />
                                                                )}
                                                            </button>

                                                            {/* Mega Menu */}
                                                            {Object.keys(dashboardCategories).length > 0 && (
                                                                <DashboardDropdownMenu
                                                                    isOpen={isDashboardMegaMenuOpen}
                                                                    categories={dashboardCategories}
                                                                    modules={dashboardModules}
                                                                    layers={dashboardLayers}
                                                                    tabs={(activePage.includes('supply-chain/warehouse') || activePage.includes('supply-chain/procurement') || activePage.includes('supply-chain/shipping') || activePage.includes('supply-chain/planning') || activePage.includes('supply-chain/fleet') || activePage.includes('supply-chain/vendors'))
                                                                        ? [
                                                                            { id: 'category', label: 'Category' },
                                                                            { id: 'layer', label: 'Layer' },
                                                                            { id: 'module', label: 'Module' }
                                                                        ]
                                                                        : undefined
                                                                    }
                                                                    customCategories={undefined}
                                                                    customModules={undefined}
                                                                    onSelectModule={(moduleName, reports, keepOpen) => {
                                                                        onInsert?.('dashboard-template', { moduleName, reports });
                                                                        if (!keepOpen) setActiveMenu(null);
                                                                    }}
                                                                    onClose={() => setActiveMenu(null)}
                                                                    parentRef={dashboardMenuRef}
                                                                    onMouseEnter={handleMenuEnter}
                                                                    onMouseLeave={handleMenuLeave}
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Add Report - Categorized Dropdown (Refactored) */}
                                                    {isAnalyticsPage && (activePage.includes('procurement') || activePage.includes('supply-chain/warehouse') || activePage.includes('supply-chain/shipping') || activePage.includes('supply-chain/planning') || activePage.includes('supply-chain/fleet') || activePage.includes('supply-chain/vendors')) && (
                                                        <div
                                                            className="relative group/reports px-1"
                                                            onMouseEnter={handleReportMenuEnter}
                                                            onMouseLeave={handleReportMenuLeave}
                                                            ref={reportMenuRef}
                                                        >
                                                            <button
                                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors"
                                                                onClick={() => {
                                                                    // Optional: Click behavior if needed, currently hover opens menu
                                                                }}
                                                            >
                                                                <div className="flex items-center">
                                                                    <FileText size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                                    <span>Report</span>
                                                                </div>
                                                                <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-500" />
                                                            </button>

                                                            {/* Mega Menu */}
                                                            <ReportDropdownMenu
                                                                isOpen={isReportMenuOpen}
                                                                categories={reportCategories}
                                                                modules={reportModules}
                                                                layers={reportLayers}
                                                                onSelectReport={(report, keepOpen) => handleAddReport(report, keepOpen)}
                                                                onClose={() => {
                                                                    setIsReportMenuOpen(false);
                                                                    setActiveMenu(null);
                                                                }}
                                                                onMouseEnter={handleReportMenuEnter}
                                                                onMouseLeave={handleReportMenuLeave}
                                                                parentRef={reportMenuRef}
                                                                customCategories={activePage.includes('supply-chain/warehouse') ? WAREHOUSE_CATEGORIES : undefined}
                                                                customModules={activePage.includes('supply-chain/warehouse') ? WAREHOUSE_MODULES : undefined}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Conditionally render Tables option - Hide on Analytics pages */}
                                                    {!isAnalyticsPage && (
                                                        <div
                                                            className="relative group/tables px-1"
                                                            onMouseEnter={() => {
                                                                clearActiveMenuCloseTimeout();
                                                                clearActiveSubMenuCloseTimeout();
                                                                setActiveSubMenu('tables');
                                                            }}
                                                            onMouseLeave={() => {
                                                                activeSubMenuCloseTimeoutRef.current = setTimeout(() => {
                                                                    setActiveSubMenu(null);
                                                                }, 100);
                                                            }}
                                                        >
                                                            <button
                                                                className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors ${activeSubMenu === 'tables' ? 'bg-blue-50 text-blue-600' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveSubMenu(activeSubMenu === 'tables' ? null : 'tables');
                                                                }}
                                                            >
                                                                <div className="flex items-center">
                                                                    <Table size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                                    <span>Tables</span>
                                                                </div>
                                                                <ChevronRight size={14} className={`text-gray-400 transition-transform duration-200 group-hover:text-blue-500 ${activeSubMenu === 'tables' ? 'text-blue-500' : ''}`} />
                                                            </button>
                                                            {/* Submenu */}
                                                            {activeSubMenu === 'tables' && (
                                                                <div className="absolute left-full top-0 pl-2 w-64 z-50">
                                                                    <div className="bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-xl py-1.5 ring-1 ring-black/5">
                                                                        {isDataPage && Array.isArray(getTableTemplates()) && getTableTemplates().map((template: any, index: number) => (
                                                                            <div key={index} className="w-[calc(100%-8px)] mx-1 flex items-center justify-between group rounded-lg transition-colors hover:bg-blue-50 pr-1">
                                                                                <button
                                                                                    className="flex-1 text-left px-3 py-2 text-sm text-gray-700 hover:text-blue-600 flex items-center"
                                                                                    onClick={() => {
                                                                                        handleAddTableTemplate(template);
                                                                                        setActiveMenu(null);
                                                                                    }}
                                                                                >
                                                                                    <Table size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                                                    <span>{template.title}</span>
                                                                                </button>
                                                                                <button
                                                                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-200 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleAddTableTemplate(template, true);
                                                                                    }}
                                                                                    title="Add and keep menu open"
                                                                                >
                                                                                    <Plus size={14} />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                        <div className="border-t border-gray-100 my-1"></div>
                                                                        <button
                                                                            className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors"
                                                                            onClick={() => {
                                                                                if (onInsert) onInsert('custom-table');
                                                                                setActiveMenu(null);
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center">
                                                                                <Table size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                                                <span>Custom Table</span>
                                                                            </div>
                                                                        </button>
                                                                        {activePage === 'supply-chain/procurement/data' && (
                                                                            <button
                                                                                className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors"
                                                                                onClick={() => {
                                                                                    if (onInsert) onInsert('requests-table');
                                                                                    setActiveMenu(null);
                                                                                }}
                                                                            >
                                                                                <div className="flex items-center">
                                                                                    <Table size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                                                    <span>Requests Table</span>
                                                                                </div>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}





                                                </>
                                            ) : menu.name === 'File' && activePage === 'supply-chain/vendors/analytics' ? (
                                                <div className="relative group/new px-1">
                                                    <button
                                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors"
                                                    >
                                                        <div className="flex items-center">
                                                            <FileText size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                            <span>New</span>
                                                        </div>
                                                        <ChevronDown size={14} className="text-gray-400 -rotate-90 group-hover:text-blue-500" />
                                                    </button>
                                                    {/* Submenu */}
                                                    <div className="absolute left-full top-0 ml-1 w-48 bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-xl py-1.5 hidden group-hover/new:block ring-1 ring-black/5">
                                                        <button
                                                            className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center rounded-lg transition-colors"
                                                            onClick={() => {
                                                                setIsPaymentRequestOpen(true);
                                                                setActiveMenu(null);
                                                            }}
                                                        >
                                                            <CreditCard size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500" />
                                                            <span>Payment Request</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                ['1', '2', '3', '4', '5'].map((item) => (
                                                    <button
                                                        key={item}
                                                        className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center"
                                                        onClick={() => {
                                                            showToast(`${menu.name} Item ${item} clicked`, 'success');
                                                            setActiveMenu(null);
                                                        }}
                                                    >
                                                        <span className="w-4 h-4 mr-2.5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600">
                                                            {item}
                                                        </span>
                                                        {menu.name} Item {item}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    }
                </div >
            </div >
            <PaymentRequestModal isOpen={isPaymentRequestOpen} onClose={() => setIsPaymentRequestOpen(false)} />
            <AddReportModal isOpen={isAddReportOpen} onClose={() => setIsAddReportOpen(false)} onAddReport={handleAddReport} />
            <TableTemplateModal
                isOpen={isTableTemplateOpen}
                onClose={() => setIsTableTemplateOpen(false)}
                onSelectTemplate={handleAddTableTemplate}
                templates={Array.isArray(getTableTemplates()) ? getTableTemplates() : []}
            />
        </header >
    );
};

export default DepartmentHeader;
