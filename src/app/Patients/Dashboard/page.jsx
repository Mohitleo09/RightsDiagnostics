'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../page';
import Footer from '../Footer/page';
import { safeJsonParse } from '../../utils/apiUtils';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import GoogleAuthHandler from '../../components/GoogleAuthHandler';
import { User, Calendar, Wallet, Ticket, FileText, Edit3, Save, Camera } from 'lucide-react';



const SidebarItem = ({ icon, label, href, active }) => (
  <Link href={href || '#'} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border transition-all ${active
    ? 'border-[#007AFF] bg-blue-50 shadow-[inset_4px_0_0_0_#007AFF]'
    : 'border-gray-200 hover:bg-gray-50'
    }`}>
    <span className="inline-flex items-center justify-center w-6 h-6">{icon}</span>
    <span className={`text-[15px] font-semibold ${active ? 'text-gray-900' : 'text-gray-800'}`}>{label}</span>
  </Link>
);



// New component to display verification status
const VerificationStatus = ({ isVerified, label }) => (
  <div className="flex items-center gap-2">
    <span className={`inline-block w-2 h-2 rounded-full ${isVerified ? 'bg-green-500' : 'bg-red-500'}`}></span>
    <span className="text-sm">{isVerified ? `${label} Verified` : `${label} Not Verified`}</span>
  </div>
);

// Notification component for unsaved health history
const HealthHistoryNotification = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-4 md:mx-8 mt-4 flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm text-blue-800" align="center">
          <span className="font-medium">Update Health History: </span>
          Please update your health history details for better care.
          <Link href="/Patients/Dashboard/Healthhistory" className="font-medium text-blue-600 hover:text-blue-900 ml-1">Update now</Link>
        </p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-blue-500 hover:text-blue-700 focus:outline-none"
      >
        <span className="sr-only">Dismiss</span>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default function PatientsDashboard() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState('User');
  const [isLoading, setIsLoading] = useState(true);
  const [showFullPhone, setShowFullPhone] = useState(false);
  const [form, setForm] = useState({
    name: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    profileImage: '',
  });
  // New state for verification status
  const [verificationStatus, setVerificationStatus] = useState({
    isPhoneVerified: false,
    isEmailVerified: false
  });

  // State for verification UI
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // State for pending verification from registration
  const [pendingVerificationMethod, setPendingVerificationMethod] = useState(null);
  const [pendingVerificationValue, setPendingVerificationValue] = useState('');

  // State for image cropping
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [showCropModal, setShowCropModal] = useState(false);
  const imgRef = useRef(null);

  // State for health history notification
  const [showHealthHistoryNotification, setShowHealthHistoryNotification] = useState(false);

  // Initialize with cached data to prevent flicker
  useEffect(() => {
    // Immediately set cached data to prevent UI flicker
    const cachedProfile = typeof window !== 'undefined' ? localStorage.getItem('userProfileData') : null;
    if (cachedProfile) {
      try {
        const profileData = JSON.parse(cachedProfile);
        console.log('📦 Initializing with cached profile:', profileData.name);
        setUserName(profileData.name);
        setForm(profileData);
        // Don't set loading to false yet, we still want to fetch fresh data
      } catch (e) {
        console.error('❌ Error parsing cached profile:', e);
      }
    }

    // Initialize profile image from localStorage
    const cachedProfileImage = typeof window !== 'undefined' ? localStorage.getItem('userProfileImage') : null;
    if (cachedProfileImage) {
      setForm(prevForm => ({
        ...prevForm,
        profileImage: cachedProfileImage
      }));
    }
  }, []);

  useEffect(() => {
    // Check URL parameters for edit mode
    const checkEditMode = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const editMode = urlParams.get('edit') === 'true';
        if (editMode) {
          setIsEditing(true);
        }
        return editMode;
      }
      return false;
    };

    const editMode = checkEditMode();

    // Fetch user profile from database
    const fetchProfile = async () => {
      // Don't set loading to true if we already have cached data
      const hasCachedData = typeof window !== 'undefined' && !!localStorage.getItem('userProfileData');
      if (!hasCachedData) {
        setIsLoading(true);
      }

      let storedPhone = typeof window !== 'undefined' ? (localStorage.getItem('userPhone') || '') : '';
      let storedEmail = typeof window !== 'undefined' ? (localStorage.getItem('userEmail') || '') : '';

      // Get user data from localStorage user object
      if (typeof window !== 'undefined') {
        const userObj = localStorage.getItem('user');
        if (userObj) {
          try {
            const user = JSON.parse(userObj);
            storedPhone = storedPhone || user.phone || '';
            storedEmail = storedEmail || user.email || '';
            // Store them for future use
            if (storedPhone && !localStorage.getItem('userPhone')) localStorage.setItem('userPhone', storedPhone);
            if (storedEmail && !localStorage.getItem('userEmail')) localStorage.setItem('userEmail', storedEmail);
          } catch (e) {
            console.error('Error parsing user object:', e);
          }
        }

        // Check verification status from localStorage
        const isPhoneVerified = localStorage.getItem('phoneVerified') === 'true' || (userObj ? JSON.parse(userObj).isPhoneVerified : false);
        const isEmailVerified = localStorage.getItem('emailVerified') === 'true' || (userObj ? JSON.parse(userObj).isEmailVerified : false);

        setVerificationStatus({
          isPhoneVerified: isPhoneVerified,
          isEmailVerified: isEmailVerified
        });
      }

      // If we still don't have identifiers, check if user is logged in
      const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';
      if (!isLoggedIn) {
        // Check if this is a Google login user by checking for session data
        // For Google login users, we might not have localStorage data immediately
        console.log('❌ User not logged in - Checking for session data');

        // Try to get user data from session as fallback for Google login
        try {
          const sessionResponse = await fetch('/api/auth/session');
          const sessionData = await safeJsonParse(sessionResponse);

          if (sessionData?.user) {
            // We have a session, so user is logged in
            console.log('✅ User logged in via session');

            // Set basic user data from session
            const sessionUserName = sessionData.user.name || sessionData.user.username || 'User';
            const sessionProfileImage = sessionData.user.image || sessionData.user.profileImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400';

            setUserName(sessionUserName);
            setForm(prev => ({
              ...prev,
              name: sessionUserName,
              email: sessionData.user.email || '',
              profileImage: sessionProfileImage,
              // phone will remain empty until user adds it
            }));

            // Update verification status for Google users
            setVerificationStatus({
              isPhoneVerified: sessionData.user.isPhoneVerified || false, // Google users need to verify phone separately
              isEmailVerified: sessionData.user.isVerified || true // Google users are automatically email verified
            });

            // Update localStorage with session data
            if (typeof window !== 'undefined') {
              localStorage.setItem('isLoggedIn', 'true');
              localStorage.setItem('userName', sessionUserName);
              localStorage.setItem('userProfileImage', sessionProfileImage);
              if (sessionData.user.email) {
                localStorage.setItem('userEmail', sessionData.user.email);
              }
              if (sessionData.user.phone) {
                localStorage.setItem('userPhone', sessionData.user.phone);
              }
              localStorage.setItem('user', JSON.stringify({
                id: sessionData.user.id,
                name: sessionData.user.name,
                username: sessionData.user.username,
                email: sessionData.user.email,
                phone: sessionData.user.phone,
                role: sessionData.user.role,
                isVerified: sessionData.user.isVerified || true, // Google users are automatically verified
                isPhoneVerified: sessionData.user.isPhoneVerified || false, // Phone verification status
                profileImage: sessionProfileImage // Store profile image in user object
              }));
            }

            // Continue with normal flow - try to get full profile
          } else {
            console.log('❌ User not logged in - Redirecting to login');
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            setIsLoading(false);
            return;
          }
        } catch (sessionError) {
          console.log('❌ Session check failed - Redirecting to login');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          setIsLoading(false);
          return;
        }
      }

      if (!storedPhone && !storedEmail) {
        console.log('❌ No phone or email found - User not logged in properly');
        // Set default form values with stored data
        const storedUserName = typeof window !== 'undefined' ? (localStorage.getItem('userName') || 'User') : 'User';
        const storedUserEmail = typeof window !== 'undefined' ? (localStorage.getItem('userEmail') || '') : '';
        const storedUserPhone = typeof window !== 'undefined' ? (localStorage.getItem('userPhone') || '') : '';
        const storedProfileImage = typeof window !== 'undefined' ? (localStorage.getItem('userProfileImage') || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400') : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400';

        // Try to get user data from localStorage user object
        let userData = null;
        try {
          const userObj = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
          if (userObj) {
            userData = JSON.parse(userObj);
          }
        } catch (e) {
          console.error('Error parsing user object:', e);
        }

        setUserName(storedUserName);
        setForm({
          name: userData?.name || storedUserName,
          dob: userData?.dob || '',
          gender: userData?.gender || '',
          phone: userData?.phone || storedUserPhone,
          email: userData?.email || storedUserEmail || '',
          profileImage: userData?.profileImage || userData?.image || storedProfileImage,
        });

        // Set verification status from user data
        setVerificationStatus({
          isPhoneVerified: userData?.isPhoneVerified || false,
          isEmailVerified: userData?.isVerified || false
        });

        setIsLoading(false);
        return;
      }

      console.log('🔑 Logged in user:', { phone: storedPhone, email: storedEmail });

      try {
        // Prioritize phone number for OTP login users
        const queryParam = storedPhone ? `phone=${encodeURIComponent(storedPhone)}` : `email=${encodeURIComponent(storedEmail)}`;
        console.log('📡 Fetching profile from database:', queryParam);

        const response = await fetch(`/api/profile?${queryParam}`);
        const data = await safeJsonParse(response);

        if (data.success && data.user) {
          const username = data.user.username || data.user.name || 'User';
          const profileImage = data.user.profileImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400';

          console.log('✅ Profile loaded successfully from database:', username);

          const profileData = {
            name: username,
            dob: data.user.dob || '',
            gender: data.user.gender || '',
            phone: data.user.phone || storedPhone,
            email: data.user.email || storedEmail || '',
            profileImage: profileImage,
          };

          setUserName(username);
          setForm(profileData);

          // Set verification status correctly from database
          setVerificationStatus({
            isPhoneVerified: data.user.isPhoneVerified || false,
            isEmailVerified: data.user.isEmailVerified || data.user.isVerified || false
          });

          // Update localStorage with new data AND cache complete profile
          if (typeof window !== 'undefined') {
            localStorage.setItem('userName', username);
            localStorage.setItem('userProfileImage', profileImage);
            console.log('💾 localStorage userName set to:', username);

            if (data.user.email) localStorage.setItem('userEmail', data.user.email);
            if (data.user.phone) localStorage.setItem('userPhone', data.user.phone);

            // Update the user object in localStorage to keep name in sync
            try {
              const userObj = localStorage.getItem('user');
              if (userObj) {
                const userData = JSON.parse(userObj);
                userData.name = username;
                userData.username = username;
                userData.profileImage = profileImage; // Update profile image in user object
                localStorage.setItem('user', JSON.stringify(userData));
                console.log('👤 Updated user object in localStorage');
              }
            } catch (e) {
              console.error('Error updating user object:', e);
            }

            // Cache complete profile data for faster loading INCLUDING profile image
            localStorage.setItem('userProfileData', JSON.stringify(profileData));

            console.log('💾 Profile cached:', { name: profileData.name, hasImage: !!profileData.profileImage });
            console.log('🔔 About to dispatch usernameUpdated event with:', username);

            // Dispatch custom event to notify navbar of username change
            const event = new CustomEvent('usernameUpdated', {
              detail: { userName: username },
              bubbles: true
            });
            window.dispatchEvent(event);
            console.log('✅ usernameUpdated event dispatched!');

            // Dispatch custom event to notify navbar of profile image change
            const profileImageEvent = new CustomEvent('profileImageUpdated', {
              detail: { profileImage: profileImage },
              bubbles: true
            });
            window.dispatchEvent(profileImageEvent);
            console.log('✅ profileImageUpdated event dispatched!');

            // Also trigger storage event for cross-tab sync
            window.dispatchEvent(new Event('storage'));
          }

          // Check if it's the user's first login by checking if profile is complete
          const isFirstLogin = !data.user.dob || !data.user.gender;

          // Dispatch custom event to notify navbar of username change
          const event = new CustomEvent('usernameUpdated', {
            detail: { userName: username },
            bubbles: true
          });
          window.dispatchEvent(event);
          console.log('✅ usernameUpdated event dispatched!');

          // Also trigger storage event for cross-tab sync
          window.dispatchEvent(new Event('storage'));
        } else if (data.error === "User not found") {
          // User might not exist in database, try loading from cache first
          console.log('⚠️ User not found in database, checking cache...');
          const cachedProfile = typeof window !== 'undefined' ? localStorage.getItem('userProfileData') : null;

          if (cachedProfile) {
            try {
              const profileData = JSON.parse(cachedProfile);
              console.log('📦 Loading profile from cache:', profileData.name);
              setUserName(profileData.name);
              setForm(profileData);
            } catch (e) {
              console.error('❌ Error parsing cached profile:', e);
              // Fallback to basic data
              const storedUserName = typeof window !== 'undefined' ? (localStorage.getItem('userName') || 'User') : 'User';
              setUserName(storedUserName);
              setForm({
                name: storedUserName,
                dob: '',
                gender: '',
                phone: storedPhone,
                email: storedEmail || '',
                profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400',
              });
            }
          } else {
            // No cached data, use basic info from localStorage
            console.log('📝 No cache found, using basic localStorage data');
            const storedUserName = typeof window !== 'undefined' ? (localStorage.getItem('userName') || 'User') : 'User';
            setUserName(storedUserName);
            setForm({
              name: storedUserName,
              dob: '',
              gender: '',
              phone: storedPhone,
              email: storedEmail || '',
              profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400',
            });
          }
        } else {
          // API returned error, load from cache
          console.log('⚠️ API error, loading from cache');
          const cachedProfile = typeof window !== 'undefined' ? localStorage.getItem('userProfileData') : null;

          if (cachedProfile) {
            try {
              const profileData = JSON.parse(cachedProfile);
              console.log('📦 Loading from cache:', profileData.name);
              setUserName(profileData.name);
              setForm(profileData);
            } catch (e) {
              console.error('❌ Error parsing cached profile:', e);
              const storedUserName = typeof window !== 'undefined' ? (localStorage.getItem('userName') || 'User') : 'User';
              const storedProfileImage = typeof window !== 'undefined' ? (localStorage.getItem('userProfileImage') || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400') : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400';
              setUserName(storedUserName);
              setForm({
                name: storedUserName,
                dob: '',
                gender: '',
                phone: storedPhone,
                email: storedEmail,
                profileImage: storedProfileImage
              });
            }
          } else {
            const storedUserName = typeof window !== 'undefined' ? (localStorage.getItem('userName') || 'User') : 'User';
            const storedProfileImage = typeof window !== 'undefined' ? (localStorage.getItem('userProfileImage') || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400') : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400';
            setUserName(storedUserName);
            setForm({
              name: storedUserName,
              dob: '',
              gender: '',
              phone: storedPhone,
              email: storedEmail,
              profileImage: storedProfileImage
            });
          }
        }
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
        // Fallback to localStorage with cached profile data
        const cachedProfile = typeof window !== 'undefined' ? localStorage.getItem('userProfileData') : null;

        if (cachedProfile) {
          try {
            const profileData = JSON.parse(cachedProfile);
            console.log('📦 Error occurred, loading from cache:', profileData.name);
            setUserName(profileData.name);
            setForm(profileData);
          } catch (e) {
            console.error('❌ Error parsing cached profile:', e);
            const storedUserName = typeof window !== 'undefined' ? (localStorage.getItem('userName') || 'User') : 'User';
            const storedProfileImage = typeof window !== 'undefined' ? (localStorage.getItem('userProfileImage') || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400') : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400';
            setUserName(storedUserName);
            setForm({
              name: storedUserName,
              dob: '',
              gender: '',
              phone: storedPhone,
              email: storedEmail,
              profileImage: storedProfileImage
            });
          }
        } else {
          const storedUserName = typeof window !== 'undefined' ? (localStorage.getItem('userName') || 'User') : 'User';
          const storedProfileImage = typeof window !== 'undefined' ? (localStorage.getItem('userProfileImage') || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400') : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400';
          setUserName(storedUserName);
          setForm({
            name: storedUserName,
            dob: '',
            gender: '',
            phone: storedPhone,
            email: storedEmail,
            profileImage: storedProfileImage
          });
        }
      } finally {
        setIsLoading(false);
        console.log('🏁 Profile loading complete');
      }

      // Check health history completion status
      checkHealthHistoryStatus();
    };

    // Function to check health history completion status
    const checkHealthHistoryStatus = async () => {
      try {
        const response = await fetch("/api/patient-healthhistory");
        const result = await safeJsonParse(response);

        if (result.success && result.data) {
          // Check if health history is complete
          const isHealthHistoryComplete = result.data.height && result.data.weight &&
            result.data.currentMedications && result.data.previousMedications;
          setShowHealthHistoryNotification(!isHealthHistoryComplete);
        } else {
          // If no data received, show notification
          setShowHealthHistoryNotification(true);
        }
      } catch (error) {
        console.error("Error checking health history status:", error);
        // On error, show notification by default
        setShowHealthHistoryNotification(true);
      }
    };

    // Function to check if all data is complete and redirect to upcoming appointments
    const checkAndRedirectIfComplete = async () => {
      try {
        // Check if profile is complete (name, dob, gender)
        const profileResponse = await fetch("/api/profile");
        const profileData = await safeJsonParse(profileResponse);

        // Check if health history is complete (height, weight, currentMedications, previousMedications)
        const healthHistoryResponse = await fetch("/api/patient-healthhistory");
        const healthHistoryData = await safeJsonParse(healthHistoryResponse);

        // Check if both profile and health history are complete
        const isProfileComplete = profileData.success && profileData.user &&
          profileData.user.name && profileData.user.dob && profileData.user.gender;

        const isHealthHistoryComplete = healthHistoryData.success && healthHistoryData.data &&
          healthHistoryData.data.height && healthHistoryData.data.weight &&
          healthHistoryData.data.currentMedications && healthHistoryData.data.previousMedications;

        // If both are complete, redirect to upcoming appointments
        if (isProfileComplete && isHealthHistoryComplete) {
          console.log("✅ All data complete, redirecting to upcoming appointments");
          // Small delay to ensure state is updated
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/Patients/Dashboard/upcoming';
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Error checking completion status:", error);
      }
    };

    fetchProfile();
  }, []);

  // Add session validation on visibility change (handles browser navigation)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Re-validate session when page becomes visible (e.g., via back/forward button)
        try {
          const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

          if (!isLoggedIn) {
            // Check for session as fallback (for Google login users)
            try {
              const sessionResponse = await fetch('/api/auth/session');
              const sessionData = await safeJsonParse(sessionResponse);

              if (!sessionData?.user) {
                window.location.href = '/login';
              }
            } catch (error) {
              window.location.href = '/login';
            }
          }
        } catch (error) {
          console.error('Session validation error:', error);
          window.location.href = '/login';
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Format date of birth input (auto-add slashes)
  const handleDobChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove all non-digits

    // Limit to 8 digits (ddmmyyyy)
    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    // Auto-format with slashes
    let formattedValue = '';
    if (value.length >= 1) {
      formattedValue = value.slice(0, 2); // dd
    }
    if (value.length >= 3) {
      formattedValue += '/' + value.slice(2, 4); // dd/mm
    }
    if (value.length >= 5) {
      formattedValue += '/' + value.slice(4, 8); // dd/mm/yyyy
    }

    setForm((prev) => ({ ...prev, dob: formattedValue }));
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob.split('/').reverse().join('-')); // Convert DD/MM/YYYY to YYYY-MM-DD
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format phone number for display (e.g., +91 12××××××56)
  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Phone not set';

    // Remove any non-digit characters and extract last 10 digits
    const digits = phone.replace(/\D/g, '').slice(-10);

    if (digits.length === 10) {
      // Format as +91 12××××××56
      return `+91 ${digits.slice(0, 2)}××××××${digits.slice(-2)}`;
    }

    return phone; // Return as is if not a valid Indian number
  };

  // Format phone number to show full number
  const formatFullPhoneNumber = (phone) => {
    if (!phone) return 'Phone not set';

    // Remove any non-digit characters and extract last 10 digits
    const digits = phone.replace(/\D/g, '').slice(-10);

    if (digits.length === 10) {
      // Format as +91 1234567890
      return `+91 ${digits}`;
    }

    return phone; // Return as is if not a valid Indian number
  };

  const handleEdit = async () => {
    if (isEditing) {
      // Validate required fields
      if (!form.name || !form.name.trim()) {
        toast.error('Name is required');
        return;
      }

      // Save profile to database
      try {
        // Get the current user identifier from localStorage (prioritize phone for OTP users)
        const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('userPhone') : '';
        const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : '';

        // Use the stored identifier, not the form data for identification
        const userIdentifier = storedPhone || storedEmail;

        if (!userIdentifier) {
          toast.error('Unable to identify user. Please log in again.');
          return;
        }

        console.log('💾 Saving profile with identifier:', { phone: storedPhone, email: storedEmail });
        console.log('📝 Form data to save:', { name: form.name.trim(), dob: form.dob, gender: form.gender });

        // Build the request body with the correct identifier
        const requestBody = {
          name: form.name.trim(),
          profileImage: form.profileImage, // Always include profile image
          ...(form.dob && { dob: form.dob }),
          ...(form.gender && { gender: form.gender }),
        };

        // Add the identifier that was used to fetch the profile (prioritize phone)
        if (storedPhone) {
          requestBody.phone = storedPhone;
          // Also update email if provided in form
          if (form.email && form.email.trim()) {
            requestBody.email = form.email.trim();
          }
        } else if (storedEmail) {
          requestBody.email = storedEmail;
          // Also update phone if provided in form
          if (form.phone && form.phone.trim()) {
            requestBody.phone = form.phone.trim();
          }
        }

        console.log('📤 Sending profile update:', {
          ...requestBody,
          profileImage: requestBody.profileImage ? `Base64 image (${Math.round(requestBody.profileImage.length / 1024)}KB)` : 'Not set'
        });

        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await safeJsonParse(response);
        console.log('📨 Save response:', data);
        console.log('👤 Returned user data:', {
          name: data.user?.name,
          username: data.user?.username,
          fullUser: data.user
        });

        if (data.success) {
          toast.success('Profile updated successfully!');

          console.log('✅ Profile saved with image:', data.user.profileImage ? 'Yes' : 'No');

          // Get the updated name from response
          const updatedName = data.user?.name || data.user?.username || form.name.trim();
          console.log('📝 Updated name from response:', updatedName);

          // Update form state with returned data to ensure consistency
          const updatedProfile = {
            name: updatedName,
            dob: data.user.dob || form.dob,
            gender: data.user.gender || form.gender,
            phone: data.user.phone || form.phone,
            email: data.user.email || form.email,
            profileImage: data.user.profileImage || form.profileImage,
          };

          console.log('✅ Setting userName to:', updatedName);
          console.log('📦 Updated profile object:', updatedProfile);

          setForm(updatedProfile);
          setUserName(updatedName);

          // Update localStorage with new data AND cache complete profile
          if (typeof window !== 'undefined') {
            localStorage.setItem('userName', updatedName);
            console.log('💾 localStorage userName set to:', updatedName);

            if (data.user.email) localStorage.setItem('userEmail', data.user.email);
            if (data.user.phone) localStorage.setItem('userPhone', data.user.phone);

            // Update the user object in localStorage to keep name and profile image in sync
            try {
              const userObj = localStorage.getItem('user');
              if (userObj) {
                const user = JSON.parse(userObj);
                user.name = updatedName;
                user.username = updatedName;
                // Update profile image in user object if available
                if (data.user.profileImage || form.profileImage) {
                  user.profileImage = data.user.profileImage || form.profileImage;
                }
                localStorage.setItem('user', JSON.stringify(user));
                console.log('👤 Updated user object in localStorage with profile image');
              } else {
                // If no user object exists, create one with all relevant data
                const newUserObj = {
                  name: updatedName,
                  username: updatedName,
                  email: data.user.email || form.email || '',
                  phone: data.user.phone || form.phone || '',
                  profileImage: data.user.profileImage || form.profileImage || ''
                };
                localStorage.setItem('user', JSON.stringify(newUserObj));
                console.log('👤 Created new user object in localStorage with profile image');
              }
            } catch (e) {
              console.error('Error updating user object:', e);
            }

            // Cache complete profile data for instant loading INCLUDING profile image
            localStorage.setItem('userProfileData', JSON.stringify(updatedProfile));

            // Store profile image separately for navbar access
            if (data.user.profileImage || form.profileImage) {
              localStorage.setItem('userProfileImage', data.user.profileImage || form.profileImage);
            }

            console.log('💾 Profile cached:', { name: updatedProfile.name, hasImage: !!updatedProfile.profileImage });
            console.log('🔔 About to dispatch usernameUpdated event with:', updatedName);

            // Dispatch custom event to notify navbar of username change
            const event = new CustomEvent('usernameUpdated', {
              detail: { userName: updatedName },
              bubbles: true
            });
            window.dispatchEvent(event);
            console.log('✅ usernameUpdated event dispatched!');

            // Dispatch custom event to notify navbar of profile image change
            if (data.user.profileImage || form.profileImage) {
              const profileImageEvent = new CustomEvent('profileImageUpdated', {
                detail: { profileImage: data.user.profileImage || form.profileImage },
                bubbles: true
              });
              window.dispatchEvent(profileImageEvent);
              console.log('✅ profileImageUpdated event dispatched!');
            }

            // Also trigger storage event for cross-tab sync
            window.dispatchEvent(new Event('storage'));
          }

          // Check if it's the user's first login by checking if profile is complete
          const isFirstLogin = !data.user.dob || !data.user.gender;

          // Dispatch custom event to notify navbar of username change
          const event = new CustomEvent('usernameUpdated', {
            detail: { userName: updatedName },
            bubbles: true
          });
          window.dispatchEvent(event);
          console.log('✅ usernameUpdated event dispatched!');

          // Dispatch custom event to notify navbar of profile image change
          if (data.user.profileImage || form.profileImage) {
            const profileImageEvent = new CustomEvent('profileImageUpdated', {
              detail: { profileImage: data.user.profileImage || form.profileImage },
              bubbles: true
            });
            window.dispatchEvent(profileImageEvent);
            console.log('✅ profileImageUpdated event dispatched!');
          }

          // Also trigger storage event for cross-tab sync
          window.dispatchEvent(new Event('storage'));

          // If it's the user's first login, redirect to the onboarding page
          if (isFirstLogin) {
            router.push('/onboarding');
          }
        } else {
          console.error('Save failed:', data.error);
          toast.error(data.error || 'Failed to save profile');
          return; // Don't toggle editing mode if save failed
        }
      } catch (error) {
        console.error('Error saving profile:', error);
        toast.error('Failed to save profile. Please try again.');
        return; // Don't toggle editing mode if save failed
      }
    }
    setIsEditing(!isEditing);
  };

  // Handle image upload with cropping
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Show crop modal
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
    }
  };

  // Function to center crop
  function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  }

  // On image load for cropping
  const onImageLoad = (e) => {
    if (e.currentTarget) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, 1));
    }
  };

  // Function to get cropped image
  const getCroppedImg = async (image, crop) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          resolve(reader.result);
        };
      }, 'image/jpeg');
    });
  };

  // Handle crop completion
  const handleCropComplete = async () => {
    if (imgRef.current && completedCrop) {
      try {
        const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop);
        handleChange('profileImage', croppedImageUrl);
        setShowCropModal(false);
        setImageSrc(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
        console.log('🖼️ Profile image updated (Cropped Base64)');

        // Dispatch event immediately when image is cropped
        const profileImageEvent = new CustomEvent('profileImageUpdated', {
          detail: { profileImage: croppedImageUrl },
          bubbles: true
        });
        window.dispatchEvent(profileImageEvent);
        console.log('✅ profileImageUpdated event dispatched for cropped image!');

        // Also store in localStorage immediately
        if (typeof window !== 'undefined') {
          localStorage.setItem('userProfileImage', croppedImageUrl);
        }
      } catch (error) {
        console.error('Error cropping image:', error);
        toast.error('Failed to crop image');
      }
    }
  };

  // Cancel cropping
  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageSrc(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  // Simplified phone verification functions (removed periodic verification logic)
  const sendPhoneOtp = async () => {
    let fullPhone;

    // Handle different cases for phone number input
    if (pendingVerificationMethod === 'phone') {
      // Use pending verification value from registration
      fullPhone = pendingVerificationValue;
    } else if (phoneInput) {
      // Use manually entered phone number with +91 prefix
      fullPhone = `+91${phoneInput}`;
    } else if (form.phone) {
      // Use existing phone number from form
      fullPhone = form.phone;
    } else {
      toast.error('Please enter a valid phone number');
      return;
    }

    // Validate phone number format
    if (!fullPhone || !/^\+91\d{10}$/.test(fullPhone)) {
      toast.error('Please enter a valid 10-digit Indian phone number with +91 prefix');
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await fetch('/api/verify-phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('OTP sent to your phone');
        setShowPhoneVerification(true);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending phone OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify phone OTP (general)
  const verifyPhoneOtpGeneral = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    // Use the existing phone number if no input is provided (for re-verification)
    const phoneToVerify = (pendingVerificationValue || phoneInput || form.phone || '').trim();

    if (!phoneToVerify || !/^\+?[1-9]\d{1,14}$/.test(phoneToVerify)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await fetch('/api/verify-phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneToVerify, code: otp })
      });

      const data = await response.json();
      if (data.success && data.verified) {
        toast.success('Phone verified successfully!');

        // Update user profile with verified phone number
        try {
          const updateResponse = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-verification-type': 'phone'
            },
            body: JSON.stringify({
              phone: phoneToVerify
            })
          });

          const updateData = await updateResponse.json();
          if (updateData.success) {
            // Update local state - phone verification status
            setForm(prev => ({ ...prev, phone: phoneToVerify }));
            setVerificationStatus(prev => ({ ...prev, isPhoneVerified: true }));
            // Do not change email verification status
            setShowPhoneVerification(false);
            setPhoneInput('');
            setOtp('');

            // Update localStorage - phone verification status
            if (typeof window !== 'undefined') {
              localStorage.setItem('userPhone', phoneToVerify);
              // Set flag to indicate phone was just verified
              localStorage.setItem('phoneJustVerified', 'true');
              // Do not change email verification status in localStorage
              const userObj = localStorage.getItem('user');
              if (userObj) {
                const user = JSON.parse(userObj);
                user.phone = phoneToVerify;
                user.isPhoneVerified = true;
                localStorage.setItem('user', JSON.stringify(user));
              }
              // Update verification status
              localStorage.setItem('phoneVerified', 'true');
            }

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            toast.error(updateData.error || 'Failed to update profile');
          }
        } catch (updateError) {
          console.error('Error updating profile:', updateError);
          toast.error('Failed to update profile');
        }
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Simplified email verification functions (removed periodic verification logic)
  const sendEmailOtp = async () => {
    // Use the existing email if no input is provided (for re-verification)
    const emailToSend = (emailInput || form.email || '').trim().toLowerCase();

    if (!emailToSend || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToSend)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSendingOtp(true);
    try {
      // Determine context - if we're re-verifying an existing verified email, use 're-verification'
      const isReverification = verificationStatus.isEmailVerified && form.email && form.email.trim().toLowerCase() === emailToSend;
      const context = isReverification ? 're-verification' : 'registration';

      const response = await fetch('/api/verify-email/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend, context })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('OTP sent to your email');
        setShowEmailVerification(true);
        // Set the email input to the email we just sent to
        if (!emailInput) setEmailInput(emailToSend);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending email OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify email OTP
  const verifyEmailOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    // Use the existing email if no input is provided (for re-verification)
    const emailToVerify = (pendingVerificationValue || emailInput || form.email || '').trim().toLowerCase();

    if (!emailToVerify || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToVerify)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await fetch('/api/verify-email/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify, code: otp })
      });

      const data = await response.json();
      if (data.success && data.verified) {
        toast.success('Email verified successfully!');

        // Update user profile with verified email
        try {
          const updateResponse = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-verification-type': 'email'
            },
            body: JSON.stringify({
              email: emailToVerify
            })
          });

          const updateData = await updateResponse.json();
          if (updateData.success) {
            // Update local state - email verification status
            setForm(prev => ({ ...prev, email: emailToVerify }));
            setVerificationStatus(prev => ({ ...prev, isEmailVerified: true }));
            // Do not change phone verification status
            setShowEmailVerification(false);
            setEmailInput('');
            setOtp('');

            // Update localStorage - email verification status
            if (typeof window !== 'undefined') {
              localStorage.setItem('userEmail', emailToVerify);
              // Set flag to indicate email was just verified
              localStorage.setItem('emailJustVerified', 'true');
              // Do not change phone verification status in localStorage
              const userObj = localStorage.getItem('user');
              if (userObj) {
                const user = JSON.parse(userObj);
                user.email = emailToVerify;
                user.isEmailVerified = true;
                localStorage.setItem('user', JSON.stringify(user));
              }
              // Update verification status
              localStorage.setItem('emailVerified', 'true');
            }

            // Dismiss any existing verification toasts
            toast.dismiss('verification-required');

            // Show success message
            toast.success('Email verified successfully!');

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            toast.error(updateData.error || 'Failed to update profile');
          }
        } catch (error) {
          toast.error('Failed to update profile');
        }
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch (error) {
      toast.error('Failed to verify OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <GoogleAuthHandler />
      <HealthHistoryNotification
        isVisible={showHealthHistoryNotification}
        onClose={() => setShowHealthHistoryNotification(false)}
      />
      <div className="flex-1 w-full bg-white px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 md:p-6">
            <div className="flex items-start gap-4 rounded-xl border border-[#00A3FF] bg-[#00CCFF] p-4 mb-5">
              <div className="flex-1">
                <div className="text-[17px] font-extrabold text-gray-900">{userName}</div>
                <div className="text-[14px] text-gray-700 leading-snug">
                  {form.dob && calculateAge(form.dob) ? `${calculateAge(form.dob)} years` : 'Age not set'}, {form.gender || 'Gender not set'}
                </div>
                <div
                  className="text-[14px] text-gray-700 flex items-center gap-2"
                  onMouseEnter={(e) => {
                    // Update state instead of directly manipulating DOM
                    setShowFullPhone(true);
                  }}
                  onMouseLeave={(e) => {
                    // Update state instead of directly manipulating DOM
                    setShowFullPhone(false);
                  }}
                >
                  <span id="phone-display">
                    {showFullPhone
                      ? formatFullPhoneNumber(form.phone)
                      : formatPhoneNumber(form.phone)}
                  </span>
                  <button
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    onMouseEnter={(e) => {
                      // Update state instead of directly manipulating DOM
                      setShowFullPhone(true);
                    }}
                    onMouseLeave={(e) => {
                      // Update state instead of directly manipulating DOM
                      setShowFullPhone(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <SidebarItem icon={<User className="w-5 h-5" />} label="Profile settings" href="/Patients/Dashboard" active />
              <SidebarItem icon={<Calendar className="w-5 h-5" />} label="Upcoming Appointments" href="/Patients/Dashboard/upcoming" />
              <SidebarItem icon={<Wallet className="w-5 h-5" />} label="Digital Wallet Balance" href="/Patients/Dashboard/wallet" />
              <SidebarItem icon={<Ticket className="w-5 h-5" />} label="Membership Packages" href="/Patients/Dashboard/membership" />
              <SidebarItem icon={<FileText className="w-5 h-5" />} label="Health history" href="/Patients/Dashboard/Healthhistory" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 md:p-6">
            {/* Loading state removed for instant access, relying on cached data */}
            <div className="flex items-end justify-between mb-8 border-b border-gray-50 pb-6">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Profile Settings</h2>
                <p className="text-sm text-gray-500 mt-2 font-medium">Manage your personal information</p>
              </div>
              <button
                onClick={handleEdit}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95 ${isEditing
                  ? 'bg-green-600 text-white hover:bg-green-700 ring-2 ring-green-100'
                  : 'bg-[#007AFF] text-white hover:bg-[#0052FF] ring-2 ring-blue-100'
                  }`}
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
              </button>
            </div>

            <div className="flex flex-col items-center mb-10">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-blue-50 shadow-lg group">
                  {form.profileImage ? (
                    <img
                      src={form.profileImage}
                      alt="profile"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        // Fallback to placeholder on error by clearing the src
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                      <User className="w-16 h-16 text-blue-200" />
                    </div>
                  )}
                  {/* Fallback div for when image fails to load (hidden by default) */}
                  <div className="hidden w-full h-full bg-blue-50 absolute top-0 left-0 items-center justify-center">
                    <User className="w-16 h-16 text-blue-200" />
                  </div>
                </div>
                <input
                  type="file"
                  id="profileImageUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={!isEditing}
                  className="hidden"
                />
                {isEditing && (
                  <label
                    htmlFor="profileImageUpload"
                    className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[#007AFF] border-[3px] border-white shadow-lg flex items-center justify-center hover:bg-[#0052FF] cursor-pointer transition-all hover:scale-110 active:scale-95 z-10"
                    title="Upload Photo"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </label>
                )}
              </div>
              {isEditing && (
                <p className="text-xs text-gray-400 mt-3 font-medium">Click to change photo</p>
              )}
            </div>

            {/* Crop Modal */}
            {showCropModal && (
              <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-[9999] p-4">
                <div className="bg-white rounded-lg w-full max-w-md overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Crop Profile Image</h3>
                  </div>
                  <div className="p-4 flex justify-center">
                    {imageSrc && (
                      <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={1}
                        circularCrop
                        minWidth={100}
                        minHeight={100}
                      >
                        <img
                          ref={imgRef}
                          src={imageSrc}
                          alt="Crop"
                          onLoad={onImageLoad}
                          className="max-h-[50vh] max-w-full"
                        />
                      </ReactCrop>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 p-4 bg-gray-50">
                    <button
                      onClick={handleCropCancel}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCropComplete}
                      className="px-3 py-1.5 text-sm bg-[#007AFF] text-white rounded-md hover:bg-[#0052FF]"
                      disabled={!completedCrop}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4">
              {/* Name Field */}
              <div className="relative">
                <input
                  value={form.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={!isEditing}
                  placeholder=" "
                  className="peer w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/10 disabled:opacity-100 transition-all placeholder-transparent"
                />
                <label className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-medium text-[#007AFF] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#007AFF]">
                  Full Name
                </label>
              </div>

              {/* DOB Field */}
              <div className="relative">
                <input
                  value={form.dob || ''}
                  onChange={handleDobChange}
                  disabled={!isEditing}
                  placeholder=" "
                  maxLength="10"
                  className="peer w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/10 disabled:opacity-100 transition-all placeholder-transparent"
                />
                <label className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-medium text-[#007AFF] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#007AFF]">
                  Date of Birth (DD/MM/YYYY)
                </label>
              </div>

              {/* Gender Field */}
              <div className="relative group">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-[#007AFF] z-10">
                  Gender
                </label>
                <div className="flex items-center gap-3 p-1.5 rounded-xl border border-gray-200 bg-white">
                  {['male', 'female'].map((gender) => (
                    <label key={gender} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${form.gender === gender
                      ? 'bg-blue-50 text-[#007AFF] shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50'
                      } ${!isEditing ? 'pointer-events-none' : ''}`}>
                      <input
                        type="radio"
                        name="gender"
                        className="hidden"
                        checked={form.gender === gender}
                        onChange={() => handleChange('gender', gender)}
                        disabled={!isEditing}
                      />
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Phone Field */}
              <div className="relative space-y-3">
                <div className="relative">
                  <input
                    value={formatPhoneNumber(form.phone) || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={!isEditing || verificationStatus.isPhoneVerified}
                    placeholder=" "
                    className="peer w-full pl-4 pr-24 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/10 disabled:opacity-100 transition-all placeholder-transparent"
                  />
                  <label className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-medium text-[#007AFF] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#007AFF]">
                    Phone Number
                  </label>

                  {/* Status Indicator / Action */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {verificationStatus.isPhoneVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold ring-1 ring-green-500/20 shadow-sm">
                        Verified
                      </span>
                    ) : (!verificationStatus.isPhoneVerified && !showPhoneVerification) && (
                      <button
                        onClick={() => setShowPhoneVerification(true)}
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors shadow-sm"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>

                {/* OTP Verification UI */}
                {(!verificationStatus.isPhoneVerified && (showPhoneVerification || pendingVerificationMethod === 'phone')) && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-semibold text-gray-500">Verify your phone number</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          value={phoneInput || (pendingVerificationMethod === 'phone' ? pendingVerificationValue.replace('+91', '') : (form.phone ? form.phone.replace('+91', '') : ''))}
                          onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:border-[#007AFF] outline-none"
                          placeholder="10-digit number"
                          disabled={pendingVerificationMethod === 'phone'}
                        />
                        {pendingVerificationMethod !== 'phone' && (
                          <button
                            onClick={sendPhoneOtp}
                            disabled={isSendingOtp}
                            className="absolute right-1 top-1 bottom-1 px-3 bg-[#007AFF] text-white rounded-md text-xs font-bold hover:bg-[#0052FF]"
                          >
                            {isSendingOtp ? '...' : 'Send OTP'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:border-green-500 outline-none"
                          placeholder="Enter OTP"
                          maxLength="6"
                        />
                        <button
                          onClick={verifyPhoneOtpGeneral}
                          disabled={isVerifyingOtp}
                          className="absolute right-1 top-1 bottom-1 px-3 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700"
                        >
                          Verify
                        </button>
                      </div>
                      <button
                        onClick={() => setShowPhoneVerification(false)}
                        className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div className="relative space-y-3">
                <div className="relative">
                  <input
                    value={form.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={!isEditing || verificationStatus.isEmailVerified}
                    placeholder=" "
                    className="peer w-full pl-4 pr-24 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/10 disabled:opacity-100 transition-all placeholder-transparent"
                  />
                  <label className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-medium text-[#007AFF] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#007AFF]">
                    Email Address
                  </label>

                  {/* Status Indicator / Action */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {verificationStatus.isEmailVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold ring-1 ring-green-500/20 shadow-sm">
                        Verified
                      </span>
                    ) : (!verificationStatus.isEmailVerified && !showEmailVerification) && (
                      <button
                        onClick={() => setShowEmailVerification(true)}
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors shadow-sm"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>

                {/* OTP Verification UI */}
                {(!verificationStatus.isEmailVerified && (showEmailVerification || pendingVerificationMethod === 'email')) && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-semibold text-gray-500">Verify your email address</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          value={emailInput || (pendingVerificationMethod === 'email' ? pendingVerificationValue : (form.email || ''))}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:border-[#007AFF] outline-none"
                          placeholder="Email address"
                          disabled={pendingVerificationMethod === 'email'}
                        />
                        {pendingVerificationMethod !== 'email' && (
                          <button
                            onClick={sendEmailOtp}
                            disabled={isSendingOtp}
                            className="absolute right-1 top-1 bottom-1 px-3 bg-[#007AFF] text-white rounded-md text-xs font-bold hover:bg-[#0052FF]"
                          >
                            {isSendingOtp ? '...' : 'Send OTP'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:border-green-500 outline-none"
                          placeholder="Enter OTP"
                          maxLength="6"
                        />
                        <button
                          onClick={verifyEmailOtp}
                          disabled={isVerifyingOtp}
                          className="absolute right-1 top-1 bottom-1 px-3 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700"
                        >
                          Verify
                        </button>
                      </div>
                      <button
                        onClick={() => setShowEmailVerification(false)}
                        className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div >
  );
}