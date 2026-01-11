'use client';

import { useState, useEffect } from 'react';

const AddOrgan = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    organName: '',
    status: 'Active'
  });
  const [errors, setErrors] = useState({});

  const handleOrganNameChange = (e) => {
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
      // Call parent submit handler
      if (onSubmit) {
        onSubmit({
          organName: formData.organName,
          status: formData.status
        });
      }
      
      // Reset form
      setFormData({ organName: '', status: 'Active' });
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Add New Organ</h2>
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
              onChange={handleOrganNameChange}
              placeholder="Enter organ name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.organName
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
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.status
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
              Add Organ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrgan;