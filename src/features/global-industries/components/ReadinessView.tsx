import React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { CheckCircle2, AlertCircle, Factory, Truck, Building2, Stethoscope, Sprout, ShieldCheck } from 'lucide-react';

// --- Mock Data ---
const coverageData = [
    { sector: 'Manufacturing', coverage: 95, modules: 8, readiness: 'Ready' },
    { sector: 'Logistics', coverage: 88, modules: 6, readiness: 'Ready' },
    { sector: 'Healthcare', coverage: 75, modules: 5, readiness: 'Partial' },
    { sector: 'Agriculture', coverage: 60, modules: 4, readiness: 'Partial' },
    { sector: 'Finance', coverage: 90, modules: 7, readiness: 'Ready' },
    { sector: 'Tech', coverage: 98, modules: 9, readiness: 'Ready' },
];

const moduleReadinessData = [
    { subject: 'Procurement', A: 120, fullMark: 150 },
    { subject: 'Warehouse', A: 98, fullMark: 150 },
    { subject: 'Fleet', A: 86, fullMark: 150 },
    { subject: 'Planning', A: 99, fullMark: 150 },
    { subject: 'Vendors', A: 85, fullMark: 150 },
    { subject: 'Reporting', A: 65, fullMark: 150 },
];

// --- Components ---

const SectorCard = ({ sector, icon: Icon }: any) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-[#050510]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors"
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full -mr-10 -mt-10" />

        <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50 transition-colors">
                <Icon className="w-6 h-6 text-white group-hover:text-cyan-400" />
            </div>
            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${sector.readiness === 'Ready'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                {sector.readiness}
            </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">{sector.sector}</h3>
        <p className="text-xs text-gray-400 mb-4">Full stack integration available</p>

        <div className="space-y-3">
            <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Coverage</span>
                    <span className="text-cyan-400 font-bold">{sector.coverage}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sector.coverage}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                <div className="text-center">
                    <div className="text-lg font-bold text-white">{sector.modules}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Modules</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-bold text-white">24h</div>
                    <div className="text-[10px] text-gray-500 uppercase">Setup</div>
                </div>
            </div>
        </div>
    </motion.div>
);

export const ReadinessView: React.FC = () => {
    return (
        <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar">
            {/* Top Charts Section */}
            <div className="grid grid-cols-12 gap-6 mb-8">
                <div className="col-span-12 lg:col-span-8 bg-[#050510]/80 backdrop-blur-md border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-cyan-500" />
                                Sector Coverage Analysis
                            </h3>
                            <p className="text-sm text-gray-400">Readiness score across major industries</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={coverageData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="sector" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#ffffff05' }}
                                    contentStyle={{ backgroundColor: '#050510', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="coverage" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={40}>
                                    {coverageData.map((entry, index) => (
                                        <motion.rect
                                            key={`cell-${index}`}
                                            initial={{ y: 200, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-[#050510]/80 backdrop-blur-md border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-2">Module Maturity</h3>
                    <p className="text-sm text-gray-400 mb-6">System capabilities per module</p>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={moduleReadinessData}>
                                <PolarGrid stroke="#ffffff20" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar name="NABD" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#050510', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Sector Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SectorCard sector={coverageData[0]} icon={Factory} />
                <SectorCard sector={coverageData[1]} icon={Truck} />
                <SectorCard sector={coverageData[2]} icon={Stethoscope} />
                <SectorCard sector={coverageData[3]} icon={Sprout} />
                <SectorCard sector={coverageData[4]} icon={Building2} />
                <SectorCard sector={coverageData[5]} icon={AlertCircle} />
            </div>

            {/* Bottom Info */}
            <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border border-cyan-500/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-cyan-500/20">
                        <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Auto-Generated Dashboards</h4>
                        <p className="text-xs text-gray-400">NABD automatically proposes the correct tools per industry based on this mapping.</p>
                    </div>
                </div>
                <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold transition-colors">
                    Generate Report
                </button>
            </div>
        </div>
    );
};
