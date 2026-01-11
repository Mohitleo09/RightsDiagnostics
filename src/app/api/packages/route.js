import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import PackageModel from "../../utils/models/Package";
import TestModel from "../../utils/models/Test";

export const runtime = "nodejs";

// GET - Fetch all packages or a specific package by ID or name
export async function GET(req) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('packageId');
    const packageName = searchParams.get('packageName');
    const category = searchParams.get('category');
    const showAll = searchParams.get('showAll') === 'true'; // Admin can request all packages including inactive
    
    if (packageId) {
      // Fetch specific package by ID
      const packageData = await PackageModel.findById(packageId).populate('includedTests');
      if (!packageData) {
        return NextResponse.json({
          success: false,
          error: "Package not found"
        }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: packageData
      });
    } else if (packageName) {
      // Fetch specific package by name
      const packageData = await PackageModel.findOne({ packageName: packageName }).populate('includedTests');
      if (!packageData) {
        return NextResponse.json({
          success: false,
          error: "Package not found"
        }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: packageData
      });
    } else if (category) {
      // Fetch packages by category (now supports array of categories)
      // Only return active packages unless showAll is true
      const filter = showAll ? { category: category } : { category: category, status: 'Active' };
      const packages = await PackageModel.find(filter).populate('includedTests').sort({ createdAt: -1 });
      
      return NextResponse.json({
        success: true,
        data: packages,
        count: packages.length
      });
    } else {
      // Fetch all packages - only return active packages by default
      // Admin can request all packages including inactive with showAll=true
      const filter = showAll ? {} : { status: 'Active' };
      const packages = await PackageModel.find(filter).populate('includedTests').sort({ createdAt: -1 });
      
      return NextResponse.json({
        success: true,
        data: packages,
        count: packages.length
      });
    }
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch packages",
      message: error.message
    }, { status: 500 });
  }
}

// POST - Create a new package
export async function POST(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    console.log("Received package data:", JSON.stringify(body, null, 2));
    
    const { 
      packageName,
      category,
      description,
      price,
      discount,
      includedTests,
      isPopular,
      overview,
      testPreparation,
      importance,
      youtubeLinks
    } = body;
    
    // Validate required fields
    if (!packageName) {
      return NextResponse.json({
        success: false,
        error: "Package name is required"
      }, { status: 400 });
    }
    
    if (!category) {
      return NextResponse.json({
        success: false,
        error: "Category is required"
      }, { status: 400 });
    }
    
    if (!description) {
      return NextResponse.json({
        success: false,
        error: "Description is required"
      }, { status: 400 });
    }
    
    if (!price) {
      return NextResponse.json({
        success: false,
        error: "Price is required"
      }, { status: 400 });
    }
    
    if (!includedTests || includedTests.length === 0) {
      return NextResponse.json({
        success: false,
        error: "At least one test must be included"
      }, { status: 400 });
    }
    
    // Ensure category is an array
    let categoryArray;
    if (Array.isArray(category)) {
      categoryArray = category;
    } else if (typeof category === 'string') {
      categoryArray = [category];
    } else {
      return NextResponse.json({
        success: false,
        error: "Category must be a string or array of strings"
      }, { status: 400 });
    }
    
    console.log("Processing category array:", categoryArray);
    
    // Validate that all test IDs exist (but don't fail if they don't for now)
    let validTestIds = [];
    if (includedTests && includedTests.length > 0) {
      // Make sure all test IDs are valid ObjectIds
      const mongoose = require('mongoose');
      const validObjectIds = includedTests.filter(id => 
        mongoose.Types.ObjectId.isValid(id)
      );
      
      if (validObjectIds.length !== includedTests.length) {
        console.log("Invalid test IDs found");
        // Don't fail, just use valid ones
      }
      
      try {
        const tests = await TestModel.find({ 
          '_id': { $in: validObjectIds } 
        });
        console.log("Found tests:", tests.length);
        validTestIds = tests.map(t => t._id.toString());
      } catch (testError) {
        console.log("Error validating tests:", testError.message);
        // Continue with empty array if validation fails
        validTestIds = [];
      }
    }
    
    // Create new package
    const packageData = {
      packageName: packageName,
      category: categoryArray,
      description: description,
      price: Number(price),
      discount: discount ? Number(discount) : 0,
      includedTests: validTestIds,
      isPopular: Boolean(isPopular),
      overview: overview || '',
      testPreparation: Array.isArray(testPreparation) ? testPreparation : [],
      importance: Array.isArray(importance) ? importance : [],
      youtubeLinks: Array.isArray(youtubeLinks) ? youtubeLinks : [],
    };
    
    console.log("Creating package with data:", JSON.stringify(packageData, null, 2));
    
    const newPackage = new PackageModel(packageData);
    const savedPackage = await newPackage.save();
    console.log("Package saved successfully with ID:", savedPackage._id);
    
    // Populate the includedTests field
    await savedPackage.populate('includedTests');
    
    return NextResponse.json({
      success: true,
      data: savedPackage,
      message: "Package created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating package:", error);
    console.error("Error stack:", error.stack);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      console.log("Validation errors:", JSON.stringify(errors, null, 2));
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to create package",
      message: error.message,
      // Include stack trace in development
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT - Update a package
export async function PUT(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    const { 
      packageId,
      packageName,
      category,
      description,
      price,
      discount,
      includedTests,
      isPopular,
      overview,
      testPreparation,
      importance,
      youtubeLinks,
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
    if (packageName !== undefined) updateData.packageName = packageName;
    if (category !== undefined) updateData.category = Array.isArray(category) ? category : [category];
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (discount !== undefined) updateData.discount = Number(discount);
    if (includedTests !== undefined) updateData.includedTests = includedTests;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (overview !== undefined) updateData.overview = overview;
    if (testPreparation !== undefined) updateData.testPreparation = testPreparation;
    if (importance !== undefined) updateData.importance = importance;
    if (youtubeLinks !== undefined) updateData.youtubeLinks = youtubeLinks;
    if (status !== undefined) updateData.status = status;
    
    // Update package
    const updatedPackage = await PackageModel.findByIdAndUpdate(
      packageId,
      updateData,
      { new: true }
    ).populate('includedTests');
    
    if (!updatedPackage) {
      return NextResponse.json({
        success: false,
        error: "Package not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: updatedPackage,
      message: "Package updated successfully"
    });
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update package",
      message: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete a package
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
    
    // Delete package
    const deletedPackage = await PackageModel.findByIdAndDelete(packageId);
    
    if (!deletedPackage) {
      return NextResponse.json({
        success: false,
        error: "Package not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Package deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete package",
      message: error.message
    }, { status: 500 });
  }
}