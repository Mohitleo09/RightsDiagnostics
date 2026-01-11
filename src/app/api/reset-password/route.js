import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import UserModel from "../../utils/models/User";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export const runtime = 'nodejs';

export async function POST(req) {
  let transporter;

  try {
    await DBConnection();

    const { phone, email, password } = await req.json();

    // Validate required fields
    if (!password) {
      return NextResponse.json({
        success: false,
        message: "Password is required"
      }, { status: 400 });
    }

    // Check if either phone or email is provided
    if (!phone && !email) {
      return NextResponse.json({
        success: false,
        message: "Phone number or email is required"
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: "Password must be at least 6 characters long"
      }, { status: 400 });
    }

    // Find user by phone number or email
    let user;
    if (phone) {
      user = await UserModel.findOne({ phone });
    } else if (email) {
      user = await UserModel.findOne({ email });
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found with this phone number or email"
      }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    console.log(`✅ Password reset successfully for user: ${phone || email}`);

    // Send password reset confirmation email if email is provided
    if (email) {
      try {
        // Create transporter
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : ''
          }
        });

        // Verify transporter configuration
        await transporter.verify();

        // Define mail options for password reset confirmation
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Rights Diagnostics - Password Reset Confirmation',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Confirmation</h2>
              <p>Hello ${user.name || user.username || 'User'},</p>
              <p>Your password has been successfully reset on Rights Diagnostics.</p>
              <p>If you did not request this change, please contact our support team immediately.</p>
              <div style="background-color: #f8f8f8; padding: 15px; border-left: 4px solid #e67e22; margin: 20px 0;">
                <p><strong>Security Tip:</strong></p>
                <ul style="color: #666;">
                  <li>Use a strong, unique password</li>
                  <li>Enable two-factor authentication if available</li>
                  <li>Never share your password with anyone</li>
                </ul>
              </div>
              <p>Thank you for using Rights Diagnostics!</p>
              <hr style="margin: 30px 0;">
              <p style="font-size: 12px; color: #777;">
                This is an automated message from Rights Diagnostics. Please do not reply to this email.
              </p>
            </div>
          `
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log("✅ Password reset confirmation email sent to:", email);
      } catch (emailError) {
        console.error("❌ Failed to send password reset confirmation email:", emailError);
        // Don't fail the request if email sending fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Password has been changed successfully!"
    });

  } catch (error) {
    console.error("❌ Error resetting password:", error);

    return NextResponse.json({
      success: false,
      message: "Failed to reset password. Please try again."
    }, { status: 500 });
  }
}