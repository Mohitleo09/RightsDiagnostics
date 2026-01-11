import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import SupportMessage from "../../utils/models/SupportMessage";

export const runtime = 'nodejs';

// Validate environment variables
const validateEnvVars = () => {
  const requiredVars = {
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL || "rightlabs.hi9@gmail.com"
  };

  const missing = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return requiredVars;
};

// Function to send emails asynchronously without blocking the response
const sendEmailAsync = async (transporter, mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email sending failed:", error.message);
  }
};

export async function POST(req) {
  try {
    const requestBody = await req.json();

    const { name, email, subject, phoneNumber, message } = requestBody;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({
        success: false,
        message: "Please fill in all required fields"
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: "Please enter a valid email address"
      }, { status: 400 });
    }

    // Validate phone number (if provided)
    if (phoneNumber) {
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
        return NextResponse.json({
          success: false,
          message: "Please enter a valid phone number"
        }, { status: 400 });
      }
    }

    // Store message in database for admin support panel
    let savedMessage = null;
    try {
      const supportMessage = new SupportMessage({
        name,
        email,
        subject,
        message,
        phone: phoneNumber || ''
      });

      savedMessage = await supportMessage.save();
    } catch (dbError) {
      console.error("Error saving message to database:", dbError);
    }

    // Validate environment variables
    const envVars = validateEnvVars();

    // Remove spaces from App Password if present
    const emailPass = envVars.EMAIL_PASS ? envVars.EMAIL_PASS.replace(/\s+/g, '') : envVars.EMAIL_PASS;

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: envVars.EMAIL_USER,
        pass: emailPass
      }
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (transporterError) {
      throw new Error(`Email transporter configuration error: ${transporterError.message}`);
    }

    // Define mail options for the contact form
    const mailOptions = {
      from: envVars.EMAIL_USER,
      to: envVars.CONTACT_EMAIL,
      replyTo: email,
      subject: `Contact Form Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 10px;">New Contact Form Submission</h2>
            <p style="color: #666; font-size: 16px;">Rights Diagnostics - Help & Support</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #333; margin-top: 0;">Message Details</h3>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong style="color: #555;">Name:</strong> ${name}</p>
              <p style="margin: 5px 0;"><strong style="color: #555;">Email:</strong> ${email}</p>
              ${phoneNumber ? `<p style="margin: 5px 0;"><strong style="color: #555;">Phone:</strong> ${phoneNumber}</p>` : ''}
              <p style="margin: 5px 0;"><strong style="color: #555;">Subject:</strong> ${subject}</p>
            </div>
            
            <div style="margin-top: 25px;">
              <p style="margin: 5px 0;"><strong style="color: #555;">Message:</strong></p>
              <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border-left: 4px solid #e67e22; margin-top: 10px;">
                <p style="margin: 0; color: #444;">${message.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            <p>This message was sent from the Rights Diagnostics contact form.</p>
          </div>
        </div>
      `
    };

    // Send email asynchronously without blocking the response
    sendEmailAsync(transporter, mailOptions);

    // Also send a confirmation email to the user asynchronously
    const confirmationMailOptions = {
      from: envVars.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting Rights Diagnostics",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 10px;">Thank You for Contacting Us!</h2>
            <p style="color: #666; font-size: 16px;">Rights Diagnostics - Help & Support</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #333; margin-top: 0;">We've Received Your Message</h3>
            
            <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
              Hi ${name},<br><br>
              Thank you for reaching out to us. We've received your message regarding "${subject}" and our support team will get back to you as soon as possible.
            </p>
            
            <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin: 20px 0;">
              <p style="margin: 0; color: #444;"><strong>Your Message:</strong></p>
              <p style="margin: 10px 0 0; color: #666;">${message.substring(0, 100)}${message.length > 100 ? '...' : ''}</p>
            </div>
            
            <p style="color: #555; font-size: 16px; margin-top: 20px;">
              We typically respond within 24 hours. If you need immediate assistance, please call us at <strong>+91 7799456356</strong>.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            <p>This is an automated confirmation. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    // Send confirmation email asynchronously
    sendEmailAsync(transporter, confirmationMailOptions);

    // Return success response immediately without waiting for emails
    return NextResponse.json({
      success: true,
      message: "Message sent successfully! We'll get back to you soon."
    });

  } catch (error) {
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
      message: error.message || "Failed to send message. Please try again later."
    }, { status: 500 });
  }
}