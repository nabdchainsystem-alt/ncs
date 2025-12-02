import React from 'react';

import { FileText, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Activity, Briefcase, BarChart3, PieChart, Layers, Zap } from 'lucide-react';

export interface SummaryStat {
    title: string;
    value: string;
    trend: string;
    trendDirection: 'up' | 'down';
    icon: any;
    color: string;
}

interface DashboardSummaryProps {
    title?: string;
    subtitle?: string;
    description?: string;
    stats?: SummaryStat[];
    chartData?: {
        categories: string[];
        values: number[];
    };
    showWiki?: boolean;
}

const KPICard: React.FC<SummaryStat> = ({ title, value, trend, trendDirection, icon: Icon, color }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{value}</h3>
            <div className={`flex items-center gap-1 text-xs font-medium ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trendDirection === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {trend}
            </div>
        </div>
        <div className={`p-2 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${color}20`, color: color }}>
            <Icon size={20} />
        </div>
    </div>
);

const DashboardSummary: React.FC<DashboardSummaryProps> = ({
    title = "Executive Overview",
    subtitle = "Performance Hub",
    description = "Welcome to your central command center. This dashboard aggregates real-time data, providing actionable insights into your department's performance and operational efficiency.",
    stats = [],
    chartData,
    showWiki = false
}) => {
    // Default stats if none provided
    const displayStats = stats.length > 0 ? stats : [
        { title: 'Total Records', value: '0', trend: '0%', trendDirection: 'up', icon: Layers, color: '#3b82f6' },
        { title: 'Active Widgets', value: '0', trend: '0%', trendDirection: 'up', icon: Activity, color: '#8b5cf6' },
        { title: 'Data Sources', value: '0', trend: '0%', trendDirection: 'up', icon: FileText, color: '#f59e0b' },
        { title: 'Reports', value: '0', trend: '0%', trendDirection: 'up', icon: BarChart3, color: '#10b981' },
    ] as SummaryStat[];

    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);



    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
            <div className="flex flex-col gap-4">
                {/* Top Row: Text & KPIs */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Text & Wiki */}
                    <div className="lg:col-span-5 flex flex-col justify-center">
                        <div className="mb-3">
                            <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold tracking-wide uppercase mb-2">
                                {title}
                            </span>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{subtitle}</h2>
                            <div className="text-sm text-gray-500 max-w-3xl leading-relaxed space-y-2 text-justify">
                                <p>{description}</p>
                                <p>
                                    Monitor key performance indicators and track operational efficiency in real-time.
                                    This dashboard provides a comprehensive view of your department's health,
                                    enabling data-driven decision-making and strategic planning.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-4">
                            {showWiki && (
                                <a
                                    href="/procurement_system_wiki.pdf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-black border border-black rounded-md hover:bg-gray-800 transition-colors shadow-sm"
                                >
                                    <FileText size={14} className="mr-1.5 text-gray-300" />
                                    Procurement Wiki
                                </a>
                            )}

                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 ml-1 flex items-center gap-1">
                            <Activity size={10} />
                            Updated: Nov 28, 2025
                        </p>
                    </div>

                    {/* Right Column: KPIs */}
                    <div className="lg:col-span-7">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
                            {displayStats.map((kpi, index) => (
                                <KPICard key={index} {...kpi} />
                            ))}
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default DashboardSummary;
