import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import Coupon from "../../utils/models/Coupon";

export const runtime = "nodejs";

// GET - Fetch all coupons
export async function GET(req) {
  try {
    await DBConnection();
    
    // Add cache-busting query parameter to prevent caching
    const url = new URL(req.url);
    const t = url.searchParams.get('t');
    
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: coupons,
      count: coupons.length
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch coupons",
      message: error.message
    }, { status: 500 });
  }
}

// POST - Create a new coupon
export async function POST(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    const { 
      code,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      isActive,
      validFrom,
      validUntil,
      usageLimit,
      applicableFor,
      vendorId,
      description
    } = body;
    
    // Validate required fields
    if (!code || !discountType || !discountValue || !validUntil) {
      return NextResponse.json({
        success: false,
        error: "Code, discount type, discount value, and valid until date are required"
      }, { status: 400 });
    }
    
    // Validate discount type
    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json({
        success: false,
        error: "Discount type must be either 'percentage' or 'fixed'"
      }, { status: 400 });
    }
    
    // Validate discount value
    if (discountValue <= 0) {
      return NextResponse.json({
        success: false,
        error: "Discount value must be greater than 0"
      }, { status: 400 });
    }
    
    // Validate max discount amount for percentage discounts
    if (discountType === 'percentage' && maxDiscountAmount !== undefined && maxDiscountAmount !== null && maxDiscountAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: "Max discount amount must be greater than 0"
      }, { status: 400 });
    }
    
    // Validate valid until date
    const validUntilDate = new Date(validUntil);
    if (isNaN(validUntilDate.getTime())) {
      return NextResponse.json({
        success: false,
        error: "Valid until date is invalid"
      }, { status: 400 });
    }
    
    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return NextResponse.json({
        success: false,
        error: "Coupon code already exists"
      }, { status: 400 });
    }
    
    // Create new coupon
    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntilDate,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usedCount: 0,
      applicableFor: applicableFor || 'all',
      vendorId: vendorId || null,
      description: description || ''
    });
    
    const savedCoupon = await newCoupon.save();
    
    return NextResponse.json({
      success: true,
      data: savedCoupon,
      message: "Coupon created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create coupon",
      message: error.message
    }, { status: 500 });
  }
}

// PUT - Update a coupon
export async function PUT(req) {
  try {
    await DBConnection();
    
    // Get couponId from query parameters
    const url = new URL(req.url);
    const couponId = url.searchParams.get('couponId');
    
    // Validate required fields
    if (!couponId) {
      return NextResponse.json({
        success: false,
        error: "Coupon ID is required"
      }, { status: 400 });
    }
    
    const body = await req.json();
    const { 
      code,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      isActive,
      validFrom,
      validUntil,
      usageLimit,
      usedCount,
      applicableFor
      // Note: vendorId and description are optional and may not be present
    } = body;
    
    // Prepare update object
    const updateData = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = Number(discountValue);
    if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    if (minOrderAmount !== undefined) updateData.minOrderAmount = Number(minOrderAmount);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validUntil !== undefined) {
      const validUntilDate = new Date(validUntil);
      if (!isNaN(validUntilDate.getTime())) {
        updateData.validUntil = validUntilDate;
      }
    }
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? Number(usageLimit) : null;
    if (usedCount !== undefined) updateData.usedCount = Number(usedCount);
    if (applicableFor !== undefined) updateData.applicableFor = applicableFor;
    // Only update vendorId and description if they are provided in the request
    if (body.vendorId !== undefined) updateData.vendorId = body.vendorId;
    if (body.description !== undefined) updateData.description = body.description;
    
    // Update coupon
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      updateData,
      { new: true }
    );
    
    if (!updatedCoupon) {
      return NextResponse.json({
        success: false,
        error: "Coupon not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: updatedCoupon,
      message: "Coupon updated successfully"
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update coupon",
      message: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete a coupon
export async function DELETE(req) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(req.url);
    const couponId = searchParams.get('couponId');
    
    // Validate required fields
    if (!couponId) {
      return NextResponse.json({
        success: false,
        error: "Coupon ID is required"
      }, { status: 400 });
    }
    
    // Delete coupon
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
    
    if (!deletedCoupon) {
      return NextResponse.json({
        success: false,
        error: "Coupon not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete coupon",
      message: error.message
    }, { status: 500 });
  }
}