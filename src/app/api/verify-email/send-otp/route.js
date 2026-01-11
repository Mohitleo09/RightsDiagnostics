import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import DBConnection from "../../../utils/config/db";
import UserModel from "../../../utils/models/User";
import verificationStore from "../../../utils/verificationStore";

export const runtime = 'nodejs';

// Validate environment variables
const validateEnvVars = () => {
  console.log("🔍 Validating email environment variables...");
  const requiredVars = {
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS
  };

  console.log("🔧 Email vars check:", {
    EMAIL_USER: requiredVars.EMAIL_USER ? 'SET' : 'MISSING',
    EMAIL_PASS: requiredVars.EMAIL_PASS ? 'SET' : 'MISSING'
  });

  const missing = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error("❌ Missing email environment variables:", missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return requiredVars;
};

export async function POST(req) {
  try {
    console.log("📧 Starting Email OTP Send Process");

    const requestBody = await req.json();
    console.log("📥 Request Body:", requestBody);

    const { email, context = 'registration' } = requestBody; // Add context parameter, default to 'registration'

    // Trim email to ensure no whitespace and normalize
    const trimmedEmail = email ? email.trim().toLowerCase() : "";

    if (!trimmedEmail) {
      console.log("❌ Email address is missing");
      return NextResponse.json({
        success: false,
        message: "Email address required"
      }, { status: 400 });
    }

    console.log("📧 Email address received:", trimmedEmail);
    console.log("📋 Context:", context);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      console.log("❌ Invalid email format:", trimmedEmail);
      return NextResponse.json({
        success: false,
        message: "Invalid email format"
      }, { status: 400 });
    }

    // Note: We no longer check for existing users during OTP sending
    // User existence is checked during registration, not during OTP sending
    console.log("📝 Skipping user existence check during OTP sending (user already registered)");

    // Check if we're in development mode
    const bypassEnabled = process.env.ENABLE_OTP_BYPASS === 'true';

    if (bypassEnabled) {
      console.log('🔧 Development Mode: Simulating Email OTP send');

      // In development mode, store a dummy OTP
      verificationStore.storeEmailOtp(trimmedEmail, '123456');

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully (Development Mode - Use code: 123456)",
        isDevelopmentMode: true
      });
    }

    // Validate environment variables
    console.log("🔐 Validating environment variables...");
    console.log("🔧 Current environment variables:", {
      EMAIL_USER: process.env.EMAIL_USER ? process.env.EMAIL_USER : 'NOT SET',
      EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'NOT SET',
      ENABLE_OTP_BYPASS: process.env.ENABLE_OTP_BYPASS
    });
    const envVars = validateEnvVars();
    console.log("✅ Environment variables validated:", {
      EMAIL_USER: envVars.EMAIL_USER ? envVars.EMAIL_USER : 'NOT SET',
      EMAIL_PASS: envVars.EMAIL_PASS ? 'SET' : 'NOT SET'
    });

    // Generate a 6-digit OTP
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const otp = randomNumber.toString();
    console.log("🔢 Generated random number:", randomNumber);
    console.log("🔢 Generated OTP:", otp);
    console.log("🔢 OTP type:", typeof otp);
    console.log("🔢 OTP length:", otp.length);

    // Ensure it's exactly 6 digits
    if (otp.length !== 6) {
      console.error("🔢 Generated OTP is not 6 digits:", otp);
    }

    // Store OTP with 10-minute expiry using the trimmed and normalized email
    verificationStore.storeEmailOtp(trimmedEmail, otp);

    // Verify the OTP was stored correctly
    const storedOtp = verificationStore.emailOtps.get(trimmedEmail);
    console.log("📧 Stored OTP verification:", storedOtp);
    if (storedOtp) {
      console.log("📧 Stored OTP value:", storedOtp.otp, "Type:", typeof storedOtp.otp);
    }

    // Create transporter
    console.log("📧 Creating email transporter...");
    console.log("🔧 Email config:", {
      user: envVars.EMAIL_USER ? envVars.EMAIL_USER : 'NOT SET',
      pass: envVars.EMAIL_PASS ? 'SET' : 'NOT SET'
    });
    // Remove spaces from App Password if present
    const emailPass = envVars.EMAIL_PASS ? envVars.EMAIL_PASS.replace(/\s+/g, '') : envVars.EMAIL_PASS;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: envVars.EMAIL_USER,
        pass: emailPass
      }
    });
    console.log("✅ Email transporter created");

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log("✅ Email transporter verified");
    } catch (transporterError) {
      console.error("❌ Email transporter verification failed:", transporterError.message);
      throw new Error(`Email transporter configuration error: ${transporterError.message}`);
    }

    // Define mail options based on context
    let mailOptions;

    if (context === 'forgot-password') {
      // Password reset OTP email template
      mailOptions = {
        from: envVars.EMAIL_USER,
        to: trimmedEmail,
        subject: 'Rights Diagnostics - Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 10px;">Password Reset Request</h2>
              <p style="color: #666; font-size: 16px;">Rights Diagnostics</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <p style="color: #555; font-size: 16px; margin-bottom: 20px;">You have requested to reset your password on Rights Diagnostics. Please use the following OTP to proceed with resetting your password:</p>
              
              <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 2px dashed #e67e22; display: inline-block; margin: 20px 0;">
                <h3 style="margin: 0; color: #e67e22; font-size: 32px; letter-spacing: 8px;">${otp}</h3>
              </div>
              
              <p style="color: #888; font-size: 14px; margin-top: 20px;">This OTP will expire in 10 minutes.</p>
            </div>
            
            <div style="background-color: #fff8e6; padding: 20px; border-left: 4px solid #e67e22; border-radius: 4px; margin-bottom: 30px;">
              <p style="margin: 0; color: #333; font-weight: bold;">Security Notice:</p>
              <p style="margin: 10px 0 0; color: #666; font-size: 14px;">If you didn't initiate this request, your account might be at risk. Please contact our support team immediately.</p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
              <p>This is an automated message from Rights Diagnostics. Please do not reply to this email.</p>
            </div>
          </div>
        `
      };
    } else if (context === 'login') {
      // Login OTP email template
      mailOptions = {
        from: envVars.EMAIL_USER,
        to: trimmedEmail,
        subject: 'Rights Diagnostics - Login Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 10px;">Login Verification</h2>
              <p style="color: #666; font-size: 16px;">Rights Diagnostics</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <p style="color: #555; font-size: 16px; margin-bottom: 20px;">Use the following verification code to login to your Rights Diagnostics account:</p>
              
              <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 2px dashed #28a745; display: inline-block; margin: 20px 0;">
                <h3 style="margin: 0; color: #28a745; font-size: 32px; letter-spacing: 8px;">${otp}</h3>
              </div>
              
              <p style="color: #888; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
            </div>
            
            <div style="background-color: #f1f9ff; padding: 20px; border-left: 4px solid #007bff; border-radius: 4px; margin-bottom: 30px;">
              <p style="margin: 0; color: #333; font-weight: bold;">Need Help?</p>
              <p style="margin: 10px 0 0; color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
              <p>This is an automated message from Rights Diagnostics. Please do not reply to this email.</p>
            </div>
          </div>
        `
      };
    } else if (context === 're-verification') {
      // Re-verification OTP email template (for periodic verification every 3 months)
      mailOptions = {
        from: envVars.EMAIL_USER,
        to: trimmedEmail,
        subject: 'Rights Diagnostics - Periodic Email Re-verification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 10px;">Periodic Email Verification</h2>
              <p style="color: #666; font-size: 16px;">Rights Diagnostics</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <p style="color: #555; font-size: 16px; margin-bottom: 20px;">As part of our security measures, we require periodic verification of your email address. Please use the following verification code to confirm your email:</p>
              
              <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 2px dashed #9c27b0; display: inline-block; margin: 20px 0;">
                <h3 style="margin: 0; color: #9c27b0; font-size: 32px; letter-spacing: 8px;">${otp}</h3>
              </div>
              
              <p style="color: #888; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
              <p style="color: #666; font-size: 14px; margin-top: 10px;">This verification is required every 3 months to maintain account security.</p>
            </div>
            
            <div style="background-color: #f3e5f5; padding: 20px; border-left: 4px solid #9c27b0; border-radius: 4px; margin-bottom: 30px;">
              <p style="margin: 0; color: #333; font-weight: bold;">Why is this necessary?</p>
              <p style="margin: 10px 0 0; color: #666; font-size: 14px;">We periodically verify contact information to ensure account security and that we can reach you if needed.</p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
              <p>This is an automated message from Rights Diagnostics. Please do not reply to this email.</p>
            </div>
          </div>
        `
      };
    } else {
      // Default registration OTP email template
      mailOptions = {
        from: envVars.EMAIL_USER,
        to: trimmedEmail,
        subject: 'Rights Diagnostics - Email Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 10px;">Email Verification</h2>
              <p style="color: #666; font-size: 16px;">Rights Diagnostics</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <p style="color: #555; font-size: 16px; margin-bottom: 20px;">Thank you for registering with Rights Diagnostics. Please use the following verification code to complete your registration:</p>
              
              <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 2px dashed #e67e22; display: inline-block; margin: 20px 0;">
                <h3 style="margin: 0; color: #e67e22; font-size: 32px; letter-spacing: 8px;">${otp}</h3>
              </div>
              
              <p style="color: #888; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
            </div>
            
            <div style="background-color: #f1f9ff; padding: 20px; border-left: 4px solid #007bff; border-radius: 4px; margin-bottom: 30px;">
              <p style="margin: 0; color: #333; font-weight: bold;">Need Help?</p>
              <p style="margin: 10px 0 0; color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
              <p>This is an automated message from Rights Diagnostics. Please do not reply to this email.</p>
            </div>
          </div>
        `
      };
    }

    // Send email
    console.log("📧 Sending email to:", trimmedEmail);
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully", info.messageId);
      console.log("📊 Email info:", {
        messageId: info.messageId,
        response: info.response
      });
    } catch (emailError) {
      console.error("❌ Email sending failed:", {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command
      });
      throw emailError;
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your email"
    });

  } catch (error) {
    console.error("❌ Send Email OTP Error:", error);

    // Handle environment variable errors
    if (error.message.includes('Missing required environment variables')) {
      return NextResponse.json({
        success: false,
        message: "Server configuration error. Please contact administrator."
      }, { status: 500 });
    }

    // Handle nodemailer specific errors
    if (error.code === 'EAUTH' || error.code === 'EENVELOPE') {
      return NextResponse.json({
        success: false,
        message: "Email configuration error. Please contact administrator."
      }, { status: 500 });
    }

    // Generic error handling
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to send OTP"
    }, { status: 500 });
  }
}