'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import RolesPermission from './VendorManagement/page';
import Dashboard from './Dashboard/page';
import AdminTestManagement from './adminTestManagement/page';
import VideoPage from './categoryAdmin/video/page';
import FAQPage from './categoryAdmin/faq/page';
import PackagesPage from './Packages/page';
import AdvertisementPage from './Advertisment/page';
import CouponManagementPage from './CouponMangement/page';
import AnalyticsPage from './Analytics/page';
import AdminManagement from './Adminmanagement/page';
import SupportPage from './Support/page';

// --- Airy & Modern Icons ---
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const VendorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PackagesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const TestManagementIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const CouponIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const AdvertisementIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const AdminIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
  </svg>
);

const AdminPage = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [activeContent, setActiveContent] = useState(null);
  const [activeCategorySubitem, setActiveCategorySubitem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUsername, setAdminUsername] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [adminModules, setAdminModules] = useState([]);
  const [supportModules, setSupportModules] = useState([]);

  // Check if user has admin role on component mount
  useEffect(() => {
    const checkAdminAccess = () => {
      try {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const user = localStorage.getItem('user');

        if (!isLoggedIn || !user) {
          router.push('/Admin/login');
          return;
        }

        const userData = JSON.parse(user);
        const allowedRoles = ['superadmin', 'admin', 'support', 'other'];
        const hasAllowedRole = allowedRoles.includes(userData?.role);

        if (!hasAllowedRole) {
          router.push('/Admin/login');
          return;
        }

        const username = userData?.username || userData?.email || 'Admin';
        setAdminUsername(username);
        setUserRole(userData?.role || '');

        const adminRoles = ['superadmin', 'admin', 'support'];
        setIsAdminUser(adminRoles.includes(userData?.role));

        if (userData?.role === 'admin') {
          const savedModules = localStorage.getItem('adminModules');
          if (savedModules) {
            setAdminModules(JSON.parse(savedModules));
          }
        } else if (userData?.role === 'support') {
          const savedModules = localStorage.getItem('supportModules');
          if (savedModules) {
            setSupportModules(JSON.parse(savedModules));
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/Admin/login');
      }
    };

    checkAdminAccess();
  }, [router]);

  // Session validation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        try {
          const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
          const user = localStorage.getItem('user');

          if (!isLoggedIn || !user) {
            router.push('/Admin/login');
            return;
          }

          const userData = JSON.parse(user);
          const allowedRoles = ['superadmin', 'admin', 'support', 'other'];
          const hasAllowedRole = allowedRoles.includes(userData?.role);

          if (!hasAllowedRole) {
            router.push('/Admin/login');
          }
        } catch (error) {
          console.error('Session validation error:', error);
          router.push('/Admin/login');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    router.push('/Admin/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'vendors-management', label: 'Vendors', icon: VendorIcon },
    { id: 'category', label: 'Category', icon: PackagesIcon },
    { id: 'test-management', label: 'Tests', icon: TestManagementIcon },
    { id: 'packages', label: 'Packages', icon: PackagesIcon },
    { id: 'coupons', label: 'Coupons', icon: CouponIcon },
    { id: 'advertisements', label: 'Ads', icon: AdvertisementIcon },
    { id: 'analytics', label: 'Analytics', icon: AnalyticsIcon },
    { id: 'support', label: 'Support', icon: AdminIcon },
  ];

  const getFilteredNavItems = () => {
    if (userRole !== 'admin' && userRole !== 'support') return navItems;

    if (userRole === 'admin') {
      const enabledModuleIds = adminModules.filter(module => module.enabled).map(module => module.id);

      // If no modules are enabled, show nothing except dashboard (safety fallback)
      if (enabledModuleIds.length === 0) return navItems.filter(item => item.id === 'dashboard');

      return navItems.filter(item => {
        if (item.id === 'dashboard') return true;
        // Direct ID matching + Special casing for 'Admin Management' which is dynamically inserted
        if (item.id === 'support' && enabledModuleIds.includes('support')) return true;

        // Map nav item IDs to permission module IDs if they differ
        const moduleIdMap = {
          'vendors-management': 'vendors-management',
          'category': 'category',
          'test-management': 'test-management',
          'packages': 'packages',
          'coupons': 'coupons',
          'advertisements': 'advertisements',
          'analytics': 'analytics',
          'support': 'support'
        };

        const mappedId = moduleIdMap[item.id] || item.id;
        return enabledModuleIds.includes(mappedId);
      });
    }

    if (userRole === 'support') {
      const enabledModuleIds = supportModules.filter(module => module.enabled).map(module => module.id);

      if (enabledModuleIds.length === 0) return navItems.filter(item => item.id === 'dashboard');

      return navItems.filter(item => {
        if (item.id === 'dashboard') return true;

        const moduleIdMap = {
          'vendors-management': 'vendors-management',
          'category': 'category',
          'test-management': 'test-management',
          'packages': 'packages',
          'coupons': 'coupons',
          'advertisements': 'advertisements',
          'analytics': 'analytics',
          'support': 'support'
        };

        const mappedId = moduleIdMap[item.id] || item.id;
        return enabledModuleIds.includes(mappedId);
      });
    }

    return navItems;
  };

  const routeToId = (path) => {
    if (!path) return 'dashboard';
    if (path.startsWith('/Admin') || path.startsWith('/admin')) return 'dashboard';
    if (path.startsWith('/Admin/adminmanagement')) return 'adminmanagement';
    if (path.startsWith('/Admin/categoryAdmin') || path.startsWith('/admin/categoryAdmin')) return 'category';
    if (path.startsWith('/vendors-management')) return 'vendors-management';
    if (path.startsWith('/test-management')) return 'test-management';
    if (path.startsWith('/packages')) return 'packages';
    if (path.startsWith('/coupons')) return 'coupons';
    if (path.startsWith('/advertisements')) return 'advertisements';
    if (path.startsWith('/analytics')) return 'analytics';
    if (path.startsWith('/Admin/Support') || path.startsWith('/admin/support')) return 'support';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const getActiveItem = () => {
    if (activeContent) return activeContent;
    return routeToId(pathname);
  };

  const activeItem = getActiveItem();

  // --- "Airy" Styles ---
  // Pure white, clean lines, plenty of space
  const activeClasses = 'bg-[#0052FF] text-white shadow-lg shadow-blue-500/30';
  const inactiveClasses = 'text-gray-500 hover:text-gray-900 hover:bg-gray-50';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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

  useEffect(() => {
    if (pathname === 'adminmanagement' && isAdminUser) {
      setActiveContent('admin-management');
    }
  }, [pathname, isAdminUser]);

  useEffect(() => {
    const loadModules = () => {
      if (userRole === 'admin') {
        const savedModules = localStorage.getItem('adminModules');
        if (savedModules) {
          try {
            setAdminModules(JSON.parse(savedModules));
          } catch (error) { console.error(error); }
        }
      } else if (userRole === 'support') {
        const savedModules = localStorage.getItem('supportModules');
        if (savedModules) {
          try {
            setSupportModules(JSON.parse(savedModules));
          } catch (error) { console.error(error); }
        }
      }
    };
    loadModules();
    const handleAdminModulesUpdate = (event) => {
      if (event.detail && event.detail.modules && userRole === 'admin') setAdminModules(event.detail.modules);
    };
    const handleSupportModulesUpdate = (event) => {
      if (event.detail && event.detail.modules && userRole === 'support') setSupportModules(event.detail.modules);
    };
    window.addEventListener('adminModulesUpdated', handleAdminModulesUpdate);
    window.addEventListener('supportModulesUpdated', handleSupportModulesUpdate);
    const interval = setInterval(() => { loadModules(); }, 1000);
    return () => {
      window.removeEventListener('adminModulesUpdated', handleAdminModulesUpdate);
      window.removeEventListener('supportModulesUpdated', handleSupportModulesUpdate);
      clearInterval(interval);
    };
  }, [userRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center">
          <span className="relative flex h-10 w-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-10 w-10 bg-blue-500"></span>
          </span>
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
        <button onClick={toggleMobileMenu} className="p-2 text-slate-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* Sidebar - Clean & Modern (No Floating) */}
      <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E2E8F0]
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
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Main Menu</div>
          {(() => {
            const filteredItems = getFilteredNavItems();
            // (Logic for inserting Admin Management preserved)
            if (isAdminUser) {
              let isAdminManagementEnabled = true;
              if (userRole === 'admin') isAdminManagementEnabled = adminModules.some(m => m.id === 'admin-management' && m.enabled) || adminModules.length === 0;
              else if (userRole === 'support') isAdminManagementEnabled = supportModules.some(m => m.id === 'admin-management' && m.enabled) || supportModules.length === 0;

              if (isAdminManagementEnabled) {
                const dbIndex = filteredItems.findIndex(i => i.id === 'dashboard');
                if (dbIndex !== -1 && !filteredItems.find(i => i.id === 'admin-management')) {
                  filteredItems.splice(dbIndex + 1, 0, { id: 'admin-management', label: 'Management', icon: AdminIcon });
                }
              }
            }
            return filteredItems;
          })().map((item) => (
            <div key={item.id}>
              {item.id === 'category' ? (
                <div className="space-y-1">
                  <button
                    onClick={() => { setIsCategoryOpen(!isCategoryOpen); handleNavClick(item); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-[14px] font-medium rounded-xl transition-all duration-200 ${activeItem === item.id ? activeClasses : inactiveClasses}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDownIcon />
                  </button>

                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCategoryOpen || activeContent === 'category' ? 'max-h-32 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    <div className="pl-4 space-y-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsCategoryOpen(true); setActiveContent('category'); setActiveCategorySubitem('videos'); }}
                        className={`w-full flex items-center px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${activeCategorySubitem === 'videos' ? 'text-blue-600 bg-blue-50/80' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-2.5 opacity-50"></span>
                        Videos
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsCategoryOpen(true); setActiveContent('category'); setActiveCategorySubitem('faqs'); }}
                        className={`w-full flex items-center px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${activeCategorySubitem === 'faqs' ? 'text-blue-600 bg-blue-50/80' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-2.5 opacity-50"></span>
                        FAQs
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center px-4 py-3 text-[14px] font-medium rounded-xl transition-all duration-200 ${activeItem === item.id ? activeClasses : inactiveClasses}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon />
                    <span>{item.label}</span>
                  </div>
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile - Bottom Sidebar */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-white">
              {adminUsername.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{adminUsername}</p>
              <p className="text-[11px] text-slate-400 font-medium">Administrator</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#F8FAFC]">

        {/* Header - Simple & Clean */}
        <header className="h-16 px-8 flex items-center justify-between bg-white border-b border-slate-200/60 sticky top-0 z-20">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            {navItems.find(i => i.id === activeItem)?.label || (activeItem === 'admin-management' ? 'Admin Management' : 'Dashboard')}
          </h2>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
            <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
          </div>
        </header>

        {/* Content Scroll */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {activeContent === 'vendors-management' ? (
              <RolesPermission />
            ) : activeContent === 'admin-management' ? (
              <AdminManagement />
            ) : activeContent === 'test-management' ? (
              <AdminTestManagement />
            ) : activeContent === 'category' ? (
              <>
                {activeCategorySubitem === 'videos' && <VideoPage />}
                {activeCategorySubitem === 'faqs' && <FAQPage />}
              </>
            ) : activeContent === 'packages' ? (
              <PackagesPage />
            ) : activeContent === 'coupons' ? (
              <CouponManagementPage />
            ) : activeContent === 'advertisements' ? (
              <AdvertisementPage />
            ) : activeContent === 'analytics' ? (
              <AnalyticsPage />
            ) : activeContent === 'support' ? (
              <SupportPage />
            ) : children ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                {children}
              </div>
            ) : (
              <Dashboard />
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

export default AdminPage;