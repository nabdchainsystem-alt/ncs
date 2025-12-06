import React, { useState, useEffect } from 'react';
import { X, Lock, Check, ChevronRight, Search } from 'lucide-react';
import { Room } from '../../../features/rooms/types';

interface SelectRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    rooms: Room[];
    onSelect: (room: Room) => void;
    darkMode?: boolean;
}

export const SelectRoomModal: React.FC<SelectRoomModalProps> = ({
    isOpen,
    onClose,
    rooms,
    onSelect,
    darkMode = false
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setSearchQuery('');
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-black/60 backdrop-blur-md opacity-100' : 'bg-transparent backdrop-blur-none opacity-0 pointer-events-none'}`}>
            <div className={`w-full max-w-md transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}>
                <div className={`relative rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl border flex flex-col max-h-[80vh] ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-white/40'}`}>

                    {/* Header */}
                    <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                        <div>
                            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Select Room</h3>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose a private room for these tasks</p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500'}`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                        <div className="relative">
                            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <input
                                type="text"
                                placeholder="Search rooms..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all ${darkMode ? 'bg-gray-800 text-white placeholder-gray-500 focus:bg-gray-700' : 'bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20'}`}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {filteredRooms.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No rooms found
                            </div>
                        ) : (
                            filteredRooms.map(room => (
                                <button
                                    key={room.id}
                                    onClick={() => onSelect(room)}
                                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all group ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-blue-50 text-gray-700 hover:text-blue-700'}`}
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg"
                                        style={{ backgroundColor: room.color || '#3b82f6' }}
                                    >
                                        {room.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold">{room.name}</h4>
                                        <div className="flex items-center gap-1 text-xs opacity-60">
                                            <Lock size={10} />
                                            <span>Private Room</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className={`opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 ${darkMode ? 'text-gray-500' : 'text-blue-400'}`} />
                                </button>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
