'use server';

import { auth } from '@/app/auth';
import DBConnection from '@/app/utils/config/db';
import VendorModel from '@/app/utils/models/Vendor';

// Server action to get current vendor data from database
export async function getCurrentVendor() {
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
    
    // Check if the user is a vendor
    if (session.user.role !== 'vendor') {
      return { 
        success: false, 
        message: "Access denied. Vendors only." 
      };
    }
    
    // Check if vendor is approved
    if (session.user.approvalStatus !== 'approved') {
      return { 
        success: false, 
        message: "Vendor account not approved" 
      };
    }
    
    // Connect to database to get fresh data
    await DBConnection();
    
    // Find vendor by email or username from session
    let vendor = null;
    if (session.user.email) {
      vendor = await VendorModel.findOne({ email: session.user.email });
    } else if (session.user.username) {
      vendor = await VendorModel.findOne({ username: session.user.username });
    }
    
    if (!vendor) {
      return { 
        success: false, 
        message: "Vendor not found" 
      };
    }
    
    // Check if vendor is approved (double check with database)
    if (vendor.approvalStatus !== 'approved') {
      return { 
        success: false, 
        message: "Vendor account not approved" 
      };
    }
    
    // Return vendor data (excluding password)
    return {
      success: true,
      vendor: {
        id: vendor._id.toString(),
        username: vendor.username,
        email: vendor.email,
        role: vendor.role,
        name: vendor.name,
        labName: vendor.labName,
        approvalStatus: vendor.approvalStatus
      }
    };
  } catch (error) {
    console.error("Error fetching current vendor:", error);
    return { 
      success: false, 
      message: "Internal server error",
      error: error.message 
    };
  }
}