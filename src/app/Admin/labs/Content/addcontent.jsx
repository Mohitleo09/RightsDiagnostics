'use client';

import { useState, useEffect } from 'react';
import { safeJsonParse } from '../../../utils/apiUtils';

const AddContent = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    labTestName: '',
    labName: '',
    overview: '',
    importance: [''],
    testPreparation: ['']
  });
  const [labTests, setLabTests] = useState([]);
  const [labs, setLabs] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingLabs, setLoadingLabs] = useState(true);

  // Fetch lab tests and labs from API
  useEffect(() => {
    const fetchLabTests = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/labtests');
        const result = await safeJsonParse(response);
        
        if (result.success) {
          // Filter only active lab tests
          const activeTests = result.data.filter(test => test.status === 'Active');
          setLabTests(activeTests);
        } else {
          console.error('Failed to fetch lab tests:', result.error);
        }
      } catch (error) {
        console.error('Error fetching lab tests:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchLabs = async () => {
      try {
        setLoadingLabs(true);
        const response = await fetch('/api/vendors');
        const result = await safeJsonParse(response);
        
        if (result.success && Array.isArray(result.vendors)) {
          const activeLabs = result.vendors.filter(vendor => vendor.status === 'active');
          setLabs(activeLabs);
        } else {
          console.error('Failed to fetch labs');
        }
      } catch (error) {
        console.error('Error fetching labs:', error);
      } finally {
        setLoadingLabs(false);
      }
    };
    
    fetchLabTests();
    fetchLabs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleImportanceChange = (index, value) => {
    const newImportance = [...formData.importance];
    newImportance[index] = value;
    setFormData({ ...formData, importance: newImportance });
    if (errors.importance) {
      setErrors({ ...errors, importance: '' });
    }
  };

  const handleTestPreparationChange = (index, value) => {
    const newTestPreparation = [...formData.testPreparation];
    newTestPreparation[index] = value;
    setFormData({ ...formData, testPreparation: newTestPreparation });
    if (errors.testPreparation) {
      setErrors({ ...errors, testPreparation: '' });
    }
  };

  const addImportancePoint = () => {
    setFormData({ ...formData, importance: [...formData.importance, ''] });
  };

  const removeImportancePoint = (index) => {
    const newImportance = formData.importance.filter((_, i) => i !== index);
    setFormData({ ...formData, importance: newImportance.length > 0 ? newImportance : [''] });
  };

  const addTestPreparationPoint = () => {
    setFormData({ ...formData, testPreparation: [...formData.testPreparation, ''] });
  };

  const removeTestPreparationPoint = (index) => {
    const newTestPreparation = formData.testPreparation.filter((_, i) => i !== index);
    setFormData({ ...formData, testPreparation: newTestPreparation.length > 0 ? newTestPreparation : [''] });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.labTestName) {
      newErrors.labTestName = 'Please select a lab test';
    }
    
    if (!formData.labName) {
      newErrors.labName = 'Please select a lab';
    }
    
    if (!formData.overview.trim()) {
      newErrors.overview = 'Overview is required';
    }
    
    const validImportance = formData.importance.filter(point => point.trim());
    if (validImportance.length === 0) {
      newErrors.importance = 'At least one importance point is required';
    }
    
    const validTestPreparation = formData.testPreparation.filter(point => point.trim());
    if (validTestPreparation.length === 0) {
      newErrors.testPreparation = 'At least one test preparation point is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Filter out empty points
      const validImportance = formData.importance.filter(point => point.trim());
      const validTestPreparation = formData.testPreparation.filter(point => point.trim());
      
      // Call parent submit handler
      if (onSubmit) {
        onSubmit({
          labTestName: formData.labTestName,
          labName: formData.labName,
          overview: formData.overview,
          importance: validImportance.join('|'), // Store as pipe-separated string
          testPreparation: validTestPreparation.join('|'), // Store as pipe-separated string
          status: 'Active'
        });
      }
      
      // Reset form
      setFormData({
        labTestName: '',
        labName: '',
        overview: '',
        importance: [''],
        testPreparation: ['']
      });
      
      console.log('Form submitted:', formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Add New Content</h2>
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
        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Lab Test Name Dropdown */}
          <div className="mb-6">
            <label htmlFor="labTestName" className="block text-sm font-semibold text-gray-700 mb-2">
              Lab Test Name <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading lab tests...
              </div>
            ) : (
              <select
                id="labTestName"
                name="labTestName"
                value={formData.labTestName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.labTestName
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
                }`}
              >
                <option value="">Select a lab test</option>
                {labTests.map((test) => (
                  <option key={test._id} value={test.name}>
                    {test.name}
                  </option>
                ))}
              </select>
            )}
            {errors.labTestName && (
              <p className="text-red-500 text-sm mt-2">{errors.labTestName}</p>
            )}
          </div>

          {/* Lab Name Dropdown */}
          <div className="mb-6">
            <label htmlFor="labName" className="block text-sm font-semibold text-gray-700 mb-2">
              Lab Name <span className="text-red-500">*</span>
            </label>
            {loadingLabs ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-[#0052FF] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-gray-600">Loading labs...</span>
              </div>
            ) : (
              <select
                id="labName"
                name="labName"
                value={formData.labName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.labName
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
                }`}
              >
                <option value="">Select a lab</option>
                {labs.length === 0 ? (
                  <option value="" disabled>No active labs available</option>
                ) : (
                  labs.map((lab) => (
                    <option key={lab._id} value={lab.labName}>
                      {lab.labName}
                    </option>
                  ))
                )}
              </select>
            )}
            {errors.labName && (
              <p className="text-red-500 text-sm mt-2">{errors.labName}</p>
            )}
          </div>

          {/* Overview Field */}
          <div className="mb-6">
            <label htmlFor="overview" className="block text-sm font-semibold text-gray-700 mb-2">
              Overview <span className="text-red-500">*</span>
            </label>
            <textarea
              id="overview"
              name="overview"
              value={formData.overview}
              onChange={handleChange}
              placeholder="Enter overview"
              rows="4"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
                errors.overview
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
              }`}
            />
            {errors.overview && (
              <p className="text-red-500 text-sm mt-2">{errors.overview}</p>
            )}
          </div>

          {/* Importance Points */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Importance (Points) <span className="text-red-500">*</span>
            </label>
            {formData.importance.map((point, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => handleImportanceChange(index, e.target.value)}
                  placeholder={`Point ${index + 1}`}
                  className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.importance
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
                  }`}
                />
                {formData.importance.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImportancePoint(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                    title="Remove point"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addImportancePoint}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-semibold"
            >
              + Add Point
            </button>
            {errors.importance && (
              <p className="text-red-500 text-sm mt-2">{errors.importance}</p>
            )}
          </div>

          {/* Test Preparation Points */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Test Preparation (Points) <span className="text-red-500">*</span>
            </label>
            {formData.testPreparation.map((point, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => handleTestPreparationChange(index, e.target.value)}
                  placeholder={`Point ${index + 1}`}
                  className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.testPreparation
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
                  }`}
                />
                {formData.testPreparation.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestPreparationPoint(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                    title="Remove point"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTestPreparationPoint}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-semibold"
            >
              + Add Point
            </button>
            {errors.testPreparation && (
              <p className="text-red-500 text-sm mt-2">{errors.testPreparation}</p>
            )}
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
              Add Content
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContent;
