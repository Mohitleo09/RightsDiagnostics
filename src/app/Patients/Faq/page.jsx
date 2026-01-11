'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [openFaqId, setOpenFaqId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Toggle FAQ accordion
  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  // Fetch FAQs from API
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/faqs?status=Active');
        const result = await response.json();
        
        if (result.success) {
          setFaqs(result.data);
        } else {
          setError('Failed to load FAQs');
        }
      } catch (err) {
        setError('Error loading FAQs');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm max-w-md">
          <div className="text-red-500 text-3xl mb-2">⚠️</div>
          <h2 className="text-xl font-medium text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded transition duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h1>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div 
              key={faq._id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(faq._id)}
                className="flex justify-between items-center w-full p-5 text-left font-medium text-gray-800 hover:bg-gray-50 transition-colors duration-150"
              >
                <span className="pr-4">{faq.question}</span>
                <span className="text-gray-500 flex-shrink-0">
                  {openFaqId === faq._id ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </span>
              </button>
              
              {openFaqId === faq._id && (
                <div className="px-5 pb-5 text-gray-600 border-t border-gray-100 pt-4">
                  <div className="prose max-w-none">
                    {faq.answer.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {faqs.length === 0 && (
            <div className="text-center py-10">
              <div className="text-gray-400 text-4xl mb-3">❓</div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No FAQs Available</h3>
              <p className="text-gray-500">There are currently no FAQs to display.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;