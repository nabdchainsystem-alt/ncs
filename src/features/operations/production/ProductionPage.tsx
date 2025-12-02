import React from 'react';
import { Settings, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import DepartmentAnalyticsPage from '../../shared/DepartmentAnalyticsPage';

interface ProductionPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const ProductionPage: React.FC<ProductionPageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<Settings />}
            placeholderTitle="Production Operations"
            placeholderDescription="Manage production schedules, output tracking, and efficiency metrics here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'Daily Output', value: '1,250', icon: Settings, color: 'text-blue-600' },
                { label: 'Quality Rate', value: '98.5%', icon: CheckCircle2, color: 'text-green-600' },
                { label: 'Downtime', value: '2.3h', icon: Clock, color: 'text-amber-600' },
            ]}
        />
    );
};

export default ProductionPage;
