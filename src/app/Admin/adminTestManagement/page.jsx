'use client';

import { useState, useEffect } from 'react';
import { safeJsonParse } from '../../utils/apiUtils';
import { isValidPrice } from '../../utils/priceUtils';

const AdminTestManagement = () => {
  const [tests, setTests] = useState([]);
  const [organs, setOrgans] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
  const [isEditTestModalOpen, setIsEditTestModalOpen] = useState(false);
  const [isViewTestModalOpen, setIsViewTestModalOpen] = useState(false);
  const [isDeleteTestModalOpen, setIsDeleteTestModalOpen] = useState(false);
  const [isAddOrganModalOpen, setIsAddOrganModalOpen] = useState(false);
  const [isEditOrganModalOpen, setIsEditOrganModalOpen] = useState(false);
  const [isViewOrganModalOpen, setIsViewOrganModalOpen] = useState(false);
  const [isDeleteOrganModalOpen, setIsDeleteOrganModalOpen] = useState(false);
  const [isVendorsModalOpen, setIsVendorsModalOpen] = useState(false);

  // Selected items for modals
  const [selectedTest, setSelectedTest] = useState(null);
  const [testToDelete, setTestToDelete] = useState(null);
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [organToDelete, setOrganToDelete] = useState(null);

  // Fetch all data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Function to display all tests with their details, grouping by test name
  const getUniqueTests = () => {
    // Group tests by testName
    const groupedTests = tests.reduce((acc, test) => {
      if (!acc[test.testName]) {
        acc[test.testName] = [];
      }
      acc[test.testName].push(test);
      return acc;
    }, {});

    // Convert grouped tests to display format
    return Object.entries(groupedTests).map(([testName, testVersions], index) => {
      // Use the first test as base for common properties
      const baseTest = testVersions[0];

      // Collect all unique vendor labs for this test
      const allLabs = new Set();

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

          priceDisplay = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice}-₹${maxPrice}`;
        }
      }

      return {
        ...baseTest,
        _id: `${testName}-${index}`, // Create a unique ID for the grouped test
        testName: testName,
        avgPrice: priceDisplay,
        availableAtLabs: combinedAvailableAtLabs,
        vendorCount: testVersions.length,
        testVersions: testVersions // Keep reference to all versions for detailed view
      };
    });
  };
  // Function to get unique organs with vendor information
  const getUniqueOrgans = () => {
    // Get unique organs first
    const uniqueOrgans = organs.filter((organ, index, self) =>
      index === self.findIndex((o) => o._id === organ._id)
    );

    // Add serial number and vendor information to each organ
    return uniqueOrgans.map((organ, index) => {
      // Find all tests that use this organ
      const testsWithOrgan = tests.filter(test => test.organ === organ.organName);

      // Get unique vendor IDs from these tests
      const vendorIds = [...new Set(testsWithOrgan.map(test => test.vendorId))];

      // Get vendor names
      const vendorNames = vendorIds.map(id => {
        const vendor = vendors.find(v => v._id === id);
        return vendor ? vendor.vendorName : 'Unknown Vendor';
      });

      return {
        ...organ,
        serialNumber: index + 1, // Add sequential number starting from 1
        vendorCount: vendorIds.length,
        vendorIds: vendorIds,
        vendorNames: vendorNames
      };
    });
  };



  // Function to get vendor name by ID
  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v._id === vendorId);
    return vendor ? vendor.vendorName : 'Unknown Vendor';
  };

  // Function to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Inactive
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  // Add state for deactivate modal
  const [isDeactivateTestModalOpen, setIsDeactivateTestModalOpen] = useState(false);
  const [testToDeactivate, setTestToDeactivate] = useState(null);

  // Modal handlers for deactivate
  const openDeactivateTestModal = (test) => {
    setTestToDeactivate(test);
    setIsDeactivateTestModalOpen(true);
  };
  const closeDeactivateTestModal = () => {
    setIsDeactivateTestModalOpen(false);
    setTestToDeactivate(null);
  };

  // Modal handlers
  const openAddTestModal = () => setIsAddTestModalOpen(true);
  const closeAddTestModal = () => setIsAddTestModalOpen(false);

  const openEditTestModal = (test) => {
    setSelectedTest(test);
    setIsEditTestModalOpen(true);
  };
  const closeEditTestModal = () => {
    setIsEditTestModalOpen(false);
    setSelectedTest(null);
  };

  const openViewTestModal = (test) => {
    setSelectedTest(test);
    setIsViewTestModalOpen(true);
  };
  const closeViewTestModal = () => {
    setIsViewTestModalOpen(false);
    setSelectedTest(null);
  };

  const openDeleteTestModal = (test) => {
    setTestToDelete(test);
    setIsDeleteTestModalOpen(true);
  };
  const closeDeleteTestModal = () => {
    setIsDeleteTestModalOpen(false);
    setTestToDelete(null);
  };

  const openAddOrganModal = () => setIsAddOrganModalOpen(true);
  const closeAddOrganModal = () => setIsAddOrganModalOpen(false);

  const openEditOrganModal = (organ) => {
    setSelectedOrgan(organ);
    setIsEditOrganModalOpen(true);
  };
  const closeEditOrganModal = () => {
    setIsEditOrganModalOpen(false);
    setSelectedOrgan(null);
  };

  const openViewOrganModal = (organ) => {
    setSelectedOrgan(organ);
    setIsViewOrganModalOpen(true);
  };
  const closeViewOrganModal = () => {
    setIsViewOrganModalOpen(false);
    setSelectedOrgan(null);
  };

  const openDeleteOrganModal = (organ) => {
    setOrganToDelete(organ);
    setIsDeleteOrganModalOpen(true);
  };
  const closeDeleteOrganModal = () => {
    setIsDeleteOrganModalOpen(false);
    setOrganToDelete(null);
  };

  // Fetch all data on component mount
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all vendors
      const vendorsResponse = await fetch('/api/vendors');
      const vendorsResult = await safeJsonParse(vendorsResponse);

      if (vendorsResult.success) {
        setVendors(vendorsResult.vendors || []);
      } else {
        console.error('Error fetching vendors:', vendorsResult.error);
        setVendors([]);
      }

      // Fetch all organs
      const organsResponse = await fetch('/api/organs');
      const organsResult = await safeJsonParse(organsResponse);

      if (organsResult.success) {
        setOrgans(organsResult.data || []);
      } else {
        console.error('Error fetching organs:', organsResult.error);
        setOrgans([]);
      }

      // Fetch all tests directly from the new /api/tests endpoint
      try {
        const testsResponse = await fetch('/api/tests?showAll=true');
        const testsResult = await safeJsonParse(testsResponse);

        if (testsResult.success && testsResult.tests) {
          console.log('Fetched all tests from /api/tests:', testsResult.tests);
          setTests(testsResult.tests);
        } else {
          console.error('Error fetching tests from /api/tests:', testsResult.error);
          // No fallback to vendor-based fetching - ensure database usage
          setTests([]);
        }
      } catch (err) {
        console.error('Error fetching tests from /api/tests:', err);
        // No fallback to vendor-based fetching - ensure database usage
        setTests([]);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
      setVendors([]);
      setOrgans([]);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique test names for aggregation
  const getUniqueTestNames = () => {
    const testNames = new Set();
    tests.forEach(test => testNames.add(test.testName));
    return Array.from(testNames);
  };



  // Test actions
  const handleAddTest = async (newTest) => {
    try {
      // For admin, we don't set a default vendorId to avoid duplication
      // The vendorId will be set when the test is associated with a specific lab
      const vendorId = null;

      console.log('Adding test with data:', {
        vendorId: vendorId,
        testName: newTest.testName,
        organ: newTest.organ,
        price: newTest.price,
        description: newTest.description,
        availableAtLabs: newTest.availableAtLabs,
        isPopular: newTest.isPopular,
        status: newTest.status
      });

      // Use the correct API endpoint: /api/tests with POST method
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendorId,
          testName: newTest.testName,
          organ: newTest.organ,
          price: newTest.price,
          description: newTest.description,
          availableAtLabs: newTest.availableAtLabs,
          isPopular: newTest.isPopular,
          status: newTest.status || 'Active',
          overview: newTest.overview || '',
          testPreparation: newTest.testPreparation || [],
          importance: newTest.importance || [],
          youtubeLinks: newTest.youtubeLinks || [],
          category: newTest.category || [] // Add category field
        }),
      });

      const result = await safeJsonParse(response);

      console.log('Add test response:', result);

      if (result.success) {
        // Refresh data
        fetchData();
        closeAddTestModal();
        alert('Test added successfully!');
      } else {
        const errorMsg = result.message || result.error || 'Unknown error';
        const details = result.details ? `\nDetails: ${result.details}` : '';
        console.error('Failed to add test:', result);
        alert('Failed to add test: ' + errorMsg + details);
      }
    } catch (err) {
      console.error('Error adding test:', err);
      alert('Error adding test: ' + err.message);
    }
  };

  const handleUpdateTest = async (updatedData) => {
    try {
      // Use the correct API endpoint: /api/tests with PUT method
      const realTestId = selectedTest.testVersions && selectedTest.testVersions.length > 0
        ? selectedTest.testVersions[0]._id
        : selectedTest._id;

      const response = await fetch('/api/tests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: realTestId,
          testName: updatedData.testName,
          organ: updatedData.organ,
          price: updatedData.price,
          description: updatedData.description,
          availableAtLabs: updatedData.availableAtLabs,
          isPopular: updatedData.isPopular,
          status: updatedData.status || 'Active',
          overview: updatedData.overview || '',
          testPreparation: updatedData.testPreparation || [],
          importance: updatedData.importance || [],
          youtubeLinks: updatedData.youtubeLinks || [],
          category: updatedData.category || [] // Add category field
        }),
      });

      const result = await safeJsonParse(response);

      if (result.success) {
        // Refresh data
        fetchData();
        closeEditTestModal();
        alert('Test updated successfully!');
      } else {
        alert('Failed to update test: ' + result.error);
      }
    } catch (err) {
      console.error('Error updating test:', err);
      alert('Error updating test');
    }
  };

  const handleDeactivateTest = async () => {
    try {
      // Determine new status (toggle between Active and Inactive)
      const newStatus = testToDeactivate.status === 'Active' ? 'Inactive' : 'Active';

      const realTestId = testToDeactivate.testVersions && testToDeactivate.testVersions.length > 0
        ? testToDeactivate.testVersions[0]._id
        : testToDeactivate._id;

      // Use the PATCH API endpoint to update test status
      const response = await fetch('/api/tests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: realTestId,
          status: newStatus
        }),
      });

      const result = await safeJsonParse(response);

      if (result.success) {
        // Refresh data
        fetchData();
        closeDeactivateTestModal();
        alert(`Test ${newStatus.toLowerCase()}d successfully! Users in the selected categories at the specified labs will ${newStatus === 'Active' ? 'now be able to' : 'no longer be able to'} see and book this test.`);
      } else {
        alert('Failed to update test status: ' + result.error);
      }
    } catch (err) {
      console.error('Error updating test status:', err);
      alert('Error updating test status: ' + err.message);
    }
  };

  const handleDeleteTest = async () => {
    try {
      // Use the correct API endpoint: /api/tests with DELETE method
      const realTestId = testToDelete.testVersions && testToDelete.testVersions.length > 0
        ? testToDelete.testVersions[0]._id
        : testToDelete._id;

      const response = await fetch(`/api/tests?testId=${realTestId}`, {
        method: 'DELETE',
      });

      const result = await safeJsonParse(response);

      if (result.success) {
        // Refresh data
        fetchData();
        closeDeleteTestModal();
        alert('Test deleted successfully!');
      } else {
        alert('Failed to delete test: ' + result.error);
      }
    } catch (err) {
      console.error('Error deleting test:', err);
      alert('Error deleting test');
    }
  };

  // Deactivate/Activate test functionality

  // Organ actions

  const handleDeleteOrgan = async () => {
    try {
      const response = await fetch(`/api/organs?id=${organToDelete._id}`, {
        method: 'DELETE',
      });

      const result = await safeJsonParse(response);

      if (result.success) {
        // Refresh data
        fetchData();
        closeDeleteOrganModal();
        alert('Organ deleted successfully!');
      } else {
        alert('Failed to delete organ: ' + result.error);
      }
    } catch (err) {
      console.error('Error deleting organ:', err);
      alert('Error deleting organ');
    }
  };

  const handleUpdateOrgan = async (updatedData) => {
    try {
      // Create FormData for the API
      const formData = new FormData();
      formData.append('id', selectedOrgan._id);
      formData.append('organName', updatedData.organName);
      formData.append('status', updatedData.status);

      const response = await fetch('/api/organs', {
        method: 'PUT',
        body: formData,
      });

      const result = await safeJsonParse(response);

      if (result.success) {
        // Refresh data
        fetchData();
        closeEditOrganModal();
        alert('Organ updated successfully!');
      } else {
        alert('Failed to update organ: ' + result.error);
      }
    } catch (err) {
      console.error('Error updating organ:', err);
      alert('Error updating organ');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Test Management</h1>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold text-gray-900">{getUniqueTests().length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002-2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Organs</p>
              <p className="text-2xl font-bold text-gray-900">{organs.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>
        </div>


      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Tests</h2>
          <button
            onClick={openAddTestModal}
            className="px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200 font-semibold shadow-md"
          >
            + Add New Test
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  S.No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Organ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Price (₹)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Labs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getUniqueTests().map((test, index) => (
                <tr key={test._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {test.testName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {test.organ}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      console.log('Test category data:', test.category);
                      return test.category && test.category.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {test.category.map((cat, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#00CCFF] text-[#0052FF]"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{test.avgPrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${test.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {test.availableAtLabs ? (
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {test.availableAtLabs.split(',').length}
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {test.availableAtLabs.split(',').length === 1 ? 'Lab' : 'Labs'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewTestModal(test)}
                        className="p-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md"
                        title="View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openEditTestModal(test)}
                        className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDeactivateTestModal(test)}
                        className={`p-2 text-white ${test.status === 'Active' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} rounded-md`}
                        title={test.status === 'Active' ? 'Deactivate' : 'Activate'}
                      >
                        {test.status === 'Active' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => openDeleteTestModal(test)}
                        className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-md"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {getUniqueTests().length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No tests found. Tests added by vendors will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Organs Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Organs</h2>
          <button
            onClick={openAddOrganModal}
            className="px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200 font-semibold shadow-md"
          >
            + Add Organ
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  S.No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Organ Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getUniqueOrgans().map((organ) => (
                <tr key={organ._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {organ.serialNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {organ.organName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getStatusBadge(organ.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewOrganModal(organ)}
                        className="p-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md"
                        title="View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openEditOrganModal(organ)}
                        className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDeleteOrganModal(organ)}
                        className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-md"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {getUniqueOrgans().length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No organs found</p>
            </div>
          )}
        </div>
      </div>



      {/* Modals */}
      {isAddTestModalOpen && (
        <AddTestModal
          onClose={closeAddTestModal}
          onSubmit={handleAddTest}
          organs={organs}
        />
      )}

      {isVendorsModalOpen && selectedTest && (
        <VendorsModal
          test={selectedTest}
          onClose={() => setIsVendorsModalOpen(false)}
        />
      )}

      {isEditTestModalOpen && selectedTest && (
        <EditTestModal
          test={selectedTest}
          onClose={closeEditTestModal}
          onSubmit={handleUpdateTest}
          organs={organs}
        />
      )}

      {isViewTestModalOpen && selectedTest && (
        <ViewTestModal
          test={selectedTest}
          onClose={closeViewTestModal}
        />
      )}

      {isDeleteTestModalOpen && testToDelete && (
        <DeleteTestModal
          test={testToDelete}
          onClose={closeDeleteTestModal}
          onConfirm={handleDeleteTest}
        />
      )}

      {isAddOrganModalOpen && (
        <AddOrganModal
          onClose={closeAddOrganModal}
          onSubmit={async (newOrgan) => {
            try {
              // Create FormData for the API
              const formData = new FormData();
              formData.append('organName', newOrgan.organName);
              formData.append('labName', 'Admin'); // Default lab name for admin
              formData.append('status', newOrgan.status);

              const response = await fetch('/api/organs', {
                method: 'POST',
                body: formData,
              });

              const result = await safeJsonParse(response);

              if (result.success) {
                // Refresh data
                fetchData();
                closeAddOrganModal();
                alert('Organ added successfully!');
              } else {
                alert('Failed to add organ: ' + result.message);
              }
            } catch (err) {
              console.error('Error adding organ:', err);
              alert('Error adding organ');
            }
          }}
        />
      )}

      {isEditOrganModalOpen && selectedOrgan && (
        <EditOrganModal
          organ={selectedOrgan}
          onClose={closeEditOrganModal}
          onSubmit={handleUpdateOrgan}
        />
      )}

      {isViewOrganModalOpen && selectedOrgan && (
        <ViewOrganModal
          organ={selectedOrgan}
          onClose={closeViewOrganModal}
        />
      )}

      {isDeleteOrganModalOpen && organToDelete && (
        <DeleteOrganModal
          organ={organToDelete}
          onClose={closeDeleteOrganModal}
          onConfirm={handleDeleteOrgan}
        />
      )}

      {isDeactivateTestModalOpen && testToDeactivate && (
        <DeactivateTestModal
          test={testToDeactivate}
          onClose={closeDeactivateTestModal}
          onConfirm={handleDeactivateTest}
        />
      )}
    </div>
  );
};

// Add Test Modal Component
const AddTestModal = ({ onClose, onSubmit, organs }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    testName: '',
    organ: '',
    price: '',
    description: '',
    availableAtLabs: [],
    isPopular: false,
    status: 'Active',
    // New fields for step 2
    overview: '',
    testPreparation: [],
    importance: [],
    youtubeLinks: [],
    category: []
  });
  const [errors, setErrors] = useState({});
  const [vendorsList, setVendorsList] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newPoint, setNewPoint] = useState({ testPreparation: '', importance: '' });
  const [newYoutubeLink, setNewYoutubeLink] = useState('');

  // Fetch vendors when component mounts
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      const result = await safeJsonParse(response);

      if (result.success && result.vendors) {
        // Filter vendors with role 'vendor'
        const filteredVendors = result.vendors.filter(v => v.role === 'vendor');
        setVendorsList(filteredVendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle category checkbox changes
  const handleCategoryChange = (category) => {
    setFormData(prev => {
      const currentCategories = prev.category || [];
      const isSelected = currentCategories.includes(category);

      return {
        ...prev,
        category: isSelected
          ? currentCategories.filter(c => c !== category)
          : [...currentCategories, category]
      };
    });
  };

  const handleVendorToggle = (vendorId) => {
    setFormData(prev => {
      const currentLabs = prev.availableAtLabs || [];
      const isSelected = currentLabs.includes(vendorId);


      return {
        ...prev,
        availableAtLabs: isSelected
          ? currentLabs.filter(id => id !== vendorId)
          : [...currentLabs, vendorId]
      };
    });

    // Clear error when user selects
    if (errors.availableAtLabs) {
      setErrors(prev => ({
        ...prev,
        availableAtLabs: ''
      }));
    }
  };

  // Handle array field changes (for points)
  const handlePointChange = (field, value) => {
    setNewPoint(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add new point to array
  const addPoint = (field) => {
    if (newPoint[field].trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], { point: newPoint[field].trim() }]
      }));
      setNewPoint(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Remove point from array
  const removePoint = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Handle YouTube link changes
  const handleYoutubeLinkChange = (e) => {
    setNewYoutubeLink(e.target.value);
  };

  // Add new YouTube link
  const addYoutubeLink = () => {
    if (newYoutubeLink.trim()) {
      setFormData(prev => ({
        ...prev,
        youtubeLinks: [...prev.youtubeLinks, newYoutubeLink.trim()]
      }));
      setNewYoutubeLink('');
    }
  };

  // Remove YouTube link
  const removeYoutubeLink = (index) => {
    setFormData(prev => ({
      ...prev,
      youtubeLinks: prev.youtubeLinks.filter((_, i) => i !== index)
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.testName?.trim()) {
      newErrors.testName = 'Test name is required';
    }

    if (!formData.organ) {
      newErrors.organ = 'Please select an organ';
    }

    if (!formData.price || !formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (!isValidPrice(formData.price)) {
      newErrors.price = 'Price must be a number or range (e.g., 200 or 200-300)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    // You can add validation for step 2 fields if needed
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (currentStep === 1) {
      handleNextStep();
      return;
    }

    if (validateStep2()) {
      // Get vendor names from IDs
      const selectedVendorNames = vendorsList
        .filter(v => formData.availableAtLabs.includes(v._id))
        .map(v => v.labName)
        .join(', ');

      onSubmit({
        testName: formData.testName,
        organ: formData.organ,
        price: formData.price.trim(),
        description: formData.description,
        availableAtLabs: selectedVendorNames,
        isPopular: formData.isPopular,
        status: formData.status,
        // New fields from step 2
        overview: formData.overview,
        testPreparation: formData.testPreparation,
        importance: formData.importance,
        youtubeLinks: formData.youtubeLinks,
        // Category field
        category: formData.category
      });
    }
  };

  // Category options
  const categoryOptions = [
    { id: 'men', label: 'Men', value: 'Men' },
    { id: 'women', label: 'Women', value: 'Women' },
    { id: 'kids', label: 'Kids', value: 'Kids' },
    { id: 'couples', label: 'Couples', value: 'Couples' },
    { id: 'elders', label: 'Elders', value: 'Elders' }
  ];

  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50" >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Add New Test - Step {currentStep} of 2
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step indicator */}
          <div className="flex mb-6">
            <div className={`flex-1 text-center py-2 ${currentStep === 1 ? 'bg-[#0052FF] text-white' : 'bg-gray-200'} rounded-l-md`}>
              Step 1: Basic Info
            </div>
            <div className={`flex-1 text-center py-2 ${currentStep === 2 ? 'bg-[#0052FF] text-white' : 'bg-gray-200'} rounded-r-md`}>
              Step 2: Additional Info
            </div>
          </div>

          {currentStep === 1 && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="testName"
                  value={formData.testName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.testName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter test name"
                />
                {errors.testName && <p className="text-red-500 text-xs mt-1">{errors.testName}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organ <span className="text-red-500">*</span>
                </label>
                <select
                  name="organ"
                  value={formData.organ}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.organ ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select an organ</option>
                  {organs.map((organ) => (
                    <option key={organ._id} value={organ.organName}>
                      {organ.organName}
                    </option>
                  ))}
                </select>
                {errors.organ && <p className="text-red-500 text-xs mt-1">{errors.organ}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter price"
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter test description"
                  rows="3"
                />
              </div>

              {/* Category dropdown with checkboxes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categoryOptions.map((option) => (
                    <label key={option.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.category.includes(option.value)}
                        onChange={() => handleCategoryChange(option.value)}
                        className="w-4 h-4 text-[#0052FF] border-gray-300 rounded focus:ring-[#007AFF]"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available at Labs
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-left bg-white flex items-center justify-between"
                  >
                    <span className="text-gray-700">
                      {formData.availableAtLabs.length > 0
                        ? `${formData.availableAtLabs.length} lab(s) selected`
                        : 'Select labs'}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {vendorsList.length > 0 ? (
                        vendorsList.map((vendor) => (
                          <label
                            key={vendor._id}
                            className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.availableAtLabs.includes(vendor._id)}
                              onChange={() => handleVendorToggle(vendor._id)}
                              className="w-4 h-4 text-[#0052FF] border-gray-300 rounded focus:ring-[#007AFF]"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {vendor.labName}
                            </span>
                          </label>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No vendors available
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.availableAtLabs.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Selected labs:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.availableAtLabs.map((vendorId) => {
                        const vendor = vendorsList.find(v => v._id === vendorId);
                        return vendor ? (
                          <span
                            key={vendorId}
                            className="inline-flex items-center px-2 py-1 bg-[#00CCFF] text-[#0052FF] text-xs rounded-full"
                          >
                            {vendor.labName}
                            <button
                              type="button"
                              onClick={() => handleVendorToggle(vendorId)}
                              className="ml-1 text-[#0052FF] hover:text-[#0052FF]"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPopular"
                    checked={formData.isPopular}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#0052FF] border-gray-300 rounded focus:ring-[#007AFF]"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Mark as Popular</span>
                </label>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overview
                </label>
                <textarea
                  name="overview"
                  value={formData.overview}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter test overview"
                  rows="3"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Preparation Points
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newPoint.testPreparation}
                    onChange={(e) => handlePointChange('testPreparation', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Add preparation point"
                  />
                  <button
                    type="button"
                    onClick={() => addPoint('testPreparation')}
                    className="px-3 py-2 bg-[#0052FF] text-white rounded-md hover:bg-[#0052FF]"
                  >
                    Add
                  </button>
                </div>
                {formData.testPreparation.length > 0 && (
                  <ul className="mt-2 space-y-1 bg-gray-50 p-2 rounded-md">
                    {formData.testPreparation.map((item, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span className="text-sm">• {item.point}</span>
                        <button
                          type="button"
                          onClick={() => removePoint('testPreparation', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importance Points
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newPoint.importance}
                    onChange={(e) => handlePointChange('importance', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Add importance point"
                  />
                  <button
                    type="button"
                    onClick={() => addPoint('importance')}
                    className="px-3 py-2 bg-[#0052FF] text-white rounded-md hover:bg-[#0052FF]"
                  >
                    Add
                  </button>
                </div>
                {formData.importance.length > 0 && (
                  <ul className="mt-2 space-y-1 bg-gray-50 p-2 rounded-md">
                    {formData.importance.map((item, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span className="text-sm">• {item.point}</span>
                        <button
                          type="button"
                          onClick={() => removePoint('importance', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube Links
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newYoutubeLink}
                    onChange={handleYoutubeLinkChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Add YouTube link"
                  />
                  <button
                    type="button"
                    onClick={addYoutubeLink}
                    className="px-3 py-2 bg-[#0052FF] text-white rounded-md hover:bg-[#0052FF]"
                  >
                    Add
                  </button>
                </div>
                {formData.youtubeLinks.length > 0 && (
                  <ul className="mt-2 space-y-1 bg-gray-50 p-2 rounded-md">
                    {formData.youtubeLinks.map((link, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate max-w-[90%]"
                        >
                          {link}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeYoutubeLink(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          <div className="flex space-x-3">
            {currentStep === 2 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#0052FF] text-white rounded-md hover:bg-[#0052FF]"
            >
              {currentStep === 1 ? 'Next' : 'Add Test'}
            </button>
          </div>
        </form>
      </div>
    </div >
  );
};

// Edit Test Modal Component
const EditTestModal = ({ test, onClose, onSubmit, organs }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [vendorsList, setVendorsList] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Fetch vendors when component mounts
  useEffect(() => {
    fetchVendors();
  }, []);

  // Initialize form data after vendors are loaded
  useEffect(() => {
    if (vendorsList.length > 0 && test) {
      // Convert availableAtLabs string to array of vendor IDs
      const labNames = test.availableAtLabs ? test.availableAtLabs.split(',').map(name => name.trim()) : [];
      // Use a more flexible matching approach to handle case differences and partial matches
      const selectedVendorIds = vendorsList
        .filter(v => labNames.some(labName =>
          v.labName.toLowerCase().includes(labName.toLowerCase()) ||
          labName.toLowerCase().includes(v.labName.toLowerCase())
        ))
        .map(v => v._id);

      setFormData({
        testName: test.testName || '',
        organ: test.organ || '',
        price: test.price || '',
        description: test.description || '',
        availableAtLabs: selectedVendorIds,
        isPopular: test.isPopular || false,
        status: test.status || 'Active',
        overview: test.overview || '',
        testPreparation: test.testPreparation || [],
        importance: test.importance || [],
        youtubeLinks: test.youtubeLinks || [],
        category: test.category || [] // Add category field
      });
    }
  }, [vendorsList, test]);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      const result = await safeJsonParse(response);

      if (result.success && result.vendors) {
        // Filter vendors with role 'vendor'
        const filteredVendors = result.vendors.filter(v => v.role === 'vendor');
        setVendorsList(filteredVendors);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle category checkbox changes
  const handleCategoryChange = (category) => {
    setFormData(prev => {
      const currentCategories = prev.category || [];
      const isSelected = currentCategories.includes(category);

      return {
        ...prev,
        category: isSelected
          ? currentCategories.filter(c => c !== category)
          : [...currentCategories, category]
      };
    });
  };

  const handleVendorToggle = (vendorId) => {
    setFormData(prev => {
      const currentLabs = prev.availableAtLabs || [];
      const isSelected = currentLabs.includes(vendorId);

      return {
        ...prev,
        availableAtLabs: isSelected
          ? currentLabs.filter(id => id !== vendorId)
          : [...currentLabs, vendorId]
      };
    });

    // Clear error when user selects
    if (errors.availableAtLabs) {
      setErrors(prev => ({
        ...prev,
        availableAtLabs: ''
      }));
    }
  };

  const handlePointChange = (index, value, fieldName) => {
    setFormData(prev => {
      const updatedArray = [...(prev[fieldName] || [])];
      updatedArray[index] = { ...updatedArray[index], point: value };
      return { ...prev, [fieldName]: updatedArray };
    });
  };

  const addPoint = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), { point: '' }]
    }));
  };

  const removePoint = (index, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index)
    }));
  };

  const handleYoutubeLinkChange = (index, value) => {
    setFormData(prev => {
      const updatedLinks = [...(prev.youtubeLinks || [])];
      updatedLinks[index] = value;
      return { ...prev, youtubeLinks: updatedLinks };
    });
  };

  const addYoutubeLink = () => {
    setFormData(prev => ({
      ...prev,
      youtubeLinks: [...(prev.youtubeLinks || []), '']
    }));
  };

  const removeYoutubeLink = (index) => {
    setFormData(prev => ({
      ...prev,
      youtubeLinks: prev.youtubeLinks.filter((_, i) => i !== index)
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.testName?.trim()) {
      newErrors.testName = 'Test name is required';
    }

    if (!formData.organ) {
      newErrors.organ = 'Please select an organ';
    }

    if (!formData.price || !formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (!isValidPrice(formData.price)) {
      newErrors.price = 'Price must be a number or range (e.g., 200 or 200-300)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    // No required fields in step 2, but you can add validation if needed
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const validateForm = () => {
    return currentStep === 1 ? validateStep1() : validateStep2();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Get vendor names from IDs
      const selectedVendorNames = vendorsList
        .filter(v => formData.availableAtLabs.includes(v._id))
        .map(v => v.labName)
        .join(', ');

      onSubmit({
        testName: formData.testName,
        organ: formData.organ,
        price: formData.price.trim(),
        description: formData.description,
        availableAtLabs: selectedVendorNames,
        isPopular: formData.isPopular,
        status: formData.status,
        overview: formData.overview,
        testPreparation: formData.testPreparation,
        importance: formData.importance,
        youtubeLinks: formData.youtubeLinks,
        category: formData.category // Add category field
      });
    }
  };

  // Category options
  const categoryOptions = [
    { id: 'men', label: 'Men', value: 'Men' },
    { id: 'women', label: 'Women', value: 'Women' },
    { id: 'kids', label: 'Kids', value: 'Kids' },
    { id: 'couples', label: 'Couples', value: 'Couples' },
    { id: 'elders', label: 'Elders', value: 'Elders' }
  ];

  // Don't render form until vendors are loaded and formData is initialized
  if (vendorsList.length === 0 || !formData.testName) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052FF]"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Edit Test</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {currentStep === 1 && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="testName"
                  value={formData.testName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.testName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter test name"
                />
                {errors.testName && <p className="text-red-500 text-xs mt-1">{errors.testName}</p>}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organ <span className="text-red-500">*</span>
            </label>
            <select
              name="organ"
              value={formData.organ}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.organ ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select an organ</option>
              {organs.map((organ) => (
                <option key={organ._id} value={organ.organName}>
                  {organ.organName}
                </option>
              ))}
            </select>
            {errors.organ && <p className="text-red-500 text-xs mt-1">{errors.organ}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter price"
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter test description"
              rows="3"
            />
          </div>

          {/* Category dropdown with checkboxes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categoryOptions.map((option) => (
                <label key={option.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.category.includes(option.value)}
                    onChange={() => handleCategoryChange(option.value)}
                    className="w-4 h-4 text-[#0052FF] border-gray-300 rounded focus:ring-[#007AFF]"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available at Labs
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-left bg-white flex items-center justify-between"
              >
                <span className="text-gray-700">
                  {formData.availableAtLabs.length > 0
                    ? `${formData.availableAtLabs.length} lab(s) selected`
                    : 'Select labs'}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {vendorsList.length > 0 ? (
                    vendorsList.map((vendor) => (
                      <label
                        key={vendor._id}
                        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.availableAtLabs.includes(vendor._id)}
                          onChange={() => handleVendorToggle(vendor._id)}
                          className="w-4 h-4 text-[#0052FF] border-gray-300 rounded focus:ring-[#007AFF]"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {vendor.labName}
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No vendors available
                    </div>
                  )}
                </div>
              )}
            </div>
            {formData.availableAtLabs.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Selected labs:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.availableAtLabs.map((vendorId) => {
                    const vendor = vendorsList.find(v => v._id === vendorId);
                    return vendor ? (
                      <span
                        key={vendorId}
                        className="inline-flex items-center px-2 py-1 bg-[#00CCFF] text-[#0052FF] text-xs rounded-full"
                      >
                        {vendor.labName}
                        <button
                          type="button"
                          onClick={() => handleVendorToggle(vendorId)}
                          className="ml-1 text-[#0052FF] hover:text-[#0052FF]"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isPopular"
                checked={formData.isPopular}
                onChange={handleChange}
                className="w-4 h-4 text-[#0052FF] border-gray-300 rounded focus:ring-[#007AFF]"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Mark as Popular</span>
            </label>
          </div>

          {currentStep === 2 && (
            <>
              {/* Step 2 Fields */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overview
                </label>
                <textarea
                  name="overview"
                  value={formData.overview || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter test overview"
                  rows="3"
                />
              </div>

              {/* Test Preparation Points */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Preparation
                </label>
                {(formData.testPreparation || []).map((item, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={item.point || ''}
                      onChange={(e) => handlePointChange(index, e.target.value, 'testPreparation')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter preparation point"
                    />
                    <button
                      type="button"
                      onClick={() => removePoint(index, 'testPreparation')}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addPoint('testPreparation')}
                  className="mt-1 text-sm text-purple-600 hover:text-purple-800"
                >
                  + Add Preparation Point
                </button>
              </div>

              {/* Importance Points */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importance
                </label>
                {(formData.importance || []).map((item, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={item.point || ''}
                      onChange={(e) => handlePointChange(index, e.target.value, 'importance')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter importance point"
                    />
                    <button
                      type="button"
                      onClick={() => removePoint(index, 'importance')}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addPoint('importance')}
                  className="mt-1 text-sm text-purple-600 hover:text-purple-800"
                >
                  + Add Importance Point
                </button>
              </div>

              {/* YouTube Links */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube Links
                </label>
                {(formData.youtubeLinks || []).map((link, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={link || ''}
                      onChange={(e) => handleYoutubeLinkChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter YouTube link"
                    />
                    <button
                      type="button"
                      onClick={() => removeYoutubeLink(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addYoutubeLink}
                  className="mt-1 text-sm text-purple-600 hover:text-purple-800"
                >
                  + Add YouTube Link
                </button>
              </div>
            </>
          )}

          <div className="flex space-x-3">
            {currentStep === 2 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Previous
              </button>
            )}

            {currentStep === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 px-4 py-2 bg-[#0052FF] text-white rounded-md hover:bg-[#0052FF]"
              >
                Next
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#0052FF] text-white rounded-md hover:bg-[#0052FF]"
                >
                  Update Test
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// View Test Modal Component
const ViewTestModal = ({ test, onClose }) => {
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  // Fetch vendors when component mounts
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      const result = await safeJsonParse(response);

      if (result.success && result.vendors) {
        // Filter vendors with role 'vendor'
        const filteredVendors = result.vendors.filter(v => v.role === 'vendor');
        setVendors(filteredVendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoadingVendors(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      setVendors([]);
    };
  }, []);
  // Function to find vendor by lab name
  const findVendorByLabName = (labName) => {
    return vendors.find(vendor => vendor.labName === labName);
  };

  if (!test) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50">
          <h2 className="text-2xl font-bold text-gray-800">Test Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Test Name</label>
            <p className="text-lg font-semibold text-gray-900">{test.testName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Organ</label>
            <p className="text-lg text-gray-900">{test.organ}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Price</label>
            <p className="text-lg text-gray-900">₹{test.price}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
            <p className="text-base text-gray-900">{test.description || 'No description provided'}</p>
          </div>

          {/* Category section */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
            {test.category && test.category.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {test.category.map((cat, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#00CCFF] text-[#0052FF]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-base text-gray-900">No category assigned</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Available at Labs</label>
            {test.availableAtLabs ? (
              <div className="mt-2 space-y-3">
                {loadingVendors ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-2"></div>
                    <span className="text-sm text-gray-500">Loading lab details...</span>
                  </div>
                ) : (
                  test.availableAtLabs.split(',').map((lab, index) => {
                    const labName = lab.trim();
                    const vendor = findVendorByLabName(labName);

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                            <span className="text-purple-800 font-bold text-sm">
                              {labName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{labName}</h4>
                            {vendor ? (
                              <div className="mt-1 space-y-1">
                                {vendor.address && (
                                  <p className="text-sm text-gray-600 flex items-start">
                                    <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{vendor.address}</span>
                                  </p>
                                )}
                                {vendor.phone && (
                                  <p className="text-sm text-gray-600 flex items-center">
                                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>{vendor.phone}</span>
                                  </p>
                                )}
                                {/* Display actual price for this vendor if available */}
                                {test.actualPrice && typeof test.actualPrice === 'object' && test.actualPrice[labName] && (
                                  <p className="text-sm font-semibold text-[#0052FF] mt-1">
                                    Actual Price: ₹{test.actualPrice[labName]}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">Vendor details not available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <p className="text-base text-gray-900">Not specified</p>
            )}
            {/* Display vendor count if we have multiple versions */}
            {test.vendorCount && test.vendorCount > 1 && (
              <p className="text-sm text-gray-500 mt-2">
                Available at {test.vendorCount} different labs
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Popular Test</label>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${test.isPopular
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
              }`}>
              {test.isPopular ? '⭐ Yes' : 'No'}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${test.status === 'Active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}>
              {test.status}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Overview</label>
            <p className="text-base text-gray-900">{test.overview || 'No overview provided'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Test Preparation</label>
            {test.testPreparation && test.testPreparation.length > 0 ? (
              <ul className="list-disc pl-5 text-base text-gray-900">
                {test.testPreparation.map((item, index) => (
                  <li key={index}>{item.point}</li>
                ))}
              </ul>
            ) : (
              <p className="text-base text-gray-900">No preparation points provided</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Importance</label>
            {test.importance && test.importance.length > 0 ? (
              <ul className="list-disc pl-5 text-base text-gray-900">
                {test.importance.map((item, index) => (
                  <li key={index}>{item.point}</li>
                ))}
              </ul>
            ) : (
              <p className="text-base text-gray-900">No importance points provided</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">YouTube Links</label>
            {test.youtubeLinks && test.youtubeLinks.length > 0 ? (
              <div className="space-y-2">
                {test.youtubeLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:underline"
                  >
                    {link}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-base text-gray-900">No YouTube links provided</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Test Modal Component
const DeleteTestModal = ({ test, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Confirm Delete</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this test?
          </p>
          <p className="text-sm text-red-600 mt-4 font-medium">
            ⚠️ This action cannot be undone.
          </p>
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Organ Modal Component
const AddOrganModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    organName: '',
    status: 'Active'
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.organName.trim()) {
      newErrors.organName = 'Organ name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({
        organName: formData.organName,
        status: formData.status
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Add New Organ</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organ Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="organName"
              value={formData.organName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.organName ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter organ name"
            />
            {errors.organName && <p className="text-red-500 text-xs mt-1">{errors.organName}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Organ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Organ Modal Component
const EditOrganModal = ({ organ, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    organName: organ.organName || '',
    status: organ.status || 'Active'
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.organName.trim()) {
      newErrors.organName = 'Organ name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({
        organName: formData.organName,
        status: formData.status
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Edit Organ</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organ Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="organName"
              value={formData.organName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.organName ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter organ name"
            />
            {errors.organName && <p className="text-red-500 text-xs mt-1">{errors.organName}</p>}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#0052FF] text-white rounded-md hover:bg-[#0052FF]"
            >
              Update Organ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Organ Modal Component
const ViewOrganModal = ({ organ, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50">
          <h2 className="text-2xl font-bold text-gray-800">Organ Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Organ Name</label>
            <p className="text-lg font-semibold text-gray-900">{organ.organName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${organ.status === 'Active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}>
              {organ.status}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Organ Modal Component
const DeleteOrganModal = ({ organ, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Confirm Delete</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this organ?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Organ Name:</p>
            <p className="text-base font-bold text-gray-900">{organ.organName}</p>
          </div>
          <p className="text-sm text-red-600 mt-4 font-medium">
            ⚠️ This action cannot be undone.
          </p>
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Deactivate Test Modal Component
const DeactivateTestModal = ({ test, onClose, onConfirm }) => {
  if (!test) return null;

  const newStatus = test.status === 'Active' ? 'Inactive' : 'Active';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Confirm {newStatus}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to {newStatus.toLowerCase()} this test?
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">Test Name:</p>
              <p className="text-base font-bold text-gray-900">{test.testName}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Organ:</p>
              <p className="text-base text-gray-900">{test.organ}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Categories:</p>
              {test.category && test.category.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {test.category.map((cat, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#00CCFF] text-[#0052FF]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No categories assigned</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Available at Labs:</p>
              {test.availableAtLabs ? (
                <div className="mt-1">
                  <p className="text-sm text-gray-600">
                    {test.availableAtLabs.split(',').length} lab(s) will {newStatus === 'Active' ? 'see' : 'not see'} this test
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {test.availableAtLabs.split(',').map((lab, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {lab.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Not available at any labs</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Current Status:</p>
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${test.status === 'Active'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {test.status}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">New Status:</p>
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${newStatus === 'Active'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {newStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 ${newStatus === 'Active' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded-md`}
          >
            {newStatus}
          </button>
        </div>
      </div>
    </div>
  );
};

// Vendors Modal Component
const VendorsModal = ({ test, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Labs Using This Test</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            <span className="font-semibold">Test Name:</span> {test?.testName}
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
            <p className="text-sm font-semibold text-gray-700 mb-2">Labs:</p>
            {test?.vendorNames && test.vendorNames.length > 0 ? (
              <ul className="space-y-2">
                {test.vendorNames.map((name, index) => (
                  <li key={index} className="text-base text-gray-900 p-2 bg-white rounded border border-gray-100">
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No labs found for this test.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTestManagement;