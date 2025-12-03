import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
    Search, Globe, Database, Activity, Layers, Cpu, Zap, Box, Hexagon, Network,
    BarChart3, PieChart, TrendingUp, Users, AlertCircle, CheckCircle2,
    ArrowUpRight, ArrowDownRight, Filter, Download, Share2, MoreHorizontal,
    Briefcase, Factory, Truck, Building2, ShoppingBag, Stethoscope, Sprout, Sparkles,
    Orbit, Atom, Rocket, Satellite
} from 'lucide-react';
import { globalIndustriesData, Industry } from '../../data/globalIndustriesData';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Pie, Cell, LineChart, Line, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis,
    ComposedChart, Legend, RadialBarChart, RadialBar
} from 'recharts';

// --- Mock Data ---
const distributionData = [
    { name: 'Manufacturing', value: 35, color: '#3b82f6' },
    { name: 'Services', value: 25, color: '#8b5cf6' },
    { name: 'Agriculture', value: 15, color: '#10b981' },
    { name: 'Tech', value: 15, color: '#f59e0b' },
    { name: 'Logistics', value: 10, color: '#ef4444' },
];

const trendData = Array.from({ length: 20 }, (_, i) => ({
    month: `T-${i}`,
    growth: Math.floor(Math.random() * 50) + 50,
    efficiency: Math.floor(Math.random() * 40) + 60,
    adoption: Math.floor(Math.random() * 30) + 20,
    entropy: Math.floor(Math.random() * 100),
}));

const scatterData = Array.from({ length: 50 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 500,
    fill: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)]
}));

const radarData = [
    { subject: 'Auto', A: 120, fullMark: 150 },
    { subject: 'Digi', A: 98, fullMark: 150 },
    { subject: 'Sust', A: 86, fullMark: 150 },
    { subject: 'Int', A: 99, fullMark: 150 },
    { subject: 'Scale', A: 85, fullMark: 150 },
    { subject: 'Res', A: 65, fullMark: 150 },
];

const radialData = [
    { name: 'L1', uv: 31.47, fill: '#8884d8' },
    { name: 'L2', uv: 26.69, fill: '#83a6ed' },
    { name: 'L3', uv: 15.69, fill: '#8dd1e1' },
    { name: 'L4', uv: 8.22, fill: '#82ca9d' },
    { name: 'L5', uv: 8.63, fill: '#a4de6c' },
];

// --- ECharts Options ---
const quantumOption = {
    backgroundColor: 'transparent',
    tooltip: {},
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
        {
            type: 'graph',
            layout: 'none',
            symbolSize: 50,
            roam: true,
            label: {
                show: true
            },
            edgeSymbol: ['circle', 'arrow'],
            edgeSymbolSize: [4, 10],
            edgeLabel: {
                fontSize: 20
            },
            data: [
                { name: 'Node 1', x: 300, y: 300, itemStyle: { color: '#ef4444' } },
                { name: 'Node 2', x: 800, y: 300, itemStyle: { color: '#3b82f6' } },
                { name: 'Node 3', x: 550, y: 100, itemStyle: { color: '#10b981' } },
                { name: 'Node 4', x: 550, y: 500, itemStyle: { color: '#f59e0b' } }
            ],
            links: [
                { source: 'Node 1', target: 'Node 3' },
                { source: 'Node 2', target: 'Node 3' },
                { source: 'Node 2', target: 'Node 4' },
                { source: 'Node 1', target: 'Node 4' }
            ],
            lineStyle: {
                opacity: 0.9,
                width: 2,
                curveness: 0
            }
        }
    ]
};

const strangeBarOption = {
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    xAxis: [
        {
            type: 'category',
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            axisTick: {
                alignWithLabel: true
            }
        }
    ],
    yAxis: [
        {
            type: 'value'
        }
    ],
    series: [
        {
            name: 'Direct',
            type: 'bar',
            barWidth: '60%',
            data: [10, 52, 200, 334, 390, 330, 220],
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#83bff6' },
                    { offset: 0.5, color: '#188df0' },
                    { offset: 1, color: '#188df0' }
                ])
            },
        }
    ]
};


// --- Components ---

