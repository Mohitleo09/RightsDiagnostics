import { NextResponse } from 'next/server';
import DBConnection from '../../../utils/config/db';
import Booking from '../../../utils/models/Booking';

export const runtime = "nodejs";

export async function GET() {
  try {
    await DBConnection();
    
    // Count all bookings
    const count = await Booking.countDocuments();
    
    return NextResponse.json({
      success: true,
      count: count,
      message: "Bookings count fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching bookings count:", error);
    return NextResponse.json(
      {
        success: false,
        count: 0,
        error: error.message || "Failed to fetch bookings count"
      },
      { status: 500 }
    );
  }
}