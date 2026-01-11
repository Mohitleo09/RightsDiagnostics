import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import UserModel from "../../utils/models/User";
import verificationStore from "../../utils/verificationStore";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await DBConnection();

    const { firstName, lastName, username, password, phone, email } = await req.json();
    
    // Trim email to ensure no whitespace
    const trimmedEmail = email.trim();
    
    console.log("📝 Registration request:", { firstName, lastName, username, phone, email: trimmedEmail });
    
    // Additional debugging for verification status
    console.log("🔍 Checking verification status in registration API:");
    console.log("📱 Phone verified phones:", verificationStore.getAllVerified());
    console.log("📧 Email verified emails:", verificationStore.getAllEmailVerified());

    // Validate required fields
    if (!firstName || !lastName || !username || !password || !phone || !trimmedEmail) {
      return NextResponse.json({
        success: false,
        message: "All fields are required"
      }, { status: 400 });
    }

    // Note: We no longer check for phone/email verification during registration
    // Verification is now handled after registration in the new flow
    console.log("📝 Skipping verification check during registration (new flow)");

    // Check if user already exists by phone or email
    let existingUserByPhone = await UserModel.findOne({ phone });
    let existingUserByEmail = await UserModel.findOne({ email: trimmedEmail });
    
    // Check if user already exists and provide specific error messages
    if (existingUserByPhone) {
      return NextResponse.json({
        success: false,
        message: "A user already exists with this phone number. Please try logging in instead.",
        errorCode: "PHONE_EXISTS"
      }, { status: 409 });
    }
    
    if (existingUserByEmail) {
      return NextResponse.json({
        success: false,
        message: "A user already exists with this email address. Please try logging in instead.",
        errorCode: "EMAIL_EXISTS"
      }, { status: 409 });
    }

    // If no existing user, create new user
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new UserModel({
      name: `${firstName} ${lastName}`,
      username,
      email: trimmedEmail,
      phone,
      password: hashedPassword,
      role: 'user',
      status: 'active',
      isPhoneVerified: false, // Set to false initially, will be updated after verification
      isVerified: false, // Fixed typo: was "isemailVerified", should be "isVerified"
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newUser.save();

    // Remove verification from store after successful registration
    verificationStore.removeVerification(phone);
    verificationStore.removeEmailVerification(trimmedEmail);

    console.log(`✅ Successfully registered new user: ${trimmedEmail}`);

    return NextResponse.json({
      success: true,
      message: "Account created successfully!",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isPhoneVerified: newUser.isPhoneVerified,
        isVerified: newUser.isVerified
      }
    });

  } catch (error) {
    console.error("❌ Error registering user:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to register user";
    
    if (error.code === 11000) {
      // Handle duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'phone') {
        errorMessage = "A user already exists with this phone number. Please try logging in instead.";
      } else if (field === 'email') {
        errorMessage = "A user already exists with this email address. Please try logging in instead.";
      } else {
        errorMessage = `User with this ${field} already exists`;
      }
      return NextResponse.json({
        success: false,
        message: errorMessage,
        errorCode: "DUPLICATE_KEY"
      }, { status: 409 });
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({
      success: false,
      message: errorMessage
    }, { status: 500 });
  }
}