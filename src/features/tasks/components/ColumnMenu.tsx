import React, { useState } from 'react';
import {
    ChevronDown, Type, Calendar, AlignLeft, Hash, Tag, CheckSquare, DollarSign, Globe,
    Calculator, PenTool, FileText, BarChart, Paperclip, Link2, Users, Play, Mail, Phone,
    Folder, Languages, Smile, MapPin, Star, ThumbsUp, PenLine, MousePointerClick, ListTodo,
    ArrowUpRight, Layout, Search, Sparkles, X, Plus, Clock, File
} from 'lucide-react';

interface ColumnMenuProps {
    onClose: () => void;
    onSelect: (type: string, label: string) => void;
}

const ESSENTIAL_FIELDS = [
    { icon: <Layout size={16} className="text-green-500" />, label: 'Status', type: 'status', color: 'bg-green-100' },
    { icon: <ChevronDown size={16} className="text-emerald-500" />, label: 'Dropdown', type: 'text', color: 'bg-emerald-100' }, // Using text for now as generic
    { icon: <Type size={16} className="text-yellow-500" />, label: 'Text', type: 'text', color: 'bg-yellow-100' },
    { icon: <Calendar size={16} className="text-purple-500" />, label: 'Date', type: 'date', color: 'bg-purple-100' },
    { icon: <Users size={16} className="text-blue-500" />, label: 'People', type: 'person', color: 'bg-blue-100' },
    { icon: <Hash size={16} className="text-orange-500" />, label: 'Numbers', type: 'text', color: 'bg-orange-100' },
];

const USEFUL_FIELDS = [
    { icon: <Paperclip size={16} className="text-red-500" />, label: 'Files', type: 'text', color: 'bg-red-100' },
    { icon: <Clock size={16} className="text-indigo-500" />, label: 'Timeline', type: 'date', color: 'bg-indigo-100' }, // Mapping to date for now
    { icon: <Link2 size={16} className="text-pink-500" />, label: 'Connect...', type: 'text', color: 'bg-pink-100' },
    { icon: <CheckSquare size={16} className="text-orange-400" />, label: 'Checkbox', type: 'text', color: 'bg-orange-100' }, // Mapping to text/checkbox
    { icon: <FileText size={16} className="text-red-400" />, label: 'Doc', type: 'text', color: 'bg-red-100' },
    { icon: <Calculator size={16} className="text-teal-500" />, label: 'Formula', type: 'text', color: 'bg-teal-100' },
];

export const ColumnMenu: React.FC<ColumnMenuProps> = ({ onClose, onSelect }) => {
    const [search, setSearch] = useState('');

    const handleSelect = (type: string, label: string, keepOpen: boolean = false) => {
        onSelect(type, label);
        if (!keepOpen) {
            onClose();
        }
    };

    const filterFields = (fields: typeof ESSENTIAL_FIELDS) => {
        if (!search) return fields;
        return fields.filter(item => item.label.toLowerCase().includes(search.toLowerCase()));
    };

    const filteredEssentials = filterFields(ESSENTIAL_FIELDS);
    const filteredUseful = filterFields(USEFUL_FIELDS);

    return (
        <div className="w-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[600px] animate-in fade-in zoom-in-95 duration-200">
            {/* Search */}
            <div className="p-3 border-b border-gray-100 bg-white">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search or describe your column"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-blue-500 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-gray-400"
                        autoFocus
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-4">
                {filteredEssentials.length > 0 && (
                    <div className="mb-6">
                        <div className="text-xs font-medium text-gray-500 mb-3 px-1">
                            Essentials
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {filteredEssentials.map((item, index) => (
                                <div
                                    key={`essential-${index}`}
                                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group cursor-pointer transition-colors"
                                    onClick={() => handleSelect(item.type, item.label)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center ${item.color}`}>
                                            {item.icon}
                                        </div>
                                        <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(item.type, item.label, true);
                                        }}
                                        className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Add and keep open"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {filteredUseful.length > 0 && (
                    <div>
                        <div className="text-xs font-medium text-gray-500 mb-3 px-1">
                            Super useful
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {filteredUseful.map((item, index) => (
                                <div
                                    key={`useful-${index}`}
                                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group cursor-pointer transition-colors"
                                    onClick={() => handleSelect(item.type, item.label)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center ${item.color}`}>
                                            {item.icon}
                                        </div>
                                        <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(item.type, item.label, true);
                                        }}
                                        className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Add and keep open"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-white text-center">
                <button className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                    More columns
                </button>
            </div>
        </div>
    );
};
