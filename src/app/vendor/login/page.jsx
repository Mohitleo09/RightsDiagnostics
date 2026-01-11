'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { loginAction } from '@/app/serverActions/loginAction';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Building2 } from 'lucide-react';

function VendorLoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    // IMMEDIATE session termination - clear everything first (FAST)
    if (typeof window !== 'undefined') {
      // Clear localStorage immediately
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      localStorage.removeItem('vendorData');

      // Prevent forward button from accessing protected pages
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  useEffect(() => {
    // Only sign out if there's an authenticated session
    // Don't do anything if status is "loading" or "unauthenticated"
    if (status === 'authenticated' && session) {
      console.log('Active session detected on vendor login page. Signing out...');
      signOut({ redirect: false }).then(() => {
        console.log('Signed out successfully');
      });
    }
  }, [session, status]);

  useEffect(() => {
    // Check for error parameter in URL
    const errorParam = searchParams.get('error');
    if (errorParam === 'not_approved') {
      setError('Your account is not yet approved. Please wait for admin approval.');
    } else if (errorParam === 'access_denied') {
      setError('Access denied. This area is for vendors only.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await loginAction({ email, password });
      if (!response?.success) {
        setError(response?.message || 'Login failed');
        setLoading(false);
        return;
      }

      const user = response.user;
      const isVendor = user?.role === 'vendor';
      if (!isVendor) {
        setError('Access denied. Vendors only.');
        setLoading(false);
        return;
      }

      // Check if vendor is approved
      if (user.approvalStatus !== 'approved') {
        setError('Your account is not yet approved. Please wait for admin approval.');
        setLoading(false);
        return;
      }

      // For database authentication, we don't store user data in localStorage
      // Instead, we rely on the session cookie managed by NextAuth
      // But we still need to trigger the userLoggedIn event
      window.dispatchEvent(new Event('userLoggedIn'));

      // Redirect immediately
      router.push('/vendor');
    } catch (err) {
      console.error('Login error:', err);
      // Check if it's a vendor approval error
      if (err?.message === 'Your account is not yet approved. Please wait for admin approval.') {
        setError(err.message);
      } else if (err?.cause?.message === 'Your account is not yet approved. Please wait for admin approval.') {
        setError(err.cause.message);
      } else {
        setError(err?.message || 'An error occurred during login');
      }
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
              <Building2 className="w-8 h-8 text-white" strokeWidth={2} />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Vendor Portal</h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Secure login for laboratory partners</p>
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
                <div className="text-sm text-red-600 font-medium pt-0.5">{error}</div>
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
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-sm font-medium"
                  placeholder="name@company.com"
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
                  <span>Authenticating...</span>
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
            <p className="text-xs text-slate-400 font-medium mb-3">
              Don't have an account?
            </p>
            <Link href="/vendor/register" className="inline-flex items-center justify-center text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all">
              Register New Laboratory
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VendorLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VendorLoginPageContent />
    </Suspense>
  );
}