import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, Type, Calendar, AlignLeft, Hash, Tag, CheckSquare, DollarSign, Globe,
    Calculator, PenTool, FileText, BarChart, Paperclip, Link2, Users, Play, Mail, Phone,
    Folder, Languages, Smile, MapPin, Star, ThumbsUp, PenLine, MousePointerClick, ListTodo,
    ArrowUpRight, Layout, Search, Sparkles, X, Plus, Clock, File, Activity, RefreshCw, CheckCircle, Minus, Sliders, PlusCircle, ArrowLeft, ChevronRight, Wand2, Trash2
} from 'lucide-react';

interface ColumnMenuProps {
    onClose: () => void;
    onSelect: (type: string, label: string, options?: { id: string; label: string; color: string; }[]) => void;
}

const MENU_ITEMS = [
    { icon: <ChevronDown size={18} className="text-emerald-600" />, label: 'Dropdown', type: 'dropdown', color: 'text-emerald-600' },
    { icon: <Type size={18} className="text-blue-600" />, label: 'Text', type: 'text', color: 'text-blue-600' },
    { icon: <Calendar size={18} className="text-purple-600" />, label: 'Date', type: 'date', color: 'text-purple-600' },
    { icon: <AlignLeft size={18} className="text-blue-500" />, label: 'Text area (Long Text)', type: 'text', color: 'text-blue-500' },
    { icon: <Hash size={18} className="text-orange-500" />, label: 'Number', type: 'text', color: 'text-orange-500' },
    { icon: <Tag size={18} className="text-green-500" />, label: 'Labels', type: 'status', color: 'text-green-500' },
    { icon: <CheckSquare size={18} className="text-pink-500" />, label: 'Checkbox', type: 'text', color: 'text-pink-500' },
    { icon: <DollarSign size={18} className="text-teal-600" />, label: 'Money', type: 'text', color: 'text-teal-600' },
    { icon: <Globe size={18} className="text-indigo-500" />, label: 'Website', type: 'text', color: 'text-indigo-500' },
    { icon: <Calculator size={18} className="text-cyan-600" />, label: 'Formula', type: 'text', color: 'text-cyan-600' },
    { icon: <PenTool size={18} className="text-violet-500" />, label: 'Custom Text', type: 'text', color: 'text-violet-500' },
    { icon: <BarChart size={18} className="text-purple-500" />, label: 'Summary', type: 'text', color: 'text-purple-500' },
    { icon: <Activity size={18} className="text-fuchsia-500" />, label: 'Progress Updates', type: 'text', color: 'text-fuchsia-500' },
    { icon: <Paperclip size={18} className="text-rose-500" />, label: 'Files', type: 'text', color: 'text-rose-500' },
    { icon: <Link2 size={18} className="text-blue-400" />, label: 'Relationship', type: 'text', color: 'text-blue-400' },
    { icon: <Users size={18} className="text-indigo-600" />, label: 'People', type: 'person', color: 'text-indigo-600' },
    { icon: <Play size={18} className="text-green-600" />, label: 'Progress (Auto)', type: 'text', color: 'text-green-600' },
    { icon: <Mail size={18} className="text-red-500" />, label: 'Email', type: 'text', color: 'text-red-500' },
    { icon: <Phone size={18} className="text-orange-600" />, label: 'Phone', type: 'text', color: 'text-orange-600' },
    { icon: <Folder size={18} className="text-yellow-500" />, label: 'Categorize', type: 'text', color: 'text-yellow-500' },
    { icon: <ListTodo size={18} className="text-purple-400" />, label: 'Custom Dropdown', type: 'text', color: 'text-purple-400' },
    { icon: <Languages size={18} className="text-blue-300" />, label: 'Translation', type: 'text', color: 'text-blue-300' },
    { icon: <Smile size={18} className="text-yellow-400" />, label: 'Sentiment', type: 'text', color: 'text-yellow-400' },
    { icon: <CheckCircle size={18} className="text-emerald-500" />, label: 'Tasks', type: 'text', color: 'text-emerald-500' },
    { icon: <MapPin size={18} className="text-red-600" />, label: 'Location', type: 'text', color: 'text-red-600' },
    { icon: <Minus size={18} className="text-gray-500" />, label: 'Progress (Manual)', type: 'text', color: 'text-gray-500' },
    { icon: <Star size={18} className="text-amber-500" />, label: 'Rating', type: 'text', color: 'text-amber-500' },
    { icon: <ThumbsUp size={18} className="text-blue-500" />, label: 'Voting', type: 'text', color: 'text-blue-500' },
    { icon: <PenLine size={18} className="text-green-700" />, label: 'Signature', type: 'text', color: 'text-green-700' },
    { icon: <ArrowUpRight size={18} className="text-indigo-400" />, label: 'Rollup', type: 'text', color: 'text-indigo-400' },
    { icon: <MousePointerClick size={18} className="text-pink-600" />, label: 'Button', type: 'text', color: 'text-pink-600' },
    { icon: <ListTodo size={18} className="text-violet-600" />, label: 'Action Items', type: 'text', color: 'text-violet-600' },
];

const COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500', 'bg-slate-500'
];

interface DropdownOption {
    id: string;
    label: string;
    color: string;
}

