'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCurrentVendor } from '@/app/serverActions/vendorActions';
import { logoutAction } from '@/app/serverActions/authActions';
import AllBookingsPage from './AllBookings/page';
import AnalyticsPage from './Analytics/page';
import LabProfilePage from './LabProfile/page';
import TestManagementPage from './TestManagement/page';


// Icons (Using Lucide for consistency, styled to match Admin's airy look)
import {
  LayoutDashboard,
  Calendar,

  FlaskConical,
  BarChart3,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell
} from 'lucide-react';

const VendorPage = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeContent, setActiveContent] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Auth & Session Logic ---

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        const response = await getCurrentVendor();
        if (!response.success) {
          router.push('/vendor/login');
          return;
        }
        setUser(response.vendor);
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        setTimeout(() => {
          router.push('/vendor/login');
        }, 100);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [router]);

  // Session validation on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const response = await getCurrentVendor();
          if (!response.success) {
            router.push('/vendor/login');
          }
        } catch (error) {
          console.error('Session validation error:', error);
          router.push('/vendor/login');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await logoutAction();
      router.push('/vendor/login');
    } catch (error) {
      console.error('Error during logout:', error);
      router.push('/vendor/login');
    }
  };

  // --- Navigation Config ---

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'AllBookings', label: 'All Bookings', icon: Calendar },

    { id: 'TestManagement', label: 'Test Management', icon: FlaskConical },
    { id: 'Analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'LabProfile', label: 'Lab Profile', icon: Building2 },
  ];

  const routeToId = (path) => {
    if (!path) return 'dashboard';
    if (path.startsWith('/vendor')) return 'dashboard';
    return 'dashboard';
  };

  const getActiveItem = () => {
    if (activeContent) {
      return activeContent;
    }
    return routeToId(pathname);
  };

  const activeItem = getActiveItem();

  // --- Styles (Matching Admin Page) ---

  // Pure white sidebar, clean lines, plenty of space
  const activeClasses = 'bg-[#0052FF] text-white shadow-lg shadow-blue-500/30';
  const inactiveClasses = 'text-gray-500 hover:text-gray-900 hover:bg-gray-50';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.sidebar') && !event.target.closest('.hamburger')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleNavClick = (item) => {
    setIsMobileMenuOpen(false);
    if (item.id === 'dashboard') {
      setActiveContent(null);
    } else {
      setActiveContent(item.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
        <div className="flex flex-col items-center">
          <span className="relative flex h-10 w-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-10 w-10 bg-blue-500"></span>
          </span>
          <p className="mt-4 text-sm font-medium text-slate-500">Loading Vendor Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">

      {/* Mobile Top Bar */}
      <div className="lg:hidden flex justify-between items-center w-full fixed top-0 left-0 bg-white border-b border-gray-100 px-5 py-4 z-40">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="logo" width={24} height={24} className="object-contain" />
          <span className="font-semibold text-slate-900 text-lg">Rights Diagnostics</span>
        </div>
        <button onClick={toggleMobileMenu} className="p-2 text-slate-500 hamburger">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar - Clean & Modern (Matches Admin) */}
      <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E2E8F0] sidebar
          transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0
          flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="h-20 px-6 flex items-center gap-3.5">
          <div className="w-9 h-9 relative">
            <Image src="/logo.png" alt="logo" fill className="object-contain" />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">Rights Diagnostics</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 custom-scrollbar">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Vendor Menu</div>
          {navItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center px-4 py-3 text-[14px] font-medium rounded-xl transition-all duration-200 ${isActive ? activeClasses : inactiveClasses}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} strokeWidth={1.5} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Profile - Bottom Sidebar */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-white">
              {user?.username?.charAt(0).toUpperCase() || 'V'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.username || 'Vendor'}</p>
              <p className="text-[11px] text-slate-400 font-medium">Vendor Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#F8FAFC]">

        {/* Header - Simple & Clean */}
        <header className="h-16 px-8 flex items-center justify-between bg-white border-b border-slate-200/60 sticky top-0 z-20">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            {navItems.find(i => i.id === activeItem)?.label || 'Dashboard'}
          </h2>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
            <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              <Bell className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Content Scroll */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 h-full">
            {activeContent === null ? (
              <div className="space-y-8">
                {/* Welcome Banner - Matching Admin Style usually implies a clean dashboard, but user had a banner before, we'll keep a unified simple welcome or just the cards if Admin doesn't have a banner. 
                   Admin page "Dashboard" component likely has the content. 
                   Since we are replacing the "Dashboard" component with local content for Vendor, let's make it look consistent inside.
                */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                  <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">Welcome Back, {user?.username || 'Partner'}!</h2>
                    <p className="text-blue-100 max-w-xl">
                      Here is an overview of your lab&apos;s performance and manage your bookings efficiently.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {navItems.filter(item => item.id !== 'dashboard').map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveContent(item.id)}
                      className="group bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 cursor-pointer"
                    >
                      <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-200">
                        <item.icon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors duration-200" strokeWidth={1.5} />
                      </div>
                      <h4 className="text-base font-semibold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                        {item.label}
                      </h4>
                      <p className="text-sm text-slate-500">
                        Manage {item.label.toLowerCase()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[calc(100vh-140px)]">
                {/* Render Sub-pages */}
                {activeContent === 'AllBookings' && <AllBookingsPage />}
                {activeContent === 'Analytics' && <AnalyticsPage />}
                {activeContent === 'LabProfile' && <LabProfilePage />}
                {activeContent === 'TestManagement' && <TestManagementPage />}

              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }
      `}</style>
    </div>
  );
};

export default VendorPage;