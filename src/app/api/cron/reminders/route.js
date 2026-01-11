import { NextResponse } from 'next/server';
import { sendAppointmentReminders, sendSameDayReminders } from '../../../utils/scheduledJobs/reminderService';

/**
 * GET - Manually trigger appointment reminders
 * This endpoint can be called by a cron job service (e.g., Vercel Cron, GitHub Actions)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || '24hour';
        const apiKey = searchParams.get('apiKey');

        // Simple API key authentication for cron jobs
        // In production, use a secure API key stored in environment variables
        const CRON_API_KEY = process.env.CRON_API_KEY || 'dev-cron-key-12345';

        if (apiKey !== CRON_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        let result;

        if (type === '24hour') {
            // Send 24-hour advance reminders
            result = await sendAppointmentReminders();
        } else if (type === 'sameday') {
            // Send same-day 2-hour reminders
            result = await sendSameDayReminders();
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid reminder type. Use "24hour" or "sameday"' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            type,
            timestamp: new Date().toISOString(),
            ...result,
        });
    } catch (error) {
        console.error('❌ Error in reminder cron job:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST - Test reminder sending for a specific booking
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { bookingId, type = 'test' } = body;

        if (!bookingId) {
            return NextResponse.json(
                { success: false, error: 'Booking ID is required' },
                { status: 400 }
            );
        }

        // Import here to avoid circular dependencies
        const DBConnection = (await import('../../../utils/config/db')).default;
        const Booking = (await import('../../../utils/models/Booking')).default;
        const User = (await import('../../../utils/models/User')).default;
        const { sendAppointmentReminder } = await import('../../../utils/notificationService');

        await DBConnection();

        const booking = await Booking.findOne({ bookingId });

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            );
        }

        let userDetails = {
            email: booking.patientDetails.email,
            phone: booking.patientDetails.contactNumber,
        };

        if (booking.userId) {
            const user = await User.findById(booking.userId);
            if (user) {
                userDetails = {
                    email: user.email || booking.patientDetails.email,
                    phone: user.phone || booking.patientDetails.contactNumber,
                };
            }
        }

        const result = await sendAppointmentReminder(booking, userDetails);

        return NextResponse.json({
            success: true,
            message: 'Test reminder sent',
            bookingId,
            result,
        });
    } catch (error) {
        console.error('❌ Error sending test reminder:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
