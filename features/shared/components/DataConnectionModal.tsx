import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, Table, Minus } from 'lucide-react';

interface DataConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableTables: any[];
    onConnect: (tableId: string, config: any) => void;
    widgetType: 'chart' | 'kpi-card';
}

const DataConnectionModal: React.FC<DataConnectionModalProps> = ({
    isOpen,
    onClose,
    availableTables,
    onConnect,
    widgetType
}) => {
    const [step, setStep] = useState<'select-table' | 'configure'>('select-table');
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [config, setConfig] = useState<any>({});

    useEffect(() => {
        if (isOpen) {
            setStep('select-table');
            setSelectedTableId(null);
            setConfig({});
        }
    }, [isOpen]);

    const handleSelectTable = (tableId: string) => {
        setSelectedTableId(tableId);
        setStep('configure');

        // Set defaults based on table columns
        const table = availableTables.find(t => t.id === tableId);
        if (table) {
            const textCol = table.columns.find((c: any) => c.type === 'text');
            const numCol = table.columns.find((c: any) => c.type === 'number');
            setConfig({
                xAxisColumn: textCol?.id || '',
                yAxisColumn: numCol?.id || '',
                aggregation: 'count'
            });
        }
    };

    const getSelectedTable = () => availableTables.find(t => t.id === selectedTableId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800">
                        {step === 'select-table' ? 'Select Data Source' : 'Configure Data'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Minus size={18} className="rotate-45" />
                    </button>
                </div>

                <div className="p-0 overflow-y-auto flex-1">
                    {step === 'select-table' ? (
                        <div className="p-2">
                            {availableTables.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center text-gray-500">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                        <Activity size={24} className="text-gray-400" />
                                    </div>
                                    <p className="font-medium">No tables found</p>
                                    <p className="text-sm mt-1">Create a table in the Data section first.</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {availableTables.map(table => (
                                        <button
                                            key={table.id}
                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg group transition-colors flex items-center justify-between border border-transparent hover:border-blue-100"
                                            onClick={() => handleSelectTable(table.id)}
                                        >
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                                                    <Table size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 group-hover:text-blue-700">{table.title || 'Untitled Table'}</div>
                                                    <div className="text-xs text-gray-500">{table.rows?.length || 0} records</div>
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Configuration Form */}
                            {widgetType === 'chart' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">X Axis (Category)</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            value={config.xAxisColumn}
                                            onChange={(e) => setConfig({ ...config, xAxisColumn: e.target.value })}
                                        >
                                            <option value="">Select Column...</option>
                                            {getSelectedTable()?.columns.map((col: any) => (
                                                <option key={col.id} value={col.id}>{col.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Y Axis (Value)</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            value={config.yAxisColumn}
                                            onChange={(e) => setConfig({ ...config, yAxisColumn: e.target.value })}
                                        >
                                            <option value="">Select Column...</option>
                                            {getSelectedTable()?.columns.map((col: any) => (
                                                <option key={col.id} value={col.id}>{col.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {widgetType === 'kpi-card' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            value={config.aggregation}
                                            onChange={(e) => setConfig({ ...config, aggregation: e.target.value })}
                                        >
                                            <option value="count">Count of Records</option>
                                            <option value="sum">Sum of Column</option>
                                            <option value="avg">Average of Column</option>
                                        </select>
                                    </div>
                                    {config.aggregation !== 'count' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
                                            <select
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                value={config.yAxisColumn}
                                                onChange={(e) => setConfig({ ...config, yAxisColumn: e.target.value })}
                                            >
                                                <option value="">Select Column...</option>
                                                {getSelectedTable()?.columns.filter((c: any) => c.type === 'number').map((col: any) => (
                                                    <option key={col.id} value={col.id}>{col.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
                    {step === 'select-table' ? (
                        <>
                            <span>Select a table to link.</span>
                            <button
                                className="text-gray-600 hover:text-gray-900 font-medium"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="text-gray-600 hover:text-gray-900 font-medium"
                                onClick={() => setStep('select-table')}
                            >
                                Back
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => selectedTableId && onConnect(selectedTableId, config)}
                            >
                                Finish
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataConnectionModal;
