import React from 'react';
import { Store, TrendingUp, Star } from 'lucide-react';
import DepartmentAnalyticsPage from '../../shared/DepartmentAnalyticsPage';

interface VendorsPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const VendorsPage: React.FC<VendorsPageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<Store />}
            placeholderTitle="Vendor Management"
            placeholderDescription="Manage vendor relationships, performance metrics, and contracts here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'Active Vendors', value: '42', icon: Store, color: 'text-blue-600' },
                { label: 'Avg Rating', value: '4.7/5', icon: Star, color: 'text-yellow-600' },
                { label: 'Performance', value: '+12%', icon: TrendingUp, color: 'text-green-600' },
            ]}
        />
    );
};

export default VendorsPage;
