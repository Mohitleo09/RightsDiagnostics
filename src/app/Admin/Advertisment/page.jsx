'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Image as ImageIcon,
  MoreVertical,
  Ban,
  CheckCircle,
  X,
  UploadCloud,
  Loader2
} from 'lucide-react';

const AdvertisementPage = () => {
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedAdvertisement, setSelectedAdvertisement] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    image: null,
    contentType: 'Content'
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch advertisements from API
  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        setLoading(true);
        // Fetch all advertisements by not specifying a status filter
        const response = await fetch('/api/advertisements?status=');
        const result = await response.json();

        if (result.success) {
          setAdvertisements(result.data);
        } else {
          setError(result.error || 'Failed to fetch advertisements');
        }
      } catch (err) {
        setError('Failed to fetch advertisements');
        console.error('Error fetching advertisements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisements();
  }, []);

  const handleAddAdvertisement = () => {
    setIsModalOpen(true);
    setFormData({
      name: '',
      image: null,
      contentType: 'Content'
    });
    setImagePreview(null);
    setActiveMenuId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedAdvertisement(null);
    setDeleteId(null);
    setFormData({
      name: '',
      image: null,
      contentType: 'Content'
    });
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // In a real implementation, you would upload the image to a storage service
      // and get a URL back. For now, we'll use a placeholder.
      const advertisementData = {
        name: formData.name,
        image: imagePreview || '/images/default-ad.jpg',
        contentType: formData.contentType,
        status: 'Active'
      };

      const response = await fetch('/api/advertisements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(advertisementData),
      });

      const result = await response.json();

      if (result.success) {
        // Add the new advertisement to the state
        setAdvertisements([result.data, ...advertisements]);
        handleCloseModal();
      } else {
        console.error('Failed to create advertisement:', result.error);
        setError(result.error || 'Failed to create advertisement');
      }
    } catch (err) {
      console.error('Error creating advertisement:', err);
      setError('Error creating advertisement');
    }
  };

  const handleView = (advertisement) => {
    setSelectedAdvertisement(advertisement);
    setIsViewModalOpen(true);
    setActiveMenuId(null);
  };

  const handleEdit = (advertisement) => {
    setSelectedAdvertisement(advertisement);
    setFormData({
      name: advertisement.name,
      image: null,
      contentType: advertisement.contentType
    });
    setImagePreview(advertisement.image);
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const advertisementData = {
        id: selectedAdvertisement._id,
        name: formData.name,
        image: imagePreview || selectedAdvertisement.image,
        contentType: formData.contentType
      };

      const response = await fetch('/api/advertisements', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(advertisementData),
      });

      const result = await response.json();

      if (result.success) {
        // Update the advertisement in the state
        setAdvertisements(advertisements.map(ad =>
          ad._id === selectedAdvertisement._id ? result.data : ad
        ));
        handleCloseModal();
      } else {
        console.error('Failed to update advertisement:', result.error);
        setError(result.error || 'Failed to update advertisement');
      }
    } catch (err) {
      console.error('Error updating advertisement:', err);
      setError('Error updating advertisement');
    }
  };

  const promptDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
    setActiveMenuId(null);
  }

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/advertisements?id=${deleteId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Remove the advertisement from the state
        setAdvertisements(advertisements.filter(ad => ad._id !== deleteId));
        handleCloseModal();
      } else {
        console.error('Failed to delete advertisement:', result.error);
        setError(result.error || 'Failed to delete advertisement');
      }
    } catch (err) {
      console.error('Error deleting advertisement:', err);
      setError('Error deleting advertisement');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      const advertisement = advertisements.find(ad => ad._id === id);
      if (!advertisement) return;

      const updatedStatus = advertisement.status === 'Active' ? 'Inactive' : 'Active';

      const response = await fetch('/api/advertisements', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          status: updatedStatus
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the advertisement status in the state
        setAdvertisements(advertisements.map(ad =>
          ad._id === id ? { ...ad, status: updatedStatus } : ad
        ));
        setActiveMenuId(null);
      } else {
        console.error('Failed to update advertisement:', result.error);
        setError(result.error || 'Failed to update advertisement');
      }
    } catch (err) {
      console.error('Error updating advertisement:', err);
      setError('Error updating advertisement');
    }
  };

  const handleMenuClick = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading advertisements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50/50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-10 font-sans relative">

      {/* Menu Backdrop */}
      {activeMenuId && (
        <div
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setActiveMenuId(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-black" />
            Advertisements
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Manage your banners and promotional content</p>
        </div>
        <button
          onClick={handleAddAdvertisement}
          className="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-black/20 active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Advertisement</span>
        </button>
      </div>

      {/* Grid Content */}
      {advertisements.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 border-dashed">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No advertisements found</h3>
          <p className="text-gray-500 text-sm mt-1">Get started by adding your first banner.</p>
          <button onClick={handleAddAdvertisement} className="mt-6 text-black font-semibold text-sm hover:underline">
            Add Advertisement &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {advertisements.map((ad) => {
            const isMenuOpen = activeMenuId === ad._id;
            return (
              <div
                key={ad._id}
                className={`group bg-white rounded-2xl border border-gray-200 shadow-sm transition-shadow duration-300 relative flex flex-col overflow-hidden ${isMenuOpen ? 'z-50 shadow-lg' : 'hover:shadow-lg hover:border-gray-300 z-0'}`}
                style={{ zIndex: isMenuOpen ? 50 : 0 }}
              >
                {/* Image Area */}
                <div className="relative h-48 bg-gray-100 w-full flex items-center justify-center overflow-hidden border-b border-gray-100">
                  {ad.image ? (
                    <img
                      src={ad.image}
                      alt={ad.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <ImageIcon className="w-8 h-8 mb-2" />
                      <span className="text-xs">No Image</span>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm ${ad.status === 'Active' ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                      {ad.status}
                    </span>
                  </div>
                  {/* Options Button */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => handleMenuClick(e, ad._id)}
                      className={`p-2 rounded-full backdrop-blur-md transition-all ${isMenuOpen ? 'bg-white text-black shadow-md' : 'bg-black/10 text-white hover:bg-white hover:text-black'}`}
                    >
                      <MoreVertical className="w-4 h-4 pointer-events-none" />
                    </button>
                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleView(ad); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                        >
                          <Eye className="w-4 h-4 text-gray-400 pointer-events-none" /> View
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(ad); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                        >
                          <Edit className="w-4 h-4 text-gray-400 pointer-events-none" /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeactivate(ad._id); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 font-medium ${ad.status === 'Active' ? 'text-amber-600' : 'text-green-600'}`}
                        >
                          {ad.status === 'Active' ? (
                            <> <Ban className="w-4 h-4 pointer-events-none" /> Deactivate </>
                          ) : (
                            <> <CheckCircle className="w-4 h-4 pointer-events-none" /> Activate </>
                          )}
                        </button>
                        <div className="h-px bg-gray-50 my-0.5"></div>
                        <button
                          onClick={(e) => { e.stopPropagation(); promptDelete(ad._id); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                        >
                          <Trash2 className="w-4 h-4 text-red-500 pointer-events-none" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 truncate">{ad.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">{ad.contentType}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reusable Modal Backdrop */}
      {(isModalOpen || isEditModalOpen || isViewModalOpen || isDeleteModalOpen) && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm transition-opacity"
          onClick={handleCloseModal}
        />
      )}

      {/* CREATE / EDIT MODAL */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">{isEditModalOpen ? 'Edit Advertisement' : 'Add New Advertisement'}</h2>
              <button onClick={handleCloseModal} className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 border border-gray-200 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleUpdate : handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Advertisement Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all text-sm"
                    placeholder="Enter name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Banner Image</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      {imagePreview ? (
                        <div className="relative w-full h-full p-2">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                            {/* Hover effect overlay could go here */}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
                          <UploadCloud className="w-10 h-10 mb-2" />
                          <p className="text-sm font-medium text-gray-600">Click to upload image</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (Max 5MB)</p>
                        </div>
                      )}
                      <input type="file" name="image" className="hidden" onChange={handleImageChange} accept="image/*" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-all text-sm shadow-lg shadow-black/10"
                >
                  {isEditModalOpen ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedAdvertisement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="relative h-56 bg-gray-100 flex items-center justify-center">
              {selectedAdvertisement.image ? (
                <img src={selectedAdvertisement.image} alt={selectedAdvertisement.name} className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-300" />
              )}
              <button onClick={handleCloseModal} className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full hover:bg-white text-gray-600 transition-all shadow-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedAdvertisement.name}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${selectedAdvertisement.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedAdvertisement.status}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Content Type</p>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 inline-block">
                    {selectedAdvertisement.contentType}
                  </p>
                </div>

                {/* Additional details could go here */}
              </div>

              <div className="mt-8">
                <button onClick={handleCloseModal} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 p-6 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Advertisement?</h2>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              Are you sure you want to delete this advertisement? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdvertisementPage;