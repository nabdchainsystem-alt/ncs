import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../contexts/StoreContext';
import { Vendor, Project, PurchaseOrder } from '../../types/shared';

// --- Types ---
interface Node {
    id: string;
    type: 'vendor' | 'warehouse' | 'project';
    label: string;
    x: number;
    y: number;
    size: number;
    color: string;
    data?: any;
}

interface Link {
    id: string;
    source: string;
    target: string;
    type: 'po' | 'allocation';
    label?: string;
    active: boolean;
}

export const SupplyChainMap: React.FC = () => {
    const { vendors, projects, purchaseOrders, inventory } = useStore();

    // --- Layout Logic (Simple Force-Directed Simulation Replacement) ---
    // For V1, we'll use a layered layout: Vendors (Left) -> Warehouse (Center) -> Projects (Right)

    const nodes: Node[] = useMemo(() => {
        const nodeList: Node[] = [];
        const width = 1200;
        const height = 800;

        // 1. Vendors (Left Layer)
        const activeVendors = vendors.filter(v => v.contractStatus === 'Active');
        activeVendors.forEach((v, i) => {
            nodeList.push({
                id: v.id,
                type: 'vendor',
                label: v.name,
                x: 100,
                y: (height / (activeVendors.length + 1)) * (i + 1),
                size: 40 + ((v.reliabilityScore || 0) / 10), // Size based on reliability
                color: '#3b82f6', // Blue
                data: v
            });
        });

        // 2. Warehouse (Center Layer)
        // Aggregating inventory into a single "Central Warehouse" node for simplicity in V1
        // or multiple if we had location data.
        nodeList.push({
            id: 'warehouse-main',
            type: 'warehouse',
            label: 'Central Warehouse',
            x: width / 2,
            y: height / 2,
            size: 80,
            color: '#8b5cf6', // Purple
            data: { itemCount: inventory.length }
        });

        // 3. Projects (Right Layer)
        const activeProjects = projects.filter(p => p.status === 'Active');
        activeProjects.forEach((p, i) => {
            nodeList.push({
                id: p.id,
                type: 'project',
                label: p.name,
                x: width - 100,
                y: (height / (activeProjects.length + 1)) * (i + 1),
                size: 60,
                color: '#10b981', // Green
                data: p
            });
        });

        return nodeList;
    }, [vendors, projects, inventory]);

    const links: Link[] = useMemo(() => {
        const linkList: Link[] = [];

        // 1. PO Links (Vendor -> Warehouse)
        purchaseOrders.forEach(po => {
            if (po.status !== 'Cancelled' && po.status !== 'Fulfilled') {
                linkList.push({
                    id: po.id,
                    source: po.vendorId,
                    target: 'warehouse-main',
                    type: 'po',
                    label: `$${po.totalAmount}`,
                    active: true
                });
            }
        });

        // 2. Allocation Links (Warehouse -> Project)
        // Mocking allocation based on project activity for visualization
        projects.filter(p => p.status === 'Active').forEach(p => {
            linkList.push({
                id: `alloc-${p.id}`,
                source: 'warehouse-main',
                target: p.id,
                type: 'allocation',
                active: true
            });
        });

        return linkList;
    }, [purchaseOrders, projects]);

    return (
        <div className="w-full h-screen bg-slate-900 overflow-hidden relative">
            <div className="absolute top-6 left-6 z-10">
                <h1 className="text-3xl font-bold text-white tracking-tight">Functional Cosmos</h1>
                <p className="text-slate-400">Real-time Supply Chain Visualization</p>
            </div>

            <svg className="w-full h-full pointer-events-none">
                {/* Links */}
                {links.map(link => {
                    const sourceNode = nodes.find(n => n.id === link.source);
                    const targetNode = nodes.find(n => n.id === link.target);
                    if (!sourceNode || !targetNode) return null;

                    return (
                        <g key={link.id}>
                            {/* Base Line */}
                            <line
                                x1={sourceNode.x}
                                y1={sourceNode.y}
                                x2={targetNode.x}
                                y2={targetNode.y}
                                stroke="#334155"
                                strokeWidth="2"
                            />
                            {/* Animated Particle for Active Links */}
                            {link.active && (
                                <motion.circle
                                    r="4"
                                    fill={link.type === 'po' ? '#60a5fa' : '#34d399'}
                                    initial={{ offsetDistance: "0%" }}
                                    animate={{
                                        cx: [sourceNode.x, targetNode.x],
                                        cy: [sourceNode.y, targetNode.y]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                />
                            )}
                        </g>
                    );
                })}

                {/* Nodes */}
                {nodes.map(node => (
                    <g key={node.id} className="cursor-pointer pointer-events-auto">
                        {/* Glow Effect */}
                        <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r={node.size / 2 + 5}
                            fill={node.color}
                            opacity={0.2}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                        {/* Main Node */}
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r={node.size / 2}
                            fill={node.color}
                            stroke="#1e293b"
                            strokeWidth="3"
                        />
                        {/* Label */}
                        <text
                            x={node.x}
                            y={node.y + node.size / 2 + 20}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="12"
                            className="font-mono"
                        >
                            {node.label}
                        </text>
                    </g>
                ))}
            </svg>

            {/* Legend / Controls */}
            <div className="absolute bottom-6 right-6 bg-slate-800/80 backdrop-blur p-4 rounded-xl border border-slate-700 text-slate-300 text-sm">
                <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Vendor</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Warehouse</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Project</span>
                </div>
            </div>
        </div>
    );
};
