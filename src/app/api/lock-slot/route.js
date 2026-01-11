import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import DBConnection from '../../utils/config/db';
import SlotLock from '../../utils/models/SlotLock';
import Booking from '../../utils/models/Booking';

export async function POST(req) {
    try {
        const { labName, appointmentDate, appointmentTime, userId } = await req.json();

        if (!labName || !appointmentDate || !appointmentTime || !userId) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        await DBConnection();

        // 1. Check if the slot is already BOOKED in the persistent Booking collection
        // Note: We check for 'Confirmed' or 'Pending' bookings. 'Cancelled' ones don't block.
        const existingBooking = await Booking.findOne({
            labName,
            appointmentDate,
            appointmentTime,
            status: { $in: ['Confirmed', 'Pending'] }
        });

        if (existingBooking) {
            return NextResponse.json(
                { success: false, error: 'This slot is already booked', code: 'SLOT_BOOKED' },
                { status: 200 } // Returning 200 but success: false for frontend handling
            );
        }

        // 2. Try to acquire a LOCK on the slot
        // We attempt to insert a new lock document.
        // The unique index on { labName, appointmentDate, appointmentTime } ensures mutual exclusion.
        // If a valid lock exists, insert/create will fail.

        // Lock duration: 5 minutes
        const lockDurationMinutes = 5;
        const expiresAt = new Date(Date.now() + lockDurationMinutes * 60 * 1000);

        try {
            // Create new lock
            await SlotLock.create({
                labName,
                appointmentDate,
                appointmentTime,
                userId,
                expiresAt
            });

            return NextResponse.json({
                success: true,
                message: 'Slot locked successfully',
                expiresAt
            });

        } catch (error) {
            if (error.code === 11000) {
                // E11000 duplicate key error collection -> Slot already locked
                // However, we should check if the existing lock belongs to THIS user.
                // If it's the same user, we can extend the lock.

                const existingLock = await SlotLock.findOne({
                    labName,
                    appointmentDate,
                    appointmentTime
                });

                if (existingLock && existingLock.userId === userId) {
                    // Extend the lock
                    existingLock.expiresAt = expiresAt;
                    await existingLock.save();
                    return NextResponse.json({
                        success: true,
                        message: 'Slot lock extended',
                        expiresAt
                    });
                }

                return NextResponse.json(
                    { success: false, error: 'This slot is temporarily locked by another user', code: 'SLOT_LOCKED' },
                    { status: 200 }
                );
            }
            throw error;
        }

    } catch (error) {
        console.error('Error locking slot:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
