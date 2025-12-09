import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, BarChart2, TrendingUp, PieChart, ArrowUpRight } from 'lucide-react';

export const ChartsVisual = () => {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        // Generate initial data
        const initialData = Array.from({ length: 12 }, (_, i) => ({
            name: `H${i + 1}`,
            efficiency: 85 + Math.random() * 10,
            energy: 40 + Math.random() * 20,
            output: 2000 + Math.random() * 500
        }));
        setData(initialData);

        // Live update interval
        const interval = setInterval(() => {
            setData(prev => {
                const newData = [...prev.slice(1)];
                newData.push({
                    name: `H${parseInt(prev[prev.length - 1].name.substring(1)) + 1}`,
                    efficiency: 85 + Math.random() * 10,
                    energy: 40 + Math.random() * 20,
                    output: 2000 + Math.random() * 500
                });
                return newData;
            });
        }, 300); // Fast updates for visual flair

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[95%] h-full bg-[#0f1115]/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <BarChart2 className="text-indigo-400 w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Production Analytics</h2>
                            <div className="text-xs text-gray-400 font-mono">LIVE MONITORING</div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Efficiency</div>
                            <div className="text-xl font-mono font-bold text-emerald-400">94.2%</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total Output</div>
                            <div className="text-xl font-mono font-bold text-white">142,500</div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 grid grid-cols-2 gap-6">
                    {/* Main Chart */}
                    <div className="col-span-2 md:col-span-1 bg-black/20 rounded-xl border border-white/5 p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Activity size={14} className="text-indigo-400" />
                                Efficiency Trends
                            </h3>
                            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                <ArrowUpRight size={10} /> +2.4%
                            </span>
                        </div>
                        <div className="flex-1 w-full min-h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={10} tickLine={false} domain={[80, 100]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="efficiency" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorEff)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Secondary Chart */}
                    <div className="col-span-2 md:col-span-1 bg-black/20 rounded-xl border border-white/5 p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <TrendingUp size={14} className="text-emerald-400" />
                                Hourly Output
                            </h3>
                            <span className="text-xs text-gray-500">Last 12 Hours</span>
                        </div>
                        <div className="flex-1 w-full min-h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="output" fill="#34d399" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
