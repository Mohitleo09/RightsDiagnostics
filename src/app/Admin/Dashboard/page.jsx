'use client';

import React, { useState, useEffect } from 'react';
import { safeJsonParse } from '../../utils/apiUtils';
import {
  Users,
  CalendarCheck,
  TestTube2,
  Building2,
  TrendingUp,
  Activity,
  ArrowRight,
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react';

const Dashboard = () => {
  // State for metrics & list data
  const [metrics, setMetrics] = useState({
    totalVendors: 0,
    totalTests: 0,
    totalBookings: 0,
    totalUsers: 0
  });

  const [recentVendors, setRecentVendors] = useState([]);
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real-time data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Counts
        const [vendorsCountRes, testsCountRes, usersCountRes, bookingsCountRes] = await Promise.all([
          fetch('/api/vendors/count'),
          fetch('/api/tests/count?showAll=true'),
          fetch('/api/users/count'),
          fetch('/api/bookings/count')
        ]);

        const vendorsCountData = await safeJsonParse(vendorsCountRes);
        const testsCountData = await safeJsonParse(testsCountRes);
        const usersCountData = await safeJsonParse(usersCountRes);
        const bookingsCountData = await safeJsonParse(bookingsCountRes);

        // 2. Fetch Lists for "Recent Activity"
        // Note: Assuming these endpoints exist and return arrays. If they return large datasets, pagination should ideally be used.
        // We'll fetch and slice client-side for now as a quick enhancement.
        const [vendorsListRes, testsListRes] = await Promise.all([
          fetch('/api/vendors'),
          fetch('/api/tests')
        ]);

        const vendorsList = await safeJsonParse(vendorsListRes);
        const testsList = await safeJsonParse(testsListRes);

        setMetrics({
          totalVendors: vendorsCountData.success ? vendorsCountData.count : 0,
          totalTests: testsCountData.success ? testsCountData.count : 0,
          totalBookings: bookingsCountData.success ? bookingsCountData.count : 0,
          totalUsers: usersCountData.success ? usersCountData.count : 0
        });

        if (Array.isArray(vendorsList)) {
          setRecentVendors(vendorsList.slice(-4).reverse()); // Get last 4
        }

        if (Array.isArray(testsList)) {
          setRecentTests(testsList.slice(-4).reverse()); // Get last 4
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Components ---

  const StatCard = ({ title, value, icon: Icon, color, trend, delay }) => {
    const styles = {
      'bg-blue-500': {
        icon: 'text-blue-500',
        bg: 'bg-blue-50',
        light: 'group-hover:bg-blue-50/30'
      },
      'bg-purple-500': {
        icon: 'text-purple-500',
        bg: 'bg-purple-50',
        light: 'group-hover:bg-purple-50/30'
      },
      'bg-emerald-500': {
        icon: 'text-emerald-500',
        bg: 'bg-emerald-50',
        light: 'group-hover:bg-emerald-50/30'
      },
      'bg-orange-500': {
        icon: 'text-orange-500',
        bg: 'bg-orange-50',
        light: 'group-hover:bg-orange-50/30'
      }
    };

    const theme = styles[color] || styles['bg-blue-500'];

    return (
      <div
        className={`bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] ${theme.light} relative overflow-hidden`}
        style={{ animation: `fadeInUp 0.6s ease-out ${delay}ms forwards`, opacity: 0, transform: 'translateY(10px)' }}
      >
        <div className="flex justify-between items-start relative z-10">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.bg} ${theme.icon} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-100 shadow-sm px-2.5 py-1 rounded-full">
            <TrendingUp className="w-3 h-3 text-emerald-500" strokeWidth={2.5} />
            <span className="text-[11px] font-bold text-slate-600">+{trend}%</span>
          </div>
        </div>

        <div className="mt-6 relative z-10">
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{loading ? '-' : value.toLocaleString()}</h3>
          <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-wider text-[10px]">{title}</p>
        </div>

        {/* Decorative Background Icon */}
        <Icon className={`absolute -bottom-6 -right-6 w-32 h-32 ${theme.icon} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 -rotate-12 pointer-events-none`} />
      </div>
    );
  };

  const QuickAction = ({ label, icon: Icon, desc }) => (
    <button className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200 text-left w-full group">
      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
        <Icon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
      </div>
      <div>
        <div className="text-sm font-bold text-slate-800 group-hover:text-blue-700">{label}</div>
        <div className="text-xs text-slate-400 font-medium">{desc}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:translate-x-1 transition-transform" />
    </button>
  );

  const ListItem = ({ title, subtitle, icon: Icon, color }) => (
    <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-default">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-800 truncate">{title}</h4>
        <p className="text-xs text-slate-400 font-medium truncate">{subtitle}</p>
      </div>
      <div className="text-xs font-semibold text-slate-300">Just now</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#0052FF] to-[#0039CB] text-white p-8 shadow-xl shadow-blue-500/20">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Activity className="w-64 h-64 -rotate-12" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-4 border border-white/10">
            <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
            <span>System Operational</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Dashboard Overview</h1>
          <p className="text-blue-100 text-sm leading-relaxed max-w-lg">
            Welcome to your command center. You have <span className="font-bold text-white">{metrics.totalBookings} active bookings</span> and <span className="font-bold text-white">{metrics.totalTests} tests</span> available across the network today.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Vendors" value={metrics.totalVendors} icon={Building2} color="bg-blue-500" trend={12} delay={100} />
        <StatCard title="Total Tests" value={metrics.totalTests} icon={TestTube2} color="bg-purple-500" trend={8} delay={200} />
        <StatCard title="Total Bookings" value={metrics.totalBookings} icon={CalendarCheck} color="bg-emerald-500" trend={24} delay={300} />
        <StatCard title="Registered Users" value={metrics.totalUsers} icon={Users} color="bg-orange-500" trend={5} delay={400} />
      </div>

      {/* Content Grid: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Recent Vendors */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              New Vendors
            </h3>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="space-y-1">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl" />)}
              </div>
            ) : recentVendors.length > 0 ? (
              recentVendors.map((vendor, i) => (
                <ListItem
                  key={i}
                  title={vendor.hasLaboratory?.labName || vendor.name || 'Unknown Vendor'}
                  subtitle={vendor.email || 'No email provided'}
                  icon={Building2}
                  color="bg-blue-500"
                />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">No recent vendors found</div>
            )}
          </div>
        </div>

        {/* Recent Tests */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TestTube2 className="w-5 h-5 text-purple-500" />
              Recent Tests
            </h3>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="space-y-1">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl" />)}
              </div>
            ) : recentTests.length > 0 ? (
              recentTests.map((test, i) => (
                <ListItem
                  key={i}
                  title={test.testName}
                  subtitle={`Code: ${test.testCode || 'N/A'}`}
                  icon={TestTube2}
                  color="bg-purple-500"
                />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">No recent tests found</div>
            )}
          </div>
        </div>

        {/* Quick Actions / System Health */}
        <div className="space-y-6">
          <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              System Status
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Database Health</span>
                  <span className="text-emerald-500">98%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[98%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>API Response</span>
                  <span className="text-blue-500">45ms</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[85%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Storage Usage</span>
                  <span className="text-orange-500">64%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full w-[64%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-200/50">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Shortcuts</h3>
            <div className="space-y-3">
              <QuickAction label="Add New Test" icon={TestTube2} desc="Create a new diagnostic test" />
              <QuickAction label="Register Vendor" icon={Building2} desc="Onboard a new lab partner" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;