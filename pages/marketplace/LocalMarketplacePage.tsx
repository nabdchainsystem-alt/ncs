import React, { useState } from 'react';
import { Search, Star, Filter, MapPin, ChevronDown, SlidersHorizontal, ArrowUpRight, TrendingUp, Users, ShoppingBag, AlertCircle, PieChart, BarChart3, DollarSign, ChevronLeft, ChevronRight, Package, PlusCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';


// Mock Data for Suppliers
const INITIAL_SUPPLIERS = [
    {
        id: '1',
        name: 'TechSolutions Inc.',
        category: 'Electronics',
        rating: 4.8,
        reviews: 1240,
        description: 'Premium supplier of office electronics, monitors, and peripherals.',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80',
        priceRange: '$$',
        deliveryTime: '1-2 days',
        minOrder: '$500'
    },
    {
        id: '2',
        name: 'GreenLeaf Office Supplies',
        category: 'Office Supplies',
        rating: 4.5,
        reviews: 856,
        description: 'Eco-friendly paper, pens, and general office consumables.',
        image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=300&q=80',
        priceRange: '$',
        deliveryTime: 'Same day',
        minOrder: '$100'
    },
    {
        id: '3',
        name: 'BuildRight Construction',
        category: 'Construction',
        rating: 4.9,
        reviews: 2100,
        description: 'Heavy machinery rentals and construction material supply.',
        image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=300&q=80',
        priceRange: '$$$',
        deliveryTime: '3-5 days',
        minOrder: '$5000'
    },
    {
        id: '4',
        name: 'CleanMaster Services',
        category: 'Services',
        rating: 4.2,
        reviews: 430,
        description: 'Professional cleaning services for corporate offices.',
        image: 'https://images.unsplash.com/photo-1581578731117-104f8a746956?auto=format&fit=crop&w=300&q=80',
        priceRange: '$$',
        deliveryTime: 'Scheduled',
        minOrder: 'Contract'
    },
    {
        id: '5',
        name: 'Global Logistics Co.',
        category: 'Logistics',
        rating: 4.6,
        reviews: 920,
        description: 'International shipping and freight forwarding solutions.',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80',
        priceRange: '$$$',
        deliveryTime: 'Varies',
        minOrder: '$1000'
    },
    {
        id: '6',
        name: 'SecureGuard Systems',
        category: 'Security',
        rating: 4.7,
        reviews: 650,
        description: 'Security cameras, access control systems, and monitoring.',
        image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=300&q=80',
        priceRange: '$$$',
        deliveryTime: '1 week',
        minOrder: '$2000'
    },
    {
        id: '7',
        name: 'FreshFoods Catering',
        category: 'Food & Beverage',
        rating: 4.4,
        reviews: 320,
        description: 'Corporate catering and pantry stocking services.',
        image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=300&q=80',
        priceRange: '$$',
        deliveryTime: 'Daily',
        minOrder: '$200'
    },
    {
        id: '8',
        name: 'PrintPro Solutions',
        category: 'Printing',
        rating: 4.3,
        reviews: 510,
        description: 'High-volume printing, marketing materials, and signage.',
        image: 'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=300&q=80',
        priceRange: '$',
        deliveryTime: '2-3 days',
        minOrder: '$50'
    },
    {
        id: '9',
        name: 'RapidCourier',
        category: 'Logistics',
        rating: 4.1,
        reviews: 215,
        description: 'Local courier services for documents and small packages.',
        image: 'https://images.unsplash.com/photo-1566576912902-48f5d9307657?auto=format&fit=crop&w=300&q=80',
        priceRange: '$',
        deliveryTime: '2-4 hours',
        minOrder: '$20'
    },
    {
        id: '10',
        name: 'OfficeComfort Furniture',
        category: 'Office Supplies',
        rating: 4.7,
        reviews: 1100,
        description: 'Ergonomic chairs, desks, and office furniture solutions.',
        image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=300&q=80',
        priceRange: '$$$',
        deliveryTime: '1 week',
        minOrder: '$500'
    },
    {
        id: '11',
        name: 'SparkleClean Janitorial',
        category: 'Services',
        rating: 4.0,
        reviews: 150,
        description: 'Daily janitorial services for small to medium businesses.',
        image: 'https://images.unsplash.com/photo-1527515545081-5db817172677?auto=format&fit=crop&w=300&q=80',
        priceRange: '$',
        deliveryTime: 'Daily',
        minOrder: '$100'
    },
    {
        id: '12',
        name: 'EventMasters',
        category: 'Services',
        rating: 4.9,
        reviews: 890,
        description: 'Full-service corporate event planning and management.',
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=300&q=80',
        priceRange: '$$$$',
        deliveryTime: 'Scheduled',
        minOrder: '$5000'
    },
    {
        id: '13',
        name: 'SafeHands Security',
        category: 'Security',
        rating: 4.5,
        reviews: 420,
        description: 'Manned guarding and security patrol services.',
        image: 'https://images.unsplash.com/photo-1590133605136-51a069095816?auto=format&fit=crop&w=300&q=80',
        priceRange: '$$',
        deliveryTime: 'Immediate',
        minOrder: 'Contract'
    },
    {
        id: '14',
        name: 'GourmetDelights',
        category: 'Food & Beverage',
        rating: 4.8,
        reviews: 560,
        description: 'Premium snacks, coffee, and beverages for office pantries.',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
        priceRange: '$$',
        deliveryTime: 'Weekly',
        minOrder: '$150'
    },
    {
        id: '15',
        name: 'ConstructCo Materials',
        category: 'Construction',
        rating: 4.3,
        reviews: 780,
        description: 'Bulk supply of cement, steel, and other raw materials.',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80',
        priceRange: '$$',
        deliveryTime: '2-3 days',
        minOrder: '$2000'
    }
];

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

const CATEGORIES = ['All', 'Electronics', 'Office Supplies', 'Construction', 'Services', 'Logistics', 'Security', 'Food & Beverage', 'Printing'];

const LocalMarketplace: React.FC = () => {
    const { showToast } = useToast();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);


    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesCategory = selectedCategory === 'All' || supplier.category === selectedCategory;
        const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            supplier.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });



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
                <div className="w-64 bg-white border-r border-gray-200 p-6 overflow-y-auto hidden lg:block shrink-0">
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Categories</h3>
                        <ul className="space-y-1">
                            {CATEGORIES.map(cat => (
                                <li
                                    key={cat}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${selectedCategory === cat
                                        ? 'bg-purple-50 text-clickup-purple font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    <span>{cat}</span>
                                    {selectedCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-clickup-purple"></div>}
                                </li>
                            ))}
                        </ul>
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

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Spend by Category Chart */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-1">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-800">Spend by Category</h3>
                                    <button className="text-gray-400 hover:text-gray-600"><SlidersHorizontal size={16} /></button>
                                </div>
                                <div className="flex items-center justify-center relative h-48">
                                    {/* CSS Donut Chart */}
                                    <div className="w-40 h-40 rounded-full" style={{ background: 'conic-gradient(#7B68EE 0% 35%, #3B82F6 35% 60%, #10B981 60% 80%, #F59E0B 80% 100%)' }}></div>
                                    <div className="absolute w-28 h-28 bg-white rounded-full flex items-center justify-center flex-col">
                                        <span className="text-xs text-gray-400">Total</span>
                                        <span className="font-bold text-gray-800">$124k</span>
                                    </div>
                                </div>
                                <div className="mt-6 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-clickup-purple mr-2"></div>Electronics</div>
                                        <span className="font-medium text-gray-700">35%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>Services</div>
                                        <span className="font-medium text-gray-700">25%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>Supplies</div>
                                        <span className="font-medium text-gray-700">20%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>Other</div>
                                        <span className="font-medium text-gray-700">20%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Monthly Performance Chart */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-800">Monthly Procurement Activity</h3>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-400">Last 6 Months</span>
                                    </div>
                                </div>
                                <div className="h-64 flex items-end justify-between space-x-4 px-2">
                                    {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month, i) => {
                                        const height = [40, 65, 45, 80, 55, 90][i];
                                        return (
                                            <div key={month} className="flex flex-col items-center flex-1 group">
                                                <div className="w-full relative flex items-end h-52 bg-gray-50 rounded-t-lg overflow-hidden">
                                                    <div
                                                        className="w-full bg-clickup-purple/80 group-hover:bg-clickup-purple transition-all duration-500 rounded-t-lg relative"
                                                        style={{ height: `${height}%` }}
                                                    >
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                            ${height * 1.5}k
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400 mt-3 font-medium">{month}</span>
                                            </div>
                                        );
                                    })}
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
                            <div key={supplier.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-purple-100 transition-all duration-300 group flex flex-col">
                                <div className="h-40 bg-gray-100 relative overflow-hidden">
                                    <img
                                        src={supplier.image}
                                        alt={supplier.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold rounded-full text-gray-700 shadow-sm border border-white/50">
                                        {supplier.deliveryTime}
                                    </div>
                                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold rounded-full text-white shadow-sm">
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

export default LocalMarketplace;
