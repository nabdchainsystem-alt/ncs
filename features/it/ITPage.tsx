import React from 'react';
import { Server, AlertCircle, CheckCircle2 } from 'lucide-react';
import DepartmentAnalyticsPage from '../shared/DepartmentAnalyticsPage';

interface ITPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const ITPage: React.FC<ITPageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<Server />}
            placeholderTitle="IT Operations"
            placeholderDescription="Track system uptime, tickets, and infrastructure metrics here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'System Uptime', value: '99.9%', icon: CheckCircle2, color: 'text-green-600' },
                { label: 'Open Tickets', value: '12', icon: AlertCircle, color: 'text-amber-600' },
                { label: 'Servers', value: '45', icon: Server, color: 'text-blue-600' },
            ]}
        />
    );
};

export default ITPage;
