import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import UserModel from '../../utils/models/User';

export const runtime = "nodejs";

// GET - Fetch user membership details
export async function GET(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    
    if (!phone && !email) {
      return NextResponse.json({
        success: false,
        error: "Phone or email is required"
      }, { status: 400 });
    }
    
    // Prioritize phone for query (since OTP users login with phone)
    const query = phone ? { phone } : { email };
    
    const user = await UserModel.findOne(query);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 });
    }
    
    // Check if membership has expired
    let membershipPlan = user.membershipPlan || 'free';
    let membershipExpiry = user.membershipExpiry;
    
    if (membershipPlan !== 'free' && membershipExpiry && new Date() > new Date(membershipExpiry)) {
      // Membership has expired, downgrade to free plan
      membershipPlan = 'free';
      membershipExpiry = null;
      
      // Update user's membership plan in database
      await UserModel.findOneAndUpdate(
        query,
        {
          membershipPlan: 'free',
          membershipExpiry: null
        },
        { new: true }
      );
    }
    
    return NextResponse.json({
      success: true,
      membershipPlan: membershipPlan,
      membershipExpiry: membershipExpiry,
      user: {
        id: user._id.toString(),
        name: user.name || user.username,
        email: user.email,
        phone: user.phone
      }
    });
    
  } catch (error) {
    console.error("Error fetching membership details:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch membership details",
      message: error.message
    }, { status: 500 });
  }
}

// POST - Update user membership plan
export async function POST(request) {
  try {
    await DBConnection();
    
    const { phone, email, plan } = await request.json();
    
    if (!phone && !email) {
      return NextResponse.json({
        success: false,
        error: "Phone or email is required"
      }, { status: 400 });
    }
    
    if (!plan || !['free', 'silver', 'gold'].includes(plan)) {
      return NextResponse.json({
        success: false,
        error: "Valid membership plan is required"
      }, { status: 400 });
    }
    
    // Prioritize phone for query (since OTP users login with phone)
    const query = phone ? { phone } : { email };
    
    let updateData = {
      membershipPlan: plan
    };
    
    // Calculate expiry date (1 year from now) only for paid plans
    if (plan !== 'free') {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      updateData.membershipExpiry = expiryDate;
    } else {
      updateData.membershipExpiry = null;
    }
    
    const updatedUser = await UserModel.findOneAndUpdate(
      query,
      updateData,
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Membership plan updated successfully",
      membershipPlan: updatedUser.membershipPlan,
      membershipExpiry: updatedUser.membershipExpiry
    });
    
  } catch (error) {
    console.error("Error updating membership:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update membership plan",
      message: error.message
    }, { status: 500 });
  }
}

// DELETE - Cancel user membership (downgrade to free plan)
export async function DELETE(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    
    if (!phone && !email) {
      return NextResponse.json({
        success: false,
        error: "Phone or email is required"
      }, { status: 400 });
    }
    
    // Prioritize phone for query (since OTP users login with phone)
    const query = phone ? { phone } : { email };
    
    const updatedUser = await UserModel.findOneAndUpdate(
      query,
      {
        membershipPlan: 'free',
        membershipExpiry: null
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Membership canceled successfully. Your plan has been downgraded to Free.",
      membershipPlan: 'free',
      membershipExpiry: null
    });
    
  } catch (error) {
    console.error("Error canceling membership:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to cancel membership",
      message: error.message
    }, { status: 500 });
  }
}