import React, { useState } from 'react';
import { authService } from '../services/auth';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { getCompanyName, getLogoUrl } from '../utils/config';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8f9] px-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-brand-primary skew-y-3 origin-top-left transform -translate-y-20 z-0"></div>

      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center text-white z-10 hover:opacity-80 transition-opacity font-medium"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Home
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-transparent rounded-xl flex items-center justify-center mx-auto mb-4">
            {getLogoUrl() ? (
              <img src={getLogoUrl()!} alt={getCompanyName()} className="w-full h-full object-contain" />
            ) : (
              <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome to {getCompanyName()}</h2>
          <p className="text-gray-500 text-sm mt-2">Enter your credentials to access your workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-gray-800"
              placeholder="name@work-email.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-gray-800"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          {/* Hint removed for security and multi-tenancy */}
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-400 z-10">
        &copy; {new Date().getFullYear()} {getCompanyName()}. Secure Login.
      </div>
    </div>
  );
};

export default LoginPage;