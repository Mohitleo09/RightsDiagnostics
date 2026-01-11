import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import UserModel from "../../utils/models/User";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await DBConnection();

    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats'); // Get statistics
    const role = searchParams.get('role'); // Filter by role

    // Fetch all users from the database
    let query = {};
    if (role) {
      query.role = role;
    }

    const users = await UserModel.find(query, {
      password: 0 // Exclude password field for security
    }).sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      total: users.length,
      patients: users.filter(u => u.role === 'user').length,
      vendors: users.filter(u => u.role === 'vendor').length,
      admins: users.filter(u => u.role === 'admin').length,
      withPhone: users.filter(u => u.phone).length,
      withEmail: users.filter(u => u.email && !u.email.includes('@temp.rightsdiagnostics.com')).length,
      phoneVerified: users.filter(u => u.isPhoneVerified).length,
      emailVerified: users.filter(u => u.isVerified).length,
    };

    console.log('📊 User Statistics:', stats);

    // If only stats requested, return just stats
    if (statsOnly === 'true') {
      return NextResponse.json({
        success: true,
        stats: stats
      });
    }

    // Check if admin user exists in database
    const adminUser = await UserModel.findOne({ email: 'admin@rightsdiagnostics.in' });

    let allUsers = [...users];

    // If admin user doesn't exist in database, don't add hardcoded one
    // Instead, rely on database only
    if (!adminUser) {
      console.log('⚠️ Admin user not found in database - relying on database only');
    }

    console.log(`✅ Successfully fetched ${allUsers.length} users from database`);

    return NextResponse.json({
      success: true,
      users: allUsers,
      count: allUsers.length,
      stats: stats
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

export async function POST(req) {
  try {
    await DBConnection();

    const { username, email, password, role = 'user' } = await req.json();

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json({
        success: false,
        error: "Username, email, and password are required"
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: "User with this email already exists"
      }, { status: 409 });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new UserModel({
      username,
      email,
      password: hashedPassword,
      role,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newUser.save();

    console.log(`✅ Successfully created new user: ${email}`);

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });

  } catch (error) {
    console.error("❌ Error creating user:", error);

    return NextResponse.json({
      success: false,
      error: "Failed to create user",
      message: error.message
    }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await DBConnection();

    const { id, username, email, role, status } = await req.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "User ID is required"
      }, { status: 400 });
    }

    // Handle hardcoded admin user
    if (id === "admin-001") {
      return NextResponse.json({
        success: false,
        error: "Cannot modify the system admin user"
      }, { status: 403 });
    }

    // Update user
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        ...(username && { username }),
        ...(email && { email }),
        ...(role && { role }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 });
    }

    console.log(`✅ Successfully updated user: ${updatedUser.email}`);

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("❌ Error updating user:", error);

    return NextResponse.json({
      success: false,
      error: "Failed to update user",
      message: error.message
    }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await DBConnection();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "User ID is required"
      }, { status: 400 });
    }

    // Handle hardcoded admin user
    if (id === "admin-001") {
      return NextResponse.json({
        success: false,
        error: "Cannot delete the system admin user"
      }, { status: 403 });
    }

    // Delete user
    const deletedUser = await UserModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 });
    }

    console.log(`✅ Successfully deleted user: ${deletedUser.email}`);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting user:", error);

    return NextResponse.json({
      success: false,
      error: "Failed to delete user",
      message: error.message
    }, { status: 500 });
  }
}
