import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Layout, Sparkles, Zap, Shield,
    Globe, Users, BarChart, Calendar, MessageSquare,
    FileText, Check, Layers, Cpu,
    Database, Lock, Command, Search, Terminal
} from 'lucide-react';
import Scene3D from '../ui/Scene3D';
import BrainVisionSection from './landing-components/BrainVisionSection';

interface LandingPageProps {
    onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [heroText, setHeroText] = useState("NABD CHAIN SYSTEM");

    useEffect(() => {
        const timer = setTimeout(() => {
            setHeroText("MANAGE YOUR WHOLE COMPANY");
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black overflow-x-hidden relative">

            {/* 3D Background - Kept subtle */}
            <div className="fixed inset-0 z-0 opacity-40 grayscale">
                <Scene3D />
            </div>

            {/* Noise Overlay for Texture */}
            <div className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <div className="relative z-10 min-h-screen flex flex-col">

                {/* Navbar */}
                <nav className="flex items-center justify-between px-6 py-6 max-w-[1400px] mx-auto w-full">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <div className="w-6 h-6 bg-black rounded-sm"></div>
                        </div>
                        <span className="font-bold text-xl tracking-tight">NABD CHAIN</span>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</a>
                        <a href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</a>
                        <a href="#enterprise" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Enterprise</a>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={onLoginClick} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Login</button>
                        <button onClick={onLoginClick} className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors">
                            Get Started
                        </button>
                    </div>
                </nav>

                {/* Hero Section */}
                <div className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center pb-20 scale-105 origin-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 py-1.5 mb-10"
                    >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        <span className="text-xs font-medium text-gray-300 tracking-widest uppercase">System V3.0 Online</span>
                    </motion.div>

                    <div className="h-32 md:h-52 flex items-center justify-center mb-8">
                        <AnimatePresence mode="wait">
                            <motion.h1
                                key={heroText}
                                initial={{ opacity: 0, filter: "blur(10px)" }}
                                animate={{ opacity: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, filter: "blur(10px)" }}
                                transition={{ duration: 1 }}
                                className="text-5xl md:text-8xl font-black tracking-tighter leading-none"
                            >
                                <span className="block text-white">
                                    {heroText === "NABD CHAIN SYSTEM" ? "NABD CHAIN" : "MANAGE YOUR"}
                                </span>
                                <span className="block text-transparent bg-clip-text bg-gradient-to-b from-gray-400 to-gray-800">
                                    {heroText === "NABD CHAIN SYSTEM" ? "SYSTEM" : "WHOLE COMPANY"}
                                </span>
                            </motion.h1>
                        </AnimatePresence>
                    </div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light"
                    >
                        The ultimate monochromatic ecosystem for enterprise management.
                        <br />
                        <span className="text-white font-medium">Data • Analytics • Marketplace • Smart Tools</span>
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button onClick={onLoginClick} className="group relative w-full sm:w-auto h-14 px-10 rounded-full bg-white text-black font-bold text-lg overflow-hidden transition-all hover:scale-105">
                            <span className="relative flex items-center justify-center">
                                Enter System
                                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                        <button className="w-full sm:w-auto h-14 px-10 rounded-full bg-transparent border border-white/20 text-white font-bold text-lg hover:bg-white/5 transition-all">
                            Documentation
                        </button>
                    </motion.div>
                </div>

                {/* Stats Section - Minimalist */}
                <div className="border-y border-white/5 bg-black/50 backdrop-blur-sm">
                    <div className="max-w-[1400px] mx-auto px-6 py-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { label: "Active Modules", value: "12+", icon: Layers },
                                { label: "System Uptime", value: "99.9%", icon: Zap },
                                { label: "Global Users", value: "10k+", icon: Users },
                                { label: "Data Secured", value: "AES-256", icon: Lock }
                            ].map((stat, i) => (
                                <div key={i} className="flex flex-col items-center text-center group">
                                    <stat.icon className="mb-4 text-gray-500 group-hover:text-white transition-colors" size={24} />
                                    <div className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
                                    <div className="text-xs text-gray-500 font-medium uppercase tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Brain Vision Section */}
                <BrainVisionSection />

                {/* Features Bento Grid */}
                <div id="features" className="py-32 bg-[#050505] relative overflow-hidden">
                    {/* Subtle Grid Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                    <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                        <div className="mb-20 text-center">
                            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-white">
                                Core <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Architecture</span>
                            </h2>
                            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Everything you need to run your organization, unified in one powerful interface.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">

                            {/* Data Command Center - Large Card */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="md:col-span-2 relative rounded-3xl bg-[#0f0f0f] border border-white/10 overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-30 transition-opacity">
                                    <Database size={200} className="text-gray-800" />
                                </div>
                                <div className="relative h-full p-10 flex flex-col justify-between z-10">
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                            <Database className="text-cyan-400" size={24} />
                                        </div>
                                        <h3 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Data Command Center</h3>
                                        <p className="text-gray-400 max-w-md text-lg">Transform raw data into actionable insights. Interactive 3D tables, drag-and-drop organization, and visual database management.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="h-32 w-full bg-black/50 rounded-xl border border-white/5 p-4 flex items-center justify-center relative overflow-hidden">
                                            <div className="grid grid-cols-3 gap-2 w-full opacity-50">
                                                {[...Array(9)].map((_, i) => (
                                                    <div key={i} className="h-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full w-full"></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Analytics - Tall Card */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="md:row-span-2 relative rounded-3xl bg-[#0f0f0f] border border-white/10 overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
                                <div className="relative h-full p-10 flex flex-col z-10">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                        <BarChart className="text-cyan-400" size={24} />
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Next-Gen Analytics</h3>
                                    <p className="text-gray-400 mb-8">Visualize performance with immersive charts and real-time reporting.</p>

                                    <div className="flex-1 flex items-end justify-center gap-2 pb-8">
                                        {[40, 70, 50, 90, 60, 80].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: "10%" }}
                                                whileInView={{ height: `${h}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                className="w-8 bg-gradient-to-t from-cyan-900/50 to-cyan-400/50 rounded-t-sm hover:from-cyan-600 hover:to-cyan-300 transition-colors"
                                            ></motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Marketplace - Wide Card */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="md:col-span-2 relative rounded-3xl bg-[#0f0f0f] border border-white/10 overflow-hidden group"
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-5">
                                    <Globe size={400} className="text-white animate-spin-slow" style={{ animationDuration: '60s' }} />
                                </div>
                                <div className="relative h-full p-10 flex flex-col justify-between z-10">
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                            <Globe className="text-cyan-400" size={24} />
                                        </div>
                                        <h3 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Global Marketplace</h3>
                                        <p className="text-gray-400 max-w-md text-lg">Connect with suppliers worldwide. Browse catalogs and request quotations instantly.</p>
                                    </div>
                                    <div className="flex items-center gap-4 mt-8">
                                        {[1, 2, 3].map((_, i) => (
                                            <div key={i} className="flex-1 h-16 bg-black/50 rounded-lg border border-white/5 flex items-center px-4 gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/10"></div>
                                                <div className="h-2 w-20 bg-white/10 rounded-full"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Smart Tools - Square Card */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="relative rounded-3xl bg-[#0f0f0f] border border-white/10 overflow-hidden group"
                            >
                                <div className="relative h-full p-10 flex flex-col z-10">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                        <Cpu className="text-cyan-400" size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Smart Suite</h3>
                                    <p className="text-gray-400 text-sm mb-6">AI Assistants, Whiteboards, Mind Maps, and Automations.</p>

                                    <div className="grid grid-cols-3 gap-3">
                                        {[Sparkles, Layout, FileText, MessageSquare, Zap, Shield, Calendar, Check, Database].map((Icon, i) => (
                                            <div key={i} className="aspect-square bg-black/50 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5">
                                                <Icon size={16} className="text-gray-500 group-hover:text-cyan-400 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Security - Square Card */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="relative rounded-3xl bg-white text-black overflow-hidden group"
                            >
                                <div className="relative h-full p-10 flex flex-col z-10">
                                    <div className="w-12 h-12 rounded-xl bg-black/10 flex items-center justify-center mb-6">
                                        <Shield className="text-black" size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">Enterprise Security</h3>
                                    <p className="text-gray-600 text-sm mb-6 font-medium">Bank-grade encryption and advanced permission management.</p>
                                    <div className="mt-auto flex items-center gap-2 font-bold">
                                        <span>Learn more</span>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </motion.div>

                            {/* API - Square Card */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="relative rounded-3xl bg-[#0f0f0f] border border-white/10 overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                <div className="relative h-full p-10 flex flex-col z-10">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                        <Terminal className="text-cyan-400" size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Developer API</h3>
                                    <p className="text-gray-400 text-sm mb-6">Extend functionality with our robust API and webhooks.</p>
                                    <div className="font-mono text-xs text-cyan-400 bg-black p-4 rounded-lg border border-white/10">
                                        &gt; npm install @nabd/sdk
                                        <br />
                                        &gt; nabd init
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </div>

                {/* Pricing Section - Updated Palette & Electric Glow */}
                <div id="pricing" className="py-32 bg-[#050505] border-t border-white/10 relative">
                    <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                                Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Pricing</span>
                            </h2>
                            <div className="flex items-center justify-center space-x-4">
                                <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
                                <button
                                    onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                                    className="relative w-14 h-8 rounded-full bg-white/10 border border-white/10 p-1 transition-colors hover:bg-white/20"
                                >
                                    <motion.div
                                        animate={{ x: billingCycle === 'monthly' ? 0 : 24 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="w-5 h-5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
                                    />
                                </button>
                                <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
                                    Yearly <span className="text-cyan-400 text-xs ml-1">(Save 20%)</span>
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                            {[
                                { name: "Pro", price: 2000, features: ["Up to 5 Users", "Basic Analytics", "10GB Storage"] },
                                { name: "Pro+", price: 5000, features: ["Up to 20 Users", "Advanced Analytics", "100GB Storage", "Priority Support"], popular: true },
                                { name: "Enterprise", price: 10000, features: ["Unlimited Users", "Custom Solutions", "Unlimited Storage", "24/7 Support"] },
                                { name: "Custom", price: "Custom", features: ["Unlimited Everything", "Dedicated Infra", "White Labeling"] }
                            ].map((plan, i) => (
                                <div
                                    key={i}
                                    className={`
                                        relative p-8 rounded-3xl flex flex-col transition-all duration-300
                                        ${plan.popular
                                            ? 'bg-[#0f0f0f] border-2 border-cyan-400 text-white md:scale-110 z-10 shadow-[0_0_50px_rgba(34,211,238,0.2)] min-h-[600px]'
                                            : 'bg-[#0f0f0f] border border-white/10 text-gray-300 hover:border-white/20 min-h-[500px]'
                                        }
                                    `}
                                >
                                    {plan.popular && (
                                        <>
                                            <div className="absolute inset-0 rounded-3xl bg-cyan-400/5 animate-pulse"></div>
                                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-cyan-400 text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-cyan-400/50">
                                                MOST POPULAR
                                            </div>
                                        </>
                                    )}

                                    <div className="relative z-10 h-full flex flex-col">
                                        <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-cyan-400' : 'text-white'}`}>{plan.name}</h3>
                                        <div className="mb-8">
                                            <span className="text-4xl font-bold text-white">
                                                {typeof plan.price === 'number'
                                                    ? (billingCycle === 'monthly' ? Math.round(plan.price / 12) : plan.price.toLocaleString())
                                                    : plan.price}
                                            </span>
                                            {typeof plan.price === 'number' && <span className="text-sm opacity-60"> SAR/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>}
                                        </div>

                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>

                                        <ul className="space-y-4 mb-8 flex-1">
                                            {plan.features.map((f, j) => (
                                                <li key={j} className="flex items-center text-sm">
                                                    <Check size={16} className={`mr-3 ${plan.popular ? 'text-cyan-400' : 'text-gray-500'}`} />
                                                    <span className={plan.popular ? 'text-gray-200' : 'text-gray-400'}>{f}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <button className={`
                                            w-full py-4 rounded-xl font-bold text-sm transition-all hover:scale-105
                                            ${plan.popular
                                                ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/25 hover:shadow-cyan-400/40'
                                                : 'bg-white text-black hover:bg-gray-200'
                                            }
                                        `}>
                                            Choose Plan
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Founder Section - Full Color */}
                <div className="py-32 bg-[#050505] border-t border-white/10">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl">
                                <img
                                    src="/founder.png"
                                    alt="Mohamed Ali"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = "https://ui-avatars.com/api/?name=Mohamed+Ali&background=0B1121&color=22d3ee&size=256";
                                    }}
                                />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-4xl font-bold mb-2 text-white">Mohamed Ali</h2>
                                <div className="text-cyan-400 font-mono text-sm uppercase tracking-widest mb-6">Founder & CEO</div>
                                <p className="text-xl text-gray-300 leading-relaxed font-light italic">
                                    "A visionary leader with over <span className="text-cyan-400 font-semibold">11 years of expertise</span> in <span className="text-cyan-400 font-semibold">Supply Chain Management</span> across Saudi Arabia. Mohamed founded <span className="text-white font-bold">Nabd Chain System</span> to solve critical industry challenges in sourcing and workflow organization."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="py-12 bg-black border-t border-white/10 text-sm">
                    <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-white rounded-sm"></div>
                            <span className="font-bold text-white">NABD CHAIN</span>
                        </div>
                        <div className="text-gray-500">
                            © {new Date().getFullYear()} Nabd Chain System. All rights reserved.
                        </div>
                        <div className="flex space-x-6 text-gray-500">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default LandingPage;