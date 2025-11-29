import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, DollarSign, Users, ShoppingBag, Activity, TrendingUp, TrendingDown, Minus, Table, Layers, FileText, BarChart3, Database, Table as TableIcon, Columns } from 'lucide-react';
import CustomTable from '../../ui/CustomTable';
import KPICard from '../../ui/KPICard';
import ChartWidget from '../../ui/ChartWidget';
import DashboardSummary, { SummaryStat } from '../../ui/DashboardSummary';
import ReportDock from '../reports/components/ReportDock';
import reportsData from '../../data/reports/supply_chain_reports/procurement/procurement_reports.json';

interface DepartmentAnalyticsPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
    onInsert?: (type: string, data?: any) => void;
    placeholderIcon?: React.ReactNode;
    placeholderTitle?: string;
    placeholderDescription?: string;
    defaultStats?: Array<{ label: string; value: string; icon: any; color: string }>;
}

const getDashboardContent = (activePage: string) => {
    // Extract parts from the URL
    // e.g. /procurement/analytics/requests-and-demand -> ['procurement', 'analytics', 'requests-and-demand']
    const parts = activePage.split('/').filter(p => p && p !== 'analytics');

    // Get the last part as the dashboard name (fallback to department if no specific dashboard)
    const rawName = parts.length > 1 ? parts[parts.length - 1] : (parts[0] || 'Department');

    // Format: "requests-and-demand" -> "Requests & Demand"
    const formatName = (str: string) => {
        return str
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace(' And ', ' & ');
    };

    const dashboardName = formatName(rawName);
    const department = formatName(parts[0] || 'Department');

    // Determine if we should show the wiki (only for procurement related pages)
    const showWiki = activePage.includes('/procurement');

    return {
        title: 'Executive Overview',
        subtitle: dashboardName, // Use exact name as requested
        description: `Real-time insights and performance metrics for ${dashboardName}. Monitor key indicators and track operational efficiency.`,
        showWiki
    };
};

