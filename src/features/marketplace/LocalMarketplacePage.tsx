import React, { useState } from 'react';
import { Search, Star, Filter, MapPin, ChevronDown, ArrowUpRight, TrendingUp, Users, ShoppingBag, AlertCircle, DollarSign, ChevronLeft, ChevronRight, Package, PlusCircle, LayoutGrid } from 'lucide-react';
import { useToast } from '../../ui/Toast';
import { VENDORS_DATA, Vendor } from './vendorsData';
import { CATEGORY_GROUPS, getCategoryGroup } from './categoryMapping';

const INITIAL_SUPPLIERS = VENDORS_DATA;

const HERO_SLIDES = [
    {
        id: 1,
        title: "Summer Construction Sale",
        subtitle: "Up to 30% off on raw materials",
        image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
        color: "from-orange-500 to-red-500"
    },
    {
        id: 2,
        title: "Premium Office Furniture",
        subtitle: "Transform your workspace today",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        color: "from-blue-500 to-indigo-500"
    },
    {
        id: 3,
        title: "Eco-Friendly Supplies",
        subtitle: "Sustainable solutions for your business",
        image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
        color: "from-green-500 to-emerald-500"
    }
];

const MOCK_MATERIALS = [
    { id: 1, name: 'Portland Cement', price: '$12/bag', supplier: 'ConstructCo', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=300&q=80' },
    { id: 2, name: 'Steel Rebar', price: '$450/ton', supplier: 'MetalWorks', image: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=300&q=80' },
    { id: 3, name: 'Office Paper A4', price: '$45/box', supplier: 'GreenLeaf', image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=300&q=80' },
    { id: 4, name: 'Ergonomic Chair', price: '$250/unit', supplier: 'OfficeComfort', image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=300&q=80' },
    { id: 5, name: 'Safety Helmets', price: '$25/unit', supplier: 'SafeGear', image: 'https://images.unsplash.com/photo-1584646369054-1372485973b1?auto=format&fit=crop&w=300&q=80' },
    { id: 6, name: 'Copper Wire', price: '$8/m', supplier: 'TechSolutions', image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=300&q=80' },
];

import { SupplierDetails } from './SupplierDetails';

const LocalMarketplacePage: React.FC = () => {
    const { showToast } = useToast();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'Industrial & Manufacturing': true,
        'Construction & Materials': true,
        'Office & Business Services': true,
        'Other': true
    });
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [areCategoriesExpanded, setAreCategoriesExpanded] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const ITEMS_PER_PAGE = 12;

    // Dynamically group categories present in the data
    const groupedCategories = React.useMemo(() => {
        const groups: Record<string, string[]> = {};
        const uniqueCategories = Array.from(new Set(VENDORS_DATA.map(v => v.category).filter(Boolean)));

        uniqueCategories.forEach(cat => {
            // Filter based on category search query
            if (categorySearchQuery && !cat.toLowerCase().includes(categorySearchQuery.toLowerCase())) {
                return;
            }

            const groupName = getCategoryGroup(cat);
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(cat);
        });

        // Sort categories within groups
        Object.keys(groups).forEach(key => {
            groups[key].sort();
        });

        return groups;
    }, [categorySearchQuery]);

    // Auto-expand groups when searching
    React.useEffect(() => {
        if (categorySearchQuery) {
            const newExpanded: Record<string, boolean> = {};
            Object.keys(groupedCategories).forEach(group => {
                newExpanded[group] = true;
            });
            setExpandedGroups(newExpanded);
        }
    }, [categorySearchQuery, groupedCategories]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesCategory = selectedCategory === 'All' || supplier.category === selectedCategory;
        const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (supplier.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (selectedVendor) {
        return <SupplierDetails vendor={selectedVendor} onBack={() => setSelectedVendor(null)} />;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50/50 overflow-hidden font-sans text-gray-800">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-20 shadow-sm">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Local Marketplace</h1>
                    <div className="h-6 w-[1px] bg-gray-200 hidden md:block"></div>
                    <div className="hidden md:flex items-center text-gray-500 text-sm hover:text-gray-900 cursor-pointer transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:border-gray-300">
                        <MapPin size={16} className="mr-2 text-clickup-purple" />
                        <span className="font-medium">Riyadh, SA</span>
                        <ChevronDown size={14} className="ml-2 opacity-50" />
                    </div>
                </div>

                <div className="flex items-center space-x-4 flex-1 max-w-xl mx-4 md:mx-8">
                    <div className="relative flex-1 group">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-clickup-purple transition-colors" />
                        <input
                            type="text"
                            placeholder="Search for suppliers, services, or products..."
                            className="w-full bg-gray-100 border border-transparent focus:bg-white focus:border-clickup-purple/50 focus:ring-4 focus:ring-clickup-purple/10 rounded-xl pl-10 pr-4 py-2.5 text-sm transition-all outline-none placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-3">

                    <button className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-all active:scale-95">
                        <Filter size={16} />
                        <span className="hidden md:inline">Filters</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Filters */}
                <div className="w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto hidden lg:block shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categories</h3>
                        </div>

                        {/* Category Search */}
                        <div className="relative mb-4">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter categories..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-clickup-purple focus:ring-1 focus:ring-clickup-purple/20 transition-all"
                                value={categorySearchQuery}
                                onChange={(e) => setCategorySearchQuery(e.target.value)}
                            />
                        </div>

                        {/* All Category */}
                        <div className={`flex items-center justify-between mb-2 px-3 py-2 rounded-lg transition-all ${selectedCategory === 'All' ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                            <div
                                className={`flex-1 cursor-pointer text-sm font-semibold ${selectedCategory === 'All' ? 'text-clickup-purple' : 'text-gray-700'}`}
                                onClick={() => setSelectedCategory('All')}
                            >
                                <span>All Categories</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newState = !areCategoriesExpanded;
                                    setAreCategoriesExpanded(newState);
                                    const newExpandedGroups: Record<string, boolean> = {};
                                    Object.keys(groupedCategories).forEach(key => {
                                        newExpandedGroups[key] = newState;
                                    });
                                    setExpandedGroups(newExpandedGroups);
                                }}
                                className="p-1 -mr-1 hover:bg-gray-200 rounded-md text-gray-400 transition-colors flex items-center justify-center"
                            >
                                <ChevronDown
                                    size={14}
                                    className={`transition-transform duration-200 ${areCategoriesExpanded ? 'rotate-180' : ''}`}
                                />
                            </button>
                        </div>

                        {/* Grouped Categories */}
                        <div className="space-y-1">
                            {Object.entries(groupedCategories).map(([group, categories]) => (
                                <div key={group} className="mb-1">
                                    <div
                                        className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                        onClick={() => toggleGroup(group)}
                                    >
                                        <span>{group}</span>
                                        <ChevronDown
                                            size={14}
                                            className={`text-gray-400 transition-transform duration-200 ${expandedGroups[group] ? 'rotate-180' : ''}`}
                                        />
                                    </div>

                                    {expandedGroups[group] && (
                                        <div className="ml-2 pl-2 border-l border-gray-100 mt-1 space-y-0.5">
                                            {categories.map(cat => (
                                                <div
                                                    key={cat}
                                                    className={`flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer text-sm transition-all ${selectedCategory === cat
                                                        ? 'bg-purple-50 text-clickup-purple font-medium'
                                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                    onClick={() => setSelectedCategory(cat)}
                                                >
                                                    <span className="truncate">{cat}</span>
                                                    {selectedCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-clickup-purple shrink-0 ml-2"></div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Rating</h3>
                        <div className="space-y-2">
                            {[4, 3, 2, 1].map(stars => (
                                <div key={stars} className="flex items-center group cursor-pointer px-2 py-1 rounded hover:bg-gray-50">
                                    <div className="flex text-yellow-400 mr-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={14} fill={i < stars ? "currentColor" : "none"} className={i < stars ? "" : "text-gray-200"} />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-500 group-hover:text-gray-700">& Up</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Price Range</h3>
                        <div className="flex gap-2">
                            {['$', '$$', '$$$'].map(price => (
                                <button key={price} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:border-clickup-purple hover:text-clickup-purple transition-colors">
                                    {price}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50">

                    {/* KPI & Charts Section */}
                    <div className="mb-8 space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Spend</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">$124.5k</h3>
                                    <div className="flex items-center mt-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                        <TrendingUp size={12} className="mr-1" />
                                        +12.5%
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                    <DollarSign size={24} />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Suppliers</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">48</h3>
                                    <div className="flex items-center mt-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                        <TrendingUp size={12} className="mr-1" />
                                        +4 new
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                    <Users size={24} />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Open Orders</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">15</h3>
                                    <div className="flex items-center mt-2 text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full w-fit">
                                        <AlertCircle size={12} className="mr-1" />
                                        3 pending
                                    </div>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                                    <ShoppingBag size={24} />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Rating</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">4.8</h3>
                                    <div className="flex items-center mt-2 text-xs font-medium text-gray-500">
                                        Based on 1.2k reviews
                                    </div>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                                    <Star size={24} fill="currentColor" />
                                </div>
                            </div>
                        </div>


                    </div>

                    {/* Hero Banner */}
                    <div className="mb-8 relative rounded-2xl overflow-hidden h-40 shadow-sm">
                        <img
                            src="https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1200&q=80"
                            alt="Marketplace Banner"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent flex flex-col justify-center px-8 text-white">
                            <h2 className="text-2xl font-bold mb-2">Find Trusted Local Suppliers</h2>
                            <p className="text-sm opacity-90 max-w-md">Connect with top-rated vendors in your area for all your business needs.</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800">
                            {selectedCategory === 'All' ? 'All Suppliers' : selectedCategory}
                            <span className="ml-2 text-sm font-normal text-gray-400">({filteredSuppliers.length} results)</span>
                        </h2>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>Sort by:</span>
                            <button className="font-medium text-gray-800 flex items-center hover:text-clickup-purple">
                                Recommended <ChevronDown size={14} className="ml-1" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
                        {filteredSuppliers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(supplier => (
                            <div
                                key={supplier.id}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
                                onClick={() => setSelectedVendor(supplier)}
                            >
                                <div className="relative h-48 bg-gray-100 overflow-hidden">
                                    <img
                                        src={supplier.image}
                                        alt={supplier.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700 shadow-sm">
                                        {supplier.category}
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-clickup-purple transition-colors line-clamp-1">
                                            {supplier.name}
                                        </h3>
                                        <div className="flex items-center bg-yellow-50 px-1.5 py-0.5 rounded text-yellow-700 border border-yellow-100">
                                            <Star size={10} fill="currentColor" className="mr-1" />
                                            <span className="text-xs font-bold">{supplier.rating}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1 leading-relaxed">
                                        {supplier.description}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pt-4 border-t border-gray-50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400">Min Order</span>
                                            <span className="font-medium text-gray-700">{supplier.minOrder}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400">Reviews</span>
                                            <span className="font-medium text-gray-700">{supplier.reviews}</span>
                                        </div>
                                    </div>

                                    <button
                                        className="w-full bg-gray-900 hover:bg-clickup-purple text-white py-2.5 rounded-xl text-sm font-medium shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center group-hover:bg-clickup-purple"
                                        onClick={() => showToast(`Request sent to ${supplier.name}`, 'success')}
                                    >
                                        <span>Connect Supplier</span>
                                        <ArrowUpRight size={14} className="ml-2 opacity-70" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {filteredSuppliers.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-center space-x-2 mb-12">
                            <button
                                className={`p-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft size={18} />
                            </button>

                            {[...Array(Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE))].map((_, i) => (
                                <button
                                    key={i}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-clickup-purple text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                className={`p-2 rounded-lg border ${currentPage === Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE) ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE)))}
                                disabled={currentPage === Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE)}
                            >
                                <ChevronRight size={18} />
                            </button>

                            <div className="flex items-center ml-4 space-x-2 border-l border-gray-200 pl-4">
                                <span className="text-sm text-gray-500">Go to</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE)}
                                    className="w-12 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-clickup-purple transition-colors text-center"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = parseInt(e.currentTarget.value);
                                            if (!isNaN(val) && val >= 1 && val <= Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE)) {
                                                setCurrentPage(val);
                                                e.currentTarget.value = '';
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Hero Section (Carousel) */}
                    <div className="mb-8 relative group rounded-2xl overflow-hidden h-48 md:h-64 shadow-md">
                        <div
                            className="absolute inset-0 flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {HERO_SLIDES.map((slide) => (
                                <div key={slide.id} className="w-full h-full flex-shrink-0 relative">
                                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                                    <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} opacity-80 mix-blend-multiply`}></div>
                                    <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 text-white">
                                        <h2 className="text-3xl md:text-4xl font-bold mb-2">{slide.title}</h2>
                                        <p className="text-lg md:text-xl opacity-90">{slide.subtitle}</p>
                                        <button className="mt-6 bg-white text-gray-900 px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors w-fit">
                                            Explore Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronRight size={24} />
                        </button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                            {HERO_SLIDES.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-all ${currentSlide === index ? 'bg-white w-6' : 'bg-white/50'}`}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* Materials Grid */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                <Package size={20} className="mr-2 text-clickup-purple" />
                                Featured Materials
                            </h2>
                            <button className="text-sm text-clickup-purple hover:underline font-medium">View All</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {MOCK_MATERIALS.map((material) => (
                                <div key={material.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer">
                                    <div className="h-24 bg-gray-100 relative overflow-hidden">
                                        <img src={material.image} alt={material.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-bold text-gray-800 truncate" title={material.name}>{material.name}</h3>
                                        <p className="text-xs text-gray-500 truncate">{material.supplier}</p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-xs font-bold text-clickup-purple bg-purple-50 px-1.5 py-0.5 rounded">{material.price}</span>
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-clickup-purple hover:text-white transition-colors">
                                                <PlusCircle size={12} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocalMarketplacePage;
