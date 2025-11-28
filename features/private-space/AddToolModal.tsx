import React, { useState } from 'react';
import { X, Search, ChevronRight } from 'lucide-react';
import { TOOLS_DATA, ToolCategory, ToolItem } from './toolsData';

interface AddToolModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTool: (tool: ToolItem) => void;
}

const AddToolModal: React.FC<AddToolModalProps> = ({ isOpen, onClose, onSelectTool }) => {
    const [activeCategory, setActiveCategory] = useState<string>(TOOLS_DATA[0].id);
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const currentCategory = TOOLS_DATA.find(c => c.id === activeCategory);

    const filteredTools = currentCategory?.items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const basicTools = filteredTools?.filter(t => !t.isAdvanced);
    const advancedTools = filteredTools?.filter(t => t.isAdvanced);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-[90vw] h-[85vh] max-w-6xl rounded-2xl shadow-2xl flex overflow-hidden border border-gray-100">

                {/* Sidebar */}
                <div className="w-72 bg-gray-50/50 border-r border-gray-200 flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">Add Tool</h2>
                        <p className="text-sm text-gray-500 mt-1">Select a tool to add to your space</p>
                    </div>

                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search tools..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
                        {TOOLS_DATA.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeCategory === category.id
                                        ? 'bg-white text-black shadow-sm ring-1 ring-gray-200'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-md ${activeCategory === category.id ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    <category.icon size={16} />
                                </div>
                                <span className="flex-1 text-left">{category.name}</span>
                                {activeCategory === category.id && <ChevronRight size={14} className="text-gray-400" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="h-16 border-b border-gray-100 flex items-center justify-between px-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-black text-white rounded-lg">
                                {currentCategory && <currentCategory.icon size={20} />}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{currentCategory?.name}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                        {basicTools && basicTools.length > 0 && (
                            <div className="mb-10">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    Basic Tools
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {basicTools.map((tool) => (
                                        <ToolCard key={tool.id} tool={tool} onClick={() => onSelectTool(tool)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {advancedTools && advancedTools.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                    Advanced Tools
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {advancedTools.map((tool) => (
                                        <ToolCard key={tool.id} tool={tool} onClick={() => onSelectTool(tool)} isAdvanced />
                                    ))}
                                </div>
                            </div>
                        )}

                        {(!basicTools?.length && !advancedTools?.length) && (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <Search size={48} className="mb-4 opacity-20" />
                                <p>No tools found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToolCard: React.FC<{ tool: ToolItem; onClick: () => void; isAdvanced?: boolean }> = ({ tool, onClick, isAdvanced }) => (
    <button
        onClick={onClick}
        className={`
      group relative flex flex-col items-start p-5 rounded-xl border text-left transition-all duration-300
      hover:shadow-lg hover:-translate-y-1
      ${isAdvanced
                ? 'bg-gradient-to-br from-white to-purple-50/30 border-purple-100 hover:border-purple-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }
    `}
    >
        <div className={`
      mb-4 p-3 rounded-xl shadow-sm transition-transform group-hover:scale-110
      ${isAdvanced ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-700'}
    `}>
            <tool.icon size={24} strokeWidth={1.5} />
        </div>
        <h5 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
            {tool.name}
        </h5>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            {tool.description}
        </p>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 rounded-xl ring-2 ring-black/0 group-hover:ring-black/5 transition-all" />
    </button>
);

export default AddToolModal;
