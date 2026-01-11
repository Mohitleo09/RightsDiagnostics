'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, MapPin, Clock, Loader2, Building2, Star,
  TestTube2, Filter, ChevronRight, ArrowRight, ShieldCheck,
  Phone, Globe, Zap
} from 'lucide-react';
import Navbar from '../page';
import Footer from '../footer/page';
import { useRouter } from 'next/navigation';
import { withAuth } from '../../utils/authGuard';

const FindLabs = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testCounts, setTestCounts] = useState({});

  // Fetch labs from API
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch vendors/labs
        const vendorsResponse = await fetch('/api/vendors');

        if (!vendorsResponse.ok) throw new Error(`HTTP ${vendorsResponse.status}`);

        const vendorsData = await vendorsResponse.json();
        if (!vendorsData.success) throw new Error(vendorsData.error || 'Failed to fetch labs');

        // Filter only approved and active vendors
        const approvedVendors = vendorsData.vendors.filter(vendor =>
          vendor.approvalStatus === 'approved' && vendor.status === 'active'
        );

        // Fetch all tests to count per vendor
        const testsResponse = await fetch('/api/tests');
        if (!testsResponse.ok) throw new Error(`HTTP ${testsResponse.status}`);

        const testsData = await testsResponse.json();

        let counts = {};
        if (testsData.success) {
          approvedVendors.forEach(vendor => {
            const vendorIdStr = vendor._id.toString();
            const testIdsForVendor = new Set();

            testsData.tests.forEach(test => {
              if (test.status !== 'Active') return;

              if (test.vendorId && test.vendorId.toString() === vendorIdStr) {
                testIdsForVendor.add(test._id.toString());
              }
              if (test.availableAtLabs && vendor.labName) {
                const labsList = test.availableAtLabs.split(',').map(lab => lab.trim());
                if (labsList.includes(vendor.labName)) {
                  testIdsForVendor.add(test._id.toString());
                }
              }
            });
            counts[vendorIdStr] = testIdsForVendor.size;
          });
          setTestCounts(counts);
        }

        const transformedLabs = approvedVendors.map(vendor => {
          const vendorIdStr = vendor._id.toString();

          let todaysHours = '8:00 AM - 8:00 PM';
          const today = new Date();
          const todayDateString = today.toISOString().split('T')[0];

          const isHoliday = vendor.holidays && vendor.holidays.some(holiday =>
            holiday.date === todayDateString
          );

          if (isHoliday) {
            todaysHours = 'Closed Today';
          } else if (vendor.workingHours && vendor.workingHours.length > 0) {
            const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' });
            const todayHours = vendor.workingHours.find(hour =>
              hour.day && hour.day.toLowerCase() === todayDay.toLowerCase()
            );
            if (todayHours) {
              todaysHours = todayHours.time || `${todayHours.startTime || '8:00'} - ${todayHours.endTime || '20:00'}`;
            } else {
              todaysHours = vendor.workingHours[0].time || '8:00 AM - 8:00 PM';
            }
          }

          return {
            id: vendor._id,
            name: vendor.labName,
            address: vendor.address || 'Address not provided',
            testsOffered: counts[vendorIdStr] || vendor.totalTestsOffered || 0,
            hours: todaysHours,
            logo: vendor.logo,
            description: vendor.description,
            phone: vendor.phone,
            website: vendor.website,
            status: vendor.status,
            rating: (Math.random() * (5.0 - 4.2) + 4.2).toFixed(1)
          };
        });

        setLabs(transformedLabs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching labs:', err);
        setError(`Error fetching labs: ${err.message}`);
        setLoading(false);
      }
    };

    fetchLabs();
  }, []);

  // Get selected location from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLocation = localStorage.getItem('selectedLocation');
      if (storedLocation && storedLocation !== 'Select Location') {
        setSelectedLocation(storedLocation);
      }
    }
  }, []);

  // Check if lab is currently open
  const isLabCurrentlyOpen = (hours) => {
    if (hours === 'Closed Today' || hours.includes('Closed')) return false;

    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    const match = hours.match(timeRegex);
    if (!match) return false;

    const [, startHour, startMinute, startPeriod, endHour, endMinute, endPeriod] = match;
    const convertTo24Hour = (hour, minute, period) => {
      let h = parseInt(hour);
      if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
      else if (period.toUpperCase() === 'AM' && h === 12) h = 0;
      return h * 60 + parseInt(minute);
    };

    const startTimeInMinutes = convertTo24Hour(startHour, startMinute, startPeriod);
    const endTimeInMinutes = convertTo24Hour(endHour, endMinute, endPeriod);
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    if (endTimeInMinutes < startTimeInMinutes) {
      return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= endTimeInMinutes;
    }
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
  };

  const filteredLabs = labs.filter(lab => {
    const matchesSearch = lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !selectedLocation ||
      selectedLocation === 'Select Location' ||
      lab.address.toLowerCase().includes(selectedLocation.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  const handleViewDetails = withAuth((lab) => {
    const queryParams = new URLSearchParams({
      labId: lab.id,
      labName: lab.name,
      hours: encodeURIComponent(lab.hours),
      isOpen: isLabCurrentlyOpen(lab.hours)
    }).toString();
    router.push(`/Patients/Labprofile?${queryParams}`);
  }, 'Please log in or sign up to view lab details');

  return (
    <div className="min-h-screen bg-[#F4F7FE] font-sans text-gray-900">
      <Navbar />

      {/* Modern Gradient Banner with integrated Search */}
      <div className="bg-white pb-12 pt-16 px-4 border-b border-gray-100 relative overflow-hidden">
        {/* Decorative Blobs */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-60 pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Search for Best <span className="text-[#2874F0]">Diagnosis Center</span>
            </h1>
            <p className="text-gray-500 text-lg">
              know about the diagnosis center before you book appointments with top-rated diagnostic centers near you.
            </p>
          </div>

          {/* Search Bar - Wide Pill */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-full p-2 shadow-[0_10px_25px_rgba(0,0,0,0.05)] border border-gray-200 flex items-center transition-all focus-within:border-[#2874F0] focus-within:shadow-lg focus-within:shadow-blue-500/10">
              <div className="pl-6 text-gray-400">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for labs, tests, or locations..."
                className="flex-1 h-14 bg-transparent border-none focus:ring-0 outline-none text-gray-700 placeholder-gray-400 text-lg font-medium px-4"
              />
              <button className="bg-[#2874F0] hover:bg-blue-600 text-white rounded-full h-12 px-8 font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 hidden sm:block">
                Search
              </button>
              <button className="bg-[#2874F0] hover:bg-blue-600 text-white rounded-full h-12 w-12 flex items-center justify-center font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 sm:hidden">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats / Info Bar */}
      <div className="bg-white border-b border-gray-100 py-3 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> 100% Verified Labs</span>
            <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#2874F0]" /> 24x7 Booking</span>
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Fast Reports</span>
          </div>
          {selectedLocation && (
            <div className="flex items-center gap-2 font-medium text-gray-900 border-l pl-6 border-gray-200">
              <MapPin className="w-4 h-4 text-[#2874F0]" />
              {selectedLocation === 'Select Location' ? 'All Locations' : selectedLocation}
            </div>
          )}
        </div>
      </div>

      {/* Main Listing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">
            Diagnostic Centers <span className="text-gray-400 font-normal ml-2">({filteredLabs.length})</span>
          </h2>

          {/* simple sort/toggle could go here */}
          <div className="flex items-center gap-2">
            {/* <button className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-lg border border-gray-200"><List className="w-5 h-5"/></button> */}
            {/* <button className="p-2 text-[#2874F0] bg-blue-50 rounded-lg border border-blue-100"><Grid className="w-5 h-5"/></button> */}
          </div>
        </div>

        {/* Grid - Horizontal Layout on Desktop */}
        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse h-48"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dotted border-red-200">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="text-[#2874F0] font-bold hover:underline">Try Again</button>
          </div>
        ) : filteredLabs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredLabs.map((lab) => {
              const isOpen = isLabCurrentlyOpen(lab.hours);

              return (
                <div
                  key={lab.id}
                  onClick={() => handleViewDetails(lab)}
                  className="group bg-white rounded-3xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row gap-6 relative overflow-hidden"
                >
                  {/* Decoration */}
                  {/* Decoration */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full pointer-events-none group-hover:from-blue-50 transition-colors"></div>

                  {/* Right: Content */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2874F0] transition-colors">{lab.name}</h3>
                          <ShieldCheck className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {lab.address}
                        </p>
                      </div>
                    </div>

                    {/* Mid Stats */}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-gray-500 mb-6">
                      <span className={`px-2.5 py-1 rounded-md border ${isOpen ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        {isOpen ? 'Open Now' : 'Closed'}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-gray-600 flex items-center gap-1">
                        <TestTube2 className="w-3 h-3" /> {lab.testsOffered} Tests
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-gray-600 hidden xl:flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {lab.hours}
                      </span>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-auto flex items-center justify-between gap-4">
                      <button className="text-sm font-bold text-[#2874F0] hover:text-blue-700 transition-colors">
                        View Profile
                      </button>
                      <button className="px-5 py-2.5 bg-gray-900 hover:bg-[#2874F0] text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 group-hover:shadow-blue-500/20">
                        Book Test <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Labs Found</h3>
            <p className="text-gray-500">We couldn't find any labs matching your criteria.</p>
            <button onClick={() => setSearchTerm('')} className="mt-6 text-[#2874F0] font-bold">Clear Filters</button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default FindLabs;