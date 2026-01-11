'use client';

import React, { useState, useEffect } from 'react';
import { loginAction } from '@/app/serverActions/loginAction';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function VendorLoginPage() {
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
      window.addEventListener('popstate', function (event) {
        window.history.pushState(null, '', window.location.href);
      });
    }

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

      // Add a small delay to ensure session is fully established
      setTimeout(() => {
        router.push('/vendor');
      }, 100);
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00CCFF] to-[#00CCFF] py-6 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-6 bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">
            Vendor Login
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Sign in to your vendor account
          </p>
        </div>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-2 border border-red-100">
              <div className="text-xs text-red-600 text-center">{error}</div>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition"
                placeholder="Enter your email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-xs font-medium text-white bg-[#0052FF] hover:bg-[#0052FF] focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#007AFF] disabled:opacity-70 transition duration-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
        <div className="text-center pt-3">
          <p className="text-xs text-gray-600">
            Don't have an account?{' '}
            <Link href="/vendor/register" className="font-medium text-[#0052FF] hover:text-[#0052FF] transition">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}