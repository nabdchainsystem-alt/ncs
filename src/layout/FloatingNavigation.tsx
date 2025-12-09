import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Inbox, MessageSquare, Layout, Target, Bell, ListTodo, Shield, Users,
    Building2, Lock, BrainCircuit, ShoppingBag, ChevronDown, Plus, X, Trash2
} from 'lucide-react';

import { authService } from '../services/auth';
import { Room } from '../features/rooms/types';
import { roomService } from '../features/rooms/roomService';
import { useLanguage } from '../contexts/LanguageContext';


interface FloatingNavigationProps {
    onNavigate: (page: string) => void;
    activePage?: string;
}

export const FloatingNavigation: React.FC<FloatingNavigationProps> = ({ onNavigate, activePage = 'home' }) => {
    const navRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [selectedColor, setSelectedColor] = useState('#3b82f6'); // Default blue
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

    const COLORS = [
        '#3b82f6', // Blue
        '#ef4444', // Red
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#6366f1', // Indigo
    ];

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const user = authService.getCurrentUser();
                if (user) {
                    const data = await roomService.getRooms(user.id);
                    setRooms(data);
                    localStorage.setItem('available_rooms', JSON.stringify(data));
                }
            } catch (error) {
                console.error('Failed to fetch rooms', error);
            }
        };

        fetchRooms();
    }, []);

    // Close Create Room mode if clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                // If the user clicks outside deeply, we want to close the create mode
                // so the menu isn't "stuck" open
                if (isCreatingRoom) {
                    setIsCreatingRoom(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isCreatingRoom]);


    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) return;

        try {
            const user = authService.getCurrentUser();
            if (user) {
                const newRoom = await roomService.createRoom(newRoomName, selectedColor, user.id);
                setRooms(prev => [...prev, newRoom]);
                setIsCreatingRoom(false);
                setNewRoomName('');
                onNavigate(newRoom.id);
            }
        } catch (error) {
            console.error('Failed to create room', error);
        }
    };

    const confirmDeleteRoom = async (roomId: string) => {
        try {
            await roomService.deleteRoom(roomId);
            setRooms(prev => prev.filter(r => r.id !== roomId));
            setDeletingRoomId(null);
            if (activePage === roomId) {
                onNavigate('home');
            }
        } catch (error) {
            console.error('Failed to delete room', error);
        }
    };

    const navItems = [
        { id: 'home', label: t('nav.home'), icon: Home },
        { id: 'overview', label: t('nav.overview'), icon: Layout },
        { id: 'goals', label: t('nav.goals'), icon: Target },
        { id: 'tasks', label: t('nav.tasks'), icon: ListTodo },
        { id: 'reminders', label: t('nav.reminders'), icon: Bell },
        { id: 'vault', label: t('nav.vault'), icon: Shield },
        { id: 'teams', label: t('nav.teams'), icon: Users },
    ];

    const dropdownItems = [
        {
            id: 'communications',
            label: 'Communications',
            icon: MessageSquare,
            subItems: [
                { id: 'inbox', label: t('nav.inbox') },
                { id: 'discussion', label: t('nav.discussion') },
                { id: 'connections', label: 'Connections' }
            ]
        },
        {
            id: 'departments',
            label: t('nav.departments'),
            icon: Building2,
            subItems: [
                { id: 'supply-chain', label: t('dept.supply_chain'), isHeader: true },
                {
                    id: 'supply-chain/procurement', label: t('dept.procurement'), children: [
                        { id: 'procurement-data', label: t('common.data'), path: 'supply-chain/procurement/data' },
                        { id: 'procurement-analytics', label: t('common.analytics'), path: 'supply-chain/procurement/analytics' }
                    ]
                },
                {
                    id: 'supply-chain/warehouse', label: t('dept.warehouse'), children: [
                        { id: 'warehouse-data', label: t('common.data'), path: 'supply-chain/warehouse/data' },
                        { id: 'warehouse-analytics', label: t('common.analytics'), path: 'supply-chain/warehouse/analytics' }
                    ]
                },
                {
                    id: 'supply-chain/shipping', label: t('dept.shipping'), children: [
                        { id: 'shipping-data', label: t('common.data'), path: 'supply-chain/shipping/data' },
                        { id: 'shipping-analytics', label: t('common.analytics'), path: 'supply-chain/shipping/analytics' }
                    ]
                },
                {
                    id: 'supply-chain/planning', label: t('dept.planning'), children: [
                        { id: 'planning-data', label: t('common.data'), path: 'supply-chain/planning/data' },
                        { id: 'planning-analytics', label: t('common.analytics'), path: 'supply-chain/planning/analytics' }
                    ]
                },
                {
                    id: 'supply-chain/fleet', label: t('dept.fleet'), children: [
                        { id: 'fleet-data', label: t('common.data'), path: 'supply-chain/fleet/data' },
                        { id: 'fleet-analytics', label: t('common.analytics'), path: 'supply-chain/fleet/analytics' }
                    ]
                },
                {
                    id: 'supply-chain/vendors', label: t('dept.vendors'), children: [
                        { id: 'vendors-data', label: t('common.data'), path: 'supply-chain/vendors/data' },
                        { id: 'vendors-analytics', label: t('common.analytics'), path: 'supply-chain/vendors/analytics' }
                    ]
                },

                { id: 'operations', label: t('dept.operations'), isHeader: true },
                {
                    id: 'operations/maintenance', label: t('dept.maintenance'), children: [
                        { id: 'maintenance-data', label: t('common.data'), path: 'operations/maintenance/data' },
                        { id: 'maintenance-analytics', label: t('common.analytics'), path: 'operations/maintenance/analytics' }
                    ]
                },
                {
                    id: 'operations/production', label: t('dept.production'), children: [
                        { id: 'production-data', label: t('common.data'), path: 'operations/production/data' },
                        { id: 'production-analytics', label: t('common.analytics'), path: 'operations/production/analytics' }
                    ]
                },
                {
                    id: 'operations/quality', label: t('dept.quality'), children: [
                        { id: 'quality-data', label: t('common.data'), path: 'operations/quality/data' },
                        { id: 'quality-analytics', label: t('common.analytics'), path: 'operations/quality/analytics' }
                    ]
                },

                { id: 'business', label: t('dept.business'), isHeader: true },
                {
                    id: 'business/sales', label: t('dept.sales'), children: [
                        { id: 'sales-data', label: t('common.data'), path: 'business/sales/data' },
                        { id: 'sales-analytics', label: t('common.analytics'), path: 'business/sales/analytics' }
                    ]
                },
                {
                    id: 'business/finance', label: t('dept.finance'), children: [
                        { id: 'finance-data', label: t('common.data'), path: 'business/finance/data' },
                        { id: 'finance-analytics', label: t('common.analytics'), path: 'business/finance/analytics' }
                    ]
                },

                { id: 'support', label: t('dept.support'), isHeader: true },
                {
                    id: 'support/it', label: t('dept.it'), children: [
                        { id: 'it-data', label: t('common.data'), path: 'support/it/data' },
                        { id: 'it-analytics', label: t('common.analytics'), path: 'support/it/analytics' }
                    ]
                },
                {
                    id: 'support/hr', label: t('dept.hr'), children: [
                        { id: 'hr-data', label: t('common.data'), path: 'support/hr/data' },
                        { id: 'hr-analytics', label: t('common.analytics'), path: 'support/hr/analytics' }
                    ]
                },
                {
                    id: 'support/marketing', label: t('dept.marketing'), children: [
                        { id: 'marketing-data', label: t('common.data'), path: 'support/marketing/data' },
                        { id: 'marketing-analytics', label: t('common.analytics'), path: 'support/marketing/analytics' }
                    ]
                }
            ]
        },
        {
            id: 'spaces',
            label: t('nav.private_rooms'),
            icon: Lock,
            subItems: [
                {
                    id: 'my-rooms-header',
                    label: 'My Rooms',
                    isHeader: true,
                    customRender: (
                        <div className="flex items-center justify-between px-4 py-2 mt-1 first:mt-0">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">My Rooms</span>
                            {!isCreatingRoom && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCreatingRoom(true);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            )}
                        </div>
                    )
                },
                ...(isCreatingRoom ? [{
                    id: 'create-room-form',
                    label: '',
                    customRender: (
                        <div
                            className="px-3 py-3 bg-[#1a1d21]/50 mx-2 rounded-xl border border-white/5 mb-2 relative z-50 shadow-inner"
                            onClick={e => e.stopPropagation()}
                            onMouseDown={e => e.stopPropagation()}
                            onMouseUp={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-2 mb-3 relative">
                                {/* Color Picker Trigger */}
                                <div className="relative shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowColorPicker(!showColorPicker);
                                        }}
                                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-1 focus:ring-white/20"
                                        style={{ backgroundColor: selectedColor }}
                                    />

                                    {/* Color Picker Popover */}
                                    {showColorPicker && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-[60]"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowColorPicker(false);
                                                }}
                                            />
                                            <div className="absolute top-full left-0 mt-2 p-2 bg-[#1a1d21] border border-white/10 rounded-xl shadow-xl z-[70] grid grid-cols-4 gap-2 w-[116px]">
                                                {COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        className={`w-5 h-5 rounded-full border border-gray-600 transition-transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-white scale-110' : ''}`}
                                                        style={{ backgroundColor: color }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedColor(color);
                                                            setShowColorPicker(false);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Room Name"
                                    className="flex-1 bg-black/20 text-white text-xs px-3 h-8 rounded-lg border border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all placeholder-gray-600"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    // Prevent menu closing on input interaction
                                    onClick={e => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                        e.stopPropagation(); // Prevent navigation hotkeys from interfering
                                        if (e.key === 'Enter') handleCreateRoom();
                                        if (e.key === 'Escape') setIsCreatingRoom(false);
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCreatingRoom(false);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCreateRoom();
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                >
                                    {t('common.create')}
                                </button>
                            </div>
                        </div>
                    )
                }] : []),
                ...(rooms.length > 0 ? rooms.map(room => ({
                    id: room.id,
                    label: room.name,
                    customRender: (
                        <div className="group/room-item relative w-full px-2">
                            <button
                                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all flex items-center gap-2.5"
                                onClick={() => onNavigate(room.id)}
                            >
                                <span className="w-2 h-2 rounded-full ring-1 ring-white/20" style={{ backgroundColor: room.color }} />
                                <span className="truncate flex-1 font-medium">{room.name}</span>
                            </button>
                            {/* Delete Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingRoomId(room.id);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded-md opacity-0 group-hover/room-item:opacity-100 transition-all"
                            >
                                <Trash2 size={12} />
                            </button>

                            {/* Inline Delete Confirmation */}
                            {deletingRoomId === room.id && (
                                <div className="absolute inset-0 mx-2 bg-[#2a2e35] border border-white/10 flex items-center justify-between px-3 rounded-lg z-20 animate-in fade-in duration-200 shadow-xl" onClick={e => e.stopPropagation()}>
                                    <span className="text-xs text-red-400 font-medium">Delete?</span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setDeletingRoomId(null)}
                                            className="p-1 hover:bg-white/10 rounded text-gray-400 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                        <button
                                            onClick={() => confirmDeleteRoom(room.id)}
                                            className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })) : (!isCreatingRoom ? [{ id: 'no-rooms', label: 'No rooms created' }] : []))
            ]
        },
        {
            id: 'smart-tools',
            label: t('nav.smart_tools'),
            icon: BrainCircuit,
            subItems: [
                { id: 'mind-map', label: t('tool.mind_map') },
                { id: 'dashboard', label: t('tool.ai_dashboard') }
            ]
        },
        {
            id: 'marketplace',
            label: t('nav.marketplace'),
            icon: ShoppingBag,
            subItems: [
                { id: 'local', label: t('market.local') },
                { id: 'foreign', label: t('market.foreign') }
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
                type: "spring" as any,
                stiffness: 300,
                damping: 24
            }
        })
    };

    return (
        <motion.div
            ref={navRef}
            className="flex items-center justify-center gap-1 overflow-visible px-2 w-full h-full pr-32"
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
                        className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => onNavigate(item.id)}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeNav"
                                className="absolute inset-0 bg-white/10 rounded-lg border border-white/5"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <item.icon size={14} className="relative z-10" />
                        <span className="relative z-10">{item.label}</span>
                    </motion.button>
                );
            })}

            <motion.div
                className="w-px h-4 bg-white/10 mx-2 shrink-0"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 16 }}
                transition={{ delay: 0.5 }}
            />

            {/* Dropdowns */}
            {dropdownItems.map((item, i) => {
                const index = navItems.length + i;
                const distanceFromCenter = Math.abs(index - centerIndex);
                const isActive = activePage.startsWith(item.id) ||
                    (item.id === 'communications' && ['inbox', 'discussion', 'connections'].includes(activePage));

                return (
                    <motion.div
                        key={item.id}
                        custom={distanceFromCenter}
                        variants={itemVariants}
                        className="relative group shrink-0"
                    >
                        <motion.button
                            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute inset-0 bg-white/10 rounded-lg border border-white/5"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <item.icon size={14} className="relative z-10" />
                            <span className="relative z-10">{item.label}</span>
                            <ChevronDown size={12} className="relative z-10 text-gray-500 group-hover:text-gray-300 transition-transform group-hover:rotate-180" />
                        </motion.button>

                        {/* Dropdown Menu - Glassmorphic & Modern */}
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 p-1.5
                            bg-[#1a1d21]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50
                            transition-all duration-300 origin-top z-[100] overflow-visible
                            ${(isCreatingRoom && item.id === 'spaces')
                                ? 'opacity-100 translate-y-0 visible scale-100'
                                : 'opacity-0 translate-y-2 scale-95 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible group-hover:scale-100 ease-out'
                            }`}>

                            {/* Little arrow maybe? No, clean floating is better. */}

                            <div className="flex flex-col gap-0.5">
                                {item.subItems.map((sub: any) => (
                                    sub.isHeader ? (
                                        sub.customRender ? (
                                            <div key={sub.id} className="mb-1">
                                                {sub.customRender}
                                            </div>
                                        ) : (
                                            <div key={sub.id} className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1 first:mt-0">
                                                {sub.label}
                                            </div>
                                        )
                                    ) : (
                                        <div key={sub.id} className="relative group/sub px-1">
                                            {sub.customRender ? (
                                                sub.customRender
                                            ) : (
                                                <button
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center justify-between whitespace-nowrap"
                                                    onClick={() => {
                                                        if (!sub.children) {
                                                            if (sub.id === 'no-rooms') return;
                                                            onNavigate(item.id === 'departments' ? sub.id : `${item.id}/${sub.id}`);
                                                        }
                                                    }}
                                                >
                                                    <span className={sub.isChild ? "pl-4" : ""}>{sub.label}</span>
                                                    {sub.children && <ChevronDown size={12} className="-rotate-90 text-gray-600 group-hover:text-gray-400" />}
                                                </button>
                                            )}

                                            {/* Nested Submenu (Flyout) */}
                                            {sub.children && !sub.customRender && (
                                                <div className="absolute left-full top-0 ml-2 w-48 p-1.5 bg-[#1a1d21]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl opacity-0 invisible -translate-x-2 group-hover/sub:opacity-100 group-hover/sub:visible group-hover/sub:translate-x-0 transition-all duration-200 z-[100]">
                                                    <div className="flex flex-col gap-0.5">
                                                        {sub.children.map((child: any) => (
                                                            <button
                                                                key={child.id}
                                                                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
