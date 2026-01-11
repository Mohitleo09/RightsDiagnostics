'use client';

import { useState, useEffect } from 'react';
import { safeJsonParse } from '../../../utils/apiUtils';
import Image from 'next/image';

const AddOrgan = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    labName: '',
    imageIcon: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [labs, setLabs] = useState([]);
  const [loadingLabs, setLoadingLabs] = useState(true);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, imageIcon: 'Please select a valid image file' });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, imageIcon: 'Image size should be less than 5MB' });
        return;
      }

      setFormData({ ...formData, imageIcon: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear error
      setErrors({ ...errors, imageIcon: '' });
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      setLoadingLabs(true);
      const response = await fetch('/api/vendors', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await safeJsonParse(response);
        const vendors = data.success && Array.isArray(data.vendors) ? data.vendors : [];
        // Filter only active vendors
        const activeLabs = vendors.filter(vendor => vendor.status === 'active');
        setLabs(activeLabs);
      } else {
        console.error('Failed to fetch labs');
        setLabs([]);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
      setLabs([]);
    } finally {
      setLoadingLabs(false);
    }
  };

  const handleNameChange = (e) => {
    setFormData({ ...formData, name: e.target.value });
    if (errors.name) {
      setErrors({ ...errors, name: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Organ name is required';
    }
    
    if (!formData.labName.trim()) {
      newErrors.labName = 'Lab name is required';
    }
    
    if (!formData.imageIcon) {
      newErrors.imageIcon = 'Image icon is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('labName', formData.labName);
      submitData.append('imageIcon', formData.imageIcon);
      
      // Call parent submit handler
      if (onSubmit) {
        onSubmit({
          name: formData.name,
          labName: formData.labName,
          imageIcon: formData.imageIcon,
          status: 'Active'
        });
      }
      
      // Reset form
      setFormData({ name: '', labName: '', imageIcon: null });
      setImagePreview(null);
      
      console.log('Form submitted:', formData);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imageIcon: null });
    setImagePreview(null);
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
          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Image Icon <span className="text-red-500">*</span>
            </label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0052FF] transition-colors duration-200">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="imageUpload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-600 font-medium">Click to upload image</span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</span>
                </label>
              </div>
            ) : (
              <div className="relative">
                <div className="border-2 border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-40 rounded-lg object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {errors.imageIcon && (
              <p className="text-red-500 text-sm mt-2">{errors.imageIcon}</p>
            )}
          </div>

          {/* Name Field */}
          <div className="mb-6">
            <label htmlFor="organName" className="block text-sm font-semibold text-gray-700 mb-2">
              Organ Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="organName"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Enter organ name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.name
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-2">{errors.name}</p>
            )}
          </div>

          {/* Lab Name Field */}
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
                value={formData.labName}
                onChange={(e) => {
                  setFormData({ ...formData, labName: e.target.value });
                  if (errors.labName) {
                    setErrors({ ...errors, labName: '' });
                  }
                }}
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

          {/* Submit Button */}
          <div className="flex space-x-3">
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