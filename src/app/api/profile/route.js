import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import UserModel from "../../utils/models/User";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    await DBConnection();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const username = searchParams.get('username');

    if (!email && !phone && !username) {
      // For Google login users, try to get user from session
      try {
        // This would require session handling which is complex in API routes
        // For now, we'll return an error and let the frontend handle it
        return NextResponse.json({
          success: false,
          error: "Email, phone, or username is required"
        }, { status: 400 });
      } catch (sessionError) {
        return NextResponse.json({
          success: false,
          error: "Email, phone, or username is required"
        }, { status: 400 });
      }
    }

    // Build query based on provided parameter
    let query = {};
    if (phone) {
      query = { phone };
    } else if (email) {
      query = { email };
    } else if (username) {
      query = { username };
    }

    console.log('🔍 GET: Searching for user with query:', query);

    const user = await UserModel.findOne(query, {
      password: 0 // Exclude password field for security
    });

    console.log('👤 GET: Found user:', user ? { id: user._id, phone: user.phone, email: user.email, name: user.name, username: user.username } : 'null');

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 });
    }

    console.log(`✅ Successfully fetched profile for: ${phone || email || username}`);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username || user.name,
        name: user.name || user.username,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        gender: user.gender,
        profileImage: user.profileImage,
        role: user.role,
        status: user.status,
        isPhoneVerified: user.isPhoneVerified,
        isVerified: user.isVerified,
        phoneVerifiedAt: user.phoneVerifiedAt,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error("❌ Error fetching profile:", error);

    return NextResponse.json({
      success: false,
      error: "Failed to fetch profile",
      message: error.message
    }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await DBConnection();

    const { email, name, dob, gender, phone, profileImage } = await req.json();

    console.log('📝 PUT /api/profile received:', { email, phone, name, dob, gender, hasProfileImage: !!profileImage });

    if (!email && !phone) {
      return NextResponse.json({
        success: false,
        error: "Email or phone is required"
      }, { status: 400 });
    }

    // Prioritize phone for query (since OTP users login with phone)
    // IMPORTANT: Search by phone first to find OTP users
    let existingUser = null;
    let query = {}; // Define query variable to use for update operation

    if (phone) {
      console.log('🔍 PUT: Searching for user with phone:', phone);
      query = { phone };
      existingUser = await UserModel.findOne(query);
    }

    // If not found by phone and email provided, try email
    if (!existingUser && email && !email.includes('@temp.rightsdiagnostics.com')) {
      console.log('🔍 PUT: Phone search failed, trying email:', email);
      query = { email };
      existingUser = await UserModel.findOne(query);
    }

    console.log('👤 PUT: Existing user found:', existingUser ? {
      id: existingUser._id,
      phone: existingUser.phone,
      email: existingUser.email,
      name: existingUser.name,
      username: existingUser.username
    } : 'null');

    if (!existingUser) {
      console.log('❌ User not found with phone:', phone, 'or email:', email);

      return NextResponse.json({
        success: false,
        error: "User not found. Please ensure you are logged in."
      }, { status: 404 });
    }

    // Build update data - Always update name if provided
    const updateData = {
      updatedAt: new Date()
    };

    // Always update name and username when name is provided
    if (name) {
      updateData.name = name;
      // Only update username if it's not already set or if it's a temporary one
      if (!existingUser.username || existingUser.username.includes('@temp.rightsdiagnostics.com')) {
        updateData.username = name; // Set username to the same value as name
      }
      console.log('📝 Updating name and username to:', name);
    }

    if (dob) updateData.dob = dob;
    if (gender) updateData.gender = gender;
    if (profileImage) updateData.profileImage = profileImage;

    // Only update email if provided and different
    if (email && email !== existingUser.email) {
      updateData.email = email;
      // If email is being added/updated, set isVerified to false until verified
      updateData.isVerified = false;
    }

    // Only update phone if provided and different
    if (phone && phone !== existingUser.phone) {
      updateData.phone = phone;
      // If phone is being added/updated, set isPhoneVerified to false until verified
      updateData.isPhoneVerified = false;
    }

    // Handle verification status updates
    if (req.headers.get('x-verification-type') === 'phone' && phone) {
      updateData.isPhoneVerified = true;
      updateData.phoneVerifiedAt = new Date();
    }

    if (req.headers.get('x-verification-type') === 'email' && email) {
      updateData.isVerified = true;
      updateData.emailVerifiedAt = new Date();
    }

    console.log('📝 PUT: Update data:', {
      ...updateData,
      profileImage: updateData.profileImage ? `Image (${Math.round(updateData.profileImage.length / 1024)}KB)` : undefined
    });

    const updatedUser = await UserModel.findOneAndUpdate(
      query,
      updateData,
      {
        new: true,
        select: '-password',
        runValidators: true
      }
    );

    if (!updatedUser) {
      console.log('❌ Unexpected: User disappeared during update');
      return NextResponse.json({
        success: false,
        error: "Update failed unexpectedly"
      }, { status: 500 });
    }

    console.log('✅ Successfully updated profile:', {
      phone: phone || email,
      name: updatedUser.name,
      username: updatedUser.username
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id.toString(),
        username: updatedUser.username || updatedUser.name,
        name: updatedUser.name || updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        dob: updatedUser.dob,
        gender: updatedUser.gender,
        profileImage: updatedUser.profileImage,
        role: updatedUser.role,
        status: updatedUser.status,
        isPhoneVerified: updatedUser.isPhoneVerified,
        isVerified: updatedUser.isVerified,
        phoneVerifiedAt: updatedUser.phoneVerifiedAt,
        emailVerifiedAt: updatedUser.emailVerifiedAt,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error("❌ Error updating profile:", error);

    return NextResponse.json({
      success: false,
      error: "Failed to update profile",
      message: error.message
    }, { status: 500 });
  }
}
