import React, { useState, useEffect } from 'react';
import { Team, Invitation } from '../types';
import { teamService } from '../teamService';
import {
    Users,
    Settings,
    MoreHorizontal,
    Plus,
    Search,
    Filter,
    Grid,
    List,
    ChevronRight,
    Mail,
    UserPlus,
    X
} from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../ui/Toast';

interface TeamsDashboardProps {
    teams: Team[];
    onTeamClick: (teamId: string) => void;
    onCreateClick: () => void;
}

const TeamsDashboard: React.FC<TeamsDashboardProps> = ({ teams, onTeamClick, onCreateClick }) => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [workspaceInvitations, setWorkspaceInvitations] = useState<Invitation[]>([]);

    useEffect(() => {
        loadWorkspaceInvitations();
    }, []);

    const loadWorkspaceInvitations = async () => {
        const invites = await teamService.getWorkspaceInvitations();
        setWorkspaceInvitations(invites);
    };

    const handleCancelInvitation = async (id: string) => {
        if (window.confirm('Cancel this invitation?')) {
            try {
                await teamService.cancelInvitation(id);
                showToast('Invitation cancelled', 'success');
                loadWorkspaceInvitations();
            } catch (error: any) {
                showToast(error.message || 'Failed to cancel', 'error');
            }
        }
    };

    const categories = ['All', 'Design', 'Engineering', 'Marketing', 'General'];

    const filteredTeams = teams.filter(t => {
        const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Engineering': return 'bg-stone-800 dark:bg-stone-200';
            case 'Design': return 'bg-orange-400';
            case 'Marketing': return 'bg-emerald-500';
            default: return 'bg-stone-400';
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-stone-50/30 dark:bg-stone-950">

            {/* Top Bar / Header */}
            <div className="px-8 py-8 flex flex-col gap-6 flex-shrink-0">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif text-stone-900 dark:text-stone-50 tracking-tight">
                            {t('teams.title')}
                        </h1>
                        <p className="mt-2 text-stone-500 dark:text-stone-400 font-sans text-sm max-w-xl">
                            {t('teams.subtitle')}
                        </p>
                    </div>

                    <button
                        onClick={onCreateClick}
                        className="inline-flex items-center justify-center px-4 py-2 bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-sm font-medium font-sans rounded-lg shadow-sm hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
                    >
                        <Plus className="h-4 w-4 me-2" />
                        {t('teams.create')}
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-1">

                    {/* Tabs/Categories */}
                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar w-full md:w-auto">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`
                  pb-3 text-sm font-medium transition-all relative whitespace-nowrap
                  ${selectedCategory === cat ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}
                `}
                            >
                                {cat === 'All' ? t('gtd.label.total') : cat}
                                {selectedCategory === cat && (
                                    <span className="absolute bottom-0 inset-x-0 h-0.5 bg-stone-900 dark:bg-stone-100" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Search & Layout Toggles */}
                    <div className="flex items-center gap-3 w-full md:w-auto pb-3 md:pb-0">
                        <div className="relative flex-1 md:w-64 group">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-stone-600 dark:group-focus-within:text-stone-300 transition-colors rtl:flip" />
                            <input
                                type="text"
                                placeholder={t('teams.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full ps-9 pe-4 py-1.5 bg-transparent border-b border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:border-stone-500 dark:focus:border-stone-400 font-sans transition-colors placeholder-stone-400 text-stone-900 dark:text-stone-100 rtl:ps-9 rtl:pe-4"
                            />
                        </div>

                        <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 mx-2 hidden md:block" />

                        <div className="flex items-center gap-1 hidden md:flex">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'text-stone-900 dark:text-stone-100 bg-stone-200/50 dark:bg-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                                title={t('teams.view_grid')}
                            >
                                <Grid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'text-stone-900 dark:text-stone-100 bg-stone-200/50 dark:bg-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                                title={t('teams.view_list')}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-8 pb-12">

                {/* Pending Workspace Invitations */}
                {workspaceInvitations.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4 text-stone-900 dark:text-stone-100 font-serif font-medium">
                            <Mail className="h-4 w-4" />
                            <h3>Pending Workspace Invites</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {workspaceInvitations.map((invite) => (
                                <div key={invite.id} className="flex items-center justify-between p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                                            <UserPlus className="h-4 w-4 text-stone-500" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{invite.email}</div>
                                            <div className="text-xs text-stone-500">{invite.role} • Workspace</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                                            Pending
                                        </span>
                                        <button
                                            onClick={() => handleCancelInvitation(invite.id)}
                                            className="text-stone-400 hover:text-red-500 transition-colors p-1"
                                            title="Cancel Invitation"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {viewMode === 'grid' ? (
                    /* GRID VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filteredTeams.map((team) => (
                            <div
                                key={team.id}
                                onClick={() => onTeamClick(team.id)}
                                className="group relative bg-white dark:bg-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-lg transition-all duration-300 flex flex-col h-64 cursor-pointer"
                            >
                                {/* Category Accent */}
                                <div className={`absolute top-6 bottom-6 start-0 w-1 rounded-e-sm ${getCategoryColor(team.category)}`} />

                                {/* Card Header */}
                                <div className="ps-4 flex justify-between items-start mb-4">
                                    <div className="h-10 w-10 bg-stone-100 dark:bg-stone-800 rounded-lg flex items-center justify-center text-lg font-serif font-bold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                                        {team.name.charAt(0)}
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); }} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Card Body */}
                                <div className="ps-4 flex-1">
                                    <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-2 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors">
                                        {team.name}
                                    </h3>
                                    <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                                        {team.description}
                                    </p>
                                </div>

                                {/* Card Footer */}
                                <div className="ps-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between mt-auto">
                                    <div className="flex -space-x-2 rtl:space-x-reverse">
                                        {team.members.slice(0, 4).map((member) => (
                                            <img
                                                key={member.id}
                                                src={member.avatarUrl}
                                                alt={member.name}
                                                className="w-7 h-7 rounded-full border-2 border-white dark:border-stone-900 object-cover"
                                                title={member.name}
                                            />
                                        ))}
                                        {team.members.length > 4 && (
                                            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-stone-900 bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[9px] font-bold text-stone-500">
                                                +{team.members.length - 4}
                                            </div>
                                        )}
                                    </div>

                                    <span className="flex items-center text-xs font-medium font-sans text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
                                        {t('teams.view')}
                                        <ChevronRight className="h-3 w-3 ms-1 rtl:flip" />
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* 'New Team' Placeholder Card */}
                        <button
                            onClick={onCreateClick}
                            className="group relative flex flex-col items-center justify-center h-64 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:border-stone-300 dark:hover:border-stone-700 transition-all duration-300"
                        >
                            <div className="h-12 w-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Plus className="h-6 w-6 text-stone-400 dark:text-stone-500" />
                            </div>
                            <span className="text-sm font-medium font-serif text-stone-600 dark:text-stone-400">{t('teams.create')}</span>
                        </button>
                    </div>
                ) : (
                    /* LIST VIEW */
                    <div className="flex flex-col space-y-3">
                        {filteredTeams.map((team) => (
                            <div
                                key={team.id}
                                onClick={() => onTeamClick(team.id)}
                                className="group flex items-center p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg hover:border-stone-300 dark:hover:border-stone-700 transition-all hover:shadow-sm cursor-pointer"
                            >
                                <div className={`w-1 h-8 rounded-full me-4 ${getCategoryColor(team.category)}`} />

                                <div className="h-10 w-10 bg-stone-100 dark:bg-stone-800 rounded-lg flex items-center justify-center text-lg font-serif font-bold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 me-4">
                                    {team.name.charAt(0)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100 truncate">
                                        {team.name}
                                    </h3>
                                    <p className="text-xs text-stone-500 truncate max-w-lg">
                                        {team.description}
                                    </p>
                                </div>

                                <div className="hidden md:flex items-center gap-8 me-8">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] uppercase text-stone-400 font-bold tracking-wider">{t('teams.members')}</span>
                                        <span className="text-sm font-sans text-stone-700 dark:text-stone-300">{team.members.length}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] uppercase text-stone-400 font-bold tracking-wider">{t('teams.category')}</span>
                                        <span className="text-sm font-sans text-stone-700 dark:text-stone-300">{team.category}</span>
                                    </div>
                                </div>

                                <div className="flex -space-x-2 rtl:space-x-reverse me-6">
                                    {team.members.slice(0, 3).map((member) => (
                                        <img
                                            key={member.id}
                                            src={member.avatarUrl}
                                            alt={member.name}
                                            className="w-8 h-8 rounded-full border-2 border-white dark:border-stone-900 object-cover"
                                        />
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 border-s border-stone-100 dark:border-stone-800 ps-4">
                                    <button className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                        <Mail className="h-4 w-4" />
                                    </button>
                                    <button className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                        <Settings className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamsDashboard;
