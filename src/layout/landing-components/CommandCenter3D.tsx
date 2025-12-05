import React from 'react';
import { motion } from 'framer-motion';
import { Server, Shield, Database, Activity, Terminal, Lock } from 'lucide-react';

const InterfaceMockup = () => {
    return (
        <div className="relative w-full max-w-4xl mx-auto perspective-1000">
            {/* Main Interface Container */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl transform rotate-x-12 transition-transform duration-500 hover:rotate-x-0">
                {/* Window Header */}
                <div className="bg-white/5 border-b border-white/5 px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                    <div className="ml-4 text-xs text-gray-500 font-mono">admin@nabd-command:~</div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 grid grid-cols-12 gap-6 h-[400px]">
                    {/* Sidebar */}
                    <div className="col-span-3 border-r border-white/5 pr-4 flex flex-col gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 flex items-center gap-3">
                            <Activity size={18} className="text-blue-400" />
                            <span className="text-sm text-blue-100 font-medium">Overview</span>
                        </div>
                        <div className="p-3 hover:bg-white/5 rounded-lg flex items-center gap-3 text-gray-400 transition-colors">
                            <Database size={18} />
                            <span className="text-sm">Databases</span>
                        </div>
                        <div className="p-3 hover:bg-white/5 rounded-lg flex items-center gap-3 text-gray-400 transition-colors">
                            <Shield size={18} />
                            <span className="text-sm">Security</span>
                        </div>
                        <div className="p-3 hover:bg-white/5 rounded-lg flex items-center gap-3 text-gray-400 transition-colors">
                            <Server size={18} />
                            <span className="text-sm">Nodes</span>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-span-9 flex flex-col gap-6">
                        {/* Top Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                <div className="text-xs text-gray-400 mb-1">System Load</div>
                                <div className="text-2xl font-bold text-white">42%</div>
                                <div className="w-full bg-white/10 h-1 rounded-full mt-2">
                                    <div className="bg-green-500 h-full rounded-full w-[42%]"></div>
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                <div className="text-xs text-gray-400 mb-1">Active Nodes</div>
                                <div className="text-2xl font-bold text-white">1,204</div>
                                <div className="flex gap-1 mt-2">
                                    {[1, 1, 1, 1, 0].map((on, i) => (
                                        <div key={i} className={`w-2 h-2 rounded-full ${on ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                <div className="text-xs text-gray-400 mb-1">Security Status</div>
                                <div className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Lock size={20} className="text-green-400" /> Secure
                                </div>
                            </div>
                        </div>

                        {/* Terminal / Logs */}
                        <div className="flex-1 bg-black/50 rounded-lg border border-white/5 p-4 font-mono text-xs text-gray-400 overflow-hidden relative">
                            <div className="absolute top-2 right-2 text-gray-600"><Terminal size={14} /></div>
                            <div className="space-y-1">
                                <div className="text-green-400">$ systemctl status nabd-core</div>
                                <div>● nabd-core.service - NABD Core Service</div>
                                <div className="pl-2">Loaded: loaded (/etc/systemd/system/nabd.service; enabled)</div>
                                <div className="pl-2">Active: <span className="text-green-400">active (running)</span> since Mon 2023-10-23 14:00:00 UTC</div>
                                <div className="pl-2">Docs: https://docs.nabd.com</div>
                                <div className="text-blue-400 mt-2">$ tail -f /var/log/syslog</div>
                                <div>Oct 23 14:05:01 nabd-node-01 CRON[1234]: (root) CMD (backup.sh)</div>
                                <div>Oct 23 14:05:05 nabd-node-01 kernel: [1234.56] Firewall: BLOCK IN=eth0 OUT=</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CommandCenter3D: React.FC = () => {
    return (
        <div className="w-full py-24 flex flex-col justify-center items-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent pointer-events-none"></div>

            {/* Text Content - Top */}
            <div className="max-w-7xl w-full px-6 z-10 flex justify-center mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-4xl text-center"
                >
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <Server size={32} className="text-white" />
                        </div>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tighter drop-shadow-2xl">
                        Data <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">Command Center</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto drop-shadow-lg leading-relaxed">
                        Your central nervous system. Monitor, manage, and control every aspect of your operation from a single, immersive interface.
                    </p>
                </motion.div>
            </div>

            {/* Visual Content - Bottom */}
            <div className="w-full px-6 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 40, rotateX: 10 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <InterfaceMockup />
                </motion.div>
            </div>
        </div>
    );
};

export default CommandCenter3D;
