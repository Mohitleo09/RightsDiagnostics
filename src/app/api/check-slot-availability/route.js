import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import Booking from '../../utils/models/Booking';
import SlotLock from '../../utils/models/SlotLock';

export const runtime = "nodejs";

export async function POST(request) {
  try {
    await DBConnection();

    const body = await request.json();
    const { labName, appointmentDate, appointmentTime, getAllSlots, userId } = body;

    // Validate required fields
    if (!labName || !appointmentDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: labName and appointmentDate are required',
        },
        { status: 400 }
      );
    }

    // If getAllSlots flag is set, return all booked slots for the date
    if (getAllSlots) {
      // Get confirmed bookings
      const bookings = await Booking.find({
        labName: labName,
        appointmentDate: appointmentDate,
        status: { $in: ['Confirmed', 'Pending'] }
      });

      // Get temporarily locked slots
      // Mongoose TTL index handles deletion, but we can double check logic if needed.
      // We rely on the TTL index or just check effectively.
      const lockedSlots = await SlotLock.find({
        labName: labName,
        appointmentDate: appointmentDate,
        expiresAt: { $gt: new Date() } // manually ensure not expired just in case
      });

      const bookedTimes = bookings.map(booking => booking.appointmentTime);
      const lockedTimes = lockedSlots.map(lock => lock.appointmentTime);

      // Merge unique times
      const allUnavailableSlots = [...new Set([...bookedTimes, ...lockedTimes])];

      return NextResponse.json({
        success: true,
        bookedSlots: allUnavailableSlots
      });
    }

    // Otherwise, check availability for a specific time slot
    if (!appointmentTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'appointmentTime is required when not using getAllSlots',
        },
        { status: 400 }
      );
    }

    // Check bookings
    const existingBooking = await Booking.findOne({
      labName: labName,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      status: { $in: ['Confirmed', 'Pending'] } // Only check active bookings
    });

    // Check temporary locks
    const activeLock = await SlotLock.findOne({
      labName: labName,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      expiresAt: { $gt: new Date() }
    });

    // If a lock exists, check if it belongs to the current user
    // If userId is provided and matches the lock's userId, allow the booking
    const isLockedByCurrentUser = activeLock && userId && activeLock.userId === userId;

    // If a booking exists OR a lock exists (but not by current user), the slot is not available
    const isAvailable = !existingBooking && (!activeLock || isLockedByCurrentUser);

    return NextResponse.json({
      success: true,
      available: isAvailable,
      booking: existingBooking || null,
      locked: !!activeLock,
      lockedByCurrentUser: isLockedByCurrentUser
    });
  } catch (error) {
    console.error('Error checking slot availability:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check slot availability',
        message: error.message,
      },
      { status: 500 }
    );
  }
}