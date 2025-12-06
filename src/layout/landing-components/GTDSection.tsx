import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, CheckCircle2, Layers, CheckSquare, Zap, ArrowRight } from 'lucide-react';

const steps = [
    {
        id: 'capture',
        number: '01',
        title: 'Capture',
        description: 'Collect what has your attention. Use the Inbox to write down tasks, ideas, and reminders immediately.',
        icon: Inbox,
        color: 'from-blue-500 to-cyan-400'
    },
    {
        id: 'clarify',
        number: '02',
        title: 'Clarify',
        description: 'Process what you’ve captured. Decide if it’s actionable, then decide the next action.',
        icon: CheckCircle2,
        color: 'from-amber-500 to-orange-400'
    },
    {
        id: 'organize',
        number: '03',
        title: 'Organize',
        description: 'Put everything in the right place. Add actionable items to your lists and calendar.',
        icon: Layers,
        color: 'from-indigo-500 to-purple-400'
    },
    {
        id: 'reflect',
        number: '04',
        title: 'Reflect',
        description: 'Review frequently. Update your lists, clear your mind, and get perspective.',
        icon: CheckSquare,
        color: 'from-emerald-500 to-teal-400'
    },
    {
        id: 'engage',
        number: '05',
        title: 'Engage',
        description: 'Simply do. Use your system to make confident choices about what to do right now.',
        icon: Zap,
        color: 'from-pink-500 to-rose-400'
    }
];

const GTDSection: React.FC = () => {
    return (
        <section className="py-32 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a] to-transparent pointer-events-none" />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-widest uppercase">New Feature</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white"
                    >
                        Getting Things <span className="text-transparent bg-clip-text bg-gradient-to-b from-gray-100 to-gray-500">Done</span>.
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light"
                    >
                        A comprehensive system to stress-free productivity. Transform chaos into control with our integrated workflow.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group relative"
                        >
                            <div className="h-full p-8 rounded-3xl bg-[#0f0f0f] border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] overflow-hidden">

                                {/* Hover Gradient Bulb */}
                                <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500 pointer-events-none`} />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} p-0.5`}>
                                            <div className="w-full h-full bg-[#0f0f0f] rounded-[14px] flex items-center justify-center">
                                                <step.icon className="text-white w-6 h-6" />
                                            </div>
                                        </div>
                                        <span className="text-5xl font-black text-white/5 font-serif group-hover:text-white/10 transition-colors">
                                            {step.number}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                                        {step.title}
                                    </h3>

                                    <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors flex-1">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            {/* Connector Line (Desktop) */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-white/10 to-transparent z-0" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GTDSection;
