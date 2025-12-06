import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BarChart2, AlertCircle, CheckCircle2, Factory, Timer, Settings, ArrowRight, Zap, TrendingDown, BookOpen, Calculator, Info, PieChart, Hexagon } from 'lucide-react';
import breakdownData from '../data/machineBreakdown.json';

// --- Types ---
type BreakdownEntry = {
    month: string;
    machine: string;
    category: string;
    cause: string;
    timeMin: number;
    fg: number;
};

type MachineStats = {
    id: string;
    totalTime: number;
    runningTime: number;
    breakdownTime: number;
    fgProduced: number;
    efficiency: number;
    topCause: string;
    status: 'running' | 'stopped' | 'maintenance';
};

// --- Custom SVG Components (No Recharts dependency) ---

const CustomBarChart = ({ data }: { data: { label: string, v1: number, v2: number, max: number }[] }) => (
    <div className="w-full h-48 flex items-end gap-4 px-2">
        {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full h-full flex flex-col justify-end gap-0.5 relative">
                    <div className="absolute -top-6 w-full text-center text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {((d.v1 / (d.v1 + d.v2)) * 100).toFixed(0)}%
                    </div>
                    {/* Breakdown Bar */}
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.v2 / d.max) * 80}% ` }}
                        transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                        className="w-full bg-red-500/80 rounded-t-sm relative group-hover:bg-red-500 transition-colors"
                    />
                    {/* Running Bar */}
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.v1 / d.max) * 80}% ` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="w-full bg-green-500/80 rounded-b-sm relative group-hover:bg-green-500 transition-colors"
                    />
                </div>
                <span className="text-xs font-mono text-gray-500">{d.label}</span>
            </div>
        ))}
    </div>
);

const CustomPieChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    let currentAngle = 0;

    return (
        <div className="relative w-48 h-48 mx-auto">
            <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full overflow-visible">
                {data.map((d, i) => {
                    const angle = (d.value / total) * 360;
                    const x1 = 50 + 40 * Math.cos(Math.PI * currentAngle / 180);
                    const y1 = 50 + 40 * Math.sin(Math.PI * currentAngle / 180);
                    const x2 = 50 + 40 * Math.cos(Math.PI * (currentAngle + angle) / 180);
                    const y2 = 50 + 40 * Math.sin(Math.PI * (currentAngle + angle) / 180);

                    const largeArc = angle > 180 ? 1 : 0;

                    const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

                    const slice = (
                        <motion.path
                            key={i}
                            d={path}
                            fill={d.color}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            stroke="#1a1d24"
                            strokeWidth="1"
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                    );
                    currentAngle += angle;
                    return slice;
                })}
                {/* Center Hole for Donut Effect */}
                <circle cx="50" cy="50" r="25" fill="#1a1d24" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <span className="block text-xl font-bold text-white">{total > 1000 ? '42k+' : total}</span>
                    <span className="text-[8px] text-gray-500 uppercase">Mins Lost</span>
                </div>
            </div>
        </div>
    );
};

