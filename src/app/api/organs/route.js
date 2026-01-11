import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import mongoose from "mongoose";

export const runtime = 'nodejs';

// Organ Schema
const OrganSchema = new mongoose.Schema({
  organName: {
    type: String,
    required: true,
    trim: true
  },
  labName: {
    type: String,
    required: true,
    trim: true
  },
  imageIcon: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Create or get the Organ model
const OrganModel = mongoose.models.Organ || mongoose.model("Organ", OrganSchema);

// GET - Fetch all organs
export async function GET(req) {
  try {
    await DBConnection();
    
    const organs = await OrganModel.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: organs,
      count: organs.length
    }, { 
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error fetching organs:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch organs"
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - Create new organ
export async function POST(req) {
  try {
    await DBConnection();
    
    const formData = await req.formData();
    const organName = formData.get('organName');
    const labName = formData.get('labName');
    const imageIcon = formData.get('imageIcon');
    
    if (!organName || !labName) {
      return NextResponse.json({
        success: false,
        message: "Organ name and lab name are required"
      }, { status: 400 });
    }
    
    // Check if organ already exists
    const existingOrgan = await OrganModel.findOne({ 
      organName: organName.toLowerCase(),
      labName: labName 
    });
    
    if (existingOrgan) {
      return NextResponse.json({
        success: false,
        message: "Organ already exists for this lab"
      }, { status: 409 });
    }
    
    // Handle image upload (for now, just store the filename or URL)
    let imageUrl = '';
    if (imageIcon && imageIcon.size > 0) {
      // In a real application, you would upload to a cloud service
      // For now, we'll just use a placeholder
      imageUrl = `/uploads/organs/${Date.now()}_${imageIcon.name}`;
    }
    
    const newOrgan = new OrganModel({
      organName: organName.trim(),
      labName: labName.trim(),
      imageIcon: imageUrl,
      status: 'Active'
    });
    
    await newOrgan.save();
    
    return NextResponse.json({
      success: true,
      data: newOrgan,
      message: "Organ created successfully"
    });
    
  } catch (error) {
    console.error("Error creating organ:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create organ",
      message: error.message
    }, { status: 500 });
  }
}

// PUT - Update organ
export async function PUT(req) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Organ ID is required"
      }, { status: 400 });
    }
    
    // Check if it's form data (with file) or JSON
    const contentType = req.headers.get('content-type');
    let updateData = {};
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await req.formData();
      updateData.organName = formData.get('organName');
      updateData.labName = formData.get('labName');
      
      const imageIcon = formData.get('imageIcon');
      if (imageIcon && imageIcon.size > 0) {
        updateData.imageIcon = `/uploads/organs/${Date.now()}_${imageIcon.name}`;
      }
    } else {
      // Handle JSON data
      const body = await req.json();
      updateData = body;
    }
    
    const updatedOrgan = await OrganModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedOrgan) {
      return NextResponse.json({
        success: false,
        message: "Organ not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: updatedOrgan,
      message: "Organ updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating organ:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update organ",
      message: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete organ
export async function DELETE(req) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Organ ID is required"
      }, { status: 400 });
    }
    
    const deletedOrgan = await OrganModel.findByIdAndDelete(id);
    
    if (!deletedOrgan) {
      return NextResponse.json({
        success: false,
        message: "Organ not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: deletedOrgan,
      message: "Organ deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting organ:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete organ",
      message: error.message
    }, { status: 500 });
  }
}
