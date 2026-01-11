'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Calendar, CreditCard, IndianRupee, User, Ticket, FileText } from 'lucide-react'
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

const WalletPage = () => {
  const [userName, setUserName] = useState('User')
  const [walletBalance, setWalletBalance] = useState(0)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // Get user info and wallet balance from database
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
          // Fetch wallet balance and transactions from API
          const queryParam = storedPhone
            ? `phone=${encodeURIComponent(storedPhone)}`
            : `email=${encodeURIComponent(storedEmail)}`;

          const response = await fetch(`/api/wallet?${queryParam}`);
          const data = await safeJsonParse(response);

          if (data.success) {
            setWalletBalance(data.walletBalance || 0);
            setTransactions(data.transactions || []);
          } else {
            console.error('Failed to fetch wallet data:', data.error);
            // No fallback to localStorage to ensure database usage
            setWalletBalance(0);
            setTransactions([]);
          }
        } catch (error) {
          console.error('Error fetching wallet data:', error);
          // No fallback to localStorage to ensure database usage
          setWalletBalance(0);
          setTransactions([]);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleAddMoney = async () => {
    if (addAmount && parseInt(addAmount) > 0) {
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
          amount: parseInt(addAmount)
        };

        if (storedPhone) {
          requestBody.phone = storedPhone;
        } else if (storedEmail) {
          requestBody.email = storedEmail;
        }

        // Call API to add money to wallet
        const response = await fetch('/api/wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await safeJsonParse(response);

        if (data.success) {
          setWalletBalance(data.walletBalance);

          // Update localStorage as backup
          if (typeof window !== 'undefined') {
            localStorage.setItem('walletBalance', data.walletBalance.toString());
          }

          setAddAmount('');
          setShowAddMoney(false);
          console.log(`Added ₹${addAmount} to wallet. New balance: ₹${data.walletBalance}`);
        } else {
          console.error('Failed to add money:', data.error);
          alert('Failed to add money to wallet. Please try again.');
        }
      } catch (error) {
        console.error('Error adding money:', error);
        alert('Failed to add money to wallet. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000]



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
                <div className="text-[14px] text-gray-700">Manage your wallet</div>
              </div>
            </div>

            <div className="space-y-3">
              <SidebarItem icon={<User className="w-5 h-5" />} label="Profile settings" href="/Patients/Dashboard" />
              <SidebarItem icon={<Calendar className="w-5 h-5" />} label="Upcoming Appointments" href="/Patients/Dashboard/upcoming" />
              <SidebarItem icon={<Wallet className="w-5 h-5" />} label="Digital Wallet Balance" href="/Patients/Dashboard/wallet" active />
              <SidebarItem icon={<Ticket className="w-5 h-5" />} label="Membership Packages" href="/Patients/Dashboard/membership" />
              <SidebarItem icon={<FileText className="w-5 h-5" />} label="Health history" href="/Patients/Dashboard/Healthhistory" />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 md:p-6">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">Wallet</h1>

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 mb-8 border border-blue-200">
              <div className="text-center">
                <p className="text-gray-600 text-lg mb-2">Available Balance</p>
                <div className="flex items-center justify-center mb-4">
                  <IndianRupee className="w-8 h-8 text-[#0052FF] mr-2" />
                  <span className="text-4xl font-bold text-gray-900">{walletBalance}</span>
                </div>
                <button
                  onClick={() => setShowAddMoney(true)}
                  className="bg-[#0052FF] text-white px-6 py-3 rounded-lg hover:bg-[#0052FF] transition-colors flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Add Money
                </button>
              </div>
            </div>

            {/* Add Money Modal */}
            {showAddMoney && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Add Money to Wallet</h3>
                    <button
                      onClick={() => setShowAddMoney(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter Amount</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">Quick Add</p>
                    <div className="grid grid-cols-3 gap-2">
                      {quickAmounts.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setAddAmount(amount.toString())}
                          className="py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          ₹{amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAddMoney(false)}
                      className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMoney}
                      disabled={!addAmount || parseInt(addAmount) <= 0}
                      className="flex-1 py-3 bg-[#0052FF] text-white rounded-lg font-medium hover:bg-[#0052FF] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Add Money
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction History</h2>

              {transactions.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date & Time</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Description</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Amount</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-900">
                            <div>{formatDate(transaction.createdAt)}</div>
                            <div className="text-gray-500 text-xs">{formatTime(transaction.createdAt)}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {transaction.description}
                            {transaction.referenceId && (
                              <div className="text-gray-500 text-xs">Ref: {transaction.referenceId}</div>
                            )}
                          </td>
                          <td className={`px-4 py-4 text-sm font-semibold text-right ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {transaction.type === 'credit' ? '+' : '-'}₹{Math.abs(transaction.amount)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center">
                              {transaction.type === 'credit' ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <ArrowDownLeft className="w-4 h-4" />
                                  <span className="text-xs font-medium">Credit</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-red-600">
                                  <ArrowUpRight className="w-4 h-4" />
                                  <span className="text-xs font-medium">Debit</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default WalletPage