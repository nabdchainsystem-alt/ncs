import React, { useState, useEffect } from 'react';
import {
    Shield, Lock, Unlock, Search, Plus, Key, FileText, CreditCard,
    User, Folder, Star, MoreHorizontal, Copy, Eye, EyeOff,
    AlertTriangle, CheckCircle2, Fingerprint, History, File, Image, ChevronRight, ArrowLeft
} from 'lucide-react';

interface VaultItem {
    id: string;
    title: string;
    username?: string;
    password?: string;
    url?: string;
    type: 'login' | 'note' | 'card' | 'identity' | 'folder' | 'file';
    category: string;
    favorite: boolean;
    lastModified: string;
    strength?: 'weak' | 'medium' | 'strong';
    parentId?: string | null;
    size?: string;
    fileType?: string;
}

const VaultPage: React.FC = () => {
    const [isLocked, setIsLocked] = useState(true);
    const [pin, setPin] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    // Mock Data
    const [items] = useState<VaultItem[]>([
        // Logins & Secrets
        { id: '1', title: 'Google Workspace Admin', username: 'admin@company.com', password: 'super-secret-password-123', url: 'admin.google.com', type: 'login', category: 'Work', favorite: true, lastModified: '2 days ago', strength: 'strong' },
        { id: '2', title: 'AWS Root Account', username: 'root-user', password: 'complex-aws-password-!@#', url: 'aws.amazon.com', type: 'login', category: 'DevOps', favorite: true, lastModified: '1 week ago', strength: 'strong' },
        { id: '3', title: 'Corporate Amex', type: 'card', category: 'Finance', favorite: false, lastModified: '1 month ago' },
        { id: '4', title: 'Q4 Strategy Notes', type: 'note', category: 'Executive', favorite: false, lastModified: '3 days ago' },
        { id: '5', title: 'Slack Admin', username: 'admin@company.com', password: 'slack-password-456', url: 'company.slack.com', type: 'login', category: 'Work', favorite: false, lastModified: '2 weeks ago', strength: 'medium' },

        // Files & Folders
        { id: 'f1', title: 'Legal Documents', type: 'folder', category: 'files', favorite: false, lastModified: '1 day ago', parentId: null },
        { id: 'f2', title: 'Financial Reports', type: 'folder', category: 'files', favorite: false, lastModified: '3 days ago', parentId: null },
        { id: 'f3', title: 'Product Blueprints', type: 'folder', category: 'files', favorite: true, lastModified: '1 week ago', parentId: null },

        { id: 'doc1', title: 'Incorporation.pdf', type: 'file', category: 'files', favorite: false, lastModified: '1 year ago', parentId: 'f1', size: '2.4 MB', fileType: 'pdf' },
        { id: 'doc2', title: 'NDA_Template.docx', type: 'file', category: 'files', favorite: false, lastModified: '2 months ago', parentId: 'f1', size: '145 KB', fileType: 'doc' },
        { id: 'img1', title: 'Q3_P&L.png', type: 'file', category: 'files', favorite: false, lastModified: '1 month ago', parentId: 'f2', size: '1.2 MB', fileType: 'image' },
    ]);

    // Auto-lock simulation
    useEffect(() => {
        const timer = setTimeout(() => {
            // setIsLocked(true); 
        }, 300000);
        return () => clearTimeout(timer);
    }, []);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === '1234') { // Mock PIN
            setIsLocked(false);
        } else {
            alert('Incorrect PIN (Try 1234)');
        }
    };

    const filteredItems = items.filter(item => {
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        if (activeCategory === 'files') {
            return (item.type === 'folder' || item.type === 'file') && item.parentId === currentFolderId;
        }

        if (activeCategory === 'all') return item.type !== 'folder' && item.type !== 'file';
        if (activeCategory === 'favorites') return item.favorite;
        return item.type === activeCategory || item.category === activeCategory;
    });

    const selectedItem = items.find(i => i.id === selectedItemId);
    const currentFolder = items.find(i => i.id === currentFolderId);

    const getBreadcrumbs = () => {
        const crumbs = [{ id: null, title: 'Secure Files' }];
        if (currentFolderId) {
            // Simple one-level up logic for mock, real app would traverse up
            if (currentFolder) crumbs.push({ id: currentFolder.id, title: currentFolder.title });
        }
        return crumbs;
    };

    if (isLocked) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-900">
                <div className="w-full max-w-md p-8 text-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-200">
                        <Shield size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 text-gray-900">Fort Knox Vault</h1>
                    <p className="text-gray-500 mb-8">Enter your Master PIN to access secure storage.</p>

                    <form onSubmit={handleUnlock} className="space-y-6">
                        <div className="relative">
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                maxLength={4}
                                className="w-full bg-white border border-gray-200 rounded-xl py-4 px-6 text-center text-2xl tracking-[1em] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm text-gray-900 placeholder-gray-300"
                                placeholder="••••"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-blue-600/20"
                        >
                            <Unlock size={20} className="mr-2" /> Unlock Vault
                        </button>
                    </form>

                    <div className="mt-8 flex justify-center">
                        <button className="text-gray-400 hover:text-gray-600 flex items-center text-sm transition-colors font-medium">
                            <Fingerprint size={16} className="mr-2" /> Use Biometrics
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-white overflow-hidden">
            {/* 1. Sidebar (260px) */}
            <div className="w-[260px] bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search Vault"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-200/50 border-transparent focus:bg-white focus:border-blue-500 rounded-lg text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-6">
                    <div className="space-y-0.5">
                        <button onClick={() => setActiveCategory('all')} className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <Shield size={18} className="mr-3" /> All Items
                        </button>
                        <button onClick={() => setActiveCategory('favorites')} className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'favorites' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <Star size={18} className="mr-3" /> Favorites
                        </button>
                        <button onClick={() => setActiveCategory('files')} className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'files' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <Folder size={18} className="mr-3" /> Secure Files
                        </button>
                    </div>

                    <div>
                        <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categories</h3>
                        <div className="space-y-0.5">
                            <button onClick={() => setActiveCategory('login')} className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'login' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <Key size={18} className="mr-3" /> Logins
                            </button>
                            <button onClick={() => setActiveCategory('note')} className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'note' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <FileText size={18} className="mr-3" /> Secure Notes
                            </button>
                            <button onClick={() => setActiveCategory('card')} className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'card' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <CreditCard size={18} className="mr-3" /> Credit Cards
                            </button>
                            <button onClick={() => setActiveCategory('identity')} className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'identity' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <User size={18} className="mr-3" /> Identities
                            </button>
                        </div>
                    </div>

                    <div className="px-3 pt-4 border-t border-gray-200">
                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                            <div className="flex items-center text-amber-800 font-medium text-xs mb-1">
                                <AlertTriangle size={12} className="mr-1" /> Security Alert
                            </div>
                            <p className="text-[10px] text-amber-700 leading-relaxed">
                                2 passwords appeared in a recent data breach. Rotate them immediately.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200">
                    <button onClick={() => setIsLocked(true)} className="flex items-center text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">
                        <Lock size={18} className="mr-2" /> Lock Vault
                    </button>
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-gray-200">
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center">
                        {activeCategory === 'files' && currentFolderId && (
                            <button onClick={() => setCurrentFolderId(null)} className="mr-4 p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-gray-500" />
                            </button>
                        )}
                        <h1 className="text-xl font-bold text-gray-900 capitalize flex items-center">
                            {activeCategory === 'all' ? 'All Items' :
                                activeCategory === 'files' ? 'Secure Files' : activeCategory}
                        </h1>
                    </div>
                    <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                        <Plus size={20} />
                    </button>
                </div>

                {activeCategory === 'files' ? (
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Breadcrumbs */}
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                            {getBreadcrumbs().map((crumb, index) => (
                                <React.Fragment key={index}>
                                    {index > 0 && <ChevronRight size={14} />}
                                    <span
                                        className={`cursor-pointer hover:text-blue-600 ${index === getBreadcrumbs().length - 1 ? 'font-bold text-gray-900' : ''}`}
                                        onClick={() => setCurrentFolderId(crumb.id as string)}
                                    >
                                        {crumb.title}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Grid View */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        if (item.type === 'folder') {
                                            setCurrentFolderId(item.id);
                                        } else {
                                            setSelectedItemId(item.id);
                                        }
                                    }}
                                    className={`group flex flex-col items-center p-4 rounded-xl border transition-all cursor-pointer hover:bg-blue-50 hover:border-blue-200 ${selectedItemId === item.id ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-200' : 'bg-white border-transparent'
                                        }`}
                                >
                                    <div className="w-16 h-16 mb-3 flex items-center justify-center transition-transform group-hover:scale-105">
                                        {item.type === 'folder' ? (
                                            <Folder size={64} className="text-blue-400 fill-current" />
                                        ) : (
                                            <div className="relative">
                                                <File size={56} className="text-gray-300 fill-white" />
                                                <div className="absolute inset-0 flex items-center justify-center pt-2">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{item.fileType}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 text-center truncate w-full px-2 group-hover:text-blue-700">
                                        {item.title}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        {item.type === 'folder' ? 'Folder' : item.size}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItemId(item.id)}
                                className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${selectedItemId === item.id
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${item.type === 'login' ? 'bg-indigo-100 text-indigo-600' :
                                        item.type === 'card' ? 'bg-emerald-100 text-emerald-600' :
                                            item.type === 'note' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                                    }`} >
                                    {item.type === 'login' && <Key size={20} />}
                                    {item.type === 'card' && <CreditCard size={20} />}
                                    {item.type === 'note' && <FileText size={20} />}
                                    {item.type === 'identity' && <User size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
                                    <p className="text-xs text-gray-500 truncate">{item.username || item.category}</p>
                                </div>
                                {item.favorite && <Star size={14} className="text-yellow-400 fill-current ml-2" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. Detail View (Only for non-files or selected file) */}
            {activeCategory !== 'files' && (
                <div className="w-[400px] bg-gray-50 flex flex-col border-l border-gray-200">
                    {selectedItem ? (
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${selectedItem.type === 'login' ? 'bg-indigo-100 text-indigo-600' :
                                        selectedItem.type === 'card' ? 'bg-emerald-100 text-emerald-600' :
                                            selectedItem.type === 'note' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {selectedItem.type === 'login' && <Key size={32} />}
                                    {selectedItem.type === 'card' && <CreditCard size={32} />}
                                    {selectedItem.type === 'note' && <FileText size={32} />}
                                    {selectedItem.type === 'identity' && <User size={32} />}
                                </div>
                                <div className="flex space-x-2">
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                                        <Star size={20} className={selectedItem.favorite ? "text-yellow-400 fill-current" : ""} />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedItem.title}</h2>
                            <p className="text-sm text-gray-500 mb-8 flex items-center">
                                <Folder size={14} className="mr-1" /> {selectedItem.category}
                            </p>

                            <div className="space-y-6">
                                {selectedItem.username && (
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Username</label>
                                        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl group-hover:border-blue-300 transition-colors">
                                            <span className="text-sm font-medium text-gray-900">{selectedItem.username}</span>
                                            <button className="text-gray-400 hover:text-blue-600 transition-colors"><Copy size={16} /></button>
                                        </div>
                                    </div>
                                )}

                                {selectedItem.password && (
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                                        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl group-hover:border-blue-300 transition-colors">
                                            <span className="text-sm font-medium text-gray-900 font-mono">
                                                {showPassword ? selectedItem.password : '••••••••••••••••'}
                                            </span>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button className="text-gray-400 hover:text-blue-600 transition-colors"><Copy size={16} /></button>
                                            </div>
                                        </div>
                                        {selectedItem.strength && (
                                            <div className="mt-2 flex items-center space-x-2">
                                                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${selectedItem.strength === 'strong' ? 'w-full bg-green-500' :
                                                            selectedItem.strength === 'medium' ? 'w-2/3 bg-yellow-500' : 'w-1/3 bg-red-500'
                                                        }`}></div>
                                                </div>
                                                <span className={`text-xs font-medium ${selectedItem.strength === 'strong' ? 'text-green-600' :
                                                        selectedItem.strength === 'medium' ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                    {selectedItem.strength.charAt(0).toUpperCase() + selectedItem.strength.slice(1)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedItem.url && (
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Website</label>
                                        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl group-hover:border-blue-300 transition-colors">
                                            <a href={`https://${selectedItem.url}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate">
                                                {selectedItem.url}
                                            </a>
                                            <button className="text-gray-400 hover:text-blue-600 transition-colors"><Copy size={16} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 pt-8 border-t border-gray-200">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                    <History size={14} className="mr-2" /> Audit Log
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5"></div>
                                        <div>
                                            <p className="text-gray-900 font-medium">Password copied</p>
                                            <p className="text-gray-500">Just now • via Web</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5"></div>
                                        <div>
                                            <p className="text-gray-900 font-medium">Modified by Admin</p>
                                            <p className="text-gray-500">{selectedItem.lastModified} • via Web</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            <Shield size={64} className="mb-6 opacity-10" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Item Selected</h3>
                            <p className="text-sm">Select an item from the list to view its secure details and audit logs.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VaultPage;