const SunburstChart = ({ data }: { data: { name: string, value: number, children?: { name: string, value: number }[], color: string }[] }) => {
    // Flatten data for two rings
    // Inner Ring: Categories
    // Outer Ring: Causes

    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    const center = 150;
    const radiusInner = 60;
    const radiusOuter = 100;

    let currentAngle = 0;

    return (
        <div className="relative w-full h-[300px] flex items-center justify-center">
            <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
                {/* Inner Ring (Categories) */}
                {data.map((category, i) => {
                    const percent = category.value / total;
                    const angleSize = percent * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angleSize;

                    // SVG Arc Logic
                    const startRad = (startAngle - 90) * Math.PI / 180;
                    const endRad = (endAngle - 90) * Math.PI / 180;

                    const x1 = center + radiusInner * Math.cos(startRad);
                    const y1 = center + radiusInner * Math.sin(startRad);
                    const x2 = center + radiusOuter * 0.6 * Math.cos(startRad); // Inner radius visual start
                    const y2 = center + radiusOuter * 0.6 * Math.sin(startRad);

                    // Correct Arc Path
                    // We need an arc from start to end at radiusInner
                    // And maybe a thicker stroke or path

                    // Let's use simple thick strokes for now or proper arc paths
                    // Path for a slice:
                    // Move to inner radius start, line to outer, arc to outer end, line to inner end, arc to inner start

                    const rIn = 40;
                    const rOut = 80;

                    const x1In = center + rIn * Math.cos(startRad);
                    const y1In = center + rIn * Math.sin(startRad);
                    const x1Out = center + rOut * Math.cos(startRad);
                    const y1Out = center + rOut * Math.sin(startRad);

                    const x2In = center + rIn * Math.cos(endRad);
                    const y2In = center + rIn * Math.sin(endRad);
                    const x2Out = center + rOut * Math.cos(endRad);
                    const y2Out = center + rOut * Math.sin(endRad);

                    const largeArc = angleSize > 180 ? 1 : 0;

                    const path = `
                         M ${x1In} ${y1In}
                         L ${x1Out} ${y1Out}
                         A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2Out} ${y2Out}
                         L ${x2In} ${y2In}
                         A ${rIn} ${rIn} 0 ${largeArc} 0 ${x1In} ${y1In}
Z
    `;

                    // Draw Children (Outer Ring)
                    let childAngle = currentAngle;
                    const childrenElements = category.children?.map((child, j) => {
                        const childPercent = child.value / total;
                        const childAngleSize = childPercent * 360;
                        const childStartRad = (childAngle - 90) * Math.PI / 180;
                        const childEndRad = (childAngle + childAngleSize - 90) * Math.PI / 180;

                        const rChildIn = 82;
                        const rChildOut = 120;

                        const cx1In = center + rChildIn * Math.cos(childStartRad);
                        const cy1In = center + rChildIn * Math.sin(childStartRad);
                        const cx1Out = center + rChildOut * Math.cos(childStartRad);
                        const cy1Out = center + rChildOut * Math.sin(childStartRad);

                        const cx2In = center + rChildIn * Math.cos(childEndRad);
                        const cy2In = center + rChildIn * Math.sin(childEndRad);
                        const cx2Out = center + rChildOut * Math.cos(childEndRad);
                        const cy2Out = center + rChildOut * Math.sin(childEndRad);

                        const childLargeArc = childAngleSize > 180 ? 1 : 0;

                        const childPath = `
                             M ${cx1In} ${cy1In}
                             L ${cx1Out} ${cy1Out}
                             A ${rChildOut} ${rChildOut} 0 ${childLargeArc} 1 ${cx2Out} ${cy2Out}
                             L ${cx2In} ${cy2In}
                             A ${rChildIn} ${rChildIn} 0 ${childLargeArc} 0 ${cx1In} ${cy1In}
Z
                         `;

                        childAngle += childAngleSize;
                        return (
                            <motion.path
                                key={`${i} -${j} `}
                                d={childPath}
                                fill={category.color}
                                fillOpacity={0.6 + (j % 2) * 0.2}
                                stroke="#1a1d24"
                                strokeWidth="1"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + j * 0.05 }}
                                whileHover={{ scale: 1.05, fillOpacity: 1 }}
                            >
                                <title>{child.name}: {child.value} min</title>
                            </motion.path>
                        );
                    });

                    currentAngle += angleSize;

                    return (
                        <g key={i}>
                            <motion.path
                                d={path}
                                fill={category.color}
                                stroke="#1a1d24"
                                strokeWidth="1"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <title>{category.name}: {category.value} min</title>
                            </motion.path>
                            {childrenElements}
                        </g>
                    );
                })}
                <circle cx={center} cy={center} r={35} fill="#1a1d24" />
                <text x={center} y={center} textAnchor="middle" dy=".3em" fill="white" fontSize="12" fontWeight="bold">TOTAL</text>
            </svg>
        </div>
    );
};

