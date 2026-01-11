import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import mongoose from "mongoose";

export const runtime = 'nodejs';

// Coupon Schema
const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: null // For percentage discounts
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  applicableFor: {
    type: String,
    enum: ['all', 'new_users', 'existing_users'],
    default: 'all'
  },
  // Add vendorId to associate coupons with specific vendors
  vendorId: {
    type: String,
    required: false // Make it optional for now, but can be required in future
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// User Schema (simplified for coupon verification)
const UserSchema = new mongoose.Schema({
  phone: String,
  name: String,
  email: String,
  // ... other fields
}, {
  timestamps: true
});

// Create or get models
const CouponModel = mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

// POST - Verify coupon
export async function POST(req) {
  try {
    await DBConnection();

    const { phoneNumber, couponCode, vendorId, orderAmount } = await req.json();

    console.log('🔍 Coupon verification request:', { phoneNumber, couponCode, vendorId, orderAmount });

    if (!phoneNumber || !couponCode) {
      return NextResponse.json({
        success: false,
        message: "Phone number and coupon code are required"
      }, { status: 400 });
    }
    // Build query to find the coupon
    const couponQuery = {
      code: couponCode.toUpperCase(),
      isActive: true
    };

    console.log('Searching for coupon with query:', couponQuery);
    console.log('Original coupon code:', couponCode);

    // If vendorId is provided, filter by vendor OR all (null/empty)
    if (vendorId) {
      couponQuery.$or = [
        { vendorId: vendorId },
        { vendorId: null },
        { vendorId: "" }
      ];
    }

    // Find the coupon
    let coupon = await CouponModel.findOne(couponQuery);
    let bookedTests = [];

    // If not found in Coupons, search in Bookings for this patient
    if (!coupon) {
      console.log('Coupon not found in Coupons collection, checking Bookings...');

      try {
        const bookingsCollection = mongoose.connection.db.collection('bookings');
        // Find all bookings for this patient that share this coupon code
        const userBookings = await bookingsCollection.find({
          couponCode: couponCode.toUpperCase(),
          'patientDetails.contactNumber': phoneNumber
        }).toArray();

        if (userBookings.length > 0) {
          console.log(`Found ${userBookings.length} bookings with coupon:`, couponCode);

          const mainBooking = userBookings[0];
          bookedTests = userBookings.map(b => b.testName);

          coupon = {
            code: mainBooking.couponCode,
            discountType: mainBooking.discountType || 'percentage',
            discountValue: mainBooking.discountValue || 0,
            minOrderAmount: 0,
            isActive: true,
            validFrom: new Date(0),
            validUntil: new Date(Date.now() + 86400000), // Valid for now
            isFromBooking: true,
            patientName: mainBooking.patientDetails.patientName,
            // Calculate totals from all bookings sharing this coupon if they exist
            originalAmount: userBookings.reduce((sum, b) => sum + (parseFloat(b.originalAmount) || 0), 0) || mainBooking.originalAmount,
            discountAmount: userBookings.reduce((sum, b) => sum + (parseFloat(b.discountAmount) || 0), 0) || mainBooking.discountAmount,
            finalAmount: userBookings.reduce((sum, b) => sum + (parseFloat(b.finalAmount) || 0), 0) || mainBooking.finalAmount
          };
        } else {
          // Check without uppercase
          const userBookingsAlt = await bookingsCollection.find({
            couponCode: couponCode,
            'patientDetails.contactNumber': phoneNumber
          }).toArray();

          if (userBookingsAlt.length > 0) {
            const mainBooking = userBookingsAlt[0];
            bookedTests = userBookingsAlt.map(b => b.testName);

            coupon = {
              code: mainBooking.couponCode,
              discountType: mainBooking.discountType || 'percentage',
              discountValue: mainBooking.discountValue || 0,
              minOrderAmount: 0,
              isActive: true,
              validFrom: new Date(0),
              validUntil: new Date(Date.now() + 86400000),
              isFromBooking: true,
              patientName: mainBooking.patientDetails.patientName,
              originalAmount: userBookingsAlt.reduce((sum, b) => sum + (parseFloat(b.originalAmount) || 0), 0) || mainBooking.originalAmount,
              discountAmount: userBookingsAlt.reduce((sum, b) => sum + (parseFloat(b.discountAmount) || 0), 0) || mainBooking.discountAmount,
              finalAmount: userBookingsAlt.reduce((sum, b) => sum + (parseFloat(b.finalAmount) || 0), 0) || mainBooking.finalAmount
            };
          }
        }
      } catch (err) {
        console.error('Error checking Bookings for coupon:', err);
      }
    }

    if (!coupon) {
      // Let's also check if the coupon exists but is inactive
      const inactiveCoupon = await CouponModel.findOne({
        code: couponCode.toUpperCase(),
        isActive: false
      });

      if (inactiveCoupon) {
        console.log('Coupon found but is inactive:', inactiveCoupon);
        return NextResponse.json({
          success: false,
          message: "This coupon has expired and cannot be used"
        }, { status: 400 });
      }

      // Also check without case conversion in CouponModel
      const altCoupon = await CouponModel.findOne({
        code: couponCode,
        isActive: true
      });

      if (altCoupon) {
        coupon = altCoupon;
      } else {
        return NextResponse.json({
          success: false,
          message: "Invalid coupon code. Please check your booking details."
        }, { status: 404 });
      }
    }

    // Skip some checks for coupons already in a booking
    if (!coupon.isFromBooking) {
      // Check if coupon is expired
      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return NextResponse.json({
          success: false,
          message: "Coupon has expired or is not yet valid"
        }, { status: 400 });
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json({
          success: false,
          message: "Coupon usage limit exceeded"
        }, { status: 400 });
      }
    }

    // Find user details - from User model or from the booking we found earlier
    let patientNameResult = 'N/A';
    if (coupon.isFromBooking && coupon.patientName) {
      patientNameResult = coupon.patientName;
    } else {
      const user = await UserModel.findOne({ phone: phoneNumber });
      if (user) {
        patientNameResult = user.name || 'N/A';

        // Only check application rules for new coupons, not ones already used in a booking
        if (!coupon.isFromBooking && coupon.applicableFor === 'new_users' && user.createdAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
          return NextResponse.json({
            success: false,
            message: "This coupon is only valid for new users"
          }, { status: 400 });
        }
      } else if (!coupon.isFromBooking) {
        // If not from booking AND user not found, then it's a new attempt by an unknown user
        return NextResponse.json({
          success: false,
          message: "Patient not found with this phone number"
        }, { status: 404 });
      }
    }

    // Calculate discount
    const actualOrderAmount = orderAmount || 1000;
    let discountAmount = 0;

    // Only check min order for new coupons
    if (!coupon.isFromBooking && actualOrderAmount < coupon.minOrderAmount) {
      return NextResponse.json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`
      }, { status: 400 });
    }

    if (coupon.discountType === 'percentage') {
      discountAmount = (actualOrderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    const finalAmount = actualOrderAmount - discountAmount;

    // Prepare verification result
    const verificationResult = {
      patientName: patientNameResult,
      bookedTests: bookedTests,
      phoneNumber: phoneNumber,
      couponCode: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      originalAmount: coupon.isFromBooking ? coupon.originalAmount : actualOrderAmount,
      discountAmount: coupon.isFromBooking ? coupon.discountAmount : discountAmount,
      finalAmount: coupon.isFromBooking ? coupon.finalAmount : finalAmount,
      validUntil: coupon.validUntil,
      description: coupon.description,
      minOrderAmount: coupon.minOrderAmount
    };

    console.log('✅ Coupon verified successfully:', verificationResult);

    return NextResponse.json({
      success: true,
      message: "Coupon verified successfully",
      data: verificationResult
    });

  } catch (error) {
    console.error("❌ Error verifying coupon:", error);
    console.error("Stack trace:", error.stack);

    return NextResponse.json({
      success: false,
      message: "Internal server error: " + error.message,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET - Get all active coupons (for admin/vendor reference)
export async function GET(req) {
  try {
    await DBConnection();

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') !== 'false';
    const vendorId = searchParams.get('vendorId');

    // Build query
    const query = activeOnly ? { isActive: true } : {};

    // If vendorId is provided, filter by vendor
    if (vendorId) {
      query.vendorId = vendorId;
    }

    const coupons = await CouponModel.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');

    return NextResponse.json({
      success: true,
      data: coupons,
      count: coupons.length
    });

  } catch (error) {
    console.error("❌ Error fetching coupons:", error);

    return NextResponse.json({
      success: false,
      message: "Failed to fetch coupons",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}