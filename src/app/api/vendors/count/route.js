import { NextResponse } from "next/server";
import DBConnection from "../../../utils/config/db";
import VendorModel from "../../../utils/models/Vendor";

export const runtime = "nodejs";

export async function GET() {
  try {
    await DBConnection();
    
    // Count only approved and active vendors
    const count = await VendorModel.countDocuments({ 
      approvalStatus: 'approved', 
      status: 'active' 
    });
    
    return NextResponse.json({
      success: true,
      count: count,
      message: "Vendors count fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching vendors count:", error);
    return NextResponse.json(
      {
        success: false,
        count: 0,
        error: error.message || "Failed to fetch vendors count"
      },
      { status: 500 }
    );
  }
}