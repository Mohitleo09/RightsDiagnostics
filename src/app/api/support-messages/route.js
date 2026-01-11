import { NextResponse } from "next/server";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import SupportMessage from "../../utils/models/SupportMessage";

export const runtime = 'nodejs';

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASSWORD,
  },
});

export async function GET(req) {
  try {
    // In a real application, you would check if the user is authenticated and has admin privileges
    // For this demo, we're just returning the messages

    // Fetch all support messages from database, sorted by createdAt descending
    const messages = await SupportMessage.find({}).sort({ createdAt: -1 });

    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      name: msg.name,
      email: msg.email,
      subject: msg.subject,
      message: msg.message,
      phone: msg.phone,
      status: msg.status,
      archived: msg.archived || false,
      date: msg.createdAt.toISOString()
    }));

    console.log('Returning messages:', formattedMessages);

    return NextResponse.json({
      success: true,
      messages: formattedMessages
    });
  } catch (error) {
    console.error("❌ Error fetching support messages:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch support messages"
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const messageData = await req.json();
    console.log('Received message data:', messageData);

    // In a real application, you would check if the user is authenticated and has admin privileges

    // Validate required fields
    if (!messageData.name || !messageData.email || !messageData.subject || !messageData.message) {
      console.log('Missing required fields:', {
        name: messageData.name,
        email: messageData.email,
        subject: messageData.subject,
        message: messageData.message
      });
      return NextResponse.json({
        success: false,
        message: "Missing required fields"
      }, { status: 400 });
    }

    // Create new support message
    const newMessage = new SupportMessage({
      name: messageData.name,
      email: messageData.email,
      subject: messageData.subject,
      message: messageData.message,
      phone: messageData.phone || '',
      status: messageData.status || 'sent',
      archived: messageData.archived || false
    });

    console.log('Creating new message:', newMessage);

    const savedMessage = await newMessage.save();
    console.log('Saved message:', savedMessage);

    // Send emails to recipients if this is a sent message
    if (messageData.status === 'sent' && messageData.recipients && Array.isArray(messageData.recipients)) {
      try {
        // Send email to each recipient
        for (const recipient of messageData.recipients) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER || process.env.SMTP_USER,
            to: recipient,
            subject: messageData.subject,
            text: messageData.message,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f8f8; border-radius: 8px;">
                <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 20px;">
                    <h2 style="color: #333333; margin: 0;">${messageData.subject}</h2>
                  </div>
                  <div style="color: #555555; line-height: 1.6;">
                    <p>${messageData.message.replace(/\n/g, '</p><p>')}</p>
                  </div>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; color: #888888; font-size: 14px;">
                    <p>This message was sent from the Rights Diagnostics Support team.</p>
                  </div>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #888888; font-size: 12px;">
                  <p>© ${new Date().getFullYear()} Rights Diagnostics Support Team. All rights reserved.</p>
                </div>
              </div>
            `,
          });
        }
        console.log('Emails sent successfully to:', messageData.recipients);
      } catch (emailError) {
        console.error("❌ Error sending emails:", emailError);
        // Note: We don't return an error here because the message was saved successfully
        // The email sending failure is logged but doesn't prevent the message from being saved
      }
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      savedMessage: {
        id: savedMessage._id.toString(),
        name: savedMessage.name,
        email: savedMessage.email,
        subject: savedMessage.subject,
        message: savedMessage.message,
        phone: savedMessage.phone,
        status: savedMessage.status,
        archived: savedMessage.archived,
        date: savedMessage.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to send message: " + error.message
    }, { status: 500 });
  }
}