import React from 'react';
import { Users, UserPlus, TrendingUp } from 'lucide-react';
import DepartmentAnalyticsPage from '../shared/DepartmentAnalyticsPage';

interface HRPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const HRPage: React.FC<HRPageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<Users />}
            placeholderTitle="Human Resources"
            placeholderDescription="Manage employee data, recruitment, and HR metrics here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'Total Employees', value: '245', icon: Users, color: 'text-blue-600' },
                { label: 'New Hires', value: '12', icon: UserPlus, color: 'text-green-600' },
                { label: 'Retention', value: '94%', icon: TrendingUp, color: 'text-emerald-600' },
            ]}
        />
    );
};

export default HRPage;
