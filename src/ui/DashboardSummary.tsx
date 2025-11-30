import React from 'react';
import ReactECharts from 'echarts-for-react';
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

    const chartOption = {
        grid: { top: 20, bottom: 20, left: 40, right: 10, containLabel: true },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#e5e7eb',
            textStyle: { color: '#374151' }
        },
        xAxis: {
            type: 'category',
            data: chartData?.categories || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#9ca3af', fontSize: 11, interval: 0 }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
            axisLabel: { color: '#9ca3af', fontSize: 11, formatter: (value: number) => value >= 1000 ? `${value / 1000}k` : value }
        },
        series: [{
            data: chartData?.values || [0, 0, 0, 0, 0, 0],
            type: 'bar',
            showBackground: true,
            backgroundStyle: {
                color: 'rgba(180, 180, 180, 0.1)',
                borderRadius: [4, 4, 0, 0]
            },
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: '#3b82f6' }, // Blue at top
                        { offset: 1, color: '#60a5fa' }  // Lighter blue at bottom
                    ]
                },
                borderRadius: [4, 4, 0, 0]
            },
            barWidth: '50%',
            animationDuration: 2000,
            animationEasing: 'elasticOut'
        }]
    };

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

                {/* Bottom Row: Chart */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 w-full">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Activity Overview</h3>
                        <select className="bg-white border border-gray-200 text-[10px] rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 text-gray-600">
                            <option>Last 6 Months</option>
                            <option>Year to Date</option>
                        </select>
                    </div>
                    <div className="h-[220px] w-full relative">
                        {isLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 rounded-xl">
                                <div className="flex items-end justify-center space-x-2 h-24 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-4 bg-blue-500/80 rounded-t-sm"
                                            style={{
                                                animation: 'grow 1.5s ease-in-out infinite',
                                                animationDelay: `${i * 0.15}s`
                                            }}
                                        />
                                    ))}
                                    <style>{`
                                        @keyframes grow {
                                            0%, 100% { height: 20%; opacity: 0.3; }
                                            50% { height: 80%; opacity: 1; }
                                        }
                                    `}</style>
                                </div>
                                <span className="text-xs font-medium text-gray-400 animate-pulse">Loading data...</span>
                            </div>
                        ) : (
                            <ReactECharts
                                option={chartOption}
                                style={{ height: '100%', width: '100%' }}
                                opts={{ renderer: 'svg' }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSummary;
