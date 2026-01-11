'use client';

import React, { useState, useEffect } from 'react';
import { Search, TestTube, Building, ChevronRight } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../page';
import Footer from '../Footer/page';

const SearchResultsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (query) {
      fetchSearchResults(query, currentPage);
    }
  }, [query, currentPage]);

  const fetchSearchResults = async (searchQuery, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setTotalCount(data.totalCount);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      } else {
        setError(data.error || 'Failed to fetch search results');
      }
    } catch (err) {
      setError('An error occurred while fetching search results');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Function to handle navigation to test details
  const handleViewTestDetails = (test) => {
    router.push(`/Patients/FindTests/content?testId=${test._id}&testName=${encodeURIComponent(test.testName)}`);
  };

  // Function to handle navigation to lab profile
  const handleViewLab = (lab) => {
    router.push(`/Patients/Labprofile?labId=${lab._id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <Search className="h-8 w-8 text-[#007AFF]" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
                <p className="text-gray-600">
                  {query ? `Results for "${query}"` : 'Search the entire site'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="inline-flex items-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-[#0052FF] border-t-transparent rounded-full animate-spin"></span>
                <span className="text-gray-600">Searching...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-700">{error}</p>
              <button 
                onClick={() => fetchSearchResults(query, currentPage)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {results.length > 0 ? (
                <div>
                  <div className="mb-6">
                    <p className="text-gray-600">
                      Found {totalCount} result{totalCount !== 1 ? 's' : ''} for "{query}"
                    </p>
                  </div>
                  
                  <div className="grid gap-6">
                    {results.map((item, index) => (
                      <div 
                        key={index} 
                        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                      >
                        {item.type === 'test' ? (
                          // Test Result
                          <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-[#00CCFF] rounded-xl flex-shrink-0">
                              <TestTube className="h-6 w-6 text-[#0052FF]" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.testName}</h3>
                              <p className="text-gray-600 mb-3">{item.description || 'No description available'}</p>
                              <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                  {item.organ || 'General'}
                                </span>
                                {item.category && item.category.map((cat, catIndex) => (
                                  <span key={catIndex} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                    {cat}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-lg font-bold text-[#0052FF]">₹{item.price || 'N/A'}</p>
                                  <p className="text-sm text-gray-500">Offered by {item.vendorName || 'Unknown Lab'}</p>
                                </div>
                                <button 
                                  onClick={() => handleViewTestDetails(item)}
                                  className="flex items-center gap-2 text-[#0052FF] font-semibold hover:text-[#0052FF] transition-colors"
                                >
                                  View Details
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Lab Result
                          <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl flex-shrink-0">
                              <Building className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.labName}</h3>
                              <p className="text-gray-600 mb-3">{item.description || 'No description available'}</p>
                              <div className="flex items-center text-sm text-gray-500 mb-4">
                                <span>{item.address || 'Address not available'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {item.phone ? `📞 ${item.phone}` : 'Phone not available'}
                                  </p>
                                </div>
                                <button 
                                  onClick={() => handleViewLab(item)}
                                  className="flex items-center gap-2 text-[#0052FF] font-semibold hover:text-[#0052FF] transition-colors"
                                >
                                  View Lab
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-10 h-10 rounded-lg ${
                                currentPage === pageNum
                                  ? 'bg-[#007AFF] text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === totalPages 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any tests or labs matching "{query}". Try adjusting your search terms.
                  </p>
                  <button 
                    onClick={() => window.history.back()}
                    className="px-6 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0052FF] transition-colors font-semibold"
                  >
                    Go Back
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SearchResultsPage;