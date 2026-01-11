'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin' // Default role
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }
      
      // Show success message
      setSuccess(true);
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push('/Admin/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00CCFF] to-[#00CCFF] py-6 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-6 bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">
            Admin Registration
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Create your admin account
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-2 border border-red-100">
              <div className="text-xs text-red-600 text-center">{error}</div>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-2 border border-green-100">
              <div className="text-xs text-green-600 text-center">Registration successful! Redirecting to login...</div>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition"
                placeholder="Enter username"
              />
            </div>
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
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition"
                placeholder="Enter admin email"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-xs font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition"
              >
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="support">Support</option>
              </select>
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition"
                placeholder="Enter password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-xs font-medium text-white bg-[#0052FF] hover:bg-[#0052FF] focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#007AFF] disabled:opacity-70 transition duration-200"
            >
              {loading ? 'Registering...' : success ? 'Redirecting...' : 'Register'}
            </button>
          </div>
        </form>
        <div className="text-center text-xs text-gray-600">
          Already have an account?{' '}
          <button 
            onClick={() => router.push('/Admin/login')}
            className="text-[#0052FF] hover:text-[#0052FF] font-medium"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}