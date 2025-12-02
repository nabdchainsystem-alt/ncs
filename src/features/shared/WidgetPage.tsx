import React, { useState } from 'react';
import { Activity, CheckCircle2, Minus, Table } from 'lucide-react';
import { useDashboardStore } from '../../stores/dashboardStore';
import { renderWidget } from '../../ui/widgets/registry';

interface WidgetPageProps {
    activePage: string;
}

const WidgetPage: React.FC<WidgetPageProps> = ({ activePage }) => {
    const { pageWidgets, updateWidget, removeWidget } = useDashboardStore();
    const widgets = pageWidgets[activePage] || [];

    const [connectingWidgetId, setConnectingWidgetId] = useState<string | null>(null);
    const [connectionStep, setConnectionStep] = useState<'select-table' | 'configure'>('select-table');
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [widgetConfig, setWidgetConfig] = useState<any>({});

    const getAvailableTables = () => {
        // Assuming structure is .../analytics and we want .../data
        // Check if activePage ends with /analytics
        if (activePage.endsWith('/analytics')) {
            const dataPage = activePage.replace(/\/analytics$/, '/data');
            const dataWidgets = pageWidgets[dataPage] || [];
            return dataWidgets.filter(w => w.type === 'custom-table');
        }
        return [];
    };

    const handleStartConnect = (widgetId: string) => {
        setConnectingWidgetId(widgetId);
        setConnectionStep('select-table');
        setSelectedTableId(null);
        setWidgetConfig({});
    };

    const handleSelectTable = (tableId: string) => {
        setSelectedTableId(tableId);
        setConnectionStep('configure');
        const table = getAvailableTables().find(t => t.id === tableId);
        if (table) {
            const textCol = table.columns.find((c: any) => c.type === 'text');
            const numCol = table.columns.find((c: any) => c.type === 'number');
            setWidgetConfig({
                xAxisColumn: textCol?.id || '',
                yAxisColumn: numCol?.id || '',
                aggregation: 'count'
            });
        }
    };

    const handleFinishConnect = () => {
        if (connectingWidgetId && selectedTableId) {
            const table = getAvailableTables().find(t => t.id === selectedTableId);
            updateWidget(activePage, connectingWidgetId, {
                sourceTableId: selectedTableId,
                title: table?.title || 'Connected Widget',
                config: widgetConfig,
                subtext: widgetConfig.aggregation === 'sum' ? 'Total Value' : 'Count of records',
                trend: { value: '+12.5%', direction: 'up' }
            });
        }
        setConnectingWidgetId(null);
    };

    const getSelectedTable = () => getAvailableTables().find(t => t.id === selectedTableId);
    const getConnectingWidget = () => widgets.find(w => w.id === connectingWidgetId);

    // Pre-calculate counts so we can size widgets responsively.
    const chartCount = widgets.filter(w => w.type === 'chart').length;
    const kpiCount = widgets.filter(w => w.type === 'kpi-card').length;

    return (
        <div className="flex-1 flex flex-col bg-gray-50/50 overflow-y-auto relative">
            {/* Data Connection Modal */}
            {connectingWidgetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-semibold text-gray-800">
                                {connectionStep === 'select-table' ? 'Select Data Source' : 'Configure Data'}
                            </h3>
                            <button
                                onClick={() => setConnectingWidgetId(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <Minus size={18} className="rotate-45" />
                            </button>
                        </div>

                        <div className="p-0 overflow-y-auto flex-1">
                            {connectionStep === 'select-table' ? (
                                <div className="p-2">
                                    {getAvailableTables().length === 0 ? (
                                        <div className="p-8 text-center flex flex-col items-center text-gray-500">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                <Activity size={24} className="text-gray-400" />
                                            </div>
                                            <p className="font-medium">No tables found</p>
                                            <p className="text-sm mt-1">Create a table in the Data section first.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {getAvailableTables().map(table => (
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
                                    {getConnectingWidget()?.type === 'chart' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">X Axis (Category)</label>
                                                <select
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                    value={widgetConfig.xAxisColumn}
                                                    onChange={(e) => setWidgetConfig({ ...widgetConfig, xAxisColumn: e.target.value })}
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
                                                    value={widgetConfig.yAxisColumn}
                                                    onChange={(e) => setWidgetConfig({ ...widgetConfig, yAxisColumn: e.target.value })}
                                                >
                                                    <option value="">Select Column...</option>
                                                    {getSelectedTable()?.columns.map((col: any) => (
                                                        <option key={col.id} value={col.id}>{col.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {getConnectingWidget()?.type === 'kpi-card' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
                                                <select
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                    value={widgetConfig.aggregation}
                                                    onChange={(e) => setWidgetConfig({ ...widgetConfig, aggregation: e.target.value })}
                                                >
                                                    <option value="count">Count of Records</option>
                                                    <option value="sum">Sum of Column</option>
                                                    <option value="avg">Average of Column</option>
                                                </select>
                                            </div>
                                            {widgetConfig.aggregation !== 'count' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
                                                    <select
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                        value={widgetConfig.yAxisColumn}
                                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, yAxisColumn: e.target.value })}
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
                            {connectionStep === 'select-table' ? (
                                <>
                                    <span>Select a table to link.</span>
                                    <button
                                        className="text-gray-600 hover:text-gray-900 font-medium"
                                        onClick={() => setConnectingWidgetId(null)}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="text-gray-600 hover:text-gray-900 font-medium"
                                        onClick={() => setConnectionStep('select-table')}
                                    >
                                        Back
                                    </button>
                                    <button
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        onClick={handleFinishConnect}
                                    >
                                        Finish
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="p-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 items-start">
                    {widgets.map((widget) => {
                        const chartClass =
                            widget.type === 'chart'
                                ? chartCount === 1
                                    ? 'col-span-full'
                                    : 'col-span-full md:col-span-3 lg:col-span-4'
                                : '';

                        const kpiClass =
                            widget.type === 'kpi-card'
                                ? kpiCount === 1
                                    ? 'col-span-full'
                                    : 'col-span-full md:col-span-3 lg:col-span-3'
                                : '';

                        const baseClass =
                            widget.type === 'custom-table'
                                ? 'col-span-full'
                                : widget.type === 'chart'
                                    ? chartClass
                                    : widget.type === 'kpi-card'
                                        ? kpiClass
                                        : '';

                        // Prepare props for renderWidget
                        const commonProps = {
                            onDelete: () => removeWidget(activePage, widget.id),
                            onUpdate: (updates: any) => updateWidget(activePage, widget.id, updates),
                        };

                        // Specific props mapping based on widget type
                        let specificProps = {};
                        if (widget.type === 'custom-table') {
                            specificProps = {
                                onDelete: () => removeWidget(activePage, widget.id),
                                onRenameTable: (newTitle: string) => updateWidget(activePage, widget.id, { title: newTitle }),
                                onRenameColumn: (colId: string, newName: string) => {
                                    const updatedColumns = widget.columns.map((c: any) =>
                                        c.id === colId ? { ...c, name: newName } : c
                                    );
                                    updateWidget(activePage, widget.id, { columns: updatedColumns });
                                },
                                onAddColumn: () => {
                                    const newColumn = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        name: 'New Column',
                                        type: 'text',
                                        width: 150
                                    };
                                    updateWidget(activePage, widget.id, { columns: [...widget.columns, newColumn] });
                                },
                                onUpdateColumnType: (colId: string, newType: any) => {
                                    const updatedColumns = widget.columns.map((c: any) =>
                                        c.id === colId ? { ...c, type: newType } : c
                                    );
                                    updateWidget(activePage, widget.id, { columns: updatedColumns });
                                },
                                onDeleteColumn: (colId: string) => {
                                    const updatedColumns = widget.columns.filter((c: any) => c.id !== colId);
                                    updateWidget(activePage, widget.id, { columns: updatedColumns });
                                },
                                onUpdateColumnColor: (colId: string, newColor: string) => {
                                    const updatedColumns = widget.columns.map((c: any) =>
                                        c.id === colId ? { ...c, color: newColor } : c
                                    );
                                    updateWidget(activePage, widget.id, { columns: updatedColumns });
                                },
                                onUpdateRow: (rowId: string, newData: any) => {
                                    const currentRows = widget.rows || [];
                                    const rowExists = currentRows.some((r: any) => r.id === rowId);
                                    let updatedRows;
                                    if (rowExists) {
                                        updatedRows = currentRows.map((r: any) =>
                                            r.id === rowId ? { ...r, data: newData } : r
                                        );
                                    } else {
                                        updatedRows = [...currentRows, { id: rowId, data: newData }];
                                    }
                                    updateWidget(activePage, widget.id, { rows: updatedRows });
                                }
                            };
                        } else if (widget.type === 'kpi-card') {
                            // Logic for KPI Card data binding
                            let displayValue = widget.value;
                            if (widget.sourceTableId) {
                                const dataPage = activePage.replace(/\/analytics$/, '/data');
                                const dataWidgets = pageWidgets[dataPage] || [];
                                const sourceTable = dataWidgets.find(w => w.id === widget.sourceTableId);
                                if (sourceTable) {
                                    const config = widget.config || { aggregation: 'count' };
                                    if (config.aggregation === 'count') {
                                        displayValue = (sourceTable.rows || []).length.toString();
                                    } else if (config.aggregation === 'sum' && config.yAxisColumn) {
                                        const sum = (sourceTable.rows || []).reduce((acc: number, row: any) => {
                                            const val = parseFloat(row.data[config.yAxisColumn]) || 0;
                                            return acc + val;
                                        }, 0);
                                        displayValue = sum.toLocaleString();
                                    } else if (config.aggregation === 'avg' && config.yAxisColumn) {
                                        const rows = sourceTable.rows || [];
                                        if (rows.length > 0) {
                                            const sum = rows.reduce((acc: number, row: any) => {
                                                const val = parseFloat(row.data[config.yAxisColumn]) || 0;
                                                return acc + val;
                                            }, 0);
                                            displayValue = (sum / rows.length).toFixed(1);
                                        } else {
                                            displayValue = '0';
                                        }
                                    } else {
                                        displayValue = (sourceTable.rows || []).length.toString();
                                    }
                                }
                            }
                            specificProps = {
                                value: displayValue,
                                onConnect: () => handleStartConnect(widget.id),
                                onTitleChange: (newTitle: string) => updateWidget(activePage, widget.id, { title: newTitle })
                            };
                        } else if (widget.type === 'chart') {
                            // Logic for Chart data binding
                            let chartData = null;
                            if (widget.sourceTableId) {
                                const dataPage = activePage.replace(/\/analytics$/, '/data');
                                const dataWidgets = pageWidgets[dataPage] || [];
                                const sourceTable = dataWidgets.find(w => w.id === widget.sourceTableId);
                                if (sourceTable && sourceTable.rows && sourceTable.rows.length > 0) {
                                    const config = widget.config || {};
                                    const xColId = config.xAxisColumn;
                                    const yColId = config.yAxisColumn;
                                    const columns = sourceTable.columns || [];
                                    const textCol = xColId ? columns.find((c: any) => c.id === xColId) : columns.find((c: any) => c.type === 'text');
                                    const valCol = yColId ? columns.find((c: any) => c.id === yColId) : columns.find((c: any) => c.type === 'number');
                                    if (textCol) {
                                        const categories = sourceTable.rows.map((r: any) => r.data[textCol.id] || 'Unknown');
                                        let values;
                                        if (valCol) {
                                            values = sourceTable.rows.map((r: any) => parseFloat(r.data[valCol.id]) || 0);
                                        } else {
                                            values = sourceTable.rows.map(() => 1);
                                        }
                                        chartData = { categories, values };
                                    }
                                }
                            }

                            specificProps = {
                                data: chartData,
                                isEmpty: !widget.sourceTableId,
                                onConnect: () => handleStartConnect(widget.id),
                                onTitleChange: (newTitle: string) => updateWidget(activePage, widget.id, { title: newTitle })
                            };
                        }

                        return (
                            <div key={widget.id} className={`${baseClass} relative group ${widget.type === 'chart' ? 'h-[320px]' : ''}`}>
                                {widget.type !== 'custom-table' && (
                                    <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={() => removeWidget(activePage, widget.id)}
                                            className="bg-red-500 text-white p-1 rounded-full shadow-sm hover:bg-red-600"
                                        >
                                            <Minus size={12} />
                                        </button>
                                    </div>
                                )}
                                {renderWidget(widget, specificProps)}
                            </div>
                        );
                    })}
                </div>

                {widgets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-gray-200 rounded-xl">
                        <div className="bg-blue-50 p-5 rounded-full mb-4">
                            <Table className="text-blue-600" size={32} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No widgets yet</h2>
                        <p className="text-gray-500 max-w-md">
                            Use the Insert menu above to add a table on the Data tab, then connect charts and KPIs from Analytics.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WidgetPage;
