'use client';

import { useState, useEffect } from 'react';
import AddContent from './addcontent';
import { safeJsonParse } from '../../../utils/apiUtils';

const ContentPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewModal, setViewModal] = useState({ isOpen: false, title: '', points: [] });
  const [viewContentModal, setViewContentModal] = useState({ isOpen: false, content: null });
  const [editModal, setEditModal] = useState({ isOpen: false, content: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, content: null });

  // Fetch content from database
  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/content');
      const result = await safeJsonParse(response);
      
      if (result.success) {
        setContents(result.data);
      } else {
        setError(result.error || 'Failed to fetch content');
        console.error('Failed to fetch content:', result.error);
      }
    } catch (error) {
      setError('Error fetching content');
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id) => {
    const content = contents.find(c => c._id === id);
    if (content) {
      setViewContentModal({ isOpen: true, content });
    }
  };

  const handleEdit = (id) => {
    const content = contents.find(c => c._id === id);
    if (content) {
      setEditModal({ isOpen: true, content });
    }
  };

  const handleUpdateContent = async (updatedData) => {
    try {
      const response = await fetch(`/api/content?id=${editModal.content._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '',
          labTestName: updatedData.labTestName,
          labName: updatedData.labName,
          overview: updatedData.overview,
          importance: updatedData.importance,
          testPreparation: updatedData.testPreparation,
          status: updatedData.status || 'Active',
        }),
      });
      const result = await safeJsonParse(response);
      
      if (result.success) {
        setContents(contents.map(c => 
          c._id === editModal.content._id ? result.data : c
        ));
        setEditModal({ isOpen: false, content: null });
        alert('Content updated successfully!');
      } else {
        alert('Failed to update content: ' + result.error);
      }
    } catch (error) {
      alert('Error updating content: ' + error.message);
      console.error('Error updating content:', error);
    }
  };

  const handleDelete = (id) => {
    const content = contents.find(c => c._id === id);
    if (content) {
      setDeleteModal({ isOpen: true, content });
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/content?id=${deleteModal.content._id}`, {
        method: 'DELETE',
      });
      const result = await safeJsonParse(response);
      
      if (result.success) {
        setContents(contents.filter(content => content._id !== deleteModal.content._id));
        setDeleteModal({ isOpen: false, content: null });
        alert('Content deleted successfully!');
        console.log('Content deleted successfully');
      } else {
        alert('Failed to delete content: ' + result.error);
        console.error('Failed to delete content:', result.error);
      }
    } catch (error) {
      alert('Error deleting content');
      console.error('Error deleting content:', error);
    }
  };

  const handleDeactivate = async (id) => {
    const content = contents.find(c => c._id === id);
    if (!content) return;

    const newStatus = content.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const response = await fetch(`/api/content?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await safeJsonParse(response);
      
      if (result.success) {
        setContents(contents.map(c => 
          c._id === id ? { ...c, status: newStatus } : c
        ));
        console.log('Content status updated successfully');
      } else {
        alert('Failed to update status: ' + result.error);
        console.error('Failed to update status:', result.error);
      }
    } catch (error) {
      alert('Error updating status');
      console.error('Error updating status:', error);
    }
  };

  const handleAddContent = async (newContent) => {
    try {
      console.log('Submitting content:', newContent);
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '', // Send empty name for backward compatibility
          labTestName: newContent.labTestName,
          labName: newContent.labName,
          overview: newContent.overview,
          importance: newContent.importance,
          testPreparation: newContent.testPreparation,
          status: newContent.status || 'Active',
        }),
      });
      
      console.log('Response status:', response.status);
      const result = await safeJsonParse(response);
      console.log('Response result:', result);
      
      if (result.success) {
        setContents([result.data, ...contents]);
        setIsAddModalOpen(false);
        alert('Content added successfully!');
        console.log('New content added:', result.data);
      } else {
        alert('Failed to add content: ' + result.error);
        console.error('Failed to add content:', result.error);
      }
    } catch (error) {
      alert('Error adding content: ' + error.message);
      console.error('Error adding content:', error);
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleViewPoints = (title, pointsString) => {
    const points = pointsString.split('|').filter(point => point.trim());
    setViewModal({ isOpen: true, title, points });
  };

  const handleCloseViewModal = () => {
    setViewModal({ isOpen: false, title: '', points: [] });
  };

  const handleCloseViewContentModal = () => {
    setViewContentModal({ isOpen: false, content: null });
  };

  const handleCloseEditModal = () => {
    setEditModal({ isOpen: false, content: null });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false, content: null });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Lab Test Content</h1>
        <button 
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200 font-semibold shadow-md"
        >
          + Add New Content
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider" style={{width: '60px'}}>
                  S.No
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider" style={{width: '180px'}}>
                  Lab Test Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider" style={{width: '150px'}}>
                  Lab Name
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider" style={{width: '120px'}}>
                  Overview
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider" style={{width: '120px'}}>
                  Importance
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider" style={{width: '140px'}}>
                  Test Preparation
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider" style={{width: '100px'}}>
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider" style={{width: '180px'}}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contents.map((content, index) => (
                <tr key={content._id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm font-semibold text-gray-900">{index + 1}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700 truncate" title={content.labTestName}>
                      {content.labTestName}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700 truncate" title={content.labName}>
                      {content.labName || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleViewPoints('Overview', content.overview)}
                      className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold rounded-md hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleViewPoints('Importance', content.importance)}
                      className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleViewPoints('Test Preparation', content.testPreparation)}
                      className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-md hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      View
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      content.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {content.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1 justify-center">
                      {/* View Icon */}
                      <button
                        onClick={() => handleView(content._id)}
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
                        onClick={() => handleEdit(content._id)}
                        className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Icon */}
                      <button
                        onClick={() => handleDelete(content._id)}
                        className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      {/* Toggle Status Icon */}
                      <button
                        onClick={() => handleDeactivate(content._id)}
                        className={`p-2 text-white rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          content.status === 'Active'
                            ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        }`}
                        title={content.status === 'Active' ? 'Deactivate' : 'Activate'}
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

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052FF]"></div>
            <p className="mt-4 text-sm text-gray-500">Loading content...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading content</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchContent}
              className="mt-4 px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && contents.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No content</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding new lab test content.</p>
          </div>
        )}
      </div>

      {/* Add Content Modal */}
      {isAddModalOpen && (
        <AddContent 
          onClose={handleCloseAddModal}
          onSubmit={handleAddContent}
        />
      )}

      {/* View Content Modal */}
      {viewContentModal.isOpen && viewContentModal.content && (
        <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#00CCFF]">
              <h2 className="text-2xl font-bold text-gray-800">View Content Details</h2>
              <button
                onClick={handleCloseViewContentModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {/* Lab Test Name */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Lab Test Name</h3>
                <p className="text-gray-800 text-base">{viewContentModal.content.labTestName}</p>
              </div>

              {/* Overview */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Overview</h3>
                <p className="text-gray-800 text-base leading-relaxed">{viewContentModal.content.overview}</p>
              </div>

              {/* Importance */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Importance</h3>
                <ul className="space-y-2">
                  {viewContentModal.content.importance.split('|').filter(p => p.trim()).map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[#0052FF] text-white rounded-full text-sm font-semibold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 text-base leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Test Preparation */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Test Preparation</h3>
                <ul className="space-y-2">
                  {viewContentModal.content.testPreparation.split('|').filter(p => p.trim()).map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-sm font-semibold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 text-base leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Status</h3>
                <span className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${
                  viewContentModal.content.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {viewContentModal.content.status}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={handleCloseViewContentModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {editModal.isOpen && editModal.content && (
        <EditContentForm
          content={editModal.content}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateContent}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.content && (
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
                onClick={handleCloseDeleteModal}
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
                Are you sure you want to delete <span className="font-bold text-gray-900">"{deleteModal.content.labTestName}"</span>?
              </p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. The content will be permanently removed from the database.
              </p>

              {/* Content Preview */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Lab Test</p>
                    <p className="font-semibold text-gray-900">{deleteModal.content.labTestName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Overview</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{deleteModal.content.overview}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      deleteModal.content.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {deleteModal.content.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex space-x-3 p-6 bg-gray-50 rounded-b-lg">
              <button
                onClick={handleCloseDeleteModal}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Points Modal */}
      {viewModal.isOpen && (
        <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">{viewModal.title}</h2>
              <button
                onClick={handleCloseViewModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <ul className="space-y-3">
                {viewModal.points.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[#0052FF] text-white rounded-full text-sm font-semibold mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 text-base leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={handleCloseViewModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Edit Content Form Component
const EditContentForm = ({ content, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    labTestName: '',
    overview: '',
    importance: [''],
    testPreparation: ['']
  });
  const [labTests, setLabTests] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Initialize form with existing content data
  useEffect(() => {
    if (content) {
      setFormData({
        labTestName: content.labTestName || '',
        overview: content.overview || '',
        importance: content.importance ? content.importance.split('|').filter(p => p.trim()) : [''],
        testPreparation: content.testPreparation ? content.testPreparation.split('|').filter(p => p.trim()) : ['']
      });
    }
  }, [content]);

  // Fetch lab tests from API
  useEffect(() => {
    const fetchLabTests = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/labtests');
        const result = await safeJsonParse(response);
        
        if (result.success) {
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
    
    fetchLabTests();
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
      const validImportance = formData.importance.filter(point => point.trim());
      const validTestPreparation = formData.testPreparation.filter(point => point.trim());
      
      if (onSubmit) {
        onSubmit({
          labTestName: formData.labTestName,
          overview: formData.overview,
          importance: validImportance.join('|'),
          testPreparation: validTestPreparation.join('|'),
          status: content.status || 'Active'
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Edit Content</h2>
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
              Update Content
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentPage;
