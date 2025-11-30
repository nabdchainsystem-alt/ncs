import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Calculator } from 'lucide-react';
import { generatePaymentRequestPDF } from '../utils/generatePaymentRequestPDF';

interface PaymentRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PaymentRequestModal: React.FC<PaymentRequestModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        vendorName: '',
        department: '',
        branch: '',
        poNumber: '',
        poDate: '',
        description: '',
        totalAmount: '',
        logo: null as string | null
    });

    const [calculations, setCalculations] = useState({
        amountBeforeVat: 0,
        vatAmount: 0
    });

    useEffect(() => {
        const total = parseFloat(formData.totalAmount) || 0;
        const base = total / 1.15;
        const vat = total - base;
        setCalculations({
            amountBeforeVat: base,
            vatAmount: vat
        });
    }, [formData.totalAmount]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        generatePaymentRequestPDF({
            vendorName: formData.vendorName,
            department: formData.department,
            branch: formData.branch,
            poNumber: formData.poNumber,
            poDate: formData.poDate,
            description: formData.description,
            amountBeforeVat: calculations.amountBeforeVat,
            vatAmount: calculations.vatAmount,
            totalAmount: parseFloat(formData.totalAmount) || 0,
            logoDataUrl: formData.logo || undefined
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center space-x-2">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <FileText size={20} />
                        </div>
                        <h3 className="font-semibold text-gray-800 text-lg">New Payment Request</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                        />
                    </div>

                    {/* Vendor Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={formData.vendorName}
                            onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                            placeholder="Enter vendor name..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Department */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                placeholder="e.g. Supply Chain"
                            />
                        </div>
                        {/* Branch */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                placeholder="e.g. Main Branch"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* PO Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={formData.poNumber}
                                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                                placeholder="PO-12345"
                            />
                        </div>
                        {/* PO Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PO Date</label>
                            <input
                                type="date"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={formData.poDate}
                                onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter payment details..."
                        />
                    </div>

                    {/* Amount Section */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex items-center space-x-2 text-gray-700 font-medium border-b border-gray-200 pb-2 mb-2">
                            <Calculator size={16} />
                            <span>Calculations</span>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Total Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs font-medium">SAR</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={formData.totalAmount}
                                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Amount Before VAT</label>
                                <div className="text-sm font-semibold text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-lg">
                                    {calculations.amountBeforeVat.toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">VAT (15%)</label>
                                <div className="text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg">
                                    {calculations.vatAmount.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center shadow-sm"
                        >
                            <Download size={16} className="mr-2" />
                            Generate PDF
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentRequestModal;
