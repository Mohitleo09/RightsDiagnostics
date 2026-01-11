import { auth } from '@/app/auth';
import DBConnection from '@/app/utils/config/db';
import VendorModel from '@/app/utils/models/Vendor';

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
    
    // Find vendor by email or username from session
    let vendor = null;
    if (session.user.email) {
      vendor = await VendorModel.findOne({ email: session.user.email });
    } else if (session.user.username) {
      vendor = await VendorModel.findOne({ username: session.user.username });
    }
    
    if (!vendor) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Vendor not found" 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if vendor is approved
    if (vendor.approvalStatus !== 'approved') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Vendor account not approved" 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return full vendor data (excluding password)
    const vendorObj = vendor.toObject({ virtuals: true });
    return new Response(
      JSON.stringify({ 
        success: true, 
        vendor: {
          ...vendorObj,
          id: vendor._id.toString(),
          _id: vendor._id.toString()
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error fetching current vendor:", error);
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