'use client';

import React, { useState, useEffect } from 'react';
import { Search, Grid, List, ChevronDown, MapPin, Filter, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Check, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../page';
import Footer from '../Footer/page';
import { safeJsonParse } from '../../utils/apiUtils';
import { withAuth } from '../../utils/authGuard';

const FindTests = () => {
  // Cart state for icon change (user-specific)
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
  // Add to Cart handler (user-specific) - also protected
  const handleAddToCart = withAuth((test) => {
    if (typeof window !== 'undefined') {
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      // Avoid duplicates by test id
      if (!cart.some(item => item.id === test.id)) {
        // Ensure category is a string, not an array
        let categoryValue = test.category || 'General';
        if (Array.isArray(categoryValue)) {
          categoryValue = categoryValue.join(', ');
        }

        cart.push({
          id: test.id,
          testName: test.name,
          price: test.price,
          category: categoryValue, // Use the processed category value
          organName: test.organName, // Adding organ name to cart item
          isPackage: test.isPackage || false,
          includedTests: (test.includedTests || []).map(t => typeof t === 'object' ? (t.testName || t.name) : t),
          actualPrice: test.actualPrice || '' // Include actualPrice for lab-specific pricing
        });
        localStorage.setItem(cartKey, JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
        // Show notification
        toast.success(`${test.isPackage ? 'Package' : 'Test'} added to health cart successfully!`);
      }
    }
  }, 'Please log in or sign up to add items to your cart');

  // Remove from Cart handler (user-specific)
  const handleRemoveFromCart = (itemId, itemName, isPackage = false) => {
    if (typeof window !== 'undefined') {
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      const updatedCart = cart.filter(item => item.id !== itemId);
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
      window.dispatchEvent(new Event('cartUpdated'));
      // Show notification
      toast.success(`${isPackage ? 'Package' : 'Test'} removed from health cart successfully!`);
    }
  };

  const router = useRouter();
  const [viewMode, setViewMode] = useState('grid'); // Default to grid view to show cards
  const [sortBy, setSortBy] = useState('popularity');
  const [selectedLocation, setSelectedLocation] = useState('All Labs');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrgans, setSelectedOrgans] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showAllOrgans, setShowAllOrgans] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [organSystems, setOrganSystems] = useState([]);
  const [categories] = useState([
    { id: 'men', name: 'Men' },
    { id: 'women', name: 'Women' },
    { id: 'kids', name: 'Kids' },
    { id: 'couples', name: 'Couples' },
    { id: 'elders', name: 'Elders' }
  ]);
  // Packages will be fetched from the database
  const [isLoading, setIsLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [labLocations, setLabLocations] = useState([]);
  const [packages, setPackages] = useState([]); // Added packages state
  const [showPackages, setShowPackages] = useState(false); // Toggle between tests and packages

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const testsPerPage = 6;

  // Fetch organs, tests, packages and vendors from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch organs
        const organsResponse = await fetch('/api/organs');
        const organsData = await safeJsonParse(organsResponse);
        if (organsData.success) {
          setOrganSystems(organsData.data);
        }

        // Fetch tests
        const testsResponse = await fetch('/api/tests');
        const testsData = await safeJsonParse(testsResponse);
        if (testsData.success) {
          setTests(testsData.tests || []);
        }
        // Fetch packages
        const packagesResponse = await fetch(`/api/packages?showAll=true&_t=${Date.now()}`);
        const packagesData = await safeJsonParse(packagesResponse);
        if (packagesData.success) {
          // Ensure each package has a status field
          const packagesWithStatus = (packagesData.data || []).map(pkg => ({
            ...pkg,
            status: pkg.status || 'Active'
          }));
          setPackages(packagesWithStatus);
        }

        // Fetch vendors (approved and active only)
        const vendorsResponse = await fetch('/api/vendors');
        const vendorsData = await safeJsonParse(vendorsResponse);
        if (vendorsData.success) {
          // Filter only approved and active vendors
          const approvedVendors = vendorsData.vendors.filter(vendor =>
            vendor.approvalStatus === 'approved' && vendor.status === 'active' && vendor.labName
          );
          setVendors(approvedVendors || []);

          // Extract unique lab names from approved and active vendors
          const uniqueLabNames = approvedVendors
            .map(vendor => vendor.labName)
            .filter((name, index, self) => name && self.indexOf(name) === index);
          setLabLocations(uniqueLabNames);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
        // Remove fallback to hardcoded data to ensure database usage
        setOrganSystems([]);
      }
    };

    fetchData();

    // Set up polling to check for vendor approval updates
    const interval = setInterval(fetchData, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []); // Remove selectedLocation dependency to prevent infinite loops

  const handleOrganToggle = (organ) => {
    setSelectedOrgans(prev =>
      prev.some(o => (o._id || o.organName || o) === (organ._id || organ.organName || organ))
        ? prev.filter(o => (o._id || o.organName || o) !== (organ._id || organ.organName || organ))
        : [...prev, organ]
    );
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.some(c => c.id === category.id)
        ? prev.filter(c => c.id !== category.id)
        : [...prev, category]
    );
  };

  const handleViewContent = (itemId, itemName, isPackage = false) => {
    if (isPackage) {
      // Navigate to package content page with package details
      router.push(`/Patients/packages/content?packageId=${itemId}&packageName=${encodeURIComponent(itemName)}`);
    } else {
      // Navigate to test content page with test details
      router.push(`/Patients/FindTests/content?testId=${itemId}&testName=${encodeURIComponent(itemName)}`);
    }
  };

  const handleBookNow = withAuth((itemId, itemName, isPackage = false) => {
    if (isPackage) {
      // Navigate to package content page with package details
      router.push(`/Patients/packages/content?packageId=${itemId}&packageName=${encodeURIComponent(itemName)}`);
    } else {
      // Navigate to test content page with test details
      router.push(`/Patients/FindTests/content?testId=${itemId}&testName=${encodeURIComponent(itemName)}`);
    }
  }, 'Please log in or sign up to view test/package details');

  // Handle package deactivation
  const handleDeactivatePackage = async (packageId) => {
    try {
      const packageToDeactivate = packages.find(pkg => pkg._id === packageId);
      if (!packageToDeactivate) return;

      const newStatus = packageToDeactivate.status === 'Active' ? 'Inactive' : 'Active';

      const response = await fetch('/api/packages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: packageId,
          status: newStatus
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPackages(packages.map(pkg =>
          pkg._id === packageId ? { ...pkg, status: newStatus } : pkg
        ));
        alert(`Package ${newStatus.toLowerCase()} successfully!`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error('Error updating package status:', err);
      alert('Error updating package status');
    }
  };

  // Helper function to get vendor name by ID
  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v._id === vendorId);
    return vendor ? (vendor.labName || vendor.vendorName || 'Unknown Vendor') : 'Unknown Vendor';
  };

  // Helper function to get unique tests with aggregated data
  const getUniqueTests = () => {
    // Filter tests to only show those associated with active vendors
    const activeVendorIds = new Set(vendors.map(v => v._id));
    const activeVendorLabNames = new Set(vendors.map(v => v.labName));

    const filteredTests = tests.filter(test => {
      // Include tests that have a vendorId that matches an active vendor
      if (test.vendorId && activeVendorIds.has(test.vendorId)) {
        return true;
      }

      // Include tests that have availableAtLabs that match active vendor lab names
      if (test.availableAtLabs) {
        const labs = test.availableAtLabs.split(',').map(lab => lab.trim()).filter(lab => lab);
        return labs.some(lab => activeVendorLabNames.has(lab));
      }

      // Exclude tests that don't match any active vendor
      return false;
    });

    // Group tests by testName
    const groupedTests = filteredTests.reduce((acc, test) => {
      if (!acc[test.testName]) {
        acc[test.testName] = [];
      }
      acc[test.testName].push(test);
      return acc;
    }, {});

    // Convert grouped tests to display format
    return Object.entries(groupedTests).map(([testName, testVersions]) => {
      // Use the first test as base for common properties
      const baseTest = testVersions[0];

      // Collect all unique vendor labs for this test
      const allLabs = new Set();
      const allVendorIds = new Set();
      const allVendors = new Set();

      testVersions.forEach(test => {
        // Add labs from availableAtLabs field (comma-separated lab names)
        if (test.availableAtLabs) {
          test.availableAtLabs.split(',')
            .map(lab => lab.trim())
            .filter(lab => lab)
            .forEach(lab => allLabs.add(lab));
        }

        // Add the vendor's lab if it exists and is not already counted
        if (test.vendorId) {
          const vendor = vendors.find(v => v._id === test.vendorId);
          if (vendor) {
            const vendorName = vendor.labName || vendor.vendorName;
            if (vendorName) {
              allLabs.add(vendorName);
              allVendorIds.add(test.vendorId);
              allVendors.add(vendorName);
            }
          }
        }
      });

      // Create combined availableAtLabs string
      const combinedAvailableAtLabs = Array.from(allLabs).join(', ');

      // Calculate price range if multiple versions have different prices
      let priceDisplay = baseTest.price || '0';
      if (testVersions.length > 1) {
        const prices = testVersions
          .map(t => t.price)
          .filter(Boolean)
          .map(price => {
            // Handle both single prices and ranges
            if (typeof price === 'string' && price.includes('-')) {
              const [min, max] = price.split('-').map(p => parseFloat(p.trim()));
              return { min: min || 0, max: max || min || 0 };
            } else {
              const numPrice = parseFloat(price) || 0;
              return { min: numPrice, max: numPrice };
            }
          });

        if (prices.length > 0) {
          const allMinPrices = prices.map(p => p.min);
          const allMaxPrices = prices.map(p => p.max);
          const minPrice = Math.min(...allMinPrices);
          const maxPrice = Math.max(...allMaxPrices);

          priceDisplay = minPrice === maxPrice ? `${minPrice}` : `${minPrice}-${maxPrice}`;
        }
      }

      // Combine actual prices from all tests in the group
      const combinedActualPrices = {};
      testVersions.forEach(test => {
        // Priority 1: Use explicit actualPrice map
        if (test.actualPrice && typeof test.actualPrice === 'object') {
          // Merge the actualPrice objects
          Object.assign(combinedActualPrices, test.actualPrice);
        }

        // Priority 2: Use test.price for the vendor
        if (test.vendorId) {
          const vendor = vendors.find(v => v._id === test.vendorId);
          if (vendor) {
            const vendorName = vendor.labName || vendor.vendorName;
            if (vendorName && !combinedActualPrices[vendorName]) {
              // Only set if not already present (actualPrice takes precedence)
              combinedActualPrices[vendorName] = test.price;
            }
          }
        }

        // Priority 3: Use test.price for availableAtLabs
        if (test.availableAtLabs) {
          const labs = test.availableAtLabs.split(',').map(l => l.trim()).filter(l => l);
          labs.forEach(labName => {
            if (!combinedActualPrices[labName]) {
              combinedActualPrices[labName] = test.price;
            }
          });
        }
      });

      // If a specific lab is selected and the test has actualPrice data, use the lab-specific price
      if (selectedLocation !== 'All Labs') {
        // Try to find the price for the selected lab in the combined prices
        if (combinedActualPrices[selectedLocation]) {
          priceDisplay = combinedActualPrices[selectedLocation];
        }
      }

      const labCount = allLabs.size;

      return {
        id: baseTest._id, // Use base test ID for routing
        name: testName,
        category: baseTest.category,
        organName: baseTest.organ, // Add organName field to match what's used in the card display
        description: baseTest.description || 'No description available',
        price: priceDisplay, // Use the determined display price
        avgPrice: priceDisplay,
        popular: baseTest.isPopular || false,
        availableAtLabs: combinedAvailableAtLabs,
        labCount: labCount,
        vendorIds: Array.from(allVendorIds),
        vendors: Array.from(allVendors),
        availability: `Available at ${labCount} lab${labCount !== 1 ? 's' : ''}`,
        actualPrice: combinedActualPrices, // Use combined actual prices
        testVersions: testVersions // Keep reference to all versions for detailed view
      };
    });
  };
  // Helper function to get package data in a format similar to tests
  const getPackageData = () => {
    // Filter packages to only show active ones
    const activePackages = packages.filter(pkg => pkg.status !== 'Inactive');

    return activePackages.map(pkg => {
      // Calculate average price of included tests
      let avgPrice = 0;
      if (pkg.includedTests && pkg.includedTests.length > 0) {
        const total = pkg.includedTests.reduce((sum, test) => sum + (test.price || 0), 0);
        avgPrice = total / pkg.includedTests.length;
      }

      // Count number of tests in package
      const testCount = pkg.includedTests ? pkg.includedTests.length : 0;

      // Extract test names from includedTests (they come as populated objects from the API)
      const testNames = pkg.includedTests ? pkg.includedTests.map(test => {
        // Handle both object format (populated) and string format
        if (typeof test === 'object' && test !== null) {
          return test.testName || test.name || '';
        }
        return test;
      }).filter(name => name) : [];

      // Process category data - split if it's a concatenated string
      let categories = [];
      if (Array.isArray(pkg.category)) {
        categories = pkg.category;
      } else if (typeof pkg.category === 'string') {
        // If it's a concatenated string like "MenWomenKids", try to split it
        // First check if it's already separated by commas or spaces
        if (pkg.category.includes(',')) {
          categories = pkg.category.split(',').map(cat => cat.trim()).filter(cat => cat);
        } else if (pkg.category.includes(' ')) {
          categories = pkg.category.split(' ').map(cat => cat.trim()).filter(cat => cat);
        } else {
          // If it's concatenated without separators, try to split common patterns
          // Look for known category names
          const knownCategories = ['Men', 'Women', 'Kids', 'Couples', 'Elders'];
          categories = knownCategories.filter(cat =>
            pkg.category.includes(cat)
          );

          // If no known categories found, treat as a single category
          if (categories.length === 0) {
            categories = [pkg.category];
          }
        }
      } else {
        categories = [pkg.category];
      }

      return {
        id: pkg._id,
        name: pkg.packageName,
        category: categories, // Properly processed categories
        description: pkg.description || 'No description available',
        price: pkg.price,
        avgPrice: avgPrice,
        popular: pkg.isPopular || false,
        testCount: testCount,
        includedTests: testNames, // Array of test names as strings
        isPackage: true, // Flag to distinguish packages from tests
        status: pkg.status || 'Active' // Include status field
      };
    });
  };

  const uniqueTests = getUniqueTests();
  const packageData = getPackageData();

  const filteredTests = uniqueTests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.organName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrgan = selectedOrgans.length === 0 || selectedOrgans.some(organ => {
      // Handle different organ data structures
      const selectedOrganName = organ.organName || organ;
      return selectedOrganName === test.organName;
    });
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.some(category =>
      test.category && test.category.length > 0 && test.category.some(cat =>
        cat.toLowerCase() === category.name.toLowerCase()
      )
    );
    // Filter by selected lab if not "All Labs"
    const matchesLab = selectedLocation === 'All Labs' ||
      (test.availableAtLabs && test.availableAtLabs.split(',').map(lab => lab.trim()).includes(selectedLocation));
    return matchesSearch && matchesOrgan && matchesCategory && matchesLab;
  });

  const filteredPackages = packageData.filter(pkg => {
    // Only show active packages
    if (pkg.status === 'Inactive') return false;

    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.some(category =>
      pkg.category && pkg.category.length > 0 && pkg.category.some(cat =>
        cat.toLowerCase() === category.name.toLowerCase()
      )
    );
    return matchesSearch && matchesCategory;
  });

  const sortedTests = [...filteredTests].sort((a, b) => {
    if (sortBy === 'popularity') {
      return b.popular - a.popular;
    }
    return a.name.localeCompare(b.name);
  });

  const sortedPackages = [...filteredPackages].sort((a, b) => {
    if (sortBy === 'popularity') {
      return b.popular - a.popular;
    }
    return a.name.localeCompare(b.name);
  });

  // Use either tests or packages based on showPackages flag
  const currentItems = showPackages ? sortedPackages : sortedTests;

  // Pagination logic
  const indexOfLastItem = currentPage * testsPerPage;
  const indexOfFirstItem = indexOfLastItem - testsPerPage;
  const currentDisplayItems = currentItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentItems.length / testsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Toggle between tests and packages
  const handleShowPackagesToggle = () => {
    setShowPackages(!showPackages);
    setCurrentPage(1); // Reset to first page when toggling
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Navbar />

      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] backdrop-blur-xl bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">
                Find {showPackages ? 'Health Packages' : 'Diagnostic Tests'}
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                Compare prices from {vendors.length}+ top rated labs
              </p>
            </div>

            <div className="relative w-full md:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#2874F0] transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all font-medium placeholder-gray-400 shadow-inner outline-none"
                placeholder={`Search ${showPackages ? 'packages' : 'tests'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Filters */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 h-fit lg:sticky lg:top-40 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-900" />
                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              </div>
            </div>

            {/* Packages Toggle Switch */}
            <div className="mb-8 p-4 bg-gray-50 rounded-2xl flex items-center justify-between group cursor-pointer border border-transparent hover:border-gray-200 transition-all" onClick={handleShowPackagesToggle}>
              <span className="font-bold text-gray-700 text-sm group-hover:text-[#2874F0] transition-colors">Show Packages</span>
              <div className={`w-12 h-7 rounded-full transition-colors duration-300 relative shadow-inner ${showPackages ? 'bg-[#2874F0]' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-transform duration-300 ${showPackages ? 'left-6' : 'left-1'}`}></div>
              </div>
            </div>

            {/* Lab Filter */}
            {!showPackages && (
              <div className="mb-8">
                <label className="text-[11px] font-black text-black tracking-widest mb-3 block">
                  Lab Partner
                </label>
                <div className="relative group">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-100 focus:border-[#2874F0] appearance-none cursor-pointer outline-none transition-all group-hover:border-gray-300 shadow-sm"
                  >
                    <option value="All Labs">All Labs</option>
                    {labLocations.map((labName, index) => (
                      <option key={index} value={labName}>{labName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#2874F0] transition-colors" />
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-black text-black uppercase tracking-widest">
                  Category
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                {(showAllCategories ? categories : categories.slice(0, 6)).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${selectedCategories.some(selected => selected.id === category.id) ? 'bg-[#2874F0] border-[#2874F0] text-white shadow-lg shadow-blue-500/30' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Organ System Filter */}
            {!showPackages && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    Body Part
                  </label>
                  <button
                    onClick={() => setShowAllOrgans(!showAllOrgans)}
                    className="text-[10px] font-bold text-[#2874F0] hover:underline uppercase tracking-wider"
                  >
                    {showAllOrgans ? 'Less' : 'View All'}
                  </button>
                </div>

                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 transition-colors">
                  {(showAllOrgans ? organSystems : organSystems.slice(0, 6)).map((organ) => (
                    <div
                      key={organ._id || organ.organName || organ}
                      onClick={() => handleOrganToggle(organ)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all group ${selectedOrgans.some(selected => (selected._id || selected.organName || selected) === (organ._id || organ.organName || organ)) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedOrgans.some(selected => (selected._id || selected.organName || selected) === (organ._id || organ.organName || organ)) ? 'bg-[#2874F0] border-[#2874F0]' : 'bg-white border-gray-300 group-hover:border-blue-300'}`}>
                        <Check className={`w-3 h-3 text-white transition-opacity ${selectedOrgans.some(selected => (selected._id || selected.organName || selected) === (organ._id || organ.organName || organ)) ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                      <span className={`text-sm font-semibold transition-colors ${selectedOrgans.some(selected => (selected._id || selected.organName || selected) === (organ._id || organ.organName || organ)) ? 'text-[#2874F0]' : 'text-gray-600 group-hover:text-gray-900'}`}>
                        {typeof organ === 'object' ? organ.organName : organ}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            {/* Top Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid'
                      ? 'bg-[#007AFF] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list'
                      ? 'bg-[#007AFF] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] text-sm"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content Display - Tests or Packages */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007AFF]"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            ) : viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentDisplayItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleBookNow(item.id, item.name, item.isPackage)}
                      className="group relative bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden"
                    >
                      {/* Decorative Background */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50/50 to-transparent rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-700 pointer-events-none"></div>

                      <div className="relative z-10 mb-4 flex justify-between items-start">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${item.isPackage ? 'bg-purple-50 text-purple-600 ring-1 ring-purple-100' : 'bg-blue-50 text-[#2874F0] ring-1 ring-blue-100'}`}>
                          {item.isPackage ? 'Package' : item.organName}
                        </span>
                        {item.popular && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full ring-1 ring-amber-100">
                            <Sparkles className="w-3 h-3 fill-amber-600" /> Popular
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-[#2874F0] transition-colors relative z-10 line-clamp-2">
                        {item.name}
                      </h3>

                      {item.category && item.category.length > 0 && (
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-4 relative z-10 pl-0.5">
                          {Array.isArray(item.category) ? item.category.join(', ') : item.category}
                        </p>
                      )}

                      <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-3 relative z-10 flex-grow">
                        {item.description}
                      </p>

                      <div className="mt-auto pt-6 border-t border-gray-50 flex items-end justify-between relative z-10">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                            {item.isPackage ? `${item.testCount} Tests Included` : 'Starting From'}
                          </p>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-sm font-bold text-gray-500">₹</span>
                            <span className="text-2xl font-black text-gray-900 tracking-tight">
                              {item.price === '0' || item.price === 0 ? 'On Request' : item.price}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-sm group/btn ${cart.some(cartItem => cartItem.id === item.id) ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-[#2874F0] hover:bg-[#2874F0] hover:text-white hover:shadow-lg hover:shadow-blue-500/30'}`}
                          title={cart.some(cartItem => cartItem.id === item.id) ? 'Added to Cart' : 'Add to Cart'}
                        >
                          {cart.some(cartItem => cartItem.id === item.id) ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8">
                    <div className="text-sm text-gray-600">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, currentItems.length)} of {currentItems.length} {showPackages ? 'packages' : 'tests'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`flex items-center px-3 py-2 rounded-md ${currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </button>

                      {/* Page Numbers */}
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        // Show first, last, current, and nearby pages
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              className={`w-10 h-10 rounded-full ${currentPage === pageNumber
                                ? 'bg-[#007AFF] text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        }

                        // Show ellipsis for skipped pages
                        if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                          return (
                            <span key={pageNumber} className="px-2 text-gray-500">
                              ...
                            </span>
                          );
                        }

                        return null;
                      })}

                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`flex items-center px-3 py-2 rounded-md ${currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-[#F8FAFC] border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">S.No.</th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{showPackages ? 'Package Name' : 'Test Name'}</th>
                        {!showPackages && (
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Organ</th>
                        )}
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                        {!showPackages && (
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Labs</th>
                        )}
                        {showPackages && (
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Tests</th>
                        )}
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Price (₹)</th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {currentDisplayItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          onClick={() => handleViewContent(item.id, item.name, item.isPackage)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{indexOfFirstItem + index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500 mt-1 max-w-xs line-clamp-2">
                              {item.description || 'No description available'}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewContent(item.id, item.name, item.isPackage);
                              }}
                              className="text-[#0052FF] hover:text-[#0052FF] text-xs font-medium mt-2 inline-flex items-center gap-1 transition-colors duration-200"
                            >
                              Read More
                              <svg className="w-3 h-3 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </td>
                          {!showPackages && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {item.organName}
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            {item.category && item.category.length > 0 ? (
                              <div className="text-sm text-gray-600">
                                {Array.isArray(item.category)
                                  ? item.category.join(', ')
                                  : item.category}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">None</span>
                            )}
                          </td>
                          {!showPackages && (
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500">
                                {item.availableAtLabs ? (
                                  <>
                                    {item.availableAtLabs.split(',').slice(0, 2).map(lab => lab.trim()).join(', ')}
                                    {item.labCount > 2 && (
                                      <span className="ml-1 text-xs text-blue-500 cursor-pointer" title={item.availableAtLabs.split(',').map(lab => lab.trim()).join(', ')}>
                                        +{item.labCount - 2} more
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-gray-400 text-xs">No labs</span>
                                )}
                              </div>
                            </td>
                          )}
                          {showPackages && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.testCount} tests
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-[#0052FF]">₹{item.price}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewContent(item.id, item.name, item.isPackage);
                                }}
                                className="bg-[#007AFF] hover:bg-[#0052FF] text-white py-1.5 px-3 rounded-md text-xs font-medium transition-colors"
                              >
                                View
                              </button>
                              {item.isPackage && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeactivatePackage(item.id);
                                  }}
                                  className={`p-1.5 rounded-md transition-colors ${item.status === 'Active' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                  title={item.status === 'Active' ? 'Deactivate' : 'Activate'}
                                >
                                  {item.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                              )}
                              <button
                                className={`p-1.5 rounded-md transition-colors ${cart.some(cartItem => cartItem.id === item.id) ? 'bg-green-100 text-green-600 cursor-pointer' : 'bg-[#00CCFF] hover:bg-[#00A3FF] text-[#0052FF]'}`}
                                title={cart.some(cartItem => cartItem.id === item.id) ? 'Remove from Cart' : 'Add to Cart'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (cart.some(cartItem => cartItem.id === item.id)) {
                                    handleRemoveFromCart(item.id, item.name, item.isPackage);
                                  } else {
                                    handleAddToCart(item);
                                  }
                                }}
                              >
                                {cart.some(cartItem => cartItem.id === item.id) ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls for Table View */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-600">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, currentItems.length)} of {currentItems.length} {showPackages ? 'packages' : 'tests'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                          className={`flex items-center px-3 py-2 rounded-md ${currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Previous
                        </button>

                        {/* Page Numbers */}
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNumber = index + 1;
                          // Show first, last, current, and nearby pages
                          if (
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => handlePageChange(pageNumber)}
                                className={`w-10 h-10 rounded-full ${currentPage === pageNumber
                                  ? 'bg-[#007AFF] text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          }

                          // Show ellipsis for skipped pages
                          if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                            return (
                              <span key={pageNumber} className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }

                          return null;
                        })}

                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className={`flex items-center px-3 py-2 rounded-md ${currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No Results */}
            {!isLoading && currentItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No {showPackages ? 'packages' : 'tests'} found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FindTests;