const DepartmentAnalyticsPage: React.FC<DepartmentAnalyticsPageProps> = ({
    activePage,
    allPageWidgets,
    widgets = [],
    onDeleteWidget,
    onUpdateWidget,
    onInsert,
    placeholderIcon,
    placeholderTitle = 'Department Analytics',
    placeholderDescription = 'Manage your department data and analytics here. Use the "Insert" menu to add custom tables and charts.',
    defaultStats = []
}) => {
    const [connectingWidgetId, setConnectingWidgetId] = useState<string | null>(null);
    const [connectionStep, setConnectionStep] = useState<'select-table' | 'configure'>('select-table');
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [widgetConfig, setWidgetConfig] = useState<any>({});
    const [isDockVisible, setIsDockVisible] = useState(false);
    const [activeTableId, setActiveTableId] = useState<string | null>(null);

    // Helper to check if we are on a data page
    const isDataPage = activePage.includes('/data');

    // Get available tables
    const getAvailableTables = () => {
        if (isDataPage) {
            const dataWidgets = widgets; // On data page, widgets ARE the tables
            return dataWidgets.filter(w => w.type === 'custom-table');
        }
        if (activePage.includes('/analytics')) {
            const dataPage = activePage.replace('/analytics', '/data');
            const dataWidgets = allPageWidgets[dataPage] || [];
            return dataWidgets.filter(w => w.type === 'custom-table');
        }
        return [];
    };

    // Track previous table count to detect additions
    const prevTableCountRef = React.useRef(0);

    // Auto-select first table if none selected, or switch to new table on addition
    React.useEffect(() => {
        if (isDataPage) {
            const tables = getAvailableTables();

            // Case 1: No table selected, select first available
            if (!activeTableId && tables.length > 0) {
                setActiveTableId(tables[0].id);
            }

            // Case 2: New table added, switch to it
            if (tables.length > prevTableCountRef.current) {
                // Assuming the new table is appended to the end
                const newTable = tables[tables.length - 1];
                if (newTable) {
                    setActiveTableId(newTable.id);
                }
            }

            // Update ref
            prevTableCountRef.current = tables.length;
        }
    }, [isDataPage, widgets, activeTableId]);

    // Calculate Dynamic Stats
    const calculateStats = (): SummaryStat[] => {
        if (isDataPage) {
            const activeTable = getAvailableTables().find(t => t.id === activeTableId);
            if (!activeTable) return [];

            const rowCount = activeTable.rows?.length || 0;
            const colCount = activeTable.columns?.length || 0;
            const emptyCells = (activeTable.rows || []).reduce((acc: number, row: any) => {
                return acc + Object.values(row.data).filter(v => v === '' || v === null || v === undefined).length;
            }, 0);

            return [
                { title: 'Total Records', value: rowCount.toLocaleString(), trend: 'Live', trendDirection: 'up', icon: Database, color: '#3b82f6' },
                { title: 'Columns', value: colCount.toString(), trend: 'Structure', trendDirection: 'up', icon: Columns, color: '#8b5cf6' },
                { title: 'Empty Cells', value: emptyCells.toString(), trend: 'Quality', trendDirection: 'down', icon: AlertCircle, color: '#f59e0b' },
                { title: 'Last Modified', value: 'Just now', trend: 'Active', trendDirection: 'up', icon: Clock, color: '#10b981' }
            ];
        }

        const tableWidgets = widgets.filter(w => w.type === 'custom-table');
        const chartWidgets = widgets.filter(w => w.type === 'chart');
        const kpiWidgets = widgets.filter(w => w.type === 'kpi-card');

        const totalRecords = tableWidgets.reduce((acc, w) => acc + (w.rows?.length || 0), 0);

        // Only calculate if we have widgets, otherwise 0
        const hasWidgets = widgets.length > 0;

        return [
            {
                title: 'Total Records',
                value: totalRecords.toLocaleString(),
                trend: hasWidgets ? '+12%' : '-',
                trendDirection: 'up',
                icon: Database,
                color: '#3b82f6'
            },
            {
                title: 'Active Tables',
                value: tableWidgets.length.toString(),
                trend: hasWidgets ? 'Stable' : '-',
                trendDirection: 'up',
                icon: TableIcon,
                color: '#8b5cf6'
            },
            {
                title: 'Visualizations',
                value: (chartWidgets.length + kpiWidgets.length).toString(),
                trend: hasWidgets ? '+2' : '-',
                trendDirection: 'up',
                icon: BarChart3,
                color: '#f59e0b'
            },
            {
                title: 'Data Points',
                value: hasWidgets ? (totalRecords * 5).toLocaleString() : '0', // Approx 5 cols per record
                trend: hasWidgets ? '+5%' : '-',
                trendDirection: 'up',
                icon: Activity,
                color: '#10b981'
            }
        ];
    };

    // Calculate Chart Data (Mock distribution based on tables)
    const calculateChartData = () => {
        if (isDataPage) {
            const activeTable = getAvailableTables().find(t => t.id === activeTableId);
            if (!activeTable || !activeTable.rows || activeTable.rows.length === 0) {
                return {
                    categories: ['No Data'],
                    values: [0]
                };
            }

            // Find first text column for distribution
            const textCol = activeTable.columns.find((c: any) => c.type === 'text');
            if (textCol) {
                const counts: Record<string, number> = {};
                activeTable.rows.forEach((row: any) => {
                    const val = row.data[textCol.id] || 'Unknown';
                    counts[val] = (counts[val] || 0) + 1;
                });
                const categories = Object.keys(counts).slice(0, 10);
                const values = Object.values(counts).slice(0, 10);
                return { categories, values };
            }
            return {
                categories: ['Row 1', 'Row 2', 'Row 3', 'Row 4', 'Row 5'],
                values: [10, 20, 15, 25, 18]
            };
        }

        const tableWidgets = widgets.filter(w => w.type === 'custom-table');

        // If no tables, show empty state (no random mocks)
        if (tableWidgets.length === 0) {
            return {
                categories: ['No Data'],
                values: [0]
            };
        }

        // Create a mock distribution of records per table
        const categories = tableWidgets.map(w => w.title || 'Untitled').slice(0, 6);
        const values = tableWidgets.map(w => w.rows?.length || 0).slice(0, 6);

        return { categories, values };
    };

    const content = getDashboardContent(activePage);
    const stats = calculateStats();
    const chartData = calculateChartData();

    // ... (rest of the component)

    // Show dock if there are any report widgets, or if explicitly toggled (we'll need a way to toggle it later)
    // For now, let's show it if we have widgets, or maybe we can pass a prop from parent?
    // The user said: "when the user click add report... the reports menu transform to a vertical menu"
    // So we need to know when "Add Report" happened.

    // We can use a simple effect: if widgets length increases, show dock? 
    // Or better, let's just show it if there are any widgets for now, or default to true?
    // Actually, the requirement is "transform to", so it should start hidden and appear.
    // Let's rely on the parent passing a "showDock" prop or similar, OR we can just show it always for now as a "Quick Access" feature.
    // But to follow the "transform" request strictly, we need to know when the modal closed.

    // Let's add a "Quick Reports" toggle or just show it.
    // Given the "transform" request, I'll default it to true for now so the user can see it immediately, 
    // as I can't easily hook into the "Modal Closed" event from here without lifting state up to App.tsx.
    // Wait, I can use a local state that defaults to true if there are widgets?

    // Let's try this: The dock contains ALL reports from the JSON.
    // It acts as a palette.

    const handleDockSelect = (report: any) => {
        onInsert?.('report-template', report);
    };

    // Listen for external insert events if possible, or we need a way to know when "Add Report" happened.
    // Since onInsert is passed down, we can't easily intercept it unless we wrap it.
    // However, the "Add Report" modal is likely triggered from the Header, which is outside this component.
    // This is a structural issue. The Header controls the Modal, but the Dock is here.
    // We need a way to signal "Report Added".
    // For now, let's assume if widgets exist, we show the dock, OR we provide a toggle.
    // But to fix "always there", let's default to false.

    // TEMPORARY FIX: We will use a useEffect to check if widgets are added, 
    // but really we need a global state or context for "Dock Mode".
    // For this step, I will make it visible ONLY if there are widgets, 
    // which simulates "after adding a report".

    React.useEffect(() => {
        if (widgets.length > 0) {
            setIsDockVisible(true);
        }
    }, [widgets.length]);



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
        <div className="w-full h-full overflow-y-auto bg-gray-50/50">
            {/* Report Dock (Hidden for now as per user request) */}
            <ReportDock
                reports={reportsData}
                onSelect={handleDockSelect}
                isVisible={false}
            />

            {/* Data Page Tabs - Sticky Top */}
            {isDataPage && widgets.length > 0 && (
                <div className="h-12 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center px-8 gap-2 sticky top-0 z-20 flex-shrink-0 overflow-x-auto no-scrollbar">
                    {getAvailableTables().length === 0 ? (
                        <div className="flex items-center text-sm text-gray-400 italic">
                            <TableIcon size={14} className="mr-2" />
                            Insert a table from the menu to get started...
                        </div>
                    ) : (
                        getAvailableTables().map(table => (
                            <button
                                key={table.id}
                                onClick={() => setActiveTableId(table.id)}
                                className={`
                                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 border
                                    ${activeTableId === table.id
                                        ? 'bg-black text-white border-black shadow-sm'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                                    }
                                `}
                            >
                                <TableIcon size={14} />
                                {table.title || 'Untitled Table'}
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* Dashboard Summary Section - Always visible on Analytics Pages, or on Data Pages with active table */}
            {(activePage.includes('/analytics') || (isDataPage && activeTableId)) && (
                <div className="px-8 pt-6">
                    <DashboardSummary
                        title={isDataPage ? (getAvailableTables().find(t => t.id === activeTableId)?.title || 'Table Overview') : content.title}
                        subtitle={isDataPage ? 'Data Insights' : content.subtitle}
                        description={isDataPage ? 'Overview of records, data quality, and distribution.' : content.description}
                        stats={stats}
                        chartData={chartData}
                        showWiki={content.showWiki}
                    />
                </div>
            )}

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
                    {/* Render Dynamic Widgets with Smart Organization */}
                    {(() => {
                        // 1. Separate Layout Widgets (fixed positions) from Flow Widgets (auto-organized)
                        // For Data Page, only show the active table
                        let layoutWidgets = widgets.filter(w => w.layoutGroup);
                        let flowWidgets = widgets.filter(w => !w.layoutGroup);

                        if (isDataPage && activeTableId) {
                            flowWidgets = flowWidgets.filter(w => w.id === activeTableId);
                            layoutWidgets = []; // No layout widgets on data page for now
                        }

                        // 2. Sort Flow Widgets: KPIs -> Charts -> Tables
                        const sortedFlowWidgets = [...flowWidgets].sort((a, b) => {
                            const typeOrder: Record<string, number> = { 'kpi-card': 1, 'chart': 2, 'custom-table': 3 };
                            return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
                        });

                        // 3. Helper to calculate spans for a group of widgets
                        const getSmartSpan = (index: number, total: number, maxCols: number) => {
                            // Logic: Fill the row.
                            // If total <= maxCols, divide 12 by total.
                            // If total > maxCols, use maxCols (span = 12/maxCols) and wrap.
                            // Handle remainders for the last row?
                            // User request: "if 2 or 3 or 1 it will have a full width of the page" -> implies filling the row.

                            // Simple approach:
                            // If total <= maxCols, span = 12 / total.
                            // If total > maxCols:
                            //   Standard grid of maxCols.
                            //   For the last row (remainder), fill the width?
                            //   Let's stick to standard grid for > maxCols to avoid huge items at the end.

                            if (total <= maxCols) {
                                return Math.floor(12 / total);
                            }
                            return Math.floor(12 / maxCols);
                        };

                        // Pre-calculate counts for smart sizing
                        const kpiCount = sortedFlowWidgets.filter(w => w.type === 'kpi-card').length;
                        const chartCount = sortedFlowWidgets.filter(w => w.type === 'chart').length;

                        // Combine lists for rendering
                        const allWidgetsToRender = [...layoutWidgets, ...sortedFlowWidgets];

                        return allWidgetsToRender.map((widget, index) => {
                            // KPI Card Rendering
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
                                            displayValue = (sourceTable.rows || []).length.toString();
                                        }
                                    }
                                }

                                // Layout Logic
                                const isLayoutKPI = widget.layoutGroup && widget.layoutPosition <= 4;
                                let kpiGridStyle = {};
                                let colSpanClass = 'col-span-3'; // Default fallback

                                if (isLayoutKPI) {
                                    const positions: any = {
                                        1: { gridColumn: '1 / 4', gridRow: '1' },
                                        2: { gridColumn: '4 / 7', gridRow: '1' },
                                        3: { gridColumn: '1 / 4', gridRow: '2' },
                                        4: { gridColumn: '4 / 7', gridRow: '2' }
                                    };
                                    kpiGridStyle = positions[widget.layoutPosition] || {};
                                } else {
                                    // Smart Span Logic
                                    const span = getSmartSpan(0, kpiCount, 4); // index doesn't matter for uniform sizing
                                    colSpanClass = `col-span-${span}`;
                                }

                                return (
                                    <div
                                        key={widget.id}
                                        className={`relative group w-full h-full ${isLayoutKPI ? '' : colSpanClass}`}
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

                            // Chart Rendering
                            if (widget.type === 'chart') {
                                // Prepare data if connected
                                let chartData = widget.data || null;
                                if (widget.sourceTableId) {
                                    const dataPage = activePage.replace('/analytics', '/data');
                                    const dataWidgets = allPageWidgets[dataPage] || [];
                                    const sourceTable = dataWidgets.find(w => w.id === widget.sourceTableId);
                                    if (sourceTable && sourceTable.rows && sourceTable.rows.length > 0) {
                                        const config = widget.config || {};
                                        const xColId = config.xAxisColumn;
                                        const yColId = config.yAxisColumn;
                                        const columns = sourceTable.columns || [];
                                        let textCol = xColId ? columns.find((c: any) => c.id === xColId) : null;
                                        let valCol = yColId ? columns.find((c: any) => c.id === yColId) : null;

                                        if (!textCol || !valCol) {
                                            const smartLogic = widget.config?.smartLogic;
                                            if (smartLogic && smartLogic.requirements) {
                                                smartLogic.requirements.forEach((req: any) => {
                                                    const keywords = req.keywords || [];
                                                    const type = req.types?.[0] || 'text';
                                                    const match = columns.find((c: any) =>
                                                        (c.type === type || (type === 'text' && c.type !== 'number')) &&
                                                        keywords.some((k: string) => c.name.toLowerCase().includes(k.toLowerCase()))
                                                    );
                                                    if (match) {
                                                        if (req.key === 'group_col' || req.key === 'date_col') textCol = match;
                                                        if (req.key === 'amount_col') valCol = match;
                                                    }
                                                });
                                            }
                                        }
                                        if (!textCol) textCol = columns.find((c: any) => c.type === 'text' || c.type === 'date');
                                        if (!valCol) valCol = columns.find((c: any) => c.type === 'number');

                                        if (textCol) {
                                            const categories = sourceTable.rows.map((r: any) => r.data[textCol.id] || 'Unknown');
                                            let values;
                                            if (valCol) {
                                                values = sourceTable.rows.map((r: any) => parseFloat(r.data[valCol.id]) || 0);
                                            } else {
                                                values = sourceTable.rows.map(() => 1);
                                            }
                                            chartData = { categories: categories, values: values };
                                        }
                                    }
                                }

                                // Layout Logic
                                const isLayoutChart = widget.layoutGroup && widget.layoutPosition === 5;
                                let gridStyle = {};
                                let colSpanClass = 'col-span-6'; // Default

                                if (isLayoutChart) {
                                    gridStyle = { gridColumn: '7 / 13', gridRow: '1 / 3' };
                                } else {
                                    // Smart Span Logic for Charts
                                    // If 1 chart -> span 12 (full width)
                                    // If 2 charts -> span 6 (half width)
                                    // If >= 3 charts -> span 4 (third width)
                                    const span = chartCount === 1 ? 12 : (chartCount === 2 ? 6 : 4);
                                    colSpanClass = `col-span-${span}`;
                                    gridStyle = { gridColumn: `span ${span} / span ${span}` };
                                }

                                return (
                                    <div
                                        key={widget.id}
                                        className={`row-span-2 min-h-[350px] relative group transition-all duration-300 ${isLayoutChart ? '' : colSpanClass}`}
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
                                            isEmpty={!widget.sourceTableId && !widget.data}
                                            onConnect={() => handleStartConnect(widget.id)}
                                            onTitleChange={(newTitle) => onUpdateWidget && onUpdateWidget(widget.id, { title: newTitle })}
                                        />
                                    </div>
                                );
                            }

                            // Custom Table Rendering
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
                                            onRowsChange={(newRows) => {
                                                onUpdateWidget && onUpdateWidget(widget.id, { rows: newRows });
                                            }}
                                        />
                                    </div>
                                );
                            }
                            return null;
                        });
                    })()}
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
