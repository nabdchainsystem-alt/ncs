import React from 'react';
import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import DepartmentAnalyticsPage from '../shared/DepartmentAnalyticsPage';

interface QualityPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const QualityPage: React.FC<QualityPageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<CheckCircle2 />}
            placeholderTitle="Quality Assurance"
            placeholderDescription="Track quality metrics, defect rates, and compliance standards here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'Pass Rate', value: '99.2%', icon: CheckCircle2, color: 'text-green-600' },
                { label: 'Defects Found', value: '23', icon: AlertCircle, color: 'text-red-600' },
                { label: 'Improvement', value: '+5.2%', icon: TrendingUp, color: 'text-blue-600' },
            ]}
        />
    );
};

export default QualityPage;
