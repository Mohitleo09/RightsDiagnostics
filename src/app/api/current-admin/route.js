import { auth } from '@/app/auth';
import DBConnection from '@/app/utils/config/db';
import AdminModel from '@/app/utils/models/Admin';

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
    
    // Find admin by email or username from session
    let admin = null;
    if (session.user.email) {
      admin = await AdminModel.findOne({ email: session.user.email });
    } else if (session.user.username) {
      admin = await AdminModel.findOne({ username: session.user.username });
    }
    
    if (!admin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Admin not found" 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return admin data (excluding password)
    return new Response(
      JSON.stringify({ 
        success: true, 
        admin: {
          id: admin._id.toString(),
          username: admin.username,
          email: admin.email,
          role: admin.role,
          name: admin.name
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error fetching current admin:", error);
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