'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, ChevronDown, ShoppingCart, User, MapPin, LayoutDashboard, LogOut, Phone, ArrowRight, Settings, FileText } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import MuiMenu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { withAuth } from '../utils/authGuard';
import { signOut } from 'next-auth/react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Select Location');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(true);

  const menuOpen = Boolean(anchorEl);

  const getUserDataFromStorage = () => {
    if (typeof window === 'undefined') return { isLoggedIn: false, userName: '', profileImage: '' };
    const userLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUserName = localStorage.getItem('userName') || '';
    const storedProfileImage = localStorage.getItem('userProfileImage') || '';
    const userObj = localStorage.getItem('user');
    let finalUserName = storedUserName;
    let finalProfileImage = storedProfileImage;
    if (userObj) {
      try {
        const userData = JSON.parse(userObj);
        finalUserName = finalUserName || userData.name || userData.username || '';
        finalProfileImage = finalProfileImage || userData.profileImage || userData.image || '';
      } catch (e) {
        console.error('Error parsing user object:', e);
      }
    }
    return { isLoggedIn: userLoggedIn, userName: finalUserName, profileImage: finalProfileImage };
  };

  useEffect(() => {
    const { isLoggedIn, userName, profileImage } = getUserDataFromStorage();
    setIsLoggedIn(isLoggedIn);
    setUserName(userName);
    setProfileImage(profileImage);
    const storedLocation = typeof window !== 'undefined' ? localStorage.getItem('selectedLocation') : '';
    if (storedLocation) setSelectedLocation(storedLocation);
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAuthStatus = () => {
      const { isLoggedIn, userName, profileImage } = getUserDataFromStorage();
      setIsLoggedIn(isLoggedIn);
      setUserName(userName);
      setProfileImage(profileImage);
    };
    checkAuthStatus();
    const handleUserLoggedIn = () => {
      const { isLoggedIn, userName, profileImage } = getUserDataFromStorage();
      setIsLoggedIn(isLoggedIn);
      setUserName(userName);
      setProfileImage(profileImage);
    };
    window.addEventListener('userLoggedIn', handleUserLoggedIn);
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
    };
  }, []);

  useEffect(() => {
    const getUserId = () => {
      if (typeof window !== 'undefined') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.id || user.email || user.phone || 'guest';
      }
      return 'guest';
    };
    const updateCartCount = () => {
      if (typeof window !== 'undefined') {
        const cartKey = `cart_${getUserId()}`;
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        setCartItemCount(cart.length);
      }
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userProfileImage');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setUserName('');
      setProfileImage('');
      window.dispatchEvent(new Event('userLoggedIn'));
      await signOut({ redirect: false });
      window.location.href = '/';
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const locations = ['Ameerpet', 'Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Kondapur', 'Gachibowli', 'Hi-Tech City', 'Kukatpally', 'Miyapur', 'Secunderabad'];

  const handleLocationToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLocationDropdownOpen(prev => !prev);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setIsLocationDropdownOpen(false);
    setLocationError('');
    if (typeof window !== 'undefined') localStorage.setItem('selectedLocation', location);
  };

  const handleCurrentLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsDetectingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error('Failed to get location');
          const data = await response.json();
          const address = data.address;
          const locationName = address.suburb || address.neighbourhood || address.city_district || address.city || address.town || 'Current Location';
          setSelectedLocation(locationName);
          setIsLocationDropdownOpen(false);
          if (typeof window !== 'undefined') localStorage.setItem('selectedLocation', locationName);
        } catch (error) {
          console.error('Error getting location:', error);
          setLocationError('Failed to get your location. Please try again.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        let errorMessage = 'Failed to get your location.';
        if (error.code === error.PERMISSION_DENIED) errorMessage = 'Location permission denied.';
        else if (error.code === error.POSITION_UNAVAILABLE) errorMessage = 'Location information unavailable.';
        else if (error.code === error.TIMEOUT) errorMessage = 'Location request timed out.';
        setLocationError(errorMessage);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isLocationDropdownOpen && !event.target.closest('.location-dropdown')) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLocationDropdownOpen]);

  const handleCartClick = withAuth(() => {
    window.location.href = '/Patients/cart';
  }, 'Please log in or sign up to view your cart');

  const menuItems = [
    { name: 'Home', href: '/' },
    { name: 'Find Tests', href: '/Patients/FindTests' },
    { name: 'Find Labs', href: '/Patients/FindLabs' },
    { name: 'Support', href: '/Patients/contact' },
  ];

  const pathnameRaw = typeof window !== 'undefined' ? window.location.pathname : '';
  const pathnameHook = usePathname ? usePathname() : '';
  const pathname = (pathnameHook || pathnameRaw || '/').toLowerCase();

  const isActive = (href) => {
    const normalized = (href || '').toLowerCase();
    if (normalized === '/') return pathname === '/';
    if (normalized === '/patients/findlabs') {
      const isViewingTestFromLab = pathname.startsWith('/patients/findtests/content') && typeof window !== 'undefined' && window.location.href.includes('fromLab=true');
      return pathname.startsWith(normalized) || pathname.startsWith('/patients/labprofile') || isViewingTestFromLab;
    }
    if (normalized === '/patients/findtests') {
      const isViewingTestFromLab = pathname.startsWith('/patients/findtests/content') && typeof window !== 'undefined' && window.location.href.includes('fromLab=true');
      return pathname.startsWith(normalized) && !isViewingTestFromLab;
    }
    return pathname.startsWith(normalized);
  };

  const handleDashboardNavigation = async () => {
    try {
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      const { phone, email } = user;
      let profileQuery = '';
      if (phone) profileQuery = `?phone=${encodeURIComponent(phone)}`;
      else if (email) profileQuery = `?email=${encodeURIComponent(email)}`;

      const profileResponse = await fetch(`/api/profile${profileQuery}`);
      const profileData = await profileResponse.json();
      const healthHistoryResponse = await fetch("/api/patient-healthhistory");
      const healthHistoryData = await healthHistoryResponse.json();

      const isProfileComplete = profileData.success && profileData.user && profileData.user.name && profileData.user.dob && profileData.user.gender;
      const isHealthHistoryComplete = healthHistoryData.success && healthHistoryData.data && healthHistoryData.data.height && healthHistoryData.data.weight && healthHistoryData.data.currentMedications && healthHistoryData.data.previousMedications;
      const isPhoneVerified = profileData.user && profileData.user.isPhoneVerified;
      const isEmailVerified = profileData.user && profileData.user.isEmailVerified;

      if (isProfileComplete && isHealthHistoryComplete && isPhoneVerified && isEmailVerified) {
        window.location.href = '/Patients/Dashboard/upcoming';
      } else {
        window.location.href = '/Patients/Dashboard';
      }
    } catch (error) {
      window.location.href = '/Patients/Dashboard';
    }
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/Patients/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 w-full font-sans shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
        <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: inline-block; animation: marquee 25s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

        {/* 1. Top Utility Bar (h-9 = 36px) */}
        <div className="bg-slate-900 text-white overflow-hidden relative z-50 h-9 flex items-center justify-between px-4 lg:px-8 border-b border-slate-800">
          <div className="flex-1 overflow-hidden mask-linear-fade">
            <div className="animate-marquee whitespace-nowrap text-[10px] font-bold tracking-widest uppercase text-slate-300">
              <span className="text-blue-400 mx-2">●</span> GET 20% OFF ON ALL BLOOD TESTS
              <span className="mx-8 text-slate-700">|</span>
              <span className="text-blue-400 mx-2">●</span> FREE HOME SAMPLE COLLECTION
              <span className="mx-8 text-slate-700">|</span>
              <span className="text-blue-400 mx-2">●</span> CALL NOW: +91 98765 43210
            </div>
          </div>
        </div>

        {/* 2. Main Navbar (h-20 = 80px) */}
        <nav className="relative z-40 w-full bg-white/95 backdrop-blur-xl border-b border-slate-100 transition-all h-20">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 h-full">
            <div className="flex items-center justify-between h-full gap-6">

              {/* Left: Logo & Links */}
              <div className="flex items-center gap-8">
                <div className="flex items-center cursor-pointer group" onClick={() => window.location.href = '/'}>
                  <div className="w-16 h-16 relative transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 filter drop-shadow-sm">
                    <Image src="/logo.png" alt="Rights Diagnostics" width={120} height={120} className="w-full h-full object-contain" priority />
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-50 rounded-full border border-slate-100">
                  {menuItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link key={item.href} href={item.href} className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${active ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}>
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Center: Search */}
              <div className="hidden md:flex flex-1 max-w-md justify-end relative z-50">
                <div className="flex items-center w-full bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-200 rounded-xl transition-all duration-300 h-10 group/search shadow-sm focus-within:shadow-md focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-300">
                  <div className="relative border-r border-slate-200 px-3 h-full flex items-center gap-2 cursor-pointer hover:bg-white rounded-l-xl location-dropdown transition-colors" onClick={handleLocationToggle}>
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[80px]">{selectedLocation}</span>
                    {isLocationDropdownOpen && (
                      <div className="absolute top-[calc(100%+12px)] left-0 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 z-[100]">
                        <div className="max-h-56 overflow-y-auto custom-scrollbar p-1">
                          <button onClick={handleCurrentLocation} className="w-full px-3 py-2 rounded-lg text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-50 text-left mb-1 flex items-center gap-2">
                            {isDetectingLocation ? '...' : <><MapPin className='w-3 h-3' /> Detect Location</>}
                          </button>
                          {locations.map(loc => (
                            <button key={loc} onClick={(e) => { e.stopPropagation(); handleLocationSelect(loc); }} className={`w-full px-3 py-2 rounded-lg text-left text-xs font-bold ${selectedLocation === loc ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>{loc}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center pl-3 pr-2 h-full">
                    <input type="text" placeholder="Search tests, labs..." className="w-full bg-transparent outline-none text-xs text-slate-800 placeholder:text-slate-400 font-semibold h-full" value={searchQuery} onChange={handleSearchChange} />
                    <button type="submit" className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/30 active:scale-95">
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                <button onClick={handleCartClick} className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors border border-slate-200 hover:border-blue-200 shadow-sm">
                  <ShoppingCart className="w-4 h-4" />
                  {cartItemCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">{cartItemCount}</span>}
                </button>

                {isLoggedIn ? (
                  <button onClick={handleAvatarClick} className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
                    <div className="w-full h-full bg-white rounded-[10px] overflow-hidden">
                      {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-50"><User className="w-4 h-4 text-blue-500" /></div>}
                    </div>
                  </button>
                ) : (
                  <Link href="/login" className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 hover:shadow-lg transition-all active:scale-95">
                    <span>Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-slate-700 bg-slate-50 rounded-lg"><Menu className="w-5 h-5" /></button>
              </div>

            </div>
          </div>
        </nav>

        {/* Enhanced Elegant Drpdown Menu */}
        {isLoggedIn && (
          <MuiMenu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            disableScrollLock
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              elevation: 0,
              sx: {
                mt: 1.5,
                minWidth: 240,
                borderRadius: '16px',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 40px -4px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                overflow: 'visible',
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 20,
                  width: 10,
                  height: 10,
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                  borderTop: '1px solid rgba(0,0,0,0.05)',
                  borderLeft: '1px solid rgba(0,0,0,0.05)',
                },
              }
            }}
          >
            <div className="px-5 py-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-b border-gray-100 rounded-t-2xl">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Signed In As</span>
                  <span className="text-sm font-bold text-slate-800 truncate max-w-[140px]">{userName || 'User'}</span>
                </div>
              </div>
            </div>

            <div className="p-1">
              <MenuItem onClick={() => { handleMenuClose(); handleDashboardNavigation(); }} sx={{ py: 1.5, px: 2, borderRadius: '12px', mb: 0.5, '&:hover': { bgcolor: '#eff6ff' } }}>
                <div className="flex items-center gap-3 w-full">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">Dashboard</span>
                  </div>
                </div>
              </MenuItem>

              <MenuItem onClick={() => { handleMenuClose(); handleLogout(); }} sx={{ py: 1.5, px: 2, borderRadius: '12px', '&:hover': { bgcolor: '#fef2f2' } }}>
                <div className="flex items-center gap-3 w-full">
                  <div className="p-1.5 rounded-lg bg-red-50 text-red-500">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-red-500">Log Out</span>
                </div>
              </MenuItem>
            </div>
          </MuiMenu>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[60] bg-white lg:hidden animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-5 flex justify-between items-center border-b border-slate-100">
              <span className="text-xl font-black text-slate-900">Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                {menuItems.map(item => (
                  <Link key={item.name} href={item.href} className="block text-lg font-bold text-slate-800 py-3 border-b border-slate-50">{item.name}</Link>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/login" className="flex items-center justify-center w-full py-4 rounded-xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-500/20">Login / Sign Up</Link>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Spacer for Fixed Header (36px + 80px = 116px) */}
      <div className="h-[116px] w-full" aria-hidden="true" />
    </>
  );
};

export default Navbar;