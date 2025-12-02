import React, { useState } from 'react';
import { Vendor } from './vendorsData';
import { MOCK_QUOTATIONS, Quotation } from './quotationsData';
import { ArrowLeft, Star, MapPin, Phone, Mail, Globe, MessageSquare, FileText, Clock, CheckCircle, XCircle, AlertCircle, ShoppingBag, PlusCircle, ChevronRight, ShieldCheck, TrendingUp, Users, Building2, Award, Zap, Calendar, ExternalLink, ArrowUpRight, Search, Filter } from 'lucide-react';

interface SupplierDetailsProps {
    vendor: Vendor;
    onBack: () => void;
}

export const SupplierDetails: React.FC<SupplierDetailsProps> = ({ vendor, onBack }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'quotations' | 'products'>('overview');

    // Filter quotations for this vendor
    const quotations = MOCK_QUOTATIONS.filter(q => q.vendorId === vendor.id || q.vendorId === '1');

    const getStatusColor = (status: Quotation['status']) => {
        switch (status) {
            case 'Received': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Processing': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Rejected': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F8F9FC] overflow-hidden font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">

            {/* Top Navigation Bar - Floating & Glass */}
            <div className="absolute top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center pointer-events-none">
                <button
                    onClick={onBack}
                    className="pointer-events-auto flex items-center px-4 py-2 bg-white/80 backdrop-blur-md border border-white/40 rounded-full text-slate-700 font-medium shadow-lg shadow-black/5 hover:bg-white hover:scale-105 transition-all duration-300 group"
                >
                    <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <div className="flex gap-3 pointer-events-auto">
                    <button className="p-2.5 bg-white/80 backdrop-blur-md border border-white/40 rounded-full text-slate-700 shadow-lg shadow-black/5 hover:bg-white hover:scale-110 transition-all duration-300">
                        <Globe size={20} />
                    </button>
                    <button className="p-2.5 bg-white/80 backdrop-blur-md border border-white/40 rounded-full text-slate-700 shadow-lg shadow-black/5 hover:bg-white hover:scale-110 transition-all duration-300">
                        <MessageSquare size={20} />
                    </button>
                </div>
            </div>

            {/* Hero Section - Cinematic & Immersive */}
            <div className="relative h-80 w-full shrink-0 group overflow-hidden">
                <div className="absolute inset-0 bg-slate-900">
                    <img
                        src={vendor.coverImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80'}
                        alt="Cover"
                        className="w-full h-full object-cover opacity-80 mix-blend-overlay transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FC] via-transparent to-black/30"></div>
                </div>
            </div>

            {/* Main Content - The "Floating Citadel" Layout */}
            <div className="flex-1 overflow-y-auto relative z-10 -mt-32 px-4 md:px-8 pb-12" style={{ zoom: '85%' }}>
                <div className="w-full max-w-[98%] mx-auto">

                    {/* 1. The Profile Card - Floating, High Contrast, Readable */}
                    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50 p-8 mb-10 relative overflow-hidden backdrop-blur-xl">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                        <div className="relative flex flex-col md:flex-row gap-8 items-end md:items-center">
                            {/* Avatar with Status Ring */}
                            <div className="relative -mt-20 md:-mt-0 shrink-0">
                                <div className="w-40 h-40 rounded-[2rem] bg-white p-2 shadow-xl shadow-slate-200 ring-1 ring-slate-100">
                                    <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover rounded-[1.5rem]" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white px-3 py-1 rounded-full border-[4px] border-white shadow-lg flex items-center gap-1">
                                    <ShieldCheck size={14} fill="currentColor" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Verified</span>
                                </div>
                            </div>

                            {/* Info Block */}
                            <div className="flex-1 min-w-0 pt-2 md:pt-0">
                                <div className="flex items-center gap-4 mb-2">
                                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{vendor.name}</h1>
                                    <div className="flex gap-2">
                                        {vendor.status === 'Active' && (
                                            <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-slate-900/20">
                                                Premium
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-lg text-slate-500 font-medium mb-6 max-w-3xl leading-relaxed">
                                    {vendor.description || 'Premier supplier delivering excellence in every transaction. We provide top-tier materials and equipment to enterprise clients, ensuring quality and reliability.'}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                                    <div className="flex items-center px-4 py-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                                        <Building2 size={16} className="mr-2 text-indigo-500" />
                                        {vendor.category}
                                    </div>
                                    <div className="flex items-center px-4 py-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                                        <MapPin size={16} className="mr-2 text-rose-500" />
                                        {vendor.address || 'Riyadh, KSA'}
                                    </div>
                                    <div className="flex items-center px-4 py-2 rounded-xl bg-slate-50 text-slate-900 border border-slate-100">
                                        <Star size={16} className="mr-2 text-amber-400 fill-amber-400" />
                                        <span className="font-bold">{vendor.rating}</span>
                                        <span className="text-slate-400 ml-1">({vendor.reviews})</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Big & Bold */}
                            <div className="flex gap-4 w-full md:w-auto">
                                <button className="flex-1 md:flex-none items-center justify-center px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow-md active:scale-95">
                                    Message
                                </button>
                                <button className="flex-1 md:flex-none flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-95">
                                    <Zap size={20} className="mr-2 fill-indigo-200 text-indigo-200" />
                                    Request Quote
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 2. The Grid Layout - Bento Style */}
                    <div className="grid grid-cols-12 gap-8">

                        {/* Left Column: Navigation & Content */}
                        <div className="col-span-12 lg:col-span-8 space-y-8">

                            {/* Sticky Tabs */}
                            <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg shadow-slate-200/50 p-1.5 flex gap-1">
                                {['overview', 'quotations', 'products'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${activeTab === tab
                                            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Total Spend', value: '$45.2k', trend: '+12%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                            { label: 'Active Orders', value: '2', sub: 'Processing', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
                                            { label: 'Avg. Delivery', value: '2 Days', sub: '98% On-time', icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50' },
                                            { label: 'Response', value: '< 1hr', sub: 'Very Fast', icon: MessageSquare, color: 'text-rose-600', bg: 'bg-rose-50' },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                                        <stat.icon size={20} />
                                                    </div>
                                                    {stat.trend && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{stat.trend}</span>}
                                                </div>
                                                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Company Details - Bento Card */}
                                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-20 -mt-20"></div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-6 relative z-10">Company Overview</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                                            <div className="prose prose-slate">
                                                <p className="text-slate-600 leading-relaxed">
                                                    {vendor.description || `${vendor.name} is a premier supplier in the ${vendor.category} sector. We specialize in providing high-quality materials and equipment to large-scale enterprises. Our commitment to quality and speed makes us the preferred partner for over 500 companies.`}
                                                </p>
                                                <button className="mt-4 text-indigo-600 font-bold flex items-center hover:underline">
                                                    Read full profile <ArrowUpRight size={16} className="ml-1" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { label: 'Est. Year', value: '2021' },
                                                    { label: 'Employees', value: '50-100' },
                                                    { label: 'Min Order', value: vendor.minOrder },
                                                    { label: 'Payment', value: 'Net 30' },
                                                ].map((item, i) => (
                                                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
                                                        <div className="text-lg font-bold text-slate-900">{item.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Featured Products */}
                                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                            <h3 className="text-xl font-bold text-slate-900">Featured Products</h3>
                                            <button onClick={() => setActiveTab('products')} className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
                                                View All Products
                                            </button>
                                        </div>
                                        <div className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="group cursor-pointer">
                                                    <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden mb-4 relative">
                                                        <img
                                                            src={`https://images.unsplash.com/photo-${i === 1 ? '1581091226825-a6a2a5aee158' : i === 2 ? '1535813547-99c456a41d4a' : '1586075010923-2dd4570fb338'}?auto=format&fit=crop&w=600&q=80`}
                                                            alt="Product"
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                                        <button className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                                            <PlusCircle size={20} className="text-slate-900" />
                                                        </button>
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">Industrial Grade Item {i}</h4>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm text-slate-500">In Stock</p>
                                                        <p className="font-bold text-slate-900">$120.00</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'quotations' && (
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-slate-900">Quotation History</h3>
                                        <div className="flex gap-2">
                                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"><Search size={18} /></button>
                                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"><Filter size={18} /></button>
                                        </div>
                                    </div>
                                    {quotations.length > 0 ? (
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Reference</th>
                                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {quotations.map((quote) => (
                                                    <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                                                        <td className="px-8 py-5 text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{quote.reference}</td>
                                                        <td className="px-8 py-5 text-sm text-slate-500">{quote.date}</td>
                                                        <td className="px-8 py-5 text-sm font-bold text-slate-900">{quote.totalAmount}</td>
                                                        <td className="px-8 py-5">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(quote.status)}`}>
                                                                {quote.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-colors ml-auto" />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-center py-24">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <FileText size={32} className="text-slate-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">No quotations found</h3>
                                            <p className="text-slate-500 mt-2">Start by requesting a quote above.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'products' && (
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                        <ShoppingBag size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Product Catalog</h3>
                                    <p className="text-lg text-slate-500 max-w-md mx-auto">
                                        We are currently synchronizing the full product catalog for {vendor.name}. Please check back later.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Sidebar */}
                        <div className="col-span-12 lg:col-span-4 space-y-8">

                            {/* Account Manager - The "Concierge" Card */}
                            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20 group-hover:opacity-30 transition-opacity duration-700"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl font-bold border border-white/10">
                                            {vendor.contactPerson ? vendor.contactPerson.charAt(0) : 'S'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Account Manager</p>
                                            <p className="text-xl font-bold">{vendor.contactPerson || 'Sales Team'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-4 text-slate-300">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                                <Phone size={18} />
                                            </div>
                                            <span className="font-medium">{vendor.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-300">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                                <Mail size={18} />
                                            </div>
                                            <span className="font-medium truncate">{vendor.email || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <button className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                                        Contact Directly
                                    </button>
                                </div>
                            </div>

                            {/* Verification Status */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Compliance & Trust</h4>
                                <div className="space-y-4">
                                    {[
                                        { name: 'Commercial Registration', id: vendor.cr || 'Verified', icon: FileText },
                                        { name: 'VAT Certificate', id: vendor.vat || 'Verified', icon: FileText },
                                        { name: 'ISO 9001:2015', id: 'Active', icon: Award },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                                                    <item.icon size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{item.id}</p>
                                                </div>
                                            </div>
                                            <CheckCircle size={16} className="text-emerald-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Similar Suppliers */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Similar Suppliers</h4>
                                <div className="space-y-2">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors group">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                                <img src={`https://images.unsplash.com/photo-${i === 1 ? '1504307651254-35680f356dfd' : '1497366216548-37526070297c'}?auto=format&fit=crop&w=100&q=80`} alt="Supplier" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">Competitor {i}</p>
                                                <div className="flex items-center text-xs text-slate-500 mt-1">
                                                    <Star size={12} className="text-amber-400 fill-amber-400 mr-1" />
                                                    <span className="font-medium">4.{8 - i}</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
