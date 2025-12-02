import React from 'react';
import KPICard from '../../ui/KPICard';
import ChartWidget from '../../ui/ChartWidget';
import CustomTable from '../../ui/CustomTable';
import { Widget } from '../../stores/dashboardStore';

export const WidgetRegistry = {
    'kpi-card': KPICard,
    'chart': ChartWidget,
    'custom-table': CustomTable,
};

export const renderWidget = (widget: Widget, props: any = {}) => {
    const Component = WidgetRegistry[widget.type as keyof typeof WidgetRegistry];

    if (!Component) {
        console.warn(`Unknown widget type: ${widget.type}`);
        return null;
    }

    // Map widget properties to component props
    const componentProps = {
        ...widget,
        ...props,
        // Ensure id is passed
        id: widget.id,
        // Map specific props if necessary
        title: widget.title || 'Untitled',
    };

    return <Component key={widget.id} {...componentProps} />;
};
