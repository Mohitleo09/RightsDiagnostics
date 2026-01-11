"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { safeJsonParse } from '../utils/apiUtils';

const RegisterForm  = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Added confirm password state
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false); // Added confirm password visibility state
  const [phone, setPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState(""); // For display without +91
  const [phoneOtp, setPhoneOtp] = useState("");
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  
  // Loading state for Google sign-in
  const [isLoading, setIsLoading] = useState(false);
  
  // Username availability states
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [usernameMessage, setUsernameMessage] = useState("");
  
  // Verification states
  const [showVerification, setShowVerification] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState(""); // "email" or "phone"
  const [verificationOtp, setVerificationOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  
  // Debounce timer ref
  const usernameDebounceRef = useRef(null);

  const togglePassword = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Added function to toggle confirm password visibility
  const toggleConfirmPassword = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  // Handle form field changes
  const handleFirstNameChange = (e) => {
    setFirstName(e.target.value);
  };

  const handleLastNameChange = (e) => {
    setLastName(e.target.value);
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    
    // Reset availability status when user types
    setUsernameAvailable(null);
    setUsernameSuggestions([]);
    setUsernameMessage("");
    
    // Clear previous debounce timer
    if (usernameDebounceRef.current) {
      clearTimeout(usernameDebounceRef.current);
    }
    
    // Set new debounce timer if username is long enough
    if (value.length >= 3) {
      usernameDebounceRef.current = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500); // 500ms debounce
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  // Handle phone input with Indian number validation
  const handlePhoneChange = (e) => {
    // Remove any non-digit characters
    let value = e.target.value.replace(/\D/g, '');
    
    // Limit to 10 digits for Indian numbers
    if (value.length <= 10) {
      setPhoneInput(value);
      // Set the full phone number with +91 prefix
      const fullPhoneNumber = value ? `+91${value}` : "";
      setPhone(fullPhoneNumber);
    }
  };

  // Handle email input
  const handleEmailChange = (e) => {
    // Trim the email to remove any leading/trailing whitespace
    const trimmedEmail = e.target.value.trim();
    setEmail(trimmedEmail);
    console.log("📧 Email input changed:", { original: e.target.value, trimmed: trimmedEmail });
  };

  // Generate better username suggestions
  const generateUsernameSuggestions = (baseUsername) => {
    const suggestions = [];
    const suffixes = ['123', '01', '99', '_pro', '_user', '2025', 'vip'];
    const prefixes = ['dr_', 'mr_', 'ms_', 'user_'];
    
    // Add suffixed versions
    suffixes.forEach(suffix => {
      const suggestion = baseUsername + suffix;
      if (suggestion.length <= 20) {  // Keep within reasonable length
        suggestions.push(suggestion);
      }
    });
    
    // Add prefixed versions
    prefixes.forEach(prefix => {
      const suggestion = prefix + baseUsername;
      if (suggestion.length <= 20) {  // Keep within reasonable length
        suggestions.push(suggestion);
      }
    });
    
    // Add random number versions
    for (let i = 0; i < 3; i++) {
      const randomNumber = Math.floor(10 + Math.random() * 90); // 2-digit random number
      const suggestion = baseUsername + randomNumber;
      if (suggestion.length <= 20) {  // Keep within reasonable length
        suggestions.push(suggestion);
      }
    }
    
    return suggestions.slice(0, 4); // Return only first 4 suggestions to keep form compact
  };

  // Check username availability
  const checkUsernameAvailability = useCallback(async (username) => {
    if (username.length < 3) return;
    
    setUsernameCheckLoading(true);
    
    try {
      const response = await fetch("/api/check-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });
      
      const data = await safeJsonParse(response);
      
      if (data.success) {
        setUsernameAvailable(data.available);
        setUsernameMessage(data.message);
        
        if (!data.available) {
          // Generate better suggestions instead of relying on API
          const suggestions = generateUsernameSuggestions(username);
          setUsernameSuggestions(suggestions);
        } else {
          setUsernameSuggestions([]);
        }
      } else {
        setUsernameAvailable(null);
        setUsernameMessage(data.error || "Error checking username");
        setUsernameSuggestions([]);
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameAvailable(null);
      setUsernameMessage("Error checking username availability");
      setUsernameSuggestions([]);
    } finally {
      setUsernameCheckLoading(false);
    }
  }, []);

  // Use a suggested username
  const useSuggestedUsername = (suggestedUsername) => {
    setUsername(suggestedUsername);
    setUsernameAvailable(true);
    setUsernameMessage("Username is available");
    setUsernameSuggestions([]);
  };

  // Check if all required fields are filled
  const areAllFieldsFilled = () => {
    return (
      firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      username.trim() !== "" &&
      password.trim() !== "" &&
      confirmPassword.trim() !== "" && // Added confirmPassword check
      phone.trim() !== "" &&
      email.trim() !== ""
    );
  };

  // Check if form is valid (all fields filled and passwords match)
  const isFormValid = () => {
    const allFieldsFilled = areAllFieldsFilled();
    const isUsernameAvailable = usernameAvailable === true;
    const passwordsMatch = password === confirmPassword; // Added password match check
    
    const valid = allFieldsFilled && isUsernameAvailable && passwordsMatch;
    
    console.log("📋 Form validation:", {
      allFieldsFilled,
      isUsernameAvailable,
      passwordsMatch, // Added to log
      overall: valid
    });
    
    return valid;
  };

  // Send Phone OTP
  const sendPhoneOTP = async () => {
    // More robust validation
    if (!phoneInput || phoneInput.length !== 10 || !/^\d{10}$/.test(phoneInput)) {
      toast.error("Please enter a valid 10-digit Indian phone number");
      return;
    }
    
    if (!phone) {
      toast.error("Please enter a valid phone number");
      return;
    }

    console.log("🚀 Starting Phone OTP send process...");
    console.log("📱 Phone input:", phoneInput);
    console.log("📱 Full phone number:", phone);

    try {
      const url = "/api/verify-phone/send-otp";
      console.log("🌐 Making request to:", url);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone, context: 'registration' }), // Explicitly set context
      });

      console.log("📡 Response received:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries())
      });

      // Check if response is ok
      if (!res.ok) {
        console.error("HTTP Error:", res.status, res.statusText);
        
        // Try to parse error message from response
        try {
          const errorData = await res.json();
          console.log("📡 Error response data:", errorData);
          
          if (errorData.errorCode === "PHONE_EXISTS") {
            toast.info(errorData.message + " Redirecting to login...");
            setTimeout(() => {
              window.location.href = "/login";
            }, 3000);
            return;
          }
          
          toast.error(errorData.message || `Server error: ${res.status} ${res.statusText}`);
        } catch (parseError) {
          // If we can't parse the error, use the default message
          console.error("Failed to parse error response:", parseError);
          toast.error(`Server error: ${res.status} ${res.statusText}`);
        }
        return;
      }

      // Use safe JSON parsing
      const data = await safeJsonParse(res);
      
      if (!data) {
        toast.error("Invalid response from server");
        return;
      }
      
      if (!data.success && data.error) {
        toast.error(data.error);
        return;
      }
      
      // Debug logging to see what we're actually receiving
      console.log("Response status:", res.status);
      console.log("Response data:", data);
      console.log("Data type:", typeof data);
      console.log("Data keys:", Object.keys(data || {}));
      
      if (data.success) {
        let successMessage = data.message || "OTP sent successfully!";
        if (data.isDevelopmentMode) {
          successMessage += " (Development Mode - Use any 6-digit code)";
        }
        toast.success(successMessage);
        setPhoneOtpSent(true);
        
        // Log additional information for debugging
        if (data.sid) {
          console.log(" Twilio SID:", data.sid);
        }
        if (data.status) {
          console.log(" Twilio Status:", data.status);
        }
      } else {
        // Show error message from API
        const errorMsg = data.message || "Failed to send OTP";
        toast.error(errorMsg);
        
        // Enhanced error logging
        console.error("OTP Send Error Details:", {
          status: res.status,
          statusText: res.statusText,
          data: data,
          message: data?.message,
          success: data?.success
        });
      }
    } catch (error) {
      console.error("❌ Network Error Details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        toast.error("Cannot connect to server. Please check if the development server is running on http://localhost:3000");
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
    }
  };

  // Send Email OTP
  const sendEmailOTP = async () => {
    // Trim email to ensure no whitespace
    const trimmedEmail = email.trim();
    
    console.log("📧 Preparing to send OTP to:", { 
      original: email, 
      trimmed: trimmedEmail,
      emailType: typeof email,
      trimmedType: typeof trimmedEmail
    });
    
    if (!trimmedEmail) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    console.log("🚀 Starting Email OTP send process...");
    console.log("📧 Email:", trimmedEmail);

    try {
      const url = "/api/verify-email/send-otp";
      console.log("🌐 Making request to:", url);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, context: 'registration' }), // Explicitly set context
      });

      console.log("📡 Response received:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries())
      });

      // Check if response is ok
      if (!res.ok) {
        console.error("HTTP Error:", res.status, res.statusText);
        let errorMessage = `Server error: ${res.status} ${res.statusText}`;
        
        // Try to parse error message from response
        try {
          const errorData = await res.json();
          console.log("📡 Error response data:", errorData);
          
          if (errorData.errorCode === "EMAIL_EXISTS") {
            toast.info(errorData.message + " Redirecting to login...");
            setTimeout(() => {
              window.location.href = "/login";
            }, 3000);
            return;
          }
          
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // If we can't parse the error, use the default message
          console.error("Failed to parse error response:", parseError);
        }
        
        toast.error(errorMessage);
        return;
      }

      // Use safe JSON parsing
      const data = await safeJsonParse(res);
      
      if (!data) {
        toast.error("Invalid response from server");
        return;
      }
      
      if (!data.success && data.error) {
        toast.error(data.error);
        return;
      }
      
      // Debug logging to see what we're actually receiving
      console.log("Response status:", res.status);
      console.log("Response data:", data);
      console.log("Data type:", typeof data);
      console.log("Data keys:", Object.keys(data || {}));
      
      if (data.success) {
        let successMessage = data.message || "OTP sent successfully!";
        if (data.isDevelopmentMode) {
          successMessage += " (Development Mode - Use any 6-digit code)";
        }
        toast.success(successMessage);
        setEmailOtpSent(true);
      } else {
        // Show error message from API
        const errorMsg = data.message || "Failed to send OTP";
        toast.error(errorMsg);
        
        // Enhanced error logging
        console.error("Email OTP Send Error Details:", {
          status: res.status,
          statusText: res.statusText,
          data: data,
          message: data?.message,
          success: data?.success
        });
      }
    } catch (error) {
      console.error("❌ Network Error Details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        toast.error("Cannot connect to server. Please check if the development server is running.");
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
    }
  };

  // Verify Phone OTP
  const verifyPhoneOTP = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    // Ensure we have the correct phone format
    const fullPhone = phone;
    
    console.log("🔍 Verifying Phone OTP:", { phone: fullPhone, code: phoneOtp });
    
    try {
      const res = await fetch("/api/verify-phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code: phoneOtp }),
      });

      console.log("📡 Phone OTP Verify Response Status:", res.status, res.statusText);
      
      const data = await safeJsonParse(res);
      console.log("📋 Phone OTP Verify Response Data:", data);
      
      if (data && data.success && data.verified) {
        let verifyMessage = "Phone verified successfully!";
        if (data.isDevelopmentMode) {
          verifyMessage = "Phone verified successfully! (Development Mode)";
        }
        toast.success(verifyMessage);
        setPhoneOtpVerified(true);
        setPhoneOtpSent(false); // Reset OTP sent state
      } else {
        // Handle different error scenarios
        if (!data) {
          console.error("❌ No data received from server");
          toast.error("No response from server. Please try again.");
        } else if (data.success === false) {
          const errorMsg = data.message || data.error || "OTP verification failed";
          console.error("❌ OTP Verification Failed:", errorMsg);
          toast.error(errorMsg);
        } else {
          console.error("❌ Unexpected response structure:", data);
          toast.error("Invalid OTP or verification failed");
        }
        console.error("OTP Verification Error Details:", data);
      }
    } catch (error) {
      console.error("❌ Network/Parse Error:", error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        toast.error("Cannot connect to server. Please check your connection.");
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
    }
  };

  // Verify Email OTP
  const verifyEmailOTP = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    // Trim email to ensure no whitespace
    const trimmedEmail = email.trim();
    
    // Prepare request data
    const requestData = {
      email: trimmedEmail,
      code: emailOtp
    };
    
    console.log("🔍 Verifying Email OTP:", requestData);
    console.log("🔍 Request data type:", typeof requestData);
    console.log("🔍 Request data keys:", Object.keys(requestData));
    
    // Log detailed analysis
    console.log("🔍 Email detailed analysis:", {
      original: email,
      trimmed: trimmedEmail,
      emailType: typeof email,
      trimmedType: typeof trimmedEmail,
      emailLength: email.length,
      trimmedLength: trimmedEmail.length
    });
    
    console.log("🔍 Code detailed analysis:", {
      original: emailOtp,
      codeType: typeof emailOtp,
      codeLength: emailOtp.length,
      isAllDigits: /^\d+$/.test(emailOtp)
    });

    try {
      const res = await fetch("/api/verify-email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      console.log("📡 Email OTP Verify Response Status:", res.status, res.statusText);
      
      // Check if response is ok
      if (!res.ok) {
        console.error("HTTP Error:", res.status, res.statusText);
        let errorMessage = `Server error: ${res.status} ${res.statusText}`;
        
        // Try to parse error message from response
        try {
          const errorData = await res.json();
          console.log("📡 Error response data:", errorData);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // If we can't parse the error, use the default message
          console.error("Failed to parse error response:", parseError);
        }
        
        toast.error(errorMessage);
        return;
      }

      // Use safe JSON parsing
      const data = await safeJsonParse(res);
      console.log("📋 Email OTP Verify Response Data:", data);
      
      if (data && data.success && data.verified) {
        let verifyMessage = "Email verified successfully!";
        if (data.isDevelopmentMode) {
          verifyMessage = "Email verified successfully! (Development Mode)";
        }
        toast.success(verifyMessage);
        setEmailOtpVerified(true);
        setEmailOtpSent(false); // Reset OTP sent state
      } else {
        // Handle different error scenarios
        if (!data) {
          console.error("❌ No data received from server");
          toast.error("No response from server. Please try again.");
        } else if (data.success === false) {
          const errorMsg = data.message || data.error || "OTP verification failed";
          console.error("❌ Email OTP Verification Failed:", errorMsg);
          toast.error(errorMsg);
        } else {
          console.error("❌ Unexpected response structure:", data);
          toast.error("Invalid OTP or verification failed");
        }
        console.error("Email OTP Verification Error Details:", data);
      }
    } catch (error) {
      console.error("❌ Network/Parse Error:", error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        toast.error("Cannot connect to server. Please check your connection.");
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
    }
  };

  // Check if user already exists by phone or email
  const checkUserExists = async (phone, email) => {
    try {
      const response = await fetch("/api/users/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, email }),
      });
      
      const data = await safeJsonParse(response);
      
      if (data.exists) {
        if (data.field === 'phone') {
          toast.info("A user already exists with this phone number. Redirecting to login...");
        } else if (data.field === 'email') {
          toast.info("A user already exists with this email address. Redirecting to login...");
        }
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking user existence:", error);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Trim email to ensure no whitespace
    const trimmedEmail = email.trim();
    
    // Check if passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    // Double-check that form is valid
    if (!isFormValid()) {
      if (usernameAvailable !== true) {
        toast.error("Please choose an available username before submitting.");
      } else {
        toast.error("Please fill all fields before submitting.");
      }
      return;
    }
    
    try {
      // Send registration data to backend
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          password,
          phone,
          email: trimmedEmail, // Use trimmed email
        }),
      });
      
      const data = await safeJsonParse(response);
      
      if (data.success) {
        toast.success(data.message || "Account created successfully!");
        // Store registered user data
        const userData = {
          username: username,
          email: trimmedEmail,
          phone: phone,
          name: `${firstName} ${lastName}`,
          role: 'user'
        };
        console.log("📝 Setting registered user:", userData);
        setRegisteredUser(userData);
        
        // Automatically send OTP to both email and phone
        const otpSent = await sendOtpToBoth();
        
        // Show verification section only if OTP was sent successfully
        if (otpSent) {
          setShowVerification(true);
        } else {
          // If OTP sending failed, still show verification section but with error message
          setShowVerification(true);
          toast.error("Account created but failed to send OTP. Please use resend OTP option.");
        }
      } else {
        // Handle specific error cases
        if (data.errorCode === "PHONE_EXISTS" || data.errorCode === "EMAIL_EXISTS" || data.errorCode === "DUPLICATE_KEY") {
          toast.info(data.message + " Redirecting to login...");
          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);
        } else if (data.message && (data.message.includes("already exists") || data.message.includes("User with this"))) {
          // Even if "already exists" error, redirect to login as the user is already registered
          toast.info("Account already exists. Redirecting to login...");
          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);
        } else {
          toast.error(data.message || "Registration failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    }
  };

  // Send OTP to both email and phone automatically
  const sendOtpToBoth = async () => {
    setIsVerifying(true);
    
    // Debug logging
    console.log("🔍 Sending OTP to:", {
      email: registeredUser?.email || email,
      phone: registeredUser?.phone || phone,
      registeredUser: registeredUser,
      emailState: email,
      phoneState: phone
    });
    
    try {
      // Send OTP to email
      const emailResponse = await fetch("/api/verify-email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredUser?.email || email, context: 'registration' }),
      });
      
      const emailData = await safeJsonParse(emailResponse);
      console.log("📧 Email OTP response:", emailData);
      
      // Send OTP to phone
      const phoneResponse = await fetch("/api/verify-phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: registeredUser?.phone || phone, context: 'registration' }),
      });
      
      const phoneData = await safeJsonParse(phoneResponse);
      console.log("📱 Phone OTP response:", phoneData);
      
      if (emailData.success && phoneData.success) {
        toast.success("OTP sent to both email and phone!");
        return true;
      } else {
        // Show specific error messages
        if (!emailData.success) {
          toast.error(`Failed to send email OTP: ${emailData.message || 'Unknown error'}`);
        }
        if (!phoneData.success) {
          toast.error(`Failed to send phone OTP: ${phoneData.message || 'Unknown error'}`);
        }
        return false;
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP. Please try again.");
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle verification method selection
  const handleVerificationMethodChange = (method) => {
    setVerificationMethod(method);
    setVerificationOtp("");
  };

  // Set email as default verification method when component mounts
  useEffect(() => {
    setVerificationMethod("email");
  }, []);

  // Verify OTP and update verification status
  const verifyOtp = async () => {
    if (!verificationOtp || verificationOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    if (!verificationMethod) {
      toast.error("Please select a verification method");
      return;
    }

    setIsVerifying(true);
    try {
      let url, requestData;
      
      if (verificationMethod === "email") {
        url = "/api/verify-email/verify-otp";
        requestData = { email: registeredUser?.email || email, code: verificationOtp };
      } else {
        url = "/api/verify-phone/verify-otp";
        requestData = { phone: registeredUser?.phone || phone, code: verificationOtp };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      
      if (data && data.success && data.verified) {
        toast.success(`${verificationMethod === "email" ? "Email" : "Phone"} verified successfully!`);
        
        // Update verification status
        if (verificationMethod === "email") {
          setEmailOtpVerified(true);
        } else {
          setPhoneOtpVerified(true);
        }
        
        // Store the OTP that was sent for the other method so user can verify it later
        if (typeof window !== 'undefined') {
          // Store the OTP context for the other method
          if (verificationMethod === "email") {
            // Email verified, store phone OTP context
            localStorage.setItem('pendingVerificationMethod', 'phone');
            localStorage.setItem('pendingVerificationPhone', registeredUser?.phone || phone);
          } else {
            // Phone verified, store email OTP context
            localStorage.setItem('pendingVerificationMethod', 'email');
            localStorage.setItem('pendingVerificationEmail', registeredUser?.email || email);
          }
        }
        
        // Redirect to dashboard after successful verification
        setTimeout(() => {
          loginUserAndRedirect();
        }, 1500);
      } else {
        toast.error(data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Login user and redirect to dashboard
  const loginUserAndRedirect = () => {
    // Store user info in localStorage for immediate login
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', registeredUser?.username || username);
      localStorage.setItem('userEmail', registeredUser?.email || email);
      localStorage.setItem('userPhone', registeredUser?.phone || phone);
      localStorage.setItem('user', JSON.stringify(registeredUser || {
        username: username,
        email: email,
        phone: phone,
        name: `${firstName} ${lastName}`,
        role: 'user'
      }));
      
      // Store verification status correctly - only mark as verified what actually was verified
      localStorage.setItem('emailVerified', verificationMethod === "email" ? "true" : "false");
      localStorage.setItem('phoneVerified', verificationMethod === "phone" ? "true" : "false");
      
      // Dispatch custom events to notify navbar
      window.dispatchEvent(new CustomEvent('userLoggedIn'));
      window.dispatchEvent(new CustomEvent('usernameUpdated', { 
        detail: { userName: registeredUser?.username || username }
      }));
    }
    
    // Redirect to patient dashboard in edit mode
    setTimeout(() => {
      window.location.href = "/Patients/Dashboard?edit=true";
    }, 2000);
  };

  // Resend OTP for selected method
  const resendOtp = async () => {
    if (!verificationMethod) {
      toast.error("Please select a verification method");
      return;
    }

    setIsVerifying(true);
    try {
      let url, requestData;
      
      if (verificationMethod === "email") {
        url = "/api/verify-email/send-otp";
        requestData = { email: registeredUser?.email || email, context: 'registration' };
      } else {
        url = "/api/verify-phone/send-otp";
        requestData = { phone: registeredUser?.phone || phone, context: 'registration' };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      
      if (data.success) {
        let successMessage = data.message || "OTP sent successfully!";
        if (data.isDevelopmentMode) {
          successMessage += " (Development Mode - Use any 6-digit code)";
        }
        toast.success(successMessage);
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (usernameDebounceRef.current) {
        clearTimeout(usernameDebounceRef.current);
      }
    };
  }, []);

  // Log verification state changes for debugging
  useEffect(() => {
    console.log("📱 Phone verification state changed:", phoneOtpVerified);
  }, [phoneOtpVerified]);
  
  useEffect(() => {
    console.log("📧 Email verification state changed:", emailOtpVerified);
  }, [emailOtpVerified]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="flex flex-col md:flex-row rounded-lg overflow-hidden shadow-xl max-w-4xl w-full">
        {/* Left Image Section */}
        <div
          className="w-full md:w-1/2 relative rounded-l-lg bg-cover bg-center h-64 md:h-auto"
          style={{
            backgroundImage:
              "url('/login.jpg')",
          }}
        >
          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white font-bold text-3xl md:text-4xl leading-tight drop-shadow-lg">
            Welcome to<br />
            Rights Lab
          </div>
          <div className="absolute bottom-4 left-6 md:bottom-6 md:left-10 w-12 md:w-16 border-b-4 border-white rounded" />
        </div>

        {/* Right Form Section */}
        <div className="w-full md:w-1/2 bg-white p-6 md:p-8 flex flex-col justify-center">
          {!showVerification && (
            <div className="mb-6 flex-shrink-0">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Create an account</h2>
              <p className="text-xs md:text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-[#0052FF] hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          )}

          <form className="space-y-4 flex-grow overflow-visible" onSubmit={handleSubmit}>
            {!showVerification ? (
              <>
                {/* First Name and Last Name side by side */}
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={handleFirstNameChange}
                    className="border border-gray-300 rounded-md px-3 py-2 w-1/2 text-sm focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={handleLastNameChange}
                    className="border border-gray-300 rounded-md px-3 py-2 w-1/2 text-sm focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                  />
                </div>

                {/* Username field with availability check */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={handleUsernameChange}
                    className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-[#007AFF] text-sm ${
                      usernameAvailable === true 
                        ? 'border-green-500' 
                        : usernameAvailable === false 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                    }`}
                  />
                  {usernameCheckLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-t-2 border-[#007AFF] rounded-full animate-spin"></div>
                    </div>
                  )}
                  {usernameAvailable === true && !usernameCheckLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {usernameAvailable === false && !usernameCheckLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Username availability message and suggestions - improved visibility and compact layout */}
                <div className={usernameMessage || usernameSuggestions.length > 0 ? "min-h-[40px]" : "min-h-[0px]"}>
                  {(usernameMessage || usernameSuggestions.length > 0) && (
                    <div className="text-xs">
                      {usernameMessage && (
                        <div className={`${
                          usernameAvailable === true 
                            ? 'text-green-600' 
                            : usernameAvailable === false 
                              ? 'text-red-600' 
                              : 'text-gray-600'
                        }`}>
                          {usernameMessage}
                        </div>
                      )}
                      
                      {usernameSuggestions.length > 0 && (
                        <div className="mt-2">
                          <div className="text-gray-600 font-medium text-xs">Suggestions:</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {usernameSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => useSuggestedUsername(suggestion)}
                                className="text-xs bg-[#00CCFF] text-[#0052FF] px-2 py-1 rounded hover:bg-[#00A3FF] transition"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Phone Number with +91 prefix fixed in input field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pr-2 text-gray-700 font-medium text-sm bg-gray-50 rounded-l-md border-r border-gray-300 pointer-events-none">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phoneInput}
                    onChange={handlePhoneChange}
                    className="w-full pl-14 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#007AFF] text-sm"
                    maxLength="10"
                  />
                </div>

                {/* Email input with Send OTP button */}
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={handleEmailChange}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#007AFF] text-sm"
                  />
                </div>

                {/* Password input with show/hide */}
                <div className="relative">
                  <input
                    id="password"
                    type={passwordVisible ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#007AFF] text-sm pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                  >
                    {passwordVisible ? (
                      // Eye with slash (hide password)
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      // Eye (show password)
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Confirm Password input with show/hide */}
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={confirmPasswordVisible ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#007AFF] text-sm pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}
                  >
                    {confirmPasswordVisible ? (
                      // Eye with slash (hide password)
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      // Eye (show password)
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 font-bold rounded-md shadow text-sm mt-4 transition flex-shrink-0 ${
                    isFormValid() 
                      ? "bg-[#007AFF] text-white hover:bg-[#0052FF] cursor-pointer" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={!isFormValid()}
                >
                  Create account
                </button>
              </>
            ) : (
              // Verification Section
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-left">Verify Your Account</h3>
                <p className="text-sm text-gray-600 text-left">
                  Enter the OTP sent to your email, phone number
                </p>
                
                {/* Verification Method Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select verification method:
                  </label>
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="email-verification"
                        name="verification-method"
                        checked={verificationMethod === "email"}
                        onChange={() => handleVerificationMethodChange("email")}
                        className="h-4 w-4 text-[#0052FF] focus:ring-[#007AFF]"
                      />
                      <label htmlFor="email-verification" className="ml-2 text-sm text-gray-700">
                        Email
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="phone-verification"
                        name="verification-method"
                        checked={verificationMethod === "phone"}
                        onChange={() => handleVerificationMethodChange("phone")}
                        className="h-4 w-4 text-[#0052FF] focus:ring-[#007AFF]"
                      />
                      <label htmlFor="phone-verification" className="ml-2 text-sm text-gray-700">
                        Phone Number 
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* OTP Input and Resend Button */}
                {verificationMethod && (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        value={verificationOtp}
                        onChange={(e) => setVerificationOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full px-3 py-2 pr-20 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#007AFF] text-sm"
                        maxLength="6"
                      />
                      <button
                        type="button"
                        onClick={resendOtp}
                        disabled={isVerifying}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-sm ${
                          isVerifying
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-[#0052FF] hover:underline"
                        }`}
                      >
                        Resend
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-green-600">
                        OTP has been sent to {verificationMethod === "email" ? (registeredUser?.email || email) : (registeredUser?.phone || phone)}
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={isVerifying || !verificationOtp || verificationOtp.length !== 6}
                      className={`w-full py-2 font-bold rounded-md shadow text-sm transition ${
                        isVerifying || !verificationOtp || verificationOtp.length !== 6
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                      }`}
                    >
                      {isVerifying ? "Verifying..." : "Verify"}
                    </button>
                    
                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-600">
                        You entered an incorrect email or phone number.{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setShowVerification(false);
                            setVerificationMethod("");
                            setVerificationOtp("");
                          }}
                          className="text-[#0052FF] hover:underline"
                        >
                          Go back
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;