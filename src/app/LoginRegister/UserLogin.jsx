"use client";

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { signIn, signOut, useSession } from 'next-auth/react'; // Import signOut and useSession

const UserLogin = () => {
  const [loginType, setLoginType] = useState("email");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("password");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  const [rememberMe, setRememberMe] = useState(false); // Added for "Remember Me" functionality
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(""); // Changed from phone to email
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState(""); // Added OTP state for forgot password
  const [forgotPasswordOtpSent, setForgotPasswordOtpSent] = useState(false); // Track if OTP was sent
  const [forgotPasswordOtpVerified, setForgotPasswordOtpVerified] = useState(false); // Track if OTP was verified

  // Track which OTP was sent
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);

  const router = useRouter();
  const { data: session, status } = useSession();

  // Auto-redirect if session exists when accessing login page
  useEffect(() => {
    // Only redirect if there's an authenticated session
    if (status === 'authenticated' && session) {
      console.log('Active session detected on user login page. Redirecting to dashboard...');
      router.push('/Patients/Dashboard');
    }
  }, [session, status, router]);

  // Listen for authentication events
  useEffect(() => {
    const handleUserLoggedIn = async () => {
      // This will be triggered after successful Google login
      // We'll check if we have a session and handle user data storage
      console.log('Checking for user session after Google login...');
    };

    window.addEventListener('userLoggedIn', handleUserLoggedIn);

    return () => {
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
    };
  }, []);

  // Handle Google login success
  useEffect(() => {
    const handleGoogleLoginSuccess = async () => {
      // This effect runs on component mount to check if we just came back from Google login
      if (typeof window !== 'undefined') {
        // Check if we have a session (this would be set by NextAuth after Google login)
        // In a real implementation, we would use getSession() from next-auth/react
        // For now, we'll rely on the redirect to /Patients/Dashboard
        console.log('Checking for Google login completion...');
      }
    };

    handleGoogleLoginSuccess();
  }, []);

  // Handle credential changes
  const handleCredentialChange = (e) => {
    const { id, value } = e.target;
    if (id === "email") {
      setCredentials(prev => ({
        ...prev,
        [id]: value
      }));
    } else {
      setCredentials(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  // useEffect to populate credentials from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCredentials = localStorage.getItem('rememberedCredentials');
      const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
      const expirationDate = localStorage.getItem('credentialsExpiration');

      // Check if credentials have expired
      if (expirationDate && new Date() > new Date(expirationDate)) {
        // Clear expired credentials
        localStorage.removeItem('rememberedCredentials');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('credentialsExpiration');
        return;
      }

      if (savedCredentials && savedRememberMe) {
        try {
          const parsedCredentials = JSON.parse(savedCredentials);
          setCredentials(parsedCredentials);
          setRememberMe(true);
        } catch (error) {
          console.error('Error parsing saved credentials:', error);
        }
      }
    }
  }, []);

  // Handle password login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Format credentials for authentication
      let emailValue = credentials.email;

      // If login type is email and user entered a 10 digit number, format it as Indian phone number
      if (loginType === "email" && credentials.email.match(/^\d{10}$/)) {
        emailValue = `+91${credentials.email}`;
      }

      // Use NextAuth credentials provider
      let result;
      try {
        result = await signIn('credentials', {
          email: emailValue,
          password: credentials.password,
          redirect: false
        });
      } catch (signInError) {
        // NextAuth v5 throws on 401/Invalid Credentials
        console.error("SignIn threw error:", signInError);
        const errorMessage = signInError.message || "";
        if (errorMessage.includes("Read more at") || errorMessage.includes("Not authenticated")) {
          toast.error("Invalid email or password");
        } else {
          toast.error("Authentication failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        // Handle "Remember Me" functionality
        if (rememberMe) {
          // Store credentials in localStorage for 14 days
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 14);

          localStorage.setItem('rememberedCredentials', JSON.stringify({
            email: credentials.email,
            password: credentials.password
          }));
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('credentialsExpiration', expirationDate.toISOString());
        } else {
          // Clear any existing remembered credentials
          localStorage.removeItem('rememberedCredentials');
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('credentialsExpiration');
        }

        toast.success("Login successful!");

        // Fetch user data and store in localStorage
        try {
          // Determine if we're using email, phone, or username for identification
          let queryParam = '';
          if (emailValue.startsWith('+')) {
            // Phone number
            queryParam = `phone=${encodeURIComponent(emailValue)}`;
          } else if (emailValue.includes('@')) {
            // Email
            queryParam = `email=${encodeURIComponent(emailValue)}`;
          } else {
            // Username
            queryParam = `username=${encodeURIComponent(emailValue)}`;
          }

          const response = await fetch(`/api/profile?${queryParam}`);
          const data = await response.json();

          if (data.success && data.user) {
            // Store user data in localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', data.user.username || data.user.name || 'User');
            localStorage.setItem('userEmail', data.user.email || '');
            localStorage.setItem('userPhone', data.user.phone || '');
            localStorage.setItem('user', JSON.stringify(data.user));

            // Check if it's the user's first login by checking if profile is complete
            const isFirstLogin = !data.user.dob || !data.user.gender;

            // Dispatch custom event to notify navbar of login and username update
            window.dispatchEvent(new CustomEvent('userLoggedIn'));
            window.dispatchEvent(new CustomEvent('usernameUpdated', {
              detail: { userName: data.user.username || data.user.name || 'User' }
            }));

            // Redirect based on whether it's first login or if we have a callbackUrl
            const searchParams = new URLSearchParams(window.location.search);
            const callbackUrl = searchParams.get('callbackUrl');

            if (callbackUrl) {
              router.push(callbackUrl);
            } else if (isFirstLogin) {
              router.push('/Patients/Dashboard');
            } else {
              router.push('/');
            }
          } else {
            // Even if we can't fetch profile, we still need to set isLoggedIn
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', emailValue);

            // Redirect to dashboard for first-time profile completion
            router.push('/Patients/Dashboard');
          }
        } catch (fetchError) {
          console.error("Error fetching user data:", fetchError);
          // Fallback to basic data
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userName', emailValue);

          // Redirect to dashboard for first-time profile completion
          router.push('/Patients/Dashboard');
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      console.log('Initiating Google login...');

      // Redirect to Google OAuth flow - this will prompt account selection
      const result = await signIn('google', {
        callbackUrl: '/Patients/Dashboard',
        redirect: true
      });

      console.log('Google login result:', result);

    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Google login failed. Please try again.");
      setLoading(false);
    }
  };

  // Handle send OTP for phone verification
  const handleSendOtp = async () => {
    // Use phoneNumber or check if email field contains a phone number or username
    let phoneToSend = phoneNumber;
    if (!phoneToSend && credentials.email) {
      // Check if it's a 10-digit phone number
      if (credentials.email.match(/^\d{10}$/)) {
        phoneToSend = credentials.email;
      } else {
        // It's a username, we'll handle this differently
        // For username, we'll still use the phone OTP API but with a different context
        phoneToSend = credentials.email; // This will be treated as username in the API
      }
    }

    console.log("📱 handleSendOtp - phoneToSend:", phoneToSend);
    console.log("📱 handleSendOtp - phoneNumber:", phoneNumber);
    console.log("📱 handleSendOtp - credentials.email:", credentials.email);

    if (!phoneToSend) {
      toast.error("Please enter a phone number or username");
      return;
    }

    setLoading(true);
    try {
      // Format phone number with +91 prefix if needed
      let formattedPhone = phoneToSend;
      let context = 'login';

      // Check if it's actually a username (not a phone number)
      if (!phoneToSend.match(/^\d{10}$/) && !phoneToSend.startsWith('+')) {
        // This is a username
        context = 'username-login';
        formattedPhone = phoneToSend; // Keep as is for username
        console.log("📱 Sending OTP for username:", formattedPhone);
      } else if (phoneToSend.match(/^\d{10}$/)) {
        // It's a 10-digit phone number
        formattedPhone = `+91${phoneToSend}`;
        console.log("📱 Sending OTP for 10-digit phone number:", phoneToSend, "Formatted:", formattedPhone);
      } else {
        console.log("📱 Sending OTP for already formatted phone number:", formattedPhone);
      }

      console.log("📱 Sending OTP to:", phoneToSend, "Formatted:", formattedPhone, "Context:", context);

      // Call the phone OTP API with context parameter
      const response = await fetch("/api/verify-phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone, context: context }) // Add context parameter
      });

      const data = await response.json();
      console.log("📱 Send OTP response:", data);

      if (data.success) {
        setPhoneOtpSent(true);
        setEmailOtpSent(false); // Reset email OTP sent state
        setOtpSent(true);
        toast.success(data.message || "OTP sent successfully!");
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle send OTP for email verification
  const handleSendEmailOtp = async () => {
    if (!credentials.email) {
      toast.error("Please enter an email address");
      return;
    }

    // Trim the email to ensure no whitespace
    const trimmedEmail = credentials.email.trim();

    // Check if it's actually an email address (not a phone number)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Call the email OTP API with context parameter
      const response = await fetch("/api/verify-email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, context: 'login' }) // Add context parameter
      });

      const data = await response.json();

      if (data.success) {
        setEmailOtpSent(true);
        setPhoneOtpSent(false); // Reset phone OTP sent state
        setOtpSent(true);
        toast.success(data.message || "OTP sent successfully to your email!");
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send Email OTP error:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle send OTP for forgot password (email)
  const handleSendForgotPasswordOtp = async () => {
    if (!forgotPasswordEmail) {
      toast.error("Please enter an email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Call the email OTP API for forgot password
      const response = await fetch("/api/verify-email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotPasswordEmail.trim(),
          context: 'forgot-password'
        })
      });

      const data = await response.json();

      if (data.success) {
        setForgotPasswordOtpSent(true);
        toast.success(data.message || "OTP sent successfully to your email!");
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle verify OTP for forgot password
  const handleVerifyForgotPasswordOtp = async () => {
    if (!forgotPasswordEmail) {
      toast.error("Please enter an email address");
      return;
    }

    if (!forgotPasswordOtp) {
      toast.error("Please enter the OTP");
      return;
    }

    // Log the values being sent
    console.log("📧 Sending OTP verification request:", {
      email: forgotPasswordEmail.trim(),
      code: forgotPasswordOtp
    });

    setLoading(true);
    try {
      // Call the email OTP verification API
      const response = await fetch("/api/verify-email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotPasswordEmail.trim(),
          code: forgotPasswordOtp
        })
      });

      const data = await response.json();
      console.log("📧 OTP verification response:", data);

      if (data.success && data.verified) {
        setForgotPasswordOtpVerified(true);
        toast.success("OTP verified successfully!");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    // Validate email
    if (!forgotPasswordEmail) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate passwords
    if (!newPassword || !confirmPassword) {
      toast.error("Please enter both password and confirm password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (!forgotPasswordOtpVerified) {
      toast.error("Please verify OTP first");
      return;
    }

    setLoading(true);
    try {
      // Call the reset password API
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotPasswordEmail.trim(), // Using email instead of phone
          password: newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Password reset successfully!");
        // Reset form and switch back to login after 2 seconds
        setTimeout(() => {
          setForgotPasswordMode(false);
          setForgotPasswordEmail("");
          setNewPassword("");
          setConfirmPassword("");
          setForgotPasswordOtp("");
          setForgotPasswordOtpSent(false);
          setForgotPasswordOtpVerified(false);
        }, 2000);
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP login (verify OTP and login in one step)
  const handleOtpLogin = async () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    console.log("📱 OTP Login - emailOtpSent:", emailOtpSent, "phoneOtpSent:", phoneOtpSent);
    console.log("📱 OTP Login - credentials.email:", credentials.email, "phoneNumber:", phoneNumber);

    setLoading(true);
    try {
      let response, data;

      // Determine if we're verifying phone, email or username OTP based on what was used to send OTP
      if (emailOtpSent && credentials.email) {
        // Email OTP verification - trim the email to ensure consistency
        const trimmedEmail = credentials.email.trim();
        console.log("📧 Verifying email OTP for:", trimmedEmail);
        response = await fetch("/api/verify-email/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmedEmail,
            code: otp
          })
        });
      } else if (phoneOtpSent) {
        // Phone or username OTP verification
        // Determine the correct identifier - it could be in phoneNumber or credentials.email
        let identifier = phoneNumber || credentials.email;

        console.log("📱 Phone OTP verification - identifier:", identifier);
        console.log("📱 Phone OTP verification - phoneNumber:", phoneNumber);
        console.log("📱 Phone OTP verification - credentials.email:", credentials.email);

        // Format the identifier consistently with how it was sent in handleSendOtp
        let formattedIdentifier = identifier;
        if (identifier) {
          // Check if it's actually a username (not a phone number)
          if (!identifier.match(/^\d{10}$/) && !identifier.startsWith('+')) {
            // This is a username - keep as is
            formattedIdentifier = identifier;
            console.log("📱 Identifier is username:", identifier);
          } else if (identifier.match(/^\d{10}$/)) {
            // It's a 10-digit phone number, format with +91 (same as handleSendOtp)
            formattedIdentifier = `+91${identifier}`;
            console.log("📱 Identifier is 10-digit phone number:", identifier, "Formatted:", formattedIdentifier);
          } else if (identifier.match(/^\d{10,12}$/) && !identifier.startsWith('+')) {
            // It's a phone number without +91 prefix, add it (same logic as handleSendOtp)
            formattedIdentifier = `+91${identifier.replace(/^0+/, '').replace(/^91/, '')}`;
            console.log("📱 Identifier is phone number without +91:", identifier, "Formatted:", formattedIdentifier);
          } else {
            // For already formatted numbers (+91 prefix), keep as is
            formattedIdentifier = identifier;
            console.log("📱 Identifier is already formatted phone number:", identifier);
          }
        }

        console.log("📱 Verifying phone OTP for identifier:", identifier, "Formatted:", formattedIdentifier);

        response = await fetch("/api/verify-phone/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: formattedIdentifier,
            code: otp
          })
        });
      } else {
        console.log("📱 No OTP sent - emailOtpSent:", emailOtpSent, "phoneOtpSent:", phoneOtpSent);
        toast.error("Please send OTP first");
        setLoading(false);
        return;
      }

      data = await response.json();
      console.log("📱 OTP verification response:", data);

      if (data.success && data.verified) {
        toast.success("OTP verified successfully!");
        // Store user info in localStorage
        if (typeof window !== 'undefined') {
          let userName = 'User';
          if (data.user) {
            userName = data.user.name || data.user.username || 'User';
            localStorage.setItem('user', JSON.stringify(data.user));
          }

          // Store appropriate identifier based on login type
          if (emailOtpSent && credentials.email) {
            // Use trimmed email for consistency
            const trimmedEmail = credentials.email.trim();
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', trimmedEmail);
            localStorage.setItem('userName', userName);
          } else if (phoneOtpSent) {
            // For phone or username login
            let identifier = phoneNumber || credentials.email;
            if (identifier) {
              // Check if it's a phone number
              if (identifier.match(/^\d{10}$/)) {
                const formattedPhone = `+91${identifier}`;
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userPhone', formattedPhone);
                localStorage.setItem('userName', userName);
              } else if (identifier.match(/^\+91\d{10}$/)) {
                // Already formatted phone number
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userPhone', identifier);
                localStorage.setItem('userName', userName);
              } else {
                // It's a username
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', identifier);
              }
            }
          }

          // Check if it's the user's first login
          let isFirstLogin = true;
          if (data.user) {
            isFirstLogin = !data.user.dob || !data.user.gender;
          }

          // Dispatch custom events to notify navbar
          window.dispatchEvent(new CustomEvent('userLoggedIn'));
          window.dispatchEvent(new CustomEvent('usernameUpdated', {
            detail: { userName: userName }
          }));

          // Redirect based on whether it's first login
          if (isFirstLogin) {
            router.push('/Patients/Dashboard');
          } else {
            router.push('/');
          }
        }
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            Rights Diagnostics
          </div>
          <div className="absolute bottom-4 left-6 md:bottom-6 md:left-10 w-12 md:w-16 border-b-4 border-white rounded" />
        </div>

        {/* Right Form Section */}
        <div className="w-full md:w-1/2 bg-white p-6 md:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {forgotPasswordMode ? "Reset Password" : "Login"}
            </h1>
            <div className="text-sm">
              {forgotPasswordMode ? (
                <>
                  Back to{" "}
                  <button
                    onClick={() => {
                      setForgotPasswordMode(false);
                      // Reset forgot password fields
                      setForgotPasswordEmail("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setForgotPasswordOtp("");
                      setForgotPasswordOtpSent(false);
                      setForgotPasswordOtpVerified(false);
                    }}
                    className="text-[#0052FF] hover:underline"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  Don't have account?{" "}
                  <Link href="/register" className="text-[#0052FF] hover:underline">
                    Create an account
                  </Link>
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => setLoginMethod("password")}
                      className={`flex-1 py-2 px-4 rounded-lg border transition text-sm ${loginMethod === "password"
                        ? "bg-[#007AFF] text-white border-[#007AFF]"
                        : "bg-white text-[#007AFF] border-[#007AFF] hover:bg-[#00CCFF]"
                        }`}
                    >
                      Login with Password
                    </button>
                    <button
                      onClick={() => setLoginMethod("otp")}
                      className={`flex-1 py-2 px-4 rounded-lg border transition text-sm ${loginMethod === "otp"
                        ? "bg-[#007AFF] text-white border-[#007AFF]"
                        : "bg-white text-[#007AFF] border-[#007AFF] hover:bg-[#00CCFF]"
                        }`}
                    >
                      Login with OTP
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {forgotPasswordMode ? (
            // Updated Forgot Password Form with Email OTP
            <div>
              {!forgotPasswordOtpSent ? (
                <>
                  <label className="block text-sm font-medium mb-1" htmlFor="forgotEmail">
                    Email Address
                  </label>
                  <div className="relative mb-4">
                    <input
                      id="forgotEmail"
                      type="email"
                      placeholder="Enter your email address"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-sm md:text-base pr-24"
                    />
                    <button
                      onClick={handleSendForgotPasswordOtp}
                      disabled={loading}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 py-1 px-3 rounded text-xs font-medium ${loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#007AFF] hover:bg-[#0052FF] text-white"
                        }`}
                    >
                      {loading ? "Sending..." : "Send OTP"}
                    </button>
                  </div>
                </>
              ) : !forgotPasswordOtpVerified ? (
                <>
                  <label className="block text-sm font-medium mb-1" htmlFor="forgotEmail">
                    Email Address
                  </label>
                  <input
                    id="forgotEmail"
                    type="email"
                    placeholder="Enter your email address"
                    value={forgotPasswordEmail}
                    readOnly
                    className="w-full mb-4 md:mb-5 px-3 md:px-4 py-2 md:py-3 rounded-lg border border-gray-400 bg-gray-100 text-sm md:text-base"
                  />

                  <label className="block text-sm font-medium mb-1" htmlFor="forgotPasswordOtp">
                    Enter OTP
                  </label>
                  <div className="relative mb-4">
                    <input
                      id="forgotPasswordOtp"
                      type="text"
                      placeholder="Enter OTP"
                      value={forgotPasswordOtp}
                      onChange={(e) => setForgotPasswordOtp(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-sm md:text-base pr-24"
                    />
                    <button
                      onClick={handleVerifyForgotPasswordOtp}
                      disabled={loading}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 py-1 px-3 rounded text-xs font-medium ${loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#007AFF] hover:bg-[#0052FF] text-white"
                        }`}
                    >
                      {loading ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                    OTP verified successfully! Please enter your new password.
                  </div>

                  <label className="block text-sm font-medium mb-1" htmlFor="newPassword">
                    New Password
                  </label>
                  <div className="relative mb-4">
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-sm md:text-base pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showNewPassword ? (
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
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l4.242 4.242M9.88 9.88L3 3m6.88 6.88L21 21"
                          />
                        </svg>
                      ) : (
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

                  <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative mb-4">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-sm md:text-base pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? (
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
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l4.242 4.242M9.88 9.88L3 3m6.88 6.88L21 21"
                          />
                        </svg>
                      ) : (
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
                </>
              )}

              {forgotPasswordOtpVerified && (
                <button
                  onClick={handleResetPassword}
                  disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                  className={`w-full py-2 md:py-3 font-bold rounded-lg shadow-md transition text-sm md:text-base ${loading || newPassword !== confirmPassword || newPassword.length < 6
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#007AFF] hover:bg-[#0052FF] text-white"
                    }`}
                >
                  {loading ? "Resetting Password..." : "Reset Password"}
                </button>
              )}
            </div>
          ) : (
            // Original Login Form
            <>
              {/* Conditional rendering for login method */}
              {loginMethod === "password" ? (
                // Password Login Form
                <form onSubmit={handlePasswordLogin}>
                  <label className="block text-sm font-medium mb-1" htmlFor="email">
                    Enter {loginType === "email" ? "Email/Phone Number/Username" : "Username"}
                  </label>
                  <input
                    id="email"
                    type="text"
                    placeholder={loginType === "email" ? "Enter email, phone number or username" : "Enter username"}
                    value={credentials.email}
                    onChange={handleCredentialChange}
                    className="w-full mb-4 md:mb-5 px-3 md:px-4 py-2 md:py-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-sm md:text-base"
                    required
                  />

                  <label className="block text-sm font-medium mb-1" htmlFor="password">
                    Enter your password
                  </label>
                  <div className="relative mb-3">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={handleCredentialChange}
                      className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-sm md:text-base pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
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

                  {/* Remember Me and Forgot Password on the same line */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-[#0052FF] focus:ring-[#007AFF] border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotPasswordMode(true)}
                      className="text-xs md:text-sm font-semibold text-black hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 md:py-3 font-bold rounded-lg shadow-md transition text-sm md:text-base ${loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#007AFF] hover:bg-[#0052FF] text-white"
                      }`}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>

                  {/* Added content after login button */}
                  <div className="mt-4 text-center text-sm text-gray-600">
                    By logging in, you agree to our{" "}
                    <Link href="/terms" className="text-[#0052FF] hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-[#0052FF] hover:underline">
                      Privacy Policy
                    </Link>
                  </div>
                </form>
              ) : (
                // OTP Login Form
                <div>
                  {loginType === "email" ? (
                    <>
                      <label className="block text-sm font-medium mb-1" htmlFor="otpIdentifier">
                        Enter Email or Phone Number
                      </label>
                      <input
                        id="otpIdentifier"
                        type="text"
                        placeholder="Enter email or phone number"
                        value={credentials.email || phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Check if it's a phone number (10 digits)
                          if (value.match(/^\d{10}$/)) {
                            setPhoneNumber(value);
                            // Clear email if phone number is entered
                            setCredentials(prev => ({ ...prev, email: "" }));
                          } else {
                            setCredentials(prev => ({ ...prev, email: value }));
                            // Clear phone number if email is entered
                            setPhoneNumber("");
                          }
                        }}
                        className="w-full mb-4 md:mb-5 px-3 md:px-4 py-2 md:py-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-sm md:text-base"
                      />
                      {!otpSent ? (
                        <button
                          onClick={() => {
                            // Check what type of input we have
                            if (credentials.email) {
                              const trimmedInput = credentials.email.trim();
                              // Check if it's a valid email
                              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                              if (emailRegex.test(trimmedInput)) {
                                handleSendEmailOtp();
                              } else if (trimmedInput.match(/^\d{10}$/)) {
                                // It's a 10-digit phone number
                                handleSendOtp();
                              } else {
                                // Invalid input
                                toast.error("Please enter a valid email or phone number");
                              }
                            } else if (phoneNumber) {
                              handleSendOtp();
                            } else {
                              toast.error("Please enter your email or phone number");
                            }
                          }}
                          disabled={loading}
                          className={`w-full py-2 md:py-3 font-bold rounded-lg shadow-md transition mb-4 md:mb-5 text-sm md:text-base ${loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-[#007AFF] hover:bg-[#0052FF] text-white"
                            }`}
                        >
                          {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                      ) : (
                        <>
                          <label className="block text-sm font-medium mb-1" htmlFor="otp">
                            Enter OTP
                          </label>
                          <input
                            id="otp"
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full mb-4 md:mb-5 px-3 md:px-4 py-2 md:py-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-sm md:text-base"
                          />
                          <button
                            onClick={handleOtpLogin}
                            disabled={loading}
                            className={`w-full py-2 md:py-3 font-bold rounded-lg shadow-md transition text-sm md:text-base ${loading
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-[#007AFF] hover:bg-[#0052FF] text-white"
                              }`}
                          >
                            {loading ? "Logging in..." : "Login"}
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium mb-1" htmlFor="username">
                        Enter Username
                      </label>
                      <input
                        id="username"
                        type="text"
                        placeholder="Enter username"
                        value={credentials.email}
                        onChange={handleCredentialChange}
                        className="w-full mb-4 md:mb-5 px-3 md:px-4 py-2 md:py-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-sm md:text-base"
                      />
                      {!otpSent ? (
                        <button
                          onClick={() => {
                            if (!credentials.email) {
                              toast.error("Please enter your username");
                              return;
                            }
                            // For username OTP login, we'll use phone OTP API but with username context
                            handleSendOtp();
                          }}
                          disabled={loading}
                          className={`w-full py-2 md:py-3 font-bold rounded-lg shadow-md transition mb-4 md:mb-5 text-sm md:text-base ${loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-[#007AFF] hover:bg-[#0052FF] text-white"
                            }`}
                        >
                          {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                      ) : (
                        <>
                          <label className="block text-sm font-medium mb-1" htmlFor="otp">
                            Enter OTP
                          </label>
                          <input
                            id="otp"
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full mb-4 md:mb-5 px-3 md:px-4 py-2 md:py-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-sm md:text-base"
                          />
                          <button
                            onClick={handleOtpLogin}
                            disabled={loading}
                            className={`w-full py-2 md:py-3 font-bold rounded-lg shadow-md transition text-sm md:text-base ${loading
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-[#007AFF] hover:bg-[#0052FF] text-white"
                              }`}
                          >
                            {loading ? "Logging in..." : "Login"}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Google Sign In Button */}
              {/* <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 md:py-3 hover:bg-gray-50 transition text-sm md:text-base"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span>{loading ? "Logging in with Google..." : "Continue with Google"}</span>
                    </button>
                  </div> */}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserLogin;