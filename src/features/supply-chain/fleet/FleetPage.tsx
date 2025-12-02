import React from 'react';
import { Truck, Fuel, CheckCircle2 } from 'lucide-react';
import DepartmentAnalyticsPage from '../../shared/DepartmentAnalyticsPage';

interface FleetPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const FleetPage: React.FC<FleetPageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<Truck />}
            placeholderTitle="Fleet Management"
            placeholderDescription="Track vehicles, maintenance schedules, and fleet efficiency here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'Total Vehicles', value: '67', icon: Truck, color: 'text-blue-600' },
                { label: 'Fuel Efficiency', value: '8.5L/100km', icon: Fuel, color: 'text-green-600' },
                { label: 'Maintenance Rate', value: '95%', icon: CheckCircle2, color: 'text-emerald-600' },
            ]}
        />
    );
};

export default FleetPage;
