import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Network, ArrowRight, AlertTriangle, Zap, Activity, GitMerge, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

// --- Mock Data for Dependencies ---
const dependencyData = [
    { source: 'Procurement', target: 'Production', strength: 0.9, criticality: 'High' },
    { source: 'Procurement', target: 'Quality', strength: 0.4, criticality: 'Medium' },
    { source: 'Production', target: 'Quality', strength: 0.8, criticality: 'High' },
    { source: 'Production', target: 'Shipping', strength: 0.7, criticality: 'High' },
    { source: 'Quality', target: 'Shipping', strength: 0.9, criticality: 'Critical' },
    { source: 'Quality', target: 'R&D', strength: 0.3, criticality: 'Low' },
    { source: 'Lab', target: 'Quality', strength: 0.8, criticality: 'High' },
    { source: 'Supply Chain', target: 'Procurement', strength: 0.6, criticality: 'Medium' },
    { source: 'Supply Chain', target: 'Production', strength: 0.5, criticality: 'Medium' },
    { source: 'Shipping', target: 'Customer Service', strength: 0.7, criticality: 'Medium' },
];

const departments = Array.from(new Set([
    ...dependencyData.map(d => d.source),
    ...dependencyData.map(d => d.target)
]));

// --- Components ---

const StatusBadge = ({ count, color, icon: Icon }: any) => (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded bg-${color}-500/10 border border-${color}-500/20`}>
        <Icon className={`w-3 h-3 text-${color}-500`} />
        <span className={`text-[10px] font-bold text-${color}-400`}>{count}</span>
    </div>
);

const FlowNode = ({ name, type, index, total }: any) => {
    // Use 15% to 85% range to avoid touching edges and overlapping header
    const y = 15 + (index / (total - 1)) * 70;

    // Mock Stats
    const stats = useMemo(() => ({
        pending: Math.floor(Math.random() * 15),
        progress: Math.floor(Math.random() * 10),
        blocked: Math.floor(Math.random() * 5),
        done: Math.floor(Math.random() * 20) + 10,
    }), []);

    return (
        <div
            className="absolute flex items-center gap-4 transform -translate-y-1/2 z-20 group"
            style={{
                top: `${y}%`,
                left: type === 'source' ? '0%' : '100%',
                flexDirection: type === 'source' ? 'row' : 'row-reverse',
                transform: `translate(${type === 'source' ? '0' : '-100%'}, -50%)`
            }}
        >
            <div className={`
                w-56 p-4 rounded-xl border backdrop-blur-xl transition-all duration-300 shadow-lg
                ${type === 'source'
                    ? 'bg-gradient-to-r from-blue-950/80 to-blue-900/40 border-blue-500/30 text-right hover:border-blue-400 hover:shadow-blue-500/20 hover:-translate-x-1'
                    : 'bg-gradient-to-l from-purple-950/80 to-purple-900/40 border-purple-500/30 text-left hover:border-purple-400 hover:shadow-purple-500/20 hover:translate-x-1'}
            `}>
                <div className="flex justify-between items-start mb-2">
                    <div className={`text-[10px] text-gray-400 uppercase tracking-wider ${type === 'source' ? 'order-2' : ''}`}>Department</div>
                    <div className={`w-1.5 h-1.5 rounded-full ${type === 'source' ? 'bg-blue-400' : 'bg-purple-400'} shadow-[0_0_8px_currentColor] animate-pulse`} />
                </div>

                <div className="text-lg font-bold text-white mb-3 tracking-tight">{name}</div>

                {/* Status Counters */}
                <div className={`flex gap-2 ${type === 'source' ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10" title="Pending">
                        <Clock className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-bold text-white">{stats.pending}</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20" title="In Progress">
                        <Activity className="w-3 h-3 text-yellow-500" />
                        <span className="text-[10px] font-bold text-yellow-400">{stats.progress}</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20" title="Blocked">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] font-bold text-red-400">{stats.blocked}</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20" title="Done">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-[10px] font-bold text-green-400">{stats.done}</span>
                    </div>
                </div>
            </div>

            {/* Connection Point */}
            <div className={`
                w-4 h-4 rounded-full border-4 
                ${type === 'source' ? 'bg-blue-950 border-blue-500' : 'bg-purple-950 border-purple-500'}
                shadow-[0_0_15px_currentColor] z-30
            `} />
        </div>
    );
};

