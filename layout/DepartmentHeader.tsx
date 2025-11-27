import React, { useState } from 'react';
import { ChevronDown, Table, BarChart, Image, CreditCard, PieChart, Activity, Square, Columns, Layout, Grid, LayoutDashboard, FileText, Edit, Eye, Monitor, HelpCircle, XCircle, Database, BarChart2, ShoppingCart, Warehouse, Ship, Calendar, Car, PlusIcon } from 'lucide-react';

import { useToast } from '../ui/Toast';

import { useNavigation } from '../contexts/NavigationContext';
import { useUI } from '../contexts/UIContext';
import PaymentRequestModal from '../features/vendors/components/PaymentRequestModal';
import AddReportModal from '../features/reports/components/AddReportModal';
import procurementTemplates from '../data/templates/procurement_tables.json';
import financeTemplates from '../data/templates/finance_tables.json';
import TableTemplateModal from '../features/home/components/TableTemplateModal';

// ... (existing imports)

interface DepartmentHeaderProps {
    onInsert?: (type: string, data?: any) => void;
}

const DepartmentHeader: React.FC<DepartmentHeaderProps> = ({ onInsert }) => {
    const { getPageTitle, activePage, setActivePage } = useNavigation();
    const pageTitle = getPageTitle();
    const { showToast } = useToast();
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isPaymentRequestOpen, setIsPaymentRequestOpen] = useState(false);
    const [isAddReportOpen, setIsAddReportOpen] = useState(false);
    const [isTableTemplateOpen, setIsTableTemplateOpen] = useState(false);

    // Determine which templates to show based on active page
    const getTableTemplates = () => {
        if (activePage.includes('supply-chain/procurement')) {
            return procurementTemplates;
        }
        if (activePage.includes('finance')) {
            return financeTemplates;
        }
        // Add other departments here in the future
        return [];
    };

    // Helper to check if we are on an analytics page
    const isAnalyticsPage = activePage.includes('/analytics');
    // Helper to check if we are on a data page
    const isDataPage = activePage.includes('/data');

    const handleAddReport = (report: any) => {
        onInsert?.('report-template', report);
        showToast(`Added "${report["Report Title"]}" to dashboard`, 'success');
        setIsAddReportOpen(false);
    };

    const handleAddTableTemplate = (template: any) => {
        onInsert?.('table-template', template);
        showToast(`Added "${template.title}" table`, 'success');
        setIsTableTemplateOpen(false);
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
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between flex-shrink-0 z-20 select-none">
            <div className="flex items-center h-full">
                {/* Breadcrumb / Title */}
                <div className="flex items-center mr-4 pr-4 border-r border-gray-200 h-6 min-w-[320px] flex-shrink-0 relative">
                    <span
                        className="text-sm font-semibold text-gray-700 flex items-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors whitespace-nowrap"
                        onClick={() => setActiveMenu(activeMenu === 'breadcrumb' ? null : 'breadcrumb')}
                    >
                        {pageTitle} <ChevronDown size={12} className="ml-1 text-gray-400 flex-shrink-0" />
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
                                                    const basePath = activePage.substring(0, activePage.lastIndexOf('/'));
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
                                                    const basePath = activePage.substring(0, activePage.lastIndexOf('/'));
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
                < div className="flex items-center space-x-1" >
                    {
                        menuItems.map((menu) => (
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
                                        <div className="absolute top-full left-0 mt-1 w-72 bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-xl py-1.5 z-20 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
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
                                                    {isDataPage && (
                                                        <button
                                                            className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors"
                                                            onClick={() => {
                                                                setIsTableTemplateOpen(true);
                                                                setActiveMenu(null);
                                                            }}
                                                        >
                                                            <div className="flex items-center">
                                                                <Table size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                                <div>
                                                                    <span className="font-medium">Table from Template</span>
                                                                    <p className="text-[10px] text-gray-400">Pre-configured columns</p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )}

                                                    {!isDataPage && (
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
                                                    )}

                                                    {/* Add Report - Only on Procurement Analytics */}
                                                    {isAnalyticsPage && activePage.includes('procurement') && (
                                                        <button
                                                            className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center group rounded-lg transition-colors"
                                                            onClick={() => {
                                                                setIsAddReportOpen(true);
                                                                setActiveMenu(null);
                                                            }}
                                                        >
                                                            <FileText size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                            <span>Add Report</span>
                                                        </button>
                                                    )}

                                                    {/* Conditionally render Tables option - Hide on Analytics pages */}
                                                    {!isAnalyticsPage && (
                                                        <div className="relative group/tables px-1">
                                                            <button
                                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group rounded-lg transition-colors"
                                                            >
                                                                <div className="flex items-center">
                                                                    <Table size={16} className="mr-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                                    <span>Tables</span>
                                                                </div>
                                                                <ChevronDown size={14} className="text-gray-400 -rotate-90 group-hover:text-blue-500" />
                                                            </button>
                                                            {/* Submenu */}
                                                            <div className="absolute left-full top-0 ml-1 w-64 bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-xl py-1.5 hidden group-hover/tables:block ring-1 ring-black/5">
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
                templates={getTableTemplates()}
            />
        </header >
    );
};



export default DepartmentHeader;
