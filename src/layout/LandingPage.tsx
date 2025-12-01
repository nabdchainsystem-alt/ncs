import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, ArrowRight, Layout, Sparkles, Zap, Shield,
    Star, Globe, Users, BarChart, Calendar, MessageSquare,
    FileText, ChevronDown, ChevronUp, Check, Play, Layers, Cpu,
    Rocket, Database, Lock
} from 'lucide-react';
import Scene3D from '../ui/Scene3D';

interface LandingPageProps {
    onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        { q: "Is this really a full replacement for my current stack?", a: "Yes! We combine tasks, docs, chat, and goals into one unified platform, so you don't need to switch between apps." },
        { q: "How does the AI Brain work?", a: "Our AI analyzes your entire workspace—tasks, docs, and conversations—to answer questions, summarize threads, and automate work." },
        { q: "Can I import data from other tools?", a: "Absolutely. We offer one-click imports from Trello, Asana, Monday, and Jira." },
        { q: "Is there a free plan?", a: "Yes, our 'Free Forever' plan includes unlimited tasks and members. It's perfect for personal use and small teams." }
    ];

    const [heroText, setHeroText] = useState("NABD CHAIN SYSTEM");

    useEffect(() => {
        const timer = setTimeout(() => {
            setHeroText("MANAGE YOUR WHOLE COMPANY");
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-brand-primary selection:text-white overflow-x-hidden relative">

            {/* 3D Background */}
            <div className="fixed inset-0 z-0">
                <Scene3D />
            </div>

            {/* Glassmorphism Overlay */}
            <div className="relative z-10 min-h-screen flex flex-col">

                {/* Navbar */}
                <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
                    <div className="flex items-center p-2">
                        <img src="/nabd-logo-light.svg" alt="NABD Chain" className="w-16 h-16 object-contain" />
                    </div>
                    <div className="flex items-center space-x-6">
                        <a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Login</a>
                        <button onClick={onLoginClick} className="px-5 py-2 rounded-lg bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors">
                            Get Started
                        </button>
                    </div>
                </nav>

                {/* Hero Section */}
                <div className="min-h-[90vh] flex flex-col items-center justify-center px-6 text-center pt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 py-1.5 mb-8"
                    >
                        <Sparkles size={14} className="text-brand-accent" />
                        <span className="text-xs font-medium text-brand-accent tracking-wide uppercase">System V3.0 Online</span>
                    </motion.div>

                    <div className="h-40 md:h-60 flex items-center justify-center mb-6">
                        <AnimatePresence mode="wait">
                            <motion.h1
                                key={heroText}
                                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                                transition={{ duration: 1.5 }}
                                className="text-6xl md:text-8xl font-black tracking-tighter leading-tight"
                            >
                                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-500 filter drop-shadow-2xl">
                                    {heroText === "NABD CHAIN SYSTEM" ? "NABD CHAIN" : "MANAGE YOUR"}
                                </span>
                                <br />
                                <span className="text-4xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-purple-400 to-brand-accent">
                                    {heroText === "NABD CHAIN SYSTEM" ? "SYSTEM" : "WHOLE COMPANY"}
                                </span>
                            </motion.h1>
                        </AnimatePresence>
                    </div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="text-lg md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light backdrop-blur-sm bg-black/20 p-4 rounded-xl border border-white/5"
                    >
                        The ultimate ecosystem for enterprise management.
                        <br />
                        Data • Analytics • Marketplace • Smart Tools
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
                    >
                        <button onClick={onLoginClick} className="group relative w-full sm:w-auto h-14 px-10 rounded-full bg-white text-black font-bold text-lg overflow-hidden transition-all hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            <span className="relative flex items-center justify-center">
                                Enter System
                                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                        <button className="w-full sm:w-auto h-14 px-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all hover:scale-105">
                            View Documentation
                        </button>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 w-full max-w-5xl"
                    >
                        {[
                            { label: "Active Modules", value: "12+", icon: Layers, color: "text-blue-400" },
                            { label: "System Uptime", value: "99.9%", icon: Zap, color: "text-yellow-400" },
                            { label: "Global Users", value: "10k+", icon: Users, color: "text-green-400" },
                            { label: "Data Secured", value: "AES-256", icon: Lock, color: "text-red-400" }
                        ].map((stat, i) => (
                            <div key={i} className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:bg-white/5 transition-colors group">
                                <stat.icon className={`mb-3 ${stat.color} group-hover:scale-110 transition-transform`} size={24} />
                                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Features Section - Full Width Scroll Experience */}
                <div className="py-32 space-y-32">

                    {/* Data Command Center */}
                    <div className="relative z-10">
                        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true, margin: "-100px" }}
                                className="flex-1 space-y-8"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-blue-500/20 flex items-center justify-center backdrop-blur-xl border border-blue-500/30">
                                    <Database size={40} className="text-blue-400" />
                                </div>
                                <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                                    Data Command <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Center</span>
                                </h2>
                                <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
                                    Transform raw data into actionable insights. Insert data into interactive 3D tables, organize with drag-and-drop cards, and manage your entire database visually.
                                </p>
                                <button className="flex items-center space-x-2 text-blue-400 font-bold hover:text-blue-300 transition-colors group">
                                    <span>Explore Data Tools</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, rotateY: 30, x: 50 }}
                                whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
                                transition={{ duration: 1, type: "spring" }}
                                viewport={{ once: true }}
                                className="flex-1 w-full perspective-1000"
                            >
                                <div className="relative aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 backdrop-blur-xl overflow-hidden group transform transition-transform duration-500 hover:rotate-y-6 hover:rotate-x-6 preserve-3d shadow-2xl shadow-blue-900/20">
                                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    {/* 3D Table Mockup */}
                                    <div className="absolute inset-0 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-700">
                                        <div className="grid grid-cols-3 gap-4 opacity-80 transform rotate-12 rotate-x-12">
                                            {[...Array(12)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 20, z: 0 }}
                                                    whileInView={{ opacity: 1, y: 0, z: 0 }}
                                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                                    whileHover={{ z: 20, scale: 1.1 }}
                                                    className="w-24 h-16 bg-blue-500/10 rounded-lg border border-blue-500/30 backdrop-blur-md shadow-lg"
                                                ></motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Next-Gen Analytics */}
                    <div className="relative z-10">
                        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row-reverse items-center gap-16">
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true, margin: "-100px" }}
                                className="flex-1 space-y-8"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-purple-500/20 flex items-center justify-center backdrop-blur-xl border border-purple-500/30">
                                    <BarChart size={40} className="text-purple-400" />
                                </div>
                                <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                                    Next-Gen <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Analytics</span>
                                </h2>
                                <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
                                    Visualize performance with immersive 3D charts and real-time reporting. Watch your data come alive with animated loading sequences and interactive dashboards.
                                </p>
                                <button className="flex items-center space-x-2 text-purple-400 font-bold hover:text-purple-300 transition-colors group">
                                    <span>View Dashboards</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, rotateY: -30, x: -50 }}
                                whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
                                transition={{ duration: 1, type: "spring" }}
                                viewport={{ once: true }}
                                className="flex-1 w-full perspective-1000"
                            >
                                <div className="relative aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 backdrop-blur-xl overflow-hidden group transform transition-transform duration-500 hover:-rotate-y-6 hover:rotate-x-6 preserve-3d shadow-2xl shadow-purple-900/20">
                                    <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    {/* 3D Chart Mockup */}
                                    <div className="absolute inset-0 flex items-end justify-center pb-10 px-10">
                                        <div className="flex items-end justify-between w-full h-64 space-x-4 transform translate-z-10">
                                            {[40, 70, 50, 90, 60, 80].map((h, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ height: "10%" }}
                                                    whileInView={{ height: `${h}%` }}
                                                    transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
                                                    viewport={{ once: false }}
                                                    className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg opacity-90 shadow-[0_0_20px_rgba(168,85,247,0.4)] relative group-hover:scale-y-110 transition-transform origin-bottom"
                                                >
                                                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/50"></div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Global Marketplace */}
                    <div className="relative z-10">
                        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true, margin: "-100px" }}
                                className="flex-1 space-y-8"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 flex items-center justify-center backdrop-blur-xl border border-emerald-500/30">
                                    <Globe size={40} className="text-emerald-400" />
                                </div>
                                <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                                    Global <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Marketplace</span>
                                </h2>
                                <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
                                    Connect with suppliers worldwide. Browse catalogs, request quotations instantly, and manage your procurement network in one seamless interface.
                                </p>
                                <button className="flex items-center space-x-2 text-emerald-400 font-bold hover:text-emerald-300 transition-colors group">
                                    <span>Find Suppliers</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, rotateY: 30, x: 50 }}
                                whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
                                transition={{ duration: 1, type: "spring" }}
                                viewport={{ once: true }}
                                className="flex-1 w-full perspective-1000"
                            >
                                <div className="relative aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-emerald-900/20 to-green-900/20 border border-emerald-500/30 backdrop-blur-xl overflow-hidden group transform transition-transform duration-500 hover:rotate-y-6 hover:rotate-x-6 preserve-3d shadow-2xl shadow-emerald-900/20 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    {/* Floating Logos */}
                                    <div className="relative w-64 h-64">
                                        {[...Array(5)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{
                                                    y: [0, -20, 0],
                                                    rotate: [0, 5, -5, 0]
                                                }}
                                                transition={{
                                                    duration: 4,
                                                    repeat: Infinity,
                                                    delay: i * 0.5,
                                                    ease: "easeInOut"
                                                }}
                                                className={`absolute w-16 h-16 rounded-full border-2 border-emerald-500/50 bg-black/50 backdrop-blur-md flex items-center justify-center text-xs font-bold text-emerald-300 shadow-lg shadow-emerald-500/20`}
                                                style={{
                                                    top: `${Math.random() * 80}%`,
                                                    left: `${Math.random() * 80}%`,
                                                }}
                                            >
                                                Supplier
                                            </motion.div>
                                        ))}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)] z-10">
                                                <Globe size={40} className="text-black" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Smart Tools Suite */}
                    <div className="relative z-10">
                        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row-reverse items-center gap-16">
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true, margin: "-100px" }}
                                className="flex-1 space-y-8"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-amber-500/20 flex items-center justify-center backdrop-blur-xl border border-amber-500/30">
                                    <Cpu size={40} className="text-amber-400" />
                                </div>
                                <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                                    Smart Tools <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Suite</span>
                                </h2>
                                <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
                                    A complete toolkit for the modern enterprise. AI Assistants, Whiteboards, Mind Maps, Automations, and more—all integrated to supercharge your productivity.
                                </p>
                                <button className="flex items-center space-x-2 text-amber-400 font-bold hover:text-amber-300 transition-colors group">
                                    <span>Try Smart Tools</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, rotateY: -30, x: -50 }}
                                whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
                                transition={{ duration: 1, type: "spring" }}
                                viewport={{ once: true }}
                                className="flex-1 w-full perspective-1000"
                            >
                                <div className="relative aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/30 backdrop-blur-xl overflow-hidden group transform transition-transform duration-500 hover:-rotate-y-6 hover:rotate-x-6 preserve-3d shadow-2xl shadow-amber-900/20 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    {/* Tools Grid Animation */}
                                    <div className="grid grid-cols-3 gap-6 p-8 transform rotate-6 hover:rotate-0 transition-transform duration-700">
                                        {[Sparkles, Layout, FileText, MessageSquare, Zap, Shield, Calendar, CheckCircle2, Database].map((Icon, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ scale: 1.2, rotate: 10, backgroundColor: "rgba(245, 158, 11, 0.3)" }}
                                                className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg cursor-pointer transition-colors"
                                            >
                                                <Icon size={32} className="text-gray-300 group-hover:text-amber-400 transition-colors" />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>


                    {/* Founder Section */}
                    <div className="relative z-10 py-32">
                        <div className="max-w-7xl mx-auto px-6 text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                                className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-12 backdrop-blur-xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50"></div>

                                <div className="w-32 h-32 mx-auto mb-8 rounded-full p-1 bg-gradient-to-br from-brand-primary to-purple-500">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                        <img
                                            src="/founder.png"
                                            alt="Mohamed Ali"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback if image is missing
                                                e.currentTarget.src = "https://ui-avatars.com/api/?name=Mohamed+Ali&background=7B61FF&color=fff&size=256";
                                            }}
                                        />
                                    </div>
                                </div>

                                <h2 className="text-4xl md:text-5xl font-bold mb-3">Mohamed Ali</h2>
                                <div className="text-brand-primary font-bold tracking-widest uppercase text-sm mb-8">Founder & CEO</div>

                                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-5xl mx-auto font-light">
                                    "A visionary leader with over <span className="text-amber-400 font-semibold">11 years of expertise</span> in <span className="text-blue-400 font-semibold">Supply Chain Management</span> across Saudi Arabia. Mohamed founded <span className="text-brand-primary font-bold">Nabd Chain System</span> to solve critical industry challenges in <span className="text-emerald-400 font-semibold">sourcing and workflow organization</span>, driven by a dream to revolutionize enterprise efficiency."
                                </p>

                                <div className="mt-10 flex justify-center space-x-4">
                                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <footer className="py-20 border-t border-white/10 bg-black/90 backdrop-blur-xl relative z-20">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center space-x-2">
                                    <img src="/nabd-logo-light.svg" alt="NABD Chain" className="w-10 h-10 object-contain" />
                                    <span className="text-2xl font-bold tracking-tight text-white">Nabd Chain</span>
                                </div>
                                <p className="text-gray-400 leading-relaxed max-w-sm">
                                    The ultimate ecosystem for enterprise management. Streamline operations, boost productivity, and scale your business with our all-in-one platform.
                                </p>
                                <div className="flex space-x-4">
                                    {['twitter', 'linkedin', 'github', 'discord'].map((social) => (
                                        <a key={social} href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                            <span className="sr-only">{social}</span>
                                            {/* Placeholder icons */}
                                            <div className="w-4 h-4 bg-current rounded-sm"></div>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-white font-bold mb-6">Product</h3>
                                <ul className="space-y-4">
                                    {['Features', 'Pricing', 'Enterprise', 'Changelog', 'Docs'].map((item) => (
                                        <li key={item}><a href="#" className="text-gray-400 hover:text-brand-primary transition-colors">{item}</a></li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-white font-bold mb-6">Company</h3>
                                <ul className="space-y-4">
                                    {['About', 'Careers', 'Blog', 'Contact', 'Partners'].map((item) => (
                                        <li key={item}><a href="#" className="text-gray-400 hover:text-brand-primary transition-colors">{item}</a></li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-white font-bold mb-6">Resources</h3>
                                <ul className="space-y-4">
                                    {['Community', 'Help Center', 'API Reference', 'Status', 'Terms'].map((item) => (
                                        <li key={item}><a href="#" className="text-gray-400 hover:text-brand-primary transition-colors">{item}</a></li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-white font-bold mb-6">Legal</h3>
                                <ul className="space-y-4">
                                    {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'].map((item) => (
                                        <li key={item}><a href="#" className="text-gray-400 hover:text-brand-primary transition-colors">{item}</a></li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-gray-500 text-sm">
                                © {new Date().getFullYear()} Nabd Chain System. All rights reserved.
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                                <a href="#" className="hover:text-white transition-colors">Terms</a>
                                <a href="#" className="hover:text-white transition-colors">Cookies</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;