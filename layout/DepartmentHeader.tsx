import React, { useState } from 'react';
import { ChevronDown, Table, BarChart, Image, CreditCard, PieChart, Activity } from 'lucide-react';
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

    const menuItems = ['File', 'Edit', 'Insert', 'View', 'Window', 'Help'];

    return (
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between flex-shrink-0 z-20 select-none">
            <div className="flex items-center h-full">
                {/* Breadcrumb / Title */}
                <div className="flex items-center mr-4 pr-4 border-r border-gray-200 h-6">
                    <span
                        className="text-sm font-semibold text-gray-700 flex items-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                        onClick={() => showToast('Breadcrumb navigation', 'info')}
                    >
                        {pageTitle} <ChevronDown size={12} className="ml-1 text-gray-400" />
                    </span>
                </div>

                {/* Department Menu Bar */}
                <div className="flex items-center space-x-6">
                    {menuItems.map((menu) => (
                        <div key={menu} className="relative">
                            <button
                                className={`px - 3 py - 1.5 text - sm rounded - md transition - colors ${activeMenu === menu ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} `}
                                onClick={() => setActiveMenu(activeMenu === menu ? null : menu)}
                            >
                                {menu}
                            </button>
                            {activeMenu === menu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20">
                                        {menu === 'Insert' ? (
                                            <>
                                                {activePage.endsWith('/data') && (
                                                    <button
                                                        className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between group"
                                                        onClick={() => {
                                                            if (onInsert) onInsert('custom-table');
                                                            setActiveMenu(null);
                                                        }}
                                                    >
                                                        <div className="flex items-center">
                                                            <Table size={14} className="mr-2 text-gray-400 group-hover:text-gray-600" />
                                                            <span>Custom Table</span>
                                                        </div>
                                                        <span className="text-xs text-gray-400">⌘T</span>
                                                    </button>
                                                )}
                                                {activePage.includes('analytics') && (
                                                    <button
                                                        className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between group"
                                                        onClick={() => {
                                                            if (onInsert) onInsert('kpi-card');
                                                            setActiveMenu(null);
                                                        }}
                                                    >
                                                        <div className="flex items-center">
                                                            <CreditCard size={14} className="mr-2 text-gray-400 group-hover:text-gray-600" />
                                                            <span>KPI Card</span>
                                                        </div>
                                                    </button>
                                                )}
                                                {activePage.includes('analytics') && (
                                                    <div className="relative group/chart">
                                                        <button
                                                            className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between group"
                                                        >
                                                            <div className="flex items-center">
                                                                <PieChart size={14} className="mr-2 text-gray-400 group-hover:text-gray-600" />
                                                                <span>Chart</span>
                                                            </div>
                                                            <ChevronDown size={12} className="text-gray-400 -rotate-90" />
                                                        </button>
                                                        {/* Submenu */}
                                                        <div className="absolute left-full top-0 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1 hidden group-hover/chart:block">
                                                            <button
                                                                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                                onClick={() => {
                                                                    if (onInsert) onInsert('chart-bar');
                                                                    setActiveMenu(null);
                                                                }}
                                                            >
                                                                <BarChart size={14} className="mr-2 text-gray-400" />
                                                                <span>Bar Chart</span>
                                                            </button>
                                                            <button
                                                                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                                onClick={() => {
                                                                    if (onInsert) onInsert('chart-line');
                                                                    setActiveMenu(null);
                                                                }}
                                                            >
                                                                <Activity size={14} className="mr-2 text-gray-400" />
                                                                <span>Line Chart</span>
                                                            </button>
                                                            <button
                                                                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                                onClick={() => {
                                                                    if (onInsert) onInsert('chart-pie');
                                                                    setActiveMenu(null);
                                                                }}
                                                            >
                                                                <PieChart size={14} className="mr-2 text-gray-400" />
                                                                <span>Pie Chart</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                <button className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center group">
                                                    <Image size={14} className="mr-2 text-gray-400 group-hover:text-gray-600" />
                                                    <span>Image</span>
                                                </button>
                                            </>
                                        ) : (
                                            ['1', '2', '3', '4', '5', '6', '7', '8'].map((item) => (
                                                <button
                                                    key={item}
                                                    className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                                                    onClick={() => {
                                                        showToast(`${menu} Item ${item} clicked`, 'success');
                                                        setActiveMenu(null);
                                                    }}
                                                >
                                                    {menu} Item {item}
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

export default DepartmentHeader;
