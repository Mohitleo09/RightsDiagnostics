'use client';

import { useState, useEffect } from 'react';
import { safeJsonParse } from '../../../utils/apiUtils';
import { isValidPrice } from '../../../utils/priceUtils';

const AddTest = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    testName: '',
    organ: '',
    price: '',
    status: 'Active'
  });
  const [organs, setOrgans] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch organs from API
  useEffect(() => {
    const fetchOrgans = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/organs');
        const result = await safeJsonParse(response);

        if (result.success) {
          // Filter only active organs
          const activeOrgans = result.data.filter(organ => organ.status === 'Active');
          setOrgans(activeOrgans);
        } else {
          console.error('Failed to fetch organs:', result.error);
        }
      } catch (error) {
        console.error('Error fetching organs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgans();
  }, []);

  const handleTestNameChange = (e) => {
    setFormData({ ...formData, testName: e.target.value });
    if (errors.testName) {
      setErrors({ ...errors, testName: '' });
    }
  };

  const handleOrganChange = (e) => {
    setFormData({ ...formData, organ: e.target.value });
    if (errors.organ) {
      setErrors({ ...errors, organ: '' });
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Call parent submit handler
      if (onSubmit) {
        onSubmit({
          testName: formData.testName,
          organ: formData.organ,
          price: formData.price, // Keep as string to support ranges
          status: formData.status
        });
      }

      // Reset form
      setFormData({ testName: '', organ: '', price: '', status: 'Active' });
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Add New Test</h2>
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
              onChange={handleTestNameChange}
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

          {/* Organ Dropdown */}
          <div className="mb-6">
            <label htmlFor="organ" className="block text-sm font-semibold text-gray-700 mb-2">
              Organ <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading organs...
              </div>
            ) : (
              <select
                id="organ"
                value={formData.organ}
                onChange={handleOrganChange}
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
            )}
            {errors.organ && (
              <p className="text-red-500 text-sm mt-2">{errors.organ}</p>
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
              Add Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTest;