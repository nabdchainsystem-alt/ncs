import React from 'react';
import { Megaphone, TrendingUp, Users } from 'lucide-react';
import DepartmentAnalyticsPage from '../shared/DepartmentAnalyticsPage';

interface MarketingPageProps {
    activePage: string;
    allPageWidgets: Record<string, any[]>;
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const MarketingPage: React.FC<MarketingPageProps> = ({ activePage, allPageWidgets, widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <DepartmentAnalyticsPage
            activePage={activePage}
            allPageWidgets={allPageWidgets}
            widgets={widgets}
            onDeleteWidget={onDeleteWidget}
            onUpdateWidget={onUpdateWidget}
            placeholderIcon={<Megaphone />}
            placeholderTitle="Marketing Operations"
            placeholderDescription="Track campaigns, leads, and marketing ROI here. Use the 'Insert' menu to add custom tables and charts."
            defaultStats={[
                { label: 'Active Campaigns', value: '8', icon: Megaphone, color: 'text-purple-600' },
                { label: 'Leads Generated', value: '1,245', icon: Users, color: 'text-blue-600' },
                { label: 'Conversion Rate', value: '+22%', icon: TrendingUp, color: 'text-green-600' },
            ]}
        />
    );
};

export default MarketingPage;
