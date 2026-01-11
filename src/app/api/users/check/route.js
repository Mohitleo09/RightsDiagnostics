import { NextResponse } from "next/server";
import DBConnection from "../../../utils/config/db";
import UserModel from "../../../utils/models/User";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await DBConnection();
    
    const { phone, email } = await req.json();
    
    // Check if user exists by phone
    if (phone) {
      const existingUserByPhone = await UserModel.findOne({ phone });
      if (existingUserByPhone) {
        return NextResponse.json({
          exists: true,
          field: 'phone',
          message: "A user already exists with this phone number."
        });
      }
    }
    
    // Check if user exists by email
    if (email) {
      const existingUserByEmail = await UserModel.findOne({ email });
      if (existingUserByEmail) {
        return NextResponse.json({
          exists: true,
          field: 'email',
          message: "A user already exists with this email address."
        });
      }
    }
    
    // No existing user found
    return NextResponse.json({
      exists: false
    });
    
  } catch (error) {
    console.error("Error checking user existence:", error);
    return NextResponse.json({
      exists: false,
      error: "Failed to check user existence"
    }, { status: 500 });
  }
}