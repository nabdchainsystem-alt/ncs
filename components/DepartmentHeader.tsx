import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useToast } from './Toast';

interface DepartmentHeaderProps {
    pageTitle: string;
    activePage: string;
    onInsert?: (type: string) => void;
}

const DepartmentHeader: React.FC<DepartmentHeaderProps> = ({ pageTitle, activePage, onInsert }) => {
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
                                                <button
                                                    className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                                                    onClick={() => {
                                                        if (onInsert) onInsert('custom-table');
                                                        setActiveMenu(null);
                                                    }}
                                                >
                                                    <span>Custom Table</span>
                                                    <span className="text-xs text-gray-400">⌘T</span>
                                                </button>
                                                <button className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Chart</button>
                                                <button className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Image</button>
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
