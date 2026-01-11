'use client';

import { useState } from 'react';

const AddSymptom = ({ onClose, onSubmit, organs }) => {
  const [formData, setFormData] = useState({
    symptomName: '',
    organ: '',
    description: '',
    status: 'Active'
  });
  const [errors, setErrors] = useState({});

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
      onSubmit({
        symptomName: formData.symptomName,
        organ: formData.organ,
        description: formData.description,
        status: formData.status
      });
      
      // Reset form
      setFormData({ symptomName: '', organ: '', description: '', status: 'Active' });
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Add New Symptom</h2>
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
            <label htmlFor="symptomNameAdd" className="block text-sm font-semibold text-gray-700 mb-2">
              Symptom Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="symptomNameAdd"
              value={formData.symptomName}
              onChange={handleSymptomNameChange}
              placeholder="Enter symptom name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.symptomName
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
            <label htmlFor="organAdd" className="block text-sm font-semibold text-gray-700 mb-2">
              Organ <span className="text-red-500">*</span>
            </label>
            <select
              id="organAdd"
              value={formData.organ}
              onChange={(e) => {
                setFormData({ ...formData, organ: e.target.value });
                if (errors.organ) {
                  setErrors({ ...errors, organ: '' });
                }
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.organ
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
            <label htmlFor="descriptionAdd" className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="descriptionAdd"
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Enter description"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition-all duration-200"
            />
          </div>

          {/* Status Dropdown */}
          <div className="mb-6">
            <label htmlFor="statusAdd" className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              id="statusAdd"
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
              Add Symptom
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSymptom;