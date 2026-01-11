'use server';

import { auth } from '@/app/auth';
import DBConnection from '@/app/utils/config/db';
import AdminModel from '@/app/utils/models/Admin';

// Server action to get current admin data from database
export async function getCurrentAdmin() {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return { 
        success: false, 
        message: "Not authenticated" 
      };
    }
    
    // Check if the user is an admin
    if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return { 
        success: false, 
        message: "Access denied. Admins only." 
      };
    }
    
    // Connect to database to get fresh data
    await DBConnection();
    
    // Find admin by email or username from session
    let admin = null;
    if (session.user.email) {
      admin = await AdminModel.findOne({ email: session.user.email });
    } else if (session.user.username) {
      admin = await AdminModel.findOne({ username: session.user.username });
    }
    
    if (!admin) {
      return { 
        success: false, 
        message: "Admin not found" 
      };
    }
    
    // Check if admin is active
    if (admin.status !== 'active') {
      return { 
        success: false, 
        message: "Admin account is inactive" 
      };
    }
    
    // Return admin data (excluding password)
    return {
      success: true,
      admin: {
        id: admin._id.toString(),
        username: admin.username,
        email: admin.email,
        role: admin.role,
        name: admin.name,
        status: admin.status
      }
    };
  } catch (error) {
    console.error("Error fetching current admin:", error);
    return { 
      success: false, 
      message: "Internal server error",
      error: error.message 
    };
  }
}