'use client';
import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiFilter, FiEdit2, FiTrash2, FiEye, FiDownload, FiPrinter } from 'react-icons/fi';
import { safeJsonParse } from '../../utils/apiUtils';
import { isValidPrice } from '../../utils/priceUtils';

export default function TestManagement() {
  // State for tests and vendor information
  const [tests, setTests] = useState([]);
  const [vendorId, setVendorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: ''
  });
  const [organs, setOrgans] = useState([]);

  // Modal states
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
  const [isEditTestModalOpen, setIsEditTestModalOpen] = useState(false);
  const [isViewTestModalOpen, setIsViewTestModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  // Get vendor ID from database only, not localStorage
  useEffect(() => {
    console.log('TestManagement component mounted');

    // Only run on client side
    if (typeof window !== 'undefined') {
      // Try to get vendor ID from database
      const fetchVendorData = async () => {
        try {
          // First try the current endpoint
          let response = await fetch('/api/current-vendor');

          // Check if response is OK and content-type is JSON
          const contentType = response.headers.get('content-type');
          if (!response.ok || !contentType || !contentType.includes('application/json')) {
            // Log the actual response for debugging
            const responseText = await response.text();
            console.error('Vendor API response:', response.status, contentType, responseText.substring(0, 200));
            throw new Error(`Failed to fetch vendor data - Server returned ${response.status}`);
          }

          const data = await response.json();
          if (data.success && data.vendor) {
            setVendorId(data.vendor.id || data.vendor._id);
          } else {
            setError('Please log in as a vendor to manage tests.');
          }
        } catch (err) {
          console.error('Error fetching vendor data:', err);
          setError('Error fetching vendor data. Please log in again.');
        } finally {
          setLoading(false);
        }
      };

      fetchVendorData();
    }
  }, []);

  // Fetch organs from API
  useEffect(() => {
    const fetchOrgans = async () => {
      try {
        const response = await fetch('/api/organs');
        // Check if response is OK and content-type is JSON
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textContent = await response.text();
          console.error('Expected JSON but received:', contentType, textContent.substring(0, 200));
          throw new Error('Server returned invalid response format. Expected JSON.');
        }

        const result = await response.json();

        if (result.success) {
          // Filter only active organs
          const activeOrgans = result.data.filter(organ => organ.status === 'Active');
          setOrgans(activeOrgans);
        } else {
          throw new Error(result.error || 'Failed to fetch organs');
        }
      } catch (error) {
        console.error('Error fetching organs:', error);
        setError('Error fetching organs: ' + error.message);
      }
    };

    fetchOrgans();
  }, []);

  // Fetch tests for this vendor when vendorId is available
  useEffect(() => {
    console.log('Vendor ID changed:', vendorId);
    if (vendorId && typeof window !== 'undefined') {
      console.log('Fetching tests for vendor ID:', vendorId);
      fetchVendorTests();
    }
  }, [vendorId]);

  const fetchVendorTests = async () => {
    try {
      setLoading(true);
      console.log('Making API call to fetch tests for vendor:', vendorId);

      // First, get the vendor details to get the lab name
      const vendorResponse = await fetch('/api/current-vendor');
      const vendorResult = await safeJsonParse(vendorResponse);

      let labName = 'Unknown Lab';
      if (vendorResult.success && vendorResult.vendor) {
        labName = vendorResult.vendor.labName || vendorResult.vendor.name || 'Unknown Lab';
      }

      console.log('Fetching tests for lab name:', labName);

      // Use the correct API endpoint: /api/tests with labName parameter to get both vendor tests and availableAtLabs tests
      const response = await fetch(`/api/tests?labName=${encodeURIComponent(labName)}`);

      // Check if response is OK and content-type is JSON
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textContent = await response.text();
        console.error('Expected JSON but received:', contentType, textContent.substring(0, 200));
        throw new Error('Server returned invalid response format. Expected JSON.');
      }

      const data = await response.json();
      console.log('API response received:', data);

      if (data.success) {
        setTests(data.tests);
      } else {
        setError(data.error || 'Failed to fetch tests');
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Error fetching tests: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  // Filter tests based on search and filters
  const filteredTests = tests.filter(test => {
    const matchesSearch = test.testName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filters.status || test.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  // Handle edit test
  const handleEdit = (test) => {
    openEditTestModal(test);
  };

  // Handle delete test
  const handleDelete = async (test) => {
    openDeleteConfirmModal(test);
  };

  // Perform the actual deletion
  const confirmDelete = async () => {
    try {
      // Use the correct API endpoint: /api/tests with DELETE method
      const response = await fetch(`/api/tests?testId=${selectedTest._id}`, {
        method: 'DELETE',
      });

      // Check if response is OK and content-type is JSON
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textContent = await response.text();
        console.error('Expected JSON but received:', contentType, textContent.substring(0, 200));
        throw new Error('Server returned invalid response format. Expected JSON.');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete test');
      }

      // Refresh tests
      await fetchVendorTests();
      closeDeleteConfirmModal();
      alert('Test deleted successfully!');
    } catch (err) {
      setError('Error deleting test: ' + err.message);
      closeDeleteConfirmModal();
    }
  };

  // Modal handlers for ViewTestModal
  const openViewTestModal = (test) => {
    setSelectedTest(test);
    setIsViewTestModalOpen(true);
  };
  const closeViewTestModal = () => {
    setIsViewTestModalOpen(false);
    setSelectedTest(null);
  };

  // Modal handlers for AddTestModal
  const openAddTestModal = () => setIsAddTestModalOpen(true);
  const closeAddTestModal = () => setIsAddTestModalOpen(false);

  // Modal handlers for EditTestModal
  const openEditTestModal = (test) => {
    setSelectedTest(test);
    setIsEditTestModalOpen(true);
  };
  const closeEditTestModal = () => {
    setIsEditTestModalOpen(false);
    setSelectedTest(null);
  };

  // Modal handlers for Delete Confirmation Modal
  const openDeleteConfirmModal = (test) => {
    setSelectedTest(test);
    setIsDeleteConfirmModalOpen(true);
  };
  const closeDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
    setSelectedTest(null);
  };

  // Handle add test from AddTestModal
  const handleAddTest = async (newTest) => {
    try {
      console.log('Adding test with data:', newTest);

      // First, get the vendor details to get the lab name
      const vendorResponse = await fetch('/api/current-vendor');
      const vendorResult = await safeJsonParse(vendorResponse);

      let labName = 'Unknown Lab';
      if (vendorResult.success && vendorResult.vendor) {
        labName = vendorResult.vendor.labName || vendorResult.vendor.name || 'Unknown Lab';
      }

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
          actualPrice: newTest.actualPrice, // Will be handled as vendor-specific in the API
          description: newTest.description,
          isPopular: newTest.isPopular,
          status: newTest.status || 'Active',
          overview: newTest.overview || '',
          testPreparation: newTest.testPreparation || [],
          importance: newTest.importance || [],
          youtubeLinks: newTest.youtubeLinks || [],
          category: newTest.category || [],
          availableAtLabs: labName // Add the lab name to availableAtLabs
        }),
      });

      const result = await safeJsonParse(response);

      console.log('Add test response:', result);

      if (result.success) {
        // Refresh data
        await fetchVendorTests();
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

  // Handle update test from EditTestModal
  const handleUpdateTest = async (updatedTest) => {
    try {
      console.log('Updating test with data:', updatedTest);

      // First, get the vendor details to get the lab name
      const vendorResponse = await fetch('/api/current-vendor');
      const vendorResult = await safeJsonParse(vendorResponse);

      let labName = 'Unknown Lab';
      if (vendorResult.success && vendorResult.vendor) {
        labName = vendorResult.vendor.labName || vendorResult.vendor.name || 'Unknown Lab';
      }

      // Get the existing availableAtLabs from the selected test
      let existingLabs = selectedTest.availableAtLabs || '';

      // If the existing labs don't already include this vendor's lab, add it
      if (existingLabs && !existingLabs.includes(labName)) {
        existingLabs = existingLabs ? `${existingLabs}, ${labName}` : labName;
      } else if (!existingLabs) {
        existingLabs = labName;
      }

      // Use the correct API endpoint: /api/tests with PUT method
      const response = await fetch('/api/tests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: selectedTest._id,
          vendorId: vendorId,
          testName: updatedTest.testName,
          organ: updatedTest.organ,
          price: updatedTest.price,
          actualPrice: updatedTest.actualPrice, // Will be handled as vendor-specific in the API
          description: updatedTest.description,
          isPopular: updatedTest.isPopular,
          status: updatedTest.status,
          overview: updatedTest.overview,
          testPreparation: updatedTest.testPreparation,
          importance: updatedTest.importance,
          youtubeLinks: updatedTest.youtubeLinks,
          category: updatedTest.category,
          availableAtLabs: existingLabs // Preserve and update the availableAtLabs field
        }),
      });

      const result = await safeJsonParse(response);

      console.log('Update test response:', result);

      if (result.success) {
        // Refresh data
        await fetchVendorTests();
        closeEditTestModal();
        alert('Test updated successfully!');
      } else {
        const errorMsg = result.message || result.error || 'Unknown error';
        const details = result.details ? `\nDetails: ${result.details}` : '';
        console.error('Failed to update test:', result);
        alert('Failed to update test: ' + errorMsg + details);
      }
    } catch (err) {
      console.error('Error updating test:', err);
      alert('Error updating test: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          {/* Simple neat spinner */}
          <div className="w-6 h-6 rounded-full border-[2px] border-slate-100 border-t-slate-800 animate-spin"></div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Loading</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Tests</h3>
                <p className="text-sm text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Management</h1>
            <p className="text-sm text-gray-600 mt-2">Manage your laboratory tests and pricing</p>
          </div>
          <button
            onClick={openAddTestModal}
            className="bg-gradient-to-r from-[#0052FF] to-[#0000FF] hover:from-[#0000FF] hover:to-[#0700C4] text-white px-6 py-3 rounded-lg flex items-center font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <FiPlus className="mr-2 w-5 h-5" />
            Add New Test
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tests by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Tests Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Test Name
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actual Price
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTests.length > 0 ? (
                  filteredTests.map((test) => (
                    <tr key={test._id} className="hover:bg-grey-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{test.testName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{test.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {test.actualPrice ? `₹${parseInt(test.actualPrice).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${test.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${test.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {test.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEdit(test)}
                            className="p-2 text-[#0052FF] hover:bg-[#00CCFF] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(test)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openViewTestModal(test)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002-2h2a2 2 0 002 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <p className="text-gray-500 font-medium text-lg">No tests found</p>
                        <p className="text-sm text-gray-400 mt-2">{vendorId ? 'Click "Add New Test" to get started.' : 'Please log in as a vendor to manage tests.'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTests.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">1</span> to <span className="font-semibold text-gray-900">{filteredTests.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{filteredTests.length}</span> tests
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  Previous
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#0052FF] hover:bg-[#0052FF] transition-colors shadow-sm">
                  1
                </button>
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={filteredTests.length < 10}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Test Modal */}
      {isAddTestModalOpen && (
        <AddTestModal
          onClose={closeAddTestModal}
          onSubmit={handleAddTest}
          organs={organs}
          vendorId={vendorId}
        />
      )}

      {/* Edit Test Modal */}
      {isEditTestModalOpen && selectedTest && (
        <EditTestModal
          test={selectedTest}
          onClose={closeEditTestModal}
          onSubmit={handleUpdateTest}
          organs={organs}
          vendorId={vendorId}
        />
      )}

      {/* View Test Modal */}
      {isViewTestModalOpen && selectedTest && (
        <ViewTestModal
          test={selectedTest}
          onClose={closeViewTestModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmModalOpen && selectedTest && (
        <DeleteConfirmModal
          test={selectedTest}
          onClose={closeDeleteConfirmModal}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

// Edit Test Modal Component
const EditTestModal = ({ test, onClose, onSubmit, organs, vendorId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    testName: '',
    organ: '',
    price: '',
    actualPrice: '',
    description: '',
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
  const [newPoint, setNewPoint] = useState({ testPreparation: '', importance: '' });
  const [newYoutubeLink, setNewYoutubeLink] = useState('');

  // Initialize form data when test prop changes
  useEffect(() => {
    if (test) {
      // Extract vendor-specific actual price
      let vendorActualPrice = '';
      if (typeof test.actualPrice === 'object' && test.actualPrice !== null) {
        // Since the API now returns the vendor-specific price directly, we can use it as-is
        vendorActualPrice = test.actualPrice;
      } else if (typeof test.actualPrice === 'string') {
        vendorActualPrice = test.actualPrice;
      }

      setFormData({
        testName: test.testName || '',
        organ: test.organ || '',
        price: test.price || '',
        actualPrice: vendorActualPrice,
        description: test.description || '',
        isPopular: test.isPopular || false,
        status: test.status || 'Active',
        overview: test.overview || '',
        testPreparation: test.testPreparation || [],
        importance: test.importance || [],
        youtubeLinks: test.youtubeLinks || [],
        category: test.category || []
      });
    }
  }, [test, vendorId]); const handleChange = (e) => {
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
      onSubmit({
        testName: formData.testName,
        organ: formData.organ,
        price: formData.price.trim(),
        actualPrice: formData.actualPrice, // This will be handled as vendor-specific in the API
        description: formData.description,
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

  // Don't render form until test data is loaded
  if (!test) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Edit Test - Step {currentStep} of 2
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
                  Actual Price (₹)
                </label>
                <input
                  type="text"
                  name="actualPrice"
                  value={formData.actualPrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter actual price"
                />
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
                          className="text-sm text-[#0052FF] hover:underline truncate max-w-[90%]"
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
              {currentStep === 1 ? 'Next' : 'Update Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Test Modal Component (simplified version for vendor use)
const ViewTestModal = ({ test, onClose }) => {
  if (!test) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#00CCFF]">
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
                    className="block text-[#0052FF] hover:underline"
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
            className="w-full px-4 py-2 bg-[#0052FF] text-white rounded-md hover:bg-[#0052FF]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ test, onClose, onConfirm }) => {
  if (!test) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
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

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>

          <p className="text-center text-gray-700">
            Are you sure you want to delete the test <span className="font-semibold">"{test.testName}"</span>? This action cannot be undone.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Test Modal Component (similar to admin version but simplified for vendor use)
const AddTestModal = ({ onClose, onSubmit, organs, vendorId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    testName: '',
    organ: '',
    price: '',
    actualPrice: '',
    description: '',
    isPopular: false,
    status: 'Active',
    // New fields for step 2
    overview: '',
    testPreparation: [],
    importance: [],
    youtubeLinks: [],
    category: []
  }); const [errors, setErrors] = useState({});
  const [newPoint, setNewPoint] = useState({ testPreparation: '', importance: '' });
  const [newYoutubeLink, setNewYoutubeLink] = useState('');

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
      onSubmit({
        testName: formData.testName,
        organ: formData.organ,
        price: formData.price.trim(),
        actualPrice: formData.actualPrice, // This will be handled as vendor-specific in the API
        description: formData.description,
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
    <div className="fixed inset-0 flex items-center justify-center z-50">
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
                  Actual Price (₹)
                </label>
                <input
                  type="text"
                  name="actualPrice"
                  value={formData.actualPrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter actual price"
                />
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
                          className="block text-[#0052FF] hover:underline"
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
    </div>
  );
};
