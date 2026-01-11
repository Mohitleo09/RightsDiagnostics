import DBConnection from "@/app/utils/config/db";
import AdminModel from "@/app/utils/models/Admin";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    // Connect to database
    await DBConnection();
    
    // Parse request body
    const { username, email, password, role } = await request.json();
    
    // Validate input
    if (!username || !email || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Username, email, and password are required" 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Check if admin already exists with this email or username
    const existingAdmin = await AdminModel.findOne({
      $or: [
        { email: email },
        { username: username }
      ]
    });
    
    if (existingAdmin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Admin with this email or username already exists" 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create new admin user
    const newAdmin = new AdminModel({
      username,
      email,
      password,
      role: role || 'admin', // Use provided role or default to 'admin'
      isVerified: true, // Admins are automatically verified
      status: 'active'
    });
    
    // Save admin to database
    const savedAdmin = await newAdmin.save();
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin registered successfully",
        admin: {
          id: savedAdmin._id,
          username: savedAdmin.username,
          email: savedAdmin.email,
          role: savedAdmin.role
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Admin registration error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}