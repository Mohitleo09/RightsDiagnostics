import nodemailer from 'nodemailer';
import twilio from 'twilio';
import DBConnection from './config/db';
import Notification from './models/Notification';

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Initialize Email transporter
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send Email Notification
 */
export async function sendEmail({ to, subject, html, text }) {
    try {
        const info = await emailTransporter.sendMail({
            from: `"Rights Diagnostics" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });

        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send SMS Notification
 */
export async function sendSMS({ to, message }) {
    console.log("📱 sendSMS called with new logic (v2)");
    try {
        // Clean the phone number (remove spaces, dashes, parentheses)
        let cleanedPhone = to.replace(/[\s\-\(\)]/g, '');

        // Ensure phone number is in E.164 format (+[country code][number])
        let formattedPhone;

        if (cleanedPhone.startsWith('+')) {
            // Already has country code
            formattedPhone = cleanedPhone;
        } else if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) {
            // 12 digit number starting with 91 (India format without +)
            formattedPhone = `+${cleanedPhone}`;
        } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith('0')) {
            // 11 digit number starting with 0 (India format with leading 0)
            formattedPhone = `+91${cleanedPhone.substring(1)}`;
        } else if (cleanedPhone.length === 10) {
            // 10-digit number: Default to India (+91) as primary user base
            formattedPhone = `+91${cleanedPhone}`;
        } else {
            // Default fallback: Add +91 if no other format matches, or keep as is if too short/long (might fail validation but better than wrong country)
            formattedPhone = `+91${cleanedPhone}`;
        }

        console.log(`📱 Sending SMS to: ${formattedPhone} (original: ${to})`);

        const smsResult = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone,
        });

        console.log('✅ SMS sent:', smsResult.sid);
        return { success: true, sid: smsResult.sid };
    } catch (error) {
        console.error('❌ SMS sending failed:', error);
        console.error('   Phone number:', to);
        console.error('   Error details:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Create In-App Notification
 */
export async function createInAppNotification({
    userId,
    userType,
    title,
    message,
    type,
    priority = 'medium',
    link = null,
    data = null,
}) {
    try {
        await DBConnection();

        const notification = await Notification.create({
            userId,
            userType,
            title,
            message,
            type,
            priority,
            link,
            data,
        });

        console.log('✅ In-app notification created:', notification._id);
        return { success: true, notification };
    } catch (error) {
        console.error('❌ In-app notification creation failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send Push Notification (Placeholder for FCM/OneSignal integration)
 */
export async function sendPushNotification({ userId, title, body, data }) {
    try {
        // TODO: Implement FCM or OneSignal push notification
        // This is a placeholder for future implementation
        console.log('📱 Push notification (placeholder):', { userId, title, body });

        // Example FCM implementation would go here:
        // const message = {
        //   notification: { title, body },
        //   data: data || {},
        //   token: userDeviceToken,
        // };
        // await admin.messaging().send(message);

        return { success: true, message: 'Push notification queued' };
    } catch (error) {
        console.error('❌ Push notification failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send Multi-Channel Notification
 * Sends notification via email, SMS, in-app, and push
 */
export async function sendMultiChannelNotification({
    // User details
    userId,
    userType,
    email,
    phone,

    // Notification content
    title,
    message,
    type,
    priority = 'medium',

    // Channel preferences
    channels = ['email', 'sms', 'inApp', 'push'],

    // Additional data
    link = null,
    data = null,

    // Email specific
    emailSubject = null,
    emailHtml = null,
}) {
    console.log('🔔 sendMultiChannelNotification called');
    console.log('   Channels:', channels);
    console.log('   Email:', email);
    console.log('   Phone:', phone);
    console.log('   Title:', title);

    const results = {
        email: null,
        sms: null,
        inApp: null,
        push: null,
    };

    try {
        // Send Email
        if (channels.includes('email') && email) {
            console.log('📧 Attempting to send email...');
            results.email = await sendEmail({
                to: email,
                subject: emailSubject || title,
                text: message,
                html: emailHtml || `<div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #f97316;">${title}</h2>
          <p>${message}</p>
          ${link ? `<a href="${link}" style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Details</a>` : ''}
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">This is an automated message from Rights Diagnostics. Please do not reply to this email.</p>
        </div>`,
            });
            console.log('📧 Email result:', results.email.success ? '✅ Success' : '❌ Failed');
        } else {
            console.log('📧 Email skipped - Channel:', channels.includes('email'), 'Email provided:', !!email);
        }

        // Send SMS
        if (channels.includes('sms') && phone) {
            console.log('📱 Attempting to send SMS...');
            console.log('   Phone number:', phone);
            console.log('   Message:', message.substring(0, 50) + '...');

            results.sms = await sendSMS({
                to: phone,
                message: `${title}\n\n${message}${link ? `\n\nView: ${link}` : ''}`,
            });

            console.log('📱 SMS result:', results.sms.success ? '✅ Success' : '❌ Failed');
            if (!results.sms.success) {
                console.error('📱 SMS error details:', results.sms.error);
            }
        } else {
            console.log('📱 SMS skipped - Channel:', channels.includes('sms'), 'Phone provided:', !!phone);
        }

        // Create In-App Notification
        if (channels.includes('inApp') && userId) {
            console.log('🔔 Attempting to create in-app notification...');
            results.inApp = await createInAppNotification({
                userId,
                userType,
                title,
                message,
                type,
                priority,
                link,
                data,
            });
            console.log('🔔 In-app result:', results.inApp.success ? '✅ Success' : '❌ Failed');
        } else {
            console.log('🔔 In-app skipped - Channel:', channels.includes('inApp'), 'UserId provided:', !!userId);
        }

        // Send Push Notification
        if (channels.includes('push') && userId) {
            console.log('📲 Attempting to send push notification...');
            results.push = await sendPushNotification({
                userId,
                title,
                body: message,
                data,
            });
            console.log('📲 Push result:', results.push.success ? '✅ Success' : '❌ Failed');
        } else {
            console.log('📲 Push skipped - Channel:', channels.includes('push'), 'UserId provided:', !!userId);
        }

        console.log('🔔 Multi-channel notification complete');
        console.log('   Results:', {
            email: results.email?.success,
            sms: results.sms?.success,
            inApp: results.inApp?.success,
            push: results.push?.success,
        });

        return {
            success: true,
            results,
        };
    } catch (error) {
        console.error('❌ Multi-channel notification failed:', error);
        return {
            success: false,
            error: error.message,
            results,
        };
    }
}

export async function sendBookingConfirmation(booking, userDetails) {
    console.log('📧 sendBookingConfirmation called');
    console.log('   Booking ID:', booking.bookingId);
    console.log('   User Details:', {
        email: userDetails.email,
        phone: userDetails.phone,
    });
    console.log('   Booking Details:', {
        email: booking.patientDetails.email,
        phone: booking.patientDetails.contactNumber,
    });

    const title = '🎉 Booking Confirmed!';
    const message = `Your booking for ${booking.testName} at ${booking.labName} on ${booking.appointmentDate} at ${booking.formattedTime} has been confirmed. Booking ID: ${booking.bookingId}. Coupon Code: ${booking.couponCode}`;

    console.log('   Calling sendMultiChannelNotification...');

    return await sendMultiChannelNotification({
        userId: booking.userId,
        userType: 'patient',
        email: userDetails.email || booking.patientDetails.email,
        phone: userDetails.phone || booking.patientDetails.contactNumber,
        title,
        message,
        type: 'booking',
        priority: 'high',
        channels: ['email', 'sms', 'inApp'],
        link: `/Patients/bookings/${booking.bookingId}`,
        data: { bookingId: booking.bookingId },
        emailSubject: 'Booking Confirmation - Rights Diagnostics',
        emailHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #f97316; margin-bottom: 20px;">🎉 Booking Confirmed!</h1>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Dear ${booking.patientDetails.patientName || 'Patient'},
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
            Your diagnostic test booking has been successfully confirmed. Here are your booking details:
          </p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px; border-radius: 5px;">
            <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p style="margin: 5px 0;"><strong>Test:</strong> ${booking.testName}</p>
            <p style="margin: 5px 0;"><strong>Lab:</strong> ${booking.labName}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${booking.labAddress}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${booking.appointmentDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.formattedTime}</p>
            <p style="margin: 5px 0;"><strong>Price:</strong> ₹${booking.price}</p>
          </div>

          <!-- Coupon Code Section with Copy Button -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <p style="color: white; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">🎟️ Your Exclusive Coupon Code</p>
            <div style="background: white; border-radius: 6px; padding: 15px; display: inline-block; min-width: 200px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <span style="font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; font-family: 'Courier New', monospace;">${booking.couponCode}</span>
                <button onclick="navigator.clipboard.writeText('${booking.couponCode}'); this.innerHTML='✓ Copied!'; setTimeout(() => this.innerHTML='📋', 2000);" 
                        style="background: #667eea; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 16px; transition: all 0.3s;">
                  📋
                </button>
              </div>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #6b7280;">Click the icon to copy</p>
            </div>
            <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 10px 0 0 0;">Save this code for future bookings and exclusive offers!</p>
          </div>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>📋 Important:</strong> Please arrive 15 minutes before your scheduled time. Bring a valid ID and any previous medical records if applicable.
            </p>
          </div>
          
          <a href="${process.env.NEXTAUTH_URL}/Patients/bookings/${booking.bookingId}" 
             style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; font-weight: bold;">
            View Booking Details
          </a>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Need help? Contact us at ${process.env.EMAIL_USER} or visit our support page.
          </p>
        </div>
      </div>
    `,
    });
}

/**
 * Appointment Reminder (24 hours before)
 */
export async function sendAppointmentReminder(booking, userDetails) {
    const title = '⏰ Appointment Reminder';
    const message = `Reminder: You have an appointment for ${booking.testName} at ${booking.labName} tomorrow at ${booking.formattedTime}. Booking ID: ${booking.bookingId}`;

    return await sendMultiChannelNotification({
        userId: booking.userId,
        userType: 'patient',
        email: userDetails.email || booking.patientDetails.email,
        phone: userDetails.phone || booking.patientDetails.contactNumber,
        title,
        message,
        type: 'reminder',
        priority: 'high',
        channels: ['email', 'sms', 'inApp', 'push'],
        link: `/Patients/bookings/${booking.bookingId}`,
        data: { bookingId: booking.bookingId },
        emailSubject: 'Appointment Reminder - Tomorrow',
    });
}

/**
 * Booking Cancellation Notification
 */
export async function sendBookingCancellation(booking, userDetails, cancelledBy = 'vendor', reason = '') {
    const title = '❌ Booking Cancelled';
    const message = cancelledBy === 'vendor'
        ? `Your booking for ${booking.testName} at ${booking.labName} on ${booking.appointmentDate} has been cancelled by the lab. ${reason ? `Reason: ${reason}` : ''} Please reschedule at your convenience.`
        : `Your booking for ${booking.testName} has been successfully cancelled.`;

    return await sendMultiChannelNotification({
        userId: booking.userId,
        userType: 'patient',
        email: userDetails.email || booking.patientDetails.email,
        phone: userDetails.phone || booking.patientDetails.contactNumber,
        title,
        message,
        type: 'booking',
        priority: 'urgent',
        channels: ['email', 'sms', 'inApp', 'push'],
        link: cancelledBy === 'vendor' ? '/Patients/FindTests' : `/Patients/bookings`,
        data: { bookingId: booking.bookingId, cancelledBy, reason },
        emailSubject: 'Booking Cancellation Notice',
        emailHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #dc2626; margin-bottom: 20px;">❌ Booking Cancelled</h1>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Dear ${booking.patientDetails.patientName || 'Patient'},
          </p>
          
          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 20px; border-radius: 5px;">
            <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p style="margin: 5px 0;"><strong>Test:</strong> ${booking.testName}</p>
            <p style="margin: 5px 0;"><strong>Lab:</strong> ${booking.labName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${booking.appointmentDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.formattedTime}</p>
            ${reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          
          ${cancelledBy === 'vendor' ? `
            <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>💡 Next Steps:</strong> We apologize for the inconvenience. Please book another appointment at your convenience. You may also contact the lab directly for more information.
              </p>
            </div>
            
            <a href="${process.env.NEXTAUTH_URL}/Patients/FindTests" 
               style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; font-weight: bold;">
              Book Another Test
            </a>
          ` : ''}
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Need help? Contact us at ${process.env.EMAIL_USER}
          </p>
        </div>
      </div>
    `,
    });
}

/**
 * Payment Confirmation Notification
 */
export async function sendPaymentConfirmation(payment, booking, userDetails) {
    const title = '✅ Payment Successful';
    const message = `Your payment of ₹${payment.amount} for booking ${booking.bookingId} has been successfully processed. Transaction ID: ${payment.transactionId}`;

    return await sendMultiChannelNotification({
        userId: payment.userId,
        userType: 'patient',
        email: userDetails.email,
        phone: userDetails.phone,
        title,
        message,
        type: 'payment',
        priority: 'high',
        channels: ['email', 'sms', 'inApp'],
        link: `/Patients/bookings/${booking.bookingId}`,
        data: { paymentId: payment._id, bookingId: booking.bookingId },
        emailSubject: 'Payment Confirmation - Rights Diagnostics',
    });
}

/**
 * Vendor Notification for New Booking
 */
export async function sendVendorBookingNotification(booking, vendorDetails) {
    const title = '🔔 New Booking Received';
    const message = `New booking received for ${booking.testName} on ${booking.appointmentDate} at ${booking.formattedTime}. Booking ID: ${booking.bookingId}`;

    return await sendMultiChannelNotification({
        userId: vendorDetails._id,
        userType: 'vendor',
        email: vendorDetails.email,
        phone: vendorDetails.phone,
        title,
        message,
        type: 'booking',
        priority: 'high',
        channels: ['email', 'sms', 'inApp', 'push'],
        link: `/vendor/bookings/${booking.bookingId}`,
        data: { bookingId: booking.bookingId },
        emailSubject: 'New Booking Notification',
    });
}

export default {
    sendEmail,
    sendSMS,
    createInAppNotification,
    sendPushNotification,
    sendMultiChannelNotification,
    sendBookingConfirmation,
    sendAppointmentReminder,
    sendBookingCancellation,
    sendPaymentConfirmation,
    sendVendorBookingNotification,
};
