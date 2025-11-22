import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, DollarSign, Users, ShoppingBag, Activity, TrendingUp, TrendingDown, Minus, Table } from 'lucide-react';
import CustomTable from '../../ui/CustomTable';
import KPICard from '../../ui/KPICard';
import ChartWidget from '../../ui/ChartWidget';

interface DepartmentAnalyticsPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
    placeholderIcon?: React.ReactNode;
    placeholderTitle?: string;
    placeholderDescription?: string;
    defaultStats?: Array<{ label: string; value: string; icon: any; color: string }>;
}

const DepartmentAnalyticsPage: React.FC<DepartmentAnalyticsPageProps> = ({
    activePage,
    allPageWidgets,
    widgets = [],
    onDeleteWidget,
    onUpdateWidget,
    placeholderIcon,
    placeholderTitle = 'Department Analytics',
    placeholderDescription = 'Manage your department data and analytics here. Use the "Insert" menu to add custom tables and charts.',
    defaultStats = []
}) => {
    const [connectingWidgetId, setConnectingWidgetId] = useState<string | null>(null);
    const [connectionStep, setConnectionStep] = useState<'select-table' | 'configure'>('select-table');
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [widgetConfig, setWidgetConfig] = useState<any>({});

    // Helper to get available tables from the corresponding Data page
    const getAvailableTables = () => {
        if (activePage.includes('/analytics')) {
            const dataPage = activePage.replace('/analytics', '/data');
            const dataWidgets = allPageWidgets[dataPage] || [];
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
        // Set defaults based on table columns
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
            onUpdateWidget && onUpdateWidget(connectingWidgetId, {
                sourceTableId: selectedTableId,
                title: table?.title || 'Connected Widget',
                config: widgetConfig,
                // Update legacy props for backward compatibility or simple display
                subtext: widgetConfig.aggregation === 'sum' ? 'Total Value' : 'Count of records',
                trend: { value: '+12.5%', direction: 'up' } // Keep the dummy trend for now
            });
        }
        setConnectingWidgetId(null);
    };

    const getSelectedTable = () => getAvailableTables().find(t => t.id === selectedTableId);
    const getConnectingWidget = () => widgets.find(w => w.id === connectingWidgetId);

    const totalCharts = widgets.filter(w => w.type === 'chart').length;

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
                                    {/* Configuration Form */}
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

            <div className="p-8 w-full overflow-x-auto">
                <div className="grid grid-cols-12 gap-4 min-w-[1000px] grid-auto-rows-[minmax(175px,auto)]">
                    {/* Render Dynamic Widgets */}
                    {widgets.map((widget) => {
                        const chartIds = widgets.filter(w => w.type === 'chart').map(w => w.id);
                        const totalCharts = chartIds.length;

                        if (widget.type === 'custom-table') {
                            return (
                                <div key={widget.id} className="col-span-12">
                                    <CustomTable
                                        {...widget}
                                        onDelete={() => onDeleteWidget && onDeleteWidget(widget.id)}
                                        onRenameTable={(newTitle) => onUpdateWidget && onUpdateWidget(widget.id, { title: newTitle })}
                                        onRenameColumn={(colId, newName) => {
                                            const updatedColumns = widget.columns.map((c: any) =>
                                                c.id === colId ? { ...c, name: newName } : c
                                            );
                                            onUpdateWidget && onUpdateWidget(widget.id, { columns: updatedColumns });
                                        }}
                                        onAddColumn={() => {
                                            const newColumn = {
                                                id: Math.random().toString(36).substr(2, 9),
                                                name: 'New Column',
                                                type: 'text',
                                                width: 150
                                            };
                                            onUpdateWidget && onUpdateWidget(widget.id, { columns: [...widget.columns, newColumn] });
                                        }}
                                        onUpdateColumnType={(colId, newType) => {
                                            const updatedColumns = widget.columns.map((c: any) =>
                                                c.id === colId ? { ...c, type: newType } : c
                                            );
                                            onUpdateWidget && onUpdateWidget(widget.id, { columns: updatedColumns });
                                        }}
                                        onDeleteColumn={(colId) => {
                                            const updatedColumns = widget.columns.filter((c: any) => c.id !== colId);
                                            onUpdateWidget && onUpdateWidget(widget.id, { columns: updatedColumns });
                                        }}
                                        onUpdateColumnColor={(colId, newColor) => {
                                            const updatedColumns = widget.columns.map((c: any) =>
                                                c.id === colId ? { ...c, color: newColor } : c
                                            );
                                            onUpdateWidget && onUpdateWidget(widget.id, { columns: updatedColumns });
                                        }}
                                        onUpdateRow={(rowId, newData) => {
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
                                            onUpdateWidget && onUpdateWidget(widget.id, { rows: updatedRows });
                                        }}
                                    />
                                </div>
                            );
                        }
                        if (widget.type === 'kpi-card') {
                            const IconMap: any = { DollarSign, Users, ShoppingBag, Activity };
                            const Icon = IconMap[widget.icon] || Activity;

                            // Calculate value if connected
                            let displayValue = widget.value;
                            if (widget.sourceTableId) {
                                const dataPage = activePage.replace('/analytics', '/data');
                                const dataWidgets = allPageWidgets[dataPage] || [];
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
                                        // Default fallback
                                        displayValue = (sourceTable.rows || []).length.toString();
                                    }
                                }
                            }

                            // Check if this KPI is part of a layout group (4 KPI 1 Chart)
                            const isLayoutKPI = widget.layoutGroup && widget.layoutPosition <= 4;
                            let kpiGridStyle = {};

                            if (isLayoutKPI) {
                                // Explicit positioning for 2x2 KPI grid on the left
                                const positions = {
                                    1: { gridColumn: '1 / 4', gridRow: '1' },    // Top-left
                                    2: { gridColumn: '4 / 7', gridRow: '1' },    // Top-right
                                    3: { gridColumn: '1 / 4', gridRow: '2' },    // Bottom-left
                                    4: { gridColumn: '4 / 7', gridRow: '2' }     // Bottom-right
                                };
                                kpiGridStyle = positions[widget.layoutPosition];
                            }

                            return (
                                <div
                                    key={widget.id}
                                    className={`relative group w-full h-full ${isLayoutKPI ? '' : 'col-span-3'}`}
                                    style={isLayoutKPI ? kpiGridStyle : {}}
                                >
                                    <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={() => onDeleteWidget && onDeleteWidget(widget.id)}
                                            className="bg-red-500 text-white p-1 rounded-full shadow-sm hover:bg-red-600"
                                        >
                                            <Minus size={12} />
                                        </button>
                                    </div>

                                    <KPICard
                                        title={widget.title}
                                        value={displayValue}
                                        icon={Icon}
                                        trend={widget.trend}
                                        subtext={widget.subtext}
                                        isEmpty={!widget.value && !widget.sourceTableId}
                                        onConnect={() => handleStartConnect(widget.id)}
                                        onTitleChange={(newTitle) => onUpdateWidget && onUpdateWidget(widget.id, { title: newTitle })}
                                    />
                                </div>
                            );
                        }
                        if (widget.type === 'chart') {
                            // Prepare data if connected
                            let chartData = null;
                            if (widget.sourceTableId) {
                                const dataPage = activePage.replace('/analytics', '/data');
                                const dataWidgets = allPageWidgets[dataPage] || [];
                                const sourceTable = dataWidgets.find(w => w.id === widget.sourceTableId);
                                if (sourceTable && sourceTable.rows && sourceTable.rows.length > 0) {
                                    const config = widget.config || {};
                                    const xColId = config.xAxisColumn;
                                    const yColId = config.yAxisColumn;

                                    // Fallback to heuristics if config is missing (backward compatibility)
                                    const columns = sourceTable.columns || [];
                                    const textCol = xColId ? columns.find((c: any) => c.id === xColId) : columns.find((c: any) => c.type === 'text');
                                    const valCol = yColId ? columns.find((c: any) => c.id === yColId) : columns.find((c: any) => c.type === 'number');

                                    if (textCol) {
                                        const categories = sourceTable.rows.map((r: any) => r.data[textCol.id] || 'Unknown');

                                        let values;
                                        if (valCol) {
                                            // Use actual values from the selected column
                                            values = sourceTable.rows.map((r: any) => parseFloat(r.data[valCol.id]) || 0);
                                        } else {
                                            // Fallback: generate dummy or count
                                            values = sourceTable.rows.map(() => 1);
                                        }

                                        chartData = {
                                            categories: categories,
                                            values: values
                                        };
                                    }
                                }
                            }

                            const span = totalCharts >= 3 ? 4 : 6;
                            const isFirstChart = widget.id === chartIds[0];

                            // Check if this chart is part of a layout group (4 KPI 1 Chart)
                            const isLayoutChart = widget.layoutGroup && widget.layoutPosition === 5;
                            let gridStyle = {};

                            if (isLayoutChart) {
                                // Explicit positioning for layout: column 7-12, rows 1-2
                                gridStyle = { gridColumn: '7 / 13', gridRow: '1 / 3' };
                            } else if (isFirstChart && totalCharts >= 3) {
                                gridStyle = { gridColumn: `1 / span ${span}` };
                            } else {
                                gridStyle = { gridColumn: `span ${span} / span ${span}` };
                            }

                            return (
                                <div
                                    key={widget.id}
                                    className={`row-span-2 min-h-[350px] relative group transition-all duration-300 ${(isFirstChart && totalCharts >= 3 && !isLayoutChart) ? 'col-start-1' : ''}`}
                                    style={gridStyle}
                                >
                                    <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={() => onDeleteWidget && onDeleteWidget(widget.id)}
                                            className="bg-red-500 text-white p-1 rounded-full shadow-sm hover:bg-red-600"
                                        >
                                            <Minus size={12} />
                                        </button>
                                    </div>

                                    <ChartWidget
                                        title={widget.title}
                                        type={widget.chartType || 'bar'}
                                        data={chartData}
                                        isEmpty={!widget.sourceTableId}
                                        onConnect={() => handleStartConnect(widget.id)}
                                        onTitleChange={(newTitle) => onUpdateWidget && onUpdateWidget(widget.id, { title: newTitle })}
                                    />
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
                {/* Default Placeholder Content (only if no widgets) */}
                {widgets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        {placeholderIcon && (
                            <div className="bg-indigo-50 p-6 rounded-full mb-6">
                                {React.isValidElement(placeholderIcon) ? React.cloneElement(placeholderIcon as React.ReactElement<any>, { className: 'text-indigo-600', size: 48 }) : placeholderIcon}
                            </div>
                        )}
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{placeholderTitle}</h2>
                        <p className="text-gray-500 max-w-md mb-8">
                            {placeholderDescription}
                        </p>
                        {defaultStats.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                                {defaultStats.map((stat, i) => (
                                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-gray-500 text-sm font-medium">{stat.label}</span>
                                            <stat.icon className={stat.color} size={20} />
                                        </div>
                                        <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepartmentAnalyticsPage;
