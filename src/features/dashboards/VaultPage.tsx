import React, { useState, useEffect } from 'react';
import {
    Shield, Lock, Unlock, Search, Plus, Key, FileText, CreditCard,
    User, Folder, Star, MoreHorizontal, Copy, Eye, EyeOff,
    AlertTriangle, CheckCircle2, Fingerprint, History, File, Image, ChevronRight, ArrowLeft,
    LayoutGrid, List as ListIcon, HardDrive, Cloud, Clock, Command
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
            <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-900 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px]"></div>

                <div className="w-full max-w-md p-10 text-center relative z-10 bg-white backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100">
                    <div className="w-24 h-24 bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-gray-200">
                        <Shield size={48} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 text-gray-900 tracking-tight">Vault</h1>
                    <p className="text-gray-500 mb-10 font-medium">Enter Master PIN to unlock</p>

                    <form onSubmit={handleUnlock} className="space-y-8">
                        <div className="flex justify-center space-x-4">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-gray-900 scale-110' : 'bg-gray-200'}`}></div>
                            ))}
                        </div>

                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            maxLength={4}
                            className="absolute opacity-0 w-full h-full inset-0 cursor-default"
                            autoFocus
                        />

                        <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setPin(prev => (prev + num).slice(0, 4))}
                                    className="w-16 h-16 rounded-full bg-white hover:bg-gray-50 shadow-sm border border-gray-100 text-2xl font-medium text-gray-900 transition-all active:scale-95 flex items-center justify-center"
                                >
                                    {num}
                                </button>
                            ))}
                            <div className="col-start-2">
                                <button
                                    type="button"
                                    onClick={() => setPin(prev => (prev + '0').slice(0, 4))}
                                    className="w-16 h-16 rounded-full bg-white hover:bg-gray-50 shadow-sm border border-gray-100 text-2xl font-medium text-gray-900 transition-all active:scale-95 flex items-center justify-center"
                                >
                                    0
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-10 flex justify-center">
                        <button className="text-gray-600 hover:text-gray-900 flex items-center text-sm transition-colors font-semibold bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-full">
                            <Fingerprint size={16} className="mr-2" /> Use Face ID
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-white overflow-hidden font-sans text-gray-900">
            {/* 1. Sidebar (260px) */}
            <div className="w-[260px] bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-4 pb-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 focus:border-black focus:ring-0 rounded-xl text-sm transition-all placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar mt-2">
                    <div className="space-y-1">
                        <button onClick={() => setActiveCategory('all')} className={`w-full flex items-center px-3 py-2 rounded-lg text-[15px] font-medium transition-colors ${activeCategory === 'all' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                            <HardDrive size={18} className={`mr-3 ${activeCategory === 'all' ? 'text-white' : 'text-gray-400'}`} /> All Items
                        </button>
                        <button onClick={() => setActiveCategory('favorites')} className={`w-full flex items-center px-3 py-2 rounded-lg text-[15px] font-medium transition-colors ${activeCategory === 'favorites' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                            <Star size={18} className={`mr-3 ${activeCategory === 'favorites' ? 'text-white' : 'text-gray-400'}`} /> Favorites
                        </button>
                        <button onClick={() => setActiveCategory('files')} className={`w-full flex items-center px-3 py-2 rounded-lg text-[15px] font-medium transition-colors ${activeCategory === 'files' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                            <Cloud size={18} className={`mr-3 ${activeCategory === 'files' ? 'text-white' : 'text-gray-400'}`} /> Secure Files
                        </button>
                    </div>

                    <div>
                        <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Library</h3>
                        <div className="space-y-1">
                            <button onClick={() => setActiveCategory('login')} className={`w-full flex items-center px-3 py-2 rounded-lg text-[15px] font-medium transition-colors ${activeCategory === 'login' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                                <Key size={18} className={`mr-3 ${activeCategory === 'login' ? 'text-white' : 'text-gray-400'}`} /> Logins
                            </button>
                            <button onClick={() => setActiveCategory('note')} className={`w-full flex items-center px-3 py-2 rounded-lg text-[15px] font-medium transition-colors ${activeCategory === 'note' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                                <FileText size={18} className={`mr-3 ${activeCategory === 'note' ? 'text-white' : 'text-gray-400'}`} /> Notes
                            </button>
                            <button onClick={() => setActiveCategory('card')} className={`w-full flex items-center px-3 py-2 rounded-lg text-[15px] font-medium transition-colors ${activeCategory === 'card' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                                <CreditCard size={18} className={`mr-3 ${activeCategory === 'card' ? 'text-white' : 'text-gray-400'}`} /> Cards
                            </button>
                            <button onClick={() => setActiveCategory('identity')} className={`w-full flex items-center px-3 py-2 rounded-lg text-[15px] font-medium transition-colors ${activeCategory === 'identity' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                                <User size={18} className={`mr-3 ${activeCategory === 'identity' ? 'text-white' : 'text-gray-400'}`} /> Identities
                            </button>
                        </div>
                    </div>

                    <div className="px-3 pt-4 border-t border-gray-200">
                        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                            <div className="flex items-center text-gray-900 font-semibold text-xs mb-1">
                                <Shield size={12} className="mr-1.5 text-black" /> Vault Status
                            </div>
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                Encrypted with AES-256. Last synced 2 mins ago.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200">
                    <button onClick={() => setIsLocked(true)} className="flex items-center text-gray-500 hover:text-black text-sm font-medium transition-colors">
                        <Lock size={18} className="mr-2" /> Lock Vault
                    </button>
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative z-10 shadow-2xl rounded-l-3xl overflow-hidden ml-[-1px] border-l border-gray-200">
                {/* Header */}
                <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 bg-white sticky top-0 z-20">
                    <div className="flex items-center">
                        {activeCategory === 'files' && currentFolderId && (
                            <button onClick={() => setCurrentFolderId(null)} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-gray-500" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 capitalize flex items-center">
                                {activeCategory === 'all' ? 'All Items' :
                                    activeCategory === 'files' ? 'Secure Files' : activeCategory}
                            </h1>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">{filteredItems.length} items</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <ListIcon size={16} />
                            </button>
                        </div>
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        <button className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {activeCategory === 'files' && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6 px-1">
                            {/* Breadcrumbs removed as per request */}
                            <span
                                className="font-bold text-gray-900"
                            >
                                {currentFolder ? currentFolder.title : 'Secure Files'}
                            </span>
                        </div>
                    )}

                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
                                    className={`group flex flex-col items-center p-4 rounded-2xl transition-all cursor-pointer ${selectedItemId === item.id
                                        ? 'bg-gray-100 ring-2 ring-black ring-offset-2'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="w-20 h-20 mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 filter drop-shadow-sm">
                                        {item.type === 'folder' ? (
                                            <Folder size={80} className="text-gray-400 fill-gray-200" strokeWidth={1} />
                                        ) : item.type === 'login' ? (
                                            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                                                <Key size={32} className="text-white" />
                                            </div>
                                        ) : item.type === 'card' ? (
                                            <div className="w-16 h-12 bg-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                                                <CreditCard size={24} className="text-white" />
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <File size={64} className="text-gray-300 fill-white" strokeWidth={1} />
                                                <div className="absolute inset-0 flex items-center justify-center pt-2">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{item.fileType || item.type}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[13px] font-medium text-center truncate w-full px-1 ${selectedItemId === item.id ? 'text-black' : 'text-gray-700'}`}>
                                        {item.title}
                                    </span>
                                    <span className="text-[11px] text-gray-400 mt-0.5">
                                        {item.type === 'folder' ? 'Folder' : item.size || item.category}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-1">
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
                                    className={`flex items-center p-3 rounded-xl transition-all cursor-pointer ${selectedItemId === item.id
                                        ? 'bg-gray-100'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="mr-4 text-gray-400">
                                        {item.type === 'folder' ? <Folder size={20} className="text-gray-400 fill-gray-200" /> :
                                            item.type === 'login' ? <Key size={20} /> :
                                                item.type === 'card' ? <CreditCard size={20} /> :
                                                    <File size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm font-medium truncate ${selectedItemId === item.id ? 'text-black' : 'text-gray-900'}`}>{item.title}</h3>
                                    </div>
                                    <div className="text-xs text-gray-400 w-32 text-right">{item.lastModified}</div>
                                    <div className="text-xs text-gray-400 w-24 text-right">{item.size || '--'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Detail Inspector Panel (Floating) */}
            {selectedItem && (
                <div className="w-[350px] bg-white border-l border-gray-200 flex flex-col animate-in slide-in-from-right-10 duration-300 z-30 shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.05)]">
                    <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0">
                        <span className="text-sm font-bold text-gray-900">Info</span>
                        <button
                            onClick={() => setSelectedItemId(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <Command size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-24 h-24 mb-4 flex items-center justify-center filter drop-shadow-md">
                                {selectedItem.type === 'login' ? (
                                    <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                                        <Key size={40} className="text-white" />
                                    </div>
                                ) : selectedItem.type === 'card' ? (
                                    <div className="w-20 h-14 bg-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                                        <CreditCard size={32} className="text-white" />
                                    </div>
                                ) : (
                                    <File size={80} className="text-gray-300 fill-white" strokeWidth={1} />
                                )}
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 text-center mb-1">{selectedItem.title}</h2>
                            <p className="text-sm text-gray-500">{selectedItem.type === 'file' ? selectedItem.fileType?.toUpperCase() : selectedItem.category}</p>
                        </div>

                        <div className="space-y-6">
                            {selectedItem.username && (
                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Username</label>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl group-hover:border-black transition-colors">
                                        <span className="text-sm font-medium text-gray-900 select-all">{selectedItem.username}</span>
                                        <button className="text-gray-400 hover:text-black transition-colors"><Copy size={14} /></button>
                                    </div>
                                </div>
                            )}

                            {selectedItem.password && (
                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl group-hover:border-black transition-colors">
                                        <span className="text-sm font-medium text-gray-900 font-mono">
                                            {showPassword ? selectedItem.password : '••••••••••••••••'}
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            <button className="text-gray-400 hover:text-black transition-colors"><Copy size={14} /></button>
                                        </div>
                                    </div>
                                    {selectedItem.strength && (
                                        <div className="mt-2 flex items-center space-x-2">
                                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${selectedItem.strength === 'strong' ? 'w-full bg-black' :
                                                    selectedItem.strength === 'medium' ? 'w-2/3 bg-gray-500' : 'w-1/3 bg-gray-300'
                                                    }`}></div>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase ${selectedItem.strength === 'strong' ? 'text-black' :
                                                selectedItem.strength === 'medium' ? 'text-gray-600' : 'text-gray-400'
                                                }`}>
                                                {selectedItem.strength}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-6 border-t border-gray-100 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Kind</span>
                                    <span className="text-gray-900 font-medium capitalize">{selectedItem.type}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Size</span>
                                    <span className="text-gray-900 font-medium">{selectedItem.size || '--'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Modified</span>
                                    <span className="text-gray-900 font-medium">{selectedItem.lastModified}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VaultPage;
