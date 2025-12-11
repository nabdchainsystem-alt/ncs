import React, { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Check, Save, ChevronDown, ChevronRight, UserCircle, Layout } from 'lucide-react';
import { permissionService } from '../../services/permissionService';
import { authService } from '../../services/auth';
import { Permissions, DEFAULT_PERMISSIONS, User } from '../../types/shared';
import { useToast } from '../../ui/Toast';

const SettingsPage: React.FC<{ onUpdateUser?: (user: Partial<User>) => void }> = ({ onUpdateUser }) => {
    const currentUser = authService.getCurrentUser();
    const isMaster = currentUser?.email === 'master@nabdchain.com' || currentUser?.email === 'master.smt@nabdchain-smt.com';

    const [activeTab, setActiveTab] = useState(isMaster ? 'authorizations' : 'profile');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<Permissions>({});
    const [users, setUsers] = useState<any[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        const loadUsers = async () => {
            const fetchedUsers = await permissionService.getAllUsers();
            setUsers(fetchedUsers);
        };
        loadUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            const perms = permissionService.getPermissions(selectedUser);
            setPermissions(perms);
        }
    }, [selectedUser]);

    const handleSave = () => {
        if (selectedUser) {
            permissionService.savePermissions(selectedUser, permissions);
            showToast('Permissions saved successfully', 'success');
        }
    };

    const togglePermission = (key: string) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleGroup = (keys: string[], value: boolean) => {
        setPermissions(prev => {
            const next = { ...prev };
            keys.forEach(k => next[k] = value);
            return next;
        });
    };

    const PermissionGroup = ({ title, items, prefix }: { title: string, items: { id: string, label: string }[], prefix?: string }) => {
        const allChecked = items.every(item => permissions[item.id]);
        const someChecked = items.some(item => permissions[item.id]);

        return (
            <div className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <h4 className="font-semibold text-gray-700">{title}</h4>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => toggleGroup(items.map(i => i.id), true)}
                            className="text-xs text-black hover:text-gray-800 font-medium"
                        >
                            Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={() => toggleGroup(items.map(i => i.id), false)}
                            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                    {items.map(item => (
                        <label key={item.id} className="flex items-center space-x-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions[item.id] ? 'bg-black border-black' : 'border-gray-300 group-hover:border-black'}`}>
                                {permissions[item.id] && <Check size={12} className="text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={permissions[item.id] || false}
                                onChange={() => togglePermission(item.id)}
                            />
                            <span className={`text-sm ${permissions[item.id] ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{item.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        );
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image size should be less than 5MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                if (onUpdateUser) {
                    onUpdateUser({ avatarUrl: base64String });
                    showToast('Profile picture updated', 'success');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden">
            {/* Settings Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Settings</h2>
                </div>
                <div className="flex-1 py-4">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'profile'
                            ? 'bg-gray-100 text-black border-r-2 border-black'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <UserCircle size={18} className="mr-3" />
                        My Profile
                    </button>

                    {isMaster && (
                        <button
                            onClick={() => setActiveTab('authorizations')}
                            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'authorizations'
                                ? 'bg-gray-100 text-black border-r-2 border-black'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Shield size={18} className="mr-3" />
                            Authorizations
                        </button>
                    )}

                    <button
                        onClick={() => setActiveTab('app')}
                        className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'app'
                            ? 'bg-gray-100 text-black border-r-2 border-black'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Layout size={18} className="mr-3" />
                        App
                    </button>
                </div>
            </div>

            {/* Content Area - Full Width */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
                {activeTab === 'profile' && (
                    <div className="flex-1 p-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
                        <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
                            <div className="flex items-center space-x-6 mb-8">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-4 border-white shadow-lg">
                                        {currentUser?.avatarUrl ? (
                                            <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            currentUser?.name?.charAt(0) || 'U'
                                        )}
                                    </div>
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
                                        <span className="text-xs font-medium">Change</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{currentUser?.name}</h3>
                                    <p className="text-gray-500">{currentUser?.email}</p>
                                    <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-black text-xs font-medium rounded-full">
                                        {isMaster ? 'Master Account' : 'Team Member'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={currentUser?.name || ''}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={currentUser?.email || ''}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'authorizations' && isMaster && (
                    <div className="flex-1 flex flex-col h-full">
                        {/* Header */}
                        <div className="px-8 py-6 bg-white border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">User Authorizations</h1>
                                <p className="text-gray-500 mt-1">Manage granular access permissions for team members.</p>
                            </div>
                            {selectedUser && (
                                <button
                                    onClick={handleSave}
                                    className="flex items-center px-6 py-2.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium shadow-sm"
                                >
                                    <Save size={18} className="mr-2" />
                                    Save Changes
                                </button>
                            )}
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* User List */}
                            <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
                                <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    Team Members
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {users.filter(u => u.email !== currentUser?.email).map(user => (
                                        <button
                                            key={user.email}
                                            onClick={() => setSelectedUser(user.email)}
                                            className={`w-full flex items-center p-4 hover:bg-gray-50 transition-colors text-left ${selectedUser === user.email ? 'bg-gray-100 border-l-4 border-black' : 'border-l-4 border-transparent'
                                                }`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm mr-3 shadow-sm">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`font-medium truncate ${selectedUser === user.email ? 'text-black' : 'text-gray-900'}`}>{user.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Permissions Panel */}
                            <div className="flex-1 overflow-y-auto p-8">
                                {selectedUser ? (
                                    <div className="space-y-8 max-w-5xl mx-auto">

                                        {/* General Access */}
                                        <PermissionGroup
                                            title="General Access"
                                            items={[
                                                { id: 'inbox', label: 'Inbox' },
                                                { id: 'discussion', label: 'Discussion' },
                                                { id: 'overview', label: 'Overview' },
                                                { id: 'goals', label: 'Goals' },
                                                { id: 'reminders', label: 'Reminders' },
                                                { id: 'tasks', label: 'Tasks' },
                                                { id: 'vault', label: 'Vault' },
                                                { id: 'teams', label: 'Teams' },
                                            ]}
                                        />

                                        {/* Departments */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                                    <span className="w-1 h-6 bg-blue-500 rounded mr-3"></span>
                                                    Departments
                                                </h3>
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions['departments'] ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                                        {permissions['departments'] && <Check size={12} className="text-white" />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={permissions['departments'] || false}
                                                        onChange={() => togglePermission('departments')}
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">Enable Section</span>
                                                </label>
                                            </div>

                                            <PermissionGroup
                                                title="Supply Chain"
                                                items={[
                                                    { id: 'supply-chain', label: 'Supply Chain (Section)' },
                                                    { id: 'supply-chain/procurement', label: 'Procurement' },
                                                    { id: 'supply-chain/warehouse', label: 'Warehouse' },
                                                    { id: 'supply-chain/shipping', label: 'Shipping' },
                                                    { id: 'supply-chain/planning', label: 'Planning' },
                                                    { id: 'supply-chain/fleet', label: 'Fleet' },
                                                    { id: 'supply-chain/vendors', label: 'Vendors' },
                                                ]}
                                            />

                                            <PermissionGroup
                                                title="Operations"
                                                items={[
                                                    { id: 'operations', label: 'Operations (Section)' },
                                                    { id: 'operations/maintenance', label: 'Maintenance' },
                                                    { id: 'operations/production', label: 'Production' },
                                                    { id: 'operations/quality', label: 'Quality' },
                                                ]}
                                            />

                                            <PermissionGroup
                                                title="Business"
                                                items={[
                                                    { id: 'business', label: 'Business (Section)' },
                                                    { id: 'business/sales', label: 'Sales' },
                                                    { id: 'business/finance', label: 'Finance' },
                                                ]}
                                            />

                                            <PermissionGroup
                                                title="Support"
                                                items={[
                                                    { id: 'support', label: 'Support (Section)' },
                                                    { id: 'support/it', label: 'IT' },
                                                    { id: 'support/hr', label: 'HR' },
                                                    { id: 'support/marketing', label: 'Marketing' },
                                                ]}
                                            />
                                        </div>

                                        {/* Smart Tools & Marketplace */}
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                                        <span className="w-1 h-6 bg-green-500 rounded mr-3"></span>
                                                        Marketplace
                                                    </h3>
                                                    <label className="flex items-center space-x-2 cursor-pointer">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${permissions['marketplace'] ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                                            {permissions['marketplace'] && <Check size={10} className="text-white" />}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={permissions['marketplace'] || false}
                                                            onChange={() => togglePermission('marketplace')}
                                                        />
                                                        <span className="text-xs font-medium text-gray-600">Enable</span>
                                                    </label>
                                                </div>
                                                <PermissionGroup
                                                    title="Markets"
                                                    items={[
                                                        { id: 'marketplace/local', label: 'Local Marketplace' },
                                                    ]}
                                                />
                                            </div>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                            <UserIcon size={48} className="opacity-50" />
                                        </div>
                                        <p className="text-xl font-medium text-gray-600">Select a user to configure permissions</p>
                                        <p className="text-sm mt-2">Choose a team member from the list to manage their access.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'app' && (
                    <div className="flex-1 p-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">App Settings</h1>
                        <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Startup Behavior</h3>
                            <p className="text-gray-500 mb-6">Choose which experience you want to see when you log in.</p>

                            <div className="space-y-4">
                                {[
                                    { id: 'ask', label: 'Always Ask', desc: 'Show the selection screen every time I log in.' },
                                    { id: 'main', label: 'NABD Main', desc: 'Go directly to the main dashboard.' },
                                    { id: 'vision', label: 'NABD Brain & Vision', desc: 'Go directly to the terminal interface.' }
                                ].map((option) => {
                                    const currentPref = localStorage.getItem('app-preference');
                                    const isSelected = option.id === 'ask' ? !currentPref : currentPref === option.id;

                                    return (
                                        <label key={option.id} className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${isSelected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <div className="flex items-center h-5">
                                                <input
                                                    type="radio"
                                                    name="startup-app"
                                                    checked={isSelected}
                                                    onChange={() => {
                                                        if (option.id === 'ask') {
                                                            localStorage.removeItem('app-preference');
                                                        } else {
                                                            localStorage.setItem('app-preference', option.id);
                                                        }
                                                        // Force re-render to update UI
                                                        setActiveTab('app');
                                                        // A hacky way to force update, but effectively we just need to trigger a state change. 
                                                        // Better would be to have a local state for preference, but this works for now since setActiveTab triggers render.
                                                        // Actually, let's add a dummy state update to be safe.
                                                        setPermissions({ ...permissions });
                                                    }}
                                                    className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                                                />
                                            </div>
                                            <div className="ml-3">
                                                <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                                                <span className="block text-sm text-gray-500">{option.desc}</span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
