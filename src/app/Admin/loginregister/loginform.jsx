'use client';

import React, { useState, useEffect } from 'react';
import { adminLoginAction } from '@/app/serverActions/loginAction';
import { useRouter } from 'next/navigation';

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
      const response = await adminLoginAction({ email, password });
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
      setError(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00CCFF] to-[#00CCFF] py-6 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-6 bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">
            Admins Login
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Sign in to your admin account
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                placeholder="Enter admin email"
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
                placeholder="Enter password"
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
      </div>
    </div>
  );
}