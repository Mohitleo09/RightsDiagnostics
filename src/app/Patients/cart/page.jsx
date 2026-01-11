'use client';

import React from 'react';
import { ShoppingCart, Plus, ArrowRight, Check, CheckCircle, Copy, MapPin, Star, Calendar, Clock, Tag, User, ClipboardList, X, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '../page';
import Footer from '../Footer/page';
import { safeJsonParse } from '../../utils/apiUtils';
import { withAuth } from '../../utils/authGuard';

function CartPage() {
  // Step state: 0=cart, 1=date/time, 2=patient details, 3=location, 4=review, 5=success
  const [step, setStep] = React.useState(0);
  // Location state
  const [location, setLocation] = React.useState('');
  const [selectedLab, setSelectedLab] = React.useState(null);
  const [showLabLocations, setShowLabLocations] = React.useState(false);
  const [labSearch, setLabSearch] = React.useState('')
  const [labLocations, setLabLocations] = React.useState([]);
  const [loadingLabs, setLoadingLabs] = React.useState(false);
  // Cart state (user-specific)
  const [cart, setCart] = React.useState([]);
  // Patient details state (copied from BookAtThisLab)
  const [bookingFor, setBookingFor] = React.useState('self');
  const [patientDetails, setPatientDetails] = React.useState({
    contactNumber: '',
    email: '',
    specialInstructions: '',
    patientName: '',
    age: '',
    relation: ''
  });
  // Booking confirmation state
  const [bookingConfirmed, setBookingConfirmed] = React.useState(false);
  const [confirmingBooking, setConfirmingBooking] = React.useState(false); // Loading state for booking confirmation
  const [bookingId, setBookingId] = React.useState('');
  const [couponCode, setCouponCode] = React.useState('');
  const [bookedTests, setBookedTests] = React.useState([]);
  // Preserve booking details for success page
  const [bookedDate, setBookedDate] = React.useState('');
  const [bookedTime, setBookedTime] = React.useState('');
  const [bookedLab, setBookedLab] = React.useState(null);

  // Coupon application state
  const [appliedCoupon, setAppliedCoupon] = React.useState(null);
  const [couponInput, setCouponInput] = React.useState('');
  const [couponError, setCouponError] = React.useState('');
  const [verifyingCoupon, setVerifyingCoupon] = React.useState(false);

  // Log when bookingId or couponCode changes
  React.useEffect(() => {
    // console.log('bookingId updated:', bookingId);
  }, [bookingId]);



  React.useEffect(() => {
    // console.log('couponCode updated:', couponCode);
  }, [couponCode]);

  // Function to verify and apply coupon
  const applyCoupon = async () => {
    if (!couponInput.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setVerifyingCoupon(true);
    setCouponError('');

    try {
      // Get user phone from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userPhone = user.phone || '';

      // Calculate total order amount
      let totalAmount = 0;
      cart.forEach(test => {
        const price = parseFloat(test.price) || 0;
        totalAmount += price;
      });

      const response = await fetch('/api/verify-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: userPhone,
          couponCode: couponInput.trim(),
          orderAmount: totalAmount
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAppliedCoupon(result.data);
        // We'll show the discount in the UI without modifying cart items
      } else {
        setCouponError(result.message || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Error applying coupon. Please try again.');
      setAppliedCoupon(null);
    } finally {
      setVerifyingCoupon(false);
    }
  };

  // Function to remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  // Date and time state -> MOVED HERE TO FIX REFERENCE ERROR
  // Notes: The persistence logic needs to be after these declarations.

  // Date and time state
  const [selectedDate, setSelectedDate] = React.useState('');
  const [selectedTime, setSelectedTime] = React.useState('');
  const [bookedSlots, setBookedSlots] = React.useState([]); // Track booked time slots
  const [loadingSlots, setLoadingSlots] = React.useState(false); // Loading state for slot check
  const [lockingSlot, setLockingSlot] = React.useState(null); // Track which slot is being locked

  // Get user ID for cart key
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || user.email || user.phone || 'guest';
    }
    return 'guest';
  };

  // Get user ID for booking (returns only the actual user ID if available)
  const getBookingUserId = () => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Only return the user ID if it's a valid MongoDB ObjectId format
      if (user.id && user.id.length === 24) {
        return user.id;
      }
    }
    return null; // Don't set userId for guests or users without valid IDs
  };

  // Persist booking session state across refreshes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Only restore session if we have items in cart (not a fresh start)
        const cartKey = `cart_${getUserId()}`;
        const storedCart = JSON.parse(localStorage.getItem(cartKey) || '[]');

        // Don't restore session if cart is empty - this is a fresh booking
        if (storedCart.length === 0) {
          console.log('Cart is empty, skipping session restoration');
          localStorage.removeItem('bookingSessionState');
          return;
        }

        const savedSession = localStorage.getItem('bookingSessionState');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          // Check if session is valid (e.g., within 24 hours)
          if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            console.log('Restoring booking session state (patient details only)');
            // Restore state - but NOT schedule data (date, time, lab)
            if (parsed.step !== undefined) setStep(parsed.step);
            if (parsed.patientDetails) setPatientDetails(parsed.patientDetails);
            if (parsed.bookingFor) setBookingFor(parsed.bookingFor);
            // DON'T restore schedule data - user must select fresh each time
            // if (parsed.selectedDate) setSelectedDate(parsed.selectedDate);
            // if (parsed.selectedTime) setSelectedTime(parsed.selectedTime);
            // if (parsed.location) setLocation(parsed.location);
            // if (parsed.selectedLab) setSelectedLab(parsed.selectedLab);
            if (parsed.appliedCoupon) setAppliedCoupon(parsed.appliedCoupon);
            if (parsed.couponInput) setCouponInput(parsed.couponInput);
          } else {
            // Session expired, clear it
            localStorage.removeItem('bookingSessionState');
          }
        }
      } catch (error) {
        console.error('Error restoring booking session:', error);
      }
    }
  }, []);

  // Save booking session state whenever it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && step > 0) { // Only save if we have started the flow
      const sessionState = {
        step,
        patientDetails,
        bookingFor,
        // DON'T save schedule data - user must select fresh each time
        // selectedDate,
        // selectedTime,
        // location,
        // selectedLab,
        appliedCoupon,
        couponInput,
        timestamp: Date.now()
      };
      localStorage.setItem('bookingSessionState', JSON.stringify(sessionState));
    }
  }, [step, patientDetails, bookingFor, appliedCoupon, couponInput]); // Removed schedule data from dependencies

  // Scroll to top when step changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);


  // Time slot generation
  const generateTimeSlots = React.useCallback(() => {
    const slots = { morning: [], afternoon: [], evening: [] };
    const now = new Date();
    // Use local date to match selectedDate (which is YYYY-MM-DD local)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (let hour = 8; hour <= 19; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === 20 && min > 0) break;
        const time24 = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

        // Skip specific slots: 1:00 PM (13:00), 1:30 PM (13:30), and 4:30 PM (16:30)
        if (time24 === '13:00' || time24 === '13:30' || time24 === '16:30') {
          continue;
        }

        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const time12 = `${hour12}:${String(min).padStart(2, '0')} ${ampm}`;

        // Check if this time slot is in the past
        const isPast = selectedDate === currentDate && time24 < currentTime;

        if (hour >= 8 && hour < 12) {
          slots.morning.push({ value: time24, label: time12, isPast });
        } else if (hour >= 12 && hour < 17) {
          slots.afternoon.push({ value: time24, label: time12, isPast });
        } else {
          slots.evening.push({ value: time24, label: time12, isPast });
        }
      }
    }
    return slots;
  }, [selectedDate]);

  // Handle slot selection and locking
  const handleSlotSelection = async (timeValue) => {
    if (!selectedLab?.name) {
      // Should not happen with auto-select, but safety check
      if (labLocations.length > 0) {
        setSelectedLab(labLocations[0]);
      } else {
        alert("Please select a lab location first.");
        return;
      }
    }
    if (!selectedDate) {
      alert("Please select a date first.");
      return;
    }

    setLockingSlot(timeValue);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user.email || 'guest-' + Date.now();

      const response = await fetch('/api/lock-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labName: selectedLab.name,
          appointmentDate: selectedDate,
          appointmentTime: timeValue,
          userId: userId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedTime(timeValue);
      } else {
        alert(data.error || 'This slot is no longer available. Please select another slot.');
        // Refresh slots to show updated availability
        fetchBookedSlots();
      }
    } catch (error) {
      console.error('Error locking slot:', error);
      alert('Failed to select slot. Please try again.');
    } finally {
      setLockingSlot(null);
    }
  };

  // Fetch booked slots when date or lab changes
  const fetchBookedSlots = React.useCallback(async () => {
    if (selectedDate && selectedLab?.name) {
      setLoadingSlots(true);
      try {
        const response = await fetch('/api/check-slot-availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            labName: selectedLab.name,
            appointmentDate: selectedDate,
            getAllSlots: true // Custom flag to get all booked slots for the date
          }),
        });

        if (!response.ok) {
          console.error('Failed to fetch booked slots:', response.status);
          return;
        }

        const data = await safeJsonParse(response);
        if (data.success && data.bookedSlots) {
          setBookedSlots(data.bookedSlots);
        }
      } catch (error) {
        console.error('Error fetching booked slots:', error);
      } finally {
        setLoadingSlots(false);
      }
    } else {
      setBookedSlots([]);
    }
  }, [selectedDate, selectedLab]);

  React.useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  const timeSlots = generateTimeSlots();
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  const getFormattedTime = () => {
    const allSlots = [...timeSlots.morning, ...timeSlots.afternoon, ...timeSlots.evening];
    const slot = allSlots.find(s => s.value === selectedTime);
    return slot ? slot.label : selectedTime;
  };
  const router = useRouter();

  // Fetch labs for tests in cart from backend/database
  React.useEffect(() => {
    if ((step === 2 || showLabLocations) && cart.length > 0) {
      console.log('Fetching labs for cart items:', cart);
      setLoadingLabs(true);
      // Extract test names from cart items
      // For packages, we need to use the includedTests array
      const testNames = [];

      cart.forEach(item => {
        if (item.isPackage && item.includedTests && Array.isArray(item.includedTests)) {
          // For packages, add all included tests
          console.log('Package item:', item);
          console.log('Package includedTests:', item.includedTests);
          // Filter out empty strings, null, undefined values
          const validTestNames = item.includedTests.filter(test => {
            if (typeof test === 'string' && test.trim()) {
              return true;
            }
            if (typeof test === 'object' && test !== null) {
              const testName = test.testName || test.name;
              return testName && testName.trim();
            }
            return false;
          }).map(test => {
            // Extract test name if it's an object
            if (typeof test === 'object' && test !== null) {
              return test.testName || test.name;
            }
            return test;
          });

          console.log('Valid test names from package:', validTestNames);
          testNames.push(...validTestNames);
        } else {
          // For individual tests, add the test name
          console.log('Individual test item:', item);
          if (item.testName && item.testName.trim()) {
            testNames.push(item.testName);
          }
        }
      });

      console.log('All test names to check:', testNames);

      // Remove duplicates and filter out empty strings
      const uniqueTestNames = [...new Set(testNames)].filter(name => name && name.trim());

      console.log('Unique test names to check:', uniqueTestNames);

      // Only fetch if we have test names to check
      if (uniqueTestNames.length > 0) {
        fetch('/api/labs-for-tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tests: uniqueTestNames })
        })
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return safeJsonParse(res);
          })
          .then(data => {
            console.log('Labs API response:', data);
            // Ensure we're working with an array
            const labsArray = Array.isArray(data.labs) ? data.labs : [];
            setLabLocations(labsArray);
            // Auto-select the first lab if available to ensure booking can proceed
            if (labsArray.length > 0) {
              setSelectedLab(prev => prev || labsArray[0]);
            }
          })
          .catch((error) => {
            console.error('Error fetching labs:', error);
            setLabLocations([]); // Set to empty array on error
          })
          .finally(() => setLoadingLabs(false));
      } else {
        // No tests to check, set empty array and stop loading
        console.log('No valid test names found in cart');
        setLabLocations([]);
        setLoadingLabs(false);
      }
    }
  }, [step, cart]); // Fetch when step changes to 2 or cart changes

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (bookingFor === 'self') {
        const userEmail = localStorage.getItem('userEmail') || user.email || '';
        const userPhone = localStorage.getItem('userPhone') || user.phone || user.contactNumber || '';
        const userName = user.name || user.username || '';

        setPatientDetails(prev => ({
          ...prev,
          contactNumber: userPhone,
          email: userEmail,
          patientName: userName,
          age: user.age || '',
          relation: 'self'
        }));
      } else if (bookingFor === 'family') {
        // Clear details for family members so user can enter fresh data
        setPatientDetails(prev => ({
          ...prev,
          contactNumber: '',
          email: '',
          patientName: '',
          age: '',
          relation: ''
        }));
      }
    }
  }, [bookingFor]);

  const handlePatientDetailChange = (e) => {
    const { name, value } = e.target;
    setPatientDetails(prev => ({ ...prev, [name]: value }));
  };

  // Protected version of handleFindTests
  const handleFindTests = withAuth(() => {
    router.push('/Patients/FindTests');
  }, 'Please log in or sign up to browse tests');



  const cartKey = `cart_${getUserId()}`;

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for rescheduling data
      const rescheduleData = JSON.parse(localStorage.getItem('rescheduleBooking') || 'null');
      if (rescheduleData) {
        // Pre-populate the form with rescheduling data
        setCart([{
          id: Date.now(), // Generate a temporary ID
          testName: rescheduleData.testName,
          category: rescheduleData.organ,
          price: rescheduleData.price,
          isPackage: rescheduleData.isPackage || false // Add package flag
        }]);

        // Set patient details
        setBookingFor(rescheduleData.bookingFor);
        setPatientDetails(rescheduleData.patientDetails);

        // Set location
        setLocation(rescheduleData.labName);

        // Set booking ID and coupon code for rescheduling
        if (rescheduleData.bookingId) {
          setBookingId(rescheduleData.bookingId);
        }
        if (rescheduleData.couponCode) {
          setCouponCode(rescheduleData.couponCode);
        }

        // Move to date/time selection step (now Step 2)
        setStep(2);

        // Clear reschedule data from localStorage
        localStorage.removeItem('rescheduleBooking');
      } else {
        // Normal cart loading
        const stored = JSON.parse(localStorage.getItem(cartKey) || '[]');
        console.log('=== CART LOADING DEBUG ===');
        console.log('Number of items in cart:', stored.length);
        console.log('Full cart contents:', stored);

        // Detailed logging for each item
        stored.forEach((item, index) => {
          console.group(`Cart Item ${index}: ${item.testName}`);
          console.log('Item details:', item);
          console.log('ActualPrice:', item.actualPrice);
          console.log('ActualPrice type:', typeof item.actualPrice);
          if (item.actualPrice && typeof item.actualPrice === 'object') {
            console.log('ActualPrice keys:', Object.keys(item.actualPrice));
          }
          console.groupEnd();
        });

        console.log('=== END CART LOADING DEBUG ===');
        setCart(stored);

        // If cart is empty, ensure we're on step 0 (unless booking was just confirmed)
        if (stored.length === 0 && !bookingConfirmed) {
          setStep(0);
        }
      }

      // Listen for cart updates from other tabs/pages
      const update = () => {
        const updatedCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        console.log('Cart updated from event:', updatedCart);
        console.log('bookingConfirmed value in update:', bookingConfirmed);
        setCart(updatedCart);

        // If cart becomes empty, reset to step 0 (but not if booking was just confirmed)
        if (updatedCart.length === 0 && !bookingConfirmed) {
          console.log('Resetting to step 0 because cart is empty and booking not confirmed');
          setStep(0);
        } else if (bookingConfirmed) {
          console.log('NOT resetting step because booking is confirmed');
        }
      };
      window.addEventListener('cartUpdated', update);
      window.addEventListener('storage', update);
      return () => {
        window.removeEventListener('cartUpdated', update);
        window.removeEventListener('storage', update);
      };
    }
  }, [cartKey, bookingConfirmed]); // Added bookingConfirmed to dependencies

  // Reset step to 0 when cart is empty (except when on success page or booking is confirmed)
  React.useEffect(() => {
    // Only reset if cart is empty, not on success page, and booking not confirmed
    if (cart.length === 0 && step !== 4 && !bookingConfirmed) {
      console.log('Cart is empty, resetting to step 0');
      setStep(0);
    }
  }, [cart, step, bookingConfirmed]); // Use cart instead of cart.length to avoid dependency issues


  // Remove test from cart (user-specific)
  const handleRemove = (id) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    if (typeof window !== 'undefined') {
      localStorage.setItem(cartKey, JSON.stringify(newCart));
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  // Continue button handler
  const handleContinue = () => {
    setStep(1);
  };

  // Generate unique booking ID
  const generateBookingId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    // Use a longer, more unique format to prevent collisions
    return `RL-${timestamp}-${random}`;
  };

  // Generate unique coupon code
  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let coupon = '';
    for (let i = 0; i < 6; i++) {
      coupon += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return coupon;
  };

  // Handle Confirm Booking
  const handleConfirmBooking = async () => {
    setConfirmingBooking(true); // Start loading animation
    try {
      // Check if we're rescheduling an existing booking
      const isRescheduling = bookingId && couponCode;

      // Get user ID for linking bookings
      const userId = getBookingUserId();

      // Check slot availability before creating booking
      if (!isRescheduling) {
        const availabilityResponse = await fetch('/api/check-slot-availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            labName: selectedLab?.name || location,
            appointmentDate: selectedDate,
            appointmentTime: selectedTime,
            userId: userId // Pass userId to check if the slot is locked by THIS user
          }),
        });

        if (!availabilityResponse.ok) {
          throw new Error(`Failed to check slot availability: HTTP ${availabilityResponse.status}`);
        }

        const availabilityData = await availabilityResponse.json();

        if (!availabilityData.success) {
          throw new Error(availabilityData.error || 'Failed to check slot availability');
        }

        if (!availabilityData.available) {
          alert('This time slot is no longer available. Please select a different time slot.');
          return;
        }
      }

      // Generate shared booking ID and coupon code for all tests
      const sharedBookingId = bookingId || generateBookingId();
      const sharedCouponCode = couponCode || generateCouponCode();

      // Prepare tests array with all cart items
      const testsArray = cart.map(test => {
        // Ensure organ is a string, not an array
        let organValue = test.category;
        if (Array.isArray(organValue)) {
          organValue = organValue.join(', ');
        }

        // Calculate price based on applied coupon
        let finalPrice = test.price;
        let discountInfo = {};

        if (appliedCoupon) {
          // Calculate the proportion of discount for this test
          const testPrice = parseFloat(test.price) || 0;
          const totalCartPrice = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

          if (totalCartPrice > 0) {
            // Calculate proportional discount for this test
            const testProportion = testPrice / totalCartPrice;
            const testDiscountAmount = appliedCoupon.discountAmount * testProportion;
            finalPrice = testPrice - testDiscountAmount;

            discountInfo = {
              discountApplied: true,
              originalAmount: testPrice,
              discountAmount: testDiscountAmount,
              finalAmount: finalPrice,
            };
          }
        } else {
          // Even if no coupon is applied, we still want to store the actual price for the selected lab
          let actualPriceForLab = test.price;

          // If we have a selected lab and the test has actualPrice data, use the lab-specific price
          if (selectedLab && test.actualPrice && typeof test.actualPrice === 'object' && test.actualPrice !== null) {
            const selectedLabName = selectedLab.name;
            const labKeys = Object.keys(test.actualPrice);

            // Normalize the selected lab name for comparison
            const normalizedSelectedLab = selectedLabName.toLowerCase().trim();

            // Try to find a matching lab key using multiple strategies
            let found = false;

            // Strategy 1: Direct exact match
            if (test.actualPrice[selectedLabName]) {
              actualPriceForLab = test.actualPrice[selectedLabName];
              found = true;
            }

            // Strategy 2: Try all matching strategies if direct match failed
            if (!found) {
              for (const labKey of labKeys) {
                // Normalize the lab key for comparison
                const normalizedLabKey = labKey.toLowerCase().trim();

                // Check for matches with various normalization strategies
                if (normalizedLabKey === normalizedSelectedLab) {
                  actualPriceForLab = test.actualPrice[labKey];
                  found = true;
                  break;
                }
              }
            }
          }

          // Use the actual price for the selected lab as the final price
          finalPrice = actualPriceForLab;
        }

        return {
          testName: test.testName,
          organ: organValue,
          isPackage: test.isPackage || false,
          packageTests: (test.isPackage && Array.isArray(test.includedTests))
            ? test.includedTests
            : [],
          price: finalPrice.toString(),
          ...discountInfo
        };
      });

      // Calculate total amounts
      const totalOriginalAmount = testsArray.reduce((sum, test) =>
        sum + (test.originalAmount || parseFloat(test.price) || 0), 0);
      const totalDiscountAmount = testsArray.reduce((sum, test) =>
        sum + (test.discountAmount || 0), 0);
      const totalFinalAmount = testsArray.reduce((sum, test) =>
        sum + (test.finalAmount || parseFloat(test.price) || 0), 0);

      // Create single booking data with all tests
      const bookingData = {
        bookingId: sharedBookingId,
        couponCode: sharedCouponCode,
        tests: testsArray, // Array of all tests/packages
        labName: selectedLab?.name || location,
        labAddress: selectedLab?.address || 'Address not available',
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        formattedTime: getFormattedTime(),
        bookingFor: bookingFor,
        patientDetails: {
          contactNumber: patientDetails.contactNumber,
          email: patientDetails.email,
          specialInstructions: patientDetails.specialInstructions || '',
          patientName: patientDetails.patientName || '',
          age: bookingFor === 'family' ? patientDetails.age : '',
          relation: bookingFor === 'family' ? patientDetails.relation : '',
        },
        status: 'Confirmed',
        userId: userId,
        // Add discount information if applicable
        ...(appliedCoupon && {
          discountApplied: true,
          originalAmount: totalOriginalAmount,
          discountAmount: totalDiscountAmount,
          finalAmount: totalFinalAmount,
          discountType: appliedCoupon.discountType,
          discountValue: appliedCoupon.discountValue
        })
      };

      let result;
      let maxRetries = 5;
      let retryCount = 0;
      let bookingSuccess = false;

      // Try to create booking with retry mechanism for ID conflicts
      while (retryCount < maxRetries && !bookingSuccess) {
        if (isRescheduling) {
          // Update existing booking
          const response = await fetch('/api/bookings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bookingId: bookingData.bookingId,
              updates: bookingData
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          result = await safeJsonParse(response);

          if (!result.success) {
            throw new Error(result.error || 'Failed to update booking');
          }

          console.log('Booking updated successfully:', result.booking);
          bookingSuccess = true;
        } else {
          // Create new booking
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Booking API error:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          result = await safeJsonParse(response);

          if (result.success) {
            console.log('Booking created successfully:', result.booking);
            bookingSuccess = true;
          } else if (result.error === 'Booking ID already exists') {
            // If booking ID conflict, retry with a new ID
            retryCount++;
            console.log(`Booking ID conflict, retrying... (${retryCount}/${maxRetries})`);
            if (retryCount >= maxRetries) {
              throw new Error('Unable to generate unique booking ID after multiple attempts. Please try again.');
            }
            // Generate new booking ID for retry
            bookingData.bookingId = generateBookingId();
            // Wait a bit before retrying (increase delay)
            await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
          } else {
            // Other error, don't retry
            throw new Error(result.error || 'Failed to save booking');
          }
        }
      }

      if (!bookingSuccess) {
        throw new Error('Failed to create booking after multiple attempts');
      }

      // Set the booking ID and coupon code from the response
      if (result && result.booking) {
        console.log('Setting booking ID and coupon code from response:', result.booking);
        setBookingId(result.booking.bookingId);
        setCouponCode(result.booking.couponCode);
      } else {
        console.error('No booking data in API response:', result);
      }

      // Save booked tests before clearing cart
      const testsWithActualPrices = cart.map(test => ({
        ...test,
        actualPrice: test.actualPrice || ''
      }));
      setBookedTests(testsWithActualPrices);

      // Save booking details for success page display
      setBookedDate(selectedDate);
      setBookedTime(selectedTime);
      setBookedLab(selectedLab);

      setBookingConfirmed(true);
      setBookingId(result.booking.bookingId);
      console.log('✅ Booking confirmed! Setting step to 4');
      console.log('📊 Current state - bookingConfirmed: true, step: 4');
      setStep(4); // Move to Success Step

      // Hide loading animation after a brief moment to show success page
      setTimeout(() => {
        console.log('🎉 Hiding loading animation now');
        setConfirmingBooking(false);
      }, 300);

      // CRITICAL: Clear the booking session state IMMEDIATELY to prevent restoration
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bookingSessionState');
      }

      // Delay cleanup to allow success page to render first
      setTimeout(() => {
        // Clear user-specific cart from localStorage
        const cartKey = `cart_${getUserId()}`;
        localStorage.removeItem(cartKey);

        // Also clear the cart state
        setCart([]);

        // Reset all booking-related states for fresh booking next time
        setSelectedDate('');
        setSelectedTime('');
        setSelectedLab(null);
        setLocation('');
        setBookingFor('self');
        setPatientDetails({
          contactNumber: '',
          email: '',
          specialInstructions: '',
          patientName: '',
          age: '',
          relation: ''
        });
        setAppliedCoupon(null);
        setCouponInput('');
        setCouponError('');

        // Also clear any potential localStorage persistence
        if (typeof window !== 'undefined') {
          localStorage.removeItem('selectedDate');
          localStorage.removeItem('selectedTime');
          localStorage.removeItem('selectedLab');
          localStorage.removeItem('bookingLocation');
        }

        // Dispatch storage event to update navbar cart count
        // But DON'T dispatch cartUpdated to avoid triggering cart page reload
        window.dispatchEvent(new Event('storage'));
      }, 2000); // Increased delay to ensure success page is visible
    } catch (error) {
      setConfirmingBooking(false); // Stop loading on error
      console.error('Error saving booking:', error);
      // Provide more specific error messages to the user
      if (error.message.includes('Booking ID already exists')) {
        alert('This booking ID is already in use. Please try again to generate a new one.');
      } else if (error.message.includes('slot availability')) {
        alert('The selected time slot is no longer available. Please select a different time slot.');
      } else {
        alert('An error occurred while saving your booking: ' + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50/30">
        <section className="w-full max-w-7xl mx-auto px-4 py-8">
          {/* Stepper UI */}
          {/* Stepper UI - Hide when cart is empty or booking is confirmed */}
          {(cart.length > 0 || step === 4) && !bookingConfirmed && (
            <div className="w-full max-w-4xl mx-auto mb-12">
              <div className="relative flex items-center justify-between">
                {/* Progress Track Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full -z-10"></div>

                {/* Active Progress Track */}
                <div
                  className="absolute top-1/2 left-0 h-1 bg-[#007AFF] -translate-y-1/2 rounded-full transition-all duration-500 ease-out -z-10"
                  style={{ width: `${Math.min((step / 3) * 100, 100)}%` }}
                ></div>

                {[
                  { id: 0, label: 'Cart', icon: ShoppingCart },
                  { id: 1, label: 'Patient', icon: User },
                  { id: 2, label: 'Schedule', icon: Calendar },
                  { id: 3, label: 'Review', icon: ClipboardList }
                ].map((s, idx) => {
                  const isCompleted = step > idx || (idx === 3 && bookingConfirmed);
                  const isActive = step === idx;
                  const Icon = s.icon;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-3 relative group cursor-default">
                      {/* Icon Circle */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 
                              ${isCompleted ? 'bg-[#007AFF] text-white shadow-lg shadow-blue-200' :
                          isActive ? 'bg-white text-[#007AFF] border-2 border-[#007AFF] shadow-xl shadow-blue-100 scale-110' :
                            'bg-white text-gray-300 border-2 border-gray-100'}`}
                      >
                        {isCompleted ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                        )}
                      </div>

                      {/* Label */}
                      <span className={`text-xs font-bold tracking-wide transition-colors duration-300 uppercase
                              ${isActive ? 'text-[#007AFF]' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {step === 0 && (
            cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-48 h-48 mb-6 relative">
                  <div className="absolute inset-0 bg-blue-50 rounded-full animate-pulse opacity-50"></div>
                  <ShoppingCart className="w-24 h-24 text-blue-200 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Health Cart is Empty</h2>
                <p className="text-gray-500 mb-8 text-center max-w-sm">Looks like you haven't added any tests yet. Explore our wide range of health packages and tests.</p>
                <button
                  onClick={handleFindTests}
                  className="bg-[#007AFF] hover:bg-[#0052FF] text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  Find Tests
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Side: Cart Items */}
                <div className="flex-1">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <h2 className="text-xl font-bold text-gray-900">Health Cart <span className="text-sm font-medium text-gray-500 ml-2">({cart.length} items)</span></h2>
                      <button onClick={handleFindTests} className="text-[#007AFF] font-semibold text-sm hover:underline flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add More Tests
                      </button>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {cart.map((test) => (
                        <div key={test.id} className="px-8 py-8 hover:bg-gray-50 transition-colors duration-200 group">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Image Column (2 cols) */}
                            <div className="md:col-span-2 flex justify-center md:justify-start">
                              <div className="w-24 h-24 rounded-xl bg-blue-50 flex items-center justify-center text-[#007AFF] shadow-sm border border-blue-100 relative">
                                {test.isPackage ? <Star className="w-10 h-10 fill-current opacity-90" /> : <div className="text-4xl font-bold">{test.testName.charAt(0)}</div>}
                                {test.isPackage && (
                                  <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                    Package
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Content Column (10 cols) */}
                            <div className="md:col-span-10 flex flex-col justify-between h-full">
                              {/* Header Row: Title & Price */}
                              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <h3 className="font-bold text-xl text-gray-900 leading-snug group-hover:text-[#007AFF] transition-colors">{test.testName}</h3>
                                  <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                    {test.category} {test.isPackage ? '' : 'Test'}
                                  </p>
                                  {test.isPackage && test.includedTests && test.includedTests.length > 0 && (
                                    <div className="mt-3 bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Includes {test.includedTests.length} Tests:</p>
                                      <ul className="grid grid-cols-1 gap-1">
                                        {test.includedTests.map((t, i) => (
                                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="w-1 h-1 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                                            {t}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <div className="text-xs text-green-600 font-bold mt-1 flex items-center justify-end gap-1">
                                    <Tag className="w-3 h-3" />
                                    Price
                                  </div>
                                  <div className="text-2xl font-bold text-gray-900">₹{test.price}</div>
                                </div>
                              </div>

                              {/* Spacer */}
                              <div className="flex-grow"></div>

                              {/* Actions Row */}
                              <div className="flex items-center gap-6 mt-4 pt-4 md:pt-0 md:mt-2 border-t border-gray-100 md:border-0">
                                <button onClick={() => handleRemove(test.id)} className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1">
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {cart.length > 0 && (
                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between  gap-6">
                          <button
                            onClick={handleContinue}
                            className="w-full md:w-auto bg-[#007AFF] hover:bg-[#0052FF] text-white font-bold py-4 px-10 rounded-xl shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 min-w-[240px]"
                          >
                            Proceed to Book
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {step === 2 && (
            // Step 2: Select date, time & location
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6 md:p-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#007AFF]">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Select Date, Time & Location</h2>
                  <p className="text-gray-500 text-sm">Choose a convenient slot and location.</p>
                </div>
              </div>

              {/* Location Selection Section */}
              <div className="mb-8">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6 flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#0052FF] flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-200/50 ring-4 ring-blue-50">
                      <MapPin className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      {selectedLab ? (
                        <>
                          {selectedLab.name}
                          {selectedLab.address && (
                            <>
                              <br />
                              <span className="text-sm text-gray-600">{selectedLab.address}</span>
                            </>
                          )}
                          {/* Test availability summary */}
                          <div className="mt-1">
                            <span className={`text-xs px-2 py-1 rounded ${selectedLab.hasAllTests
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {selectedLab.hasAllTests
                                ? 'All tests available at this location'
                                : `${selectedLab.availableTestCount}/${selectedLab.totalTestsRequested} tests available`}
                            </span>
                          </div>
                        </>
                      ) : 'No location selected'}
                    </div>
                    <button
                      className="ml-2 p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-[#007AFF] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-blue-200 group"
                      onClick={() => setShowLabLocations(true)}
                      title="Change Location"
                    >
                      <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Test availability details for selected lab */}
                  {selectedLab && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Available Tests:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedLab.testsAvailable.map((test, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                              >
                                {test}
                              </span>
                            ))}
                          </div>
                        </div>
                        {!selectedLab.hasAllTests && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">Missing Tests:</p>
                            <div className="flex flex-wrap gap-1">
                              {cart.flatMap(item => {
                                // For packages, check each included test
                                if (item.isPackage && item.includedTests && Array.isArray(item.includedTests)) {
                                  return item.includedTests
                                    .filter(testName => !selectedLab.testsAvailable.includes(testName))
                                    .map((testName, idx) => (
                                      <span
                                        key={`${item.id}-${idx}`}
                                        className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full line-through"
                                      >
                                        {testName}
                                      </span>
                                    ));
                                }
                                // For individual tests, check the test name directly
                                else if (!selectedLab.testsAvailable.includes(item.testName)) {
                                  return (
                                    <span
                                      key={item.id}
                                      className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full line-through"
                                    >
                                      {item.testName}
                                    </span>
                                  );
                                }
                                // Return empty array for tests that are available
                                return [];
                              })}
                            </div>
                            <p className="text-xs text-red-600 mt-2">
                              You'll need to select additional locations for missing tests or remove them from your cart.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Lab Location List UI */}
                {showLabLocations && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200" onClick={(e) => e.target === e.currentTarget && setShowLabLocations(false)}>
                    <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-gray-900/5">
                      {/* Header */}
                      <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Select Lab Location</h3>
                          <p className="text-sm text-gray-500 mt-1">Choose a convenient lab for your tests</p>
                        </div>
                        <button
                          onClick={() => setShowLabLocations(false)}
                          className="p-2.5 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Search & Content */}
                      <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/50">
                        {/* Search Bar */}
                        <div className="px-8 pt-6 pb-2">
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 group-focus-within:text-[#007AFF] transition-colors">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                              </svg>
                            </div>
                            <input
                              type="text"
                              value={labSearch}
                              onChange={e => setLabSearch(e.target.value)}
                              placeholder="Search by lab name or area..."
                              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-[#007AFF] text-gray-900 font-medium placeholder-gray-400 transition-all shadow-sm group-hover:border-gray-300"
                            />
                          </div>
                        </div>

                        {/* Scrollable list */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
                          {loadingLabs ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                              <div className="relative w-16 h-16 mb-4">
                                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-[#007AFF] rounded-full border-t-transparent animate-spin"></div>
                              </div>
                              <span className="font-medium">Finding nearby labs...</span>
                            </div>
                          ) : (
                            <>
                              {labLocations.length === 0 ? (
                                <div className="text-center py-12 px-4 rounded-3xl bg-white border border-gray-100 border-dashed">
                                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <MapPin className="w-8 h-8" />
                                  </div>
                                  <h4 className="text-lg font-bold text-gray-900 mb-2">No labs found</h4>
                                  <p className="text-gray-500 max-w-xs mx-auto mb-6">We couldn't find any labs matching your search criteria.</p>
                                  <button
                                    onClick={() => setLabSearch('')}
                                    className="text-[#007AFF] font-bold text-sm hover:underline"
                                  >
                                    Clear search
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {/* Recommendation banner */}
                                  {labLocations.some(lab => lab.hasAllTests) && (
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 mb-2">
                                      <div className="p-2 bg-white rounded-full text-emerald-600 shadow-sm mt-0.5">
                                        <Check className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-emerald-900">Recommended Locations</p>
                                        <p className="text-xs text-emerald-700 mt-0.5">
                                          Labs marked with "All Tests Available" can perform all your requested tests in a single visit.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="space-y-4">
                                    {labLocations
                                      .filter(lab => lab.name.toLowerCase().includes(labSearch.toLowerCase()))
                                      .map((lab) => {
                                        const isSelected = selectedLab?.name === lab.name;
                                        return (
                                          <div
                                            key={lab.name}
                                            onClick={() => {
                                              setSelectedLab(lab);
                                              setShowLabLocations(false);
                                            }}
                                            className={`relative group bg-white border-2 rounded-2xl p-5 cursor-pointer transition-all duration-200 ${isSelected
                                              ? 'border-[#007AFF] shadow-lg shadow-blue-100 ring-1 ring-[#007AFF]/20'
                                              : 'border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5'
                                              }`}
                                          >
                                            {/* Selection Indicator */}
                                            <div className={`absolute top-5 right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                              ? 'bg-[#007AFF] border-[#007AFF] text-white'
                                              : 'border-gray-200 group-hover:border-blue-300'
                                              }`}>
                                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>

                                            <div className="pr-12">
                                              <div className="flex items-center gap-2 mb-1">
                                                <h4 className={`font-bold text-lg ${isSelected ? 'text-[#007AFF]' : 'text-gray-900'}`}>{lab.name}</h4>

                                                {/* Availability Badge */}
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${lab.hasAllTests
                                                  ? 'bg-emerald-100 text-emerald-700'
                                                  : 'bg-amber-100 text-amber-700'
                                                  }`}>
                                                  <span className={`w-1.5 h-1.5 rounded-full ${lab.hasAllTests ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                  {lab.hasAllTests ? 'All Tests Available' : `${lab.availableTestCount}/${lab.totalTestsRequested} Tests`}
                                                </span>
                                              </div>

                                              <p className="text-gray-500 text-sm mb-3 line-clamp-1">{lab.details || 'Leading diagnostic center'}</p>

                                              {/* Lab Info */}
                                              <div className="space-y-2">
                                                {lab.address && (
                                                  <div className="flex items-start gap-2 text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                                    <span>{lab.address}</span>
                                                  </div>
                                                )}
                                                {lab.phone && (
                                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25" />
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25v9A2.25 2.25 0 005.25 19.5h13.5A2.25 2.25 0 0021 17.25v-9" />
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
                                                    </svg>
                                                    <span>{lab.phone}</span>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Tests Breakdown */}
                                              <div className="mt-4 pt-4 border-t border-gray-100">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Available Tests</p>
                                                <div className="flex flex-wrap gap-2">
                                                  {lab.testsAvailable.map((test, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                                      {test}
                                                    </span>
                                                  ))}
                                                </div>

                                                {!lab.hasAllTests && (
                                                  <div className="mt-3">
                                                    <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2">Missing Tests</p>
                                                    <div className="flex flex-wrap gap-2">
                                                      {cart.flatMap(item => {
                                                        if (item.isPackage && item.includedTests && Array.isArray(item.includedTests)) {
                                                          return item.includedTests
                                                            .filter(testName => !lab.testsAvailable.includes(testName))
                                                            .map((testName, idx) => (
                                                              <span key={`${item.id}-${idx}`} className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium border border-red-100 opacity-70">
                                                                <span className="line-through">{testName}</span>
                                                              </span>
                                                            ));
                                                        } else if (!lab.testsAvailable.includes(item.testName)) {
                                                          return (
                                                            <span key={item.id} className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium border border-red-100 opacity-70">
                                                              <span className="line-through">{item.testName}</span>
                                                            </span>
                                                          );
                                                        }
                                                        return [];
                                                      })}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}



              </div>

              {/* Date Selection */}
              <div className="mb-10">
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Select Date</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#007AFF] text-gray-900 font-medium transition-all hover:border-blue-200 bg-gray-50/30"
                  />
                </div>
              </div>

              {/* Time Selection */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-6 uppercase tracking-wide">Select Time Slot</label>
                {loadingSlots && (
                  <div className="flex items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <svg className="animate-spin h-6 w-6 text-[#007AFF] mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-600 font-medium">Checking availability...</span>
                  </div>
                )}

                {!loadingSlots && (
                  <div className="space-y-8">
                    {/* Morning Slots */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-md bg-orange-50 text-orange-500">
                          <span className="text-xs font-bold uppercase">Morning</span>
                        </div>
                        <div className="h-px bg-gray-100 flex-1"></div>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {timeSlots.morning.map(slot => {
                          const isBooked = bookedSlots.includes(slot.value);
                          const isPast = slot.isPast;
                          const isSelected = selectedTime === slot.value;
                          return (
                            <button
                              key={slot.value}
                              onClick={() => !isBooked && !isPast && handleSlotSelection(slot.value)}
                              disabled={isBooked || isPast || lockingSlot !== null}
                              className={`px-2 py-3 text-sm font-bold rounded-xl border transition-all duration-200 relative overflow-hidden group ${isBooked || isPast
                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-60'
                                : isSelected
                                  ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-lg shadow-blue-200 scale-105 ring-2 ring-blue-100'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
                                }`}
                            >
                              {lockingSlot === slot.value ? (
                                <span className="flex items-center justify-center">
                                  <svg className="animate-spin h-4 w-4 text-[#007AFF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </span>
                              ) : (
                                slot.label
                              )}
                              {isSelected && !lockingSlot && <div className="absolute inset-0 bg-white/10 animate-pulse"></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Afternoon Slots */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-md bg-yellow-50 text-yellow-600">
                          <span className="text-xs font-bold uppercase">Afternoon</span>
                        </div>
                        <div className="h-px bg-gray-100 flex-1"></div>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {timeSlots.afternoon.map(slot => {
                          const isBooked = bookedSlots.includes(slot.value);
                          const isPast = slot.isPast;
                          const isSelected = selectedTime === slot.value;
                          return (
                            <button
                              key={slot.value}
                              onClick={() => !isBooked && !isPast && handleSlotSelection(slot.value)}
                              disabled={isBooked || isPast || lockingSlot !== null}
                              className={`px-2 py-3 text-sm font-bold rounded-xl border transition-all duration-200 relative overflow-hidden group ${isBooked || isPast
                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-60'
                                : isSelected
                                  ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-lg shadow-blue-200 scale-105 ring-2 ring-blue-100'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
                                }`}
                            >
                              {lockingSlot === slot.value ? (
                                <span className="flex items-center justify-center">
                                  <svg className="animate-spin h-4 w-4 text-[#007AFF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </span>
                              ) : (
                                slot.label
                              )}
                              {isSelected && !lockingSlot && <div className="absolute inset-0 bg-white/10 animate-pulse"></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Evening Slots */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-500">
                          <span className="text-xs font-bold uppercase">Evening</span>
                        </div>
                        <div className="h-px bg-gray-100 flex-1"></div>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {timeSlots.evening.map(slot => {
                          const isBooked = bookedSlots.includes(slot.value);
                          const isPast = slot.isPast;
                          const isSelected = selectedTime === slot.value;
                          return (
                            <button
                              key={slot.value}
                              onClick={() => !isBooked && !isPast && handleSlotSelection(slot.value)}
                              disabled={isBooked || isPast || lockingSlot !== null}
                              className={`px-2 py-3 text-sm font-bold rounded-xl border transition-all duration-200 relative overflow-hidden group ${isBooked || isPast
                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-60'
                                : isSelected
                                  ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-lg shadow-blue-200 scale-105 ring-2 ring-blue-100'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
                                }`}
                            >
                              {lockingSlot === slot.value ? (
                                <span className="flex items-center justify-center">
                                  <svg className="animate-spin h-4 w-4 text-[#007AFF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </span>
                              ) : (
                                slot.label
                              )}
                              {isSelected && !lockingSlot && <div className="absolute inset-0 bg-white/10 animate-pulse"></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Date & Time Display */}
              {selectedDate && selectedTime && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-600 uppercase mb-1">Your Selection</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {getFormattedTime()}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between md:justify-end gap-4 pt-6 border-t border-gray-100">
                <button onClick={() => setStep(1)} className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                  Back
                </button>
                <button
                  className="bg-[#007AFF] hover:bg-[#0052FF] text-white font-bold px-10 py-3 rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-300 transform hover:-translate-y-0.5"
                  onClick={async () => {
                    // Validate lab selection
                    if (!selectedLab || !selectedLab.name) {
                      alert('Please select a lab location');
                      return;
                    }

                    // Validate date selection
                    if (!selectedDate) {
                      alert('Please select an appointment date');
                      return;
                    }

                    // Validate time selection
                    if (!selectedTime) {
                      alert('Please select a time slot');
                      return;
                    }

                    // Check if the selected time slot is still available
                    if (bookedSlots.includes(selectedTime)) {
                      alert('This time slot is no longer available. Please select a different time slot.');
                      return;
                    }

                    // Warn if not all tests are available at selected lab
                    if (selectedLab && !selectedLab.hasAllTests) {
                      const confirmProceed = confirm(
                        `Note: Only ${selectedLab.availableTestCount} out of ${selectedLab.totalTestsRequested} tests are available at this location.\n\n` +
                        `You may need to visit another lab for the remaining tests.\n\n` +
                        `Do you want to proceed with this lab?`
                      );
                      if (!confirmProceed) {
                        return;
                      }
                    }

                    setStep(3);
                  }}
                >
                  Review Booking
                </button>
              </div>
            </div>
          )
          }
          {
            step === 1 && (
              <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6 md:p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#007AFF]">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Patient Details</h2>
                    <p className="text-gray-500 text-sm">Who is this booking for?</p>
                  </div>
                </div>

                {/* Booking For Selection Cards */}
                <div className="mb-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`relative flex items-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${bookingFor === 'self'
                      ? 'border-[#007AFF] bg-blue-50/50 shadow-md ring-1 ring-blue-100'
                      : 'border-gray-100 hover:border-blue-200 hover:shadow-sm'
                      }`}>
                      <input
                        type="radio"
                        name="bookingFor"
                        value="self"
                        checked={bookingFor === 'self'}
                        onChange={e => setBookingFor(e.target.value)}
                        className="hidden"
                      />
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-colors ${bookingFor === 'self' ? 'bg-[#007AFF] text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <span className={`block text-lg font-bold ${bookingFor === 'self' ? 'text-[#007AFF]' : 'text-gray-700'}`}>Myself</span>
                        <span className="text-sm text-gray-400">Book for your own tests</span>
                      </div>
                      {bookingFor === 'self' && (
                        <div className="absolute top-4 right-4 text-[#007AFF]">
                          <CheckCircle className="w-6 h-6 fill-current" />
                        </div>
                      )}
                    </label>

                    <label className={`relative flex items-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${bookingFor === 'family'
                      ? 'border-[#007AFF] bg-blue-50/50 shadow-md ring-1 ring-blue-100'
                      : 'border-gray-100 hover:border-blue-200 hover:shadow-sm'
                      }`}>
                      <input
                        type="radio"
                        name="bookingFor"
                        value="family"
                        checked={bookingFor === 'family'}
                        onChange={e => setBookingFor(e.target.value)}
                        className="hidden"
                      />
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-colors ${bookingFor === 'family' ? 'bg-[#007AFF] text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <div className="flex -space-x-1">
                          <User className="w-4 h-4" />
                          <User className="w-4 h-4 opacity-70" />
                        </div>
                      </div>
                      <div>
                        <span className={`block text-lg font-bold ${bookingFor === 'family' ? 'text-[#007AFF]' : 'text-gray-700'}`}>Family Member</span>
                        <span className="text-sm text-gray-400">Book for someone else</span>
                      </div>
                      {bookingFor === 'family' && (
                        <div className="absolute top-4 right-4 text-[#007AFF]">
                          <CheckCircle className="w-6 h-6 fill-current" />
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Family Member Specific Fields */}
                {bookingFor === 'family' && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 mb-8">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6">Patient Information</h3>

                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Patient Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="patientName"
                          value={patientDetails.patientName}
                          onChange={handlePatientDetailChange}
                          placeholder="Enter patient's full name"
                          className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#007AFF] bg-white transition-all font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Age <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="age"
                            value={patientDetails.age}
                            onChange={handlePatientDetailChange}
                            placeholder="Ex: 28"
                            min="0"
                            max="120"
                            className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#007AFF] bg-white transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Relation <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              name="relation"
                              value={patientDetails.relation}
                              onChange={handlePatientDetailChange}
                              className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#007AFF] bg-white transition-all font-medium appearance-none"
                            >
                              <option value="">Select relation</option>
                              <option value="spouse">Spouse</option>
                              <option value="father">Father</option>
                              <option value="mother">Mother</option>
                              <option value="son">Son</option>
                              <option value="daughter">Daughter</option>
                              <option value="brother">Brother</option>
                              <option value="sister">Sister</option>
                              <option value="grandfather">Grandfather</option>
                              <option value="grandmother">Grandmother</option>
                              <option value="other">Other</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Fields */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Contact Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contactNumber"
                        value={patientDetails.contactNumber}
                        onChange={handlePatientDetailChange}
                        placeholder="Enter 10-digit number"
                        pattern="[0-9]{10}"
                        maxLength="10"
                        className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#007AFF] bg-white transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={patientDetails.email}
                        onChange={handlePatientDetailChange}
                        placeholder="Enter email address"
                        className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#007AFF] bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      name="specialInstructions"
                      value={patientDetails.specialInstructions}
                      onChange={handlePatientDetailChange}
                      placeholder="Any special notes for the lab technician..."
                      rows="3"
                      className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#007AFF] bg-white transition-all font-medium resize-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between md:justify-end gap-4 pt-10 border-t border-gray-100 mt-10">
                  <button onClick={() => setStep(0)} className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                    Back
                  </button>
                  <button
                    className="bg-[#007AFF] hover:bg-[#0052FF] text-white font-bold px-10 py-3 rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-300 transform hover:-translate-y-0.5"
                    onClick={() => {
                      // Validate required fields
                      if (!patientDetails.contactNumber || !patientDetails.email) {
                        alert('Please fill in all required contact information (Contact Number and Email)');
                        return;
                      }

                      // Validate contact number format (10 digits)
                      if (patientDetails.contactNumber.length !== 10 || !/^[0-9]{10}$/.test(patientDetails.contactNumber)) {
                        alert('Please enter a valid 10-digit contact number');
                        return;
                      }

                      // Validate email format
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(patientDetails.email)) {
                        alert('Please enter a valid email address');
                        return;
                      }

                      // Additional validation for family bookings
                      if (bookingFor === 'family') {
                        if (!patientDetails.patientName || !patientDetails.age || !patientDetails.relation) {
                          alert('Please fill in all required patient information (Name, Age, and Relation)');
                          return;
                        }

                        if (parseInt(patientDetails.age) < 0 || parseInt(patientDetails.age) > 120) {
                          alert('Please enter a valid age (0-120)');
                          return;
                        }
                      }

                      setStep(2);
                    }}
                  >
                    Continue to Schedule
                  </button>
                </div>
              </div>
            )
          }


          {/* Step 3: Final Review & Confirm */}
          {
            step === 3 && !bookingConfirmed && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6 md:p-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#007AFF]">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Final Review</h2>
                      <p className="text-gray-500 text-sm">Review your booking details before confirming</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Left Column: Test & Lab */}
                    <div className="space-y-6">
                      {/* Test Details */}
                      <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-[#007AFF]" /> Selected
                        </h3>
                        <div className="space-y-4">
                          {cart.map((test, index) => {
                            let displayPrice = test.price;
                            if (selectedLab && test.actualPrice && typeof test.actualPrice === 'object' && test.actualPrice !== null) {
                              const selectedLabName = selectedLab.name;
                              const labKeys = Object.keys(test.actualPrice);
                              const normalizedSelectedLab = selectedLabName.toLowerCase().trim();
                              let found = false;
                              if (test.actualPrice[selectedLabName]) {
                                displayPrice = test.actualPrice[selectedLabName];
                                found = true;
                              }
                              if (!found) {
                                for (const labKey of labKeys) {
                                  if (labKey.toLowerCase().trim() === normalizedSelectedLab) {
                                    displayPrice = test.actualPrice[labKey];
                                    found = true;
                                    break;
                                  }
                                }
                              }
                            }
                            return (
                              <div key={index} className="flex justify-between items-start pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                                <div>
                                  <p className="font-bold text-gray-900 text-sm flex items-center">
                                    {test.testName}
                                    {test.isPackage && (
                                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 uppercase tracking-wide">
                                        Package
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{test.category}</p>
                                  {test.isPackage && test.includedTests && test.includedTests.length > 0 && (
                                    <div className="mt-2 pl-3 border-l-2 border-blue-100">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Includes:</p>
                                      <ul className="text-xs text-gray-600 space-y-0.5">
                                        {test.includedTests.map((t, i) => (
                                          <li key={i}>• {t}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                <p className="font-bold text-[#007AFF]">₹{displayPrice}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Lab Details */}
                      <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#007AFF]" /> Selected Lab
                        </h3>
                        <div>
                          <p className="font-bold text-gray-900">{selectedLab?.name}</p>
                          <p className="text-sm text-gray-500 mt-1">{selectedLab?.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Date & Patient */}
                    <div className="space-y-6">
                      {/* Date & Time */}
                      <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#007AFF]" /> Appointment Time
                        </h3>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">Date</p>
                              <p className="font-medium text-gray-900">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">Time</p>
                              <p className="font-medium text-gray-900">{getFormattedTime()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Patient Details */}
                      <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                          <User className="w-4 h-4 text-[#007AFF]" /> Patient Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Booking For</span>
                            <span className="text-sm font-bold text-gray-900">{bookingFor === 'self' ? 'Myself' : 'Family Member'}</span>
                          </div>
                          {bookingFor === 'family' && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Name</span>
                                <span className="text-sm font-bold text-gray-900">{patientDetails.patientName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Relation</span>
                                <span className="text-sm font-bold text-gray-900 capitalize">{patientDetails.relation}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Contact</span>
                            <span className="text-sm font-bold text-gray-900">{patientDetails.contactNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Email</span>
                            <span className="text-sm font-bold text-gray-900">{patientDetails.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between md:justify-end gap-4 pt-10 border-t border-gray-100">
                    <button onClick={() => setStep(2)} className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                      Back
                    </button>
                    <button
                      className={`font-bold px-12 py-3 rounded-xl shadow-lg transition-all duration-300 transform ${confirmingBooking
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-[#007AFF] hover:bg-[#0052FF] text-white shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5'
                        }`}
                      onClick={handleConfirmBooking}
                      disabled={confirmingBooking}
                    >
                      {confirmingBooking ? 'Processing...' : 'Confirm & Book'}
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          {/* Loading Overlay - Confirming Booking */}
          {
            confirmingBooking && step !== 4 && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-4 text-center">
                  {/* Animated Spinner */}
                  <div className="mb-6 relative inline-block">
                    <div className="w-20 h-20 border-4 border-blue-100 border-t-[#007AFF] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-[#00C6FF] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                  </div>

                  {/* Loading Text */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirming Booking...</h3>
                  <p className="text-gray-500">Please wait while we process your booking</p>

                  {/* Animated Dots */}
                  <div className="flex justify-center gap-2 mt-6">
                    <div className="w-2 h-2 bg-[#007AFF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[#007AFF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[#007AFF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )
          }

          {/* Step 4: Booking Success */}
          {
            (() => {
              console.log('🔍 Success page check - step:', step, 'bookingConfirmed:', bookingConfirmed);
              return step === 4 && bookingConfirmed;
            })() && (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-3xl shadow-2xl shadow-blue-100 overflow-hidden mb-8 border border-gray-100 relative">
                  {/* Decorative Background Elements */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#007AFF] to-[#00C6FF]"></div>
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
                  <div className="absolute top-1/2 -left-24 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-50"></div>

                  <div className="px-8 py-12 md:p-12 text-center relative z-10">
                    {/* Animated Success Icon */}
                    <div className="mb-8 relative inline-block">
                      <div className="w-24 h-24 bg-gradient-to-tr from-[#2ecc71] to-[#27ae60] rounded-full flex items-center justify-center shadow-lg shadow-green-200 mx-auto animate-bounce-slow">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                            className="animate-draw-check"
                            style={{
                              strokeDasharray: 24,
                              strokeDashoffset: 24,
                              animation: 'drawCheck 0.6s ease-out 0.3s forwards'
                            }}
                          />
                        </svg>
                      </div>
                      <div className="absolute -inset-4 bg-green-100 rounded-full -z-10 animate-pulse opacity-50"></div>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Booking Confirmed!</h2>
                    <p className="text-gray-500 text-lg max-w-md mx-auto mb-10">
                      Thank you for choosing RightsDiagnostics. Your appointment has been successfully scheduled.
                    </p>

                    {/* Show loading state while bookingId and couponCode are being set */}
                    {(!bookingId || !couponCode) ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#007AFF] mb-4"></div>
                        <p className="text-gray-500 font-medium">Finalizing your booking details...</p>
                      </div>
                    ) : (
                      <div className="space-y-8 animate-fade-in-up">
                        {/* Coupon Code Card */}
                        <div className="bg-gradient-to-br from-[#007AFF] to-[#0052FF] rounded-2xl p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                          {/* Glass Effect Overlay */}
                          <div className="absolute inset-0 bg-white opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
                          {/* Circle Decorations */}
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>

                          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                              <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-1">Exclusive Coupon</p>
                              <h3 className="text-3xl font-bold tracking-tight text-white mb-2">{couponCode}</h3>
                              <p className="text-blue-100 text-sm opacity-90">Present this code at the lab for direct discounts.</p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(couponCode);
                                alert('Coupon code copied to clipboard!');
                              }}
                              className="px-6 py-3 bg-white text-[#007AFF] rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2 group/btn"
                            >
                              <Copy className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                              Copy Code
                            </button>
                          </div>
                        </div>

                        {/* Booking Details Grid - Digital Ticket Style */}
                        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-gray-200 border border-gray-100 relative">
                          {/* Ticket Header (Blue Strip) */}
                          <div className="bg-[#007AFF] px-8 py-6 flex items-center justify-between relative overflow-hidden">
                            <div className="relative z-10 text-white">
                              <h3 className="text-xl font-bold tracking-tight mb-1">Booking Confirmation</h3>
                              <p className="text-blue-100 text-sm font-medium opacity-90">Thank you for choosing RightsLab</p>
                            </div>
                            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm relative z-10">
                              <div className="text-center">
                                <span className="block text-[10px] text-blue-100 font-bold uppercase tracking-wider mb-1">Booking ID</span>
                                <span className="block text-sm font-mono font-bold text-white tracking-widest">{bookingId}</span>
                              </div>
                            </div>
                            {/* Decorative Circles */}
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                            <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-white opacity-10 rounded-full blur-xl"></div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12">
                            {/* Left Side: Ticket Body */}
                            <div className="lg:col-span-12 xl:col-span-4 p-8 bg-gray-50 border-r border-gray-200 dashed-border relative">
                              {/* Perforated Line Visual (CSS handled via broader styling or simplistic border) */}
                              <div className="space-y-8">
                                {/* Date & Time Block */}
                                <div className="flex gap-4">
                                  <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Date</p>
                                    <p className="text-lg font-bold text-gray-900 leading-none">
                                      {bookedDate && new Date(bookedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{bookedDate && new Date(bookedDate).getFullYear()}</p>
                                  </div>
                                  <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Time</p>
                                    <p className="text-lg font-bold text-gray-900 leading-none">
                                      {bookedTime || '--:--'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Scheduled</p>
                                  </div>
                                </div>

                                {/* Details List */}
                                <div className="space-y-6">
                                  <div className="relative pl-4 border-l-2 border-gray-200">
                                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-gray-300"></div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Lab Location</p>
                                    <p className="font-bold text-gray-900">{bookedLab?.name}</p>
                                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{bookedLab?.address}</p>
                                  </div>

                                  <div className="relative pl-4 border-l-2 border-gray-200">
                                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-gray-300"></div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Patient</p>
                                    <p className="font-bold text-gray-900">{bookingFor === 'self' ? 'Myself' : patientDetails.patientName}</p>
                                    <p className="text-sm text-gray-500 mt-0.5">{patientDetails.contactNumber}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Side: Receipt Summary */}
                            <div className="lg:col-span-12 xl:col-span-8 p-8 bg-white relative">
                              {/* Jagged Edge Top for Mobile / Left for Desktop (Simulated with simple border for now) */}
                              <div className="absolute lg:left-0 lg:top-8 lg:bottom-8 w-[1px] border-l-2 border-dashed border-gray-200 hidden lg:block"></div>

                              <div className="mb-6 pb-6 border-b border-gray-100">
                                <h4 className="text-lg font-bold text-gray-900 mb-4">Summary</h4>
                                <div className="space-y-4">
                                  {bookedTests.map((test, index) => {
                                    // Determine display price logic
                                    let displayPrice = test.price;
                                    if (selectedLab && test.actualPrice && typeof test.actualPrice === 'object' && test.actualPrice !== null) {
                                      const selectedLabName = selectedLab.name;
                                      if (test.actualPrice[selectedLabName]) {
                                        displayPrice = test.actualPrice[selectedLabName];
                                      } else {
                                        const normalizedSelectedLab = selectedLabName.toLowerCase().trim();
                                        for (const labKey of Object.keys(test.actualPrice)) {
                                          if (labKey.toLowerCase().trim() === normalizedSelectedLab) {
                                            displayPrice = test.actualPrice[labKey];
                                            break;
                                          }
                                        }
                                      }
                                    }

                                    return (
                                      <div key={index} className="flex justify-between items-start group">
                                        <div className="flex-1 pr-4">
                                          <p className="text-sm font-bold text-gray-900 group-hover:text-[#007AFF] transition-colors">{test.testName}</p>
                                          <p className="text-xs text-gray-500 mt-0.5">{test.category}</p>
                                        </div>
                                        <span className="text-xl font-black text-[#007AFF]">₹{bookedTests.reduce((total, test) => total + (parseFloat(test.price) || 0), 0).toFixed(2)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Footer Status */}
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Status</p>
                                    <p className="text-sm font-bold text-green-600">Confirmed</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Confirmed On</p>
                                  <p className="text-sm font-bold text-gray-900">
                                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>


                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button
                            onClick={() => router.push('/Patients/Dashboard/upcoming')}
                            className="w-full bg-[#007AFF] hover:bg-[#0052FF] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                          >
                            View My Bookings
                            <ArrowRight className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => router.push('/Patients/FindTests')}
                            className="w-full bg-white border-2 border-gray-100 text-gray-700 font-bold py-4 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-2"
                          >
                            Book Another Test
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CSS Animation Styles (Inline for simplicity) */}
                <style jsx>{`
                  @keyframes drawCheck {
                    to { stroke-dashoffset: 0; }
                  }
                  .animate-draw-check {
                    animation: drawCheck 0.6s ease-out 0.3s forwards;
                  }
                  @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  .animate-fade-in-up {
                    animation: fadeInUp 0.6s ease-out forwards;
                  }
                  @keyframes bounceSlow {
                     0%, 100% { transform: translateY(-3%); }
                     50% { transform: translateY(3%); }
                  }
                  .animate-bounce-slow {
                    animation: bounceSlow 3s ease-in-out infinite;
                  }
                `}</style>
              </div>
            )
          }
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default CartPage;
