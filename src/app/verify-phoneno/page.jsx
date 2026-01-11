"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import { safeJsonParse } from '../utils/apiUtils';

const VerifyPhoneNO = () => {
  const [otpValue, setOtpValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const router = useRouter();

  const initialized = useRef(false);
  
  useEffect(() => {
    // Get phone number from localStorage or URL params
    const userPhone = localStorage.getItem('userPhone');
    if (userPhone) {
      setPhone(userPhone);
    }
    
    if (!initialized.current && userPhone) {
      initialized.current = true;
      sendOTP(userPhone);
    }
  }, []);

  const sendOTP = async (phoneNumber) => {
    try {
      setLoading(true);

      const response = await fetch("/api/verify-phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      
      const data = await safeJsonParse(response);

      if (data?.success) {
        setLoading(false);
        toast.success(data.message || "OTP sent successfully to your phone number!");
      } else {
        setLoading(false);
        toast.error(data?.error || data?.message || "Failed to send OTP. Try again later.");
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error("Network error. Please check your connection.");
    }
  };

  const verifyOTP = async () => {
    try {
      if (!otpValue || otpValue.length !== 6) {
        return toast.error("Please enter a complete 6-digit OTP");
      }

      if (!phone) {
        return toast.error("Phone number not found. Please try again.");
      }

      setLoading(true);

      const response = await fetch("/api/verify-phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone, code: otpValue }),
      });
      
      const data = await safeJsonParse(response);

      if (data?.success && (data?.verified || data?.data?.status === "approved")) {
        setLoading(false);
        toast.success(data.message || "Phone number verified successfully!");
        
        // Update localStorage to mark as verified
        localStorage.setItem('phoneVerified', 'true');
        
        // Redirect to dashboard or home
        router.push("/");
      } else {
        setLoading(false);
        toast.error(data?.error || data?.message || "OTP verification failed. Please try again.");
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error("Network error. Please check your connection.");
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = otpValue.split('');
    newOtp[index] = value;
    setOtpValue(newOtp.join(''));
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const resendOTP = () => {
    if (phone) {
      setOtpValue("");
      sendOTP(phone);
    }
  };

  return (
    <div className="auth-centered">
      <div className="formContainer medium">
        <h1>Verify Phone Number</h1>
        <div className="formSection">
          <h3>Enter 6-Digit OTP</h3>
          <p className="phone-info">OTP has been sent to: {phone}</p>
          
          <div className="otp-container">
            {[...Array(6)].map((_, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={otpValue[index] || ""}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                placeholder="0"
              />
            ))}
          </div>
          
          <button 
            onClick={verifyOTP} 
            disabled={loading}
            className="verify-btn"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          
          <button 
            onClick={resendOTP} 
            disabled={loading}
            className="resend-btn"
          >
            Resend OTP
          </button>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .phone-info {
          color: #10b981;
          font-weight: 600;
          text-align: center;
          margin: 15px 0;
          padding: 10px;
          background: #f0fdf4;
          border-radius: 8px;
          border: 1px solid #d1fae5;
        }

        .otp-container {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin: 20px 0;
        }

        .otp-input {
          width: 50px;
          height: 50px;
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          transition: all 0.3s ease;
          outline: none;
        }

        .otp-input:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
          transform: scale(1.05);
        }

        .otp-input:not(:placeholder-shown) {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .verify-btn {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin: 10px 0;
          width: 100%;
        }

        .verify-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #ea580c, #c2410c);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .verify-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .resend-btn {
          background: transparent;
          color: #f97316;
          border: 2px solid #f97316;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }

        .resend-btn:hover:not(:disabled) {
          background: #f97316;
          color: white;
        }

        .resend-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .otp-container {
            gap: 8px;
          }
          
          .otp-input {
            width: 45px;
            height: 45px;
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default VerifyPhoneNO;