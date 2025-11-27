import React, { useState } from 'react';
import {
    CheckCircle2, ArrowRight, Layout, Sparkles, Zap, Shield,
    Star, Globe, Users, BarChart, Calendar, MessageSquare,
    FileText, ChevronDown, ChevronUp, Check, Play, Layers, Cpu
} from 'lucide-react';

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

            {/* Trusted By Section */}
            <div className="py-12 border-y border-white/5 bg-[#0f1014]/50">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm font-medium text-gray-500 mb-8 uppercase tracking-widest">Trusted by innovative teams at</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholder Logos - Using text for now as we don't have SVGs */}
                        <span className="text-xl font-bold text-white">ACME Corp</span>
                        <span className="text-xl font-bold text-white">Globex</span>
                        <span className="text-xl font-bold text-white">Soylent</span>
                        <span className="text-xl font-bold text-white">Initech</span>
                        <span className="text-xl font-bold text-white">Umbrella</span>
                        <span className="text-xl font-bold text-white">Stark Ind</span>
                    </div>
                </div>
            </div>

            {/* Detailed Features Section */}
            <div className="py-24 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-6 space-y-32">

                    {/* Feature 1 */}
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Layers className="text-blue-400" size={24} />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold">Simplify your project management.</h2>
                            <p className="text-lg text-gray-400 leading-relaxed">
                                Plan, track, and manage any type of work with project management that flexes to your team's needs.
                                Switch between List, Board, Gantt, and Calendar views instantly.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center space-x-3 text-gray-300">
                                    <Check className="text-blue-500" size={18} />
                                    <span>Customizable workflows and statuses</span>
                                </li>
                                <li className="flex items-center space-x-3 text-gray-300">
                                    <Check className="text-blue-500" size={18} />
                                    <span>Automated sprint management</span>
                                </li>
                                <li className="flex items-center space-x-3 text-gray-300">
                                    <Check className="text-blue-500" size={18} />
                                    <span>Real-time reporting and dashboards</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 relative">
                            <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 p-8 flex items-center justify-center">
                                {/* Abstract representation of UI */}
                                <div className="w-full h-full bg-[#1a1b21] rounded-xl shadow-2xl border border-white/5 p-4 space-y-4">
                                    <div className="h-8 w-1/3 bg-white/10 rounded"></div>
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-12 bg-white/5 rounded flex items-center px-4 justify-between">
                                                <div className="w-4 h-4 rounded-full border border-white/20"></div>
                                                <div className="w-2/3 h-2 bg-white/10 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <MessageSquare className="text-purple-400" size={24} />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold">Collaboration without chaos.</h2>
                            <p className="text-lg text-gray-400 leading-relaxed">
                                Bring your team together with Docs, Whiteboards, and Chat all in one place.
                                No more switching tabs to find the context you need.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center space-x-3 text-gray-300">
                                    <Check className="text-purple-500" size={18} />
                                    <span>Real-time collaborative editing</span>
                                </li>
                                <li className="flex items-center space-x-3 text-gray-300">
                                    <Check className="text-purple-500" size={18} />
                                    <span>Linked tasks and documents</span>
                                </li>
                                <li className="flex items-center space-x-3 text-gray-300">
                                    <Check className="text-purple-500" size={18} />
                                    <span>Integrated chat channels</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 relative">
                            <div className="aspect-square rounded-2xl bg-gradient-to-bl from-purple-500/10 to-pink-500/10 border border-white/10 p-8 flex items-center justify-center">
                                <div className="w-full h-full bg-[#1a1b21] rounded-xl shadow-2xl border border-white/5 p-6 relative">
                                    <div className="absolute top-4 right-4 flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-[#1a1b21]"></div>
                                        <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-[#1a1b21]"></div>
                                    </div>
                                    <div className="mt-8 space-y-4">
                                        <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                                        <div className="h-4 w-full bg-white/10 rounded"></div>
                                        <div className="h-4 w-5/6 bg-white/10 rounded"></div>
                                        <div className="h-32 w-full bg-white/5 rounded mt-4 border border-white/5 flex items-center justify-center">
                                            <span className="text-xs text-gray-500">Live Document</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="w-12 h-12 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                                <Cpu className="text-brand-primary" size={24} />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold">Powered by Intelligence.</h2>
                            <p className="text-lg text-gray-400 leading-relaxed">
                                Let AI handle the busy work. Summarize threads, generate subtasks, and ask questions about your workspace data instantly.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center space-x-3 text-gray-300">
                                    <Check className="text-brand-primary" size={18} />
                                    <span>AI Knowledge Manager</span>
                                </li>
                                <li className="flex items-center space-x-3 text-gray-300">
                                    <Check className="text-brand-primary" size={18} />
                                    <span>Automated status updates</span>
                                </li>
                                <li className="flex items-center space-x-3 text-gray-300">
                                    <Check className="text-brand-primary" size={18} />
                                    <span>Smart writing assistant</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 relative">
                            <div className="aspect-square rounded-2xl bg-gradient-to-tr from-brand-primary/10 to-blue-500/10 border border-white/10 p-8 flex items-center justify-center">
                                <div className="w-full h-full bg-[#1a1b21] rounded-xl shadow-2xl border border-white/5 flex flex-col">
                                    <div className="p-4 border-b border-white/5 flex items-center space-x-3">
                                        <Sparkles size={16} className="text-brand-primary" />
                                        <span className="text-sm font-medium">Ask AI...</span>
                                    </div>
                                    <div className="flex-1 p-4 space-y-4">
                                        <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300 self-end max-w-[80%] ml-auto">
                                            Summarize the Q3 marketing goals.
                                        </div>
                                        <div className="bg-brand-primary/10 rounded-lg p-3 text-sm text-gray-200 self-start max-w-[90%] border border-brand-primary/20">
                                            Here are the key Q3 goals based on your docs:
                                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                                                <li>Increase organic traffic by 25%</li>
                                                <li>Launch the new referral program</li>
                                                <li>Optimize onboarding flow</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Testimonials Section */}
            <div className="py-24 bg-[#0f1014] border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by teams everywhere</h2>
                        <p className="text-gray-400">Join thousands of teams who have transformed how they work.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Sarah J.", role: "Product Manager", text: "It replaced 4 other tools for us. The AI features are actually useful, not just a gimmick." },
                            { name: "Mike T.", role: "Engineering Lead", text: "Finally, a tool that developers and marketing can agree on. The GitHub integration is flawless." },
                            { name: "Elena R.", role: "Operations Director", text: "The customizability is unmatched. We built our entire CRM right inside the platform." }
                        ].map((t, i) => (
                            <div key={i} className="p-8 rounded-2xl bg-[#1a1b21] border border-white/5 hover:border-brand-primary/30 transition-colors">
                                <div className="flex text-yellow-500 mb-4">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="currentColor" />)}
                                </div>
                                <p className="text-gray-300 mb-6 leading-relaxed">"{t.text}"</p>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600"></div>
                                    <div>
                                        <div className="font-bold text-sm">{t.name}</div>
                                        <div className="text-xs text-gray-500">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="py-24 bg-[#0a0a0a]">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border border-white/10 rounded-xl bg-[#1a1b21] overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                                >
                                    <span className="font-medium text-lg">{faq.q}</span>
                                    {openFaq === index ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </button>
                                {openFaq === index && (
                                    <div className="px-6 pb-6 pt-0 text-gray-400 leading-relaxed animate-in fade-in slide-in-from-top-2">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-primary/10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]"></div>
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to unleash your team's potential?</h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                        Join the future of work today. No credit card required.
                    </p>
                    <button className="h-14 px-10 rounded-full bg-white text-black font-bold text-xl hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                        Get Started for Free
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-12 border-t border-white/10 bg-[#0f1014] text-sm">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div>
                        <h4 className="font-bold text-white mb-4">Product</h4>
                        <ul className="space-y-2 text-gray-500">
                            <li><a href="#" className="hover:text-white">Tasks</a></li>
                            <li><a href="#" className="hover:text-white">Docs</a></li>
                            <li><a href="#" className="hover:text-white">Goals</a></li>
                            <li><a href="#" className="hover:text-white">Whiteboards</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">Resources</h4>
                        <ul className="space-y-2 text-gray-500">
                            <li><a href="#" className="hover:text-white">Help Center</a></li>
                            <li><a href="#" className="hover:text-white">Blog</a></li>
                            <li><a href="#" className="hover:text-white">Community</a></li>
                            <li><a href="#" className="hover:text-white">Webinars</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">Company</h4>
                        <ul className="space-y-2 text-gray-500">
                            <li><a href="#" className="hover:text-white">About Us</a></li>
                            <li><a href="#" className="hover:text-white">Careers</a></li>
                            <li><a href="#" className="hover:text-white">Press</a></li>
                            <li><a href="#" className="hover:text-white">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-gray-500">
                            <li><a href="#" className="hover:text-white">Privacy</a></li>
                            <li><a href="#" className="hover:text-white">Terms</a></li>
                            <li><a href="#" className="hover:text-white">Security</a></li>
                        </ul>
                    </div>
                </div>
                <div className="text-center text-gray-600 pt-8 border-t border-white/5">
                    <p>© 2024 ClickUp Clone by Gemini. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;