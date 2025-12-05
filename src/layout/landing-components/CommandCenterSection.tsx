import React from 'react';
import { motion } from 'framer-motion';
import { Database, Filter, MoreHorizontal, Search } from 'lucide-react';

const CommandCenterSection: React.FC = () => {
    const data = [
        { id: 'ORD-001', supplier: 'TechCorp Industries', status: 'Processing', amount: '$12,500', date: '2024-03-15' },
        { id: 'ORD-002', supplier: 'Global Logistics', status: 'Shipped', amount: '$8,200', date: '2024-03-14' },
        { id: 'ORD-003', supplier: 'Nano Systems', status: 'Pending', amount: '$24,000', date: '2024-03-14' },
        { id: 'ORD-004', supplier: 'Alpha Components', status: 'Delivered', amount: '$5,600', date: '2024-03-13' },
        { id: 'ORD-005', supplier: 'Beta Dynamics', status: 'Processing', amount: '$15,300', date: '2024-03-12' },
        { id: 'ORD-006', supplier: 'Gamma Solutions', status: 'Shipped', amount: '$9,100', date: '2024-03-11' },
    ];

    return (
        <div className="w-full min-h-[80vh] bg-[#050505] flex flex-col justify-center items-center py-20 relative overflow-hidden border-b border-white/5 perspective-[2000px]">
            <div className="max-w-7xl w-full px-6 z-10">
                <div className="mb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                <Database size={32} className="text-white" />
                            </div>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tighter">
                            Data <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">Command Center</span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Transform raw data into actionable insights. Interactive 3D tables and visual database management.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, rotateX: 20, scale: 0.9 }}
                    whileInView={{ opacity: 1, rotateX: 10, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="w-full bg-[#0a0a0a] rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden transform-gpu"
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Toolbar */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-bold text-white">Recent Orders</h3>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs text-gray-400">Live</span>
                        </div>
                        <div className="flex gap-3">
                            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                                <Search size={18} />
                            </button>
                            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="py-4 px-4 text-gray-500 font-medium text-sm uppercase tracking-wider">Order ID</th>
                                    <th className="py-4 px-4 text-gray-500 font-medium text-sm uppercase tracking-wider">Supplier</th>
                                    <th className="py-4 px-4 text-gray-500 font-medium text-sm uppercase tracking-wider">Status</th>
                                    <th className="py-4 px-4 text-gray-500 font-medium text-sm uppercase tracking-wider">Amount</th>
                                    <th className="py-4 px-4 text-gray-500 font-medium text-sm uppercase tracking-wider">Date</th>
                                    <th className="py-4 px-4 text-gray-500 font-medium text-sm uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, i) => (
                                    <motion.tr
                                        key={row.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                                    >
                                        <td className="py-4 px-4 text-white font-mono">{row.id}</td>
                                        <td className="py-4 px-4 text-gray-300">{row.supplier}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${row.status === 'Delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    row.status === 'Shipped' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        row.status === 'Processing' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-white font-mono">{row.amount}</td>
                                        <td className="py-4 px-4 text-gray-400">{row.date}</td>
                                        <td className="py-4 px-4 text-gray-500">
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CommandCenterSection;
