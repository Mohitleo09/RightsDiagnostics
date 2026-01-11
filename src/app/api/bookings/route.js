import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import Booking from '../../utils/models/Booking';
import UserModel from '../../utils/models/User';
import mongoose from 'mongoose';
import { sendBookingConfirmation, sendBookingCancellation } from '../../utils/notificationService';

export const runtime = "nodejs";

// GET - Fetch bookings
export async function GET(request) {
  try {
    await DBConnection();

    const { searchParams } = new URL(request.url);
    const labName = searchParams.get('labName');
    const status = searchParams.get('status');
    const bookingId = searchParams.get('bookingId');
    const phone = searchParams.get('phone'); // Fetch by user's phone
    const userId = searchParams.get('userId'); // Fetch by userId
    const couponCode = searchParams.get('couponCode'); // NEW: Fetch by coupon code
    const phoneNumber = searchParams.get('phoneNumber'); // NEW: Alternate phone parameter

    let query = {};

    // Filter by lab name if provided
    if (labName) {
      query.labName = labName;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by booking ID if provided
    if (bookingId) {
      query.bookingId = bookingId;
    }

    // NEW: Filter by coupon code if provided
    if (couponCode) {
      console.log('🎟️ Fetching bookings for coupon code:', couponCode);
      query.couponCode = couponCode.toUpperCase();
    }

    // Filter by phone number (patient's contact number)
    if (phone || phoneNumber) {
      const phoneToSearch = phone || phoneNumber;
      console.log('📞 Fetching bookings for phone:', phoneToSearch);
      query['patientDetails.contactNumber'] = phoneToSearch;
    }

    // Filter by userId if provided
    if (userId) {
      console.log('🆔 Fetching bookings for userId:', userId);
      // Check if userId is a valid ObjectId format
      if (mongoose.Types.ObjectId.isValid(userId)) {
        query.userId = new mongoose.Types.ObjectId(userId);
      } else {
        // If not a valid ObjectId, search by the string value
        query.userId = userId;
      }
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });

    console.log(`✅ Found ${bookings.length} bookings`);

    // Import Vendor model
    const Vendor = (await import('../../utils/models/Vendor')).default;

    // Enrich bookings with vendor address information
    const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
      // Create a plain object from the Mongoose document
      const bookingObj = booking.toObject ? booking.toObject() : booking;

      // If labAddress is missing or empty, try to fetch it from Vendor collection
      if (!bookingObj.labAddress || bookingObj.labAddress.trim() === '') {
        try {
          const vendor = await Vendor.findOne({ labName: bookingObj.labName });
          if (vendor && vendor.address) {
            bookingObj.labAddress = vendor.address;
          }
        } catch (vendorError) {
          console.error('Error fetching vendor address:', vendorError);
        }
      }

      return bookingObj;
    }));

    return NextResponse.json({
      success: true,
      count: enrichedBookings.length,
      bookings: enrichedBookings,
    });
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch bookings',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create new booking
export async function POST(request) {
  try {
    await DBConnection();

    const body = await request.json();

    // Determine if this is a multi-test booking or single test booking
    const isMultiTest = body.tests && Array.isArray(body.tests) && body.tests.length > 0;

    // Validate required fields
    const requiredFields = [
      'bookingId',
      'couponCode',
      'labName',
      'labAddress',
      'appointmentDate',
      'appointmentTime',
      'formattedTime',
      'bookingFor',
      'patientDetails',
    ];

    // Add test-specific required fields for single test bookings
    if (!isMultiTest) {
      requiredFields.push('testName', 'organ', 'price');
    }

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate tests array for multi-test bookings
    if (isMultiTest) {
      for (const test of body.tests) {
        if (!test.testName || !test.organ || !test.price) {
          return NextResponse.json(
            {
              success: false,
              error: 'Each test must have testName, organ, and price',
            },
            { status: 400 }
          );
        }
      }
    }

    // Ensure organ is a string, not an array (for single test bookings)
    let organValue = body.organ;
    if (!isMultiTest && Array.isArray(organValue)) {
      organValue = organValue.join(', ');
    }

    // Validate patient details
    if (!body.patientDetails.contactNumber || !body.patientDetails.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patient contact number and email are required',
        },
        { status: 400 }
      );
    }

    // Check if booking ID already exists
    const existingBooking = await Booking.findOne({ bookingId: body.bookingId });
    if (existingBooking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking ID already exists',
        },
        { status: 409 } // Use 409 Conflict status code
      );
    }

    // Create new booking
    console.log('📝 Creating booking for phone:', body.patientDetails.contactNumber);
    console.log('📝 Multi-test booking:', isMultiTest, 'Tests count:', isMultiTest ? body.tests.length : 1);

    // If labAddress is missing or empty, try to fetch it from Vendor collection
    let labAddress = body.labAddress;
    if (!labAddress || labAddress.trim() === '') {
      try {
        // Import Vendor model
        const Vendor = (await import('../../utils/models/Vendor')).default;
        const vendor = await Vendor.findOne({ labName: body.labName });
        if (vendor && vendor.address) {
          labAddress = vendor.address;
        }
      } catch (vendorError) {
        console.error('Error fetching vendor address:', vendorError);
      }
    }

    // Try to find user by phone number to link the booking
    let linkedUserId = body.userId || null;
    if (!linkedUserId && body.patientDetails.contactNumber) {
      try {
        const user = await UserModel.findOne({ phone: body.patientDetails.contactNumber });
        if (user) {
          linkedUserId = user._id;
          console.log('🔗 Linked booking to user:', user._id);
        }
      } catch (err) {
        console.log('⚠️ Could not link booking to user:', err.message);
      }
    }

    // Validate userId format if provided
    if (body.userId && typeof body.userId === 'string' && body.userId.length !== 24) {
      console.log('⚠️ Invalid userId format, setting to null:', body.userId);
      linkedUserId = null;
    }

    // Prepare booking data
    const bookingDataToSave = {
      bookingId: body.bookingId,
      couponCode: body.couponCode,
      labName: body.labName,
      labAddress: labAddress,
      labRating: body.labRating || '4.5',
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
      formattedTime: body.formattedTime,
      bookingFor: body.bookingFor,
      patientDetails: body.patientDetails,
      status: body.status || 'Confirmed',
      userId: linkedUserId,
      isPackage: body.isPackage || (isMultiTest && body.tests.some(t => t.isPackage)) || false,
    };

    // Add test data based on booking type
    if (isMultiTest) {
      // Multi-test booking: save tests array
      bookingDataToSave.tests = body.tests;

      // Add discount information if applicable
      if (body.discountApplied) {
        bookingDataToSave.discountApplied = body.discountApplied;
        bookingDataToSave.originalAmount = body.originalAmount;
        bookingDataToSave.discountAmount = body.discountAmount;
        bookingDataToSave.finalAmount = body.finalAmount;
        bookingDataToSave.discountType = body.discountType;
        bookingDataToSave.discountValue = body.discountValue;
      }
    } else {
      // Single test booking: use individual fields
      bookingDataToSave.testName = body.testName;
      bookingDataToSave.organ = organValue;
      bookingDataToSave.isPackage = body.isPackage || false;
      bookingDataToSave.price = body.price;

      // Add discount information if applicable
      if (body.discountApplied) {
        bookingDataToSave.discountApplied = body.discountApplied;
        bookingDataToSave.originalAmount = body.originalAmount;
        bookingDataToSave.discountAmount = body.discountAmount;
        bookingDataToSave.finalAmount = body.finalAmount;
        bookingDataToSave.discountType = body.discountType;
        bookingDataToSave.discountValue = body.discountValue;
      }
    }

    const booking = await Booking.create(bookingDataToSave);

    console.log('✅ Booking created:', booking.bookingId, 'with coupon code:', booking.couponCode);

    // Send booking confirmation notifications
    try {
      let userDetails = {
        email: booking.patientDetails.email,
        phone: booking.patientDetails.contactNumber,
      };

      // If user is linked, get their details
      if (linkedUserId) {
        const user = await UserModel.findById(linkedUserId);
        if (user) {
          userDetails = {
            // Prioritize the details entered in the booking form (Step 3)
            // Fallback to user profile details only if form details are missing
            email: booking.patientDetails.email || user.email,
            phone: booking.patientDetails.contactNumber || user.phone,
          };
        }
      }

      // Send multi-channel notification
      await sendBookingConfirmation(booking, userDetails);
      console.log('📧 Booking confirmation notifications sent');
    } catch (notificationError) {
      // Don't fail the booking if notification fails
      console.error('⚠️ Failed to send booking confirmation:', notificationError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Booking created successfully',
        booking: booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update booking
export async function PUT(request) {
  try {
    await DBConnection();

    const body = await request.json();
    const { bookingId, updates } = body;

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking ID is required',
        },
        { status: 400 }
      );
    }

    // Ensure organ is a string, not an array, if it's being updated
    if (updates && updates.organ && Array.isArray(updates.organ)) {
      updates.organ = updates.organ.join(', ');
    }

    // Get the current booking before update
    const currentBooking = await Booking.findOne({ bookingId: bookingId });

    if (!currentBooking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // If labAddress is being updated and is missing or empty, try to fetch it from Vendor collection
    if (updates && (!updates.labAddress || updates.labAddress.trim() === '')) {
      try {
        // Import Vendor model
        const Vendor = (await import('../../utils/models/Vendor')).default;
        const vendor = await Vendor.findOne({ labName: currentBooking.labName });
        if (vendor && vendor.address) {
          updates.labAddress = vendor.address;
        }
      } catch (vendorError) {
        console.error('Error fetching vendor address:', vendorError);
      }
    }

    // If status is being updated to "Completed", expire the coupon code
    if (updates && (updates.status === 'Completed' || updates.status === 'completed')) {
      console.log('Attempting to expire coupon for booking:', bookingId);

      if (currentBooking && currentBooking.couponCode) {
        console.log('Found booking with coupon code:', currentBooking.couponCode);
        // Import Coupon model
        const Coupon = (await import('../../utils/models/Coupon')).default;

        // Try both original case and uppercase
        const searchCode = currentBooking.couponCode.toUpperCase();
        console.log('Searching for coupon with code:', searchCode);

        // Expire the coupon by setting isActive to false
        const updatedCoupon = await Coupon.findOneAndUpdate(
          { code: searchCode },
          { isActive: false },
          { new: true }
        );
        console.log('Coupon update result:', updatedCoupon);
        if (!updatedCoupon) {
          console.log('Warning: No coupon found with code:', searchCode);
          // Also try with original case
          const originalCaseCoupon = await Coupon.findOneAndUpdate(
            { code: currentBooking.couponCode },
            { isActive: false },
            { new: true }
          );
          console.log('Original case coupon update result:', originalCaseCoupon);
          if (!originalCaseCoupon) {
            console.log('Warning: No coupon found with original case code:', currentBooking.couponCode);
          }
        }
      } else {
        console.log('No coupon code found for booking:', bookingId);
      }
    }

    // If status is being updated to "Cancelled", send cancellation notification
    if (updates && updates.status === 'Cancelled' && currentBooking.status !== 'Cancelled') {
      try {
        let userDetails = {
          email: currentBooking.patientDetails.email,
          phone: currentBooking.patientDetails.contactNumber,
        };

        if (currentBooking.userId) {
          const user = await UserModel.findById(currentBooking.userId);
          if (user) {
            userDetails = {
              email: user.email || currentBooking.patientDetails.email,
              phone: user.phone || currentBooking.patientDetails.contactNumber,
            };
          }
        }

        // Send cancellation notification
        await sendBookingCancellation(
          currentBooking,
          userDetails,
          updates.cancelledBy || 'vendor',
          updates.cancellationReason || ''
        );
        console.log('📧 Booking cancellation notifications sent');
      } catch (notificationError) {
        console.error('⚠️ Failed to send cancellation notification:', notificationError);
      }
    }

    const booking = await Booking.findOneAndUpdate(
      { bookingId: bookingId },
      updates,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      booking: booking,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update booking',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/Delete booking
export async function DELETE(request) {
  try {
    await DBConnection();

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking ID is required',
        },
        { status: 400 }
      );
    }

    const booking = await Booking.findOneAndDelete({ bookingId: bookingId });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully',
      booking: booking,
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete booking',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
