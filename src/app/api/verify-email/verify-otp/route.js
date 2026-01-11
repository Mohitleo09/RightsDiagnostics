import verificationStore from "../../../utils/verificationStore";
import DBConnection from "../../../utils/config/db";
import UserModel from "../../../utils/models/User";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    console.log("📧 Starting email OTP verification process");

    // Log raw request info
    console.log("📧 Request headers:", Object.fromEntries(req.headers.entries()));
    console.log("📧 Request method:", req.method);

    // Try to parse the request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("📧 Request data parsed successfully:", requestData);
    } catch (parseError) {
      console.error("📧 Failed to parse request body:", parseError);
      return Response.json(
        { success: false, error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { email, code } = requestData;

    console.log("📧 Email OTP verification request:", { email, code });
    console.log("📧 Email type:", typeof email, "Code type:", typeof code);
    console.log("📧 Email length:", email ? email.length : 0, "Code length:", code ? code.length : 0);
    console.log("📧 Email value:", JSON.stringify(email), "Code value:", JSON.stringify(code));

    // Additional debugging for whitespace and special characters
    if (email) {
      console.log("📧 Email detailed analysis:", {
        original: email,
        trimmed: email.trim(),
        lowercased: email.toLowerCase(),
        normalized: email.trim().toLowerCase(),
        hasLeadingSpace: email.startsWith(' '),
        hasTrailingSpace: email.endsWith(' '),
        hasMultipleSpaces: email.includes('  '),
        charCodes: email.split('').map(c => c.charCodeAt(0))
      });
    }

    if (code) {
      console.log("📧 Code detailed analysis:", {
        original: code,
        trimmed: code.trim(),
        hasLeadingSpace: code.startsWith(' '),
        hasTrailingSpace: code.endsWith(' '),
        hasMultipleSpaces: code.includes('  '),
        charCodes: code.split('').map(c => c.charCodeAt(0))
      });
    }

    // Validate inputs
    if (!email || !code) {
      console.log("📧 Missing email or code");
      return Response.json(
        { success: false, error: "Email and OTP code are required" },
        { status: 400 }
      );
    }

    // Additional validation
    if (typeof email !== 'string' || typeof code !== 'string') {
      console.log("📧 Invalid data types for email or code");
      return Response.json(
        { success: false, error: "Email and OTP code must be strings" },
        { status: 400 }
      );
    }

    // Trim inputs for consistency
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    console.log("📧 After trimming - Email:", trimmedEmail, "Code:", trimmedCode);

    if (!trimmedEmail || !trimmedCode) {
      console.log("📧 Email or code is empty after trimming");
      return Response.json(
        { success: false, error: "Email and OTP code cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
      console.log("📧 Invalid OTP format");
      return Response.json(
        { success: false, error: "OTP must be a 6-digit number" },
        { status: 400 }
      );
    }

    // Check if we're in development mode
    const bypassEnabled = process.env.ENABLE_OTP_BYPASS === 'true';

    let verified = false;

    if (bypassEnabled && trimmedCode === '123456') {
      // In development mode, accept the default code
      verified = true;
      verificationStore.markEmailVerified(trimmedEmail);
      console.log("🔧 Development Mode: Email verified successfully");
    } else {
      // Verify OTP using trimmed email
      console.log("📧 Attempting to verify OTP with verification store");
      // Let's try multiple normalization approaches to ensure compatibility
      verified = verificationStore.verifyEmailOtp(trimmedEmail, trimmedCode);
      console.log("📧 Verification store result:", verified);

      // If not verified, let's try with lowercase
      if (!verified) {
        console.log("📧 Trying with lowercase email");
        verified = verificationStore.verifyEmailOtp(trimmedEmail.toLowerCase(), trimmedCode);
        console.log("📧 Lowercase verification result:", verified);
      }
    }

    console.log("📧 Email OTP verification result:", verified);

    // Additional debugging
    if (verified) {
      console.log("📧 Email verification successful for:", trimmedEmail);
      console.log("📧 All verified emails after verification:", Array.from(verificationStore.verifiedEmails.keys()));

      // Update user verification status in database
      try {
        await DBConnection();
        const user = await UserModel.findOne({ email: trimmedEmail });
        if (user) {
          user.isVerified = true;
          // If phone is also verified, mark user as fully verified
          if (user.isPhoneVerified) {
            user.isPhoneVerified = true;
          }
          await user.save();
          console.log('✅ User verification status updated in database');
        } else {
          console.log('⚠️ User not found in database for email:', trimmedEmail);
        }
      } catch (dbError) {
        console.error('❌ Error updating user verification status:', dbError);
      }
    } else {
      console.log("📧 Email verification failed for:", trimmedEmail);
      console.log("📧 All verified emails:", Array.from(verificationStore.verifiedEmails.keys()));
      console.log("📧 All email OTPs:", Array.from(verificationStore.emailOtps.keys()));

      // Additional debugging for failed verification
      const storedOtp = verificationStore.emailOtps.get(trimmedEmail);
      if (storedOtp) {
        console.log("📧 Stored OTP for this email:", storedOtp);
        console.log("📧 Comparing OTPs - Stored:", storedOtp.otp, "Received:", trimmedCode);
        console.log("📧 OTPs match:", storedOtp.otp === trimmedCode);
      } else {
        console.log("📧 No stored OTP found for email:", trimmedEmail);
        // Check with all stored emails
        const allStoredEmails = Array.from(verificationStore.emailOtps.keys());
        console.log("📧 All stored emails:", allStoredEmails);
        for (const storedEmail of allStoredEmails) {
          if (storedEmail.toLowerCase().trim() === trimmedEmail.toLowerCase().trim()) {
            console.log("📧 Found matching email with different format:", storedEmail);
            const storedOtpForMatch = verificationStore.emailOtps.get(storedEmail);
            console.log("📧 Stored OTP for matching email:", storedOtpForMatch);
          }
        }
      }
    }

    if (verified) {
      // Update user verification status in database
      try {
        await DBConnection();
        const user = await UserModel.findOne({ email: trimmedEmail });
        if (user) {
          user.isVerified = true;
          // If phone is also verified, mark user as fully verified
          if (user.isPhoneVerified) {
            user.isPhoneVerified = true;
          }
          await user.save();
          console.log('✅ User verification status updated in database');
        } else {
          console.log('⚠️ User not found in database for email:', trimmedEmail);
        }
      } catch (dbError) {
        console.error('❌ Error updating user verification status:', dbError);
      }

      // Send success email for re-verification
      try {
        // Create transporter
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : process.env.EMAIL_PASS
          }
        });

        // Check if this is a re-verification by checking if user already exists and is verified
        let isReverification = false;
        try {
          await DBConnection();
          const user = await UserModel.findOne({ email: trimmedEmail });
          if (user && user.isVerified) {
            isReverification = true;
          }
        } catch (dbError) {
          console.error('❌ Error checking user for re-verification:', dbError);
        }

        if (isReverification) {
          // Send re-verification success email
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: trimmedEmail,
            subject: 'Rights Diagnostics - Email Re-verification Successful',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h2 style="color: #333; margin-bottom: 10px;">Email Re-verification Successful</h2>
                  <p style="color: #666; font-size: 16px;">Rights Diagnostics</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
                  <p style="color: #555; font-size: 16px; margin-bottom: 20px;">Your email address has been successfully re-verified. Thank you for maintaining the security of your account.</p>
                  
                  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 2px dashed #4caf50; display: inline-block; margin: 20px 0;">
                    <h3 style="margin: 0; color: #4caf50; font-size: 24px;">✅ Verification Complete</h3>
                  </div>
                  
                  <p style="color: #666; font-size: 14px; margin-top: 10px;">This re-verification is required every 3 months to maintain account security.</p>
                </div>
                
                <div style="background-color: #e8f5e9; padding: 20px; border-left: 4px solid #4caf50; border-radius: 4px; margin-bottom: 30px;">
                  <p style="margin: 0; color: #333; font-weight: bold;">Account Security</p>
                  <p style="margin: 10px 0 0; color: #666; font-size: 14px;">Your account is now secure for the next 3 months. You will be notified when your next re-verification is due.</p>
                </div>
                
                <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
                  <p>This is an automated message from Rights Diagnostics. Please do not reply to this email.</p>
                </div>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          console.log("📧 Re-verification success email sent to:", trimmedEmail);
        }
      } catch (emailError) {
        console.error("❌ Error sending re-verification success email:", emailError);
      }

      return Response.json({
        success: true,
        verified: true,
        message: "Email verified successfully!"
      });
    } else {
      return Response.json(
        { success: false, verified: false, error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Email OTP verification error:", error);
    return Response.json(
      { success: false, error: "Failed to verify email OTP" },
      { status: 500 }
    );
  }
}