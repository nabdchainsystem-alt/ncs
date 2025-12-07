import React, { useState } from 'react';
import { authService } from '../services/auth';
import { Loader2, AlertCircle, ArrowLeft, Lock, Mail, ChevronRight, Server } from 'lucide-react';
import { getCompanyName, getLogoUrl } from '../utils/config';
import { setCompanyId } from '../lib/supabase';
import { motion } from 'framer-motion';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverId, setServerId] = useState(''); // Default to blank as requested
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Set the company context before login
      // If serverId is empty or '1', default to 'view-water-factory-54321' ("Local" mode)
      const normalizedId = serverId.trim();
      const targetCompanyId = (normalizedId === '' || normalizedId === '1')
        ? 'view-water-factory-54321'
        : normalizedId;

      setCompanyId(targetCompanyId);

      const user = await authService.login(email, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Invalid email or password. Try max@nabdchain.com / 1');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] px-4 relative overflow-hidden font-sans selection:bg-black selection:text-white perspective-1000">

      {/* Animated Background Grid */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-30%,#ffffff_0%,transparent_100%)]"></div>

        {/* Floating 3D Elements */}
        {/* Abstract 3D Chart */}
        <motion.div
          className="absolute top-[20%] left-[5%] w-64 h-48 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl shadow-2xl transform-gpu"
          style={{ rotateX: 15, rotateY: 15, rotateZ: -5 }}
          animate={{
            y: [0, 20, 0],
            rotateY: [15, 20, 15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="p-4 flex items-end justify-between h-full gap-2 opacity-80">
            {[40, 70, 50, 90, 60].map((h, i) => (
              <div key={i} className="w-full bg-gradient-to-t from-gray-900/20 to-gray-900/5 rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </motion.div>

        {/* Abstract 3D Table */}
        <motion.div
          className="absolute bottom-[20%] right-[5%] w-72 h-56 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl shadow-2xl transform-gpu flex flex-col overflow-hidden"
          style={{ rotateX: 15, rotateY: -15, rotateZ: 5 }}
          animate={{
            y: [0, -20, 0],
            rotateY: [-15, -20, -15],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="h-8 bg-gray-100/50 border-b border-gray-200/50 flex items-center px-3 gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="h-2 w-1/4 bg-gray-200/50 rounded"></div>
                <div className="h-2 w-3/4 bg-gray-100/50 rounded"></div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Abstract 3D Pie Chart - Top Right */}
        <motion.div
          className="absolute top-[15%] right-[10%] w-48 h-48 bg-white/30 backdrop-blur-md border border-white/50 rounded-full shadow-2xl transform-gpu flex items-center justify-center"
          style={{ rotateX: 20, rotateY: -10 }}
          animate={{
            y: [0, 15, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <div className="relative w-32 h-32 rounded-full border-8 border-gray-100/50 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 opacity-60">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="20" className="text-gray-200" strokeDasharray="180 251" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="20" className="text-gray-900" strokeDasharray="60 251" strokeDashoffset="-180" />
            </svg>
          </div>
        </motion.div>

        {/* Abstract Kanban Board - Bottom Left */}
        <motion.div
          className="absolute bottom-[15%] left-[8%] w-64 h-48 bg-white/30 backdrop-blur-md border border-white/50 rounded-xl shadow-2xl transform-gpu flex gap-2 p-3"
          style={{ rotateX: 10, rotateY: 20, rotateZ: -2 }}
          animate={{
            y: [0, -15, 0],
            rotateZ: [-2, 0, -2],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        >
          {[1, 2, 3].map((col) => (
            <div key={col} className="flex-1 bg-gray-50/30 rounded-lg flex flex-col gap-2 p-1">
              <div className="h-1.5 w-1/2 bg-gray-300/50 rounded mb-1"></div>
              {[1, 2].map(card => (
                <div key={card} className="h-8 bg-white/60 rounded shadow-sm border border-white/40"></div>
              ))}
            </div>
          ))}
        </motion.div>

        {/* Network Nodes - Top Center/Left */}
        <motion.div
          className="absolute top-[10%] left-[30%] w-40 h-40 opacity-30 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="2" fill="black" />
            <circle cx="20" cy="20" r="2" fill="black" />
            <circle cx="80" cy="20" r="2" fill="black" />
            <circle cx="20" cy="80" r="2" fill="black" />
            <circle cx="80" cy="80" r="2" fill="black" />
            <line x1="50" y1="50" x2="20" y2="20" stroke="black" strokeWidth="0.5" />
            <line x1="50" y1="50" x2="80" y2="20" stroke="black" strokeWidth="0.5" />
            <line x1="50" y1="50" x2="20" y2="80" stroke="black" strokeWidth="0.5" />
            <line x1="50" y1="50" x2="80" y2="80" stroke="black" strokeWidth="0.5" />
          </svg>
        </motion.div>

        {/* Floating Geometric Shapes (Subtle) */}
        <motion.div
          className="absolute top-[15%] right-[20%] w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full blur-2xl opacity-40"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
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
        className="bg-white/70 backdrop-blur-2xl p-10 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] w-full max-w-[440px] z-10 border border-white/50 relative"
      >
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-white/80 to-transparent rounded-tl-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-white/80 to-transparent rounded-br-[2rem] pointer-events-none" />

        <div className="text-center mb-10 relative">
          <motion.div
            className="w-40 h-40 flex items-center justify-center mx-auto mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            {getLogoUrl() ? (
              <img src={getLogoUrl()!} alt={getCompanyName()} className="w-full h-full object-contain p-4" />
            ) : (
              <img src="/nabd-logo-dark.svg" alt="NABD Chain" className="w-full h-full object-contain p-2" />
            )}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-black tracking-tight"
          >
            Welcome back
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 text-sm mt-3 font-medium"
          >
            Enter your credentials to access your workspace.
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-5">
            <div className="relative group">
              <label
                className={`absolute transition-all duration-200 pointer-events-none z-10 ${serverId
                  ? 'left-4 -top-2.5 text-xs bg-[#f8f9fa] border border-gray-100 px-1 text-black font-bold rounded'
                  : 'left-12 top-4 text-gray-400 text-sm'
                  }`}
              >
                Server ID / Company Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serverId}
                  onChange={(e) => setServerId(e.target.value)}
                  onFocus={() => setFocusedInput('server')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-gray-900 font-medium placeholder-transparent"
                  placeholder=""
                  required
                />
                <Server className={`absolute left-4 top-4 transition-colors duration-200 ${focusedInput === 'server' ? 'text-black' : 'text-gray-400'}`} size={20} />
              </div>
            </div>

            <div className="relative group">
              <label
                className={`absolute transition-all duration-200 pointer-events-none z-10 ${email
                  ? 'left-4 -top-2.5 text-xs bg-[#f8f9fa] border border-gray-100 px-1 text-black font-bold rounded'
                  : 'left-12 top-4 text-gray-400 text-sm'
                  }`}
              >
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
              <label
                className={`absolute transition-all duration-200 pointer-events-none z-10 ${password
                  ? 'left-4 -top-2.5 text-xs bg-[#f8f9fa] border border-gray-100 px-1 text-black font-bold rounded'
                  : 'left-12 top-4 text-gray-400 text-sm'
                  }`}
              >
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
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-8 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center">
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Sign In'}
              {!isLoading && <ChevronRight className="ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" size={18} />}
            </span>
            <div className="absolute inset-0 bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>


        </form>

        <div className="mt-8 text-center">
          <a href="#" className="text-xs font-semibold text-gray-400 hover:text-black transition-colors relative group">
            Forgot your password?
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-10 text-center text-xs font-medium text-gray-400 z-10"
      >
        &copy; {new Date().getFullYear()} {getCompanyName()}. Secure Login.
      </motion.div>
    </div>
  );
};

export default LoginPage;