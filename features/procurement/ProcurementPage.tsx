import React from 'react';
import { ShoppingCart, DollarSign, TrendingDown } from 'lucide-react';
import DepartmentAnalyticsPage from '../shared/DepartmentAnalyticsPage';

import procurementTables from '../../data/reports/supply_chain_reports/procurement/procurement_tables.json';

interface ProcurementPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const ProcurementPage: React.FC<ProcurementPageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<ShoppingCart />}
            placeholderTitle="Procurement Operations"
            placeholderDescription="Manage purchase orders, vendor relationships, and procurement metrics here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'Active POs', value: '34', icon: ShoppingCart, color: 'text-blue-600' },
                { label: 'Total Spend', value: '$450K', icon: DollarSign, color: 'text-green-600' },
                { label: 'Cost Savings', value: '-8%', icon: TrendingDown, color: 'text-emerald-600' },
            ]}
        />
    );
};

export default ProcurementPage;
