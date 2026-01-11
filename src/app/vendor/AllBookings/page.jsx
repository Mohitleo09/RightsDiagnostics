'use client';

import React, { useState, useEffect } from 'react';
import { FiFilter, FiSearch, FiDownload, FiPrinter, FiCalendar, FiUser, FiPhone, FiMapPin, FiClock, FiDollarSign, FiCheckCircle, FiXCircle, FiFileText, FiClock as FiClockIcon } from 'react-icons/fi';

const AllBookingsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [vendorId, setVendorId] = useState(null);
  const [labName, setLabName] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState({}); // New state to store user profile data
  const [healthHistories, setHealthHistories] = useState({}); // State to store patient health history data
  const [selectedPatient, setSelectedPatient] = useState(null); // State to track selected patient for right panel
  const [cancelModal, setCancelModal] = useState({ isOpen: false, bookingId: null, reason: '' }); // State for cancel modal
  const [showAll, setShowAll] = useState(false); // State for show all functionality

  // Add state for the completion modal
  const [completionModal, setCompletionModal] = useState({
    isOpen: false,
    booking: null,
    paymentStatus: 'pending',
    reports: [],
    homeSampleCollection: false,
    couponCode: '', // Add coupon code field
    step: 1, // Add step tracking
    manualDiscountPercentage: 0 // New field for manual discount
  });

  // Add state for coupon verification
  const [couponVerification, setCouponVerification] = useState({
    isVerifying: false,
    isVerified: false,
    message: '',
    discountData: null // Add discountData property
  });

  // Function to verify coupon
  const verifyCoupon = async () => {
    // Only use the manually entered coupon code
    const couponToVerify = completionModal.couponCode;

    if (!couponToVerify) {
      setCouponVerification({
        isVerifying: false,
        isVerified: false,
        message: 'Please enter a coupon code'
      });
      return;
    }

    // STRICT VERIFICATION: Ensure the entered coupon matches the booking's coupon
    const expectedCoupon = completionModal.booking?.couponCode;
    const normalizedInput = couponToVerify.trim().toUpperCase();
    const normalizedExpected = expectedCoupon ? expectedCoupon.trim().toUpperCase() : '';

    if (normalizedInput !== normalizedExpected) {
      setCouponVerification({
        isVerifying: false,
        isVerified: false,
        message: 'Check coupon code. This coupon is not valid for this specific booking.'
      });
      return;
    }

    setCouponVerification({
      isVerifying: true,
      isVerified: false,
      message: ''
    });

    try {
      // Parse the booking amount - handle grouped or single bookings
      let orderAmount = 0;
      if (completionModal.booking.isGrouped) {
        orderAmount = completionModal.booking.groupTotalOriginalAmount || completionModal.booking.totalAmount || 0;
      } else {
        if (completionModal.booking.originalAmount) {
          orderAmount = completionModal.booking.originalAmount;
        } else if (completionModal.booking.amount) {
          // If it's a string with a range (e.g., "450-600"), take the first number
          if (typeof completionModal.booking.amount === 'string' && completionModal.booking.amount.includes('-')) {
            orderAmount = parseFloat(completionModal.booking.amount.split('-')[0]);
          } else {
            // Otherwise, convert to float
            orderAmount = parseFloat(completionModal.booking.amount) || 0;
          }
        }
      }

      const response = await fetch('/api/verify-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: completionModal.booking.phone,
          couponCode: couponToVerify, // Use the manually entered coupon code
          vendorId: vendorId,
          orderAmount: orderAmount
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCouponVerification({
          isVerifying: false,
          isVerified: true,
          message: 'Coupon verified successfully',
          discountData: result.data // Store discount data for display
        });
      } else {
        setCouponVerification({
          isVerifying: false,
          isVerified: false,
          message: result.message || 'Coupon verification failed'
        });
      }
    } catch (error) {
      console.error('Error verifying coupon:', error);
      setCouponVerification({
        isVerifying: false,
        isVerified: false,
        message: 'Error verifying coupon: ' + error.message
      });
    }
  };

  // Function to fetch user profile data
  const fetchUserProfiles = async (bookingData) => {
    try {
      // Get unique user IDs from bookings that have a userId
      const userIds = [...new Set(bookingData
        .filter(booking => booking.userId)
        .map(booking => booking.userId)
      )];

      if (userIds.length === 0) return;

      // Fetch all users (since there's no specific endpoint for multiple IDs)
      const userProfilesResponse = await fetch(`/api/users`);
      if (userProfilesResponse.ok) {
        const userData = await userProfilesResponse.json();
        if (userData.success && userData.users) {
          // Create a map of userId to profile data
          const profileMap = {};
          userData.users.forEach(user => {
            if (user._id) {
              profileMap[user._id] = {
                profileImage: user.profileImage,
                username: user.username,
                name: user.name
              };
            }
          });
          setUserProfiles(profileMap);
        }
      }
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  };

  // Function to calculate total bookings for a patient
  const calculateTotalBookings = (patientId) => {
    return bookings.filter(booking => booking.userId === patientId).length;
  };

  // Function to fetch patient health history data
  const fetchHealthHistory = async (userId) => {
    // Check if we've already fetched (even if it was empty)
    if (!userId || healthHistories.hasOwnProperty(userId)) return;

    try {
      console.log('Fetching health history for user:', userId);
      const response = await fetch(`/api/patient-healthhistory?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Health history response:', data);
        if (data.success && data.data) {
          setHealthHistories(prev => ({
            ...prev,
            [userId]: data.data
          }));
          console.log('Health history set for user:', userId, data.data);
        } else {
          console.log('No health history data found for user:', userId);
          // Set an empty object to indicate we've attempted to fetch
          setHealthHistories(prev => ({
            ...prev,
            [userId]: {}
          }));
        }
      } else {
        console.log('Failed to fetch health history for user:', userId, response.status);
        // Also set empty object on failure to prevent repeated attempts
        setHealthHistories(prev => ({
          ...prev,
          [userId]: {}
        }));
      }
    } catch (error) {
      console.error('Error fetching health history:', error);
      // Set empty object on error to prevent repeated attempts
      setHealthHistories(prev => ({
        ...prev,
        [userId]: {}
      }));
    }
  };

  // Format bookings data from database
  const formatBookingData = (booking) => {
    // Check if this is a multi-test booking
    const isMultiTest = booking.tests && Array.isArray(booking.tests) && booking.tests.length > 0;

    if (isMultiTest) {
      // Multi-test booking: aggregate data
      const allTestNames = booking.tests.map(t => t.testName);
      const totalAmount = booking.tests.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
      const totalOriginalAmount = booking.tests.reduce((sum, t) => sum + (t.originalAmount || parseFloat(t.price) || 0), 0);
      const totalDiscountAmount = booking.tests.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
      const totalFinalAmount = booking.tests.reduce((sum, t) => sum + (t.finalAmount || parseFloat(t.price) || 0), 0);
      const hasDiscount = booking.tests.some(t => t.discountApplied);

      return {
        id: booking.bookingId,
        patient: booking.patientDetails.patientName || 'Unknown',
        phone: booking.patientDetails.contactNumber,
        test: allTestNames.join(', '), // Display all test names
        date: booking.appointmentDate,
        time: booking.formattedTime || booking.appointmentTime,
        amount: totalAmount.toString(),
        status: booking.status.toLowerCase(),
        location: booking.labName,
        bookingDate: booking.createdAt ? new Date(booking.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        couponCode: booking.couponCode,
        organ: booking.tests.map(t => t.organ).join(', '),
        email: booking.patientDetails.email,
        specialInstructions: booking.patientDetails.specialInstructions || '',
        userId: booking.userId,
        bookingFor: booking.bookingFor,
        isPackage: booking.tests.some(t => t.isPackage),
        reports: booking.reports || [],
        // Multi-test specific fields
        isGrouped: true,
        allTestNames: allTestNames,
        tests: booking.tests,
        // Discount information
        discountApplied: hasDiscount || booking.discountApplied || false,
        originalAmount: booking.originalAmount || totalOriginalAmount,
        discountAmount: booking.discountAmount || totalDiscountAmount,
        finalAmount: booking.finalAmount || totalFinalAmount,
        totalAmount: totalAmount,
        totalOriginalAmount: totalOriginalAmount,
        totalFinalAmount: totalFinalAmount,
        groupTotalOriginalAmount: totalOriginalAmount,
        hasDiscount: hasDiscount,
        discountType: booking.discountType || 'percentage',
        discountValue: booking.discountValue || 0
      };
    } else {
      // Single test booking: use existing logic
      return {
        id: booking.bookingId,
        patient: booking.patientDetails.patientName || 'Unknown',
        phone: booking.patientDetails.contactNumber,
        test: booking.testName,
        date: booking.appointmentDate,
        time: booking.formattedTime || booking.appointmentTime,
        amount: booking.price,
        status: booking.status.toLowerCase(),
        location: booking.labName,
        bookingDate: booking.createdAt ? new Date(booking.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        couponCode: booking.couponCode,
        organ: booking.organ,
        email: booking.patientDetails.email,
        specialInstructions: booking.patientDetails.specialInstructions || '',
        userId: booking.userId,
        bookingFor: booking.bookingFor,
        isPackage: booking.isPackage,
        isGrouped: false,
        reports: booking.reports || [],
        // Discount information
        discountApplied: booking.discountApplied || false,
        originalAmount: booking.originalAmount || 0,
        discountAmount: booking.discountAmount || 0,
        finalAmount: booking.finalAmount || 0,
        discountType: booking.discountType || 'percentage',
        discountValue: booking.discountValue || 0
      };
    }
  };

  // Load bookings from database only
  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);

        // Fetch current vendor data from API
        const vendorResponse = await fetch('/api/current-vendor');

        // Check if response is OK
        if (!vendorResponse.ok) {
          console.error('Vendor API response not OK:', vendorResponse.status, vendorResponse.statusText);
          setBookings([]);
          setLoading(false);
          return;
        }

        // Check if response is JSON
        const vendorContentType = vendorResponse.headers.get("content-type");
        if (!vendorContentType || !vendorContentType.includes("application/json")) {
          console.error('Vendor response is not JSON:', vendorContentType);
          setBookings([]);
          setLoading(false);
          return;
        }

        // Parse vendor JSON data with error handling
        let vendorData;
        try {
          vendorData = await vendorResponse.json();
        } catch (parseError) {
          console.error('Error parsing vendor JSON:', parseError);
          setBookings([]);
          setLoading(false);
          return;
        }

        if (vendorData.success && vendorData.vendor) {
          const vendor = vendorData.vendor;
          setVendorId(vendor._id);
          setLabName(vendor.labName || vendor.username);

          // Fetch bookings for analytics - only for current vendor's lab
          // FIX: Use labName parameter instead of vendorId
          const bookingsResponse = await fetch(`/api/bookings?labName=${encodeURIComponent(vendor.labName)}`);

          // Check if response is OK
          if (!bookingsResponse.ok) {
            console.error('Bookings API response not OK:', bookingsResponse.status, bookingsResponse.statusText);
            setBookings([]);
            setLoading(false);
            return;
          }

          // Check if response is JSON
          const bookingsContentType = bookingsResponse.headers.get("content-type");
          if (!bookingsContentType || !bookingsContentType.includes("application/json")) {
            console.error('Bookings response is not JSON:', bookingsContentType);
            setBookings([]);
            setLoading(false);
            return;
          }

          // Parse bookings JSON data with error handling
          let bookingsData;
          try {
            bookingsData = await bookingsResponse.json();
          } catch (parseError) {
            console.error('Error parsing bookings JSON:', parseError);
            setBookings([]);
            setLoading(false);
            return;
          }

          if (bookingsData.success && bookingsData.bookings) {
            // Format database bookings to match vendor display structure
            const formattedDBBookings = bookingsData.bookings.map(formatBookingData);

            // Fetch user profiles for the bookings
            await fetchUserProfiles(formattedDBBookings);

            // Use only database data - no fallback to localStorage
            setBookings(formattedDBBookings);
          } else {
            // If database fetch fails, show empty array instead of using localStorage
            setBookings([]);
          }
        }
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, []);

  // Function to update booking status
  const updateBookingStatus = async (bookingId, newStatus, cancelReason = null, additionalUpdates = {}) => {
    try {
      // Convert lowercase status to proper case to match database expectations
      const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

      console.log('Updating booking status:', { bookingId, newStatus: formattedStatus, cancelReason }); // Debug log

      const requestBody = {
        bookingId: bookingId,
        updates: {
          status: formattedStatus,
          ...additionalUpdates
        }
      };

      // Add cancellation reason if status is cancelled
      if (newStatus === 'cancelled' && cancelReason) {
        requestBody.updates.cancellationReason = cancelReason;
      }

      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status); // Debug log

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result); // Debug log

        if (result.success) {
          // Update the bookings state with the new status (use lowercase for UI consistency)
          setBookings(prevBookings =>
            prevBookings.map(booking =>
              booking.id === bookingId
                ? {
                  ...booking,
                  status: newStatus,
                  ...(newStatus === 'cancelled' && cancelReason ? { cancellationReason: cancelReason } : {}),
                  ...additionalUpdates
                }
                : booking
            )
          );

          // Show success message
          if (newStatus === 'completed') {
            alert('Booking marked as completed. The associated coupon has been expired.');
          } else if (newStatus === 'cancelled') {
            alert(`Booking has been cancelled. The associated coupon has been expired.\n\nCancellation reason saved: ${cancelReason || 'No reason provided'}`);

            // Expire the coupon associated with this booking
            try {
              const couponResponse = await fetch('/api/coupons/expire', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  couponCode: result.booking.couponCode,
                  bookingId: bookingId
                }),
              });

              if (!couponResponse.ok) {
                console.error('Failed to expire coupon');
              }
            } catch (couponError) {
              console.error('Error expiring coupon:', couponError);
            }
          }
        } else {
          console.error('Failed to update booking status:', result.error);
          alert('Failed to update booking status: ' + (result.error || 'Unknown error'));
        }
      } else {
        // Try to get more detailed error information
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse JSON, use the status text
        }
        console.error('Failed to update booking status:', errorMessage);
        alert('Failed to update booking status: ' + errorMessage);
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error updating booking status: ' + error.message);
    }
  };

  // Handle cancel booking with reason
  const handleCancelBooking = () => {
    if (!cancelModal.reason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    updateBookingStatus(cancelModal.bookingId, 'cancelled', cancelModal.reason);
    setCancelModal({ isOpen: false, bookingId: null, reason: '' });
  };

  // Add state for package details
  const [packageDetails, setPackageDetails] = useState({});

  // Function to fetch package details for a booking
  const fetchPackageDetails = async (booking) => {
    if (!booking.isPackage) return [];

    try {
      // Check if we already have the details
      if (packageDetails[booking.id]) {
        return packageDetails[booking.id];
      }

      // Fetch package details from API using the package name (test name for packages)
      const response = await fetch(`/api/packages?packageName=${encodeURIComponent(booking.test)}`);
      const result = await response.json();

      if (result.success && result.data) {
        // Extract test names from includedTests
        const includedTestNames = (result.data.includedTests || []).map(test => {
          if (typeof test === 'string') {
            return test;
          } else if (test && test.testName) {
            return test.testName;
          } else if (test && test.name) {
            return test.name;
          } else {
            return 'Test';
          }
        });

        // Cache the details
        setPackageDetails(prev => ({
          ...prev,
          [booking.id]: includedTestNames
        }));

        return includedTestNames;
      }
    } catch (error) {
      console.error('Error fetching package details:', error);
    }

    return [];
  };

  // Update the function to open the completion modal
  const openCompletionModal = async (booking) => {
    setCompletionModal({
      isOpen: true,
      booking: booking,
      paymentStatus: 'pending',
      reports: [],
      homeSampleCollection: false,
      couponCode: '', // Empty coupon code - vendor must enter manually
      step: 1,
      manualDiscountPercentage: 0
    });

    // Reset coupon verification state
    setCouponVerification({
      isVerifying: false,
      isVerified: false,
      message: '',
      discountData: null
    });

    // Removed auto-verification - vendor must verify manually

    // If it's a package booking, fetch the included tests
    if (booking.isPackage) {
      await fetchPackageDetails(booking);
    }
  };

  // Function to handle closing the completion modal
  const closeCompletionModal = () => {
    setCompletionModal({
      isOpen: false,
      booking: null,
      paymentStatus: 'pending',
      reports: [],
      homeSampleCollection: false,
      couponCode: '',
      step: 1,
      manualDiscountPercentage: 0
    });

    // Reset coupon verification state
    setCouponVerification({
      isVerifying: false,
      isVerified: false,
      message: '',
      discountData: null
    });
  };

  // Function to handle form submission in completion modal
  const handleCompletionSubmit = async (e) => {
    e.preventDefault();

    // Check if coupon is verified before submitting
    if (completionModal.couponCode && !couponVerification.isVerified) {
      alert('Please verify the coupon code first');
      return;
    }

    try {
      // Handle report uploads if files were selected
      let reportUrls = [];
      if (completionModal.reports && completionModal.reports.length > 0) {
        // Convert files to Base64 data URLs to store actual file content
        const filePromises = Array.from(completionModal.reports).map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });
        reportUrls = await Promise.all(filePromises);
      }

      // Calculate final pricing with manual and coupon discounts
      const originalTotal = couponVerification.discountData?.originalAmount ||
        (completionModal.booking?.isGrouped ? completionModal.booking.groupTotalOriginalAmount :
          (completionModal.booking?.originalAmount || completionModal.booking?.amount)) || 0;

      const manualPercent = parseFloat(completionModal.manualDiscountPercentage) || 0;
      const manualDiscountAmount = (originalTotal * manualPercent) / 100;
      const couponDiscountAmount = couponVerification.discountData?.discountAmount || 0;
      const totalDiscount = manualDiscountAmount + couponDiscountAmount;
      const finalAmount = originalTotal - totalDiscount;

      // Prepare additional updates for the booking
      const additionalUpdates = {
        paymentStatus: completionModal.paymentStatus,
        homeSampleCollection: completionModal.homeSampleCollection,
        reports: reportUrls,
        // Include discount information
        ...(totalDiscount > 0 && {
          discountApplied: true,
          originalAmount: originalTotal,
          discountAmount: totalDiscount,
          finalAmount: finalAmount,
          discountType: (manualPercent > 0 && couponDiscountAmount > 0) ? 'mixed' : (manualPercent > 0 ? 'manual' : 'coupon'),
          discountValue: manualPercent > 0 ? manualPercent : (couponVerification.discountData?.discountValue || 0),
          manualDiscountPercentage: manualPercent,
          couponDiscountAmount: couponDiscountAmount
        })
      };

      // Update booking with all the new information
      await updateBookingStatus(completionModal.booking.id, 'completed', null, additionalUpdates);

      // Close the modal and show a success message
      closeCompletionModal();
      alert('Booking completed successfully!');
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Error completing booking: ' + error.message);
    }
  };

  // Update the status dropdown change handler
  const handleStatusChange = (e, booking) => {
    const newStatus = e.target.value;
    if (newStatus === 'cancelled') {
      setCancelModal({ isOpen: true, bookingId: booking.id, reason: '' });
    } else if (newStatus === 'completed') {
      // Open the completion modal instead of directly updating status
      openCompletionModal(booking);
    } else {
      updateBookingStatus(booking.id, newStatus);
    }
  };

  // Filter bookings based on active tab and search query
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.phone.includes(searchQuery) ||
      booking.test.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && booking.status === 'completed') ||
      (statusFilter === 'confirmed' && booking.status === 'confirmed') ||
      (statusFilter === 'pending' && booking.status === 'pending') ||
      (statusFilter === 'cancelled' && booking.status === 'cancelled');

    const matchesDate = !dateRange || booking.date === dateRange;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate booking statistics (removed pending count)
  const stats = {
    total: bookings.length,
    completed: bookings.filter(b => b.status === 'completed').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    // Removed pending count
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    const baseStyle = 'px-2 py-1 text-xs font-semibold rounded-full';
    switch (status) {
      case 'completed':
        return `${baseStyle} bg-green-100 text-green-800`;
      case 'confirmed':
        return `${baseStyle} bg-blue-100 text-blue-800`;
      case 'pending':
        return `${baseStyle} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseStyle} bg-red-100 text-red-800`;
      default:
        return `${baseStyle} bg-gray-100 text-gray-800`;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="mr-1 inline" />;
      case 'confirmed':
        return <FiCheckCircle className="mr-1 inline" />;
      case 'pending':
        return <FiClockIcon className="mr-1 inline" />;
      case 'cancelled':
        return <FiXCircle className="mr-1 inline" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          {/* Simple neat spinner */}
          <div className="w-6 h-6 rounded-full border-[2px] border-slate-100 border-t-slate-800 animate-spin"></div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Loading bookings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Cancel Booking Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Cancel Booking</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for cancelling this booking:</p>
            <textarea
              value={cancelModal.reason}
              onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              placeholder="Enter reason for cancellation..."
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setCancelModal({ isOpen: false, bookingId: null, reason: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelBooking}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal - Simple & Neat Redesign */}
      {completionModal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-transparent backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl shadow-blue-900/10 overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="px-6 py-4 bg-blue-600 border-b border-blue-700 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-white">Booking Confirmed</h3>
                <p className="text-xs text-blue-100 font-medium">ID: #{completionModal.booking?.id}</p>
              </div>
              <button
                onClick={closeCompletionModal}
                className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Test Details Card */}
              <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Test Details</h4>
                    {!completionModal.booking?.isPackage ? (
                      <div className="space-y-1">
                        {completionModal.booking?.isGrouped ? (
                          completionModal.booking?.allTestNames.map((testName, index) => (
                            <div key={index} className="text-sm font-medium text-gray-800">• {testName}</div>
                          ))
                        ) : (
                          <div className="text-sm font-medium text-gray-800">{completionModal.booking?.test}</div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                          {completionModal.booking?.test}
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">PACKAGE</span>
                        </div>
                        {packageDetails[completionModal.booking?.id] && (
                          <div className="mt-2 pl-2 border-l-2 border-blue-200">
                            <p className="text-xs text-gray-500 mb-1">Includes:</p>
                            <ul className="text-xs text-gray-600 space-y-0.5">
                              {packageDetails[completionModal.booking?.id].map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-400 mb-0.5 font-medium">Booking Amount</p>
                    <p className="text-lg font-bold text-blue-700">
                      ₹{completionModal.booking?.isGrouped ? completionModal.booking?.totalAmount : completionModal.booking?.amount}
                    </p>
                    {(completionModal.booking?.hasDiscount || completionModal.booking?.discountApplied) && (
                      <p className="text-xs text-green-600 font-medium">Discount applied</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 1 Form */}
              {completionModal.step === 1 && (
                <form id="step1-form" className="space-y-6" onSubmit={(e) => { e.preventDefault(); setCompletionModal(prev => ({ ...prev, step: 2 })); }}>

                  {/* Upload Section */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-gray-700">Upload Reports</label>
                      {completionModal.reports?.length > 0 && (
                        <button type="button" onClick={() => setCompletionModal(prev => ({ ...prev, reports: [] }))} className="text-xs text-red-500 hover:text-red-700 font-medium bg-red-50 px-2 py-1 rounded">Clear All</button>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="file" multiple id="file-upload" className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length > 0) setCompletionModal(prev => ({ ...prev, reports: e.target.files }));
                        }}
                      />
                      <label htmlFor="file-upload" className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${completionModal.reports?.length > 0 ? 'border-blue-400 bg-blue-50/30' : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                        <div className={`p-3 rounded-full mb-3 ${completionModal.reports?.length > 0 ? 'bg-blue-100 text-blue-600' : 'bg-blue-50 text-blue-400'}`}>
                          {completionModal.reports?.length > 0 ? <FiCheckCircle size={20} /> : <FiFileText size={20} />}
                        </div>
                        {completionModal.reports?.length > 0 ? (
                          <div className="text-center">
                            <p className="text-sm font-bold text-blue-900">{completionModal.reports.length} files selected</p>
                            <p className="text-xs text-blue-600 mt-1 max-w-[200px] truncate">{Array.from(completionModal.reports).map(f => f.name).join(', ')}</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Click to upload reports</p>
                            <p className="text-xs text-gray-400 mt-1">Supports PDF, JPG, PNG</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>



                  {/* Coupon Code section */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Discount Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon"
                        className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium focus:ring-2 outline-none transition-all ${couponVerification.isVerified ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-50'}`}
                        value={completionModal.couponCode}
                        onChange={(e) => setCompletionModal({ ...completionModal, couponCode: e.target.value })}
                        readOnly={couponVerification.isVerified}
                      />
                      <button
                        type="button"
                        onClick={verifyCoupon}
                        disabled={couponVerification.isVerifying || !completionModal.couponCode || couponVerification.isVerified}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-sm ${couponVerification.isVerified ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        {couponVerification.isVerifying ? '...' : couponVerification.isVerified ? 'Verified' : 'Apply'}
                      </button>
                    </div>
                    {couponVerification.message && (
                      <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${couponVerification.isVerified ? 'text-green-600' : 'text-red-500'}`}>
                        {couponVerification.isVerified ? <FiCheckCircle size={12} /> : <FiXCircle size={12} />}
                        {couponVerification.message}
                      </p>
                    )}
                  </div>

                </form>
              )}

              {/* Step 2 Content */}
              {completionModal.step === 2 && (() => {
                const originalTotal = couponVerification.discountData?.originalAmount ||
                  (completionModal.booking?.isGrouped ? completionModal.booking.groupTotalOriginalAmount :
                    (completionModal.booking?.originalAmount || completionModal.booking?.amount)) || 0;

                const manualDiscountAmount = (originalTotal * (completionModal.manualDiscountPercentage || 0)) / 100;
                const couponDiscountAmount = couponVerification.discountData?.discountAmount || 0;
                const totalDiscount = manualDiscountAmount + couponDiscountAmount;
                const finalNetPrice = originalTotal - totalDiscount;

                return (
                  <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment</label>
                        <select
                          value={completionModal.paymentStatus}
                          onChange={(e) => setCompletionModal({ ...completionModal, paymentStatus: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">My Discount %</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={completionModal.manualDiscountPercentage}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              if (!val || parseFloat(val) <= 100) setCompletionModal({ ...completionModal, manualDiscountPercentage: val });
                            }}
                            className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-300"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Receipt */}
                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 border-b border-blue-100 pb-2">Payment Summary</h4>

                      {/* List Items */}
                      <div className="space-y-2 mb-4">
                        {completionModal.booking?.isGrouped ? (
                          completionModal.booking.allTestDetails?.map((test, i) => (
                            <div key={i} className="flex justify-between text-xs text-gray-600">
                              <span>{test.name}</span>
                              <span>₹{test.amount}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{completionModal.booking?.test}</span>
                            <span>₹{originalTotal}</span>
                          </div>
                        )}
                      </div>

                      {/* Calculations */}
                      <div className="space-y-2 pt-2 border-t border-blue-200 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>₹{originalTotal}</span>
                        </div>
                        {(couponDiscountAmount > 0 || manualDiscountAmount > 0) && (
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Total Discount</span>
                            <span>- ₹{(couponDiscountAmount + manualDiscountAmount).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-end pt-3 mt-1 border-t border-blue-200">
                          <span className="font-bold text-gray-800">Net Payable</span>
                          <span className="text-xl font-bold text-blue-600">₹{finalNetPrice.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-blue-100 flex gap-3 bg-blue-50/50">
              {completionModal.step === 2 && (
                <button
                  onClick={() => setCompletionModal(prev => ({ ...prev, step: 1 }))}
                  className="px-5 py-2.5 rounded-lg border border-blue-200 text-blue-700 font-bold text-sm hover:bg-white hover:border-blue-300 transition-all shadow-sm"
                >
                  Back
                </button>
              )}
              <button
                onClick={completionModal.step === 1 ? (() => document.getElementById('step1-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))) : handleCompletionSubmit}
                disabled={completionModal.step === 1 && !couponVerification.isVerified && completionModal.couponCode?.length > 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completionModal.step === 1 ? 'PROCEED TO PAYMENT' : 'CONFIRM COMPLETION'}
                <FiCheckCircle size={16} />
              </button>
            </div>

          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
        <p className="text-gray-600">View and manage all patient bookings{labName && ` for ${labName}`}</p>
      </div>

      {/* Stats Cards - added cancelled card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <FiCalendar className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <FiCheckCircle className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <FiCheckCircle className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <FiXCircle className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters - removed export button and modified status dropdown */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by booking ID, patient name, or test..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input
                type="date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            {/* Removed export and print buttons */}
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booked On
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead><tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length > 0 ? (
                <>
                  {/* Group bookings by coupon code */}
                  {(() => {
                    // Group bookings by coupon code (tests booked together share same coupon)
                    const groupedBookings = (showAll ? filteredBookings : filteredBookings.slice(0, 4)).reduce((groups, booking) => {
                      const key = booking.couponCode || booking.id;
                      if (!groups[key]) {
                        groups[key] = [];
                      }
                      groups[key].push(booking);
                      return groups;
                    }, {});

                    // Convert grouped bookings to display format
                    const bookingGroups = Object.values(groupedBookings).map(bookings => {
                      // Use the first booking as base
                      const mainBooking = bookings[0];

                      let hasDiscount = false;
                      let totalOriginalAmount = 0;
                      let totalFinalAmount = 0;
                      let groupTotalOriginalAmount = 0;

                      // Itemized details for all tests in the group
                      const allTestDetails = bookings.map(b => {
                        const originalPrice = b.discountApplied ? (b.originalAmount || 0) : (parseFloat(b.amount) || 0);
                        const finalPrice = b.discountApplied ? (b.finalAmount || 0) : (parseFloat(b.amount) || 0);

                        groupTotalOriginalAmount += originalPrice;
                        totalOriginalAmount += originalPrice;
                        totalFinalAmount += finalPrice;

                        if (b.discountApplied) {
                          hasDiscount = true;
                        }

                        return {
                          name: b.test,
                          amount: originalPrice
                        };
                      });

                      // For display in the table (if no discount, totalAmount is the sum)
                      const totalAmount = totalFinalAmount;

                      return {
                        ...mainBooking,
                        allTestNames: bookings.map(b => b.test),
                        allTestDetails: allTestDetails,
                        allBookingIds: bookings.map(b => b.id),
                        testCount: bookings.length,
                        isGrouped: bookings.length > 1,
                        totalAmount: totalAmount,
                        hasDiscount: hasDiscount,
                        totalOriginalAmount: totalOriginalAmount,
                        totalFinalAmount: totalFinalAmount,
                        groupTotalOriginalAmount: groupTotalOriginalAmount
                      };
                    });

                    return bookingGroups.map((group, groupIndex) => (
                      <React.Fragment key={group.id || `group-${groupIndex}`}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{group.id}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center relative">
                              <div
                                className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center overflow-hidden cursor-pointer"
                                onClick={async () => {
                                  // Set the selected patient
                                  setSelectedPatient(group);
                                  // Fetch health history if not already fetched
                                  if (group.userId) {
                                    await fetchHealthHistory(group.userId);
                                  }
                                }}
                              >
                                {userProfiles[group.userId]?.profileImage ? (
                                  <img
                                    src={userProfiles[group.userId].profileImage}
                                    alt={group.patient}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="bg-blue-100 h-full w-full flex items-center justify-center">
                                    <FiUser className="text-blue-600" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                  {group.patient}
                                  {group.bookingFor === 'family' && (
                                    <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                      Family
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center">
                                  <FiPhone className="mr-1" /> {group.phone}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center gap-1">
                              <span className="truncate max-w-[120px]">{group.test}</span>
                              {group.isGrouped && (
                                <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                  {group.testCount} tests
                                </span>
                              )}
                              {group.isPackage && (
                                <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Package
                                </span>
                              )}
                            </div>
                            {group.isGrouped && (
                              <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">
                                {group.allTestNames.slice(1).join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(group.bookingDate)}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(group.date)}</div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <FiClock className="mr-1" /> {group.time}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {group.hasDiscount ? (
                                <>
                                  <div className="line-through text-gray-500">₹{group.totalOriginalAmount}</div>
                                  <div className="font-bold text-green-600">₹{group.totalFinalAmount}</div>
                                </>
                              ) : (
                                <span>₹{group.isGrouped ? group.totalAmount : group.amount}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {group.status === 'confirmed' ? (
                              <select
                                value={group.status}
                                onChange={(e) => handleStatusChange(e, group)}
                                className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className={getStatusBadge(group.status)}>
                                {getStatusIcon(group.status)}
                                {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                              </span>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    ));
                  })()}
                  {!showAll && filteredBookings.length > 4 && (
                    <tr key="show-all-button">
                      <td colSpan="7" className="px-6 py-4 text-center">
                        <button
                          onClick={() => setShowAll(true)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Show All ({Object.keys(filteredBookings.reduce((groups, booking) => {
                            const key = booking.couponCode || booking.id;
                            if (!groups[key]) groups[key] = [];
                            groups[key].push(booking);
                            return groups;
                          }, {})).length} total)
                        </button>
                      </td>
                    </tr>
                  )}
                  {showAll && filteredBookings.length > 4 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">
                        <button
                          onClick={() => setShowAll(false)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Show Less
                        </button>
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right-side panel for patient details with toggle arrow */}
      <>
        {/* Arrow toggle button - Enhanced UI (Vertical) */}
        <button
          onClick={() => setSelectedPatient(selectedPatient ? null : 'placeholder')}
          className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#007AFF] to-red-500 hover:from-[#0052FF] hover:to-red-600 shadow-xl rounded-l-xl rounded-r-none px-1 py-10 z-40 transition-all duration-300 ease-in-out group cursor-pointer"
          style={{ marginRight: selectedPatient ? '24rem' : '0' }}
          title={selectedPatient ? "Close patient details" : "Open patient details"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 text-white transition-transform duration-300 ease-in-out ${selectedPatient ? '' : 'rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Patient details panel - Enhanced UI */}
        <div
          className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-30 transform transition-transform duration-300 ease-in-out overflow-y-auto ${selectedPatient ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-6 bg-white min-h-full flex flex-col">
            {selectedPatient && selectedPatient !== 'placeholder' && (
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Patient Details
                </h2>
              </div>
            )}

            {selectedPatient && selectedPatient !== 'placeholder' ? (
              <div className="mb-6">
                <div className="flex items-center mb-6 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full flex items-center justify-center overflow-hidden mr-4 ring-2 ring-[#00CCFF]">
                    {userProfiles[selectedPatient.userId]?.profileImage ? (
                      <img
                        src={userProfiles[selectedPatient.userId].profileImage}
                        alt={selectedPatient.patient}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="bg-[#00CCFF] h-full w-full flex items-center justify-center">
                        <FiUser className="text-[#007AFF] h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      {selectedPatient.patient}
                      {selectedPatient.bookingFor === 'family' && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Family
                        </span>
                      )}
                    </h3>
                    {selectedPatient.bookingFor === 'family' && userProfiles[selectedPatient.userId]?.username && (
                      <p className="text-gray-600 text-sm mt-1">
                        Booked by: <span className="font-semibold">{userProfiles[selectedPatient.userId].username}</span>
                      </p>
                    )}
                    <p className="text-gray-500 flex items-center mt-1 text-sm">
                      <FiPhone className="h-4 w-4 mr-2 text-[#007AFF]" />
                      {selectedPatient.phone}
                    </p>
                  </div>
                </div>

                {/* Only show Total Bookings, Health Information, and Booking History for non-family bookings */}
                {selectedPatient.bookingFor !== 'family' && (
                  <>
                    <div className="flex items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-6">
                      <div className="p-3 bg-[#00CCFF] rounded-full mr-4">
                        <FiCalendar className="h-6 w-6 text-[#007AFF]" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Total Bookings</p>
                        <h3 className="text-2xl font-bold text-gray-900">{calculateTotalBookings(selectedPatient.userId)}</h3>
                      </div>
                    </div>



                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <span className="bg-[#00CCFF] p-1.5 rounded-lg mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </span>
                        Health Information
                      </h3>

                      {healthHistories[selectedPatient.userId] ? (
                        Object.keys(healthHistories[selectedPatient.userId]).length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Height</p>
                              <p className="font-bold text-gray-900 text-lg">{healthHistories[selectedPatient.userId].height || 'N/A'} <span className="text-sm font-normal text-gray-500">cm</span></p>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Weight</p>
                              <p className="font-bold text-gray-900 text-lg">{healthHistories[selectedPatient.userId].weight || 'N/A'} <span className="text-sm font-normal text-gray-500">kg</span></p>
                            </div>

                            <div className="col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Medications</p>
                              <p className="font-medium text-gray-900">{healthHistories[selectedPatient.userId].currentMedications || 'None'}</p>
                            </div>

                            <div className="col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Previous Medications</p>
                              <p className="font-medium text-gray-900">{healthHistories[selectedPatient.userId].previousMedications || 'None'}</p>
                            </div>

                            <div className="col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Medical Documents</p>
                                <p className="font-medium text-gray-900">
                                  {healthHistories[selectedPatient.userId].medicalDocuments && healthHistories[selectedPatient.userId].medicalDocuments.length > 0
                                    ? `${healthHistories[selectedPatient.userId].medicalDocuments.length} document(s)`
                                    : 'None'}
                                </p>
                              </div>
                              <div className="bg-white p-2 rounded-lg shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                            <div className="inline-block bg-[#00CCFF] rounded-full p-3 mb-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <p className="text-gray-600 font-medium">No health history data available</p>
                            <p className="text-gray-400 text-xs mt-1">This patient hasn't provided health information yet</p>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#007AFF] mb-3"></div>
                          <p className="text-gray-600 font-medium text-sm">Loading health information...</p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-6 mt-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <span className="bg-[#00CCFF] p-1.5 rounded-lg mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                        Booking History
                      </h3>
                      <div className="space-y-3">
                        {bookings
                          .filter(booking => booking.userId === selectedPatient.userId)
                          .map((booking) => (
                            <div key={booking.id} className="border border-gray-100 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 group">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900 group-hover:text-[#0052FF] transition-colors">
                                  {booking.test}
                                </h4>
                                <span className={getStatusBadge(booking.status)}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </div>

                              <div className="flex items-center text-xs text-gray-500 mb-3">
                                {booking.location && (
                                  <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium mr-2 flex items-center">
                                    <FiMapPin className="mr-1 h-3 w-3" />
                                    {booking.location}
                                  </span>
                                )}
                              </div>

                              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                <div className="flex items-center text-xs text-gray-500">
                                  <FiCalendar className="mr-1.5 h-3.5 w-3.5" />
                                  {formatDate(booking.date)}
                                  <span className="mx-1.5 text-gray-300">|</span>
                                  <FiClockIcon className="mr-1.5 h-3.5 w-3.5" />
                                  {booking.time}
                                </div>
                                <p className="font-bold text-gray-900 text-sm">
                                  {booking.discountApplied ? (
                                    <>
                                      <span className="line-through text-gray-500 text-xs block">₹{booking.originalAmount}</span>
                                      <span className="text-green-600 block">₹{booking.finalAmount}</span>
                                    </>
                                  ) : (
                                    <span>₹{booking.amount}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : selectedPatient === 'placeholder' ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="mb-6 p-4 bg-[#00CCFF] rounded-full">
                  <FiUser className="h-12 w-12 text-[#007AFF]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Patient</h3>
                <p className="text-gray-500 text-center max-w-xs text-sm mb-8">
                  Click on a patient's profile picture in the table to view their details
                </p>

                <div className="bg-white shadow-sm px-4 py-3 rounded-xl flex items-center max-w-xs">
                  <div className="bg-white p-1.5 rounded-full shadow-sm mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-black font-semibold">
                    Tip: Look for the profile picture in the Booking table to know patient details.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="mb-6 p-4 bg-[#00CCFF] rounded-full">
                  <FiUser className="h-12 w-12 text-[#007AFF]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Patient Selected</h3>
                <p className="text-gray-500 text-center max-w-xs text-sm">
                  Click on a patient's profile picture in the table to view their details
                </p>
              </div>
            )}
          </div>
        </div>
      </>
    </div >
  );
};

export default AllBookingsPage;