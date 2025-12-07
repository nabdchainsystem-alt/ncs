import React, { useState, useEffect } from 'react';
import { X, Users, Check, Search } from 'lucide-react';
import { teamService } from './teamService';
import { authService } from '../../services/auth';
import { User } from '../../types/shared';
import { useToast } from '../../ui/Toast';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTeamCreated: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onTeamCreated }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3b82f6');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    const loadUsers = async () => {
        try {
            const users = await authService.getUsers();
            setAvailableUsers(users);
        } catch (error) {
            console.error('Failed to load users', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await teamService.createTeam({
                name,
                members: selectedMembers,
                color,
                company_id: '' // Service handles this
            });
            showToast('Team created successfully!', 'success');
            onTeamCreated();
            onClose();
            setName('');
            setSelectedMembers([]);
            setColor('#3b82f6');
        } catch (error) {
            console.error('Failed to create team', error);
            showToast('Failed to create team', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMember = (userId: string) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const filteredUsers = availableUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Create New Team</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Alpha Squad"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                            autoFocus
                            required
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Team Color</label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                >
                                    {color === c && <Check size={14} className="text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Member Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add Members ({selectedMembers.length})
                        </label>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                            <div className="p-3 border-b border-gray-200 flex items-center gap-2">
                                <Search size={16} className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search people..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-500"
                                />
                            </div>
                            <div className="max-h-48 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {filteredUsers.map(user => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => toggleMember(user.id)}
                                        className={`w-full flex items-center p-2 rounded-lg text-sm transition-colors ${selectedMembers.includes(user.id) ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mr-3 ${selectedMembers.includes(user.id) ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                user.name.charAt(0)
                                            )}
                                        </div>
                                        <span>{user.name}</span>
                                        {selectedMembers.includes(user.id) && <Check size={14} className="ml-auto" />}
                                    </button>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="p-4 text-center text-xs text-gray-400">No users found</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Team'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
