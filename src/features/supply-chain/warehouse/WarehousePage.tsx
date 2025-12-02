import React from 'react';
import { Warehouse, Package, TrendingUp } from 'lucide-react';
import DepartmentAnalyticsPage from '../../shared/DepartmentAnalyticsPage';

interface WarehousePageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const WarehousePage: React.FC<WarehousePageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<Warehouse />}
            placeholderTitle="Warehouse Operations"
            placeholderDescription="Track inventory levels, storage, and warehouse efficiency here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'Total Items', value: '12,450', icon: Package, color: 'text-blue-600' },
                { label: 'Capacity Used', value: '78%', icon: Warehouse, color: 'text-amber-600' },
                { label: 'Turnover Rate', value: '+15%', icon: TrendingUp, color: 'text-green-600' },
            ]}
        />
    );
};

export default WarehousePage;
