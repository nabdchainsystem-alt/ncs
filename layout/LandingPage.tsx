import React from 'react';
import { CheckCircle2, ArrowRight, Layout, Sparkles, Zap, Shield } from 'lucide-react';

interface LandingPageProps {
    onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-brand-primary selection:text-white overflow-x-hidden">

            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto relative z-20">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-brand-primary to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight">ClickUp Clone</span>
                </div>
                <div className="flex items-center space-x-6">
                    <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">Product</a>
                    <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">Solutions</a>
                    <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">Pricing</a>
                    <button
                        onClick={onLoginClick}
                        className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors"
                    >
                        Log in
                    </button>
                    <button className="bg-gray-900 hover:bg-black px-5 py-2 rounded-full text-sm font-bold transition-all shadow-md text-white">
                        Sign Up
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-20 pb-32 px-6">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-primary/20 blur-[120px] rounded-full pointer-events-none z-0"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Sparkles size={14} className="text-brand-accent" />
                        <span className="text-xs font-medium text-brand-accent tracking-wide uppercase">ClickUp Brain 3.0 is here</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                        One app to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-purple-400 to-brand-accent">replace them all.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        All your work in one place: Tasks, Docs, Chat, Goals, & more.
                        Boost productivity with the power of Gemini AI integrated directly into your workflow.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                        <button className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-lg hover:shadow-lg transition-all hover:-translate-y-1 flex items-center justify-center">
                            Get Started
                            <ArrowRight size={18} className="ml-2" />
                        </button>
                        <button className="w-full sm:w-auto h-12 px-8 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all">
                            See Demo
                        </button>
                    </div>
                </div>

                {/* UI Preview Mockup */}
                <div className="mt-20 max-w-6xl mx-auto relative z-10 animate-in fade-in zoom-in duration-1000 delay-500">
                    <div className="rounded-xl border border-white/10 bg-[#1a1b21]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="h-10 border-b border-white/5 flex items-center space-x-2 px-4">
                            <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                        </div>
                        <div className="aspect-[16/9] relative bg-[#0a0a0a] flex items-center justify-center group">
                            {/* Simple wireframe representation */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1b21] to-[#0a0a0a] opacity-50"></div>
                            <div className="text-center z-10">
                                <Layout size={64} className="mx-auto text-brand-primary mb-4 opacity-50" />
                                <p className="text-gray-500 font-medium">Interactive Dashboard Experience</p>
                            </div>
                            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
                        </div>
                    </div>
                    {/* Floating cards */}
                    <div className="absolute -right-12 top-20 bg-[#24272e] p-4 rounded-lg border border-gray-700 shadow-2xl animate-bounce duration-[3000ms]">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-500/20 rounded text-green-400"><CheckCircle2 size={20} /></div>
                            <div>
                                <div className="text-sm font-bold text-white">Task Complete</div>
                                <div className="text-xs text-gray-400">Launch Website</div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -left-8 bottom-20 bg-[#24272e] p-4 rounded-lg border border-gray-700 shadow-2xl animate-pulse duration-[4000ms]">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-500/20 rounded text-purple-400"><Sparkles size={20} /></div>
                            <div>
                                <div className="text-sm font-bold text-white">AI Summary</div>
                                <div className="text-xs text-gray-400">Generated 3 subtasks</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-24 bg-[#0f1014] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Layout className="text-blue-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">Everything View</h3>
                            <p className="text-gray-400 leading-relaxed">
                                See the big picture. View tasks across all your projects in a single customizable list.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 rounded-lg bg-brand-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Zap className="text-brand-primary" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">Automation & AI</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Save time with custom automations and ClickUp Brain's generative capabilities.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="text-emerald-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">Enterprise Security</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Bank-grade security with 2FA, SSO, and strict permission controls for your team.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-12 border-t border-white/10 text-center text-gray-500 text-sm">
                <p>© 2024 ClickUp Clone by Gemini. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;