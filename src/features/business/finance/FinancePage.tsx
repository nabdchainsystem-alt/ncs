import React from 'react';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import DepartmentAnalyticsPage from '../../shared/DepartmentAnalyticsPage';

interface FinancePageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const FinancePage: React.FC<FinancePageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<DollarSign />}
            placeholderTitle="Finance Operations"
            placeholderDescription="Manage budgets, expenses, and financial reporting here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'Total Budget', value: '$2.5M', icon: DollarSign, color: 'text-green-600' },
                { label: 'Expenses', value: '$1.8M', icon: CreditCard, color: 'text-red-600' },
                { label: 'Variance', value: '+12%', icon: TrendingUp, color: 'text-blue-600' },
            ]}
        />
    );
};

export default FinancePage;
