import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, Type, Calendar, AlignLeft, Hash, Tag, CheckSquare, DollarSign, Globe,
    Calculator, PenTool, FileText, BarChart, Paperclip, Link2, Users, Play, Mail, Phone,
    Folder, Languages, Smile, MapPin, Star, ThumbsUp, PenLine, MousePointerClick, ListTodo,
    ArrowUpRight, Layout, Search, Sparkles, X, Plus, Clock, File, Activity, RefreshCw, CheckCircle, Minus, Sliders, PlusCircle, ArrowLeft, ChevronRight, Wand2, Trash2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { ConfirmModal } from '../../../ui/ConfirmModal';
import { useQuickAction } from '../../../hooks/useQuickAction';

interface ColumnMenuProps {
    onClose: () => void;
    onSelect: (type: string, label: string, options?: { id: string; label: string; color: string; }[], currency?: string, config?: { targetPath: string; targetName: string; }) => void;
    darkMode?: boolean;
}

const MENU_ITEMS = [
    { icon: <ChevronDown size={18} className="text-emerald-600" />, label: 'Dropdown', type: 'dropdown', color: 'text-emerald-600', description: 'Select one option from a list of options' },
    { icon: <Type size={18} className="text-blue-600" />, label: 'Text', type: 'text', color: 'text-blue-600', description: 'Add a short text like a title or name' },
    { icon: <Calendar size={18} className="text-purple-600" />, label: 'Date', type: 'date', color: 'text-purple-600', description: 'Add a date or date range' },
    { icon: <AlignLeft size={18} className="text-blue-500" />, label: 'Text area (Long Text)', type: 'long_text', color: 'text-blue-500', description: 'Add long text like a description or notes' },
    { icon: <Hash size={18} className="text-orange-500" />, label: 'Number', type: 'number', color: 'text-orange-500', description: 'Add a number, currency, or percentage' },
    { icon: <Tag size={18} className="text-green-500" />, label: 'Labels', type: 'status', color: 'text-green-500', description: 'Visual status indicator for your tasks' },
    { icon: <CheckSquare size={18} className="text-pink-500" />, label: 'Checkbox', type: 'checkbox', color: 'text-pink-500', description: 'A simple checkbox for yes/no or done/not done' },
    { icon: <DollarSign size={18} className="text-teal-600" />, label: 'Money', type: 'money', color: 'text-teal-600', description: 'Track costs, prices, or budgets' },
    { icon: <Globe size={18} className="text-indigo-500" />, label: 'Website', type: 'website', color: 'text-indigo-500', description: 'Add a link to a website' },
    { icon: <Calculator size={18} className="text-cyan-600" />, label: 'Formula', type: 'text', color: 'text-cyan-600', description: 'Calculate values based on other columns' },
    { icon: <PenTool size={18} className="text-violet-500" />, label: 'Custom Text', type: 'text', color: 'text-violet-500', description: 'Add custom formatted text' },
    { icon: <BarChart size={18} className="text-purple-500" />, label: 'Summary', type: 'text', color: 'text-purple-500', description: 'Summarize data from other columns' },
    { icon: <Activity size={18} className="text-fuchsia-500" />, label: 'Progress Updates', type: 'text', color: 'text-fuchsia-500', description: 'Track progress over time' },
    { icon: <Paperclip size={18} className="text-rose-500" />, label: 'Files', type: 'text', color: 'text-rose-500', description: 'Upload files and attachments' },
    { icon: <Link2 size={18} className="text-blue-400" />, label: 'Relationship', type: 'text', color: 'text-blue-400', description: 'Link items across different boards' },
    { icon: <Users size={18} className="text-indigo-600" />, label: 'People', type: 'person', color: 'text-indigo-600', description: 'Assign people to tasks' },
    { icon: <Play size={18} className="text-green-600" />, label: 'Progress (Auto)', type: 'text', color: 'text-green-600', description: 'Automatically track progress based on subitems' },
    { icon: <Mail size={18} className="text-red-500" />, label: 'Email', type: 'email', color: 'text-red-500', description: 'Add an email address' },
    { icon: <Phone size={18} className="text-orange-600" />, label: 'Phone', type: 'phone', color: 'text-orange-600', description: 'Add a phone number' },
    { icon: <Folder size={18} className="text-yellow-500" />, label: 'Categorize', type: 'text', color: 'text-yellow-500', description: 'Group items by category' },
    { icon: <ListTodo size={18} className="text-purple-400" />, label: 'Custom Dropdown', type: 'text', color: 'text-purple-400', description: 'Create a custom dropdown list' },
    { icon: <Languages size={18} className="text-blue-300" />, label: 'Translation', type: 'text', color: 'text-blue-300', description: 'Translate text to other languages' },
    { icon: <Smile size={18} className="text-yellow-400" />, label: 'Sentiment', type: 'text', color: 'text-yellow-400', description: 'Analyze sentiment of text' },
    { icon: <CheckCircle size={18} className="text-emerald-500" />, label: 'Tasks', type: 'text', color: 'text-emerald-500', description: 'Track tasks and subtasks' },
    { icon: <MapPin size={18} className="text-red-600" />, label: 'Location', type: 'location', color: 'text-red-600', description: 'Add a location or address' },
    { icon: <Minus size={18} className="text-gray-500" />, label: 'Progress (Manual)', type: 'progress_manual', color: 'text-gray-500', description: 'Manually track progress with a bar' },
    { icon: <Star size={18} className="text-amber-500" />, label: 'Rating', type: 'rating', color: 'text-amber-500', description: 'Rate items with stars' },
    { icon: <ThumbsUp size={18} className="text-blue-500" />, label: 'Voting', type: 'text', color: 'text-blue-500', description: 'Allow users to vote on items' },
    { icon: <PenLine size={18} className="text-green-700" />, label: 'Signature', type: 'text', color: 'text-green-700', description: 'Add a signature field' },
    { icon: <ArrowUpRight size={18} className="text-indigo-400" />, label: 'Rollup', type: 'text', color: 'text-indigo-400', description: 'Aggregate data from related items' },
    { icon: <MousePointerClick size={18} className="text-pink-600" />, label: 'Button', type: 'button', color: 'text-pink-600', description: 'Trigger an action with a button' },
    { icon: <ListTodo size={18} className="text-violet-600" />, label: 'Action Items', type: 'text', color: 'text-violet-600', description: 'Track actionable items' },
    { icon: <Link2 size={18} className="text-blue-500" />, label: 'Connection', type: 'connection', color: 'text-blue-500', description: 'Link tasks to a specific page' },
];

