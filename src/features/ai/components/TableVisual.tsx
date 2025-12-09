import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Search, Filter, MoreVertical, CheckCircle, AlertOctagon, Clock } from 'lucide-react';

export const TableVisual = () => {
    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        // Initial rows
        const initialRows = [
            { id: 1024, type: 'PRODUCTION', message: 'Batch #4420 completed successfully', status: 'success', time: '10:42:05' },
            { id: 1023, type: 'SYSTEM', message: 'Auto-calibration sequence initiated', status: 'info', time: '10:41:55' },
            { id: 1022, type: 'WARNING', message: 'Temperature fluctuation detected in Zone 3', status: 'warning', time: '10:41:12' },
            { id: 1021, type: 'PRODUCTION', message: 'Quality check passed for Unit #8821', status: 'success', time: '10:40:48' },
            { id: 1020, type: 'LOG', message: 'User admin connected from remote', status: 'info', time: '10:38:22' },
        ];
        setRows(initialRows);

        // Add new rows animation
        const interval = setInterval(() => {
            setRows(prev => {
                const newId = prev.length > 0 ? prev[0].id + 1 : 1000;
                const types = ['PRODUCTION', 'SYSTEM', 'LOG', 'QC', 'MAINTENANCE'];
                const messages = [
                    'Optimizing power consumption cycle',
                    'New raw material batch detected',
                    'Synchronizing with ERP system',
                    'Predictive maintenance scan complete',
                    'Throughput analysis updated'
                ];
                const newRow = {
                    id: newId,
                    type: types[Math.floor(Math.random() * types.length)],
                    message: messages[Math.floor(Math.random() * messages.length)],
                    status: Math.random() > 0.8 ? 'warning' : 'success',
                    time: new Date().toLocaleTimeString('en-US', { hour12: false })
                };
                return [newRow, ...prev.slice(0, 6)]; // Keep last 7 rows
            });
        }, 800);

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
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Database className="text-emerald-400 w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">System Logs</h2>
                            <div className="text-xs text-gray-400 font-mono">REAL-TIME DB QUERY</div>
                        </div>
                    </div>

                    {/* Fake Toolbar */}
                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <div className="w-48 h-8 rounded-full bg-black/20 border border-white/10 pl-9 pr-4 text-xs flex items-center text-gray-400">Search logs...</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <Filter size={14} className="text-gray-400" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <MoreVertical size={14} className="text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-wider bg-black/20">
                    <div className="col-span-1">ID</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-6">Message</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">Time</div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0 p-4 space-y-2">
                        <AnimatePresence mode='popLayout'>
                            {rows.map((row) => (
                                <motion.div
                                    key={row.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="col-span-1 font-mono text-xs text-indigo-400">#{row.id}</div>
                                    <div className="col-span-2">
                                        <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-gray-300 border border-white/5">
                                            {row.type}
                                        </span>
                                    </div>
                                    <div className="col-span-6 text-sm text-gray-200 truncate">{row.message}</div>
                                    <div className="col-span-2 flex items-center gap-2">
                                        {row.status === 'success' ? (
                                            <>
                                                <CheckCircle size={14} className="text-emerald-500" />
                                                <span className="text-xs text-emerald-500 font-medium">Completed</span>
                                            </>
                                        ) : row.status === 'warning' ? (
                                            <>
                                                <AlertOctagon size={14} className="text-yellow-500" />
                                                <span className="text-xs text-yellow-500 font-medium">Warning</span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock size={14} className="text-blue-500" />
                                                <span className="text-xs text-blue-500 font-medium">Pending</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="col-span-1 text-right font-mono text-xs text-gray-500">{row.time}</div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
