import React, { useState, useEffect } from 'react';
import { X, Plus, Layers, Target, Bell, Hash, ArrowRight } from 'lucide-react';

interface Option {
    id: string;
    name: string;
}

interface GTDExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'task' | 'goal' | 'reminder' | 'discussion' | null;
    itemText: string;
    existingOptions: Option[];
    onConfirm: (action: 'new' | 'existing', targetId?: string, newName?: string) => void;
}

export const GTDExportModal: React.FC<GTDExportModalProps> = ({
    isOpen,
    onClose,
    type,
    itemText,
    existingOptions,
    onConfirm
}) => {
    const [mode, setMode] = useState<'new' | 'existing'>('new');
    const [newName, setNewName] = useState('');
    const [selectedOptionId, setSelectedOptionId] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setNewName(itemText);
            setMode('new');
            setSelectedOptionId(existingOptions[0]?.id || '');
        }
    }, [isOpen, itemText, existingOptions]);

    if (!isOpen || !type) return null;

    const getIcon = () => {
        switch (type) {
            case 'task': return <Layers size={24} className="text-blue-500" />;
            case 'goal': return <Target size={24} className="text-red-500" />;
            case 'reminder': return <Bell size={24} className="text-amber-500" />;
            case 'discussion': return <Hash size={24} className="text-purple-500" />;
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'task': return 'Send to Task Board';
            case 'goal': return 'Create Goal';
            case 'reminder': return 'Set Reminder';
            case 'discussion': return 'Start Discussion';
        }
    };

    const getLabels = () => {
        switch (type) {
            case 'task': return { new: 'New Group', existing: 'Add to Existing Group', namePlaceholder: 'Group Name' };
            case 'goal': return { new: 'New Goal', existing: 'Add as Sub-goal to', namePlaceholder: 'Goal Title' };
            case 'reminder': return { new: 'New List', existing: 'Add to List', namePlaceholder: 'List Name' };
            case 'discussion': return { new: 'New Channel', existing: 'Post in Channel', namePlaceholder: 'Channel Name' };
        }
    };

    const labels = getLabels();

    const handleConfirm = () => {
        if (mode === 'new' && !newName.trim()) return;
        if (mode === 'existing' && !selectedOptionId) return;

        onConfirm(mode, mode === 'existing' ? selectedOptionId : undefined, mode === 'new' ? newName : undefined);
    };

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-stone-100">
                            {getIcon()}
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-xl text-stone-900">{getTitle()}</h3>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Select Destination</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Item Preview */}
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 italic font-serif text-sm">
                        "{itemText}"
                    </div>

                    {/* Mode Selection */}
                    <div className="grid grid-cols-2 gap-3 p-1 bg-stone-100 rounded-xl">
                        <button
                            onClick={() => setMode('new')}
                            className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'new' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            {labels.new}
                        </button>
                        <button
                            onClick={() => setMode('existing')}
                            className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'existing' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            {labels.existing}
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        {mode === 'new' ? (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">
                                    Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder={labels.namePlaceholder}
                                        className="w-full pl-4 pr-4 py-3 bg-white border border-stone-200 focus:border-stone-900 focus:ring-0 rounded-xl text-stone-900 placeholder-stone-300 transition-all font-medium"
                                        autoFocus
                                    />
                                    <Plus size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400" />
                                </div>
                                <p className="text-[10px] text-stone-400 px-1">
                                    Using item text as default. You can rename the container.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">
                                    Select Existing
                                </label>
                                <select
                                    value={selectedOptionId}
                                    onChange={(e) => setSelectedOptionId(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-stone-900 focus:ring-0 rounded-xl text-stone-900 cursor-pointer appearance-none"
                                >
                                    {existingOptions.length === 0 ? <option disabled>No options available</option> : null}
                                    {existingOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                        <span>Confirm Action</span>
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
