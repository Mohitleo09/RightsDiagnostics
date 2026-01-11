'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VendorRegisterPage() {
  const [labName, setLabName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!labName || !vendorName || !email || !phoneNumber || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate phone number format (10 digits, Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setLoading(true);

    try {
      // Check if vendor already exists - use the vendors API endpoint instead of users
      const checkRes = await fetch('/api/vendors?email=' + encodeURIComponent(email), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.success && checkData.vendor) {
          setError('Vendor with this email already exists');
          setLoading(false);
          return;
        }
      }

      // Register the vendor - send email as both email and contactEmail, vendorName as both username and ownerName
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labName,
          username: vendorName,
          email,
          password,
          ownerName: vendorName, // Use vendorName as ownerName
          contactEmail: email,   // Use email as contactEmail
          phone: phoneNumber,    // Add phone number
          role: 'vendor'
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Registration successful - show success message instead of redirecting
      setRegistrationSuccess(true);
      // Reset form fields
      setLabName('');
      setVendorName('');
      setEmail('');
      setPhoneNumber('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00CCFF] to-[#00CCFF] py-6 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-6 bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">
            Vendor Registration
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Create an account for your lab
          </p>
        </div>
        
        {registrationSuccess ? (
          <div className="rounded-md bg-green-50 p-4 border border-green-100">
            <div className="text-xs text-green-600 text-center">
              <h3 className="font-bold text-green-800 mb-2">Registration Successful!</h3>
              <p className="mb-2">Your vendor account has been created and is pending admin approval.</p>
              <p className="mb-2">You will receive an email notification once your account is approved.</p>
              <p className="mb-3 font-semibold">Note: You will not be able to login until your account is approved by an administrator.</p>
              <Link href="/vendor/login" className="font-medium text-green-700 hover:text-green-800">
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-2 border border-red-100">
                <div className="text-xs text-red-600 text-center">{error}</div>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label htmlFor="lab-name" className="block text-xs font-medium text-gray-700 mb-1">
                  Lab Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lab-name"
                  name="labName"
                  type="text"
                  required
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition"
                  placeholder="Enter your lab name"
                />
              </div>
              <div>
                <label htmlFor="vendor-name" className="block text-xs font-medium text-gray-700 mb-1">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="vendor-name"
                  name="vendorName"
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition"
                  placeholder="Enter your vendor name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
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
                <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition"
                  placeholder="Enter your 10-digit phone number"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition"
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-xs font-medium text-white bg-[#0052FF] hover:bg-[#0052FF] focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#007AFF] disabled:opacity-70 transition duration-200"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
        )}
        
        <div className="text-center pt-3">
          <p className="text-xs text-gray-600">
            Already have an account?{' '}
            <Link href="/vendor/login" className="font-medium text-[#0052FF] hover:text-[#0052FF] transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}