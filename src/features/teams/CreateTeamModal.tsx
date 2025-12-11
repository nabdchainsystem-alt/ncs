import React, { useState } from 'react';
import { X, Mail, Plus, X as RemoveIcon } from 'lucide-react';
import { teamService } from './teamService';
import { useToast } from '../../ui/Toast';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTeamCreated: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onTeamCreated }) => {
    const [name, setName] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [inviteEmails, setInviteEmails] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleAddEmail = () => {
        if (!emailInput.trim()) return;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput)) {
            showToast('Please enter a valid email', 'error');
            return;
        }

        if (inviteEmails.includes(emailInput)) {
            setEmailInput('');
            return;
        }

        setInviteEmails([...inviteEmails, emailInput]);
        setEmailInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddEmail();
        }
    };

    const removeEmail = (email: string) => {
        setInviteEmails(inviteEmails.filter(e => e !== email));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            // 1. Create Team
            const newTeam = await teamService.createTeam({
                name,
                members: [], // We don't add members directly here anymore
                color: '#3b82f6', // Default blue
                company_id: '' // Service handles this
            });

            // 2. Send Invitations
            let emailServiceAvailable = true;
            if (inviteEmails.length > 0) {
                const results = await Promise.all(inviteEmails.map(email =>
                    teamService.inviteMember(newTeam.id, email, 'member')
                ));

                // Check if any result indicates service failure
                if (results.some(r => r.message && r.message.includes('Email service unavailable'))) {
                    emailServiceAvailable = false;
                }
            }

            if (emailServiceAvailable) {
                showToast('Team created and invitations sent!', 'success');
            } else {
                showToast('Team created, but email service unavailable. Check console.', 'warning');
            }

            onTeamCreated();
            onClose();

            // Reset form
            setName('');
            setInviteEmails([]);
            setEmailInput('');
        } catch (error) {
            console.error('Failed to create team', error);
            showToast('Failed to create team', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-800">
                    <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Create New Team</h2>
                    <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Team Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Marketing"
                            className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 focus:border-black dark:focus:border-white outline-none transition-all text-stone-900 dark:text-stone-100"
                            autoFocus
                            required
                        />
                    </div>

                    {/* Invite Section */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                            Invite Members (Optional)
                        </label>
                        <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2 focus-within:ring-2 focus-within:ring-black/5 dark:focus-within:ring-white/10 focus-within:border-black dark:focus-within:border-white transition-all">

                            {/* Chip List */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {inviteEmails.map(email => (
                                    <span key={email} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-600 shadow-sm">
                                        {email}
                                        <button
                                            type="button"
                                            onClick={() => removeEmail(email)}
                                            className="ml-1 text-stone-400 hover:text-red-500"
                                        >
                                            <RemoveIcon size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            {/* Input Area */}
                            <div className="flex items-center gap-2 px-1">
                                <Mail size={16} className="text-stone-400 shrink-0" />
                                <input
                                    type="email"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter email address and press Enter"
                                    className="bg-transparent border-none outline-none text-sm w-full placeholder-stone-500 dark:placeholder-stone-400 text-stone-900 dark:text-stone-100 h-9"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddEmail}
                                    className="p-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 rounded-lg text-stone-600 dark:text-stone-300 transition-colors"
                                    disabled={!emailInput.trim()}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                            Press Enter to add an email to the list.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Team'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
