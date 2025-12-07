import React, { useState, useEffect } from 'react';
import { Users, BadgeCheck, Plus, Briefcase, UserCheck } from 'lucide-react';
import { teamService } from '../teams/teamService';
import { authService } from '../../services/auth';
import { Team, User } from '../../types/shared';
import { useToast } from '../../ui/Toast';

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const fetchedTeams = await teamService.getTeams();
        setTeams(fetchedTeams);

        const currentUser = authService.getCurrentUser();
        setIsSuperAdmin(
          currentUser?.email === 'master@nabdchain.com' ||
          currentUser?.email === 'max@nabdchain.com'
        );
      } catch (error) {
        console.error('Failed to load teams', error);
        showToast('Failed to load teams', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const getTotalMembers = () => {
    const uniqueMembers = new Set<string>();
    teams.forEach(team => {
      team.members.forEach((memberId: string) => uniqueMembers.add(memberId));
    });
    return uniqueMembers.size;
  };

  return (
    <div className="flex-1 bg-gray-50/50 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1 flex items-center space-x-2">
              <Users size={14} className="text-clickup-purple" />
              <span>Teams</span>
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Team Console</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isSuperAdmin
                ? "Global Overview: Viewing all teams across all servers."
                : "Manage your team's squads and members."}
            </p>
          </div>
          {isSuperAdmin && (
            <div className="flex items-center space-x-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <BadgeCheck size={16} />
              <span>Super Admin Access</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Teams</p>
            <p className="text-3xl font-bold mt-2 text-gray-900">{teams.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Active Members</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">{getTotalMembers()}</p>
          </div>
        </div>

        {/* Team List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Active Teams</h3>
          </div>

          {isLoading ? (
            <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-gray-500">
              Loading teams...
            </div>
          ) : teams.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-gray-500">
              No teams found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {teams.map(team => (
                <div key={team.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: team.color || '#3b82f6' }}
                      >
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                          {team.name}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Users size={12} className="mr-1" />
                            {team.members.length} members
                          </span>
                          {isSuperAdmin && (
                            <span className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                              {team.company_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      {team.members.slice(0, 5).map((memberId: string, i: number) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500"
                          title={memberId}
                        >
                          {memberId.substring(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {team.members.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                          +{team.members.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;
