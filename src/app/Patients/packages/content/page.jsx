'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Check, 
  CheckCircle, 
  Copy, 
  Calendar, 
  Clock,
  X
} from 'lucide-react';
import Navbar from '../../page';
import Footer from '../../footer/page';
import { withAuth, isAuthenticated, showAuthModal } from '../../../utils/authGuard';
import AdvertisementBanner from '../../../components/AdvertisementBanner';

function PackageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [packageName, setPackageName] = useState('');
  const [packageId, setPackageId] = useState('');
  const [packageData, setPackageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  
  // Booking workflow states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingFor, setBookingFor] = useState('self');
  const [patientDetails, setPatientDetails] = useState({
    contactNumber: '',
    email: '',
    specialInstructions: '',
    // Family member specific fields
    patientName: '',
    age: '',
    relation: ''
  });
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  
  // Function to handle smooth scrolling
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const yOffset = -80; // Adjust based on header height
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Track sections in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => observer.observe(section));

    return () => sections.forEach(section => observer.unobserve(section));
  }, []);
  
  // Function to generate FAQs based on package data
  const generateFaqs = (packageData) => {
    if (!packageData) return [];

    const packageNameLocal = packageData.packageName || 'This package';

    const generatedFaqs = [
      {
        question: `What is the ${packageNameLocal} Package?`,
        answer: packageData.overview || `The ${packageNameLocal} package is a comprehensive health checkup that includes multiple tests. Please consult with healthcare providers for specific details.`
      },
      {
        question: `What preparations are required for the ${packageNameLocal} Package?`,
        answer: packageData.testPreparation && packageData.testPreparation.length > 0
          ? packageData.testPreparation.map(prep => prep.point || prep).join('\n')
          : 'No specific preparations are required for this package. However, please follow any instructions given by your healthcare provider.'
      },
      {
        question: `Why is the ${packageNameLocal} Package important?`,
        answer: packageData.importance && packageData.importance.length > 0
          ? packageData.importance.map(imp => imp.point || imp).join('\n')
          : 'This package is important for comprehensive health assessment. Your healthcare provider will explain its specific importance for your case.'
      },
      {
        question: `What tests are included in the ${packageNameLocal} Package?`,
        answer: packageData.includedTests && packageData.includedTests.length > 0
          ? `This package includes ${packageData.includedTests.length} tests: ${packageData.includedTests.map(test => test.testName).join(', ')}.`
          : 'This package includes multiple health tests for comprehensive assessment.'
      },
      {
        question: `How long does the ${packageNameLocal} Package take?`,
        answer: 'The package tests may take 1-3 hours to complete depending on the specific tests included. Contact your chosen laboratory for exact timings.'
      },
      {
        question: 'When will I receive my package results?',
        answer: 'Package results are typically available within 24-72 hours, but timing may vary depending on the laboratory and specific tests included.'
      },
      {
        question: 'Do I need to fast before the package tests?',
        answer: packageData.testPreparation?.some(prep => (prep.point || prep).toLowerCase().includes('fast'))
          ? 'Yes, fasting is required as per the package preparation guidelines.'
          : 'Specific fasting requirements, if any, will be communicated by your healthcare provider or the laboratory.'
      }
    ];

    return generatedFaqs;
  };

  useEffect(() => {
    const name = searchParams.get('packageName');
    const id = searchParams.get('packageId');
    if (name) setPackageName(name);
    if (id) setPackageId(id);
    
    // Fetch package data
    fetchPackageData(id, name);
  }, [searchParams]);

  // Generate FAQs when package data changes
  useEffect(() => {
    if (packageData) {
      const generatedFaqs = generateFaqs(packageData);
      setFaqs(generatedFaqs);
    }
  }, [packageData]);

  const fetchPackageData = async (id, name) => {
    try {
      setIsLoading(true);
      
      const packageQuery = id 
        ? `/api/packages?packageId=${encodeURIComponent(id)}`
        : name 
        ? `/api/packages?packageName=${encodeURIComponent(name)}`
        : '/api/packages';
      
      const response = await fetch(packageQuery);
      const data = await response.json();
      
      if (data.success) {
        const packageDetails = data.data && !Array.isArray(data.data) 
          ? data.data 
          : Array.isArray(data.data) 
          ? data.data.find(pkg => pkg.packageName === name || pkg._id === id)
          : null;
        
        if (packageDetails) {
          setPackageData({
            ...packageDetails,
            overview: packageDetails.overview || 'No overview available for this package.',
            testPreparation: packageDetails.testPreparation || [],
            importance: packageDetails.importance || [],
            youtubeLinks: packageDetails.youtubeLinks || [],
            includedTests: packageDetails.includedTests || []
          });
        } else {
          console.error('Package not found');
        }
      } else {
        console.error('API Error:', data.error);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching package data:', error);
      setIsLoading(false);
    }
  };

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const handleBookPackage = () => {
    // Check if user is authenticated
    console.log('Book package button clicked');
    const authenticated = isAuthenticated();
    console.log('User authenticated:', authenticated);
    
    if (!authenticated) {
      console.log('Showing auth modal');
      showAuthModal('Please log in or sign up to book this package');
      return;
    }
    
    // Add package to cart
    if (typeof window !== 'undefined') {
      // Get user ID for cart key (same logic as in cart page)
      const getUserID = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.id || user.email || user.phone || 'guest';
      };
      
      const cartKey = `cart_${getUserID()}`;
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      
      // Check if package is already in cart
      const existingItemIndex = cart.findIndex(item => item.id === packageId);
      
      if (existingItemIndex !== -1) {
        // If package is already in cart, show message
        console.log('Package already in cart');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000); // Hide after 3 seconds
      } else {
        // Add new package to cart
        let categoryValue = packageData?.category || [];
        if (Array.isArray(categoryValue)) {
          categoryValue = categoryValue.join(', ');
        }
        
        const cartItem = {
          id: packageId,
          testName: packageName,
          price: packageData?.price || 0,
          category: categoryValue,
          isPackage: true,
          quantity: 1
        };
        
        cart.push(cartItem);
        localStorage.setItem(cartKey, JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
        console.log('Package added to cart:', cartItem);
        
        // Show success message on page
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
      }
    }
  };

  // Load user data on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userEmail = localStorage.getItem('userEmail') || user.email || '';
      const userPhone = user.phone || user.contactNumber || '';
      const userName = user.name || user.username || '';
      setPatientDetails(prev => ({
        ...prev,
        contactNumber: userPhone,
        email: userEmail,
        patientName: userName
      }));
    }
  }, []);

  // Generate unique booking ID
  const generateBookingId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RL-${timestamp}${random}`.slice(0, 15);
  };

  // Generate unique coupon code
  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let coupon = '';
    for (let i = 0; i < 5; i++) {
      coupon += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return coupon;
  };

  // Generate time slots from 8:00 AM to 8:00 PM with 30 min intervals
  const generateTimeSlots = () => {
    const slots = {
      morning: [],
      afternoon: [],
      evening: []
    };
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (let hour = 8; hour <= 20; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === 20 && min > 0) break;
        
        const time24 = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const time12 = `${hour12}:${String(min).padStart(2, '0')} ${ampm}`;
        
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
  };

  const timeSlots = generateTimeSlots();

  // Format selected time for display
  const getFormattedTime = () => {
    const allSlots = [...timeSlots.morning, ...timeSlots.afternoon, ...timeSlots.evening];
    const slot = allSlots.find(s => s.value === selectedTime);
    return slot ? slot.label : selectedTime;
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handlePatientDetailChange = (e) => {
    const { name, value } = e.target;
    setPatientDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedDate || !selectedTime) {
        alert('Please select both date and time');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!patientDetails.contactNumber || !patientDetails.email) {
        alert('Please fill in all required fields');
        return;
      }
      if (bookingFor === 'family' && (!patientDetails.patientName || !patientDetails.age || !patientDetails.relation)) {
        alert('Please fill in all family member details');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleConfirmBooking = async () => {
    const newBookingId = generateBookingId();
    const newCouponCode = generateCouponCode();
    
    setBookingId(newBookingId);
    setCouponCode(newCouponCode);
    
    const bookingData = {
      bookingId: newBookingId,
      couponCode: newCouponCode,
      testName: packageData?.packageName || packageName,
      organ: Array.isArray(packageData?.category) ? packageData.category.join(', ') : (packageData?.category || 'General'),
      price: packageData?.price || 0,
      labName: 'Multiple Labs',
      labAddress: 'Various locations',
      labRating: '4.5',
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
      isPackage: true
    };
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBookingConfirmed(true);
        
        const localBooking = {
          id: newBookingId,
          bookingId: newBookingId,
          couponCode: newCouponCode,
          packageName: packageData?.packageName || packageName,
          testsCount: packageData?.includedTests?.length || 0,
          labName: 'Multiple Labs',
          address: 'Various locations',
          date: selectedDate,
          time: selectedTime,
          formattedTime: getFormattedTime(),
          price: packageData?.price || 0,
          status: 'Confirmed',
          bookingFor: bookingFor,
          patientDetails: patientDetails,
          createdAt: new Date().toISOString(),
          isPackage: true
        };
        
        const existingBookings = JSON.parse(localStorage.getItem('upcomingBookings') || '[]');
        existingBookings.unshift(localBooking);
        localStorage.setItem('upcomingBookings', JSON.stringify(existingBookings));
      } else {
        console.error('Failed to save package booking to database:', result.error);
        alert('Failed to confirm your booking. Please try again.');
      }
    } catch (error) {
      console.error('Error saving package booking:', error);
      alert('There was an error confirming your booking. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setBookingConfirmed(false);
    setCurrentStep(1);
    setSelectedDate('');
    setSelectedTime('');
    setBookingFor('self');
    setPatientDetails({
      contactNumber: '',
      email: '',
      specialInstructions: '',
      patientName: '',
      age: '',
      relation: ''
    });
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0 py-6">
          <style jsx>{`
            .content-container {
              max-width: 100%;
              margin: 0 auto;
              padding: 0.5rem;
              position: relative;
              box-sizing: border-box;
            }
            .faq-item {
              border-bottom: 1px solid #e5e7eb;
              padding: 1rem 0;
              transition: all 0.3s ease;
            }
            .faq-item:last-child {
              border-bottom: none;
            }
            .faq-question {
              padding: 0.75rem 1rem;
              font-weight: 600;
              color: #374151;
              cursor: pointer;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-radius: 8px;
              transition: all 0.2s ease;
            }
            .faq-toggle {
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #fff1ec;
              border-radius: 50%;
              color: #ff6b35;
              font-size: 1.25rem;
              font-weight: bold;
              transition: all 0.3s ease;
              margin-left: 1rem;
              flex-shrink: 0;
            }
            .faq-question:hover {
              color: #ff6b35;
              background: #fff8f6;
            }
            .faq-question:hover .faq-toggle {
              background: #ff6b35;
              color: white;
              transform: rotate(90deg);
            }
            .faq-answer {
              max-height: 0;
              overflow: hidden;
              color: #6b7280;
              font-size: 0.9375rem;
              line-height: 1.6;
              background: #f9fafb;
              border-radius: 8px;
              transition: all 0.3s ease;
              opacity: 0;
            }
            .faq-answer.open {
              max-height: 500px;
              padding: 1.25rem;
              margin-top: 0.75rem;
              opacity: 1;
            }
            .faq-answer p {
              margin: 0 0 0.75rem 0;
            }
            .faq-answer p:last-child {
              margin-bottom: 0;
            }
            .content-grid {
              display: grid;
              grid-template-columns: 280px 1fr 300px;
              gap: 0.75rem;
              position: relative;
            }
            .sidebar-card, .tips-card {
              background: white;
              border-radius: 12px;
              padding: 1.25rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              height: fit-content;
              position: sticky;
              top: 1rem;
              z-index: 10;
              transition: all 0.3s ease;
              box-sizing: border-box;
            }
            .sidebar-card.stick {
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }
            .sidebar-card h3, .tips-card h4 {
              font-size: 1.25rem;
              font-weight: 700;
              color: #1f2937;
              margin: 0 0 1.25rem 0;
              padding-bottom: 0.75rem;
              border-bottom: 2px solid #f3f4f6;
            }
            .nav-list {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .nav-list li {
              padding: 0.875rem 1.25rem;
              margin-bottom: 0.5rem;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              font-size: 0.9375rem;
              color: #4b5563;
              font-weight: 500;
            }
            .nav-list li.active {
              background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
              color: white;
              box-shadow: 0 4px 6px rgba(255, 107, 53, 0.25);
            }
            .nav-list li:hover:not(.active) {
              background: #fef3f2;
              color: #ff6b35;
            }
            .membership-banner {
              margin: 1.5rem 0;
              padding: 0;
              border-radius: 12px;
              overflow: hidden;
              width: 100%;
              box-sizing: border-box;
            }
            .membership-banner-img {
              display: block;
              width: 100%;
              height: 160px;
              object-fit: cover;
            }
            @media (max-width: 768px) {
              .membership-banner-img {
                height: 120px;
              }
            }
            .faq-section {
              margin-top: 1.5rem;
            }
            .faq-section h4 {
              font-size: 1.125rem;
              font-weight: 700;
              color: #1f2937;
              margin: 0 0 1rem 0;
            }
            .faq-list {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .faq-list li {
              padding: 0.875rem 0;
              color: #6b7280;
              font-size: 0.9375rem;
              line-height: 1.5;
              border-bottom: 1px solid #f3f4f6;
              cursor: pointer;
              transition: color 0.2s;
            }
            .faq-list li:hover {
              color: #ff6b35;
            }
            .faq-list li:last-child {
              border-bottom: none;
            }
            .main-content {
              background: white;
              border-radius: 12px;
              padding: 1.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .page-title {
              font-size: 2rem;
              font-weight: 800;
              color: #111827;
              margin: 0 0 1.5rem 0;
              line-height: 1.2;
            }
            .page-title .highlight {
              color: #ff6b35;
            }
            .info-card {
              margin-bottom: 2rem;
              padding: 1.5rem;
              border-radius: 12px;
              background: #f9fafb;
              border-left: 4px solid #ff6b35;
            }
            .info-card h3 {
              font-size: 1.5rem;
              font-weight: 700;
              color: #1f2937;
              margin: 0 0 1.25rem 0;
              display: flex;
              align-items: center;
              gap: 0.75rem;
            }
            .info-card h3::before {
              content: '';
              display: inline-block;
              width: 28px;
              height: 28px;
              background-size: contain;
              background-repeat: no-repeat;
              opacity: 0.9;
            }
            #overview h3::before {
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff6b35'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/%3E%3C/svg%3E");
            }
            #preparation h3::before {
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff6b35'%3E%3Cpath d='M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z'/%3E%3C/svg%3E");
            }
            #importance h3::before {
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff6b35'%3E%3Cpath d='M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'/%3E%3C/svg%3E");
            }
            .info-card p {
              color: #4b5563;
              line-height: 1.7;
              margin: 0;
              font-size: 1rem;
              max-width: 65ch;
            }
            .info-card ul {
              margin: 1.25rem 0 0;
              padding-left: 1.75rem;
              color: #4b5563;
              list-style-type: none;
            }
            .info-card ul li {
              line-height: 1.7;
              margin-bottom: 1rem;
              font-size: 1rem;
              position: relative;
              padding-left: 1.75rem;
            }
            .info-card ul li::before {
              content: '•';
              position: absolute;
              left: 0;
              color: #ff6b35;
              font-weight: bold;
              font-size: 1.25rem;
            }
            .info-card ul li:last-child {
              margin-bottom: 0;
            }
            .tests-section {
              margin-top: 2rem;
            }
            .tests-section h3 {
              font-size: 1.75rem;
              font-weight: 700;
              color: #111827;
              margin: 0 0 1.25rem 0;
            }
            .tests-note {
              color: #dc2626;
              font-size: 0.875rem;
              margin-bottom: 1.5rem;
              padding: 1rem 1.25rem;
              background: #fef2f2;
              border-radius: 8px;
              border-left: 4px solid #dc2626;
            }
            .test-card {
              background: white;
              border: 1px solid #e5e7eb;
              padding: 1.5rem;
              margin-bottom: 1rem;
              border-radius: 12px;
              display: flex;
              align-items: center;
              gap: 1.25rem;
              transition: all 0.3s ease;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            .test-card:hover {
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              border-color: #ff6b35;
              transform: translateY(-2px);
            }
            .test-icon {
              width: 56px;
              height: 56px;
              background: #fff7f5;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.5rem;
              color: #ff6b35;
              font-weight: 700;
            }
            .test-info {
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            .test-info strong {
              font-size: 1.125rem;
              font-weight: 600;
              color: #111827;
            }
            .test-category {
              display: block;
              color: #6b7280;
              font-size: 0.875rem;
              margin-top: 0.25rem;
            }
            .test-category span {
              font-weight: 500;
              color: #4b5563;
            }
            .test-description {
              color: #6b7280;
              font-size: 0.875rem;
              margin-top: 0.5rem;
              line-height: 1.5;
            }
            .test-price {
              font-size: 1.375rem;
              font-weight: 700;
              color: #ff6b35;
            }
            .book-btn {
              background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
              color: white;
              border: none;
              padding: 1.125rem 2.25rem;
              border-radius: 12px;
              font-weight: 700;
              font-size: 1.125rem;
              cursor: pointer;
              transition: all 0.3s;
              box-shadow: 0 4px 6px rgba(255, 107, 53, 0.3);
              white-space: nowrap;
              display: inline-flex;
              align-items: center;
              gap: 0.625rem;
            }
            .book-btn:hover {
              transform: translateY(-3px);
              box-shadow: 0 6px 12px rgba(255, 107, 53, 0.4);
            }
            .book-btn:active {
              transform: translateY(-1px);
            }
            .view-more-btn {
              background: white;
              color: #ff6b35;
              border: 2px solid #ff6b35;
              padding: 0.875rem 2rem;
              border-radius: 8px;
              font-weight: 700;
              font-size: 0.9375rem;
              margin: 1.5rem auto 0;
              display: block;
              cursor: pointer;
              transition: all 0.2s;
            }
            .view-more-btn:hover {
              background: #ff6b35;
              color: white;
            }
            .tips-section {
              margin-bottom: 2rem;
            }
            .tips-section h4 {
              font-size: 1.125rem;
              font-weight: 700;
              color: #1f2937;
              margin: 0 0 1rem 0;
            }
            .support-section {
              border-top: 2px solid #f3f4f6;
              padding-top: 1.5rem;
              margin-top: 2rem;
            }
            .support-section h4 {
              font-size: 1.125rem;
              font-weight: 700;
              color: #1f2937;
              margin: 0 0 0.75rem 0;
            }
            .support-section p {
              color: #6b7280;
              font-size: 0.9375rem;
              margin: 0 0 1rem 0;
              line-height: 1.5;
            }
            .support-btn {
              background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
              color: white;
              border: none;
              padding: 0.875rem 1.5rem;
              border-radius: 8px;
              font-weight: 700;
              font-size: 0.9375rem;
              cursor: pointer;
              width: 100%;
              transition: all 0.3s;
              box-shadow: 0 4px 6px rgba(255, 107, 53, 0.3);
            }
            .support-btn:hover {
              transform: translateY(-3px);
              box-shadow: 0 6px 12px rgba(255, 107, 53, 0.4);
            }
            .support-btn:active {
              transform: translateY(-1px);
            }
            .youtube-videos-container {
              margin-top: 1.5rem;
              padding-top: 1.5rem;
              border-top: 2px solid #f3f4f6;
            }
            .youtube-video-item {
              position: relative;
              width: 100%;
              height: 160px;
              background: #f3f4f6;
              border-radius: 12px;
              overflow: hidden;
              cursor: pointer;
              display: block;
              text-decoration: none;
              margin-bottom: 16px;
              box-sizing: border-box;
              flex-shrink: 0;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              transition: all 0.3s ease;
            }
            .youtube-video-item:last-child {
              margin-bottom: 0;
            }
            .youtube-video-item:hover {
              transform: translateY(-3px);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
              border-color: #ff6b35;
            }
            .youtube-thumbnail {
              width: 100%;
              height: 100%;
              object-fit: cover;
              background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            }
            .youtube-play-overlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(0, 0, 0, 0.3);
              transition: all 0.3s ease;
            }
            .youtube-video-item:hover .youtube-play-overlay {
              background: rgba(0, 0, 0, 0.5);
            }
            .youtube-play-button {
              width: 64px;
              height: 64px;
              background: rgba(255, 107, 53, 0.95);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
            }
            .youtube-video-item:hover .youtube-play-button {
              background: rgba(255, 107, 53, 1);
              transform: scale(1.15);
              box-shadow: 0 6px 16px rgba(255, 107, 53, 0.6);
            }
            .youtube-play-button::after {
              content: '';
              width: 0;
              height: 0;
              border-left: 16px solid white;
              border-top: 10px solid transparent;
              border-bottom: 10px solid transparent;
              margin-left: 4px;
            }
            .youtube-video-title {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.3));
              color: white;
              padding: 0.875rem;
              font-size: 0.875rem;
              font-weight: 600;
              line-height: 1.4;
              max-height: 52px;
              overflow: hidden;
            }
            .youtube-no-videos {
              background: linear-gradient(135deg, #fef3f2, #fff7ed);
              border: 1px solid #fed7d7;
              border-radius: 12px;
              padding: 1.75rem;
              text-align: center;
              color: #9ca3af;
            }
            .youtube-no-videos svg {
              width: 48px;
              height: 48px;
              margin: 0 auto 1rem;
              opacity: 0.6;
            }
            .youtube-no-videos p {
              margin: 0;
              font-size: 0.9375rem;
              color: #9ca3af;
            }
            .youtube-videos-scroll {
              max-height: calc(3 * (160px + 16px));
              overflow-y: auto;
              overflow-x: hidden;
              padding-right: 8px;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 12px;
              box-sizing: border-box;
              width: 100%;
            }
            .youtube-videos-scroll::-webkit-scrollbar {
              width: 8px;
            }
            .youtube-videos-scroll::-webkit-scrollbar-track {
              background: #f3f4f6;
              border-radius: 12px;
            }
            .youtube-videos-scroll::-webkit-scrollbar-thumb {
              background: #ff6b35;
              border-radius: 12px;
              transition: all 0.3s ease;
            }
            .youtube-videos-scroll::-webkit-scrollbar-thumb:hover {
              background: #ff8c42;
            }
            @media (max-width: 1200px) {
              .content-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
              }
              .sidebar-card, .tips-card {
                position: static;
              }
              .sidebar-card {
                order: 2;
              }
              .tips-card {
                order: 3;
              }
              .main-content {
                order: 1;
              }
            }
            @keyframes shimmer {
              0% {
                background-position: -1000px 0;
              }
              100% {
                background-position: 1000px 0;
              }
            }
            .skeleton {
              background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
              background-size: 1000px 100%;
              animation: shimmer 2s infinite;
              border-radius: 8px;
            }
            .skeleton-text {
              height: 1.5rem;
              margin-bottom: 1rem;
              width: 100%;
            }
            .skeleton-text.short {
              width: 60%;
            }
            .skeleton-card {
              background: white;
              border-radius: 12px;
              padding: 2rem;
              margin-bottom: 2rem;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            }
            .error-state {
              background: #fef2f2;
              border: 1px solid #fee2e2;
              border-radius: 12px;
              padding: 2.5rem;
              text-align: center;
              color: #dc2626;
            }
            .error-state svg {
              width: 64px;
              height: 64px;
              margin: 0 auto 1.25rem;
              color: #dc2626;
            }
            .error-state h3 {
              font-size: 1.5rem;
              font-weight: 600;
              margin-bottom: 0.75rem;
            }
            .error-state p {
              color: #991b1b;
              margin-bottom: 1.75rem;
              font-size: 1.125rem;
            }
            .retry-btn {
              background: #dc2626;
              color: white;
              border: none;
              padding: 0.875rem 1.75rem;
              border-radius: 8px;
              font-weight: 600;
              font-size: 1rem;
              cursor: pointer;
              transition: all 0.2s;
            }
            .retry-btn:hover {
              background: #b91c1c;
            }
            .booking-modal {
              position: fixed;
              inset: 0;
              background-color: rgba(0, 0, 0, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 50;
              padding: 1rem;
            }
            .booking-modal-content {
              background: white;
              border-radius: 1rem;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              max-width: 32rem;
              width: 100%;
              max-height: 90vh;
              overflow-y: auto;
            }
            @media (max-width: 768px) {
              .booking-modal-content {
                max-height: 95vh;
                margin: 1rem;
              }
              .content-container {
                padding: 0.25rem;
              }
              .main-content {
                padding: 1.25rem;
              }
              .page-title {
                font-size: 1.75rem;
              }
              .test-card {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
              }
              .book-btn {
                width: 100%;
                justify-content: center;
              }
              .info-card {
                padding: 1rem;
              }
            }
            @media (max-width: 480px) {
              .content-container {
                padding: 0.1rem;
              }
              .main-content {
                padding: 1rem;
              }
              .sidebar-card, .tips-card {
                padding: 1rem;
              }
              .page-title {
                font-size: 1.5rem;
              }
              .book-btn {
                padding: 1rem 1.5rem;
                font-size: 1rem;
              }
            }
          `}</style>
          
          <div className="content-container">
            <div className="content-grid">
              <aside className="sidebar-card">
                <h3>Package Information</h3>
                <nav>
                  <ul className="nav-list">
                    <li 
                      className={activeSection === 'overview' ? 'active' : ''}
                      onClick={() => scrollToSection('overview')}
                    >
                      Overview
                    </li>
                    <li 
                      className={activeSection === 'preparation' ? 'active' : ''}
                      onClick={() => scrollToSection('preparation')}
                    >
                      Package Preparation
                    </li>
                    <li 
                      className={activeSection === 'importance' ? 'active' : ''}
                      onClick={() => scrollToSection('importance')}
                    >
                      Importance
                    </li>
                    <li 
                      className={activeSection === 'tests' ? 'active' : ''}
                      onClick={() => scrollToSection('tests')}
                    >
                      Included Tests
                    </li>
                  </ul>
                </nav>
                <div className="Advertisement mb-8">
                  <AdvertisementBanner contentType="Content" className="Advertisement-img rounded-xl h-40" />
                </div>
                <div className="faq-section">
                  <h4>Frequently Asked Questions</h4>
                  <ul className="faq-list">
                    {faqs.map((faq, index) => (
                      <li key={index} className="faq-item">
                        <div
                          className="faq-question"
                          onClick={() => toggleFaq(index)}
                        >
                          <span>{faq.question}</span>
                          <span className="faq-toggle">
                            {expandedFaq === index ? '−' : '+'}
                          </span>
                        </div>
                        <div className={`faq-answer ${expandedFaq === index ? 'open' : ''}`}>
                          {faq.answer.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>

              <main className="main-content">
                <h1 className="page-title">
                  {packageName || packageData?.packageName || 'Health Package'} <span className="highlight">Package</span>
                </h1>
                
                {isLoading ? (
                  <>
                    <div className="skeleton-card">
                      <div className="skeleton skeleton-text" style={{ width: '40%', height: '2.5rem' }}></div>
                      <div className="skeleton skeleton-text"></div>
                      <div className="skeleton skeleton-text"></div>
                      <div className="skeleton skeleton-text short"></div>
                    </div>
                    <div className="skeleton-card">
                      <div className="skeleton skeleton-text" style={{ width: '50%', height: '2.5rem' }}></div>
                      <div className="skeleton skeleton-text"></div>
                      <div className="skeleton skeleton-text"></div>
                      <div className="skeleton skeleton-text short"></div>
                    </div>
                    <div className="skeleton-card">
                      <div className="skeleton skeleton-text" style={{ width: '45%', height: '2.5rem' }}></div>
                      <div className="skeleton skeleton-text"></div>
                      <div className="skeleton skeleton-text"></div>
                      <div className="skeleton skeleton-text short"></div>
                    </div>
                  </>
                ) : packageData ? (
                  <>
                    <section id="overview" className="info-card scroll-mt-24">
                      <h3>Overview</h3>
                      <p>{packageData.overview || 'Overview information not available.'}</p>
                    </section>
                    
                    <section id="preparation" className="info-card scroll-mt-24">
                      <h3>Before Package Preparation / Precautions</h3>
                      {packageData.testPreparation && packageData.testPreparation.length > 0 ? (
                        <ul>
                          {packageData.testPreparation.map((item, index) => (
                            <li key={index}>{item.point || item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No specific preparation instructions available.</p>
                      )}
                    </section>
                    
                    <section id="importance" className="info-card scroll-mt-24">
                      <h3>Importance</h3>
                      {packageData.importance && packageData.importance.length > 0 ? (
                        <ul>
                          {packageData.importance.map((item, index) => (
                            <li key={index}>{item.point || item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>Importance information not available.</p>
                      )}
                    </section>
                    
                    <section id="tests" className="tests-section scroll-mt-24">
                      <h3>
                        Tests Included in this <span className="highlight">Package</span>
                      </h3>
                      <p className="tests-note">⚠️ Note: Package prices may vary depending on the laboratory.</p>
                      
                      <div>
                        {packageData.includedTests && packageData.includedTests.length > 0 ? (
                          packageData.includedTests.map((test, index) => (
                            <div className="test-card" key={test._id || index}>
                              <div className="test-icon">
                                {test.testName ? test.testName.charAt(0) : 'T'}
                              </div>
                              <div className="test-info">
                                <strong>{test.testName || 'Test Name'}</strong>
                                <div className="test-category">
                                  <span>Category:</span>{' '}
                                  {Array.isArray(test.category) 
                                    ? test.category.join(', ') 
                                    : test.category || 'General'}
                                </div>
                              </div>
                              <div className="test-price">
                                ₹{test.price || 'N/A'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No tests included in this package.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </>
                ) : !isLoading && !packageData ? (
                  <div className="error-state">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <h3>Package Not Found</h3>
                    <p>We couldn't find the package you're looking for. Please try again or browse our available packages.</p>
                    <button className="retry-btn" onClick={() => router.push('/Patients/FindTests?page=1&showPackages=true')}>
                      Browse Packages
                    </button>
                  </div>
                ) : (
                  <div className="error-state">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <h3>Failed to Load Package Details</h3>
                    <p>We couldn't load the package information. Please try again.</p>
                    <button className="retry-btn" onClick={() => fetchPackageData(packageId, packageName)}>
                      Try Again
                    </button>
                  </div>
                )}
                
                <div className="mt-8 text-center">
                  <button className="book-btn" onClick={handleBookPackage}>
                    <span>Book This Package</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {showSuccessMessage && (
                    <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Package added to cart successfully!
                    </div>
                  )}
                </div>
              </main>

              <aside className="tips-card">
                <section className="tips-section">
                  <h4>Stay Fit With Expert Tips</h4>
                  
                  {packageData?.youtubeLinks && packageData.youtubeLinks.length > 0 ? (
                    <div className="youtube-videos-scroll">
                      {packageData.youtubeLinks.map((link, index) => {
                        const getYouTubeId = (url) => {
                          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                          const match = url.match(regExp);
                          return match && match[2].length === 11 ? match[2] : null;
                        };
                        
                        const videoId = getYouTubeId(link);
                        const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
                        
                        return (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="youtube-video-item"
                          >
                            {thumbnailUrl && (
                              <>
                                <img 
                                  src={thumbnailUrl} 
                                  alt={`Video ${index + 1}: ${packageName || packageData?.packageName || 'Package'} Guide`}
                                  className="youtube-thumbnail"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                <div className="youtube-play-overlay">
                                  <div className="youtube-play-button"></div>
                                </div>
                                <div className="youtube-video-title">
                                  Video {index + 1}: {packageName || packageData?.packageName || 'Package'} Guide
                                </div>
                              </>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="youtube-no-videos">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No educational videos available</p>
                    </div>
                  )}
                </section>
                
                <section className="support-section">
                  <h4>Need Support</h4>
                  <p>Need Help? Contact our support team</p>
                  <button className="support-btn">Contact Support</button>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="booking-modal">
          <div className="booking-modal-content">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {currentStep === 4 && bookingConfirmed ? 'Booking Confirmed!' : 'Book Package'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              {/* Progress Stepper */}
              {currentStep < 4 && (
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((step) => (
                      <React.Fragment key={step}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          step < currentStep
                            ? 'bg-green-500 text-white' 
                            : step === currentStep 
                            ? 'bg-[#007AFF] text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {step < currentStep ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            step
                          )}
                        </div>
                        {step < 3 && (
                          <div className={`w-10 h-1 rounded-full ${
                            step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                          }`}></div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Step 1: Confirm Selection */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Confirm Package Selection</h2>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{packageData?.packageName || packageName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {packageData?.includedTests?.length || 0} tests included
                        </p>
                      </div>
                      <div className="text-xl font-bold text-[#0052FF]">
                        ₹{packageData?.price || 0}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button 
                      onClick={handleCloseModal}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleContinue}
                      className="px-6 py-2.5 bg-[#007AFF] text-white font-semibold rounded-lg hover:bg-[#0052FF] transition-colors shadow-md"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 2: Select Date & Time */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Select Date & Time</h2>
                  
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getMinDate()}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Select Time Slot
                    </label>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2.5">Morning</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {timeSlots.morning.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => !slot.isPast && setSelectedTime(slot.value)}
                            disabled={slot.isPast}
                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                              slot.isPast
                                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                : selectedTime === slot.value
                                  ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-md' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#0052FF] hover:bg-[#00CCFF]'
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2.5">Afternoon</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {timeSlots.afternoon.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => !slot.isPast && setSelectedTime(slot.value)}
                            disabled={slot.isPast}
                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                              slot.isPast
                                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                : selectedTime === slot.value
                                  ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-md' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#0052FF] hover:bg-[#00CCFF]'
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2.5">Evening</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {timeSlots.evening.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => !slot.isPast && setSelectedTime(slot.value)}
                            disabled={slot.isPast}
                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                              slot.isPast
                                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                : selectedTime === slot.value
                                  ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-md' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#0052FF] hover:bg-[#00CCFF]'
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selectedDate && selectedTime && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5">
                      <p className="text-sm text-green-800">
                        <strong>Selected:</strong>{' '}
                        {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                        {getFormattedTime()}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button 
                      onClick={() => setCurrentStep(1)}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleContinue}
                      className="px-6 py-2.5 bg-[#007AFF] text-white font-semibold rounded-lg hover:bg-[#0052FF] transition-colors shadow-md"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Patient Details */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Patient Details</h2>
                  
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Booking For <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="bookingFor"
                          value="self"
                          checked={bookingFor === 'self'}
                          onChange={(e) => setBookingFor(e.target.value)}
                          className="w-4 h-4 text-[#007AFF] border-gray-300 focus:ring-[#007AFF]"
                        />
                        <span className="ml-2 text-gray-700 font-medium">Self</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="bookingFor"
                          value="family"
                          checked={bookingFor === 'family'}
                          onChange={(e) => setBookingFor(e.target.value)}
                          className="w-4 h-4 text-[#007AFF] border-gray-300 focus:ring-[#007AFF]"
                        />
                        <span className="ml-2 text-gray-700 font-medium">Family Member</span>
                      </label>
                    </div>
                  </div>

                  {bookingFor === 'family' && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Patient Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="patientName"
                          value={patientDetails.patientName}
                          onChange={handlePatientDetailChange}
                          placeholder="Enter patient's full name"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Age <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="age"
                            value={patientDetails.age}
                            onChange={handlePatientDetailChange}
                            placeholder="Enter age"
                            min="0"
                            max="120"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Relation <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="relation"
                            value={patientDetails.relation}
                            onChange={handlePatientDetailChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white"
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
                        </div>
                      </div>
                    </>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={patientDetails.contactNumber}
                      onChange={handlePatientDetailChange}
                      placeholder="Enter 10-digit mobile number"
                      pattern="[0-9]{10}"
                      maxLength="10"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={patientDetails.email}
                      onChange={handlePatientDetailChange}
                      placeholder="Enter email address"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      name="specialInstructions"
                      value={patientDetails.specialInstructions}
                      onChange={handlePatientDetailChange}
                      placeholder="Any special instructions or notes for the lab"
                      rows="4"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button 
                      onClick={() => setCurrentStep(2)}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleContinue}
                      className="px-6 py-2.5 bg-[#007AFF] text-white font-semibold rounded-lg hover:bg-[#0052FF] transition-colors shadow-md"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 4: Review & Confirm (before success) */}
              {currentStep === 4 && !bookingConfirmed && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Review & Confirm Booking</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">Package Details</h3>
                      <div className="space-y-1">
                        <p className="text-gray-900 font-medium">{packageData?.packageName || packageName}</p>
                        <p className="text-sm text-gray-600">{packageData?.includedTests?.length || 0} tests included</p>
                        <p className="text-lg font-bold text-[#0052FF]">₹{packageData?.price || 0}</p>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">Appointment Details</h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-900">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">
                            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{getFormattedTime()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">Patient Details</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          Booking for:{' '}
                          <span className="font-medium text-gray-900">
                            {bookingFor === 'self' ? 'Self' : 'Family Member'}
                          </span>
                        </p>
                        {bookingFor === 'family' && (
                          <>
                            <p className="text-sm text-gray-600">
                              Patient Name:{' '}
                              <span className="font-medium text-gray-900">{patientDetails.patientName}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Age:{' '}
                              <span className="font-medium text-gray-900">{patientDetails.age} years</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Relation:{' '}
                              <span className="font-medium text-gray-900 capitalize">{patientDetails.relation}</span>
                            </p>
                          </>
                        )}
                        <p className="text-sm text-gray-600">
                          Contact:{' '}
                          <span className="font-medium text-gray-900">{patientDetails.contactNumber}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Email:{' '}
                          <span className="font-medium text-gray-900">{patientDetails.email}</span>
                        </p>
                        {patientDetails.specialInstructions && (
                          <p className="text-sm text-gray-600">
                            Special Instructions:{' '}
                            <span className="font-medium text-gray-900">{patientDetails.specialInstructions}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button 
                      onClick={() => setCurrentStep(3)}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleConfirmBooking}
                      className="px-6 py-2.5 bg-[#007AFF] text-white font-semibold rounded-lg hover:bg-[#0052FF] transition-colors shadow-md"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Booking Success */}
              {currentStep === 4 && bookingConfirmed && (
                <div>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                    <p className="text-gray-600">Your package has been successfully booked</p>
                  </div>

                  <div className="bg-gradient-to-r from-[#007AFF] to-[#0052FF] rounded-xl p-5 mb-6 text-white">
                    <div className="text-center">
                      <p className="text-sm font-medium mb-2 opacity-90">Your Coupon Code</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl font-bold tracking-widest">{couponCode}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(couponCode);
                            alert('Coupon code copied to clipboard!');
                          }}
                          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                          title="Copy coupon code"
                        >
                          <Copy className="w-4 h-4 text-black" />
                        </button>
                      </div>
                      <p className="text-xs mt-2 opacity-80">Use this code at the lab to get special discounts.</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Booking ID</span>
                        <span className="text-sm font-semibold text-gray-900">{bookingId}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Package Name</span>
                        <span className="text-sm font-semibold text-gray-900">{packageData?.packageName || packageName}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Tests Included</span>
                        <span className="text-sm font-semibold text-gray-900">{packageData?.includedTests?.length || 0} tests</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Date of Appointment</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Time Slot</span>
                        <span className="text-sm font-semibold text-gray-900">{getFormattedTime()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => router.push('/Patients/Dashboard/upcoming')}
                      className="w-full bg-[#007AFF] hover:bg-[#0052FF] text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm"
                    >
                      View My Bookings
                    </button>
                    <button 
                      onClick={() => {
                        handleCloseModal();
                        router.push('/Patients/FindTests');
                      }}
                      className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Book Another Test
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PackageContent;