export const ColumnMenu: React.FC<ColumnMenuProps> = ({ onClose, onSelect }) => {
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [fieldName, setFieldName] = useState('');
    const [fillMethod, setFillMethod] = useState<'manual' | 'ai'>('manual');
    const [options, setOptions] = useState<DropdownOption[]>([
        { id: '1', label: 'Option 1', color: 'bg-pink-500' },
        { id: '2', label: 'Option 2', color: 'bg-purple-500' }
    ]);
    const [newOption, setNewOption] = useState('');
    const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

    const handleSelect = (type: string, label: string) => {
        if (type === 'dropdown') {
            setSelectedType(type);
            setFieldName('');
        } else {
            onSelect(type, label);
            onClose();
        }
    };

    const handleCreate = () => {
        if (selectedType) {
            onSelect(selectedType, fieldName || 'New Field', options);
            onClose();
        }
    };

    const handleAddOption = () => {
        if (newOption.trim()) {
            const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            setOptions([...options, {
                id: crypto.randomUUID(),
                label: newOption,
                color: randomColor
            }]);
            setNewOption('');
        }
    };

    const handleUpdateOption = (id: string, updates: Partial<DropdownOption>) => {
        setOptions(options.map(opt => opt.id === id ? { ...opt, ...updates } : opt));
    };

    const handleDeleteOption = (id: string) => {
        setOptions(options.filter(opt => opt.id !== id));
    };

    const filteredItems = MENU_ITEMS.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    // Configuration View
    if (selectedType === 'dropdown') {
        return (
            <div className="h-full w-[340px] bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedType(null)}
                            className="p-1 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex items-center gap-2">
                            <ChevronDown size={18} className="text-gray-700" />
                            <h2 className="text-base font-semibold text-gray-900">Dropdown</h2>
                            <ChevronDown size={14} className="text-gray-400" />
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                    {/* Field Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                            Field name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Enter name..."
                                value={fieldName}
                                onChange={(e) => setFieldName(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
                                autoFocus
                            />
                            <Smile className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                Dropdown options <span className="text-red-500">*</span>
                            </label>
                            <button className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700">
                                <Sliders size={12} /> Manual
                            </button>
                        </div>

                        <div className="space-y-2">
                            {options.map((option) => (
                                <div key={option.id} className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg bg-white group relative">
                                    <div
                                        className={`w-3 h-3 rounded-full ${option.color} cursor-pointer hover:scale-110 transition-transform`}
                                        onClick={() => setActiveColorPicker(activeColorPicker === option.id ? null : option.id)}
                                    ></div>

                                    {/* Color Picker Popover */}
                                    {activeColorPicker === option.id && (
                                        <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-gray-200 shadow-xl rounded-lg p-2 grid grid-cols-6 gap-1 w-[160px]">
                                            {COLORS.map(color => (
                                                <div
                                                    key={color}
                                                    className={`w-5 h-5 rounded-full ${color} cursor-pointer hover:scale-110 transition-transform`}
                                                    onClick={() => {
                                                        handleUpdateOption(option.id, { color });
                                                        setActiveColorPicker(null);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <input
                                        type="text"
                                        value={option.label}
                                        onChange={(e) => handleUpdateOption(option.id, { label: e.target.value })}
                                        className="flex-1 text-sm focus:outline-none text-gray-700"
                                    />
                                    <button
                                        onClick={() => handleDeleteOption(option.id)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}

                            <div className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg bg-white group cursor-text focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
                                <PlusCircle size={16} className="text-blue-500" />
                                <input
                                    type="text"
                                    placeholder="Type or paste options"
                                    value={newOption}
                                    onChange={(e) => setNewOption(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddOption();
                                        }
                                    }}
                                    className="flex-1 text-sm focus:outline-none placeholder-gray-400"
                                />
                                <Wand2 size={16} className="text-purple-500 opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    {/* Fill Method */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500">Fill method</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setFillMethod('manual')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${fillMethod === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Manual fill
                            </button>
                            <button
                                onClick={() => setFillMethod('ai')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${fillMethod === 'ai' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Sparkles size={12} className={fillMethod === 'ai' ? 'text-purple-500' : ''} />
                                Fill with AI
                            </button>
                        </div>
                    </div>

                    {/* More Settings */}
                    <div className="pt-4 border-t border-gray-100">
                        <button className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                            <span>More settings and permissions</span>
                            <ChevronRight size={16} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
                    <button
                        onClick={() => setSelectedType(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#1e2126] hover:bg-[#2c3036] rounded-lg transition-colors shadow-sm"
                    >
                        Create
                    </button>
                </div>
            </div>
        );
    }

    // Main List View
    return (
        <div className="h-full w-[340px] bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Add Column</h2>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={15} />
                    <input
                        type="text"
                        placeholder="Search for new or existing fields"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all placeholder-gray-400"
                        autoFocus
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white px-2">
                <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    All
                </div>
                {filteredItems.length > 0 ? (
                    <div className="flex flex-col gap-0.5 pb-4">
                        {filteredItems.map((item, index) => (
                            <div
                                key={`menu-item-${index}`}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                                onClick={() => handleSelect(item.type, item.label)}
                            >
                                <div className="flex items-center justify-center w-5 h-5">
                                    {item.icon}
                                </div>
                                <span className="text-[14px] text-gray-700 group-hover:text-gray-900">{item.label}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No fields found
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow">
                    <PlusCircle size={16} />
                    <span>Add existing fields</span>
                </button>
            </div>
        </div>
    );
};