const SciFiRadarChart = ({ machines }: { machines: MachineStats[] }) => {
    // Normalize Data (0-1 Scale)
    const metrics = ['Efficiency', 'Output', 'Stability', 'Speed', 'Quality'];
    const maxOutput = Math.max(...machines.map(m => m.fgProduced));
    const maxTotal = Math.max(...machines.map(m => m.totalTime));

    const getPoints = (stats: MachineStats, index: number) => {
        // Mocking some secondary metrics for the visual complexity
        const efficiency = stats.efficiency / 100;
        const output = stats.fgProduced / maxOutput;
        const stability = 1 - (stats.breakdownTime / stats.totalTime); // Inverse of downtime
        const speed = (stats.fgProduced / stats.runningTime) / (maxOutput / maxTotal) * 0.8; // Normalized speed
        const quality = 0.95 + (index * 0.01); // Mock quality as data is missing

        const values = [efficiency, output, stability, speed, quality];

        return values.map((v, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const r = v * 80; // Radius 100
            return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)} `;
        }).join(' ');
    };

    const colors = ['#a855f7', '#3b82f6', '#22c55e', '#f97316'];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative py-12">
            <div className="absolute inset-0 grid place-items-center opacity-20 pointer-events-none">
                {[20, 40, 60, 80, 100].map(r => (
                    <div key={r} className="rounded-full border border-white" style={{ width: `${r * 1.6}% `, height: `${r * 1.6}% ` }} />
                ))}
                <div className="absolute w-full h-[1px] bg-white top-1/2 left-0" />
                <div className="absolute h-full w-[1px] bg-white top-0 left-1/2" />
                {/* Diagonal Lines */}
                <div className="absolute w-full h-[1px] bg-white top-1/2 left-0 rotate-72" />
                <div className="absolute w-full h-[1px] bg-white top-1/2 left-0 -rotate-72" />
            </div>

            {/* Adjusted SVG viewBox and increased container padding to fix clipping */}
            <svg viewBox="-20 -20 240 240" className="w-[90%] h-[90%] overflow-visible relative z-10">
                {machines.map((m, i) => (
                    <g key={m.id}>
                        <motion.polygon
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 0.4, scale: 1 }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            points={getPoints(m, i)}
                            fill={colors[i]}
                            className="blur-sm"
                        />
                        <motion.polygon
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, delay: i * 0.2 }}
                            points={getPoints(m, i)}
                            fill="transparent"
                            stroke={colors[i]}
                            strokeWidth="2"
                        />
                        {/* Labels for Legend */}
                    </g>
                ))}
            </svg>

            {/* Data Points Labels */}
            {metrics.map((label, i) => {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                // Adjusted radius for labels to be further out
                const x = 50 + 45 * Math.cos(angle);
                const y = 50 + 45 * Math.sin(angle);
                return (
                    <div
                        key={label}
                        className="absolute text-[10px] uppercase font-bold text-gray-400 bg-black/50 px-1 rounded backdrop-blur-sm shadow-sm border border-white/5"
                        style={{ top: `${y}% `, left: `${x}% `, transform: 'translate(-50%, -50%)' }}
                    >
                        {label}
                    </div>
                )
            })}

            <div className="absolute bottom-2 flex gap-4">
                {machines.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }} />
                        <span className="text-[10px] text-gray-400 font-mono">{m.id}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


// Simplified Bar Chart for Single Metric (e.g. Downtime)
const SimpleBarChart = ({ data, color = "#ef4444" }: { data: { label: string, value: number, max: number }[], color?: string }) => (
    <div className="w-full h-48 flex items-end gap-2 px-2 pt-6">
        {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="w-full h-full flex flex-col justify-end relative bg-white/5 rounded-t-sm overflow-hidden">
                    <div className="absolute -top-6 w-full text-center text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.value.toLocaleString()}m
                    </div>
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.value / d.max) * 85}% ` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        className="w-full rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: color }}
                    />
                </div>
                <span className="text-xs font-mono text-gray-500 truncate w-full text-center">{d.label}</span>
            </div>
        ))}
    </div>
);

