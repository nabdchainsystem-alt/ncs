import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Home, Inbox, MessageSquare, Layout, Target, Bell, ListTodo, Shield, Users,
    Building2, Lock, BrainCircuit, ShoppingBag, ChevronDown
} from 'lucide-react';
import { spaceService } from '../features/private-space/spaceService';
import { Space } from '../features/private-space/types';

interface FloatingNavigationProps {
    onNavigate: (page: string) => void;
    activePage?: string;
}

export const FloatingNavigation: React.FC<FloatingNavigationProps> = ({ onNavigate, activePage = 'home' }) => {
    const [spaces, setSpaces] = useState<Space[]>([]);

    useEffect(() => {
        const fetchSpaces = async () => {
            try {
                const data = await spaceService.getSpaces();
                setSpaces(data);
            } catch (error) {
                console.error('Failed to fetch spaces:', error);
            }
        };

        fetchSpaces();

        // Optional: Set up an interval or subscription if real-time updates are needed
        // For now, fetching on mount is sufficient
    }, []);

    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'inbox', label: 'Inbox', icon: Inbox },
        { id: 'discussion', label: 'Discussion', icon: MessageSquare },
        { id: 'overview', label: 'Overview', icon: Layout },
        { id: 'goals', label: 'Goals', icon: Target },
        { id: 'reminders', label: 'Reminders', icon: Bell },
        { id: 'tasks', label: 'Tasks', icon: ListTodo },
        { id: 'vault', label: 'Vault', icon: Shield },
        { id: 'teams', label: 'Teams', icon: Users },
        { id: 'vision', label: 'Vision', icon: BrainCircuit },

    ];

    const dropdownItems = [
        {
            id: 'departments',
            label: 'Departments',
            icon: Building2,
            subItems: [
                { id: 'supply-chain', label: 'Supply Chain', isHeader: true },
                {
                    id: 'supply-chain/procurement', label: 'Procurement', children: [
                        { id: 'procurement-data', label: 'Data', path: 'supply-chain/procurement/data' },
                        { id: 'procurement-analytics', label: 'Analytics', path: 'supply-chain/procurement/analytics' }
                    ]
                },
                {
                    id: 'supply-chain/warehouse', label: 'Warehouse', children: [
                        { id: 'warehouse-data', label: 'Data', path: 'supply-chain/warehouse/data' },
                        { id: 'warehouse-analytics', label: 'Analytics', path: 'supply-chain/warehouse/analytics' }
                    ]
                },
                {
                    id: 'supply-chain/shipping', label: 'Shipping', children: [
                        { id: 'shipping-data', label: 'Data', path: 'supply-chain/shipping/data' },
                        { id: 'shipping-analytics', label: 'Analytics', path: 'supply-chain/shipping/analytics' }
                    ]
                },
                {
                    id: 'supply-chain/planning', label: 'Planning', children: [
                        { id: 'planning-data', label: 'Data', path: 'supply-chain/planning/data' },
                        { id: 'planning-analytics', label: 'Analytics', path: 'supply-chain/planning/analytics' }
                    ]
                },
                {
                    id: 'supply-chain/fleet', label: 'Fleet', children: [
                        { id: 'fleet-data', label: 'Data', path: 'supply-chain/fleet/data' },
                        { id: 'fleet-analytics', label: 'Analytics', path: 'supply-chain/fleet/analytics' }
                    ]
                },
                {
                    id: 'supply-chain/vendors', label: 'Vendors', children: [
                        { id: 'vendors-data', label: 'Data', path: 'supply-chain/vendors/data' },
                        { id: 'vendors-analytics', label: 'Analytics', path: 'supply-chain/vendors/analytics' }
                    ]
                },

                { id: 'operations', label: 'Operations', isHeader: true },
                {
                    id: 'operations/maintenance', label: 'Maintenance', children: [
                        { id: 'maintenance-data', label: 'Data', path: 'operations/maintenance/data' },
                        { id: 'maintenance-analytics', label: 'Analytics', path: 'operations/maintenance/analytics' }
                    ]
                },
                {
                    id: 'operations/production', label: 'Production', children: [
                        { id: 'production-data', label: 'Data', path: 'operations/production/data' },
                        { id: 'production-analytics', label: 'Analytics', path: 'operations/production/analytics' }
                    ]
                },
                {
                    id: 'operations/quality', label: 'Quality', children: [
                        { id: 'quality-data', label: 'Data', path: 'operations/quality/data' },
                        { id: 'quality-analytics', label: 'Analytics', path: 'operations/quality/analytics' }
                    ]
                },

                { id: 'business', label: 'Business', isHeader: true },
                {
                    id: 'business/sales', label: 'Sales', children: [
                        { id: 'sales-data', label: 'Data', path: 'business/sales/data' },
                        { id: 'sales-analytics', label: 'Analytics', path: 'business/sales/analytics' }
                    ]
                },
                {
                    id: 'business/finance', label: 'Finance', children: [
                        { id: 'finance-data', label: 'Data', path: 'business/finance/data' },
                        { id: 'finance-analytics', label: 'Analytics', path: 'business/finance/analytics' }
                    ]
                },

                { id: 'support', label: 'Support', isHeader: true },
                {
                    id: 'support/it', label: 'IT', children: [
                        { id: 'it-data', label: 'Data', path: 'support/it/data' },
                        { id: 'it-analytics', label: 'Analytics', path: 'support/it/analytics' }
                    ]
                },
                {
                    id: 'support/hr', label: 'HR', children: [
                        { id: 'hr-data', label: 'Data', path: 'support/hr/data' },
                        { id: 'hr-analytics', label: 'Analytics', path: 'support/hr/analytics' }
                    ]
                },
                {
                    id: 'support/marketing', label: 'Marketing', children: [
                        { id: 'marketing-data', label: 'Data', path: 'support/marketing/data' },
                        { id: 'marketing-analytics', label: 'Analytics', path: 'support/marketing/analytics' }
                    ]
                }
            ]
        },
        {
            id: 'spaces',
            label: 'Private Rooms',
            icon: Lock,
            subItems: spaces.length > 0 ? spaces.map(space => ({
                id: space.id,
                label: space.name
            })) : [
                { id: 'no-rooms', label: 'No rooms created' }
            ]
        },
        {
            id: 'smart-tools',
            label: 'Smart Tools',
            icon: BrainCircuit,
            subItems: [
                { id: 'mind-map', label: 'Mind Map' },
                { id: 'dashboard', label: 'AI Dashboard' }
            ]
        },
        {
            id: 'marketplace',
            label: 'Marketplace',
            icon: ShoppingBag,
            subItems: [
                { id: 'local', label: 'Local Market' },
                { id: 'foreign', label: 'Foreign Market' },
                { id: 'global-industries-master', label: 'Global Industries Master' }
            ]
        },
    ];

    const totalItems = navItems.length + dropdownItems.length;
    const centerIndex = Math.floor(totalItems / 2);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: -20, opacity: 0 },
        visible: (custom: number = 0) => ({
            y: 0,
            opacity: 1,
            transition: {
                delay: custom * 0.05,
                type: "spring" as const,
                stiffness: 300,
                damping: 24
            }
        })
    };

    return (
        <motion.div
            className="flex items-center justify-center gap-1 overflow-visible px-2 w-full h-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >

            {/* Direct Links */}
            {navItems.map((item, index) => {
                const isActive = activePage === item.id;
                const distanceFromCenter = Math.abs(index - centerIndex);

                return (
                    <motion.button
                        key={item.id}
                        custom={distanceFromCenter}
                        variants={itemVariants}
                        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`}
                        onClick={() => onNavigate(item.id)}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeNav"
                                className="absolute inset-0 bg-white/15 rounded-lg"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <item.icon size={14} className="relative z-10" />
                        <span className="relative z-10">{item.label}</span>
                    </motion.button>
                );
            })}

            <motion.div
                className="w-px h-4 bg-gray-700 mx-2 shrink-0"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 16 }}
                transition={{ delay: 0.5 }}
            />

            {/* Dropdowns */}
            {dropdownItems.map((item, i) => {
                const index = navItems.length + i; // Continue index count
                const distanceFromCenter = Math.abs(index - centerIndex);
                const isActive = activePage.startsWith(item.id);

                return (
                    <motion.div
                        key={item.id}
                        custom={distanceFromCenter}
                        variants={itemVariants}
                        className="relative group shrink-0"
                    >
                        <motion.button
                            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`}
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute inset-0 bg-white/15 rounded-lg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <item.icon size={14} className="relative z-10" />
                            <span className="relative z-10">{item.label}</span>
                            <ChevronDown size={12} className="relative z-10 text-gray-500 group-hover:text-gray-300 transition-transform group-hover:rotate-180" />
                        </motion.button>

                        {/* Dropdown Menu */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#2a2e35] border border-gray-700 rounded-xl shadow-2xl opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 z-[100] overflow-visible origin-top">
                            <div className="py-1">
                                {item.subItems.map((sub: any) => (
                                    sub.isHeader ? (
                                        <div key={sub.id} className="px-4 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mt-1 first:mt-0">
                                            {sub.label}
                                        </div>
                                    ) : (
                                        <div key={sub.id} className="relative group/sub">
                                            <button
                                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-between whitespace-nowrap"
                                                onClick={() => {
                                                    if (!sub.children) {
                                                        // If it's the 'no-rooms' placeholder, don't navigate
                                                        if (sub.id === 'no-rooms') return;
                                                        onNavigate(item.id === 'departments' ? sub.id : `${item.id}/${sub.id}`);
                                                    }
                                                }}
                                            >
                                                <span className={sub.isChild ? "pl-4" : ""}>{sub.label}</span>
                                                {sub.children && <ChevronDown size={10} className="-rotate-90 text-gray-500" />}
                                            </button>

                                            {/* Nested Submenu (Flyout) */}
                                            {sub.children && (
                                                <div className="absolute left-full top-0 ml-1 w-40 bg-[#2a2e35] border border-gray-700 rounded-xl shadow-xl opacity-0 invisible -translate-x-2 group-hover/sub:opacity-100 group-hover/sub:visible group-hover/sub:translate-x-0 transition-all duration-200 z-[100]">
                                                    <div className="py-1">
                                                        {sub.children.map((child: any) => (
                                                            <button
                                                                key={child.id}
                                                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onNavigate(child.path);
                                                                }}
                                                            >
                                                                {child.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
            })}

        </motion.div >
    );
};