const FlowLink = ({ link, sourceIndex, targetIndex, sourceTotal, targetTotal }: any) => {
    // Use 15% to 85% range to match nodes
    const startY = 15 + (sourceIndex / (sourceTotal - 1)) * 70;
    const endY = 15 + (targetIndex / (targetTotal - 1)) * 70;

    // SVG Coordinates (0-100 scale)
    const x1 = 20; // Start X padding
    const x2 = 80; // End X padding

    const controlPoint1 = x1 + 30;
    const controlPoint2 = x2 - 30;

    const color = link.criticality === 'Critical' ? '#ef4444' :
        link.criticality === 'High' ? '#f59e0b' :
            '#22d3ee';

    const opacity = link.criticality === 'Critical' ? 0.6 :
        link.criticality === 'High' ? 0.4 :
            0.15;

    return (
        <g className="group">
            {/* Hover Hit Area (Invisible but thicker) */}
            <path
                d={`M ${x1} ${startY} C ${controlPoint1} ${startY}, ${controlPoint2} ${endY}, ${x2} ${endY}`}
                fill="none"
                stroke="transparent"
                strokeWidth="8"
                className="cursor-pointer"
            />

            {/* Visible Line */}
            <path
                d={`M ${x1} ${startY} C ${controlPoint1} ${startY}, ${controlPoint2} ${endY}, ${x2} ${endY}`}
                fill="none"
                stroke={color}
                strokeWidth={link.strength * 3}
                strokeOpacity={opacity}
                className="transition-all duration-500 group-hover:stroke-opacity-100 group-hover:stroke-width-[4px] pointer-events-none"
            />

            {/* Animated Particle */}
            <circle r="1.5" fill="white" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <animateMotion
                    dur={`${3 / link.strength}s`}
                    repeatCount="indefinite"
                    path={`M ${x1} ${startY} C ${controlPoint1} ${startY}, ${controlPoint2} ${endY}, ${x2} ${endY}`}
                />
            </circle>

            {/* Always visible slower particle for life */}
            <circle r="1" fill={color} fillOpacity="0.8">
                <animateMotion
                    dur={`${10 / link.strength}s`}
                    repeatCount="indefinite"
                    path={`M ${x1} ${startY} C ${controlPoint1} ${startY}, ${controlPoint2} ${endY}, ${x2} ${endY}`}
                />
            </circle>
        </g>
    );
};

const ScenarioCard = ({ title, description, icon: Icon, impact }: any) => (
    <div className="bg-[#050510]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all cursor-pointer group hover:bg-white/5">
        <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-${impact === 'high' ? 'red' : 'amber'}-500/20 text-${impact === 'high' ? 'red' : 'amber'}-400 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{title}</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
            </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Impact Analysis</span>
            <ArrowRight className="w-3 h-3 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </div>
    </div>
);

export const DependenciesFlowView: React.FC = () => {
    const sources = Array.from(new Set(dependencyData.map(d => d.source)));
    const targets = Array.from(new Set(dependencyData.map(d => d.target)));

    return (
        <div className="relative w-full h-full p-6 flex gap-6">

            {/* Main Flow Chart */}
            <div className="flex-1 bg-[#050510]/50 backdrop-blur-sm border border-white/10 rounded-2xl relative overflow-hidden shadow-2xl">
                {/* Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />

                <div className="absolute top-0 left-0 w-full p-4 border-b border-white/10 flex justify-between items-center bg-[#050510]/80 z-10 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-cyan-500/20">
                            <GitMerge className="w-4 h-4 text-cyan-400" />
                        </div>
                        <h3 className="font-bold text-white tracking-wide text-sm">Dependency Matrix v2.0</h3>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] text-gray-300 uppercase tracking-wider">System Live</span>
                        </div>
                        <select className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500 transition-colors">
                            <option>All Industries</option>
                            <option>Manufacturing Only</option>
                            <option>Logistics Only</option>
                        </select>
                    </div>
                </div>

                <div className="absolute inset-0 top-16 p-8">
                    {/* SVG Layer for Lines */}
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 0.2 }} />
                                <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0.2 }} />
                            </linearGradient>
                        </defs>
                        {dependencyData.map((link, i) => {
                            const sourceIdx = sources.indexOf(link.source);
                            const targetIdx = targets.indexOf(link.target);
                            return (
                                <FlowLink
                                    key={i}
                                    link={link}
                                    sourceIndex={sourceIdx}
                                    targetIndex={targetIdx}
                                    sourceTotal={sources.length}
                                    targetTotal={targets.length}
                                />
                            );
                        })}
                    </svg>

                    {/* HTML Layer for Nodes */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute left-[12%] top-0 bottom-0 w-0 flex flex-col justify-between py-16">
                            {sources.map((source, i) => (
                                <FlowNode key={source} name={source} type="source" index={i} total={sources.length} />
                            ))}
                        </div>
                        <div className="absolute right-[12%] top-0 bottom-0 w-0 flex flex-col justify-between py-16">
                            {targets.map((target, i) => (
                                <FlowNode key={target} name={target} type="target" index={i} total={targets.length} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#050510]/90 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2 flex gap-6 shadow-xl z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-1 bg-red-500/50 rounded-full" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-1 bg-amber-500/50 rounded-full" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-1 bg-cyan-500/50 rounded-full" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Normal</span>
                    </div>
                </div>
            </div>

            {/* Right Side Scenarios */}
            <div className="w-80 flex flex-col gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border border-cyan-500/20 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-cyan-500/20">
                            <Zap className="w-4 h-4 text-cyan-400" />
                        </div>
                        Live Simulation
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Select a scenario to visualize dependency ripple effects across the network.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    <ScenarioCard
                        title="Procurement Delay"
                        description="Raw material shortage causes 48h delay in Production start."
                        icon={AlertTriangle}
                        impact="high"
                    />
                    <ScenarioCard
                        title="Quality Failure"
                        description="Batch rejection triggers re-work loop between Production and Lab."
                        icon={Activity}
                        impact="medium"
                    />
                    <ScenarioCard
                        title="Shipping Blockage"
                        description="Logistics bottleneck affects Customer Service response times."
                        icon={Network}
                        impact="medium"
                    />
                    <ScenarioCard
                        title="R&D Breakthrough"
                        description="New process reduces Production time by 15%."
                        icon={Zap}
                        impact="low"
                    />
                </div>
            </div>
        </div>
    );
};
