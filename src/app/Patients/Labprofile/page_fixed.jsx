'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  MapPin, Star, Phone, Mail, Globe, Clock, Calendar,
  CheckCircle, ChevronRight, Loader2, AlertCircle, Building2,
  TestTube2, Users, Award, Shield, Grid, List, Filter, X,
  ShoppingCart, Check
} from 'lucide-react';
import Navbar from '../page';
import Footer from '../Footer/page';
// No external LabProfilePage import needed

const LabProfilePage = () => {
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#007AFF] to-[#0052FF] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Lab Logo/Icon */}
            <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
              {labData.logo ? (
                <img src={labData.logo} alt={labData.labName} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Building2 className="w-12 h-12 text-[#007AFF]" />
              )}
            </div>

            {/* Lab Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{labData.labName}</h1>

              {/* Location */}
              <div className="flex items-start gap-2 mb-4">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <p className="text-[#00CCFF]">{labData.address || 'Address not provided'}</p>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <TestTube2 className="w-5 h-5" />
                  <span className="font-semibold">{filteredTests.length} Tests</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">24/7 Support</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold">NABL Certified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto py-2 -mb-px">
            {['about', 'tests', 'contact'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium capitalize whitespace-nowrap transition-colors border-b-2 ${activeTab === tab
                  ? 'border-[#007AFF] text-[#0052FF]'
                  : 'border-transparent text-gray-600 hover:text-[#0052FF]'
                  }`}
              >
                {tab === 'about' && 'About Lab'}
                {tab === 'tests' && `Tests (${filteredTests.length})`}
                {tab === 'contact' && 'Contact'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* About Section */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About {labData.labName}</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {labData.description || `${labData.labName} is a trusted diagnostic center committed to providing accurate and timely test results. With state-of-the-art equipment and experienced professionals, we ensure the highest standards of quality and patient care.`}
                  </p>
                </div>

                {/* Features */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: Shield, text: 'NABL Accredited Lab' },
                      { icon: CheckCircle, text: 'Accurate Results' },
                      { icon: Clock, text: 'Quick Turnaround Time' },
                      { icon: Users, text: 'Experienced Staff' },
                      { icon: TestTube2, text: 'Advanced Equipment' },
                      { icon: Award, text: 'Quality Assurance' }
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-[#00CCFF] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <feature.icon className="w-5 h-5 text-[#0052FF]" />
                        </div>
                        <span className="text-gray-700">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tests Tab */}
            {activeTab === 'tests' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Tests Offered by {labData?.labName} ({filteredTests.length})
                  </h2>
                  {/* View Mode Toggle and Sort Options */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Filter Dropdown */}
                    <div className="relative">
                      <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
                      >
                        <option value="all">All Organs</option>
                        {uniqueOrgans.map((organ) => (
                          <option key={organ} value={organ}>{organ}</option>
                        ))}
                      </select>
                      <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
                      >
                        <option value="name">Sort by Name</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="organ">Sort by Organ</option>
                      </select>
                      <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md ${viewMode === 'grid'
                          ? 'bg-white text-[#0052FF] shadow-sm'
                          : 'text-gray-600 hover:text-[#0052FF]'
                          }`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md ${viewMode === 'list'
                          ? 'bg-white text-[#0052FF] shadow-sm'
                          : 'text-gray-600 hover:text-[#0052FF]'
                          }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {filteredTests.length > 0 ? (
                  viewMode === 'grid' ? (
                    // Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredTests.map((test, index) => (
                        <div
                          key={test.id}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full"
                          onClick={() => handleViewTest(test)}
                        >
                          {/* Header Section with Organ and Popular Badge */}
                          <div className="flex items-start justify-between mb-3">
                            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                              {test.organName}
                            </span>
                            {test.popular && (
                              <span className="inline-block px-2 py-1 bg-[#00CCFF] text-[#0052FF] text-xs font-medium rounded-full">
                                Popular
                              </span>
                            )}
                          </div>

                          {/* Test Name */}
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                            {test.name}
                          </h3>

                          {/* Category Badges */}
                          {test.category && test.category.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {test.category.map((cat, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Description */}
                          <div className="flex-grow">
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {test.description}
                            </p>
                          </div>

                          {/* Read More Link - Added functionality equivalent to View Test button */}
                          <div className="mb-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTest(test);
                              }}
                              className="text-[#0052FF] hover:text-[#0052FF] text-sm font-medium inline-flex items-center gap-1 transition-colors duration-200"
                            >
                              Read More
                              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>

                          {/* Price and Availability */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-lg font-bold text-[#0052FF]">
                              ₹{test.price}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              {/* <MapPin className="w-3.5 h-3.5 mr-1" />
                              <span>{test.availability}</span> */}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTest(test);
                              }}
                              className="flex-1 bg-[#007AFF] hover:bg-[#0052FF] text-white py-2 px-3 rounded-lg font-medium transition-colors text-sm"
                            >
                              View Test
                            </button>
                            <button
                              className={`p-2 rounded-lg transition-colors duration-200 ${cart.some(item => item.id === test.id) ? 'bg-green-100 text-green-600 cursor-pointer' : 'bg-[#00CCFF] hover:bg-[#00A3FF] text-[#0052FF]'}`}
                              title={cart.some(item => item.id === test.id) ? 'Remove from Cart' : 'Add to Cart'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCart(test);
                              }}
                            >
                              {cart.some(item => item.id === test.id) ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <ShoppingCart className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // List View
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredTests.map((test, index) => (
                            <tr
                              key={test.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleViewTest(test)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{test.name}</div>
                                <div className="text-xs text-gray-500 mt-1 max-w-xs">
                                  {(test.description || 'No description').substring(0, 60)}...
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewTest(test);
                                  }}
                                  className="text-[#0052FF] hover:text-[#0052FF] text-xs font-medium mt-1 inline-flex items-center gap-1"
                                >
                                  Read More
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.organName}</td>
                              <td className="px-6 py-4">
                                {test.category && test.category.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {test.category.map((cat, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
                                      >
                                        {cat}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">None</span>
                                )}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0052FF]">
                                ₹{test.price}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewTest(test);
                                    }}
                                    className="bg-[#007AFF] hover:bg-[#0052FF] text-white py-1.5 px-3 rounded text-xs font-medium transition-colors"
                                  >
                                    View
                                  </button>
                                  <button
                                    className={`p-1.5 rounded transition-colors ${cart.some(item => item.id === test.id) ? 'bg-green-100 text-green-600 cursor-pointer' : 'bg-[#00CCFF] hover:bg-[#00A3FF] text-[#0052FF]'}`}
                                    title={cart.some(item => item.id === test.id) ? 'Remove from Cart' : 'Add to Cart'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleCart(test);
                                    }}
                                  >
                                    {cart.some(item => item.id === test.id) ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      <ShoppingCart className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <TestTube2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">No tests available</p>
                    <p className="text-sm text-gray-500">
                      {filterBy === 'all'
                        ? 'This lab hasn\'t added any tests to their profile yet.'
                        : `No tests found for ${filterBy}. Try selecting a different filter.`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

                <div className="space-y-6">
                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#00CCFF] rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-[#0052FF]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                      <p className="text-gray-600">{labData.address || 'Address not provided'}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  {labData.phone && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#00CCFF] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-[#0052FF]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                        <a href={`tel:${labData.phone}`} className="text-[#0052FF] hover:underline">
                          {labData.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {labData.contactEmail && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#00CCFF] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-[#0052FF]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                        <a href={`mailto:${labData.contactEmail}`} className="text-[#0052FF] hover:underline">
                          {labData.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {labData.website && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#00CCFF] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Globe className="w-6 h-6 text-[#0052FF]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Website</h3>
                        <a
                          href={labData.website.startsWith('http') ? labData.website : `https://${labData.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0052FF] hover:underline"
                        >
                          {labData.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Map placeholder */}
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Location Map</h3>
                    <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
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
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p>Address not available for map display</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Quick Contact Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Contact</h3>

              <div className="space-y-3">
                {labData.phone && (
                  <a
                    href={`tel:${labData.phone}`}
                    className="w-full bg-[#007AFF] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#0052FF] transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    Call Lab
                  </a>
                )}

                <button
                  onClick={() => router.push('/Patients/FindLabs')}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back to Labs
                </button>
              </div>

              {/* Owner Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Lab Owner</p>
                <p className="font-semibold text-gray-900">{labData.ownerName}</p>
              </div>

              {/* Status */}
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isOpenParam === 'true' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm font-medium ${isOpenParam === 'true' ? 'text-green-600' : 'text-red-600'}`}>
                    {isOpenParam === 'true' ? 'Currently Open' : 'Closed'}
                  </span>
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

export default LabProfilePage;