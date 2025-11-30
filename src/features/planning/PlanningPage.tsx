import React from 'react';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import DepartmentAnalyticsPage from '../shared/DepartmentAnalyticsPage';

interface PlanningPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const PlanningPage: React.FC<PlanningPageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<Calendar />}
            placeholderTitle="Planning Operations"
            placeholderDescription="Manage demand forecasting, capacity planning, and scheduling here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'Active Plans', value: '23', icon: Calendar, color: 'text-blue-600' },
                { label: 'Forecast Accuracy', value: '92%', icon: TrendingUp, color: 'text-green-600' },
                { label: 'Alerts', value: '5', icon: AlertCircle, color: 'text-amber-600' },
            ]}
        />
    );
};

export default PlanningPage;
