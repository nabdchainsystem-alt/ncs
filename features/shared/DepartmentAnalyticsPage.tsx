import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, DollarSign, Users, ShoppingBag, Activity, TrendingUp, TrendingDown, Minus, Table } from 'lucide-react';
import CustomTable from '../../ui/CustomTable';
import KPICard from '../../ui/KPICard';
import ChartWidget from '../../ui/ChartWidget';
import DataConnectionModal from './components/DataConnectionModal';

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

    // Helper to get available tables from the corresponding Data page
    const getAvailableTables = () => {
        if (activePage.includes('/analytics')) {
            const dataPage = activePage.replace('/analytics', '/data');
            const dataWidgets = allPageWidgets[dataPage] || [];
            return dataWidgets.filter(w => w.type === 'custom-table');
        }
        return [];
    };

    // Inside DepartmentAnalyticsPage:

    const handleStartConnect = (widgetId: string) => {
        setConnectingWidgetId(widgetId);
    };

    const handleFinishConnect = (tableId: string, config: any) => {
        if (connectingWidgetId) {
            const table = getAvailableTables().find(t => t.id === tableId);
            onUpdateWidget && onUpdateWidget(connectingWidgetId, {
                sourceTableId: tableId,
                title: table?.title || 'Connected Widget',
                config: config,
                // Update legacy props for backward compatibility or simple display
                subtext: config.aggregation === 'sum' ? 'Total Value' : 'Count of records',
                trend: { value: '+12.5%', direction: 'up' } // Keep the dummy trend for now
            });
        }
        setConnectingWidgetId(null);
    };

    const calculateWidgetData = (widget: any) => {
        if (!widget.sourceTableId || !widget.config) return null;

        const table = getAvailableTables().find(t => t.id === widget.sourceTableId);
        if (!table) return null;

        const { xAxisColumn, yAxisColumn, aggregation } = widget.config;

        // For Charts
        if (widget.type === 'chart') {
            if (!xAxisColumn || !yAxisColumn) return null;

            // Group by X-Axis
            const groups: Record<string, number> = {};
            table.rows.forEach((row: any) => {
                const xValue = row.data[xAxisColumn];
                const yValue = parseFloat(row.data[yAxisColumn]) || 0;

                if (xValue) {
                    groups[xValue] = (groups[xValue] || 0) + yValue;
                }
            });

            return {
                categories: Object.keys(groups),
                values: Object.values(groups)
            };
        }

        // For KPI Cards
        if (widget.type === 'kpi-card') {
            if (aggregation === 'count') {
                return { value: table.rows.length.toString() };
            }

            if (aggregation === 'sum' && yAxisColumn) {
                const sum = table.rows.reduce((acc: number, row: any) => {
                    return acc + (parseFloat(row.data[yAxisColumn]) || 0);
                }, 0);
                return { value: sum.toLocaleString() };
            }

            if (aggregation === 'avg' && yAxisColumn) {
                const sum = table.rows.reduce((acc: number, row: any) => {
                    return acc + (parseFloat(row.data[yAxisColumn]) || 0);
                }, 0);
                const avg = table.rows.length ? sum / table.rows.length : 0;
                return { value: avg.toLocaleString(undefined, { maximumFractionDigits: 2 }) };
            }
        }

        return null;
    };

    const getConnectingWidget = () => widgets.find(w => w.id === connectingWidgetId);

    const totalCharts = widgets.filter(w => w.type === 'chart').length;

    return (
        <div className="flex-1 flex flex-col bg-gray-50/50 overflow-y-auto relative">
            {/* Data Connection Modal */}
            <DataConnectionModal
                isOpen={!!connectingWidgetId}
                onClose={() => setConnectingWidgetId(null)}
                availableTables={getAvailableTables()}
                onConnect={handleFinishConnect}
                widgetType={getConnectingWidget()?.type as 'chart' | 'kpi-card'}
            />

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
                                        onDeleteRow={(rowId) => {
                                            const updatedRows = (widget.rows || []).filter((r: any) => r.id !== rowId);
                                            onUpdateWidget && onUpdateWidget(widget.id, { rows: updatedRows });
                                        }}
                                    />
                                </div>
                            );
                        }

                        if (widget.type === 'chart') {
                            const calculatedData = calculateWidgetData(widget);
                            return (
                                <div
                                    key={widget.id}
                                    className={`row-span-2 min-h-[350px] relative group transition-all duration-300 col-span-${totalCharts === 1 ? '12' : '6'}`}
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
                                        {...widget}
                                        data={calculatedData}
                                        isEmpty={!widget.sourceTableId}
                                        onConnect={() => handleStartConnect(widget.id)}
                                        onTitleChange={(newTitle) => onUpdateWidget && onUpdateWidget(widget.id, { title: newTitle })}
                                    />
                                </div>
                            );
                        }

                        if (widget.type === 'kpi-card') {
                            const calculatedData = calculateWidgetData(widget);
                            const IconMap: any = { DollarSign, Users, ShoppingBag, Activity };
                            const Icon = IconMap[widget.icon] || Activity;

                            return (
                                <div
                                    key={widget.id}
                                    className="relative group w-full h-full col-span-3"
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
                                        value={calculatedData?.value || widget.value}
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
