import React, { useState, useEffect } from 'react';
import { X, Mail, Check, AlertCircle } from 'lucide-react';
import { useToast } from '../../ui/Toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { teamService } from './teamService';
import { Team } from '../../types/shared';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId?: string;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, teamId }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Viewer');
    const [sending, setSending] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const { showToast } = useToast();
    const { t } = useLanguage();

    useEffect(() => {
        if (isOpen && !teamId) {
            loadTeams();
        }
    }, [isOpen, teamId]);

    const loadTeams = async () => {
        try {
            const data = await teamService.getTeams();
            setTeams(data);
            if (data.length > 0) {
                setSelectedTeamId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to load teams', error);
        }
    };

    if (!isOpen) return null;

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        const targetTeamId = teamId || selectedTeamId;

        try {
            // No validation for empty teamId needed anymore as we support workspace invites
            const result = await teamService.inviteMember(targetTeamId || undefined, email, role);

            showToast(result.message, result.status === 'exists' ? 'info' : 'success');
            if (result.status !== 'exists') {
                setEmail('');
                onClose();
            }
        } catch (error: any) {
            console.error('Invite Error:', error);
            const errorMessage = error.message || error.error_description || 'Failed to send invitation';
            showToast(errorMessage, 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md shadow-2xl border border-stone-200 dark:border-stone-800 transform transition-all">
                <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-800">
                    <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                        Invite Member
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleInvite} className="p-6 space-y-4">
                    {!teamId && (
                        <div>
                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                Add to Team (Optional)
                            </label>
                            <select
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                className="w-full px-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 outline-none transition-all"
                            >
                                <option value="">Workspace (No specific team)</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 rtl:right-3 rtl:left-auto" size={16} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 outline-none transition-all rtl:pr-9 rtl:pl-4"
                                placeholder="colleague@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                            Role
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 outline-none transition-all"
                        >
                            <option value="Viewer">Viewer</option>
                            <option value="Editor">Editor</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={sending || !email}
                            className="flex items-center px-4 py-2 text-sm font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
                        >
                            {sending ? 'Sending...' : 'Send Invite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
