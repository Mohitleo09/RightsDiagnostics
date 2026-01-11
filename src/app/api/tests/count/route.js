import { NextResponse } from "next/server";
import DBConnection from "../../../utils/config/db";
import TestModel from "../../../utils/models/Test";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await DBConnection();
    
    // Check if we're filtering by status or showing all
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('showAll') === 'true';
    
    // Determine status filter - if showAll is true, don't filter by status
    const statusFilter = showAll ? {} : { status: 'Active' };
    
    // Count tests with the appropriate filter
    const count = await TestModel.countDocuments(statusFilter);
    
    return NextResponse.json({
      success: true,
      count: count,
      message: "Tests count fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching tests count:", error);
    return NextResponse.json(
      {
        success: false,
        count: 0,
        error: error.message || "Failed to fetch tests count"
      },
      { status: 500 }
    );
  }
}