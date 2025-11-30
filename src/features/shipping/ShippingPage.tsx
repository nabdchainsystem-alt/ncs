import React from 'react';
import { Ship, Package, Clock } from 'lucide-react';
import DepartmentAnalyticsPage from '../shared/DepartmentAnalyticsPage';

interface ShippingPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const ShippingPage: React.FC<ShippingPageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<Ship />}
            placeholderTitle="Shipping Operations"
            placeholderDescription="Track shipments, delivery times, and logistics metrics here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'Active Shipments', value: '156', icon: Ship, color: 'text-blue-600' },
                { label: 'Pending Orders', value: '89', icon: Package, color: 'text-amber-600' },
                { label: 'Avg Delivery Time', value: '2.3d', icon: Clock, color: 'text-green-600' },
            ]}
        />
    );
};

export default ShippingPage;
