import { NextResponse } from "next/server";
import Twilio from "twilio";
import verificationStore from "../../../utils/verificationStore";
import DBConnection from "../../../utils/config/db";
import UserModel from "../../../utils/models/User";

export const runtime = 'nodejs';

// Validate environment variables
const validateEnvVars = () => {
  const requiredVars = {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_SERVICE_SID: process.env.TWILIO_SERVICE_SID
  };

  const missing = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return requiredVars;
};

// Function to create or find user by phone
const createOrFindUserByPhone = async (phone) => {
  try {
    await DBConnection();
    
    console.log('📱 Finding or creating user for phone:', phone);
    
    // First, try to find existing user by phone
    let user = await UserModel.findOne({ phone: phone });
    
    if (user) {
      console.log('✅ Found existing user by phone:', user._id);
      console.log('👤 Existing user data:', { name: user.name, username: user.username, email: user.email });
      // Update existing user verification status
      user.isPhoneVerified = true;
      user.isVerified = true;
      await user.save();
      console.log('🔄 Updated existing user verification status');
      return user;
    }
    
    // If no user found, create new one with null email to avoid conflicts
    console.log('🆕 Creating new user for phone:', phone);
    
    user = new UserModel({
      phone: phone,
      name: "User",
      username: "User",
      email: null, // Use null instead of temporary email to avoid conflicts
      role: 'user',
      isPhoneVerified: true,
      isVerified: true
    });
    
    await user.save();
    console.log('✅ New user created with ID:', user._id);
    console.log('👤 New user data:', { name: user.name, username: user.username });
    return user;
  } catch (error) {
    console.error('❌ Error creating/finding user:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      console.log('🔄 Duplicate key error, trying to find existing user...');
      // If duplicate key error, try to find the existing user by phone
      try {
        let existingUser = await UserModel.findOne({ phone });
        if (existingUser) {
          console.log('✅ Found existing user by phone:', existingUser._id);
          // Update the existing user to mark as verified
          existingUser.isPhoneVerified = true;
          existingUser.isVerified = true;
          await existingUser.save();
          return existingUser;
        }
      } catch (findError) {
        console.error('❌ Error finding existing user:', findError);
      }
    }
    
    throw error;
  }
};

export async function POST(req) {
  try {
    const { phone, code } = await req.json();
    
    console.log("🔍 OTP Verification Request:", { phone, code: code ? `${code.substring(0,2)}****` : 'missing' });

    if (!phone || !code) {
      console.log("❌ Missing phone or code:", { phone: !!phone, code: !!code });
      return NextResponse.json({ success: false, message: "Phone or OTP missing" }, { status: 400 });
    }

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
    
    if (isDevelopmentMode) {
      console.log('🔧 Development Mode: Simulating OTP verification');
      
      // In development mode, accept any 6-digit code
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        // Mark phone as verified in our store
        verificationStore.markVerified(phone);
        
        // Update user verification status in database
        try {
          await DBConnection();
          const user = await UserModel.findOne({ phone: phone });
          if (user) {
            user.isPhoneVerified = true;
            // If email is also verified, mark user as fully verified
            if (user.isVerified) {
              user.isVerified = true;
            }
            await user.save();
            console.log('✅ User verification status updated in database');
          } else {
            console.log('⚠️ User not found in database for phone:', phone);
          }
        } catch (dbError) {
          console.error('❌ Error updating user verification status:', dbError);
        }
        
        console.log('✅ Phone verified successfully (Dev Mode)');
        
        return NextResponse.json({ 
          success: true, 
          verified: true,
          message: "Phone verified successfully (Development Mode)",
          isDevelopmentMode: true
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          verified: false, 
          message: "Please enter a valid 6-digit code" 
        });
      }
    }

    // Production mode - use Twilio
    const envVars = validateEnvVars();
    const client = Twilio(envVars.TWILIO_ACCOUNT_SID, envVars.TWILIO_AUTH_TOKEN);
    const serviceSid = envVars.TWILIO_SERVICE_SID;

    console.log("📱 Verifying OTP with Twilio for phone:", phone, "Code:", code);
    const verification_check = await client.verify.v2.services(serviceSid).verificationChecks.create({
      to: phone,
      code: code,
    });
    console.log("📱 Twilio verification check result:", verification_check.status);

    if (verification_check.status === "approved") {
      // Mark phone as verified in our store
      verificationStore.markVerified(phone);
      
      // Update user verification status in database
      try {
        await DBConnection();
        const user = await UserModel.findOne({ phone: phone });
        if (user) {
          user.isPhoneVerified = true;
          // If email is also verified, mark user as fully verified
          if (user.isVerified) {
            user.isVerified = true;
          }
          await user.save();
          console.log('✅ User verification status updated in database');
        } else {
          console.log('⚠️ User not found in database for phone:', phone);
        }
      } catch (dbError) {
        console.error('❌ Error updating user verification status:', dbError);
      }
      
      console.log('✅ Phone verified successfully');
      
      return NextResponse.json({ 
        success: true, 
        verified: true,
        message: "Phone verified successfully"
      });
    } else {
      console.log('❌ Phone verification failed for phone:', phone, "Status:", verification_check.status);
      return NextResponse.json({ 
        success: false, 
        verified: false,
        message: "Invalid or expired OTP" 
      });
    }
  } catch (error) {
    console.error("❌ Verify OTP Error:", error);
    console.error("❌ Error Stack:", error.stack);
    
    // Provide more specific error messages
    let errorMessage = "Internal server error during OTP verification";
    
    if (error.message.includes('Missing required environment variables')) {
      errorMessage = "Server configuration error. Please contact support.";
    } else if (error.message.includes('database') || error.message.includes('connection')) {
      errorMessage = "Database connection error. Please try again.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}