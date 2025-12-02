import React from 'react';
import { Briefcase, DollarSign, TrendingUp, Users } from 'lucide-react';
import DepartmentAnalyticsPage from '../../shared/DepartmentAnalyticsPage';

interface SalesPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const SalesPage: React.FC<SalesPageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<Briefcase />}
            placeholderTitle="Sales Operations"
            placeholderDescription="Track sales performance, pipeline, and revenue metrics here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'Monthly Revenue', value: '$125K', icon: DollarSign, color: 'text-green-600' },
                { label: 'Active Deals', value: '47', icon: Briefcase, color: 'text-blue-600' },
                { label: 'Growth', value: '+18%', icon: TrendingUp, color: 'text-emerald-600' },
            ]}
        />
    );
};

export default SalesPage;
