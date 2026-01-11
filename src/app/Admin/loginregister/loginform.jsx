'use client';

import React, { useState, useEffect } from 'react';
import { adminLoginAction } from '@/app/serverActions/loginAction';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // IMMEDIATE session termination - clear everything on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear localStorage immediately
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      localStorage.removeItem('adminModules');
      localStorage.removeItem('supportModules');

      // Prevent forward button from accessing protected pages
      window.history.pushState(null, '', window.location.href);
      const handlePopState = (event) => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      console.log('Attempting admin login...');
      const response = await adminLoginAction({ email, password });
      console.log('Login response:', response);

      if (!response?.success) {
        setError(response?.message || 'Login failed');
        setLoading(false);
        return;
      }

      const user = response.user;
      const username = user.username || user.email || 'Admin';

      // Check if user has one of the allowed roles
      const allowedRoles = ['superadmin', 'admin', 'support', 'other'];
      if (!allowedRoles.includes(user.role)) {
        setError('Access denied. Invalid role.');
        setLoading(false);
        return;
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', username);

      // Dispatch event to notify other components
      window.dispatchEvent(new Event('userLoggedIn'));

      router.push('/Admin');
    } catch (err) {
      console.error('Login Error:', err);
      setError(err?.message || 'An error occurred during login');
    } finally {
      if (!document.hidden) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-slate-50 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] opacity-70" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[100px] opacity-70" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] z-10 px-4"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 sm:p-10">

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6"
            >
              <ShieldCheck className="w-8 h-8 text-white" strokeWidth={2} />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Portal</h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Authentication required to access dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50/90 border border-red-100 rounded-xl p-3 flex items-start gap-3 overflow-hidden"
              >
                <div className="p-1 bg-red-100 rounded-full shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-sm text-red-600 font-medium pt-0.5">{error}</p>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-sm font-medium"
                  placeholder="Username or Email"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-sm font-medium"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-400 font-medium">
              Rights Diagnostics • Secure System
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}