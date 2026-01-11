import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import SupportMessage from "../../../../utils/models/SupportMessage";

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

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const { replyMessage, userEmail, userName, originalSubject, hasAttachments } = await req.json();
    
    // Validate required fields
    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Message ID is required"
      }, { status: 400 });
    }
    
    if ((!replyMessage && !hasAttachments) || !userEmail || !userName || !originalSubject) {
      return NextResponse.json({
        success: false,
        message: "Either message content or attachments are required"
      }, { status: 400 });
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
    await transporter.verify();

    // Define mail options for the reply with improved template
    const mailOptions = {
      from: envVars.EMAIL_USER,
      to: userEmail,
      subject: `Re: ${originalSubject}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>RightsLab Support Response</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8f9fa;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #FF6E09 0%, #e65100 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .header p {
              margin: 5px 0 0;
              font-size: 16px;
              opacity: 0.9;
            }
            .content {
              padding: 30px;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #2c3e50;
            }
            .message-box {
              background-color: #f8f9fa;
              border-left: 4px solid #FF6E09;
              border-radius: 0 8px 8px 0;
              padding: 20px;
              margin: 25px 0;
            }
            .message-box h3 {
              margin-top: 0;
              color: #FF6E09;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .message-box p {
              margin: 0;
              color: #444;
              line-height: 1.7;
              white-space: pre-wrap;
            }
            .footer {
              background-color: #f1f3f5;
              padding: 20px 30px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
            .signature {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #e9ecef;
            }
            .signature p {
              margin: 5px 0;
            }
            .contact-info {
              margin-top: 15px;
              padding: 15px;
              background-color: #fff8e1;
              border-radius: 6px;
              font-size: 14px;
            }
            .contact-info p {
              margin: 5px 0;
            }
            .note {
              background-color: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 15px;
              border-radius: 0 4px 4px 0;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>RightsLab Support Team</h1>
              <p>Help & Support Response</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hello ${userName},</p>
              
              <p>Thank you for contacting RightsLab support. We appreciate you reaching out to us and are committed to providing you with the best assistance possible.</p>
              
              <p>Here is our response to your inquiry:</p>
              
              <div class="message-box">
                <h3>Support Team Response</h3>
                <p>${replyMessage ? replyMessage.replace(/\n/g, '<br>') : 'Please see the attached files for additional information.'}</p>
              </div>
              
              ${hasAttachments ? `
              <div class="note">
                <p><strong>Note:</strong> This message includes attachments. Please check your email client to view any attached files.</p>
              </div>
              ` : ''}
              
              <p>If you have any further questions or need additional assistance, please don't hesitate to reach out to us again. We're here to help!</p>
              
              <div class="signature">
                <p>Best regards,</p>
                <p><strong>The RightsLab Support Team</strong></p>
              </div>
              
              <div class="contact-info">
                <p><strong>Contact Information:</strong></p>
                <p>📧 Email: rightlabs.hi9@gmail.com</p>
                <p>📱 Phone: +91 7799456356 (Available 24/7)</p>
                <p>🌐 Website: www.rightslab.com</p>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated response from RightsLab support team.</p>
              <p>© ${new Date().getFullYear()} RightsLab. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send reply email
    const info = await transporter.sendMail(mailOptions);
    
    // Update message status to 'replied' in database
    try {
      await SupportMessage.findByIdAndUpdate(
        id,
        { 
          status: 'replied',
          updatedAt: Date.now()
        }
      );
      console.log("✅ Message status updated to 'replied' in database");
    } catch (dbError) {
      console.error("❌ Error updating message status in database:", dbError);
      // Continue even if database update fails
    }
    
    return NextResponse.json({
      success: true,
      message: "Reply sent successfully"
    });

  } catch (error) {
    console.error("❌ Error sending reply:", error);
    
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
      message: error.message || "Failed to send reply. Please try again later." 
    }, { status: 500 });
  }
}