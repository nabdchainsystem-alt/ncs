import React, { useState } from 'react';
import { ChevronDown, Table, BarChart, Image, CreditCard, PieChart, Activity, Square, Columns, Layout, Grid, LayoutDashboard, FileText, Edit, Eye, Monitor, HelpCircle } from 'lucide-react';

import { useToast } from '../ui/Toast';

import { useNavigation } from '../contexts/NavigationContext';
import { useUI } from '../contexts/UIContext';

interface DepartmentHeaderProps {
    onInsert?: (type: string) => void;
}

const DepartmentHeader: React.FC<DepartmentHeaderProps> = ({ onInsert }) => {
    const { getPageTitle, activePage } = useNavigation();
    const pageTitle = getPageTitle();
    const { showToast } = useToast();
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Helper to check if we are on an analytics page
    const isAnalyticsPage = activePage.includes('/analytics');
    // Helper to check if we are on a data page
    const isDataPage = activePage.includes('/data');

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
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between flex-shrink-0 z-20 select-none">
            <div className="flex items-center h-full">
                {/* Breadcrumb / Title */}
                <div className="flex items-center mr-4 pr-4 border-r border-gray-200 h-6 min-w-[320px] flex-shrink-0">
                    <span
                        className="text-sm font-semibold text-gray-700 flex items-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors whitespace-nowrap"
                        onClick={() => showToast('Breadcrumb navigation', 'info')}
                    >
                        {pageTitle} <ChevronDown size={12} className="ml-1 text-gray-400 flex-shrink-0" />
                    </span>
                </div>

                {/* Department Menu Bar */}
                <div className="flex items-center space-x-1">
                    {menuItems.map((menu) => (
                        <div key={menu.name} className="relative">
                            <button
                                className={`relative z-30 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-1.5 ${activeMenu === menu.name ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                onClick={() => setActiveMenu(activeMenu === menu.name ? null : menu.name)}
                            >
                                <span>{menu.name}</span>
                            </button>
                            {activeMenu === menu.name && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                                    <div className="absolute top-full left-0 mt-1 w-56 bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-xl py-1.5 z-20 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
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
                                                <button
                                                    className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors"
                                                    onClick={() => {
                                                        if (onInsert) onInsert('dashboard');
                                                        setActiveMenu(null);
                                                    }}
                                                >
                                                    <div className="flex items-center">
                                                        <LayoutDashboard size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                        <span>Dashboard</span>
                                                    </div>
                                                </button>

                                                {/* Conditionally render Custom Table option - Hide on Analytics pages */}
                                                {!isAnalyticsPage && (
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
                                                        <span className="text-xs text-gray-400 group-hover:text-blue-400">⌘T</span>
                                                    </button>
                                                )}

                                                {/* Conditionally render KPI Card option - Hide on Data pages */}
                                                {!isDataPage && (
                                                    <div className="relative group/kpi px-1">
                                                        <button
                                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors"
                                                        >
                                                            <div className="flex items-center">
                                                                <CreditCard size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                                <span>KPI Card</span>
                                                            </div>
                                                            <ChevronDown size={14} className="text-gray-400 -rotate-90 group-hover:text-blue-500" />
                                                        </button>
                                                        {/* Submenu */}
                                                        <div className="absolute left-full top-0 ml-1 w-48 bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-xl py-1.5 hidden group-hover/kpi:block ring-1 ring-black/5">
                                                            <button
                                                                className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center rounded-lg transition-colors"
                                                                onClick={() => {
                                                                    if (onInsert) onInsert('kpi-card-1');
                                                                    setActiveMenu(null);
                                                                }}
                                                            >
                                                                <Square size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500" />
                                                                <span>1 KPI</span>
                                                            </button>
                                                            <button
                                                                className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center rounded-lg transition-colors"
                                                                onClick={() => {
                                                                    if (onInsert) onInsert('kpi-card-2');
                                                                    setActiveMenu(null);
                                                                }}
                                                            >
                                                                <Columns size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500" />
                                                                <span>2 KPI</span>
                                                            </button>
                                                            <button
                                                                className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center rounded-lg transition-colors"
                                                                onClick={() => {
                                                                    if (onInsert) onInsert('kpi-card-3');
                                                                    setActiveMenu(null);
                                                                }}
                                                            >
                                                                <Layout size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500" />
                                                                <span>3 KPI</span>
                                                            </button>
                                                            <button
                                                                className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center rounded-lg transition-colors"
                                                                onClick={() => {
                                                                    if (onInsert) onInsert('kpi-card-4');
                                                                    setActiveMenu(null);
                                                                }}
                                                            >
                                                                <Grid size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500" />
                                                                <span>4 KPI</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Conditionally render Chart option - Hide on Data pages */}
                                                {!isDataPage && (
                                                    <div className="relative group/chart px-1">
                                                        <button
                                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors"
                                                        >
                                                            <div className="flex items-center">
                                                                <PieChart size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                                <span>Chart</span>
                                                            </div>
                                                            <ChevronDown size={14} className="text-gray-400 -rotate-90 group-hover:text-blue-500" />
                                                        </button>
                                                        {/* Submenu */}
                                                        <div className="absolute left-full top-0 ml-1 w-48 bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-xl py-1.5 hidden group-hover/chart:block ring-1 ring-black/5">
                                                            <button
                                                                className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center rounded-lg transition-colors"
                                                                onClick={() => {
                                                                    if (onInsert) onInsert('chart-bar');
                                                                    setActiveMenu(null);
                                                                }}
                                                            >
                                                                <BarChart size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500" />
                                                                <span>Bar Chart</span>
                                                            </button>
                                                            <button
                                                                className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center rounded-lg transition-colors"
                                                                onClick={() => {
                                                                    if (onInsert) onInsert('chart-line');
                                                                    setActiveMenu(null);
                                                                }}
                                                            >
                                                                <Activity size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500" />
                                                                <span>Line Chart</span>
                                                            </button>
                                                            <button
                                                                className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center rounded-lg transition-colors"
                                                                onClick={() => {
                                                                    if (onInsert) onInsert('chart-pie');
                                                                    setActiveMenu(null);
                                                                }}
                                                            >
                                                                <PieChart size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500" />
                                                                <span>Pie Chart</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                <button className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center group rounded-lg transition-colors">
                                                    <Image size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                    <span>Image</span>
                                                </button>
                                            </>
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
                    ))}
                </div>
            </div>
        </header>
    );
};

// Helper icon for Insert since I didn't import PlusIcon
const PlusIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14" />
        <path d="M12 5v14" />
    </svg>
);

export default DepartmentHeader;
