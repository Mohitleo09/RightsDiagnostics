import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import Advertisement from "../../utils/models/Advertisement";

export const runtime = "nodejs";

// GET - Fetch all advertisements
export async function GET(req) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get('contentType');
    const status = searchParams.get('status') || 'Active';
    
    // Build query
    let query = {};
    
    // Filter by content type if provided
    if (contentType) {
      query.contentType = contentType;
    }
    
    // Filter by status (default to 'Active')
    query.status = status;
    
    const advertisements = await Advertisement.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: advertisements,
      count: advertisements.length
    });
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch advertisements",
      message: error.message
    }, { status: 500 });
  }
}

// POST - Create a new advertisement
export async function POST(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    const { name, image, contentType, status } = body;
    
    // Validate required fields
    if (!name || !image) {
      return NextResponse.json({
        success: false,
        error: "Name and image are required"
      }, { status: 400 });
    }
    
    // Create new advertisement
    const newAdvertisement = new Advertisement({
      name,
      image,
      contentType: contentType || 'Home Page',
      status: status || 'Active'
    });
    
    const savedAdvertisement = await newAdvertisement.save();
    
    return NextResponse.json({
      success: true,
      data: savedAdvertisement,
      message: "Advertisement created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating advertisement:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create advertisement",
      message: error.message
    }, { status: 500 });
  }
}

// PUT - Update an advertisement
export async function PUT(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Advertisement ID is required"
      }, { status: 400 });
    }
    
    // Update advertisement
    const updatedAdvertisement = await Advertisement.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedAdvertisement) {
      return NextResponse.json({
        success: false,
        error: "Advertisement not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: updatedAdvertisement,
      message: "Advertisement updated successfully"
    });
  } catch (error) {
    console.error("Error updating advertisement:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update advertisement",
      message: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete an advertisement
export async function DELETE(req) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Advertisement ID is required"
      }, { status: 400 });
    }
    
    // Delete advertisement
    const deletedAdvertisement = await Advertisement.findByIdAndDelete(id);
    
    if (!deletedAdvertisement) {
      return NextResponse.json({
        success: false,
        error: "Advertisement not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Advertisement deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting advertisement:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete advertisement",
      message: error.message
    }, { status: 500 });
  }
}