import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Layout, Sparkles, Zap, Shield,
    Globe, Users, BarChart, Calendar, MessageSquare,
    FileText, Check, Layers, Cpu,
    Database, Lock, Command, Search, Terminal
} from 'lucide-react';
import Scene3D from '../ui/Scene3D';
// import BrainVisionSection from './landing-components/BrainVisionSection';
import Analytics3D from './landing-components/Analytics3D';
import AdvancedAnalytics3D from './landing-components/AdvancedAnalytics3D';
import CommandCenter3D from './landing-components/CommandCenter3D';
import Marketplace3D from './landing-components/Marketplace3D';
import GTDSection from './landing-components/GTDSection';

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
            {/* <div className="fixed inset-0 z-0 opacity-40 grayscale">
                <Scene3D />
            </div> */}

            {/* Noise Overlay for Texture */}
            <div className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <div className="relative z-10 min-h-screen flex flex-col">

                {/* Navbar */}
                <nav className="flex items-center justify-between px-6 py-6 max-w-[1400px] mx-auto w-full relative z-50">
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
                <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center pb-20 scale-[1.3] origin-center mt-16 mb-4">
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

                {/* GTD Methodology Section */}


                {/* Stats Section - Minimalist */}
                <div className="overflow-hidden mb-12">
                    <div className="max-w-[1400px] mx-auto px-6 py-12">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.15
                                    }
                                }
                            }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-8"
                        >
                            {[
                                { label: "Reports", value: "128,000+", icon: FileText },
                                { label: "Production Line", value: "Simulator", icon: Cpu },
                                { label: "Super Advanced Tools", value: "20+", icon: Sparkles },
                                { label: "Verified Supplier", value: "3,000K", icon: Users }
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    variants={{
                                        hidden: { opacity: 0, y: 30 },
                                        visible: {
                                            opacity: 1,
                                            y: 0,
                                            transition: {
                                                type: "spring",
                                                stiffness: 50,
                                                damping: 15
                                            }
                                        }
                                    }}
                                    className="flex flex-col items-center text-center group"
                                >
                                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 shadow-[0_0_15px_-5px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.2)] transition-all duration-500">
                                        <stat.icon className="w-8 h-8 text-gray-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                                    </div>

                                    <div className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
                                    <div className="text-xs text-gray-500 font-medium uppercase tracking-widest">{stat.label}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* GTD Methodology Section */}
                <GTDSection />

                {/* Brain Vision Section Removed as per request due to lag */}
                {/* <BrainVisionSection /> */}



                {/* New 3D Feature Sections */}
                <div id="features">
                    <Analytics3D />
                    <AdvancedAnalytics3D />
                    <Marketplace3D />
                    <CommandCenter3D />
                </div>

                {/* Pricing Section - Updated Palette & Electric Glow */}
                <div id="pricing" className="py-32 bg-[#050505] border-t border-white/10 relative">
                    <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                        <div className="text-center mb-32">
                            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-white">
                                Transparent <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">Pricing</span>
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
                                        className="w-5 h-5 rounded-full bg-gradient-to-r from-gray-200 to-gray-400 shadow-lg shadow-white/20"
                                    />
                                </button>
                                <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
                                    Yearly <span className="text-gray-400 text-xs ml-1">(Save 20%)</span>
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
                                            ? 'bg-[#0f0f0f] border-2 border-gray-400 text-white md:scale-110 z-10 shadow-[0_0_50px_rgba(255,255,255,0.1)] min-h-[600px] group'
                                            : 'bg-[#0f0f0f] border border-white/10 text-gray-300 hover:border-cyan-500/30 min-h-[500px]'
                                        }
                                    `}
                                >
                                    {plan.popular && (
                                        <>
                                            {/* Sparkle Animation Container - Clipped */}
                                            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                                                {[...Array(5)].map((_, k) => (
                                                    <motion.div
                                                        key={k}
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{
                                                            opacity: [0, 1, 0],
                                                            scale: [0, 1, 0],
                                                            x: [Math.random() * 300, Math.random() * 300],
                                                            y: [Math.random() * 600, Math.random() * 600]
                                                        }}
                                                        transition={{
                                                            duration: 2 + Math.random() * 2,
                                                            repeat: Infinity,
                                                            delay: Math.random() * 2
                                                        }}
                                                        className="absolute w-4 h-4 text-white drop-shadow-lg"
                                                    >
                                                        <Sparkles size={16} fill="white" />
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Label - Not Clipped */}
                                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-lg z-20">
                                                MOST POPULAR
                                            </div>
                                        </>
                                    )}

                                    <div className="relative z-10 h-full flex flex-col">
                                        <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-white'}`}>{plan.name}</h3>
                                        <div className="mb-8">
                                            <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-white'}`}>
                                                {typeof plan.price === 'number'
                                                    ? (billingCycle === 'monthly' ? Math.round(plan.price / 12) : plan.price.toLocaleString())
                                                    : plan.price}
                                            </span>
                                            <span className={`text-sm ${plan.popular ? 'text-gray-400' : 'opacity-60'}`}> SAR/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                        </div>

                                        <div className={`w-full h-px mb-8 ${plan.popular ? 'bg-gray-400/50' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'}`}></div>

                                        <ul className="space-y-4 mb-8 flex-1">
                                            {plan.features.map((f, j) => (
                                                <li key={j} className="flex items-center text-sm">
                                                    <Check size={16} className={`mr-3 ${plan.popular ? 'text-cyan-400' : 'text-gray-500'}`} />
                                                    <span className={plan.popular ? 'text-gray-300 font-medium' : 'text-gray-400'}>{f}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <button className={`
                                            w-full py-4 rounded-xl font-bold text-sm transition-all hover:scale-105
                                            ${plan.popular
                                                ? 'bg-white text-black shadow-lg hover:bg-gray-200'
                                                : 'bg-white text-black hover:bg-cyan-950/30 hover:text-cyan-400 hover:border-cyan-500/30 border border-transparent'
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

                {/* Founder Section - Transparent */}
                <div className="py-32 border-t border-white/10">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl">
                                <img
                                    src="/founder.png"
                                    alt="Mohamed Ali"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = "https://ui-avatars.com/api/?name=Mohamed+Ali&background=0B1121&color=ffffff&size=256";
                                    }}
                                />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-4xl font-bold mb-2 text-white">Mohamed Ali</h2>
                                <div className="text-gray-400 font-mono text-sm uppercase tracking-widest mb-6">Founder & CEO</div>
                                <p className="text-xl text-gray-300 leading-relaxed font-light italic">
                                    "A visionary leader with over <span className="text-white font-semibold">11 years of expertise</span> in <span className="text-white font-semibold">Supply Chain Management</span> across Saudi Arabia. Mohamed founded <span className="text-white font-bold">Nabd Chain System</span> to solve critical industry challenges in sourcing and workflow organization."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="py-12 border-t border-white/10 text-sm">
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