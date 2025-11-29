import React, { useState, useRef } from 'react';
import { LayoutDashboard, ChevronDown } from 'lucide-react';
import DashboardDropdownMenu from '../shared/components/DashboardDropdownMenu';
import CategoryLayerModule from './components/CategoryLayerModule';

const WarehouseDashboard: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);

    // Mock Data based on "Category Layer Module" request
    const dashboardCategories = {
        "Advanced-Intelligence": {
            "Predictive Analytics": [
                { "Report Title": "Demand Forecasting" },
                { "Report Title": "Inventory Optimization" }
            ],
            "AI Insights": [
                { "Report Title": "Anomaly Detection" }
            ]
        },
        "Cognitive": {
            "Decision Support": [
                { "Report Title": "Supply Route Optimization" }
            ]
        },
        "Decision-AI": {
            "Automated Actions": [
                { "Report Title": "Auto-Replenishment Logs" }
            ]
        },
        "Operational": {
            "Daily Metrics": [
                { "Report Title": "Inbound/Outbound Flow" },
                { "Report Title": "Labor Efficiency" }
            ]
        },
        "SKU-Intelligence": {
            "Product Performance": [
                { "Report Title": "SKU Velocity" },
                { "Report Title": "Dead Stock Analysis" }
            ]
        }
    };

    const handleSelectModule = (moduleName: string, reports: any[]) => {
        setSelectedDashboard(moduleName);
        setIsMenuOpen(false);
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-50/50">
            {/* Toolbar */}
            <div className="px-8 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
                <div className="flex items-center">
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`
                                flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                                ${isMenuOpen
                                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }
                            `}
                        >
                            <LayoutDashboard size={16} className="mr-2" />
                            {selectedDashboard || "Select Dashboard"}
                            <ChevronDown size={14} className={`ml-2 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <DashboardDropdownMenu
                            isOpen={isMenuOpen}
                            categories={dashboardCategories}
                            onSelectModule={handleSelectModule}
                            onClose={() => setIsMenuOpen(false)}
                            parentRef={menuRef}
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
                {!selectedDashboard ? (
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Warehouse Intelligence</h2>
                            <p className="text-gray-500 mt-1">Select a category to view detailed analytics and AI-driven insights.</p>
                        </div>
                        {/* Reuse CategoryLayerModule as the landing view */}
                        <CategoryLayerModule onSelectCategory={(id) => console.log('Selected category:', id)} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                            <LayoutDashboard size={32} className="text-blue-500" />
                        </div>
                        <h2 className="text-xl font-medium text-gray-900 mb-2">{selectedDashboard}</h2>
                        <p>Dashboard content will appear here.</p>
                        <button
                            onClick={() => setSelectedDashboard(null)}
                            className="mt-4 text-blue-600 hover:underline text-sm"
                        >
                            Back to Categories
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WarehouseDashboard;
