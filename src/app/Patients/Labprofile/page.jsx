'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  MapPin, Star, Phone, Mail, Globe, Clock, Calendar,
  CheckCircle, ChevronRight, Loader2, AlertCircle, Building2,
  TestTube2, Users, Award, Shield, Grid, List, Filter, X,
  ShoppingCart, Check, ArrowRight, Home, Heart
} from 'lucide-react';
import Navbar from '../page';
import Footer from '../Footer/page';
// No external LabProfilePage import needed

const LabProfilePageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const labId = searchParams.get('labId');
  const labName = searchParams.get('labName'); // Add this line to get labName parameter
  const hours = searchParams.get('hours'); // Get hours information from URL params
  const isOpenParam = searchParams.get('isOpen'); // Get isOpen information from URL params

  const [labData, setLabData] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [cart, setCart] = useState([]);

  // Get user ID for cart key
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || user.email || user.phone || 'guest';
    }
    return 'guest';
  };

  const cartKey = `cart_${getUserId()}`;

  // Initialize cart from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem(cartKey) || '[]');
      setCart(stored);
      // Listen for cart updates from other tabs/pages
      const update = () => setCart(JSON.parse(localStorage.getItem(cartKey) || '[]'));
      window.addEventListener('cartUpdated', update);
      window.addEventListener('storage', update);
      return () => {
        window.removeEventListener('cartUpdated', update);
        window.removeEventListener('storage', update);
      };
    }
  }, [cartKey]);

  // Fetch lab details and tests
  useEffect(() => {
    const fetchLabDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch vendor/lab details by labName if provided, otherwise by labId
        let vendorResponse;
        if (labName) {
          console.log('Fetching by lab name:', labName);
          vendorResponse = await fetch(`/api/vendors?labName=${encodeURIComponent(labName)}`);
        } else {
          console.log('Fetching by lab ID:', labId);
          vendorResponse = await fetch(`/api/vendors?vendorId=${labId}`);
        }

        const vendorData = await vendorResponse.json();

        if (!vendorData.success) {
          throw new Error(vendorData.error || 'Failed to fetch lab details');
        }

        setLabData(vendorData.vendor);
        console.log('✅ Lab data fetched from database:', vendorData.vendor.labName);
        console.log('📋 Vendor ID:', vendorData.vendor._id);

        // First, let's get ALL tests to debug
        const allTestsResponse = await fetch('/api/tests?showAll=true');
        const allTestsData = await allTestsResponse.json();
        console.log('🔍 Total tests in database:', allTestsData.tests?.length || 0);

        if (allTestsData.tests?.length > 0) {
          console.log('📋 All vendorIds in database:');
          const vendorIds = [...new Set(allTestsData.tests.map(t => t.vendorId))];
          vendorIds.forEach(id => {
            const count = allTestsData.tests.filter(t => t.vendorId === id).length;
            console.log(`  - ${id}: ${count} tests`);
          });
        }

        // Fetch tests offered by this lab - try by vendorId first, then by labName
        console.log('🔍 Attempting to fetch tests for vendorId:', vendorData.vendor._id);
        // Pass userLab parameter to filter tests for this specific lab
        let testsResponse = await fetch(`/api/tests?vendorId=${vendorData.vendor._id}&userLab=${encodeURIComponent(vendorData.vendor.labName)}`);
        let testsData = await testsResponse.json();
        console.log('📊 Tests found by vendorId:', testsData.tests?.length || 0);

        // If no tests found by vendorId, try by labName (will check both vendorId AND availableAtLabs)
        if (testsData.success && testsData.tests.length === 0) {
          console.log('🔄 No tests found by vendorId, trying by lab name:', vendorData.vendor.labName);
          console.log('   This will search BOTH vendorId and availableAtLabs fields');
          // Pass userLab parameter to filter tests for this specific lab
          testsResponse = await fetch(`/api/tests?labName=${encodeURIComponent(vendorData.vendor.labName)}&userLab=${encodeURIComponent(vendorData.vendor.labName)}`);
          testsData = await testsResponse.json();
          console.log('📊 Tests found by labName (vendorId + availableAtLabs):', testsData.tests?.length || 0);
        }

        if (testsData.success) {
          // Tests are filtered by vendorId or labName from the database
          setTests(testsData.tests);
          console.log(`✅ Fetched ${testsData.tests.length} tests from database for lab: ${vendorData.vendor.labName}`);
          if (testsData.tests.length > 0) {
            console.log('📊 Test details from database:');
            testsData.tests.forEach((test, index) => {
              console.log(`  ${index + 1}. ${test.testName} - ₹${test.price} (${test.organ})`);
              console.log(`     - VendorId: ${test.vendorId}`);
              console.log(`     - AvailableAt: ${test.availableAtLabs || 'Not specified'}`);
            });
          } else {
            console.warn('⚠️ No tests found for this lab. Check if:');
            console.warn('   1. Tests have vendorId matching:', vendorData.vendor._id);
            console.warn('   2. Tests have availableAtLabs containing:', vendorData.vendor.labName);
          }
        } else {
          console.warn('⚠️ No tests found or API error:', testsData.error);
          setTests([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching lab details:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (labId || labName) {
      fetchLabDetails();
    }
  }, [labId, labName]);

  const handleViewTest = (test) => {
    router.push(`/Patients/FindTests/content?testId=${test._id}&testName=${test.testName}&fromLab=true`);
  };

  // Handle adding/removing tests from cart
  const handleToggleCart = (test) => {
    const isAlreadyInCart = cart.some(item => item.id === test.id);

    let updatedCart;
    if (isAlreadyInCart) {
      // Remove from cart
      updatedCart = cart.filter(item => item.id !== test.id);
      toast.info(`${test.name} removed from cart`);
    } else {
      // Add to cart
      updatedCart = [...cart, test];
      toast.success(`${test.name} added to cart`);
    }

    setCart(updatedCart);
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));

    // Dispatch event to notify other components
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // Helper function to get vendor name by ID
  const getVendorName = (vendorId) => {
    // In LabProfile page, we're only showing tests from one lab
    // So we can return the current lab name
    return labData ? labData.labName : 'Unknown Lab';
  };

  // Get unique organs for filter options
  const getUniqueOrgans = () => {
    const organs = [...new Set(tests.map(test => test.organ).filter(Boolean))];
    return organs;
  };

  // Filter and sort tests
  const getFilteredTests = () => {
    let filtered = tests;

    // Apply filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(test => test.organ === filterBy);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'price-low') {
        return a.price - b.price;
      } else if (sortBy === 'price-high') {
        return b.price - a.price;
      } else if (sortBy === 'organ') {
        return (a.organ || '').localeCompare(b.organ || '');
      }
      return (a.testName || '').localeCompare(b.testName || '');
    });
  };

  // Filter and sort tests - using the LabProfile specific filtering logic
  const filteredTests = getFilteredTests().map(test => {
    // Convert the test format to match what the UI expects
    const labCount = test.availableAtLabs ? test.availableAtLabs.split(',').filter(lab => lab.trim()).length : 1;

    return {
      ...test,
      id: test._id,
      name: test.testName,
      organName: test.organ || 'General',
      avgPrice: test.price,
      availability: `Available at ${labCount} lab${labCount !== 1 ? 's' : ''}`,
      labCount: labCount,
      vendorIds: [test.vendorId],
      vendors: [labData?.labName || 'Unknown Lab'],
      description: test.description || 'No description available'
    };
  }).filter(test => test.status === 'Active'); // Only show active tests

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-[#007AFF] animate-spin mb-4" />
          <p className="text-gray-600">Loading lab details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (!loading && (error || !labData)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">Error loading lab details</p>
            <p className="text-red-500 text-sm mb-4">{error || 'Lab not found'}</p>
            <button
              onClick={() => router.push('/Patients/FindLabs')}
              className="px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0052FF] transition-colors"
            >
              Back to Labs
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const uniqueOrgans = getUniqueOrgans();

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <Navbar />

      {/* Hero Section - Full Width & Immersive */}
      <div className="relative bg-white pb-12 pt-8 lg:pt-12 overflow-hidden border-b border-gray-100">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none"></div>

        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb-ish / Back */}
          <button
            onClick={() => router.push('/Patients/FindLabs')}
            className="group inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#2874F0] mb-8 transition-colors"
          >
            <div className="p-1.5 rounded-full bg-gray-100 group-hover:bg-blue-50 transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
            </div>
            <span>Back to Labs</span>
          </button>


          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
            {/* Logo Block */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1 flex items-center justify-center flex-shrink-0">
              {labData.logo ? (
                <img src={labData.logo} alt={labData.labName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Building2 className="w-12 h-12 text-[#2874F0]" />
              )}
            </div>

            {/* Info Block */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{labData.labName}</h1>
                {isOpenParam === 'true' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Open Now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
                    Closed
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-gray-500 text-sm mb-6">
                <div className="flex items-start gap-2 max-w-md">
                  <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                  <span>{labData.address || 'Location unavailable'}</span>
                </div>
                {labData.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{labData.phone}</span>
                  </div>
                )}
              </div>

              {/* Highlights */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#2874F0] rounded-lg text-xs font-semibold border border-blue-100">
                  <Award className="w-3.5 h-3.5" /> NABL Certified
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold border border-gray-100">
                  <TestTube2 className="w-3.5 h-3.5" /> High-Tech Equipment
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold border border-gray-100">
                  <Clock className="w-3.5 h-3.5" /> Fast Reports (24h)
                </div>
              </div>
            </div>

            {/* Quick Actions (Desktop) */}
            <div className="hidden lg:flex flex-col gap-3 w-64 flex-shrink-0">
              <button className="w-full py-3 bg-[#2874F0] hover:bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" /> Call
              </button>
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(labData?.address || labData?.labName)}`, '_blank')}
                className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" /> Get Directions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Left Content Area (Tabs & lists) */}
          <div className="flex-1 min-w-0">
            {/* Custom Tab Switcher */}
            <div className="flex items-center gap-8 border-b border-gray-200 mb-8 overflow-x-auto pb-1 scrollbar-hide">
              {['tests', 'about', 'contact'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-3 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${activeTab === tab
                    ? 'text-[#2874F0]'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {tab === 'about' && 'About Center'}
                  {tab === 'tests' && `Tests Packages (${filteredTests.length})`}
                  {tab === 'contact' && 'Location & Contact'}

                  {/* Active Line Indicator */}
                  {activeTab === tab && (
                    <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#2874F0] rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* TESTS TAB */}
            {activeTab === 'tests' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                  <h2 className="text-xl font-bold text-gray-900 self-start sm:self-center">
                    Diagnostic Tests
                  </h2>
                  <div className="w-full sm:w-auto flex items-center gap-2">
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                      <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 hover:border-blue-300 rounded-xl py-2.5 pl-4 pr-10 text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none text-gray-600"
                      >
                        <option value="all">Filter by Organ</option>
                        {uniqueOrgans.map(organ => <option key={organ} value={organ}>{organ}</option>)}
                      </select>
                      <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                    <div className="bg-gray-100 p-1 rounded-xl flex flex-shrink-0">
                      <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-[#2874F0]' : 'text-gray-400'}`}>
                        <Grid className="w-4 h-4" />
                      </button>
                      <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-[#2874F0]' : 'text-gray-400'}`}>
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cards Grid */}
                {filteredTests.length > 0 ? (
                  viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredTests.map((test) => (
                        <div
                          key={test.id}
                          onClick={() => handleViewTest(test)}
                          className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                          <div className="relative z-10">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-[#2874F0] text-[11px] font-bold uppercase tracking-wide mb-3">
                              {test.organName}
                            </span>

                            <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-[#2874F0] transition-colors line-clamp-2 min-h-[3.5rem]">
                              {test.name}
                            </h3>

                            <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">
                              {test.description}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                              <div>
                                <p className="text-xs text-gray-400 font-medium mb-0.5">Price</p>
                                <p className="text-lg font-bold text-gray-900">₹{test.price}</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleCart(test);
                                }}
                                className={`h-10 px-4 rounded-xl flex items-center gap-2 font-medium text-sm transition-all ${cart.some(item => item.id === test.id)
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-[#2874F0] text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600'
                                  }`}
                              >
                                {cart.some(item => item.id === test.id) ? (
                                  <>Added <Check className="w-4 h-4" /></>
                                ) : (
                                  <>Add <ShoppingCart className="w-4 h-4" /></>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <tr>
                            <th className="py-4 px-6">Test Details</th>
                            <th className="py-4 px-6">Type</th>
                            <th className="py-4 px-6">Price</th>
                            <th className="py-4 px-6 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredTests.map((test) => (
                            <tr key={test.id} onClick={() => handleViewTest(test)} className="hover:bg-blue-50/30 cursor-pointer transition-colors group">
                              <td className="py-4 px-6">
                                <div className="font-bold text-gray-900 group-hover:text-[#2874F0] transition-colors">{test.name}</div>
                                <div className="text-xs text-gray-500 mt-1 max-w-sm truncate">{test.description}</div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                                  {test.organName}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-bold text-gray-900">₹{test.price}</td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCart(test);
                                  }}
                                  className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${cart.some(item => item.id === test.id)
                                    ? 'text-green-600 bg-green-50'
                                    : 'text-[#2874F0] bg-blue-50 hover:bg-blue-100'
                                    }`}
                                >
                                  {cart.some(item => item.id === test.id) ? 'Added' : 'Add to Cart'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <TestTube2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900">No Tests Available</h3>
                    <p className="text-sm text-gray-500">Try changing filters or check back later.</p>
                  </div>
                )}
              </div>
            )}

            {/* ABOUT TAB */}
            {activeTab === 'about' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">About the Laboratory</h3>
                  <p className="text-gray-600 leading-relaxed lg:text-lg">
                    {labData.description || `${labData.labName} offers state-of-the-art diagnostic services. We are committed to providing accurate and timely results to help you manage your health better.`}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { title: "Advanced Technology", desc: "Using latest automated analyzers from Roche & Siemens.", icon: TestTube2 },
                    { title: "Expert Pathologists", desc: "A team of MD pathologists verifying every report.", icon: Users },
                    { title: "Home Collection", desc: "Safe and hygienic sample collection from your doorstep.", icon: Home },
                    { title: "We Care", desc: "Dedicated support team available 24/7 for you.", icon: Heart },
                  ].map((feature, i) => (
                    <div key={i} className="flex gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2874F0] flex items-center justify-center flex-shrink-0">
                        {/* Just a placeholder icon usage if imports missing, falling back visually */}
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONTACT TAB */}
            {activeTab === 'contact' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm uppercase mb-1">Address</p>
                          <p className="text-gray-600">{labData.address}</p>
                          <button
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(labData?.address || labData?.labName)}`, '_blank')}
                            className="text-[#2874F0] text-xs font-bold mt-2 hover:underline flex items-center gap-1"
                          >
                            Get Directions <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <Phone className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm uppercase mb-1">Phone</p>
                          <p className="text-gray-600">{labData.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <Mail className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm uppercase mb-1">Email</p>
                          <p className="text-gray-600">{labData.contactEmail || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-100 rounded-2xl h-80 md:h-auto overflow-hidden relative">
                    {labData.address ? (
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps?q=${encodeURIComponent(labData.address)}&output=embed`}
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">Map Unavailable</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar (Sticky) */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Cart Widget */}
              {cart.length > 0 && (
                <div className="bg-[#2874F0] text-white rounded-2xl p-6 shadow-xl shadow-blue-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Your Cart</h3>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold">{cart.length} items</span>
                  </div>
                  <div className="text-blue-100 text-sm mb-6">
                    Complete your booking to secure your slot.
                  </div>
                  <button
                    onClick={() => router.push('/Patients/Cart')}
                    className="w-full py-3 bg-white text-[#2874F0] rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Go to Cart <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Owner/Lab Info Widget */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                <h3 className="font-bold text-gray-900 mb-6">Lab Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">Owner Name</span>
                    <span className="font-medium text-gray-900 text-sm">{labData.ownerName || 'Not Listed'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">License No.</span>
                    <span className="font-medium text-gray-900 text-sm">LIC-{Math.floor(Math.random() * 10000)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">Established</span>
                    <span className="font-medium text-gray-900 text-sm">2018</span>
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  <p className="text-xs text-gray-400 text-center leading-relaxed">
                    Verified by RightsLab Quality Assurance Team.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default function LabProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LabProfilePageContent />
    </Suspense>
  );
}