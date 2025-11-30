import React, { useState } from 'react';
import { X, LayoutTemplate, ShoppingCart, Users, Package, Truck, Anchor, Calendar } from 'lucide-react';
import { useToast } from '../../../ui/Toast';
import reportsData from '../../../data/mockReports';

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Tab {
    id: string;
    label: string;
    icon: React.ReactNode;
    indent?: boolean;
}

interface Report {
    id: number;
    level: string;
    title: string;
    description: string;
    category: string;
    chartType: string;
    dataFields: string[];
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('full-supply-chain');
    const { showToast } = useToast();

    if (!isOpen) return null;

    const tabs: Tab[] = [
        { id: 'full-supply-chain', label: 'Full Supply Chain', icon: <LayoutTemplate size={18} /> },
        { id: 'full-procurements', label: 'Full Procurements', icon: <ShoppingCart size={18} /> },
        { id: 'procurements-requests', label: 'Procurments / Requests', icon: <ShoppingCart size={18} />, indent: true },
        { id: 'procurements-orders', label: 'Procurments / Orders', icon: <ShoppingCart size={18} />, indent: true },
        { id: 'procurements-vendors', label: 'Procurments / Vendors', icon: <Users size={18} />, indent: true },
        { id: 'full-warehouse', label: 'Full Warehouse', icon: <Package size={18} /> },
        { id: 'warehouse-inventory', label: 'Warehouse / Inventory', icon: <Package size={18} />, indent: true },
        { id: 'warehouse-shipping', label: 'Warehouse / Shipping', icon: <Truck size={18} />, indent: true },
        { id: 'fleet', label: 'Fleet', icon: <Anchor size={18} /> },
        { id: 'planning', label: 'Planning', icon: <Calendar size={18} /> },
    ];

    const getFilteredReports = (): Report[] => {
        const reports = reportsData as Report[];

        if (activeTab === 'full-supply-chain') {
            return reports;
        }

        switch (activeTab) {
            case 'full-procurements':
                return reports.filter(r => r.category.includes('Procurements'));
            case 'procurements-requests':
                return reports.filter(r => r.category === 'Procurements / Requests');
            case 'procurements-orders':
                return reports.filter(r => r.category === 'Procurements / Orders');
            case 'procurements-vendors':
                return reports.filter(r => r.category === 'Procurements / Vendors');
            case 'full-warehouse':
                return reports.filter(r => r.category.includes('Warehouse'));
            case 'warehouse-inventory':
                return reports.filter(r => r.category === 'Warehouse / Inventory');
            case 'warehouse-shipping':
                return reports.filter(r => r.category === 'Warehouse / Shipping');
            case 'fleet':
                return reports.filter(r => r.category === 'Fleet');
            case 'planning':
                return reports.filter(r => r.category === 'Planning');
            default:
                return [];
        }
    };

    const filteredReports = getFilteredReports();

    const handleReportClick = (report: Report) => {
        showToast(`Report "${report.title}" selected! Feature coming soon.`, 'success');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-black rounded-lg">
                            <LayoutTemplate className="text-white" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Add Report</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex min-h-0">
                    {/* Sidebar */}
                    <div className="w-72 border-r border-gray-200 bg-gray-50 overflow-y-auto p-4 space-y-1 flex-shrink-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-black text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                    } ${tab.indent ? 'pl-8' : ''}`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Area */}
                    <div className="flex-1 bg-white p-8 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                            {filteredReports.map(report => (
                                <div
                                    key={report.id}
                                    className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-black transition-colors cursor-pointer flex flex-col h-64"
                                    onClick={() => handleReportClick(report)}
                                >
                                    {/* Top: Chart Preview Placeholder */}
                                    <div className="h-32 bg-gray-50 border-b border-gray-100 flex items-center justify-center">
                                        <span className="text-xs text-gray-400 uppercase tracking-wider">{report.chartType}</span>
                                    </div>

                                    {/* Bottom: Text Info */}
                                    <div className="flex-1 p-4 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{report.title}</h3>
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded whitespace-nowrap ml-2">
                                                    {report.level}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                                                {report.description}
                                            </p>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full truncate block">
                                                {report.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredReports.length === 0 && (
                                <div className="col-span-full text-center py-20 text-gray-400">
                                    <p>No reports found for this category.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateModal;
