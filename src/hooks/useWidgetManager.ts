import { useCallback } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { useLayout } from '../contexts/LayoutContext';
import { useWidgets } from '../features/dashboards/hooks/useWidgets';
import { useToast } from '../ui/Toast';
import { generateMockData } from '../utils/mockDataGenerator';
import { useUI } from '../contexts/UIContext';

export const useWidgetManager = () => {
    const { activePage } = useNavigation();
    const {
        pageTabs,
        setPageTabs,
        activeTabByPage,
        setActiveTabByPage,
        getActiveTabId,
        getTabsForPage,
        handleCreateDashboardTab
    } = useLayout();
    const { pageWidgets, setPageWidgets, onUpdateWidget } = useWidgets('app' as any);
    const { showToast } = useToast();
    const { setTableBuilderOpen } = useUI();

    const activeTabId = getActiveTabId(activePage);
    const widgetPageKey = activeTabId ? `${activePage}::${activeTabId}` : activePage;
    const widgetsForPage = activeTabId ? (pageWidgets[widgetPageKey] || []) : (pageWidgets[activePage] || []);

    const replaceWidgets = useCallback((widgets: any[]) => {
        if (activeTabId) {
            onUpdateWidget(widgetPageKey, widgets);
        } else {
            onUpdateWidget(activePage, widgets);
        }
    }, [activeTabId, widgetPageKey, activePage, onUpdateWidget]);

    const getCurrentWidgetList = useCallback(() =>
        activeTabId
            ? (pageWidgets[widgetPageKey] || [])
            : (pageWidgets[activePage] || []), [activeTabId, pageWidgets, widgetPageKey, activePage]);

    const deleteWidget = useCallback((id: string) => {
        const list = getCurrentWidgetList();
        replaceWidgets(list.filter(w => w.id !== id));
    }, [getCurrentWidgetList, replaceWidgets]);

    const updateWidget = useCallback((id: string, updates: any) => {
        const list = getCurrentWidgetList();
        replaceWidgets(list.map(w => w.id === id ? { ...w, ...updates } : w));
    }, [getCurrentWidgetList, replaceWidgets]);

    const handleInsert = useCallback((type: string, data?: any) => {
        if (type === 'custom-table') setTableBuilderOpen(true);
        if (type === 'layout-clear') {
            replaceWidgets([]);

            // Clear dashboard tabs
            setPageTabs(prev => {
                const next = { ...prev };
                delete next[activePage];
                return next;
            });

            // Reset active tab
            setActiveTabByPage(prev => {
                const next = { ...prev };
                delete next[activePage];
                return next;
            });

            showToast('Cleared layout and dashboards', 'success');
            return;
        }
        if (type === 'dashboard') {
            if (activePage.includes('/data')) return;
            handleCreateDashboardTab();
            return;
        }
        if (type === 'table-template' && data) {
            const template = data;
            const newWidget = {
                type: 'custom-table',
                id: Date.now().toString(),
                title: template.title,
                showBorder: true,
                columns: template.columns.map((col: any) => ({
                    ...col,
                    width: col.width || 150 // Default width if not specified
                })),
                rows: []
            };
            const currentWidgets = getCurrentWidgetList();
            replaceWidgets([...currentWidgets, newWidget]);
            return;
        }

        if (type === 'requests-table') {
            const newWidget = {
                type: 'custom-table',
                id: Date.now().toString(),
                title: 'Requests Table',
                showBorder: true,
                columns: [
                    { id: 'c1', name: 'No', type: 'number', width: 60 },
                    { id: 'c2', name: 'PR Number', type: 'text', width: 120 },
                    { id: 'c3', name: 'Item Code', type: 'text', width: 120 },
                    { id: 'c4', name: 'Item Description', type: 'text', width: 200 },
                    { id: 'c5', name: 'Quantity', type: 'number', width: 100 },
                    { id: 'c6', name: 'UOM', type: 'text', width: 80 },
                    { id: 'c7', name: 'Date Requested', type: 'date', width: 150 },
                    { id: 'c8', name: 'Warehouse', type: 'text', width: 150 },
                    { id: 'c9', name: 'Department Requested', type: 'text', width: 180 },
                    { id: 'c10', name: 'Priority', type: 'text', width: 120 },
                    { id: 'c11', name: 'Approval Status', type: 'text', width: 140 },
                    { id: 'c12', name: 'PR Status', type: 'text', width: 120 }
                ],
                rows: []
            };
            const currentWidgets = getCurrentWidgetList();
            replaceWidgets([...currentWidgets, newWidget]);
            return;
        }

        if (type === 'dashboard-template' && data) {
            const { moduleName, reports } = data;

            // 1. Create a new Dashboard Tab
            const newTabId = `tab-${Date.now()}`;
            const newTab = { id: newTabId, name: moduleName };

            setPageTabs(prev => {
                const current = getTabsForPage(activePage);
                return { ...prev, [activePage]: [...current, newTab] };
            });

            // 2. Switch to the new tab
            setActiveTabByPage(prev => ({ ...prev, [activePage]: newTabId }));

            // 3. Generate Widgets for all reports
            const newWidgets = reports.map((report: any, index: number) => {
                const chartTypeRaw = report["Chart Type (ECharts)"] || 'Bar Chart';
                let widgetType = 'chart';
                let chartType = 'bar';

                if (chartTypeRaw.includes('KPI')) widgetType = 'kpi-card';
                else if (chartTypeRaw.includes('Bar')) chartType = 'bar';
                else if (chartTypeRaw.includes('Line')) chartType = 'line';
                else if (chartTypeRaw.includes('Pie') || chartTypeRaw.includes('Donut')) chartType = 'pie';
                else if (chartTypeRaw.includes('Gauge')) chartType = 'gauge';
                else if (chartTypeRaw.includes('Funnel')) chartType = 'funnel';
                else if (chartTypeRaw.includes('Radar')) chartType = 'radar';
                else if (chartTypeRaw.includes('Scatter')) chartType = 'scatter';
                else if (chartTypeRaw.includes('Heatmap')) chartType = 'heatmap';
                else if (chartTypeRaw.includes('Treemap')) chartType = 'treemap';
                else if (chartTypeRaw.includes('Map')) chartType = 'map';
                else if (chartTypeRaw.includes('Table')) widgetType = 'custom-table';

                // Smart Logic (Simplified for bulk generation)
                let sourceTableId = null;
                let sourceTableIds: Record<string, string> = {};
                let smartLogic = report.logic;
                let connectedCount = 0;
                let totalSources = 0;

                const allPageWidgets = Object.values(pageWidgets).flat();
                const availableTables = allPageWidgets.filter((w: any) => w.type === 'custom-table');

                if (smartLogic) {
                    if (smartLogic.sources && Array.isArray(smartLogic.sources)) {
                        totalSources = smartLogic.sources.length;
                        smartLogic.sources.forEach((source: any, idx: number) => {
                            if (source.table_keywords) {
                                const match = availableTables.find((t: any) =>
                                    source.table_keywords.some((k: string) => t.title.toLowerCase().includes(k.toLowerCase()))
                                );
                                if (match) {
                                    sourceTableIds[`source_${idx}`] = match.id;
                                    if (!sourceTableId) sourceTableId = match.id;
                                    connectedCount++;
                                }
                            }
                        });
                    } else if (smartLogic.source && smartLogic.source.table_keywords) {
                        totalSources = 1;
                        const keywords = smartLogic.source.table_keywords;
                        const match = availableTables.find((t: any) =>
                            keywords.some((k: string) => t.title.toLowerCase().includes(k.toLowerCase()))
                        );
                        if (match) {
                            sourceTableId = match.id;
                            sourceTableIds['primary'] = match.id;
                            connectedCount = 1;
                        }
                    }
                }

                const mockData = generateMockData(report);

                const widget: any = {
                    id: Date.now().toString() + index, // Ensure unique IDs
                    title: report["Report Title"],
                    subtext: report.benefit || (connectedCount > 0 ? `Connected (${connectedCount}/${totalSources})` : 'Connect to data source'),
                    sourceTableId: sourceTableId,
                    sourceTableIds: sourceTableIds,
                    type: widgetType,
                    chartType: chartType,
                    // Generate Mock Data
                    data: chartType === 'heatmap' ? {
                        xLabels: ['Financial', 'Operational', 'Geopolitical', 'Legal', 'Reputational'],
                        yLabels: ['Low', 'Medium', 'High', 'Critical'],
                        values: Array.from({ length: 20 }, (_, i) => [
                            i % 5, // x
                            Math.floor(i / 5), // y
                            Math.floor(Math.random() * 100) // value
                        ])
                    } : (chartType === 'treemap' ? {
                        name: 'Root',
                        children: [
                            { name: 'Category A', value: 100, children: [{ name: 'Item A1', value: 40 }, { name: 'Item A2', value: 60 }] },
                            { name: 'Category B', value: 80, children: [{ name: 'Item B1', value: 30 }, { name: 'Item B2', value: 50 }] },
                            { name: 'Category C', value: 60, children: [{ name: 'Item C1', value: 20 }, { name: 'Item C2', value: 40 }] }
                        ]
                    } : (chartType === 'map' ? {
                        data: [
                            { name: 'USA', value: 100 },
                            { name: 'China', value: 80 },
                            { name: 'Germany', value: 60 },
                            { name: 'Japan', value: 40 },
                            { name: 'India', value: 20 }
                        ]
                    } : mockData)),
                    // Store logic for future reference
                    logic: smartLogic,
                    // Default layout (auto-arrange)
                    layout: { i: '', x: (index % 3) * 4, y: Math.floor(index / 3) * 4, w: 4, h: 4 }
                };

                if (widgetType === 'kpi-card') {
                    widget.icon = 'Activity';
                    widget.value = mockData.value;
                    widget.trend = { value: mockData.trendValue, direction: mockData.trend };
                } else if (widgetType === 'custom-table') {
                    widget.showBorder = true;
                    widget.columns = [
                        { id: 'c1', name: 'Column 1', type: 'text', width: 150 },
                        { id: 'c2', name: 'Column 2', type: 'number', width: 100 }
                    ];
                    widget.rows = [];
                }

                return widget;
            });

            // Update widgets for the NEW tab
            onUpdateWidget(`${activePage}::${newTabId}`, newWidgets);
            showToast(`Generated ${newWidgets.length} widgets for ${moduleName}`, 'success');
            return;
        }

        if (type === 'report-template' && data) {
            const report = data;
            const chartTypeRaw = report["Chart Type (ECharts)"] || 'Bar Chart';
            let widgetType = 'chart';
            let chartType = 'bar';

            // Map chart types
            if (chartTypeRaw.includes('KPI')) widgetType = 'kpi-card';
            else if (chartTypeRaw.includes('Bar')) chartType = 'bar';
            else if (chartTypeRaw.includes('Line')) chartType = 'line';
            else if (chartTypeRaw.includes('Pie') || chartTypeRaw.includes('Donut')) chartType = 'pie';
            else if (chartTypeRaw.includes('Gauge')) chartType = 'gauge';
            else if (chartTypeRaw.includes('Funnel')) chartType = 'funnel';
            else if (chartTypeRaw.includes('Radar')) chartType = 'radar';
            else if (chartTypeRaw.includes('Scatter')) chartType = 'scatter';
            else if (chartTypeRaw.includes('Heatmap')) chartType = 'heatmap';
            else if (chartTypeRaw.includes('Treemap')) chartType = 'treemap';
            else if (chartTypeRaw.includes('Map')) chartType = 'map';
            else if (chartTypeRaw.includes('Table')) widgetType = 'custom-table';

            // Smart Logic: Try to find a matching data source
            let sourceTableId = null;
            let sourceTableIds: Record<string, string> = {};
            let smartLogic = report.logic;
            let connectedCount = 0;
            let totalSources = 0;

            const allWidgets = Object.values(pageWidgets).flat();
            const availableTables = allWidgets.filter((w: any) => w.type === 'custom-table');

            if (smartLogic) {
                // Handle Multi-Source
                if (smartLogic.sources && Array.isArray(smartLogic.sources)) {
                    totalSources = smartLogic.sources.length;
                    smartLogic.sources.forEach((source: any, index: number) => {
                        if (source.table_keywords) {
                            const match = availableTables.find((t: any) =>
                                source.table_keywords.some((k: string) => t.title.toLowerCase().includes(k.toLowerCase()))
                            );
                            if (match) {
                                sourceTableIds[`source_${index}`] = match.id;
                                // Set primary source as the first one found
                                if (!sourceTableId) sourceTableId = match.id;
                                connectedCount++;
                            }
                        }
                    });

                    if (connectedCount > 0) {
                        showToast(`Connected to ${connectedCount}/${totalSources} sources`, 'success');
                    }
                }
                // Handle Single Source (Legacy/Simple)
                else if (smartLogic.source && smartLogic.source.table_keywords) {
                    totalSources = 1;
                    const keywords = smartLogic.source.table_keywords;
                    const match = availableTables.find((t: any) =>
                        keywords.some((k: string) => t.title.toLowerCase().includes(k.toLowerCase()))
                    );

                    if (match) {
                        sourceTableId = match.id;
                        sourceTableIds['primary'] = match.id;
                        connectedCount = 1;
                        showToast(`Auto-connected to ${match.title}`, 'success');
                    }
                }
            }

            const newWidget: any = {
                id: Date.now().toString(),
                title: report["Report Title"],
                subtext: report.benefit || (connectedCount > 0 ? `Connected (${connectedCount}/${totalSources})` : 'Connect to data source'),
                sourceTableId: sourceTableId, // Primary source for backward compatibility
                config: {
                    reportId: report.id,
                    category: report["Category 1 (Detailed)"],
                    module: report["Module (Category 2)"],
                    smartLogic: smartLogic,
                    sourceTableIds: sourceTableIds // Store all connections
                }
            };

            const mockData = generateMockData(report);

            if (widgetType === 'kpi-card') {
                newWidget.type = 'kpi-card';
                newWidget.value = mockData.value;
                newWidget.icon = 'Activity';
                newWidget.trend = { value: mockData.trendValue, direction: mockData.trend };
            } else if (widgetType === 'chart') {
                newWidget.type = 'chart';
                newWidget.chartType = chartType;
                newWidget.data = chartType === 'heatmap' ? {
                    xLabels: ['Financial', 'Operational', 'Geopolitical', 'Legal', 'Reputational'],
                    yLabels: ['Low', 'Medium', 'High', 'Critical'],
                    values: Array.from({ length: 20 }, (_, i) => [
                        i % 5, // x
                        Math.floor(i / 5), // y
                        Math.floor(Math.random() * 100) // value
                    ])
                } : (chartType === 'treemap' ? {
                    name: 'Root',
                    children: [
                        { name: 'Category A', value: 100, children: [{ name: 'Item A1', value: 40 }, { name: 'Item A2', value: 60 }] },
                        { name: 'Category B', value: 80, children: [{ name: 'Item B1', value: 30 }, { name: 'Item B2', value: 50 }] },
                        { name: 'Category C', value: 60, children: [{ name: 'Item C1', value: 20 }, { name: 'Item C2', value: 40 }] }
                    ]
                } : (chartType === 'map' ? {
                    data: [
                        { name: 'USA', value: 100 },
                        { name: 'China', value: 80 },
                        { name: 'Germany', value: 60 },
                        { name: 'Japan', value: 40 },
                        { name: 'India', value: 20 }
                    ]
                } : mockData));
            }

            const currentWidgets = getCurrentWidgetList();
            replaceWidgets([...currentWidgets, newWidget]);
            return;
        }

        if (type.startsWith('kpi-card')) {
            const count = parseInt(type.split('-')[2] || '1', 10);
            const newWidgets = Array.from({ length: count }).map(() => ({
                type: 'kpi-card',
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title: 'New KPI',
                value: null, // Empty state
                icon: 'Activity',
                trend: null,
                subtext: 'Connect to data source'
            }));
            const currentWidgets = getCurrentWidgetList();
            replaceWidgets([...currentWidgets, ...newWidgets]);
        }
        if (type.startsWith('chart')) {
            const chartType = type.replace('chart-', '') || 'bar';
            const newWidget = {
                type: 'chart',
                id: Date.now().toString(),
                title: `New ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
                chartType: chartType,
                data: null, // Empty state
                sourceTableId: null
            };
            const currentWidgets = getCurrentWidgetList();
            replaceWidgets([...currentWidgets, newWidget]);
        }
        if (type === 'layout-4kpi-1chart') {
            const timestamp = Date.now();
            const layoutGroup = `layout-${timestamp}`;
            const newWidgets = [
                { type: 'kpi-card', id: `${timestamp}-1`, title: 'KPI 1', value: null, icon: 'Activity', subtext: 'Connect data', layoutGroup, layoutPosition: 1 },
                { type: 'kpi-card', id: `${timestamp}-2`, title: 'KPI 2', value: null, icon: 'Activity', subtext: 'Connect data', layoutGroup, layoutPosition: 2 },
                { type: 'kpi-card', id: `${timestamp}-3`, title: 'KPI 3', value: null, icon: 'Activity', subtext: 'Connect data', layoutGroup, layoutPosition: 3 },
                { type: 'kpi-card', id: `${timestamp}-4`, title: 'KPI 4', value: null, icon: 'Activity', subtext: 'Connect data', layoutGroup, layoutPosition: 4 },
                { type: 'chart', id: `${timestamp}-5`, title: 'Main Chart', chartType: 'bar', data: null, sourceTableId: null, layoutGroup, layoutPosition: 5 }
            ];
            const currentWidgets = getCurrentWidgetList();
            replaceWidgets([...currentWidgets, ...newWidgets]);
        }
    }, [activePage, getCurrentWidgetList, replaceWidgets, setPageTabs, setActiveTabByPage, showToast, setTableBuilderOpen, handleCreateDashboardTab, getTabsForPage, pageWidgets, onUpdateWidget]);

    return {
        widgets: widgetsForPage,
        deleteWidget,
        updateWidget,
        handleInsert,
        pageWidgets
    };
};
