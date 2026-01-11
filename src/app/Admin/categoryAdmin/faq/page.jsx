'use client';

import { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Power, PowerOff, Plus, HelpCircle, MessageCircle, Check, X, Search, ChevronDown, ChevronUp } from 'lucide-react';

const FAQManagementPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [viewingFAQ, setViewingFAQ] = useState(null);
  const [faqToDelete, setFaqToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  // Available categories
  const categories = ['Men', 'Women', 'Kids', 'Couples', 'Elders'];

  // Fetch FAQs on component mount
  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/faqs');
      const result = await response.json();

      if (result.success) {
        setFaqs(result.data);
      } else {
        setError('Failed to fetch FAQs');
      }
    } catch (err) {
      setError('Error fetching FAQs');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => {
      const newCategories = prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category];

      return {
        ...prev,
        category: newCategories
      };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.question || !formData.answer || formData.category.length === 0) {
      setError('Please fill all fields and select at least one category');
      return;
    }

    try {
      const method = editingFAQ ? 'PUT' : 'POST';
      const url = editingFAQ ? '/api/faqs' : '/api/faqs';
      const body = editingFAQ
        ? { ...formData, id: editingFAQ._id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        setShowForm(false);
        setEditingFAQ(null);
        setFormData({ question: '', answer: '', category: [] });
        setError('');
        fetchFAQs(); // Refresh the FAQ list
      } else {
        setError(result.error || 'Failed to save FAQ');
      }
    } catch (err) {
      setError('Error saving FAQ');
      console.error('Error:', err);
    }
  };

  const handleEdit = (faq) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: [...faq.category]
    });
    setShowForm(true);
  };

  const handleView = (faq) => {
    setViewingFAQ(faq);
  };

  const handleDelete = async (faq) => {
    setFaqToDelete(faq);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!faqToDelete) return;

    try {
      const response = await fetch(`/api/faqs?id=${faqToDelete._id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        fetchFAQs(); // Refresh the FAQ list
        setIsDeleteModalOpen(false);
        setFaqToDelete(null);
      } else {
        setError(result.error || 'Failed to delete FAQ');
      }
    } catch (err) {
      setError('Error deleting FAQ');
      console.error('Error:', err);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setFaqToDelete(null);
  };

  const handleStatusChange = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

      // Optimistically update the UI
      setFaqs(prevFaqs =>
        prevFaqs.map(faq =>
          faq._id === id ? { ...faq, status: newStatus } : faq
        )
      );

      // Send the request to update the status
      const response = await fetch('/api/faqs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status: newStatus,
          question: faqs.find(f => f._id === id)?.question || '',
          answer: faqs.find(f => f._id === id)?.answer || '',
          category: faqs.find(f => f._id === id)?.category || []
        })
      });

      const result = await response.json();

      if (result.success) {
        setError('');
      } else {
        // Revert
        setFaqs(prevFaqs =>
          prevFaqs.map(faq =>
            faq._id === id ? { ...faq, status: currentStatus } : faq
          )
        );
        setError(result.error || `Failed to ${newStatus === 'Active' ? 'activate' : 'deactivate'} FAQ`);
      }
    } catch (err) {
      // Revert
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      setFaqs(prevFaqs =>
        prevFaqs.map(faq =>
          faq._id === id ? { ...faq, status: currentStatus } : faq
        )
      );
      setError(`Error ${currentStatus === 'Active' ? 'deactivating' : 'activating'} FAQ`);
      console.error('Error:', err);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFAQ(null);
    setViewingFAQ(null);
    setFormData({ question: '', answer: '', category: [] });
    setError('');
  };

  const toggleExpand = (id) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-200/60 transition-all">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <HelpCircle className="w-6 h-6" />
            </div>
            FAQ Management
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Curate the knowledge base for your users.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="group flex items-center gap-2 bg-[#0052FF] hover:bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-5 h-5 text-white stroke-[3]" />
          <span className="font-bold tracking-wide text-sm">Add New FAQ</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center gap-2">
          <div className="p-1 bg-red-100 rounded-full"><X className="w-4 h-4" /></div>
          {error}
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[32px] border border-slate-100 border-dashed">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-indigo-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No FAQs Yet</h3>
          <p className="text-slate-400 font-medium mt-1">Start building your help center by adding new questions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq._id}
              className={`group bg-white border rounded-[24px] overflow-hidden transition-all duration-300 hover:shadow-lg ${expandedFaqId === faq._id
                  ? 'border-indigo-200 shadow-xl shadow-indigo-500/5 ring-1 ring-indigo-500/10'
                  : 'border-slate-100 hover:border-indigo-100'
                }`}
            >
              <div
                className="p-6 cursor-pointer flex gap-4 items-start"
                onClick={() => toggleExpand(faq._id)}
              >
                <div className={`p-3 rounded-2xl transition-colors shrink-0 ${expandedFaqId === faq._id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                  <HelpCircle className="w-6 h-6" />
                </div>

                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className={`text-lg font-bold transition-colors ${expandedFaqId === faq._id ? 'text-indigo-900' : 'text-slate-800 group-hover:text-indigo-800'}`}>
                      {faq.question}
                    </h3>
                    <button className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                      {expandedFaqId === faq._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${faq.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                      {faq.status}
                    </span>
                    {faq.category.map((cat, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 text-xs font-bold">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedFaqId === faq._id && (
                <div className="px-6 pb-6 pl-[88px] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-slate-50 rounded-2xl text-slate-600 leading-relaxed font-medium mb-4">
                    {faq.answer}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(faq); }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(faq._id, faq.status); }}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors ${faq.status === 'Active'
                          ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                    >
                      {faq.status === 'Active' ? <><PowerOff className="w-4 h-4" /> Deactivate</> : <><Power className="w-4 h-4" /> Activate</>}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(faq); }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- Modals --- */}

      {/* 1. Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-black/5">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">{editingFAQ ? 'Edit FAQ Item' : 'New Knowledge Base Item'}</h3>
              <button onClick={handleCloseForm} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Question</label>
                  <input
                    type="text"
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    placeholder="e.g. How do I book a test?"
                    className="w-full px-5 py-4 text-sm font-bold text-slate-800 placeholder:font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Answer</label>
                  <textarea
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Provide a detailed answer..."
                    className="w-full px-5 py-4 text-sm font-medium text-slate-600 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Target Audience</label>
                  <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                      <label key={category} className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm font-bold border ${formData.category.includes(category) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                        <input type="checkbox" className="hidden" checked={formData.category.includes(category)} onChange={() => handleCategoryChange(category)} />
                        {category}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={handleCloseForm} className="flex-1 py-3.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3.5 text-sm font-bold text-white bg-[#0052FF] hover:bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 transition-all">
                    {editingFAQ ? 'Save Changes' : 'Create FAQ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Delete Confirmation Modal */}
      {isDeleteModalOpen && faqToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete FAQ?</h3>
            <p className="text-slate-500 text-sm mb-8">Are you sure you want to remove this question? This cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={cancelDelete} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/30 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. View Modal */}
      {viewingFAQ && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden ring-1 ring-black/5">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">FAQ Details</h3>
              <button onClick={handleCloseForm} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Question</div>
                <h4 className="text-lg font-bold text-slate-900 leading-snug">{viewingFAQ.question}</h4>
              </div>

              <div className="bg-indigo-50 p-5 rounded-2xl">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Answer</div>
                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{viewingFAQ.answer}</p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  {viewingFAQ.category.map((cat, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{cat}</span>
                  ))}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${viewingFAQ.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {viewingFAQ.status}
                </span>
              </div>

              <button onClick={handleCloseForm} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-colors mt-4">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FAQManagementPage;