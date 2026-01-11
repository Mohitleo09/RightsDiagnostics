'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, Star, Crown, Shield, Mail, Phone, Home, FileText, Calendar, Zap, Clock, X, User, Wallet, Ticket } from 'lucide-react'
import { safeJsonParse } from '../../../utils/apiUtils'
import Navbar from '../../page'
import Footer from '../../Footer/page'

// Sidebar components matching the main dashboard


const SidebarItem = ({ icon, label, href, active }) => (
  <Link href={href || '#'} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border transition-all ${active
    ? 'border-[#007AFF] bg-blue-50 shadow-[inset_4px_0_0_0_#007AFF]'
    : 'border-gray-200 hover:bg-gray-50'
    }`}>
    <span className="inline-flex items-center justify-center w-6 h-6">{icon}</span>
    <span className={`text-[15px] font-semibold ${active ? 'text-gray-900' : 'text-gray-800'}`}>{label}</span>
  </Link>
);

const MembershipPage = () => {
  const [userName, setUserName] = useState('User')
  const [currentPlan, setCurrentPlan] = useState('free')
  const [expiryDate, setExpiryDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Get user info and membership plan from database
  useEffect(() => {
    const fetchUserData = async () => {
      if (typeof window !== 'undefined') {
        const storedUserName = localStorage.getItem('userName') || 'User';
        setUserName(storedUserName);

        // Get user identifier
        const storedPhone = localStorage.getItem('userPhone');
        const storedEmail = localStorage.getItem('userEmail');

        if (!storedPhone && !storedEmail) {
          console.log('No user identifier found');
          setLoading(false);
          return;
        }

        try {
          // Fetch membership plan from API
          const queryParam = storedPhone
            ? `phone=${encodeURIComponent(storedPhone)}`
            : `email=${encodeURIComponent(storedEmail)}`;

          const response = await fetch(`/api/membership?${queryParam}`);
          const data = await safeJsonParse(response);

          if (data.success) {
            setCurrentPlan(data.membershipPlan || 'free');
            setExpiryDate(data.membershipExpiry);
          } else {
            console.error('Failed to fetch membership plan:', data.error);
            // No fallback to localStorage to ensure database usage
            setCurrentPlan('free');
          }
        } catch (error) {
          console.error('Error fetching membership plan:', error);
          // No fallback to localStorage to ensure database usage
          setCurrentPlan('free');
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const membershipPlans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: '',
      color: 'gray',
      icon: <Shield className="w-6 h-6" />,
      features: [
        'Basic search',
        'Standard booking',
        'Email notifications'
      ],
      isCurrentPlan: currentPlan === 'free'
    },
    {
      id: 'silver',
      name: 'Silver',
      price: '₹499',
      period: '/year',
      color: 'gray',
      icon: <Star className="w-6 h-6" />,
      features: [
        '5% extra discount on all tests',
        'Priority booking',
        'SMS + Email alerts',
        'Free home sample collection once per month'
      ],
      isCurrentPlan: currentPlan === 'silver'
    },
    {
      id: 'gold',
      name: 'Gold',
      price: '₹999',
      period: '/year',
      color: 'yellow',
      icon: <Crown className="w-6 h-6" />,
      features: [
        '10% extra discount on all tests',
        'Priority support',
        'Unlimited home collection',
        'Health reports storage',
        'Telehealth consultation credits (₹500/month)'
      ],
      isCurrentPlan: currentPlan === 'gold'
    }
  ];

  const handleUpgrade = async (planId) => {
    if (planId === currentPlan) return;

    try {
      // Get user identifier
      const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('userPhone') : '';
      const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : '';

      if (!storedPhone && !storedEmail) {
        alert('User not logged in');
        return;
      }

      // Prepare request body
      const requestBody = {
        plan: planId
      };

      if (storedPhone) {
        requestBody.phone = storedPhone;
      } else if (storedEmail) {
        requestBody.email = storedEmail;
      }

      // Call API to update membership plan
      const response = await fetch('/api/membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await safeJsonParse(response);

      if (data.success) {
        setCurrentPlan(planId);
        setExpiryDate(data.membershipExpiry);

        // Update localStorage as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('membershipPlan', planId);
        }

        console.log(`Upgraded to ${planId} plan`);
      } else {
        console.error('Failed to upgrade membership:', data.error);
        alert('Failed to upgrade membership. Please try again.');
      }
    } catch (error) {
      console.error('Error upgrading membership:', error);
      alert('Failed to upgrade membership. Please try again.');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      // Get user identifier
      const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('userPhone') : '';
      const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : '';

      if (!storedPhone && !storedEmail) {
        alert('User not logged in');
        return;
      }

      // Prepare query parameters
      const queryParam = storedPhone
        ? `phone=${encodeURIComponent(storedPhone)}`
        : `email=${encodeURIComponent(storedEmail)}`;

      // Call API to cancel membership
      const response = await fetch(`/api/membership?${queryParam}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await safeJsonParse(response);

      if (data.success) {
        setCurrentPlan('free');
        setExpiryDate(null);
        setShowCancelModal(false);

        // Update localStorage as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('membershipPlan', 'free');
        }

        alert('Membership canceled successfully. Your plan has been downgraded to Free.');
      } else {
        console.error('Failed to cancel membership:', data.error);
        alert('Failed to cancel membership. Please try again.');
      }
    } catch (error) {
      console.error('Error canceling membership:', error);
      alert('Failed to cancel membership. Please try again.');
    }
  };

  const getPlanCardStyle = (plan) => {
    if (plan.isCurrentPlan) {
      return 'ring-2 ring-[#007AFF] bg-blue-50 shadow-md relative transform scale-[1.02]';
    }
    if (plan.color === 'yellow') {
      return 'border border-yellow-200 bg-yellow-50/50 hover:border-yellow-300 hover:shadow-md';
    }
    return 'border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md';
  };

  const getButtonStyle = (plan) => {
    if (plan.isCurrentPlan) {
      return 'bg-gray-100 text-gray-600 cursor-not-allowed';
    }
    if (plan.color === 'yellow') {
      return 'bg-yellow-500 text-white hover:bg-yellow-600';
    }
    return 'bg-[#0052FF] text-white hover:bg-[#0052FF]';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };



  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 w-full bg-white px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
          {/* Left Sidebar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 md:p-6">
            <div className="flex items-start gap-4 rounded-xl border border-[#00A3FF] bg-[#00CCFF] p-4 mb-5">
              <div className="flex-1">
                <div className="text-[17px] font-extrabold text-gray-900">{userName}</div>
                <div className="text-[14px] text-gray-700 leading-snug">User Dashboard</div>
                <div className="text-[14px] text-gray-700">Manage your membership</div>
              </div>
            </div>

            <div className="space-y-3">
              <SidebarItem icon={<User className="w-5 h-5" />} label="Profile settings" href="/Patients/Dashboard" />
              <SidebarItem icon={<Calendar className="w-5 h-5" />} label="Upcoming Appointments" href="/Patients/Dashboard/upcoming" />
              <SidebarItem icon={<Wallet className="w-5 h-5" />} label="Digital Wallet Balance" href="/Patients/Dashboard/wallet" />
              <SidebarItem icon={<Ticket className="w-5 h-5" />} label="Membership Packages" href="/Patients/Dashboard/membership" active />
              <SidebarItem icon={<FileText className="w-5 h-5" />} label="Health history" href="/Patients/Dashboard/Healthhistory" />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 md:p-6">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Upgrade Your Membership</h1>
            <p className="text-gray-500 font-medium mb-8">Choose the plan that best fits your healthcare needs</p>

            {/* Expiry Information */}
            {currentPlan !== 'free' && expiryDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-blue-800 font-medium">Your {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} membership is active</p>
                    <p className="text-blue-600 text-sm">Expires on: {formatDate(expiryDate)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel Subscription
                </button>
              </div>
            )}

            {/* Membership Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {membershipPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-xl p-4 transition-all duration-300 hover:shadow-lg ${getPlanCardStyle(plan)}`}
                >
                  {/* Current Plan Badge */}
                  {plan.isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#0052FF] text-white px-4 py-1 rounded-full text-sm font-medium">
                        {plan.id === 'free' ? 'Current Plan' : 'Your Plan'}
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${plan.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {plan.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                    <div className="flex items-baseline justify-center">
                      <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                      {plan.period && <span className="text-gray-600 ml-1 text-sm">{plan.period}</span>}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 mb-5">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Upgrade Button */}
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={plan.isCurrentPlan}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${getButtonStyle(plan)}`}
                  >
                    {plan.isCurrentPlan ? (plan.id === 'free' ? 'Current Plan' : 'Your Active Plan') : 'Upgrade Now'}
                  </button>
                </div>
              ))}
            </div>

            {/* Benefits Information */}
            <div className="mt-8 bg-white rounded-xl p-6 border border-blue-50 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Membership Benefits
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                All users can access basic features. Premium membership plans unlock additional benefits:
              </p>
              <ul className="space-y-1">
                <li className="flex items-start text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5 mr-2" />
                  <span>Free plan: Basic search, standard booking, email notifications</span>
                </li>
                <li className="flex items-start text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5 mr-2" />
                  <span>Silver plan: 5% discount on all tests, priority booking, SMS alerts</span>
                </li>
                <li className="flex items-start text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5 mr-2" />
                  <span>Gold plan: 10% discount on all tests, unlimited home collection, priority support</span>
                </li>
              </ul>
              <p className="text-gray-600 text-xs mt-3">
                Memberships automatically expire after 1 year and revert to the free plan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Cancel Subscription</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to cancel your {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} membership?
              </p>
              <p className="text-gray-600 text-sm mb-4">
                You will lose access to all premium benefits and your plan will be downgraded to Free immediately.
                This action cannot be undone.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm font-medium">
                  Note: You will continue to have access to your benefits until {formatDate(expiryDate)}.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Keep Membership
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default MembershipPage