'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AddOrgan from './addorgan';
import { safeJsonParse } from '../../../utils/apiUtils';

const OrgansPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [organs, setOrgans] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleView = (id) => {
    const organ = organs.find(o => o._id === id);
    setSelectedOrgan(organ);
    setIsViewModalOpen(true);
  };

  const handleEdit = (id) => {
    const organ = organs.find(o => o._id === id);
    setSelectedOrgan(organ);
    setIsEditModalOpen(true);
  };

  const handleUpdateOrgan = async (updatedOrgan) => {
    try {
      // Check if image is being updated (new file upload)
      const hasNewImage = updatedOrgan.imageIcon && typeof updatedOrgan.imageIcon !== 'string';
      
      let response;
      
      if (hasNewImage) {
        // Use FormData if uploading a new image
        const formData = new FormData();
        formData.append('name', updatedOrgan.name);
        formData.append('labName', updatedOrgan.labName);
        formData.append('imageIcon', updatedOrgan.imageIcon);
        
        response = await fetch(`/api/organs?id=${selectedOrgan._id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        // Use JSON if only updating text fields
        response = await fetch(`/api/organs?id=${selectedOrgan._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            name: updatedOrgan.name, 
            labName: updatedOrgan.labName 
          }),
        });
      }

      const result = await safeJsonParse(response);

      if (result.success) {
        console.log('Updated organ data from server:', result.data);
        // Update the table with the new data from the server
        setOrgans(organs.map(organ => 
          organ._id === selectedOrgan._id ? result.data : organ
        ));
        setIsEditModalOpen(false);
        setSelectedOrgan(null);
        alert(`Organ "${result.data.name}" updated successfully!\nLab: ${result.data.labName}\nStatus: ${result.data.status}`);
      } else {
        alert('Failed to update organ: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating organ:', error);
      alert('Error updating organ: ' + error.message);
    }
  };

  const handleDelete = (id) => {
    const organ = organs.find(o => o._id === id);
    setSelectedOrgan(organ);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/organs?id=${selectedOrgan._id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setOrgans(organs.filter(organ => organ._id !== selectedOrgan._id));
        console.log('Deleted organ with id:', selectedOrgan._id);
        setIsDeleteModalOpen(false);
        setSelectedOrgan(null);
      } else {
        alert('Failed to delete organ');
      }
    } catch (error) {
      console.error('Error deleting organ:', error);
      alert('Error deleting organ');
    }
  };

  const handleDeactivate = async (id) => {
    const organ = organs.find(o => o._id === id);
    const newStatus = organ.status === 'Active' ? 'Inactive' : 'Active';
    
    try {
      const response = await fetch(`/api/organs?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const result = await safeJsonParse(response);
      
      if (result.success) {
        // Update with server response to ensure consistency
        setOrgans(organs.map(organ => 
          organ._id === id ? result.data : organ
        ));
        console.log('Status toggled successfully:', result.data);
        alert(`Organ status changed to ${result.data.status}`);
      } else {
        alert('Failed to update organ status');
      }
    } catch (error) {
      console.error('Error updating organ:', error);
      alert('Error updating organ status');
    }
  };

  const handleAddOrgan = async (newOrgan) => {
    try {
      console.log('Adding organ with data:', { name: newOrgan.name, labName: newOrgan.labName });
      
      const formData = new FormData();
      formData.append('name', newOrgan.name);
      formData.append('labName', newOrgan.labName);
      formData.append('imageIcon', newOrgan.imageIcon);
      
      const response = await fetch('/api/organs', {
        method: 'POST',
        body: formData,
      });
      
      const result = await safeJsonParse(response);
      console.log('API Response:', result);
      
      if (result.success) {
        console.log('New organ data from server:', result.data);
        setOrgans([result.data, ...organs]);
        setIsAddModalOpen(false);
        alert(`Organ "${result.data.name}" added successfully!\nLab: ${result.data.labName}\nStatus: ${result.data.status}`);
      } else {
        alert('Failed to add organ: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding organ:', error);
      alert('Error adding organ: ' + error.message);
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Fetch organs from database on component mount
  useEffect(() => {
    const fetchOrgans = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/organs');
        const result = await safeJsonParse(response);
        
        if (result.success) {
          setOrgans(result.data);
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

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Organs</h1>
        <button 
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200 font-semibold shadow-md"
        >
          + Add New Organ
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Image Icon
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Lab Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organs.map((organ) => (
                <tr key={organ._id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-12 h-12 bg-[#00CCFF] rounded-lg overflow-hidden">
                      {organ.imageIcon ? (
                        <img
                          src={organ.imageIcon}
                          alt={organ.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-[#0052FF]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{organ.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{organ.labName || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      organ.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {organ.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 justify-center">
                      {/* View Icon */}
                      <button
                        onClick={() => handleView(organ._id)}
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
                        onClick={() => handleEdit(organ._id)}
                        className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Icon */}
                      <button
                        onClick={() => handleDelete(organ._id)}
                        className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      {/* Toggle Status Icon */}
                      <button
                        onClick={() => handleDeactivate(organ._id)}
                        className={`p-2 text-white rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          organ.status === 'Active'
                            ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        }`}
                        title={organ.status === 'Active' ? 'Deactivate' : 'Activate'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {organs.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No organs</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new organ.</p>
          </div>
        )}
      </div>

      {/* Add Organ Modal */}
      {isAddModalOpen && (
        <AddOrgan 
          onClose={handleCloseAddModal}
          onSubmit={handleAddOrgan}
        />
      )}

      {/* View Organ Modal */}
      {isViewModalOpen && selectedOrgan && (
        <ViewOrganModal 
          organ={selectedOrgan}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedOrgan(null);
          }}
        />
      )}

      {/* Edit Organ Modal */}
      {isEditModalOpen && selectedOrgan && (
        <EditOrganModal 
          organ={selectedOrgan}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedOrgan(null);
          }}
          onSubmit={handleUpdateOrgan}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedOrgan && (
        <DeleteConfirmModal 
          organ={selectedOrgan}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedOrgan(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

// View Organ Modal Component
const ViewOrganModal = ({ organ, onClose }) => {
  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">View Organ Details</h2>
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
        <div className="p-6">
          {/* Image */}
          <div className="mb-6 flex justify-center">
            <div className="w-32 h-32 bg-[#00CCFF] rounded-lg overflow-hidden flex items-center justify-center">
              {organ.imageIcon ? (
                <img
                  src={organ.imageIcon}
                  alt={organ.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-16 h-16 text-[#0052FF]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Organ Name</label>
              <p className="text-lg font-bold text-gray-900">{organ.name}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Lab Name</label>
              <p className="text-lg font-bold text-gray-900">{organ.labName || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Status</label>
              <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                organ.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {organ.status}
              </span>
            </div>

            {organ.createdAt && (
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Created At</label>
                <p className="text-sm text-gray-700">{new Date(organ.createdAt).toLocaleString()}</p>
              </div>
            )}

            {organ.updatedAt && (
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Last Updated</label>
                <p className="text-sm text-gray-700">{new Date(organ.updatedAt).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Organ Modal Component
const EditOrganModal = ({ organ, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: organ.name,
    labName: organ.labName || '',
    imageIcon: organ.imageIcon
  });
  const [imagePreview, setImagePreview] = useState(organ.imageIcon);
  const [errors, setErrors] = useState({});
  const [labs, setLabs] = useState([]);
  const [loadingLabs, setLoadingLabs] = useState(true);

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
        const data = await response.json();
        const vendors = data.success && Array.isArray(data.vendors) ? data.vendors : [];
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, imageIcon: 'Please select a valid image file' });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, imageIcon: 'Image size should be less than 5MB' });
        return;
      }

      setFormData({ ...formData, imageIcon: file });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setErrors({ ...errors, imageIcon: '' });
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
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
          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Image Icon
            </label>
            
            {imagePreview ? (
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
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0052FF] transition-colors duration-200">
                <input
                  type="file"
                  id="imageUploadEdit"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="imageUploadEdit"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-600 font-medium">Click to upload new image</span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</span>
                </label>
              </div>
            )}
            
            {errors.imageIcon && (
              <p className="text-red-500 text-sm mt-2">{errors.imageIcon}</p>
            )}
          </div>

          {/* Name Field */}
          <div className="mb-6">
            <label htmlFor="organNameEdit" className="block text-sm font-semibold text-gray-700 mb-2">
              Organ Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="organNameEdit"
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
            <label htmlFor="labNameEdit" className="block text-sm font-semibold text-gray-700 mb-2">
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
                id="labNameEdit"
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

          {/* Submit Buttons */}
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
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md"
            >
              Update Organ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ organ, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Confirm Delete</h2>
          </div>
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
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete <span className="font-bold text-gray-900">"{organ.name}"</span>?
          </p>
          <p className="text-sm text-gray-600">
            This action cannot be undone. The organ will be permanently removed from the database.
          </p>

          {/* Organ Preview */}
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start">
              <div className="w-16 h-16 bg-[#00CCFF] rounded-lg overflow-hidden flex items-center justify-center mr-4 flex-shrink-0">
                {organ.imageIcon ? (
                  <img
                    src={organ.imageIcon}
                    alt={organ.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-8 h-8 text-[#0052FF]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700 mb-1">Organ Name:</p>
                <p className="font-bold text-gray-900 mb-3">{organ.name}</p>
                
                <p className="text-sm font-semibold text-gray-700 mb-1">Lab Name:</p>
                <p className="text-gray-900 mb-3">{organ.labName || 'N/A'}</p>
                
                <p className="text-sm font-semibold text-gray-700 mb-1">Status:</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  organ.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {organ.status}
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-red-600 mt-4 font-medium">
            ⚠️ This action cannot be undone.
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="flex space-x-3 p-6 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
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

export default OrgansPage;