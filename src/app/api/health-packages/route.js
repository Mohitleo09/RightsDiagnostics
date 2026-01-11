import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import HealthPackageModel from "../../utils/models/HealthPackage";
import TestModel from "../../utils/models/Test";

export const runtime = "nodejs";

// GET - Fetch all health packages
export async function GET(req) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('packageId');
    const status = searchParams.get('status');
    
    if (packageId) {
      // Fetch specific health package by ID
      const healthPackage = await HealthPackageModel.findById(packageId).populate('includedTests');
      if (!healthPackage) {
        return NextResponse.json({
          success: false,
          error: "Health package not found"
        }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: healthPackage
      });
    } else {
      // Fetch all health packages with optional status filtering
      const filter = status ? { status } : { status: 'Active' }; // Default to only active packages
      const healthPackages = await HealthPackageModel.find(filter).populate('includedTests').sort({ createdAt: -1 });
      
      return NextResponse.json({
        success: true,
        data: healthPackages,
        count: healthPackages.length
      });
    }
  } catch (error) {
    console.error("Error fetching health packages:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch health packages",
      message: error.message
    }, { status: 500 });
  }
}

// POST - Create a new health package
export async function POST(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    const { 
      title,
      subTitle,
      price,
      discount,
      includedTests,
      packageIncludes,
      isMostPopular
    } = body;
    
    // Validate required fields
    if (!title || !price || !includedTests || includedTests.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Title, price, and at least one test are required"
      }, { status: 400 });
    }
    
    // Validate that all test IDs exist
    const testIds = includedTests.map(id => id.toString());
    const tests = await TestModel.find({ '_id': { $in: testIds } });
    
    if (tests.length !== testIds.length) {
      return NextResponse.json({
        success: false,
        error: "One or more test IDs are invalid"
      }, { status: 400 });
    }
    
    // Create new health package
    const newHealthPackage = new HealthPackageModel({
      title,
      subTitle: subTitle || '',
      price: Number(price),
      discount: discount ? Number(discount) : 0,
      includedTests: testIds,
      packageIncludes: packageIncludes || [],
      isMostPopular: isMostPopular || false,
    });
    
    const savedHealthPackage = await newHealthPackage.save();
    
    // Populate the includedTests field
    await savedHealthPackage.populate('includedTests');
    
    return NextResponse.json({
      success: true,
      data: savedHealthPackage,
      message: "Health package created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating health package:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create health package",
      message: error.message
    }, { status: 500 });
  }
}

// PUT - Update a health package
export async function PUT(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    const { 
      packageId,
      title,
      subTitle,
      price,
      discount,
      includedTests,
      packageIncludes,
      isMostPopular,
      status
    } = body;
    
    // Validate required fields
    if (!packageId) {
      return NextResponse.json({
        success: false,
        error: "Package ID is required"
      }, { status: 400 });
    }
    
    // Prepare update object
    const updateData = {};
    if (title) updateData.title = title;
    if (subTitle !== undefined) updateData.subTitle = subTitle;
    if (price !== undefined) updateData.price = Number(price);
    if (discount !== undefined) updateData.discount = Number(discount);
    if (includedTests !== undefined) updateData.includedTests = includedTests;
    if (packageIncludes !== undefined) updateData.packageIncludes = packageIncludes;
    if (isMostPopular !== undefined) updateData.isMostPopular = isMostPopular;
    if (status !== undefined) updateData.status = status;
    
    // Update health package
    const updatedHealthPackage = await HealthPackageModel.findByIdAndUpdate(
      packageId,
      updateData,
      { new: true }
    ).populate('includedTests');
    
    if (!updatedHealthPackage) {
      return NextResponse.json({
        success: false,
        error: "Health package not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: updatedHealthPackage,
      message: "Health package updated successfully"
    });
  } catch (error) {
    console.error("Error updating health package:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update health package",
      message: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete a health package
export async function DELETE(req) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('packageId');
    
    // Validate required fields
    if (!packageId) {
      return NextResponse.json({
        success: false,
        error: "Package ID is required"
      }, { status: 400 });
    }
    
    // Delete health package
    const deletedHealthPackage = await HealthPackageModel.findByIdAndDelete(packageId);
    
    if (!deletedHealthPackage) {
      return NextResponse.json({
        success: false,
        error: "Health package not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Health package deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting health package:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete health package",
      message: error.message
    }, { status: 500 });
  }
}