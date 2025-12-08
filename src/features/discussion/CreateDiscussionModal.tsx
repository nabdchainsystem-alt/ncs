import React, { useState } from 'react';
import { X, Users, Hash } from 'lucide-react';
import { USERS } from '../../constants';
import { AnimatePresence, motion } from 'framer-motion';

interface CreateDiscussionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, participants: string[]) => void;
}

export const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name, selectedParticipants);
            setName('');
            setSelectedParticipants([]);
            onClose();
        }
    };

    const toggleParticipant = (userId: string) => {
        setSelectedParticipants(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const [availableUsers, setAvailableUsers] = useState<any[]>([]);

    React.useEffect(() => {
        const loadUsers = async () => {
            const users = await import('../../services/auth').then(m => m.authService.getUsers());
            const currentUser = import('../../services/auth').then(m => m.authService.getCurrentUser());
            const currentUserId = (await currentUser)?.id;
            setAvailableUsers(users.filter(u => u.id !== currentUserId));
        };
        loadUsers();
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">Start New Discussion</h3>
                            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discussion Name</label>
                                <div className="relative">
                                    <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Project Alpha"
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Add Participants</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-2">
                                    {availableUsers.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleParticipant(user.id)}
                                            className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${selectedParticipants.includes(user.id)
                                                ? 'bg-blue-50 border-blue-100'
                                                : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 overflow-hidden`} style={{ backgroundColor: user.color || '#3b82f6' }}>
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    (user.name || '?').charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                            {selectedParticipants.includes(user.id) && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 mr-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!name.trim()}
                                    className="px-4 py-2 bg-[#1e2126] hover:bg-[#2c3036] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Discussion
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
