import { NextResponse } from "next/server";
import Twilio from "twilio";
import DBConnection from "../../../utils/config/db";
import UserModel from "../../../utils/models/User";

export const runtime = 'nodejs';

// Validate environment variables
const validateEnvVars = () => {
  console.log("🔍 Validating Twilio environment variables...");
  const requiredVars = {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_SERVICE_SID: process.env.TWILIO_SERVICE_SID
  };

  console.log("🔧 Twilio vars check:", {
    TWILIO_ACCOUNT_SID: requiredVars.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING',
    TWILIO_AUTH_TOKEN: requiredVars.TWILIO_AUTH_TOKEN ? 'SET' : 'MISSING',
    TWILIO_SERVICE_SID: requiredVars.TWILIO_SERVICE_SID ? 'SET' : 'MISSING'
  });

  const missing = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error("❌ Missing Twilio environment variables:", missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return requiredVars;
};

// Validate Indian phone number format
const validateIndianPhoneNumber = (phoneNumber) => {
  // Remove any spaces or special characters except +
  const cleanNumber = phoneNumber.replace(/[^+\d]/g, '');
  
  console.log("📱 Cleaning phone number:", phoneNumber, "Cleaned:", cleanNumber);
  
  // Check if it's a valid Indian number format
  // Indian numbers should be +91 followed by 10 digits, or just 10 digits
  const indianNumberRegex = /^(\+91)?[6-9]\d{9}$/;
  
  if (!indianNumberRegex.test(cleanNumber)) {
    return {
      isValid: false,
      message: "Please enter a valid Indian phone number (10 digits starting with 6-9)"
    };
  }
  
  // Format the number properly with +91 prefix
  let formattedNumber = cleanNumber;
  if (!cleanNumber.startsWith('+91')) {
    formattedNumber = '+91' + cleanNumber;
  }
  
  console.log("📱 Formatting phone number:", cleanNumber, "Formatted:", formattedNumber);
  
  return {
    isValid: true,
    formattedNumber: formattedNumber
  };
};

export async function POST(req) {
  try {
    console.log("📞 Starting Phone OTP Send Process");
    
    // Check if we're in development mode with placeholder credentials OR bypass flag is enabled
    const hasPlaceholderCredentials = process.env.TWILIO_ACCOUNT_SID === 'your_twilio_account_sid_here' || 
                                     process.env.TWILIO_AUTH_TOKEN === 'your_twilio_auth_token_here' ||
                                     process.env.TWILIO_SERVICE_SID === 'your_twilio_service_sid_here';
    
    const bypassEnabled = process.env.ENABLE_OTP_BYPASS === 'true';
    const isDevelopmentMode = hasPlaceholderCredentials || bypassEnabled;
    
    console.log('🔧 Environment Check:', {
      hasPlaceholderCredentials,
      bypassEnabled,
      isDevelopmentMode,
      ENABLE_OTP_BYPASS: process.env.ENABLE_OTP_BYPASS
    });
    
    const requestBody = await req.json();
    console.log("📥 Request Body:", requestBody);
    
    const { phone, context = 'registration' } = requestBody; // Add context parameter, default to 'registration'

    if (!phone) {
      console.log("❌ Phone number is missing");
      return NextResponse.json({ 
        success: false, 
        message: "Phone number required" 
      }, { status: 400 });
    }
    
    console.log("📱 Phone number received:", phone);
    console.log("📋 Context:", context);
    
    // Validate Indian phone number format
    const phoneValidation = validateIndianPhoneNumber(phone);
    if (!phoneValidation.isValid) {
      console.log("❌ Invalid Indian phone number format:", phone);
      return NextResponse.json({ 
        success: false, 
        message: phoneValidation.message
      }, { status: 400 });
    }
    
    const formattedPhone = phoneValidation.formattedNumber;
    console.log("📱 Formatted phone number:", formattedPhone);
    
    // Note: We no longer check for existing users during OTP sending
    // User existence is checked during registration, not during OTP sending
    console.log("📝 Skipping user existence check during OTP sending (user already registered)");

    if (isDevelopmentMode) {
      console.log('🔧 Development Mode: Simulating OTP send');
      
      // Simulate successful OTP send
      return NextResponse.json({ 
        success: true, 
        sid: 'dev_' + Date.now(),
        message: "OTP sent successfully (Development Mode - Use any 6-digit code)",
        isDevelopmentMode: true
      });
    }

    // Validate environment variables first
    console.log("🔐 Validating environment variables...");
    console.log("🔧 Current environment variables:", {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + '...' : 'NOT SET',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET',
      TWILIO_SERVICE_SID: process.env.TWILIO_SERVICE_SID ? process.env.TWILIO_SERVICE_SID.substring(0, 10) + '...' : 'NOT SET',
      ENABLE_OTP_BYPASS: process.env.ENABLE_OTP_BYPASS
    });
    const envVars = validateEnvVars();
    console.log("✅ Environment variables validated:", {
      TWILIO_ACCOUNT_SID: envVars.TWILIO_ACCOUNT_SID ? envVars.TWILIO_ACCOUNT_SID.substring(0, 10) + '...' : 'NOT SET',
      TWILIO_AUTH_TOKEN: envVars.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET',
      TWILIO_SERVICE_SID: envVars.TWILIO_SERVICE_SID ? envVars.TWILIO_SERVICE_SID.substring(0, 10) + '...' : 'NOT SET'
    });
    
    // Initialize Twilio client
    console.log("📱 Initializing Twilio client...");
    console.log("🔧 Twilio config:", {
      accountSid: envVars.TWILIO_ACCOUNT_SID ? envVars.TWILIO_ACCOUNT_SID.substring(0, 10) + '...' : 'NOT SET',
      serviceSid: envVars.TWILIO_SERVICE_SID ? envVars.TWILIO_SERVICE_SID : 'NOT SET'
    });
    const client = Twilio(envVars.TWILIO_ACCOUNT_SID, envVars.TWILIO_AUTH_TOKEN);
    const serviceSid = envVars.TWILIO_SERVICE_SID;
    console.log("✅ Twilio client initialized");

    console.log(`📱 Production Mode: Attempting to send real OTP to: ${formattedPhone}`);
    console.log(`🔑 Using Service SID: ${serviceSid}`);

    // Add additional error handling for Twilio client
    try {
      // First, let's verify that the service exists
      console.log("🔍 Checking if Twilio service exists...");
      console.log("🔧 Service SID:", serviceSid);
      try {
        const service = await client.verify.v2.services(serviceSid).fetch();
        console.log("✅ Twilio service verified:", service.friendlyName);
        console.log("📊 Service details:", {
          sid: service.sid,
          friendlyName: service.friendlyName,
          status: service.status,
          dateCreated: service.dateCreated
        });
        
        // Check if service is active
        // Note: Twilio services don't have a status property in the API response
        // If we can fetch the service without error, it exists and is accessible
        console.log("✅ Twilio service verified and accessible");
        
        // Remove the status check since Twilio services don't have a status property
        /*
        if (service.status !== 'active') {
          console.error("❌ Twilio service is not active:", service.status);
          return NextResponse.json({ 
            success: false, 
            message: `Twilio service is not active. Current status: ${service.status}` 
          }, { status: 400 });
        }
        */
      } catch (serviceError) {
        console.error("❌ Twilio service verification failed:", {
          message: serviceError.message,
          code: serviceError.code,
          status: serviceError.status,
          moreInfo: serviceError.moreInfo
        });
        return NextResponse.json({ 
          success: false, 
          message: `Twilio service error: ${serviceError.message}` 
        }, { status: 400 });
      }

      console.log("📱 Creating verification for:", formattedPhone);
      const verification = await client.verify.v2.services(serviceSid).verifications.create({
        to: formattedPhone,
        channel: "sms",
      });
      console.log("✅ Verification created:", verification.sid);

      console.log(`✅ Real OTP sent successfully! SID: ${verification.sid}`);
      console.log(`📊 Verification Status: ${verification.status}`);
      console.log(`📊 Verification Response:`, verification);

      return NextResponse.json({ 
        success: true, 
        sid: verification.sid,
        message: "OTP sent successfully to your phone",
        status: verification.status
      });
    } catch (twilioError) {
      console.error("❌ Twilio API Error:", {
        message: twilioError.message,
        code: twilioError.code,
        status: twilioError.status,
        moreInfo: twilioError.moreInfo,
        stack: twilioError.stack
      });
      
      // Log additional Twilio error details
      if (twilioError.response) {
        console.error("📊 Twilio response:", twilioError.response);
      }
      
      // Handle specific Twilio errors
      if (twilioError.code) {
        switch (twilioError.code) {
          case 20003:
            return NextResponse.json({ 
              success: false, 
              message: "Authentication failed. Please check Twilio credentials." 
            }, { status: 401 });
          case 20404:
            return NextResponse.json({ 
              success: false, 
              message: "Twilio service not found. Please check service configuration." 
            }, { status: 404 });
          case 21211:
            return NextResponse.json({ 
              success: false, 
              message: "Invalid phone number format." 
            }, { status: 400 });
          case 21214:
            return NextResponse.json({ 
              success: false, 
              message: "Phone number is not a valid mobile number." 
            }, { status: 400 });
          case 21608:
            // Trial account limitation - unverified phone number
            console.log("🚨 Twilio Trial Account Error: Unverified phone number");
            return NextResponse.json({ 
              success: false, 
              message: "This phone number is not verified in your Twilio trial account. Please verify it in Twilio Console or use development mode.",
              isTrial: true,
              code: 21608
            }, { status: 400 });
          default:
            return NextResponse.json({ 
              success: false, 
              message: `Twilio error: ${twilioError.message}` 
            }, { status: 500 });
        }
      }
      
      // Generic Twilio error handling
      return NextResponse.json({ 
        success: false, 
        message: `Twilio error: ${twilioError.message || "Failed to send OTP via Twilio"}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ Send OTP Error Details:", {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
      stack: error.stack
    });

    // Handle environment variable errors
    if (error.message.includes('Missing required environment variables')) {
      return NextResponse.json({ 
        success: false, 
        message: "Server configuration error. Please contact administrator." 
      }, { status: 500 });
    }

    // Generic error handling
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to send OTP" 
    }, { status: 500 });
  }
}