import React, { useState } from 'react';
import { Loader2, AlertCircle, ArrowLeft, Lock, Mail, ChevronRight, User } from 'lucide-react';
import { getCompanyName, getLogoUrl } from '../utils/config';
import { motion } from 'framer-motion';
import { authService } from '../services/auth';

interface SignUpPageProps {
    onSignUpSuccess: (user: any) => void;
    onBack: () => void;
    onLogin: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUpSuccess, onBack, onLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // For now, treating as success and logging in with a mock user object
            onSignUpSuccess({
                id: `new-${Date.now()}`,
                name: name,
                email: email,
                role: 'Admin', // Default to Admin for now as requested
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
            });

        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] px-4 relative overflow-hidden font-sans selection:bg-black selection:text-white perspective-1000">

            {/* Animated Background Grid - Same as Login */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-30%,#ffffff_0%,transparent_100%)]"></div>
                {/* Simplified background elements for SignUp to avoid clutter */}
                <motion.div
                    className="absolute top-[10%] right-[10%] w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl opacity-60"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-gradient-to-tr from-gray-100 to-blue-50 rounded-full blur-3xl opacity-60"
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 12, repeat: Infinity, delay: 1 }}
                />
            </div>

            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                onClick={onBack}
                className="absolute top-8 left-8 flex items-center text-gray-500 hover:text-black z-10 transition-colors font-medium text-sm group"
            >
                <div className="p-2 bg-white rounded-full shadow-sm border border-gray-200 mr-3 group-hover:border-black transition-all group-hover:scale-110">
                    <ArrowLeft size={16} />
                </div>
                <span className="opacity-70 group-hover:opacity-100 transition-opacity">Back to Home</span>
            </motion.button>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-white/70 backdrop-blur-2xl p-10 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] w-full max-w-[480px] z-10 border border-white/50 relative"
            >
                <div className="text-center mb-8">
                    <motion.div
                        className="w-20 h-20 bg-black rounded-2xl mx-auto mb-6 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-black/10"
                        whileHover={{ rotate: 10, scale: 1.05 }}
                    >
                        N
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl font-bold text-black tracking-tight"
                    >
                        Create Account
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-500 text-sm mt-3 font-medium"
                    >
                        Join Nabd Chain System today.
                    </motion.p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Social Auth Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => authService.loginWithProvider('google')}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm group"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span className="text-sm font-semibold text-gray-700 group-hover:text-black">Google</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => authService.loginWithProvider('apple')}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm group"
                        >
                            <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.56-2.09-.48-3.08 0-1.44.7-2.92.51-4.25-1.57-2.76-4.33.24-9.33 4.97-9.33 1.45 0 2.65.65 3.51.65.86 0 2.21-.76 3.86-.65 1.28.08 2.39.46 3.14 1.25-2.76 1.43-2.3 5.48.45 6.64-.67 1.76-1.57 3.32-2.52 4.66zM12.03 7.25c-.21-2.91 2.36-5.25 5.09-5.25.26 3.12-3.17 5.42-5.09 5.25z" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-700 group-hover:text-black">Apple</span>
                        </button>
                    </div>
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#f8f9fa] text-gray-400">Or continue with email</span>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start"
                        >
                            <AlertCircle size={18} className="mr-3 mt-0.5 shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <div className="relative group">
                        <label className={`absolute transition-all duration-200 pointer-events-none z-10 ${name ? 'left-4 -top-2.5 text-xs bg-[#f8f9fa] border border-gray-100 px-1 text-black font-bold rounded' : 'left-12 top-4 text-gray-400 text-sm'}`}>
                            Full Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onFocus={() => setFocusedInput('name')}
                                onBlur={() => setFocusedInput(null)}
                                className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-gray-900 font-medium placeholder-transparent"
                                placeholder=""
                                required
                            />
                            <User className={`absolute left-4 top-4 transition-colors duration-200 ${focusedInput === 'name' ? 'text-black' : 'text-gray-400'}`} size={20} />
                        </div>
                    </div>

                    <div className="relative group">
                        <label className={`absolute transition-all duration-200 pointer-events-none z-10 ${email ? 'left-4 -top-2.5 text-xs bg-[#f8f9fa] border border-gray-100 px-1 text-black font-bold rounded' : 'left-12 top-4 text-gray-400 text-sm'}`}>
                            Email Address
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setFocusedInput('email')}
                                onBlur={() => setFocusedInput(null)}
                                className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-gray-900 font-medium placeholder-transparent"
                                placeholder=""
                                required
                            />
                            <Mail className={`absolute left-4 top-4 transition-colors duration-200 ${focusedInput === 'email' ? 'text-black' : 'text-gray-400'}`} size={20} />
                        </div>
                    </div>

                    <div className="relative group">
                        <label className={`absolute transition-all duration-200 pointer-events-none z-10 ${password ? 'left-4 -top-2.5 text-xs bg-[#f8f9fa] border border-gray-100 px-1 text-black font-bold rounded' : 'left-12 top-4 text-gray-400 text-sm'}`}>
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedInput('password')}
                                onBlur={() => setFocusedInput(null)}
                                className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-gray-900 font-medium placeholder-transparent"
                                placeholder=""
                                required
                            />
                            <Lock className={`absolute left-4 top-4 transition-colors duration-200 ${focusedInput === 'password' ? 'text-black' : 'text-gray-400'}`} size={20} />
                        </div>
                    </div>

                    <div className="relative group">
                        <label className={`absolute transition-all duration-200 pointer-events-none z-10 ${confirmPassword ? 'left-4 -top-2.5 text-xs bg-[#f8f9fa] border border-gray-100 px-1 text-black font-bold rounded' : 'left-12 top-4 text-gray-400 text-sm'}`}>
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onFocus={() => setFocusedInput('confirmPassword')}
                                onBlur={() => setFocusedInput(null)}
                                className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-gray-900 font-medium placeholder-transparent"
                                placeholder=""
                                required
                            />
                            <Lock className={`absolute left-4 top-4 transition-colors duration-200 ${focusedInput === 'confirmPassword' ? 'text-black' : 'text-gray-400'}`} size={20} />
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02, translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-4 group relative overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center">
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Get Started'}
                            {!isLoading && <ChevronRight className="ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" size={18} />}
                        </span>
                        <div className="absolute inset-0 bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>

                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <button onClick={onLogin} className="font-bold text-black hover:underline">
                        Sign In
                    </button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-10 text-center text-xs font-medium text-gray-400 z-10"
            >
                &copy; {new Date().getFullYear()} {getCompanyName()}. Secure Registration.
            </motion.div>
        </div>
    );
};

export default SignUpPage;
