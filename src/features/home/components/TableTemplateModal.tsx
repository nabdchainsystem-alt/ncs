import React, { useState } from 'react';
import { X, Table, FileText, Check } from 'lucide-react';

interface TableTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (template: any) => void;
    templates: any[];
}

const TableTemplateModal: React.FC<TableTemplateModalProps> = ({ isOpen, onClose, onSelectTemplate, templates }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Table size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Add Table from Template</h2>
                            <p className="text-xs text-gray-500">Select a pre-configured table to get started instantly.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template: any) => (
                            <div
                                key={template.id}
                                onClick={() => {
                                    onSelectTemplate(template);
                                    onClose();
                                }}
                                className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
                            >
                                {/* Image */}
                                <div className="h-32 w-full bg-gray-100 relative overflow-hidden">
                                    {template.image ? (
                                        <img
                                            src={template.image}
                                            alt={template.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Table size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                                            {template.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {template.title}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                                        {template.description}
                                    </p>

                                    {/* Columns Preview */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {template.columns.slice(0, 4).map((col: any) => (
                                            <span key={col.id} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">
                                                {col.name}
                                            </span>
                                        ))}
                                        {template.columns.length > 4 && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded border border-gray-200">
                                                +{template.columns.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TableTemplateModal;
