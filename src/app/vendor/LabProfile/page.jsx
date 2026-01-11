'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiSave, FiPlus, FiTrash2, FiClock, FiDollarSign, FiMapPin, FiPhone, FiMail, FiGlobe } from 'react-icons/fi';

const LabProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState(null);

  // Lab profile data
  const [labData, setLabData] = useState({
    name: '',
    labName: '',
    ownerName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: ''
  });

  // Working hours data (fetched from database)
  const [workingHours, setWorkingHours] = useState([
    { day: 'Monday', startTime: '08:00', endTime: '20:00' },
    { day: 'Tuesday', startTime: '08:00', endTime: '20:00' },
    { day: 'Wednesday', startTime: '08:00', endTime: '20:00' },
    { day: 'Thursday', startTime: '08:00', endTime: '20:00' },
    { day: 'Friday', startTime: '08:00', endTime: '20:00' },
    { day: 'Saturday', startTime: '08:00', endTime: '20:00' },
    { day: 'Sunday', startTime: '09:00', endTime: '14:00' },
  ]);

  // Holidays data (fetched from database)
  const [holidays, setHolidays] = useState([]);

  // State for editing working hours
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [editedWorkingHours, setEditedWorkingHours] = useState([...workingHours]);

  // New holiday form state
  const [newHoliday, setNewHoliday] = useState({
    date: ''
  });

  // Helper function to convert 12-hour format to 24-hour format
  const convertTimeTo24Hour = (time12h) => {
    if (!time12h) return '08:00'; // default value

    // Handle "9:00 AM" format
    const parts = time12h.trim().split(' ');
    if (parts.length !== 2) return '08:00';

    let [time, modifier] = parts;
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
      hours = '00';
    }

    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Helper function to convert 24-hour format to 12-hour format for display
  const convertTimeTo12Hour = (time24h) => {
    if (!time24h) return '8:00 AM'; // default value

    const [hours, minutes] = time24h.split(':');
    let hour = parseInt(hours, 10);
    const modifier = hour >= 12 ? 'PM' : 'AM';

    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }

    return `${hour}:${minutes} ${modifier}`;
  };

  // Helper function to format time range for display
  const formatTimeRange = (startTime, endTime) => {
    return `${convertTimeTo12Hour(startTime)} - ${convertTimeTo12Hour(endTime)}`;
  };

  // Fetch vendor data from database only
  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);

        // Fetch current vendor data from API
        const response = await fetch('/api/current-vendor');

        // Check if response is OK
        if (!response.ok) {
          console.error('Vendor API response not OK:', response.status, response.statusText);
          setLoading(false);
          return;
        }

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Vendor response is not JSON:', contentType);
          setLoading(false);
          return;
        }

        // Parse JSON data with error handling
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Error parsing vendor JSON:', parseError);
          setLoading(false);
          return;
        }

        console.log('API Response:', data);

        if (data.success && data.vendor) {
          console.log('✅ Vendor found:', data.vendor);
          const vendor = data.vendor;

          // Log specific holiday data
          console.log('Vendor holiday data specifically:', vendor.holidays);

          // Check if holidays is an array
          if (vendor.holidays && Array.isArray(vendor.holidays)) {
            console.log('Holidays is an array with', vendor.holidays.length, 'items');
          } else {
            console.log('Holidays is not an array or is undefined:', typeof vendor.holidays, vendor.holidays);
          }

          // Use _id if available, otherwise use id as fallback
          const vendorIdToSet = vendor._id || vendor.id;
          console.log('Setting vendorId to:', vendorIdToSet);
          setVendorId(vendorIdToSet);
          setLabData({
            name: vendor.labName || vendor.username || '',
            labName: vendor.labName || '',
            ownerName: vendor.ownerName || '',
            address: vendor.address || '',
            phone: vendor.phone || '',
            email: vendor.email || '',
            website: vendor.website || '',
            description: vendor.description || ''
          });

          // Load settings from vendor data
          if (vendor.workingHours && vendor.workingHours.length > 0) {
            // Convert time format to startTime/endTime format
            const convertedHours = vendor.workingHours.map(hour => {
              if (hour.time) {
                // Convert from "8:00 AM - 8:00 PM" format to startTime/endTime
                const parts = hour.time.split(' - ');
                if (parts.length === 2) {
                  // Simple conversion - in a real app, you'd want to properly parse AM/PM
                  return {
                    ...hour,
                    startTime: convertTimeTo24Hour(parts[0]),
                    endTime: convertTimeTo24Hour(parts[1])
                  };
                }
              }
              return hour;
            });
            setWorkingHours(convertedHours);
            setEditedWorkingHours(convertedHours);
          }

          console.log('Vendor holidays data:', vendor.holidays);
          if (vendor.holidays && vendor.holidays.length > 0) {
            // Map holidays ensuring each has a unique ID for UI purposes
            const mappedHolidays = vendor.holidays.map((h, idx) => ({
              ...h,
              id: h.id || h._id || `holiday-${idx + 1}`  // Use existing ID if available, otherwise generate one
            }));
            console.log('Mapped holidays:', mappedHolidays);
            setHolidays(mappedHolidays);
          } else {
            console.log('No holidays found for vendor');
            setHolidays([]);
          }




        } else {
          console.error('❌ Vendor not found in database');
        }
      } catch (error) {
        console.error('Error fetching vendor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLabData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // Handle working hours change
  const handleHoursChange = (index, field, value) => {
    // Validate input
    if (index < 0 || index >= editedWorkingHours.length) {
      console.error('Invalid index for working hours update:', index);
      return;
    }

    const updatedHours = [...editedWorkingHours];
    updatedHours[index] = { ...updatedHours[index], [field]: value };
    setEditedWorkingHours(updatedHours);
  };

  // Save working hours to database
  const saveWorkingHours = async () => {
    try {
      // Validate that vendorId exists
      console.log('Checking vendorId before save:', vendorId);
      if (!vendorId) {
        alert('Vendor ID not found. Please refresh the page and try again. If the problem persists, contact support.');
        return;
      }

      // Validate that we have working hours data
      if (!editedWorkingHours || editedWorkingHours.length === 0) {
        alert('No working hours data to save.');
        return;
      }

      // Convert startTime/endTime back to time format for saving
      const workingHoursToSave = editedWorkingHours.map(hour => ({
        ...hour,
        time: formatTimeRange(hour.startTime, hour.endTime)
      }));

      const response = await fetch('/api/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendorId,
          updates: { workingHours: workingHoursToSave }
        }),
      });

      // Check if response is OK
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        alert(`Failed to save working hours: ${response.status} ${response.statusText}`);
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        alert('Failed to save working hours: Invalid response format');
        return;
      }

      const result = await response.json();

      if (result.success) {
        setWorkingHours([...editedWorkingHours]);
        setIsEditingHours(false);
        alert('Working hours updated successfully!');
      } else {
        const errorMessage = result.error || 'Unknown error';
        console.error('Failed to save working hours:', errorMessage);
        alert(`Failed to save working hours: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error saving working hours:', error);
      alert('Failed to save working hours. Please check your connection and try again.');
    }
  };

  // Cancel editing hours
  const cancelEditingHours = () => {
    // Reset edited hours to the original working hours
    setEditedWorkingHours(workingHours.map(hour => ({ ...hour })));
    setIsEditingHours(false);
  };

  // Handle new holiday input change
  const handleHolidayChange = (e) => {
    const { name, value } = e.target;
    setNewHoliday(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new holiday to database
  const addNewHoliday = async () => {
    console.log('Adding new holiday with vendorId:', vendorId);
    console.log('New holiday data:', newHoliday);

    // Validate that vendorId exists
    if (!vendorId) {
      console.error('Vendor ID is missing when trying to add holiday');
      alert('Unable to save holiday: Vendor ID not found. Please refresh the page.');
      return;
    }

    if (newHoliday.date) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(newHoliday.date)) {
        alert('Invalid date format. Please use YYYY-MM-DD format.');
        return;
      }

      // Create a new holiday object with a UI-only ID
      const newHolidayWithId = {
        ...newHoliday,
        id: `new-holiday-${Date.now()}` // Use timestamp as unique ID for UI purposes
      };

      const updatedHolidays = [
        ...holidays,
        newHolidayWithId
      ];

      console.log('Updated holidays array:', updatedHolidays);

      try {
        // Prepare the data to be sent
        const holidaysToSend = updatedHolidays.map(h => ({ date: h.date }));
        console.log('Holidays data being sent to API:', holidaysToSend);

        const requestData = {
          vendorId: vendorId,
          updates: { holidays: holidaysToSend }
        };

        console.log('Full request data:', requestData);

        const response = await fetch('/api/vendors', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });

        console.log('Holiday save response:', response);

        // Check if response is OK
        if (!response.ok) {
          console.error('API response not OK:', response.status, response.statusText);
          alert(`Failed to save holiday: ${response.status} ${response.statusText}`);
          return;
        }

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Response is not JSON:', contentType);
          alert('Failed to save holiday: Invalid response format');
          return;
        }

        const result = await response.json();

        console.log('Holiday save result:', result);

        if (result.success) {
          console.log('Holiday saved successfully, updating state with:', updatedHolidays);
          setHolidays(updatedHolidays);
          setNewHoliday({ date: '' });
          alert('Holiday added successfully!');
          // Log the updated state after a short delay to see if it was set correctly
          setTimeout(() => {
            console.log('Holidays state after update:', holidays);
          }, 100);

          // Immediately fetch the vendor data again to verify the save
          console.log('Fetching vendor data again to verify holiday save...');
          try {
            const verifyResponse = await fetch('/api/current-vendor');
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (verifyData.success && verifyData.vendor) {
                console.log('Verified vendor data after holiday save:', verifyData.vendor.holidays);
              }
            }
          } catch (verifyError) {
            console.error('Error verifying holiday save:', verifyError);
          }
        } else {
          const errorMessage = result.error || 'Unknown error';
          console.error('Failed to save holiday:', errorMessage);
          alert(`Failed to add holiday: ${errorMessage}`);
        }
      } catch (error) {
        console.error('Error adding holiday:', error);
        alert('Failed to add holiday. Please check your connection and try again.');
      }
    }
  };

  // Delete holiday from database
  const deleteHoliday = async (id) => {
    console.log('Deleting holiday with id:', id);
    console.log('Current holidays:', holidays);

    // Validate that vendorId exists
    if (!vendorId) {
      console.error('Vendor ID is missing when trying to delete holiday');
      alert('Unable to delete holiday: Vendor ID not found. Please refresh the page.');
      return;
    }

    const updatedHolidays = holidays.filter(holiday => holiday.id !== id);

    console.log('Updated holidays after delete:', updatedHolidays);

    try {
      // Prepare the data to be sent
      const holidaysToSend = updatedHolidays.map(h => ({ date: h.date }));
      console.log('Holidays data being sent to API for deletion:', holidaysToSend);

      const requestData = {
        vendorId: vendorId,
        updates: { holidays: holidaysToSend }
      };

      console.log('Full request data for deletion:', requestData);

      const response = await fetch('/api/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      console.log('Holiday delete response:', response);

      // Check if response is OK
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        alert(`Failed to delete holiday: ${response.status} ${response.statusText}`);
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        alert('Failed to delete holiday: Invalid response format');
        return;
      }

      const result = await response.json();

      console.log('Holiday delete result:', result);

      if (result.success) {
        console.log('Holiday deleted successfully, updating state with:', updatedHolidays);
        setHolidays(updatedHolidays);
        alert('Holiday deleted successfully!');
        // Log the updated state after a short delay to see if it was set correctly
        setTimeout(() => {
          console.log('Holidays state after delete:', holidays);
        }, 100);

        // Immediately fetch the vendor data again to verify the delete
        console.log('Fetching vendor data again to verify holiday delete...');
        try {
          const verifyResponse = await fetch('/api/current-vendor');
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            if (verifyData.success && verifyData.vendor) {
              console.log('Verified vendor data after holiday delete:', verifyData.vendor.holidays);
            }
          }
        } catch (verifyError) {
          console.error('Error verifying holiday delete:', verifyError);
        }
      } else {
        const errorMessage = result.error || 'Unknown error';
        console.error('Failed to delete holiday:', errorMessage);
        alert(`Failed to delete holiday: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      alert('Failed to delete holiday. Please check your connection and try again.');
    }
  };

  // Save changes
  const saveChanges = async () => {
    try {
      if (!vendorId) {
        alert('Vendor ID not found. Please log in again.');
        return;
      }

      const updates = {
        username: labData.name,
        labName: labData.labName || labData.name,
        ownerName: labData.ownerName,
        address: labData.address,
        phone: labData.phone,
        email: labData.email,
        website: labData.website,
        description: labData.description
      };

      const response = await fetch('/api/vendors', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendorId,
          updates: updates
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Lab profile updated successfully!');
        setIsEditing(false);
      } else {
        alert('Failed to update lab profile: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving lab data:', error);
      alert('Failed to update lab profile. Please try again.');
    }
  };

  // Log vendorId changes for debugging
  useEffect(() => {
    console.log('VendorId updated to:', vendorId);
  }, [vendorId]);

  return (
    <div className="p-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lab Profile</h1>
              <p className="text-gray-600">Manage your lab information.</p>
            </div>
            {activeTab === 'profile' && (
              <div className="flex space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveChanges}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
                    >
                      <FiSave className="mr-2" /> Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
                  >
                    <FiEdit2 className="mr-2" /> Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`${activeTab === 'profile' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Lab Information
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`${activeTab === 'settings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Settings
              </button>
            </nav>
          </div>

          {activeTab === 'profile' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Lab Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your lab's profile details and contact information.</p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-700">Lab Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={labData.name}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition duration-150 ease-in-out"
                          placeholder="Enter lab name"
                        />
                      ) : (
                        labData.name
                      )}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-700">Owner Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {isEditing ? (
                        <input
                          type="text"
                          name="ownerName"
                          value={labData.ownerName}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition duration-150 ease-in-out"
                          placeholder="Enter owner name"
                        />
                      ) : (
                        labData.ownerName || 'N/A'
                      )}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-700">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {isEditing ? (
                        <textarea
                          name="address"
                          rows={3}
                          value={labData.address}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition duration-150 ease-in-out"
                          placeholder="Enter lab address"
                        />
                      ) : (
                        labData.address
                      )}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-700 flex items-center">
                      <FiPhone className="mr-2 text-gray-500" /> Phone
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={labData.phone}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition duration-150 ease-in-out"
                          placeholder="Enter phone number"
                        />
                      ) : (
                        labData.phone
                      )}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-700 flex items-center">
                      <FiMail className="mr-2 text-gray-500" /> Login Email
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={labData.email}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition duration-150 ease-in-out"
                          placeholder="Enter login email"
                        />
                      ) : (
                        labData.email
                      )}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-700 flex items-center">
                      <FiGlobe className="mr-2 text-gray-500" /> Website
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {isEditing ? (
                        <input
                          type="url"
                          name="website"
                          value={labData.website}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition duration-150 ease-in-out"
                          placeholder="https://example.com"
                        />
                      ) : (
                        <a href={`https://${labData.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium">
                          {labData.website}
                        </a>
                      )}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-700">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {isEditing ? (
                        <textarea
                          name="description"
                          rows={4}
                          value={labData.description}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition duration-150 ease-in-out"
                          placeholder="Enter lab description"
                        />
                      ) : (
                        labData.description || 'No description provided'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}


          {activeTab === 'settings' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Lab Settings</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Configure your lab's operational settings.</p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FiClock className="mr-2" /> Working Hours
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {isEditingHours ? (
                        <div>
                          <div className="space-y-4">
                            {editedWorkingHours.map((day, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border-b border-gray-200 last:border-0">
                                <span className="font-medium text-gray-700 w-24">{day.day}</span>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="time"
                                    value={day.startTime}
                                    onChange={(e) => handleHoursChange(index, 'startTime', e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-400">to</span>
                                  <input
                                    type="time"
                                    value={day.endTime}
                                    onChange={(e) => handleHoursChange(index, 'endTime', e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-6 flex space-x-3">
                            <button
                              onClick={saveWorkingHours}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <FiSave className="inline mr-1" /> Save
                            </button>
                            <button
                              onClick={cancelEditingHours}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-end mb-4">
                            <button
                              onClick={() => setIsEditingHours(true)}
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <FiEdit2 className="mr-1" /> Edit Hours
                            </button>
                          </div>
                          <div>
                            <div className="space-y-3">
                              {workingHours.map((day, index) => {
                                // Check if today is a holiday
                                const today = new Date();
                                const todayDateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
                                const isTodayHoliday = holidays.some(holiday => holiday.date === todayDateString);

                                // Check if this is today's day
                                const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' });
                                const isToday = day.day.toLowerCase() === todayDay.toLowerCase();

                                return (
                                  <div key={index} className="flex justify-between items-center p-3 border-b border-gray-200 last:border-0">
                                    <span className="font-medium text-gray-700">{day.day}</span>
                                    <span className="text-gray-900">
                                      {isToday && isTodayHoliday ? (
                                        <span className="text-red-600 font-medium">Holiday</span>
                                      ) : (
                                        formatTimeRange(day.startTime, day.endTime)
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Holidays</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {holidays.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-cream-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {holidays.map((holiday) => {
                                const holidayDate = new Date(holiday.date);
                                return (
                                  <tr key={holiday.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{holiday.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {holidayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <button
                                        onClick={() => deleteHoliday(holiday.id)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete holiday"
                                      >
                                        <FiTrash2 className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          No holidays scheduled
                        </div>
                      )}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Holiday</h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="date"
                            name="date"
                            value={newHoliday.date}
                            onChange={handleHolidayChange}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={addNewHoliday}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <FiPlus className="inline mr-1" /> Add
                          </button>
                        </div>
                      </div>
                    </dd>
                  </div>

                </dl>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LabProfilePage;