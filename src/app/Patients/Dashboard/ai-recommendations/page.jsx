'use client';

import { useState } from 'react';
import { Brain, Sparkles, AlertCircle, TrendingUp } from 'lucide-react';
import Navbar from '../../page';
import Footer from '../../Footer/page';
import { useRouter } from 'next/navigation';

const AIRecommendationsPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    symptoms: '',
    age: '',
    gender: '',
    medicalHistory: '',
  });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      const symptomsArray = formData.symptoms.split(',').map(s => s.trim()).filter(s => s);

      const response = await fetch('/api/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          symptoms: symptomsArray,
          age: formData.age,
          gender: formData.gender,
          medicalHistory: formData.medicalHistory,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations);
        setShowResults(true);
      } else {
        alert('Failed to get recommendations');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-[#00CCFF] text-[#0052FF] border-[#00A3FF]',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return badges[priority] || badges.low;
  };

  const handleBookTest = (testName) => {
    router.push(`/Patients/FindTests?search=${encodeURIComponent(testName)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!showResults ? (
          <>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Brain className="w-12 h-12 text-purple-600" />
                <Sparkles className="w-8 h-8 text-yellow-500" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                AI-Powered Test Recommendations
              </h1>
              <p className="text-gray-600 text-lg">
                Get personalized test recommendations based on your health profile
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Symptoms (comma-separated) *
                  </label>
                  <textarea
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    rows={4}
                    required
                    placeholder="e.g., fever, fatigue, chest pain, headache"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your current symptoms, health concerns, or reasons for testing
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                      min="1"
                      max="120"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical History (Optional)
                  </label>
                  <textarea
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                    rows={3}
                    placeholder="Any chronic conditions, ongoing medications, family history..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      Get AI Recommendations
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> These recommendations are AI-generated suggestions based on common medical patterns. 
                    Always consult with a healthcare professional for accurate diagnosis and treatment.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Personalized Recommendations</h1>
                <p className="text-gray-600">Based on your health profile and symptoms</p>
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              >
                New Analysis
              </button>
            </div>

            <div className="space-y-6">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{rec.category}</h3>
                        <p className="text-purple-100">{rec.reason}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getPriorityBadge(rec.priority)}`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {rec.availableTests && rec.availableTests.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rec.availableTests.map((test, testIdx) => (
                          <div key={testIdx} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{test.name}</h4>
                              {test.price && (
                                <span className="text-lg font-bold text-purple-600">₹{test.price}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{test.description || 'Diagnostic test'}</p>
                            <button
                              onClick={() => handleBookTest(test.name)}
                              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                            >
                              Book Now
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>Tests recommended but not currently available in our database</p>
                        <div className="mt-4 space-y-2">
                          {rec.tests.map((testName, idx) => (
                            <span key={idx} className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm mr-2">
                              {testName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AIRecommendationsPage;