const COLORS = [
    'bg-gradient-to-r from-red-400 to-red-600', 'bg-gradient-to-r from-orange-400 to-orange-600', 'bg-gradient-to-r from-amber-400 to-amber-600', 'bg-gradient-to-r from-yellow-400 to-yellow-600',
    'bg-gradient-to-r from-lime-400 to-lime-600', 'bg-gradient-to-r from-green-400 to-green-600', 'bg-gradient-to-r from-emerald-400 to-emerald-600', 'bg-gradient-to-r from-teal-400 to-teal-600',
    'bg-gradient-to-r from-cyan-400 to-cyan-600', 'bg-gradient-to-r from-sky-400 to-sky-600', 'bg-gradient-to-r from-blue-400 to-blue-600', 'bg-gradient-to-r from-indigo-400 to-indigo-600',
    'bg-gradient-to-r from-violet-400 to-violet-600', 'bg-gradient-to-r from-purple-400 to-purple-600', 'bg-gradient-to-r from-fuchsia-400 to-fuchsia-600', 'bg-gradient-to-r from-pink-400 to-pink-600',
    'bg-gradient-to-r from-rose-400 to-rose-600', 'bg-gradient-to-r from-slate-400 to-slate-600'
];

interface DropdownOption {
    id: string;
    label: string;
    color: string;
}