const SolarCard = ({ title, children, className = "", icon: Icon }: any) => (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative ${className}`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30 backdrop-blur-sm">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                {Icon && <Icon className="w-4 h-4 text-blue-500" />}
                {title}
            </h3>
            <MoreHorizontal className="w-4 h-4 text-gray-300 cursor-pointer hover:text-blue-500 transition-colors" />
        </div>
        <div className="p-4 relative">
            {children}
        </div>
    </div>
);

const OrbitingPlanet = ({ color, size, duration, delay, radius }: any) => (
    <div
        className="absolute top-1/2 left-1/2 rounded-full border border-gray-200"
        style={{
            width: radius * 2,
            height: radius * 2,
            marginLeft: -radius,
            marginTop: -radius,
        }}
    >
        <motion.div
            className={`absolute top-0 left-1/2 rounded-full ${color} shadow-lg`}
            style={{
                width: size,
                height: size,
                marginLeft: -size / 2,
                marginTop: -size / 2,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: duration, repeat: Infinity, ease: "linear", delay: delay }}
            style={{ originX: 0.5, originY: radius / size + 0.5 }} // Pivot around center
        />
    </div>
);

// Simplified Orbit Animation for "Solar System" feel
const SolarSystemWidget = () => (
    <div className="relative w-full h-64 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100" />

        {/* Sun */}
        <div className="absolute w-16 h-16 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-full shadow-[0_0_40px_rgba(251,191,36,0.6)] z-10 flex items-center justify-center">
            <Globe className="w-8 h-8 text-white animate-pulse" />
        </div>

        {/* Orbits */}
        <div className="absolute w-32 h-32 border border-slate-300 rounded-full opacity-50 animate-[spin_10s_linear_infinite]" />
        <div className="absolute w-32 h-32 rounded-full animate-[spin_10s_linear_infinite]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-md" />
        </div>

        <div className="absolute w-48 h-48 border border-slate-300 rounded-full opacity-40 animate-[spin_15s_linear_infinite_reverse]" />
        <div className="absolute w-48 h-48 rounded-full animate-[spin_15s_linear_infinite_reverse]">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 bg-purple-500 rounded-full shadow-md" />
        </div>

        <div className="absolute w-64 h-64 border border-slate-300 rounded-full opacity-30 animate-[spin_25s_linear_infinite]" />
        <div className="absolute w-64 h-64 rounded-full animate-[spin_25s_linear_infinite]">
            <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full shadow-md" />
        </div>
    </div>
);

export const GlobalIndustriesMasterPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);

    const filteredIndustries = useMemo(() => {
        return globalIndustriesData.filter(industry =>
            industry.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
            industry.nameAr.includes(searchQuery)
        );
    }, [searchQuery]);

    return (
        <div className="min-h-screen bg-gray-50/50 text-gray-900 font-sans p-6 overflow-y-auto">

            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full">System v9.0</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Holographic Mode</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                        <Atom className="w-10 h-10 text-blue-600 animate-spin-slow" />
                        GLOBAL INDUSTRIES <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">NEXUS</span>
                    </h1>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-gray-600">LIVE DATA STREAM</span>
                    </div>
                </div>
            </div>

            {/* Main Grid Layout - 10 Sections */}
            <div className="grid grid-cols-12 gap-6 pb-20">

                {/* Section 2: The Sun (Central KPI) */}
                <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-4">
                    <SolarCard title="System Core" icon={Orbit} className="col-span-2 bg-gradient-to-br from-white to-blue-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-5xl font-black text-gray-900 mb-2">236</h2>
                                <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">Master Industries Mapped</p>
                            </div>
                            <div className="h-24 w-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData.slice(0, 10)}>
                                        <defs>
                                            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="growth" stroke="#8884d8" fillOpacity={1} fill="url(#colorPv)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </SolarCard>

                    {/* Section 3: Inner Planets (KPIs) */}
                    <SolarCard title="Efficiency" icon={Zap}>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900">98.2%</span>
                            <span className="text-xs text-green-600 font-bold mb-1 flex items-center"><ArrowUpRight className="w-3 h-3" /> +2.4%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1 mt-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full w-[98%]" />
                        </div>
                    </SolarCard>
                    <SolarCard title="Network Load" icon={Network}>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900">45TB</span>
                            <span className="text-xs text-blue-600 font-bold mb-1">/ sec</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1 mt-2 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full w-[65%]" />
                        </div>
                    </SolarCard>
                </div>

                {/* Section 4: Solar System Visual */}
                <div className="col-span-12 lg:col-span-4">
                    <SolarCard title="Orbital Status" icon={Rocket} className="h-full">
                        <SolarSystemWidget />
                    </SolarCard>
                </div>

                {/* Section 5: Gas Giant 1 (Complex Area Chart) */}
                <div className="col-span-12 lg:col-span-6">
                    <SolarCard title="Sector Expansion Trajectory" icon={TrendingUp}>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={trendData}>
                                    <CartesianGrid stroke="#f5f5f5" />
                                    <XAxis dataKey="month" scale="band" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="growth" fill="#8884d8" stroke="#8884d8" />
                                    <Bar dataKey="efficiency" barSize={20} fill="#413ea0" />
                                    <Line type="monotone" dataKey="adoption" stroke="#ff7300" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </SolarCard>
                </div>

                {/* Section 6: Gas Giant 2 (Scatter Chart) */}
                <div className="col-span-12 lg:col-span-6">
                    <SolarCard title="Market Cluster Analysis" icon={Box}>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" dataKey="x" name="Risk" unit="%" tick={{ fontSize: 10 }} />
                                    <YAxis type="number" dataKey="y" name="Reward" unit="%" tick={{ fontSize: 10 }} />
                                    <ZAxis type="number" dataKey="z" range={[60, 400]} name="Volume" />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Clusters" data={scatterData} fill="#8884d8" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </SolarCard>
                </div>

                {/* Section 7: The Rings (Radial) */}
                <div className="col-span-12 lg:col-span-4">
                    <SolarCard title="Resource Distribution" icon={PieChart}>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={radialData}>
                                    <RadialBar
                                        label={{ position: 'insideStart', fill: '#fff' }}
                                        background
                                        dataKey="uv"
                                    />
                                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ fontSize: '10px' }} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </SolarCard>
                </div>

                {/* Section 8: Nebula (Radar) */}
                <div className="col-span-12 lg:col-span-4">
                    <SolarCard title="Capability Matrix" icon={Hexagon}>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 150]} />
                                    <Radar name="Mike" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </SolarCard>
                </div>

                {/* Section 8.5: Quantum Entanglement (ECharts) */}
                <div className="col-span-12 lg:col-span-4">
                    <SolarCard title="Quantum Entanglement" icon={Atom}>
                        <div className="h-64">
                            <ReactECharts option={quantumOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </SolarCard>
                </div>

                {/* Section 9: Galaxy Grid (Full Width Table) */}
                <div className="col-span-12">
                    <SolarCard title="Universal Registry" icon={Database} className="overflow-hidden">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search entire database..."
                                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors">
                                Filter View
                            </button>
                        </div>

                        <div className="overflow-x-auto max-h-[200px] overflow-y-auto border border-gray-100 rounded-lg custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3">ID</th>
                                        <th className="px-6 py-3">Industry Name (EN)</th>
                                        <th className="px-6 py-3 text-right">Industry Name (AR)</th>
                                        <th className="px-6 py-3">Core Departments</th>
                                        <th className="px-6 py-3 text-center">AI Score</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {filteredIndustries.slice(0, 50).map((industry) => (
                                        <tr
                                            key={industry.id}
                                            className={`hover:bg-blue-50/50 transition-colors cursor-pointer group ${selectedIndustry?.id === industry.id ? 'bg-blue-50' : ''}`}
                                            onClick={() => setSelectedIndustry(industry)}
                                        >
                                            <td className="px-6 py-3 font-mono text-gray-400 group-hover:text-blue-500">#{industry.id}</td>
                                            <td className="px-6 py-3 font-bold text-gray-800">{industry.nameEn}</td>
                                            <td className="px-6 py-3 text-right font-arabic text-gray-600">{industry.nameAr}</td>
                                            <td className="px-6 py-3 text-gray-500 truncate max-w-xs">{industry.departmentsEn}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">
                                                    {Math.floor(Math.random() * 20) + 80}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button className="text-gray-300 hover:text-blue-600">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SolarCard>
                </div>

                {/* Section 10: Deep Space (Footer/Insights) */}
                <div className="col-span-12 lg:col-span-4">
                    <SolarCard title="AI Predictions" icon={Sparkles} className="bg-gradient-to-br from-indigo-50 to-white h-full">
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-indigo-100 shadow-sm">
                                <div className="p-2 bg-indigo-100 rounded-full">
                                    <Cpu className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Pattern Detected</h4>
                                    <p className="text-xs text-gray-500 mt-1">Unusual growth in Sector 7. Recommend immediate resource allocation.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-indigo-100 shadow-sm">
                                <div className="p-2 bg-purple-100 rounded-full">
                                    <Satellite className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Satellite Link</h4>
                                    <p className="text-xs text-gray-500 mt-1">Global market data synced. Latency: 12ms.</p>
                                </div>
                            </div>
                        </div>
                    </SolarCard>
                </div>

                <div className="col-span-12 lg:col-span-8">
                    <SolarCard title="System Logs" icon={Database} className="h-full">
                        <div className="font-mono text-xs text-gray-500 space-y-1 h-32 overflow-y-auto custom-scrollbar">
                            <p><span className="text-green-600">[SUCCESS]</span> Module 'Manufacturing' loaded in 0.02s</p>
                            <p><span className="text-blue-600">[INFO]</span> User session active: ID-8821</p>
                            <p><span className="text-yellow-600">[WARN]</span> High traffic detected in 'Tech' sector</p>
                            <p><span className="text-green-600">[SUCCESS]</span> Database sync complete. 236 records updated.</p>
                            <p><span className="text-blue-600">[INFO]</span> Rendering holographic interface...</p>
                            <p><span className="text-green-600">[SUCCESS]</span> Solar System Widget initialized.</p>
                        </div>
                    </SolarCard>
                </div>

                {/* NEW Section 11: Predictive Modeling (Holographic) */}
                <div className="col-span-12 lg:col-span-6">
                    <SolarCard title="Predictive Modeling" icon={Atom} className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none shadow-xl">
                        <div className="relative h-48 overflow-hidden rounded-lg bg-black/20 backdrop-blur-md border border-white/10 p-4">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            <div className="relative z-10 flex items-center justify-between h-full">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                        <span className="text-cyan-300 font-mono text-xs tracking-widest">SIMULATION ACTIVE</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Market Evolution</h3>
                                    <p className="text-slate-400 text-xs max-w-[200px]">Projecting 5-year growth based on current adoption rates.</p>
                                </div>
                                <div className="h-32 w-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trendData.slice(0, 10)}>
                                            <Line type="monotone" dataKey="entropy" stroke="#22d3ee" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="growth" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </SolarCard>
                </div>

                {/* NEW Section 12: Global Sentiment (Holographic) */}
                <div className="col-span-12 lg:col-span-6">
                    <SolarCard title="Global Sentiment" icon={Globe} className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white border-none shadow-xl">
                        <div className="relative h-48 overflow-hidden rounded-lg bg-black/20 backdrop-blur-md border border-white/10 p-4 flex items-center justify-center">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                            <div className="grid grid-cols-3 gap-4 w-full relative z-10">
                                <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                                    <div className="text-3xl font-bold text-emerald-400 mb-1">88%</div>
                                    <div className="text-[10px] text-slate-300 uppercase tracking-wider">Positive</div>
                                </div>
                                <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                                    <div className="text-3xl font-bold text-amber-400 mb-1">10%</div>
                                    <div className="text-[10px] text-slate-300 uppercase tracking-wider">Neutral</div>
                                </div>
                                <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                                    <div className="text-3xl font-bold text-rose-400 mb-1">2%</div>
                                    <div className="text-[10px] text-slate-300 uppercase tracking-wider">Negative</div>
                                </div>
                            </div>
                        </div>
                    </SolarCard>
                </div>

            </div>
        </div>
    );
};

export default GlobalIndustriesMasterPage;
