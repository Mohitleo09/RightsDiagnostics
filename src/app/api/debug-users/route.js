import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import UserModel from "../../utils/models/User";

export async function GET() {
  try {
    await DBConnection();

    // Get all users (limited for debugging)
    const users = await UserModel.find({}, {
      password: 0 // Exclude password field for security
    }).limit(10);

    console.log(`🔍 Found ${users.length} users in database`);

    return NextResponse.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt
      }))
    });

  } catch (error) {
    console.error("❌ Error fetching users:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch users",
      message: error.message
    }, { status: 500 });
  }
}
