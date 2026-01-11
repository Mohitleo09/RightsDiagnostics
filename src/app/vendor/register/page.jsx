'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, ArrowRight, Loader2, AlertCircle, CheckCircle2, Building2, Store } from 'lucide-react';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans py-4">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-slate-50 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] opacity-70" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[100px] opacity-70" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[550px] z-10 px-4"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-6 sm:p-8">

          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4"
            >
              <Building2 className="w-6 h-6 text-white" strokeWidth={2} />
            </motion.div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Vendor Registration</h2>
            <p className="text-slate-500 mt-1 text-xs font-medium">Join our network of trusted laboratories</p>
          </div>

          {registrationSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-green-50/80 border border-green-100 p-6 text-center shadow-sm"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-800 mb-2">Registration Successful!</h3>
              <div className="text-sm text-green-700 space-y-2 mb-6">
                <p>Your vendor account has been created and is pending admin approval.</p>
                <p>You will receive an email notification once your account is verified.</p>
              </div>
              <Link href="/vendor/login">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl transition-colors shadow-lg shadow-green-600/20 text-sm">
                  Return to Login
                </button>
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50/90 border border-red-100 rounded-lg p-2.5 flex items-start gap-2.5 overflow-hidden"
                >
                  <div className="p-0.5 bg-red-100 rounded-full shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <div className="text-xs text-red-600 font-medium pt-0.5">{error}</div>
                </motion.div>
              )}

              <div className="space-y-3">
                {/* Row 1: Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="lab-name"
                      name="labName"
                      type="text"
                      required
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                      className="w-full py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all duration-200 text-xs font-medium"
                      placeholder="Laboratory Name"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="vendor-name"
                      name="vendorName"
                      type="text"
                      required
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="w-full py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all duration-200 text-xs font-medium"
                      placeholder="Contact Person"
                    />
                  </div>
                </div>

                {/* Row 2: Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all duration-200 text-xs font-medium"
                      placeholder="Email Address"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all duration-200 text-xs font-medium"
                      placeholder="Phone Mobile"
                    />
                  </div>
                </div>

                {/* Row 3: Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all duration-200 text-xs font-medium"
                      placeholder="Password"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all duration-200 text-xs font-medium"
                      placeholder="Confirm Password"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Register Laboratory</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400 font-medium mb-2">
              Already have an account?
            </p>
            <Link href="/vendor/login" className="inline-flex items-center justify-center text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all">
              Sign in to Vendor Portal
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}