const AnalyticsPage = ({ aggregatedData, rawData, chartData, sunburstData }: { aggregatedData: MachineStats[], rawData: BreakdownEntry[], chartData: any[], sunburstData: any[] }) => {
    return (
        <div className="w-full h-full overflow-y-auto pr-2 custom-scrollbar">

            {/* Top Charts Section (Moved from Main Dashboard) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-[600px]">
                {/* Column 1: Summary Bar & Sunburst */}
                <div className="flex flex-col gap-6">
                    {/* Bar Chart Card */}
                    <div className="flex-[0.4] bg-[#1a1d24]/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <h3 className="font-bold text-white flex items-center gap-2"><BarChart2 size={16} className="text-blue-400" /> Throughput Efficiency</h3>
                        </div>
                        <div className="flex-1 flex items-center min-h-0">
                            <CustomBarChart data={chartData} />
                        </div>
                    </div>
                    {/* Sunburst Chart Card - Downtime Distribution */}
                    <div className="flex-[0.6] bg-[#1a1d24]/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <h3 className="font-bold text-white flex items-center gap-2"><PieChart size={16} className="text-orange-400" /> Downtime Root Cause Analysis</h3>
                        </div>
                        <div className="flex-1 flex items-center justify-center min-h-0">
                            <SunburstChart data={sunburstData} />
                        </div>
                    </div>
                </div>

                {/* Column 2 (Span 2): The "Big Strange Chart" (Radar Analysis) */}
                <div className="lg:col-span-2 bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-32 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
                    <div className="relative z-10 w-full h-full flex flex-col">
                        <div className="flex justify-between items-start mb-2 shrink-0">
                            <div>
                                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                                    <Hexagon size={24} className="text-purple-500" />
                                    SYSTEM ENTROPY RADAR
                                </h3>
                                <p className="text-sm text-gray-400 font-mono">Multi-Dimensional Performance Vector Analysis</p>
                            </div>
                            <div className="bg-white/5 px-3 py-1 rounded border border-white/10 text-xs font-mono text-gray-300">
                                AGGREGATED METRICS
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-0">
                            <SciFiRadarChart machines={aggregatedData} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-8 p-6 bg-[#1a1d24]/80 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="text-purple-400" />
                    <h3 className="text-xl font-bold text-white">Full Analysis Report</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
                    <div>
                        <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                            <Calculator size={16} /> Key Performance Indicators (KPIs)
                        </h4>
                        <ul className="space-y-3 font-mono text-xs bg-black/20 p-4 rounded-lg border border-white/5">
                            <li><span className="text-green-400">Availability</span> = (Running Time / Total Time) * 100</li>
                            <li><span className="text-blue-400">Total Time</span> = Sum of all logged minutes</li>
                            <li><span className="text-red-400">Breakdown Time</span> = Total Time - Running Time</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="bg-[#1a1d24]/60 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white mb-1">Detailed Machine Breakdown</h3>
                    <p className="text-sm text-gray-400">Comprehensive Data Log</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400 font-mono text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Machine</th>
                                <th className="p-4">Availability</th>
                                <th className="p-4">Total Time (min)</th>
                                <th className="p-4 text-green-400">Running (min)</th>
                                <th className="p-4 text-red-400">Breakdown (min)</th>
                                <th className="p-4">FG Output</th>
                                <th className="p-4">Primary Downtime Cause</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                            {aggregatedData.map((m) => (
                                <tr key={m.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-white">{m.id}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h - full rounded - full ${m.efficiency > 90 ? 'bg-green-500' : 'bg-yellow-500'} `}
                                                    style={{ width: `${m.efficiency}% ` }}
                                                />
                                            </div>
                                            <span className="font-mono">{m.efficiency.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono">{m.totalTime.toLocaleString()}</td>
                                    <td className="p-4 font-mono text-green-300">{m.runningTime.toLocaleString()}</td>
                                    <td className="p-4 font-mono text-red-300">{m.breakdownTime.toLocaleString()}</td>
                                    <td className="p-4 font-mono">{m.fgProduced.toLocaleString()}</td>
                                    <td className="p-4"><span className="px-2 py-1 bg-white/5 rounded text-xs border border-white/10">{m.topCause}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- SMT Machine Row Component (Vertical Layout) ---
const SMTMachineUnit = ({ type, id, status, efficiency, runningTime, breakdownTime, isDetailed }: { type: string, id: string, status: string, efficiency: number, runningTime: number, breakdownTime: number, isDetailed: boolean }) => {
    const isRunning = status === 'running';
    const isWarning = !isRunning;
    const colorClass = isWarning ? 'text-red-500' : 'text-green-500';

    // Detailed visuals (scaled up for row view)
    const renderVisual = () => {
        switch (type) {
            case 'printer':
                return (
                    <div className="relative w-32 h-32 flex flex-col items-center justify-center">
                        <div className="w-28 h-20 border-2 border-white/20 rounded-xl relative overflow-hidden bg-white/5 flex items-center justify-center">
                            <div className="absolute inset-1 border border-white/10" />
                            <motion.div
                                animate={{ y: [-15, 15, -15] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="w-20 h-1 bg-blue-400/50 shadow-[0_0_10px_rgba(96,165,250,0.5)] z-10"
                            />
                            <div className="w-16 h-12 bg-green-900/40 border border-green-500/30 mt-2" />
                        </div>
                    </div>
                );
            case 'spi':
                return (
                    <div className="relative w-32 h-32 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 border-2 border-white/20 rounded-xl relative overflow-hidden bg-white/5 flex flex-col items-center justify-center">
                            <motion.div
                                animate={{ top: ['10%', '90%', '10%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10"
                            />
                            <div className="w-16 h-16 bg-green-900/40 border border-green-500/30 grid grid-cols-4 gap-0.5 p-1 rounded-sm">
                                {[...Array(16)].map((_, i) => <div key={i} className="bg-green-500/30 rounded-[1px]" />)}
                            </div>
                        </div>
                    </div>
                );
            case 'mounter':
                return (
                    <div className="relative w-32 h-32 flex flex-col items-center justify-center">
                        <div className="w-28 h-24 border-2 border-white/20 rounded-xl relative overflow-hidden bg-white/5">
                            <motion.div
                                animate={{ x: [-20, 20, -10, 15], y: [-5, 5, -5, 5] }}
                                transition={{ duration: 2, repeat: Infinity, times: [0, 0.4, 0.7, 1] }}
                                className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-10 border border-white/30 bg-white/10 flex flex-col items-center z-10"
                            >
                                <div className="w-0.5 h-2 bg-white/50" />
                            </motion.div>
                            <div className="absolute bottom-0 left-1 w-6 h-12 bg-white/5 border-r border-white/10 flex flex-col gap-0.5 p-0.5">
                                {[...Array(6)].map((_, i) => <div key={i} className="h-1 w-full bg-yellow-500/30 rounded-r-sm" />)}
                            </div>
                        </div>
                    </div>
                );
            case 'oven':
                return (
                    <div className="relative w-40 h-32 flex flex-col items-center justify-center">
                        {/* Tunnel */}
                        <div className="w-full h-20 border-2 border-white/20 rounded-xl relative overflow-hidden bg-white/5 flex items-center justify-center gap-4">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ height: ['30%', '80%', '30%'], opacity: [0.2, 0.6, 0.2] }}
                                    transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                                    className="w-3 bg-orange-500/30 blur-sm rounded-full"
                                />
                            ))}
                            <div className="absolute top-1 right-2">
                                <span className="text-[9px] text-orange-400 font-mono">245°C</span>
                            </div>
                        </div>
                    </div>
                );
            case 'aoi':
                return (
                    <div className="relative w-32 h-32 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 border-2 border-white/20 rounded-xl relative overflow-hidden bg-white/5 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full border-2 border-blue-400/30 flex items-center justify-center relative">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-10 h-10 rounded-full bg-blue-500/10"
                                />
                                <div className="absolute inset-0 border-t-2 border-blue-400/50 rounded-full animate-spin" />
                            </div>
                        </div>
                    </div>
                );
            default:
                return <Factory className="text-white/20 w-16 h-16" />;
        }
    };

    return (
        <div className="w-full flex items-center bg-[#1a1d24]/40 border-b border-white/5 p-4 hover:bg-[#1a1d24]/60 transition-colors group">
            {/* 1. Visual Section (Large) */}
            <div className="w-48 shrink-0 flex justify-center border-r border-white/5 pr-6">
                <div className={`relative z-20 transition-all duration-300 scale-125 ${!isRunning ? 'drop-shadow-[0_0_15px_rgba(239,68,68,0.2)] grayscale opacity-80' : 'drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]'}`}>
                    {renderVisual()}
                </div>
            </div>

            {/* 2. Machine Info & Status */}
            <div className="w-64 pl-8 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-white tracking-wide">{id}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>
                        {isRunning ? 'OPERATIONAL' : 'STOPPED'}
                    </span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono mt-1 uppercase">
                    {isRunning ? 'Running Program A-12' : `Alert: ${status}`}
                </div>
            </div>

            {/* 3. Real-time Logic Animation (Conveyor Section) */}
            <div className="flex-1 px-8 relative h-16 flex items-center overflow-hidden">
                {/* Track Background */}
                <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-full h-full opacity-30 bg-[linear-gradient(90deg,transparent_50%,rgba(255,255,255,0.1)_50%)] bg-[size:10px_100%]" />
                </div>

                {/* Moving Items */}
                {isRunning && (
                    <div className="absolute inset-0 flex items-center">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-8 h-4 bg-green-500/20 border border-green-500/40 rounded shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                initial={{ left: '-10%', opacity: 0 }}
                                animate={{ left: '110%', opacity: [0, 1, 1, 0] }}
                                transition={{ duration: 4, repeat: Infinity, delay: i * 0.7, ease: "linear" }}
                            >
                                <div className="w-full h-full flex gap-0.5 justify-center items-center">
                                    <div className="w-0.5 h-2 bg-green-400/40" />
                                    <div className="w-0.5 h-2 bg-green-400/40" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. Stats Grid */}
            <div className="w-72 border-l border-white/5 pl-8 grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Efficiency</div>
                    <div className={`text-lg font-mono font-bold ${efficiency >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>{efficiency.toFixed(1)}%</div>
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Output</div>
                    <div className="text-lg font-mono font-bold text-white">{runningTime * 12} <span className="text-[10px] text-gray-600">units</span></div>
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Runtime</div>
                    <div className="text-sm font-mono text-gray-300">{runningTime}m</div>
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Downtime</div>
                    <div className="text-sm font-mono text-red-400">{breakdownTime}m</div>
                </div>
            </div>
        </div>
    );
};

// ... (analytics page etc remain similar or imported) ...
// Main Component
export const ProductionLinesSMTGroupVisual = () => {

    const [viewMode, setViewMode] = useState<'live' | 'analytics'>('live');
    const [timeRange, setTimeRange] = useState<'monthly' | 'yearly'>('monthly');
    const [isDetailed, setIsDetailed] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [timePosition, setTimePosition] = useState(0);

    // --- Timeline Simulation ---
    useEffect(() => {
        const updateTime = () => {
            const now = new Date(); // Mock time position
            const minutes = now.getMinutes() + (now.getSeconds() / 60);
            const percentage = (minutes / 60) * 100; // Loop every hour for visual
            setTimePosition(percentage);
        };
        const i = setInterval(updateTime, 1000);
        return () => clearInterval(i);
    }, []);

    // --- Data Logic (Same) ---
    const { aggregatedData, rawData, chartData, sunburstData, currentMonth } = useMemo(() => {
        // ... (Keep existing data logic) ...
        const raw = breakdownData as BreakdownEntry[];
        const allMonths = Array.from(new Set(raw.map(e => e.month)));
        const latestMonth = allMonths.sort().pop() || '';

        let filteredRaw = raw;
        if (timeRange === 'monthly') {
            filteredRaw = raw.filter(e => e.month === latestMonth);
        }

        const machineGroups: Record<string, BreakdownEntry[]> = {};
        const categories: Record<string, { value: number, children: Record<string, number> }> = {};

        filteredRaw.forEach(entry => {
            const m = entry.machine.trim();
            if (!machineGroups[m]) machineGroups[m] = [];
            machineGroups[m].push(entry);
            if (entry.category.trim() !== 'Production') {
                const cat = entry.category.trim();
                const cause = entry.cause.trim();
                if (!categories[cat]) categories[cat] = { value: 0, children: {} };
                categories[cat].value += entry.timeMin;
                categories[cat].children[cause] = (categories[cat].children[cause] || 0) + entry.timeMin;
            }
        });

        const aggregated: MachineStats[] = Object.keys(machineGroups).map(machineId => {
            const entries = machineGroups[machineId];
            let totalMin = 0; let runningMin = 0; let fgTotal = 0;
            const causes: Record<string, number> = {};
            entries.forEach(e => {
                totalMin += e.timeMin;
                if (e.category.trim() === 'Production' || e.cause.trim() === 'Machine Is Running') {
                    runningMin += e.timeMin; fgTotal += e.fg;
                } else {
                    const causeKey = `${e.category}`;
                    causes[causeKey] = (causes[causeKey] || 0) + e.timeMin;
                }
            });
            const breakdownMin = totalMin - runningMin;
            const efficiency = totalMin > 0 ? (runningMin / totalMin) * 100 : 0;
            let topCause = 'None'; let maxCauseMin = 0;
            Object.entries(causes).forEach(([c, min]) => { if (min > maxCauseMin) { maxCauseMin = min; topCause = c; } });
            const lastEntry = entries[entries.length - 1];
            const isRunning = lastEntry ? lastEntry.category.trim() === 'Production' : false;
            return { id: machineId, totalTime: totalMin, runningTime: runningMin, breakdownTime: breakdownMin, fgProduced: fgTotal, efficiency, topCause, status: isRunning ? 'running' : 'stopped' };
        });

        const chartData = aggregated.map(m => ({ label: m.id, v1: m.runningTime, v2: m.breakdownTime, max: m.totalTime }));

        // Sunburst Data Prep
        const pieColors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];
        const sunburstData = Object.entries(categories).sort(([, a], [, b]) => b.value - a.value).map(([name, data], i) => ({
            name, value: data.value, color: pieColors[i % pieColors.length], children: Object.entries(data.children).sort(([, a], [, b]) => b - a).map(([childName, val]) => ({ name: childName, value: val }))
        }));

        return { aggregatedData: aggregated.sort((a, b) => a.id.localeCompare(b.id)), rawData: filteredRaw, chartData, sunburstData, currentMonth: latestMonth };
    }, [timeRange]);

    // Map Machine Types (Mocking based on ID/Order)
    const machineTypes = ['printer', 'spi', 'mounter', 'mounter', 'oven', 'aoi', 'mounter', 'oven']; // Repeating pattern if more machines
    const processedMachines = aggregatedData.map((m, i) => ({
        ...m,
        type: machineTypes[i % machineTypes.length]
    }));

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-8 font-sans text-gray-200">
            <div className="flex justify-between items-center mb-6 shrink-0 bg-[#0f1115]/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div>
                    <h2 className="text-3xl md:text-3xl font-black text-white mb-1 flex items-center gap-3">
                        <Activity className="text-green-400" />
                        SMT PRODUCTION LINE 01
                    </h2>
                    <p className="text-gray-400 font-mono text-xs md:text-sm flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${timeRange === 'monthly' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                        {timeRange === 'monthly' ? `Current Run: ${currentMonth}` : 'Yearly Overview (2025)'}
                    </p>
                </div>
                <div className="flex gap-4">
                    {/* Controls */}
                    <div className="flex bg-[#1a1d24] p-1 rounded-xl border border-white/10 shadow-lg">
                        <button onClick={() => setTimeRange('monthly')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${timeRange === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Monthly</button>
                        <button onClick={() => setTimeRange('yearly')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${timeRange === 'yearly' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Yearly</button>
                    </div>

                    <div className="flex bg-[#1a1d24] p-1 rounded-xl border border-white/10 shadow-lg">
                        <button onClick={() => setViewMode('live')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'live' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            <Zap size={14} /> <span className="hidden md:inline">LINE VIEW</span>
                        </button>
                        <button onClick={() => setViewMode('analytics')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'analytics' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            <BarChart2 size={14} /> <span className="hidden md:inline">ANALYTICS</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 relative bg-[#0f1115]/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                <AnimatePresence mode='wait'>
                    {viewMode === 'live' ? (
                        <motion.div
                            key="live"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="w-full h-full flex flex-col relative"
                        >
                            {/* Vertical List Layout - Page Width, 4 Vertical Items */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                <div className="flex flex-col w-full h-full gap-2">
                                    {/* 4 Items should fill the height roughly, or we just scroll nicely */}
                                    {processedMachines.map((m, i) => (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="w-full"
                                        >
                                            <SMTMachineUnit
                                                type={m.type}
                                                id={m.id}
                                                status={m.status}
                                                efficiency={m.efficiency}
                                                runningTime={m.runningTime}
                                                breakdownTime={m.breakdownTime}
                                                isDetailed={true}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Timeline Bottom Bar */}
                            <div className="h-12 border-t border-white/10 bg-[#0f1115]/90 backdrop-blur-xl relative overflow-hidden flex flex-col justify-center px-12 shrink-0">
                                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden flex items-center">
                                    <motion.div
                                        className="absolute top-0 bottom-0 width-px w-20 bg-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.5)] z-20 rounded-full blur-md"
                                        style={{ left: `${timePosition}%` }}
                                    />
                                    <motion.div
                                        className="absolute top-0 bottom-0 width-px w-1 bg-white z-30"
                                        style={{ left: `${timePosition}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-1 text-[9px] text-gray-500 font-mono tracking-widest">
                                    <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                                </div>
                            </div>

                        </motion.div>
                    ) : (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="w-full h-full p-6 overflow-hidden"
                        >
                            <AnalyticsPage
                                aggregatedData={aggregatedData}
                                rawData={rawData}
                                chartData={chartData}
                                sunburstData={sunburstData}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
