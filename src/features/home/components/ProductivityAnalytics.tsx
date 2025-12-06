import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Activity, CheckCircle2, Clock, Zap, Target, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const ProductivityAnalytics = () => {
    const [timeRange, setTimeRange] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

    // --- Chart Configuration ---
    const getChartData = () => {
        if (timeRange === 'weekly') {
            return {
                xAxis: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                data: [12, 19, 15, 22, 28, 14, 10]
            };
        } else if (timeRange === 'monthly') {
            return {
                xAxis: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                data: [65, 82, 70, 95]
            };
        } else {
            return {
                xAxis: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                data: [220, 240, 280, 250, 310, 350, 340, 380, 410, 450, 430, 480]
            };
        }
    };

    const chartData = getChartData();

    const chartOption = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#e7e5e4', // stone-200
            textStyle: { color: '#1c1917' }, // stone-900
            padding: [10, 14],
            formatter: '{b}: <b>{c} Tasks</b>'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: chartData.xAxis,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#a8a29e', fontSize: 11, fontFamily: 'serif' } // stone-400
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f5f5f4', type: 'dashed' } }, // stone-100
            axisLabel: { color: '#a8a29e', fontSize: 11, fontFamily: 'serif' }
        },
        series: [
            {
                data: chartData.data,
                type: 'bar',
                showBackground: true,
                backgroundStyle: {
                    color: '#fafaf9', // stone-50
                    borderRadius: [4, 4, 0, 0]
                },
                itemStyle: {
                    color: '#1c1917', // stone-900
                    borderRadius: [4, 4, 0, 0]
                },
                barWidth: timeRange === 'yearly' ? '40%' : '30%'
            }
        ]
    };

    // --- KPI Component ---
    const KPI = ({ title, value, trend, isPositive, icon: Icon, color = "stone" }: any) => {
        const bgColors: any = {
            stone: 'bg-white',
            emerald: 'bg-emerald-50/50',
            indigo: 'bg-indigo-50/50',
            amber: 'bg-amber-50/50',
        };
        const iconColors: any = {
            stone: 'text-stone-900',
            emerald: 'text-emerald-600',
            indigo: 'text-indigo-600',
            amber: 'text-amber-600',
        };

        return (
            <div className={`${bgColors[color]} p-5 rounded-3xl border border-stone-100 shadow-sm flex flex-col justify-between h-full group hover:shadow-md transition-all`}>
                <div className="flex justify-between items-start mb-2">
                    <div className={`p-2 rounded-xl bg-white shadow-sm border border-stone-50`}>
                        <Icon size={18} className={iconColors[color]} />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${isPositive ? 'bg-emerald-100/50 text-emerald-700' : 'bg-rose-100/50 text-rose-700'}`}>
                        {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {trend}
                    </div>
                </div>
                <div>
                    <div className="text-2xl font-serif font-bold text-stone-900">{value}</div>
                    <div className="text-xs font-bold text-stone-400 tracking-wide uppercase mt-1">{title}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full mt-6 animate-fade-in-up delay-100">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[320px]">

                {/* Left: Interactive Bar Chart */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-stone-50 rounded-xl">
                                <Activity size={20} className="text-stone-900" />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-lg text-stone-900 italic">Productivity Trends</h3>
                                <p className="text-xs text-stone-400 font-medium">Tasks completed over time</p>
                            </div>
                        </div>
                        <div className="flex bg-stone-100 p-1 rounded-xl">
                            {(['weekly', 'monthly', 'yearly'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeRange(t)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${timeRange === t
                                            ? 'bg-white text-stone-900 shadow-sm'
                                            : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 min-h-[200px] w-full">
                        <ReactECharts
                            option={chartOption}
                            style={{ height: '100%', width: '100%' }}
                            opts={{ renderer: 'svg' }}
                        />
                    </div>
                </div>

                {/* Right: 4 KPI Cards Grid (2x2) */}
                <div className="grid grid-cols-2 gap-4 h-full">
                    <KPI
                        title="Completed"
                        value="128"
                        trend="+12%"
                        isPositive={true}
                        icon={CheckCircle2}
                        color="emerald"
                    />
                    <KPI
                        title="Focus Hours"
                        value="32h"
                        trend="+4%"
                        isPositive={true}
                        icon={Zap}
                        color="indigo"
                    />
                    <KPI
                        title="Pending"
                        value="14"
                        trend="-2%"
                        isPositive={true} // Less pending is good usually, but simplified logic
                        icon={Clock}
                        color="amber"
                    />
                    <KPI
                        title="Goals Met"
                        value="3/5"
                        trend="On Track"
                        isPositive={true}
                        icon={Target}
                        color="stone"
                    />
                </div>
            </div>
        </div>
    );
};
