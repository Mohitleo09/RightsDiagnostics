'use client';

import { useState, useEffect } from 'react';
import { Home, Calendar, Clock, MapPin, Phone, User, Package } from 'lucide-react';
import Navbar from '../../page';
import Footer from '../../Footer/page';
import Link from 'next/link';

const HomeCollectionPage = () => {
  const [formData, setFormData] = useState({
    patientName: '',
    contactNumber: '',
    address: {
      street: '',
      area: '',
      city: '',
      pincode: '',
      landmark: '',
    },
    preferredDate: '',
    preferredTimeSlot: '',
    testNames: [],
    specialInstructions: '',
    priority: 'normal',
  });
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCollections();
    // Auto-fill user data
    if (typeof window !== 'undefined') {
      setFormData(prev => ({
        ...prev,
        patientName: localStorage.getItem('userName') || '',
        contactNumber: localStorage.getItem('userPhone') || '',
      }));
    }
  }, []);

  const fetchCollections = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/home-collection?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setCollections(data.collections);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      const bookingId = `HCR${Date.now()}`;

      const response = await fetch('/api/home-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId,
          bookingId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Home collection request submitted successfully! Collection charge: ₹100');
        setShowForm(false);
        fetchCollections();
        // Reset form
        setFormData(prev => ({
          ...prev,
          address: { street: '', area: '', city: '', pincode: '', landmark: '' },
          preferredDate: '',
          preferredTimeSlot: '',
          testNames: [],
          specialInstructions: '',
          priority: 'normal',
        }));
      } else {
        alert(data.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      requested: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      'in-transit': 'bg-purple-100 text-purple-800',
      collected: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Home Sample Collection</h1>
          <p className="text-gray-600">Book a phlebotomist to collect samples from your home</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Home className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Safe & Convenient</h3>
              <p className="text-sm text-blue-700">
                Professional phlebotomists will collect samples from your home. Collection charge: ₹100
              </p>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Request Home Collection</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0052FF] transition-colors"
            >
              {showForm ? 'Cancel' : 'New Request'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="address.street"
                    placeholder="Street Address *"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF]"
                  />
                  <input
                    type="text"
                    name="address.area"
                    placeholder="Area/Locality *"
                    value={formData.address.area}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF]"
                  />
                  <input
                    type="text"
                    name="address.city"
                    placeholder="City *"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF]"
                  />
                  <input
                    type="text"
                    name="address.pincode"
                    placeholder="Pincode *"
                    value={formData.address.pincode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF]"
                  />
                  <input
                    type="text"
                    name="address.landmark"
                    placeholder="Landmark (Optional)"
                    value={formData.address.landmark}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time Slot *
                  </label>
                  <select
                    name="preferredTimeSlot"
                    value={formData.preferredTimeSlot}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF]"
                  >
                    <option value="">Select Time Slot</option>
                    <option value="Morning (6AM-10AM)">Morning (6AM-10AM)</option>
                    <option value="Mid-Morning (10AM-12PM)">Mid-Morning (10AM-12PM)</option>
                    <option value="Afternoon (12PM-4PM)">Afternoon (12PM-4PM)</option>
                    <option value="Evening (4PM-8PM)">Evening (4PM-8PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Any special instructions for the phlebotomist..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-[#007AFF] hover:bg-[#0052FF] disabled:bg-[#00A3FF] text-white font-semibold rounded-lg transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Request (₹100 Collection Charge)'}
              </button>
            </form>
          )}
        </div>

        {/* My Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Collection Requests</h2>
          {collections.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No collection requests yet</p>
          ) : (
            <div className="space-y-4">
              {collections.map((collection) => (
                <div key={collection._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{collection.patientName}</p>
                      <p className="text-sm text-gray-600">{collection.bookingId}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(collection.status)}`}>
                      {collection.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(collection.preferredDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {collection.preferredTimeSlot}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {collection.address.area}, {collection.address.city}
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      ₹{collection.collectionCharge}
                    </div>
                  </div>
                  {collection.assignedTo && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900">
                        Assigned to: {collection.assignedTo.phlebotomistName}
                      </p>
                      <p className="text-sm text-blue-700">
                        Contact: {collection.assignedTo.phlebotomistPhone}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomeCollectionPage;
