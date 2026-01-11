'use client';

import { useState, useEffect } from 'react';
import AddTest from './addtest';
import AddOrgan from './addorgan';
import AddSymptom from './addsymptom';
import { isValidPrice } from '../../utils/priceUtils';

import { safeJsonParse } from '../../../utils/apiUtils';

// View Test Modal Component
const ViewTestModal = ({ test, vendors, onClose }) => {
  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v._id === vendorId);
    return vendor ? vendor.labName : 'Unknown Vendor';
  };

  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50">
          <h2 className="text-2xl font-bold text-gray-800">Test Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Test Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">Test Name</label>
            <p className="text-lg font-semibold text-gray-900">{test.testName}</p>
          </div>

          {/* Organ */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">Organ</label>
            <p className="text-lg text-gray-900">{test.organ}</p>
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">Vendor</label>
            <p className="text-lg text-gray-900">{getVendorName(test.vendorId)}</p>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">Price</label>
            <p className="text-lg text-gray-900">₹{test.price}</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">Status</label>
            <span className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${test.status === 'Active'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
              }`}>
              {test.status}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ test, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="ml-4 text-xl font-bold text-gray-800">Confirm Delete</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this test?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Test Name:</p>
            <p className="text-base font-bold text-gray-900">{test.testName}</p>
            <p className="text-sm font-semibold text-gray-700 mt-3 mb-1">Organ:</p>
            <p className="text-base text-gray-900">{test.organ}</p>
            <p className="text-sm font-semibold text-gray-700 mt-3 mb-1">Price:</p>
            <p className="text-base text-gray-900">₹{test.price}</p>
          </div>
          <p className="text-sm text-red-600 mt-4 font-medium">
            ⚠️ This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Test Form Component
const EditTestForm = ({ test, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    testName: '',
    price: '',
    status: 'Active'
  });
  const [errors, setErrors] = useState({});

  // Initialize form with existing test data
  useEffect(() => {
    if (test) {
      setFormData({
        testName: test.testName || '',
        price: test.price || '',
        status: test.status || 'Active'
      });
    }
  }, [test]);

  const handleNameChange = (e) => {
    setFormData({ ...formData, testName: e.target.value });
    if (errors.testName) {
      setErrors({ ...errors, testName: '' });
    }
  };

  const handlePriceChange = (e) => {
    setFormData({ ...formData, price: e.target.value });
    if (errors.price) {
      setErrors({ ...errors, price: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.testName.trim()) {
      newErrors.testName = 'Test name is required';
    }

    if (!formData.price || !formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (!isValidPrice(formData.price)) {
      newErrors.price = 'Price must be a number or range (e.g., 200 or 200-300)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Edit Test</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Test Name Field */}
          <div className="mb-6">
            <label htmlFor="testName" className="block text-sm font-semibold text-gray-700 mb-2">
              Test Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="testName"
              value={formData.testName}
              onChange={handleNameChange}
              placeholder="Enter test name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${errors.testName
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
                }`}
            />
            {errors.testName && (
              <p className="text-red-500 text-sm mt-2">{errors.testName}</p>
            )}
          </div>

          {/* Price Field */}
          <div className="mb-6">
            <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="text" // Changed from "number" to "text" to support ranges
              id="price"
              value={formData.price}
              onChange={handlePriceChange}
              placeholder="Enter price (e.g., 500 or 200-300)"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${errors.price
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
                }`}
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-2">{errors.price}</p>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="mb-6">
            <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => {
                setFormData({ ...formData, status: e.target.value });
                if (errors.status) {
                  setErrors({ ...errors, status: '' });
                }
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${errors.status
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
                }`}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md"
            >
              Update Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LabTestsPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testToDelete, setTestToDelete] = useState(null);
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [organs, setOrgans] = useState([]);
  const [isAddOrganModalOpen, setIsAddOrganModalOpen] = useState(false);
  const [isEditOrganModalOpen, setIsEditOrganModalOpen] = useState(false);
  const [isDeleteOrganModalOpen, setIsDeleteOrganModalOpen] = useState(false);
  const [organToDelete, setOrganToDelete] = useState(null);
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [isAddSymptomModalOpen, setIsAddSymptomModalOpen] = useState(false);
  const [isEditSymptomModalOpen, setIsEditSymptomModalOpen] = useState(false);
  const [isViewSymptomModalOpen, setIsViewSymptomModalOpen] = useState(false);
  const [isDeleteSymptomModalOpen, setIsDeleteSymptomModalOpen] = useState(false);
  const [symptomToDelete, setSymptomToDelete] = useState(null);
  const [selectedSymptom, setSelectedSymptom] = useState(null);

  // Fetch lab tests from database
  useEffect(() => {
    fetchLabTests();
    fetchVendors();
    fetchOrgans();
  }, []);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      // Fetch tests from the vendor-tests API
      // For now, we'll need to fetch all tests and group by vendor
      // In a real implementation, you would have a dedicated API for admin test management
      const response = await fetch('/api/vendor-tests?vendorId=admin'); // Placeholder
      const result = await safeJsonParse(response);

      if (result.success) {
        setLabTests(result.tests || []);
      } else {
        // No fallback to mock data - ensure database usage
        setLabTests([]);
        setError('Failed to load lab tests from database');
      }
    } catch (error) {
      setError('Error fetching lab tests');
      console.error('Error fetching lab tests:', error);
      // No fallback to mock data - ensure database usage
      setLabTests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      const result = await safeJsonParse(response);

      if (result.success) {
        setVendors(result.vendors || []);
      } else {
        // No fallback to mock data - ensure database usage
        setVendors([]);
        setError('Failed to load vendors from database');
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      // No fallback to mock data - ensure database usage
      setVendors([]);
    }
  };

  const fetchOrgans = async () => {
    try {
      const response = await fetch('/api/organs');
      const result = await safeJsonParse(response);

      if (result.success) {
        setOrgans(result.data || []);
      } else {
        // No fallback to mock data - ensure database usage
        setOrgans([]);
        setError('Failed to load organs from database');
      }
    } catch (error) {
      console.error('Error fetching organs:', error);
      // No fallback to mock data - ensure database usage
      setOrgans([]);
    }
  };

  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v._id === vendorId);
    return vendor ? vendor.labName : 'Unknown Vendor';
  };

  const getAveragePrice = (testName) => {
    const matchingTests = labTests.filter(test => test.testName === testName);
    if (matchingTests.length === 0) return '0';

    // Filter out tests with price ranges (containing hyphens) for average calculation
    const numericPriceTests = matchingTests.filter(test => !test.price.includes('-'));

    if (numericPriceTests.length === 0) {
      // If all tests have price ranges, return the first one
      return matchingTests[0].price;
    }

    const total = numericPriceTests.reduce((sum, test) => sum + Number(test.price), 0);
    return Math.round(total / numericPriceTests.length).toString();
  };

  // Get unique test names for the main table
  const getUniqueTests = () => {
    const uniqueTests = [];
    const testNames = [...new Set(labTests.map(test => test.testName))];

    testNames.forEach(testName => {
      const test = labTests.find(t => t.testName === testName);
      if (test) {
        uniqueTests.push({
          ...test,
          avgPrice: getAveragePrice(testName)
        });
      }
    });

    return uniqueTests;
  };

  const handleView = (id) => {
    const test = labTests.find(t => t._id === id);
    if (test) {
      setSelectedTest(test);
      setIsViewModalOpen(true);
    }
  };

  const handleEdit = (id) => {
    const test = labTests.find(t => t._id === id);
    if (test) {
      setSelectedTest(test);
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateTest = async (updatedData) => {
    try {
      const response = await fetch('/api/vendor-tests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: selectedTest._id,
          vendorId: selectedTest.vendorId,
          testName: updatedData.testName,
          price: updatedData.price,
          status: updatedData.status || 'Active',
        }),
      });
      const result = await safeJsonParse(response);

      if (result.success) {
        setLabTests(labTests.map(test =>
          test._id === selectedTest._id ? result.test : test
        ));
        setIsEditModalOpen(false);
        setSelectedTest(null);
        alert('Lab test updated successfully!');
      } else {
        alert('Failed to update lab test: ' + result.error);
      }
    } catch (error) {
      alert('Error updating lab test: ' + error.message);
      console.error('Error updating lab test:', error);
    }
  };

  const handleDelete = (id) => {
    const test = labTests.find(t => t._id === id);
    if (test) {
      setTestToDelete(test);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!testToDelete) return;

    try {
      const response = await fetch(`/api/vendor-tests?testId=${testToDelete._id}&vendorId=${testToDelete.vendorId}`, {
        method: 'DELETE',
      });
      const result = await safeJsonParse(response);

      if (result.success) {
        setLabTests(labTests.filter(test => test._id !== testToDelete._id));
        setIsDeleteModalOpen(false);
        setTestToDelete(null);
        console.log('Lab test deleted successfully');
      } else {
        alert('Failed to delete lab test: ' + result.error);
        console.error('Failed to delete lab test:', result.error);
      }
    } catch (error) {
      alert('Error deleting lab test');
      console.error('Error deleting lab test:', error);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTestToDelete(null);
  };

  const handleDeactivate = async (id) => {
    const test = labTests.find(t => t._id === id);
    if (!test) return;

    const newStatus = test.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const response = await fetch('/api/vendor-tests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: test._id,
          vendorId: test.vendorId,
          status: newStatus
        }),
      });
      const result = await safeJsonParse(response);

      if (result.success) {
        setLabTests(labTests.map(t =>
          t._id === id ? { ...t, status: newStatus } : t
        ));
        console.log('Lab test status updated successfully');
      } else {
        alert('Failed to update status: ' + result.error);
        console.error('Failed to update status:', result.error);
      }
    } catch (error) {
      alert('Error updating status');
      console.error('Error updating status:', error);
    }
  };

  const handleAddTest = async (newTest) => {
    try {
      console.log('Adding lab test with data:', newTest);

      // For now, we'll add to a default vendor
      const defaultVendor = vendors[0]?._id || 'defaultVendor';

      const response = await fetch('/api/vendor-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: defaultVendor,
          testName: newTest.testName,
          organ: newTest.organ,
          price: newTest.price,
          status: newTest.status || 'Active',
        }),
      });
      const result = await safeJsonParse(response);
      console.log('API Response:', result);

      if (result.success) {
        console.log('Lab test data from server:', result.test);
        setLabTests([result.test, ...labTests]);
        setIsAddModalOpen(false);
        alert(`Lab test "${result.test.testName}" added successfully!\nPrice: ₹${result.test.price}\nStatus: ${result.test.status}`);
      } else {
        alert('Failed to add lab test: ' + result.error);
        console.error('Failed to add lab test:', result.error);
      }
    } catch (error) {
      alert('Error adding lab test: ' + error.message);
      console.error('Error adding lab test:', error);
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Get unique organs for the organs table
  const getUniqueOrgans = () => {
    const uniqueOrgans = [];
    const organNames = [...new Set(organs.map(organ => organ.organName))];

    organNames.forEach(organName => {
      const organ = organs.find(o => o.organName === organName);
      if (organ) {
        // Count vendors offering tests for this organ
        const vendorsForOrgan = [...new Set(
          labTests
            .filter(test => test.organ === organName)
            .map(test => test.vendorId)
        )];

        uniqueOrgans.push({
          ...organ,
          vendorCount: vendorsForOrgan.length,
          vendors: vendorsForOrgan
        });
      }
    });

    return uniqueOrgans;
  };

  const handleAddOrgan = async (newOrgan) => {
    try {
      console.log('Adding organ with data:', newOrgan);

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
      console.log('API Response:', result);

      if (result.success) {
        console.log('New organ data from server:', result.data);
        setOrgans([result.data, ...organs]);
        setIsAddOrganModalOpen(false);
        alert(`Organ "${result.data.organName}" added successfully!\nStatus: ${result.data.status}`);
      } else {
        alert('Failed to add organ: ' + result.message);
        console.error('Failed to add organ:', result.message);
      }
    } catch (error) {
      alert('Error adding organ: ' + error.message);
      console.error('Error adding organ:', error);
    }
  };

  const handleOpenAddOrganModal = () => {
    setIsAddOrganModalOpen(true);
  };

  const handleCloseAddOrganModal = () => {
    setIsAddOrganModalOpen(false);
  };

  const handleEditOrgan = (id) => {
    const organ = organs.find(o => o._id === id);
    if (organ) {
      setSelectedOrgan(organ);
      setIsEditOrganModalOpen(true);
    }
  };

  const handleUpdateOrgan = async (updatedData) => {
    try {
      const response = await fetch('/api/organs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organId: selectedOrgan._id,
          organName: updatedData.organName,
          status: updatedData.status
        }),
      });
      const result = await safeJsonParse(response);

      if (result.success) {
        setOrgans(organs.map(organ =>
          organ._id === selectedOrgan._id ? result.organ : organ
        ));
        setIsEditOrganModalOpen(false);
        setSelectedOrgan(null);
        alert('Organ updated successfully!');
      } else {
        alert('Failed to update organ: ' + result.error);
      }
    } catch (error) {
      alert('Error updating organ: ' + error.message);
      console.error('Error updating organ:', error);
    }
  };

  const handleDeleteOrgan = (id) => {
    const organ = organs.find(o => o._id === id);
    if (organ) {
      setOrganToDelete(organ);
      setIsDeleteOrganModalOpen(true);
    }
  };

  const confirmDeleteOrgan = async () => {
    if (!organToDelete) return;

    try {
      const response = await fetch(`/api/organs?organId=${organToDelete._id}`, {
        method: 'DELETE',
      });
      const result = await safeJsonParse(response);

      if (result.success) {
        setOrgans(organs.filter(organ => organ._id !== organToDelete._id));
        setIsDeleteOrganModalOpen(false);
        setOrganToDelete(null);
        console.log('Organ deleted successfully');
      } else {
        alert('Failed to delete organ: ' + result.error);
        console.error('Failed to delete organ:', result.error);
      }
    } catch (error) {
      alert('Error deleting organ');
      console.error('Error deleting organ:', error);
    }
  };

  const cancelDeleteOrgan = () => {
    setIsDeleteOrganModalOpen(false);
    setOrganToDelete(null);
  };

  const handleAddSymptom = async (newSymptom) => {
    try {
      console.log('Adding symptom with data:', newSymptom);

      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptomName: newSymptom.symptomName,
          organ: newSymptom.organ,
          description: newSymptom.description,
          status: newSymptom.status || 'Active',
        }),
      });
      const result = await safeJsonParse(response);
      console.log('API Response:', result);

      if (result.success) {
        console.log('Symptom data from server:', result.symptom);
        setSymptoms([result.symptom, ...symptoms]);
        setIsAddSymptomModalOpen(false);
        alert(`Symptom "${result.symptom.symptomName}" added successfully!\nOrgan: ${result.symptom.organ}\nStatus: ${result.symptom.status}`);
      } else {
        alert('Failed to add symptom: ' + result.error);
        console.error('Failed to add symptom:', result.error);
      }
    } catch (error) {
      alert('Error adding symptom: ' + error.message);
      console.error('Error adding symptom:', error);
    }
  };

  const handleOpenAddSymptomModal = () => {
    setIsAddSymptomModalOpen(true);
  };

  const handleCloseAddSymptomModal = () => {
    setIsAddSymptomModalOpen(false);
  };

  const handleEditSymptom = (id) => {
    const symptom = symptoms.find(s => s._id === id);
    if (symptom) {
      setSelectedSymptom(symptom);
      setIsEditSymptomModalOpen(true);
    }
  };

  const handleUpdateSymptom = async (updatedData) => {
    try {
      const response = await fetch('/api/symptoms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptomId: selectedSymptom._id,
          symptomName: updatedData.symptomName,
          organ: updatedData.organ,
          description: updatedData.description,
          status: updatedData.status
        }),
      });
      const result = await safeJsonParse(response);

      if (result.success) {
        setSymptoms(symptoms.map(symptom =>
          symptom._id === selectedSymptom._id ? result.symptom : symptom
        ));
        setIsEditSymptomModalOpen(false);
        setSelectedSymptom(null);
        alert('Symptom updated successfully!');
      } else {
        alert('Failed to update symptom: ' + result.error);
      }
    } catch (error) {
      alert('Error updating symptom: ' + error.message);
      console.error('Error updating symptom:', error);
    }
  };

  const handleViewSymptom = (id) => {
    const symptom = symptoms.find(s => s._id === id);
    if (symptom) {
      setSelectedSymptom(symptom);
      setIsViewSymptomModalOpen(true);
    }
  };

  const handleDeleteSymptom = (id) => {
    const symptom = symptoms.find(s => s._id === id);
    if (symptom) {
      setSymptomToDelete(symptom);
      setIsDeleteSymptomModalOpen(true);
    }
  };

  const confirmDeleteSymptom = async () => {
    if (!symptomToDelete) return;

    try {
      const response = await fetch(`/api/symptoms?symptomId=${symptomToDelete._id}`, {
        method: 'DELETE',
      });
      const result = await safeJsonParse(response);

      if (result.success) {
        setSymptoms(symptoms.filter(symptom => symptom._id !== symptomToDelete._id));
        setIsDeleteSymptomModalOpen(false);
        setSymptomToDelete(null);
        console.log('Symptom deleted successfully');
      } else {
        alert('Failed to delete symptom: ' + result.error);
        console.error('Failed to delete symptom:', result.error);
      }
    } catch (error) {
      alert('Error deleting symptom');
      console.error('Error deleting symptom:', error);
    }
  };

  const cancelDeleteSymptom = () => {
    setIsDeleteSymptomModalOpen(false);
    setSymptomToDelete(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Test Management</h1>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200 font-semibold shadow-md"
        >
          + Add New Test
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Organs</p>
              <p className="text-2xl font-bold text-gray-900">{organs.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Symptoms</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Tests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Organ
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Vendors
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Avg Price (₹)
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getUniqueTests().map((test, index) => (
                <tr key={test._id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{test.testName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{test.organ}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {labTests.filter(t => t.testName === test.testName).length}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">₹{test.avgPrice}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 justify-center">
                      {/* View Icon */}
                      <button
                        onClick={() => handleView(test._id)}
                        className="p-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                        title="View"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Edit Icon */}
                      <button
                        onClick={() => handleEdit(test._id)}
                        className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Icon */}
                      <button
                        onClick={() => handleDelete(test._id)}
                        className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052FF]"></div>
            <p className="mt-4 text-sm text-gray-500">Loading lab tests...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading lab tests</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchLabTests}
              className="mt-4 px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && getUniqueTests().length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No lab tests</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new lab test.</p>
          </div>
        )}
      </div>

      {/* Organs Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Organs</h2>
          <button
            onClick={handleOpenAddOrganModal}
            className="px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200 font-semibold shadow-md"
          >
            + Add Organ
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  S.No
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Organ Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Vendors
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getUniqueOrgans().map((organ, index) => (
                <tr key={organ._id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{index + 1}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{organ.organName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{organ.vendorCount}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State for Organs */}
        {!loading && getUniqueOrgans().length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No organs</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new organ.</p>
          </div>
        )}
      </div>

      {/* Add Test Modal */}
      {isAddModalOpen && (
        <AddTest
          onClose={handleCloseAddModal}
          onSubmit={handleAddTest}
        />
      )}

      {/* Edit Test Modal */}
      {isEditModalOpen && selectedTest && (
        <EditTestForm
          test={selectedTest}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTest(null);
          }}
          onSubmit={handleUpdateTest}
        />
      )}

      {/* View Test Modal */}
      {isViewModalOpen && selectedTest && (
        <ViewTestModal
          test={selectedTest}
          vendors={vendors}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedTest(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && testToDelete && (
        <DeleteConfirmationModal
          test={testToDelete}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {/* Add Organ Modal */}
      {isAddOrganModalOpen && (
        <AddOrgan
          onClose={handleCloseAddOrganModal}
          onSubmit={handleAddOrgan}
        />
      )}

      {/* Edit Organ Modal */}
      {isEditOrganModalOpen && selectedOrgan && (
        <EditOrganForm
          organ={selectedOrgan}
          onClose={() => {
            setIsEditOrganModalOpen(false);
            setSelectedOrgan(null);
          }}
          onSubmit={handleUpdateOrgan}
        />
      )}

      {/* Delete Organ Confirmation Modal */}
      {isDeleteOrganModalOpen && organToDelete && (
        <DeleteOrganConfirmationModal
          organ={organToDelete}
          onConfirm={confirmDeleteOrgan}
          onCancel={cancelDeleteOrgan}
        />
      )}

      {/* Add Symptom Modal */}
      {isAddSymptomModalOpen && (
        <AddSymptom
          onClose={() => setIsAddSymptomModalOpen(false)}
          onSubmit={handleAddSymptom}
          organs={organs}
        />
      )}

      {/* Edit Symptom Modal */}
      {isEditSymptomModalOpen && selectedSymptom && (
        <EditSymptomForm
          symptom={selectedSymptom}
          onClose={() => {
            setIsEditSymptomModalOpen(false);
            setSelectedSymptom(null);
          }}
          onSubmit={handleUpdateSymptom}
          organs={organs}
        />
      )}

      {/* View Symptom Modal */}
      {isViewSymptomModalOpen && selectedSymptom && (
        <ViewSymptomModal
          symptom={selectedSymptom}
          onClose={() => {
            setIsViewSymptomModalOpen(false);
            setSelectedSymptom(null);
          }}
        />
      )}

      {/* Delete Symptom Confirmation Modal */}
      {isDeleteSymptomModalOpen && symptomToDelete && (
        <DeleteSymptomConfirmationModal
          symptom={symptomToDelete}
          onConfirm={confirmDeleteSymptom}
          onCancel={cancelDeleteSymptom}
        />
      )}
    </div>
  );
};

// Add Organ Edit Form Component
const EditOrganForm = ({ organ, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    organName: '',
    status: 'Active'
  });
  const [errors, setErrors] = useState({});

  // Initialize form with existing organ data
  useEffect(() => {
    if (organ) {
      setFormData({
        organName: organ.organName || '',
        status: organ.status || 'Active'
      });
    }
  }, [organ]);

  const handleNameChange = (e) => {
    setFormData({ ...formData, organName: e.target.value });
    if (errors.organName) {
      setErrors({ ...errors, organName: '' });
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
      if (onSubmit) {
        onSubmit({
          organName: formData.organName,
          status: formData.status
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Edit Organ</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Organ Name Field */}
          <div className="mb-6">
            <label htmlFor="organName" className="block text-sm font-semibold text-gray-700 mb-2">
              Organ Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="organName"
              value={formData.organName}
              onChange={handleNameChange}
              placeholder="Enter organ name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${errors.organName
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
                }`}
            />
            {errors.organName && (
              <p className="text-red-500 text-sm mt-2">{errors.organName}</p>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="mb-6">
            <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => {
                setFormData({ ...formData, status: e.target.value });
                if (errors.status) {
                  setErrors({ ...errors, status: '' });
                }
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${errors.status
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
                }`}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md"
            >
              Update Organ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Organ Confirmation Modal Component
const DeleteOrganConfirmationModal = ({ organ, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="ml-4 text-xl font-bold text-gray-800">Confirm Delete</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
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

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// View Symptom Modal Component
const ViewSymptomModal = ({ symptom, onClose }) => {
  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50">
          <h2 className="text-2xl font-bold text-gray-800">Symptom Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Symptom Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">Symptom Name</label>
            <p className="text-lg font-semibold text-gray-900">{symptom.symptomName}</p>
          </div>

          {/* Organ */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">Organ</label>
            <p className="text-lg text-gray-900">{symptom.organ}</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">Description</label>
            <p className="text-lg text-gray-900">{symptom.description || 'N/A'}</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">Status</label>
            <span className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${symptom.status === 'Active'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
              }`}>
              {symptom.status}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Symptom Confirmation Modal Component
const DeleteSymptomConfirmationModal = ({ symptom, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="ml-4 text-xl font-bold text-gray-800">Confirm Delete</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this symptom?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Symptom Name:</p>
            <p className="text-base font-bold text-gray-900">{symptom.symptomName}</p>
            <p className="text-sm font-semibold text-gray-700 mt-3 mb-1">Organ:</p>
            <p className="text-base text-gray-900">{symptom.organ}</p>
          </div>
          <p className="text-sm text-red-600 mt-4 font-medium">
            ⚠️ This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Symptom Form Component
const EditSymptomForm = ({ symptom, onClose, onSubmit, organs }) => {
  const [formData, setFormData] = useState({
    symptomName: '',
    organ: '',
    description: '',
    status: 'Active'
  });
  const [errors, setErrors] = useState({});

  // Initialize form with existing symptom data
  useEffect(() => {
    if (symptom) {
      setFormData({
        symptomName: symptom.symptomName || '',
        organ: symptom.organ || '',
        description: symptom.description || '',
        status: symptom.status || 'Active'
      });
    }
  }, [symptom]);

  const handleSymptomNameChange = (e) => {
    setFormData({ ...formData, symptomName: e.target.value });
    if (errors.symptomName) {
      setErrors({ ...errors, symptomName: '' });
    }
  };

  const handleDescriptionChange = (e) => {
    setFormData({ ...formData, description: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.symptomName.trim()) {
      newErrors.symptomName = 'Symptom name is required';
    }

    if (!formData.organ.trim()) {
      newErrors.organ = 'Organ is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      if (onSubmit) {
        onSubmit({
          symptomName: formData.symptomName,
          organ: formData.organ,
          description: formData.description,
          status: formData.status
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Edit Symptom</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Symptom Name Field */}
          <div className="mb-6">
            <label htmlFor="symptomNameEdit" className="block text-sm font-semibold text-gray-700 mb-2">
              Symptom Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="symptomNameEdit"
              value={formData.symptomName}
              onChange={handleSymptomNameChange}
              placeholder="Enter symptom name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${errors.symptomName
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
                }`}
            />
            {errors.symptomName && (
              <p className="text-red-500 text-sm mt-2">{errors.symptomName}</p>
            )}
          </div>

          {/* Organ Field */}
          <div className="mb-6">
            <label htmlFor="organEdit" className="block text-sm font-semibold text-gray-700 mb-2">
              Organ <span className="text-red-500">*</span>
            </label>
            <select
              id="organEdit"
              value={formData.organ}
              onChange={(e) => {
                setFormData({ ...formData, organ: e.target.value });
                if (errors.organ) {
                  setErrors({ ...errors, organ: '' });
                }
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${errors.organ
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
                }`}
            >
              <option value="">Select an organ</option>
              {organs.map((organ) => (
                <option key={organ._id} value={organ.organName}>
                  {organ.organName}
                </option>
              ))}
            </select>
            {errors.organ && (
              <p className="text-red-500 text-sm mt-2">{errors.organ}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="mb-6">
            <label htmlFor="descriptionEdit" className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="descriptionEdit"
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Enter description"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition-all duration-200"
            />
          </div>

          {/* Status Dropdown */}
          <div className="mb-6">
            <label htmlFor="statusEdit" className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              id="statusEdit"
              value={formData.status}
              onChange={(e) => {
                setFormData({ ...formData, status: e.target.value });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition-all duration-200"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md"
            >
              Update Symptom
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabTestsPage;