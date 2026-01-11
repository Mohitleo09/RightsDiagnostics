import { auth } from '@/app/auth';
import DBConnection from '@/app/utils/config/db';
import UserModel from '@/app/utils/models/User';

export const runtime = "nodejs";

export async function GET(request) {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Not authenticated" 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Connect to database
    await DBConnection();
    
    // Find user by email or username from session
    let user = null;
    if (session.user.email) {
      user = await UserModel.findOne({ email: session.user.email });
    } else if (session.user.username) {
      user = await UserModel.findOne({ username: session.user.username });
    }
    
    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "User not found" 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return user data (excluding password)
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          name: user.name,
          phone: user.phone,
          isVerified: user.isVerified,
          isPhoneVerified: user.isPhoneVerified
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error fetching current user:", error);
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