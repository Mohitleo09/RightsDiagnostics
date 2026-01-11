'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, XCircle, Play, Video, Plus, Link, Check, Tag, Youtube } from 'lucide-react';

const VideoPage = () => {
  // Sample data for videos
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [formData, setFormData] = useState({
    videoName: '',
    videoLink: '',
    categories: [],
  });

  // Fetch videos from API
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // Fetch all videos for admin panel (both active and inactive)
        const response = await fetch('/api/videos');
        const result = await response.json();

        if (result.success) {
          setVideos(result.data);
        } else {
          setError(result.error || 'Failed to fetch videos');
        }
      } catch (err) {
        setError('Failed to fetch videos');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleAddVideo = () => {
    setIsModalOpen(true);
    setFormData({
      videoName: '',
      videoLink: '',
      categories: [],
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle category checkbox changes
  const handleCategoryChange = (category) => {
    setFormData(prev => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter(cat => cat !== category) // Remove if already selected
        : [...prev.categories, category]; // Add if not selected
      return {
        ...prev,
        categories: newCategories
      };
    });
  };

  // Helper to extract YouTube ID
  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmitVideo = async () => {
    if (formData.videoName && formData.videoLink && formData.categories.length > 0) {
      try {
        const response = await fetch('/api/videos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.videoName,
            videoLink: formData.videoLink,
            categories: formData.categories
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Add the new video to the state
          setVideos(prev => [...prev, result.data]);
          handleCloseModal();
          alert('Video added successfully!');
        } else {
          alert('Failed to add video: ' + result.error);
        }
      } catch (error) {
        alert('Failed to add video: ' + error.message);
      }
    } else {
      alert('Please fill in all required fields and select at least one category');
    }
  };

  const handleView = async (id) => {
    try {
      const response = await fetch(`/api/videos?id=${id}`);
      const result = await response.json();

      if (result.success) {
        setCurrentVideo(result.data);
        setIsViewModalOpen(true);
      } else {
        alert('Failed to fetch video details: ' + result.error);
      }
    } catch (error) {
      alert('Failed to fetch video details: ' + error.message);
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await fetch(`/api/videos?id=${id}`);
      const result = await response.json();

      if (result.success) {
        const video = result.data;
        setCurrentVideo(video);
        setFormData({
          videoName: video.name,
          videoLink: video.videoLink,
          categories: video.categories || [],
        });
        setIsEditModalOpen(true);
      } else {
        alert('Failed to fetch video details: ' + result.error);
      }
    } catch (error) {
      alert('Failed to fetch video details: ' + error.message);
    }
  };

  const handleUpdateVideo = async () => {
    if (formData.videoName && formData.videoLink && formData.categories.length > 0) {
      try {
        const response = await fetch('/api/videos', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: currentVideo._id,
            name: formData.videoName,
            videoLink: formData.videoLink,
            categories: formData.categories
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Update the video in the state
          setVideos(videos.map(video =>
            video._id === currentVideo._id ? result.data : video
          ));
          setIsEditModalOpen(false);
          setCurrentVideo(null);
          alert('Video updated successfully!');
        } else {
          alert('Failed to update video: ' + result.error);
        }
      } catch (error) {
        alert('Failed to update video: ' + error.message);
      }
    } else {
      alert('Please fill in all required fields and select at least one category');
    }
  };

  const handleDelete = async (id) => {
    // Find the video to delete
    const video = videos.find(v => v._id === id);
    if (video) {
      setVideoToDelete(video);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;

    try {
      const response = await fetch('/api/videos', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: videoToDelete._id }),
      });

      const result = await response.json();

      if (result.success) {
        setVideos(videos.filter(video => video._id !== videoToDelete._id));
        alert('Video deleted successfully!');
      } else {
        alert('Failed to delete video: ' + result.error);
      }
    } catch (error) {
      alert('Failed to delete video: ' + error.message);
    } finally {
      setIsDeleteModalOpen(false);
      setVideoToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setVideoToDelete(null);
  };

  const handleDeactivate = async (id) => {
    try {
      const response = await fetch('/api/videos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action: 'deactivate' }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the video status in the state
        setVideos(videos.map(video =>
          video._id === id ? { ...video, status: 'Inactive' } : video
        ));
        alert('Video deactivated successfully!');
      } else {
        alert('Failed to deactivate video: ' + result.error);
      }
    } catch (error) {
      alert('Failed to deactivate video: ' + error.message);
    }
  };

  const handleActivate = async (id) => {
    try {
      const response = await fetch('/api/videos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action: 'activate' }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the video status in the state
        setVideos(videos.map(video =>
          video._id === id ? { ...video, status: 'Active' } : video
        ));
        alert('Video activated successfully!');
      } else {
        alert('Failed to activate video: ' + result.error);
      }
    } catch (error) {
      alert('Failed to activate video: ' + error.message);
    }
  };

  // Available categories
  const categories = ['Men', 'Women', 'Kids', 'Elders', 'Couples'];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500 bg-red-50 rounded-2xl m-6 border border-red-100 flex items-center gap-2"><XCircle className="w-5 h-5" /> Error: {error}</div>;
  }

  const closeModal = () => {
    setIsViewModalOpen(false);
    setCurrentVideo(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentVideo(null);
    setFormData({
      videoName: '',
      videoLink: '',
      categories: [],
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-200/60 transition-all">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white shadow-lg shadow-red-500/20">
              <Youtube className="w-6 h-6" />
            </div>
            Video Library
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Curate and manage your platform's video content.</p>
        </div>
        <button
          onClick={handleAddVideo}
          className="group flex items-center gap-2 bg-[#0052FF] hover:bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-5 h-5 text-white stroke-[3]" />
          <span className="font-bold tracking-wide text-sm">Add New Video</span>
        </button>
      </div>

      {videos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-1 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <div className="text-2xl font-black text-blue-600">{videos.length}</div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Total Videos</div>
          </div>
          <div className="col-span-1 p-4 bg-green-50/50 rounded-2xl border border-green-100">
            <div className="text-2xl font-black text-green-600">{videos.filter(v => v.status === 'Active').length}</div>
            <div className="text-xs font-bold text-green-400 uppercase tracking-wider">Active</div>
          </div>
        </div>
      )}

      {/* Videos List - Masonry Grid Style Cards */}
      <div className="space-y-4">

        {videos.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[32px] border border-slate-100 border-dashed">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-12 h-12 text-red-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No Videos Found</h3>
            <p className="text-slate-400 font-medium mt-1">Start building your library by adding a video.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => {
              const videoId = getYoutubeId(video.videoLink);
              const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

              return (
                <div
                  key={video._id}
                  className="group flex flex-col bg-white border border-slate-100 rounded-[28px] overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:border-slate-200 transition-all duration-300"
                >
                  {/* Video Thumbnail Area */}
                  <div className="relative aspect-video bg-slate-100 overflow-hidden group-hover:opacity-90 transition-opacity cursor-pointer" onClick={() => handleView(video._id)}>
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt={video.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <Play className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                        <Play className="w-6 h-6 text-white ml-1 fill-current" />
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${video.status === 'Active' ? 'bg-green-500/90 text-white' : 'bg-yellow-500/90 text-white'
                        }`}>
                        {video.status}
                      </span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-tight">
                      {video.name}
                    </h3>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {video.categories.map((category, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                          {category}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleView(video._id)}
                        className="flex-1 py-2.5 bg-blue-50 text-blue-600 text-sm font-bold rounded-xl hover:bg-blue-100 transition-colors"
                      >
                        Watch
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(video._id)} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(video._id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {video.status === 'Active' ? (
                          <button onClick={() => handleDeactivate(video._id)} className="p-2.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all" title="Deactivate">
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleActivate(video._id)} className="p-2.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all" title="Activate">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- Modals [Redesigned] --- */}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && videoToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Video?</h3>
            <p className="text-slate-500 text-sm mb-4">Are you sure you want to remove <strong>{videoToDelete.name}</strong>?</p>
            <div className="flex gap-4 mt-6">
              <button onClick={cancelDelete} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/30 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View Video Modal [UPDATED WITH IFRAME] */}
      {isViewModalOpen && currentVideo && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden ring-1 ring-black/5 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 line-clamp-1">{currentVideo.name}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-0 bg-black flex-1 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
              {getYoutubeId(currentVideo.videoLink) ? (
                <iframe
                  className="w-full h-full aspect-video"
                  src={`https://www.youtube.com/embed/${getYoutubeId(currentVideo.videoLink)}?autoplay=1`}
                  title={currentVideo.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-white/50" />
                  </div>
                  <p className="text-white/70 font-medium">Video could not be embedded.</p>
                  <a
                    href={currentVideo.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Open in New Tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {isEditModalOpen && currentVideo && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden ring-1 ring-black/5">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Edit Video Details</h3>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                  <input type="text" name="videoName" value={formData.videoName} onChange={handleInputChange} placeholder="Video Title" className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">URL</label>
                  <input type="url" name="videoLink" value={formData.videoLink} onChange={handleInputChange} placeholder="Video Link (YouTube)" className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  {formData.videoLink && getYoutubeId(formData.videoLink) && (
                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1 font-medium pl-1">
                      <Check className="w-3 h-3" /> Valid YouTube Link Detected
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Target Audience</label>
                  <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                      <label key={category} className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm font-bold border ${formData.categories.includes(category) ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>
                        <input type="checkbox" className="hidden" checked={formData.categories.includes(category)} onChange={() => handleCategoryChange(category)} />
                        {category}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={closeEditModal} className="flex-1 py-3.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors">Cancel</button>
                <button onClick={handleUpdateVideo} className="flex-1 py-3.5 text-sm font-bold text-white bg-[#0052FF] hover:bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 transition-all">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden ring-1 ring-black/5">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Add New Video</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                  <input type="text" name="videoName" value={formData.videoName} onChange={handleInputChange} placeholder="Video Title" className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">URL</label>
                  <input type="url" name="videoLink" value={formData.videoLink} onChange={handleInputChange} placeholder="Video Link (YouTube)" className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  {formData.videoLink && getYoutubeId(formData.videoLink) && (
                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1 font-medium pl-1">
                      <Check className="w-3 h-3" /> Valid YouTube Link Detected
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Target Audience</label>
                  <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                      <label key={category} className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm font-bold border ${formData.categories.includes(category) ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>
                        <input type="checkbox" className="hidden" checked={formData.categories.includes(category)} onChange={() => handleCategoryChange(category)} />
                        {category}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleCloseModal} className="flex-1 py-3.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors">Cancel</button>
                <button onClick={handleSubmitVideo} className="flex-1 py-3.5 text-sm font-bold text-white bg-[#0052FF] hover:bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 transition-all">Add Video</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPage;