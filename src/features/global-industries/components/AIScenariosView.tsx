import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Truck, Stethoscope, Factory, Sprout, ArrowRight, Brain, CheckCircle2, Zap } from 'lucide-react';

// --- Mock Scenarios ---
const scenarios = [
    {
        id: 1,
        title: 'Food Manufacturing Delay',
        sector: 'Manufacturing',
        icon: Factory,
        description: 'Production line halted due to raw material shortage.',
        steps: [
            { time: '08:00', event: 'Sensor detects stoppage', type: 'alert' },
            { time: '08:05', event: 'AI analyzes inventory', type: 'process' },
            { time: '08:10', event: 'Procurement alerted', type: 'action' },
            { time: '08:30', event: 'Supplier notified', type: 'resolution' },
        ],
        aiAnalysis: 'Because Production depends on Procurement, NABD triggered an auto-restock request to the primary vendor and alerted the shift manager.'
    },
    {
        id: 2,
        title: 'Fleet Breakdown',
        sector: 'Logistics',
        icon: Truck,
        description: 'Delivery truck #402 reported engine failure on Route 66.',
        steps: [
            { time: '14:20', event: 'OBD-II signal received', type: 'alert' },
            { time: '14:21', event: 'Route impact calculated', type: 'process' },
            { time: '14:25', event: 'Nearest backup dispatched', type: 'action' },
            { time: '15:00', event: 'Cargo transferred', type: 'resolution' },
        ],
        aiAnalysis: 'NABD identified a 45-minute delay impact on Customer Service. Automated notifications were sent to affected clients while re-routing the fleet.'
    },
    {
        id: 3,
        title: 'Lab Overload',
        sector: 'Healthcare',
        icon: Stethoscope,
        description: 'Sample processing queue exceeded critical threshold.',
        steps: [
            { time: '09:00', event: 'Queue limit breached', type: 'alert' },
            { time: '09:02', event: 'Staff capacity analyzed', type: 'process' },
            { time: '09:05', event: 'Shift rotation adjusted', type: 'action' },
            { time: '09:15', event: 'Load balanced', type: 'resolution' },
        ],
        aiAnalysis: 'Predictive staffing model suggested moving 2 technicians from Hematology to Microbiology to clear the backlog before noon.'
    },
    {
        id: 4,
        title: 'Crop Disease Risk',
        sector: 'Agriculture',
        icon: Sprout,
        description: 'Humidity sensors indicate high risk of fungal infection.',
        steps: [
            { time: '06:00', event: 'High humidity detected', type: 'alert' },
            { time: '06:05', event: 'Disease model run', type: 'process' },
            { time: '06:10', event: 'Spraying schedule updated', type: 'action' },
            { time: '07:00', event: 'Drones deployed', type: 'resolution' },
        ],
        aiAnalysis: 'Based on historical data and current weather patterns, NABD recommended a preemptive fungicide application to Sector 4.'
    },
];

// --- Components ---

const ScenarioSelector = ({ selectedId, onSelect }: any) => (
    <div className="w-80 flex flex-col gap-4">
        <div className="p-4 rounded-xl bg-[#050510]/80 backdrop-blur-md border border-white/10">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                Active Scenarios
            </h3>
            <div className="space-y-3">
                {scenarios.map((scenario) => {
                    const Icon = scenario.icon;
                    const isSelected = selectedId === scenario.id;
                    return (
                        <button
                            key={scenario.id}
                            onClick={() => onSelect(scenario)}
                            className={`
                                w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden group
                                ${isSelected
                                    ? 'bg-purple-900/20 border-purple-500/50'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}
                            `}
                        >
                            {isSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                            )}
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-400'}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                        {scenario.title}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-1">{scenario.sector}</div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
);

const Timeline = ({ scenario }: any) => (
    <div className="flex-1 flex flex-col justify-center relative">
        {/* Central Line */}
        <div className="absolute left-1/2 top-10 bottom-10 w-0.5 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent -translate-x-1/2" />

        <div className="space-y-12 relative z-10 py-10">
            {scenario.steps.map((step: any, index: number) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className={`flex items-center gap-8 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                    {/* Content Side */}
                    <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                        <div className="inline-block p-4 rounded-xl bg-[#050510]/90 backdrop-blur-md border border-white/10 shadow-lg">
                            <div className="text-xs font-mono text-purple-400 mb-1">{step.time}</div>
                            <div className="text-sm font-bold text-white">{step.event}</div>
                        </div>
                    </div>

                    {/* Center Node */}
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#050510] border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] z-20">
                        {step.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        {step.type === 'process' && <Zap className="w-4 h-4 text-amber-500" />}
                        {step.type === 'action' && <ArrowRight className="w-4 h-4 text-blue-500" />}
                        {step.type === 'resolution' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>

                    {/* Empty Side for Balance */}
                    <div className="flex-1" />
                </motion.div>
            ))}
        </div>
    </div>
);

const AIAnalysisCard = ({ analysis }: any) => (
    <div className="w-80">
        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-950/50 to-blue-950/50 border border-purple-500/20 sticky top-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                    <div className="absolute -inset-1 bg-purple-500 rounded-full blur opacity-50 animate-pulse" />
                    <div className="relative p-2 bg-black rounded-full border border-purple-500/50">
                        <Brain className="w-5 h-5 text-purple-400" />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-white">NABD Logic</h3>
            </div>

            <div className="text-sm text-gray-300 leading-relaxed font-light">
                {analysis}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <span>Confidence Score</span>
                    <span className="text-green-400 font-bold">98.5%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-[98.5%] bg-green-500" />
                </div>
            </div>
        </div>
    </div>
);

export const AIScenariosView: React.FC = () => {
    const [selectedScenario, setSelectedScenario] = useState(scenarios[0]);

    return (
        <div className="w-full h-full p-6 flex gap-6 overflow-hidden">
            <ScenarioSelector
                selectedId={selectedScenario.id}
                onSelect={setSelectedScenario}
            />

            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-y-auto custom-scrollbar relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
                <AnimatePresence mode='wait'>
                    <Timeline key={selectedScenario.id} scenario={selectedScenario} />
                </AnimatePresence>
            </div>

            <AIAnalysisCard analysis={selectedScenario.aiAnalysis} />
        </div>
    );
};