const ColumnPreview: React.FC<{ type: string; darkMode?: boolean }> = ({ type, darkMode }) => {
    switch (type) {
        case 'dropdown':
            return (
                <div className="w-full flex flex-col gap-2">
                    <div className="h-8 w-full bg-emerald-100 rounded flex items-center justify-center text-emerald-700 text-xs font-medium">Done</div>
                    <div className="h-8 w-full bg-amber-100 rounded flex items-center justify-center text-amber-700 text-xs font-medium">In Progress</div>
                    <div className="h-8 w-full bg-red-100 rounded flex items-center justify-center text-red-700 text-xs font-medium">Stuck</div>
                </div>
            );
        case 'status':
            return (
                <div className="w-full flex flex-col gap-2">
                    <div className="h-8 w-full bg-green-500 rounded flex items-center justify-center text-white text-xs font-medium">Done</div>
                    <div className="h-8 w-full bg-orange-400 rounded flex items-center justify-center text-white text-xs font-medium">Working on it</div>
                    <div className="h-8 w-full bg-gray-400 rounded flex items-center justify-center text-white text-xs font-medium">To Do</div>
                </div>
            );
        case 'checkbox':
            return (
                <div className="w-full flex flex-col gap-2 items-center justify-center py-2">
                    <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white"><CheckCircle size={16} /></div>
                    <div className={`w-6 h-6 rounded border-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
                </div>
            );
        case 'rating':
            return (
                <div className="w-full flex items-center justify-center gap-1 py-4">
                    <Star size={20} className="text-amber-400 fill-amber-400" />
                    <Star size={20} className="text-amber-400 fill-amber-400" />
                    <Star size={20} className="text-amber-400 fill-amber-400" />
                    <Star size={20} className={`${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                    <Star size={20} className={`${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                </div>
            );
        case 'progress_manual':
            return (
                <div className="w-full flex flex-col gap-2 py-2">
                    <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div className="h-full bg-green-500 w-[75%]"></div>
                    </div>
                    <div className={`text-center text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>75%</div>
                </div>
            );
        default:
            return (
                <div className={`w-full h-20 rounded border flex items-center justify-center ${darkMode ? 'bg-white/5 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                    <Type size={24} />
                </div>
            );
    }
};


export const ColumnMenu: React.FC<ColumnMenuProps> = ({ onClose, onSelect, darkMode }) => {

    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [fieldName, setFieldName] = useState('');
    const [fillMethod, setFillMethod] = useState<'manual' | 'ai'>('manual');
    const [currency, setCurrency] = useState('USD');
    const [options, setOptions] = useState<DropdownOption[]>([
        { id: '1', label: 'Option 1', color: 'bg-gradient-to-r from-pink-400 to-pink-600' },
        { id: '2', label: 'Option 2', color: 'bg-gradient-to-r from-purple-400 to-purple-600' }
    ]);
    const [newOption, setNewOption] = useState('');
    const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
    const [hoveredItem, setHoveredItem] = useState<{ type: string, description: string, top: number } | null>(null);
    const [optionToDelete, setOptionToDelete] = useState<string | null>(null);

    const { ref: menuRef, setIsActive } = useQuickAction<HTMLDivElement>({
        onCancel: onClose,
        initialActive: true
    });

    // Pause cancelling when the delete confirmation is open
    useEffect(() => {
        setIsActive(!optionToDelete);
    }, [optionToDelete, setIsActive]);

    const handleSelect = (type: string, label: string) => {


        setSelectedType(type);
        setFieldName('');
    };

    const handleCreate = () => {
        if (selectedType) {
            onSelect(selectedType, fieldName || 'New Field', options, currency);
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



    const handleDeleteOptionClick = (id: string) => {
        setOptionToDelete(id);
    };

    const confirmDeleteOption = () => {
        if (optionToDelete) {
            setOptions(options.filter(opt => opt.id !== optionToDelete));
            setOptionToDelete(null);
        }
    };

    const filteredItems = MENU_ITEMS.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    // Configuration View
    if (selectedType) {
        const isDropdown = selectedType === 'dropdown';
        const item = MENU_ITEMS.find(i => i.type === selectedType) || { label: 'Column' };
        const title = item.label;

        return (
            <div className={`h-full w-[340px] shadow-2xl border-l flex flex-col animate-in slide-in-from-right duration-300 ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-200'}`} ref={menuRef}>
                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedType(null)}
                            className={`p-1 rounded-md transition-colors ${darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex items-center gap-2">
                            <ChevronDown size={18} className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                            <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{title}</h2>
                            <ChevronDown size={14} className="text-gray-400" />
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-1.5 rounded-md transition-colors ${darkMode ? 'hover:bg-white/5 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                    {/* Field Name */}
                    <div className="space-y-2">
                        <label className={`text-xs font-medium flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Field name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Enter name..."
                                value={fieldName}
                                onChange={(e) => setFieldName(e.target.value)}
                                className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreate();
                                    }
                                }}
                            />
                            <Smile className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                    </div>

                    {/* Currency - Only for Money */}
                    {selectedType === 'money' && (
                        <div className="space-y-2">
                            <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Currency</label>
                            <div className="relative">
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className={`w-full pl-3 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}
                                >
                                    <option value="USD">USD - US Dollar ($)</option>
                                    <option value="EUR">EUR - Euro (€)</option>
                                    <option value="GBP">GBP - British Pound (£)</option>
                                    <option value="JPY">JPY - Japanese Yen (¥)</option>
                                    <option value="SAR">SAR - Saudi Riyal (SAR)</option>
                                    <option value="AED">AED - UAE Dirham (AED)</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                    )}

                    {/* Options - Only for Dropdown */}
                    {isDropdown && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className={`text-xs font-medium flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Dropdown options <span className="text-red-500">*</span>
                                </label>
                                <button className={`text-xs flex items-center gap-1 hover:text-gray-700 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <Sliders size={12} /> Manual
                                </button>
                            </div>

                            <div className="space-y-2">
                                {options.map((option) => (
                                    <div key={option.id} className={`flex items-center gap-3 px-3 py-2 border rounded-lg group relative ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <div
                                            className={`w-3 h-3 rounded-full ${option.color} cursor-pointer hover:scale-110 transition-transform`}
                                            onClick={() => setActiveColorPicker(activeColorPicker === option.id ? null : option.id)}
                                        ></div>

                                        {/* Color Picker Popover */}
                                        {activeColorPicker === option.id && (
                                            <div className={`absolute top-full left-0 mt-1 z-10 border shadow-xl rounded-lg p-2 grid grid-cols-6 gap-1 w-[160px] ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-200'}`}>
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
                                            className={`flex-1 text-sm focus:outline-none ${darkMode ? 'bg-transparent text-gray-200' : 'text-gray-700'}`}
                                        />
                                        <button
                                            onClick={() => handleDeleteOptionClick(option.id)}
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                <div className={`flex items-center gap-3 px-3 py-2 border rounded-lg group cursor-text focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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
                                        className={`flex-1 text-sm focus:outline-none ${darkMode ? 'bg-transparent text-gray-200 placeholder-gray-500' : 'placeholder-gray-400'}`}
                                    />
                                    <Wand2 size={16} className="text-purple-500 opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fill Method */}
                    <div className="space-y-2">
                        <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fill method</label>
                        <div className={`flex p-1 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <button
                                onClick={() => setFillMethod('manual')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${fillMethod === 'manual' ? (darkMode ? 'bg-[#1a1d24] text-gray-200 shadow-sm' : 'bg-white text-gray-900 shadow-sm') : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}
                            >
                                Manual fill
                            </button>
                            <button
                                onClick={() => setFillMethod('ai')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${fillMethod === 'ai' ? (darkMode ? 'bg-[#1a1d24] text-gray-200 shadow-sm' : 'bg-white text-gray-900 shadow-sm') : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}
                            >
                                <Sparkles size={12} className={fillMethod === 'ai' ? 'text-purple-500' : ''} />
                                Fill with AI
                            </button>
                        </div>
                    </div>

                    {/* More Settings */}
                    <div className={`pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <button className={`w-full flex items-center justify-between py-2 text-sm font-medium rounded-lg px-2 -mx-2 transition-colors ${darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}`}>
                            <span>More settings and permissions</span>
                            <ChevronRight size={16} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-4 border-t flex items-center justify-end gap-3 ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-100'}`}>
                    <button
                        onClick={() => setSelectedType(null)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${darkMode ? 'text-gray-300 hover:bg-white/5 border-gray-700' : 'text-gray-700 hover:bg-gray-100 border-gray-200'}`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-[#1e2126] hover:bg-[#2c3036]'}`}
                    >
                        Create
                    </button>
                </div>

                {optionToDelete && (
                    <ConfirmModal
                        isOpen={!!optionToDelete}
                        title="Delete Option"
                        message="Are you sure you want to delete this option? This action cannot be undone."
                        onConfirm={confirmDeleteOption}
                        onClose={() => setOptionToDelete(null)}
                        confirmText="Delete"
                        variant="danger"
                    />
                )}


            </div>
        );
    }

    // Main List View
    return (
        <div className={`h-full w-[340px] shadow-2xl border-l flex flex-col animate-in slide-in-from-right duration-300 relative ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-200'}`} ref={menuRef}>
            {/* Tooltip Portal */}
            {hoveredItem && createPortal(
                <div
                    className={`fixed z-[9999] w-[280px] p-4 rounded-xl shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-[#1e2126] text-white'}`}
                    style={{
                        top: hoveredItem.top - 60,
                        left: menuRef.current ? menuRef.current.getBoundingClientRect().left - 290 : 0,
                    }}
                >
                    <div className={`rounded-lg p-3 mb-3 ${darkMode ? 'bg-[#1a1d24]' : 'bg-white'}`}>
                        <ColumnPreview type={hoveredItem.type} darkMode={darkMode} />
                    </div>
                    <p className={`text-sm leading-relaxed text-center ${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>
                        {hoveredItem.description}
                    </p>
                </div>,
                document.body
            )}

            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Add Column</h2>
                <button
                    onClick={onClose}
                    className={`p-1.5 rounded-md transition-colors ${darkMode ? 'hover:bg-white/5 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
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
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-blue-500' : 'bg-white border-gray-200 focus:border-blue-500 placeholder-gray-400'}`}
                        autoFocus
                    />
                </div>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar px-2 ${darkMode ? 'bg-[#1a1d24]' : 'bg-white'}`}>
                <div className={`px-3 py-2 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    All
                </div>
                {filteredItems.length > 0 ? (
                    <div className="flex flex-col gap-0.5 pb-4">
                        {filteredItems.map((item, index) => (
                            <div
                                key={`menu-item-${index}`}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                                onClick={() => handleSelect(item.type, item.label)}
                                onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredItem({ type: item.type, description: item.description || '', top: rect.top });
                                }}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                                <div className="flex items-center justify-center w-5 h-5">
                                    {item.icon}
                                </div>
                                <span className={`text-[14px] group-hover:text-gray-900 ${darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700'}`}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={`p-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        No fields found
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
                <button className={`w-full flex items-center justify-center gap-2 py-2.5 border rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow ${darkMode ? 'bg-[#1a1d24] border-gray-700 hover:border-blue-500 hover:text-blue-400 text-gray-400' : 'bg-white border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600'}`}>
                    <PlusCircle size={16} />
                    <span>Add existing fields</span>
                </button>
            </div>
        </div>
    );
};
