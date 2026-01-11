'use server';

import { auth } from '@/app/auth';
import DBConnection from '@/app/utils/config/db';
import UserModel from '@/app/utils/models/User';

// Server action to get current user data from database
export async function getCurrentUser() {
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
    
    // Check if the user is a regular user
    if (session.user.role !== 'user') {
      return { 
        success: false, 
        message: "Access denied. Users only." 
      };
    }
    
    // Connect to database to get fresh data
    await DBConnection();
    
    // Find user by email or username from session
    let user = null;
    if (session.user.email) {
      user = await UserModel.findOne({ email: session.user.email });
    } else if (session.user.username) {
      user = await UserModel.findOne({ username: session.user.username });
    }
    
    if (!user) {
      return { 
        success: false, 
        message: "User not found" 
      };
    }
    
    // Return user data (excluding password)
    return {
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
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return { 
      success: false, 
      message: "Internal server error",
      error: error.message 
    };
  }
}