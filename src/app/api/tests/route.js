import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import TestModel from "../../utils/models/Test";
import VendorModel from "../../utils/models/Vendor";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    await DBConnection();
    
    // Check if we're filtering by testId, testName, labName, vendorId, or category
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId');
    const testName = searchParams.get('testName');
    const labName = searchParams.get('labName');
    const vendorId = searchParams.get('vendorId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const showAll = searchParams.get('showAll') === 'true'; // Add showAll parameter for admin pages
    const userCategory = searchParams.get('userCategory'); // Add userCategory parameter for patient filtering
    const userLab = searchParams.get('userLab'); // Add userLab parameter for patient filtering
    
    let tests;
    
    // Determine status filter - if showAll is true, don't filter by status
    const statusFilter = showAll ? {} : { status: status || 'Active' };
    
    if (testId) {
      // Fetch specific test by ID
      tests = await TestModel.find({ _id: testId, ...statusFilter }).sort({ createdAt: -1 });
    } else if (testName) {
      // Fetch specific test by name
      tests = await TestModel.find({ testName: testName, ...statusFilter }).sort({ createdAt: -1 });
    } else if (vendorId) {
      // Fetch tests by vendor ID (most efficient for lab-specific queries)
      console.log('🔍 Searching for tests with vendorId:', vendorId);
      tests = await TestModel.find({ vendorId: vendorId, ...statusFilter }).sort({ createdAt: -1 });
      console.log(`📊 Found ${tests.length} tests for vendorId:`, vendorId);
      
      // Debug: Show first test's vendorId format if any tests found
      if (tests.length > 0) {
        console.log('📝 Sample vendorId from test:', tests[0].vendorId, 'Type:', typeof tests[0].vendorId);
      }
    } else if (category) {
      // Fetch tests by category
      console.log('🔍 Searching for tests with category:', category);
      tests = await TestModel.find({ category: category, ...statusFilter }).sort({ createdAt: -1 });
      console.log(`📊 Found ${tests.length} tests for category:`, category);
    } else if (labName) {
      // Fetch tests by lab name - THREE methods:
      // 1. Find by vendorId (if vendor exists)
      // 2. Find by availableAtLabs field (comma-separated lab names)
      // 3. Combine both results
      
      console.log('🔍 Searching for vendor with labName:', labName);
      const vendor = await VendorModel.findOne({ labName: labName });
      
      let testsByVendorId = [];
      let testsByAvailableLabs = [];
      
      // Method 1: Search by vendorId
      if (vendor) {
        console.log('✅ Vendor found:', vendor.labName, 'ID:', vendor._id.toString());
        testsByVendorId = await TestModel.find({ vendorId: vendor._id.toString(), ...statusFilter }).sort({ createdAt: -1 });
        console.log(`📊 Found ${testsByVendorId.length} tests by vendorId`);
        
        // Try ObjectId format if no results
        if (testsByVendorId.length === 0) {
          console.log('🔄 Trying with ObjectId format...');
          testsByVendorId = await TestModel.find({ vendorId: vendor._id, ...statusFilter }).sort({ createdAt: -1 });
          console.log(`📊 Found ${testsByVendorId.length} tests with ObjectId format`);
        }
      } else {
        console.warn('⚠️ No vendor found with labName:', labName);
      }
      
      // Method 2: Search by availableAtLabs field (regex to match comma-separated values)
      console.log('🔍 Searching tests where availableAtLabs contains:', labName);
      // Use word boundary regex to avoid partial matches
      testsByAvailableLabs = await TestModel.find({ 
        availableAtLabs: { $regex: new RegExp(`(?:^|,)\\s*${labName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:,|$)`, 'i') },
        ...statusFilter
      }).sort({ createdAt: -1 });
      console.log(`📊 Found ${testsByAvailableLabs.length} tests by availableAtLabs field`);
      
      // Combine and deduplicate results
      const testMap = new Map();
      [...testsByVendorId, ...testsByAvailableLabs].forEach(test => {
        testMap.set(test._id.toString(), test);
      });
      tests = Array.from(testMap.values());
      console.log(`✅ Total unique tests found: ${tests.length}`);
      
    } else {
      // Fetch all tests with status filter (unless showAll is true)
      // For patient requests, apply additional filtering by userCategory and userLab if provided
      let filter = { ...statusFilter };
      
      // Apply user category filter if provided and not 'All'
      if (userCategory && userCategory !== 'All') {
        filter.category = { $in: [userCategory] };
      }
      
      // Apply user lab filter if provided and not 'All'
      if (userLab && userLab !== 'All') {
        filter.$or = [
          { vendorId: userLab },
          { availableAtLabs: { $regex: userLab, $options: 'i' } }
        ];
      }
      
      console.log('🔍 Fetching tests with filter:', filter);
      tests = await TestModel.find(filter).sort({ createdAt: -1 });
      console.log(`📊 Found ${tests.length} tests with applied filters`);
    }
    
    // Enrich tests with vendor information and handle vendor-specific actual prices
    const enrichedTests = await Promise.all(tests.map(async (test) => {
      // Find vendor for this test
      let vendor = null;
      
      // Check if vendorId is a valid ObjectId before querying
      if (mongoose.Types.ObjectId.isValid(test.vendorId)) {
        try {
          vendor = await VendorModel.findById(test.vendorId);
        } catch (error) {
          console.warn(`⚠️ Failed to find vendor with ID ${test.vendorId}:`, error.message);
        }
      } else {
        // If vendorId is not a valid ObjectId, try to find vendor by labName
        console.log(`🔍 vendorId "${test.vendorId}" is not a valid ObjectId, searching by labName`);
        try {
          vendor = await VendorModel.findOne({ labName: test.vendorId });
        } catch (error) {
          console.warn(`⚠️ Failed to find vendor with labName ${test.vendorId}:`, error.message);
        }
      }
      
      // Handle vendor-specific actual price
      let actualPrice = test.actualPrice;
      if (labName && typeof test.actualPrice === 'object' && test.actualPrice !== null) {
        // If we're fetching for a specific lab and actualPrice is an object,
        // try to find the price for that specific vendor using labName
        if (labName && test.actualPrice[labName]) {
          actualPrice = test.actualPrice[labName];
        } else if (vendor && test.actualPrice[vendor.labName]) {
          actualPrice = test.actualPrice[vendor.labName];
        } else {
          // Default to the first available price or empty string
          const keys = Object.keys(test.actualPrice);
          actualPrice = keys.length > 0 ? test.actualPrice[keys[0]] : '';
        }
      }
      
      return {
        ...test.toObject(),
        vendorName: vendor ? (vendor.labName || vendor.name || 'Unknown Vendor') : 'Unknown Vendor',
        actualPrice: actualPrice // Return the vendor-specific actual price or the default one
      };
    }));
    
    return NextResponse.json({
      success: true,
      tests: enrichedTests,
      count: enrichedTests.length
    });
  } catch (error) {
    console.error("Error fetching tests:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch tests",
      message: error.message
    }, { status: 500 });
  }
}

// Add POST method for creating tests
export async function POST(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    const { 
      vendorId, 
      testName, 
      organ, 
      price, 
      actualPrice = '',
      description = '',
      availableAtLabs = '',
      isPopular = false,
      status = 'Active',
      overview = '',
      testPreparation = [],
      importance = [],
      youtubeLinks = [],
      category = [] // Add category field
    } = body;
    
    // Validate required fields
    if (!vendorId || !testName || !organ || !price) {
      return NextResponse.json({
        success: false,
        error: "Vendor ID, test name, organ, and price are required"
      }, { status: 400 });
    }
    
    // Get vendor details to use labName as the key for actualPrice
    let vendorLabName = vendorId;
    try {
      const vendor = await VendorModel.findById(vendorId);
      if (vendor && vendor.labName) {
        vendorLabName = vendor.labName;
      }
    } catch (error) {
      console.warn('Could not fetch vendor details for actualPrice key:', error.message);
    }
    
    // Create new test
    const newTest = new TestModel({
      vendorId,
      testName,
      organ,
      price, // Keep price as string to support ranges like "200-300"
      actualPrice: typeof actualPrice === 'object' ? actualPrice : { [vendorLabName]: actualPrice },
      description,
      availableAtLabs,
      isPopular,
      status,
      overview,
      testPreparation,
      importance,
      youtubeLinks,
      category // Add category field
    });
    
    const savedTest = await newTest.save();
    
    return NextResponse.json({
      success: true,
      test: savedTest,
      message: "Test created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create test",
      message: error.message
    }, { status: 500 });
  }
}

// Add PUT method for updating tests
export async function PUT(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    const { 
      testId, 
      vendorId, 
      testName, 
      organ, 
      price, 
      actualPrice,
      description,
      availableAtLabs, // Add this line
      isPopular,
      status,
      overview,
      testPreparation,
      importance,
      youtubeLinks,
      category // Add category field
    } = body;
    
    // Validate required fields
    if (!testId) {
      return NextResponse.json({
        success: false,
        error: "Test ID is required"
      }, { status: 400 });
    }
    
    // Prepare update object
    const updateData = {};
    if (testName) updateData.testName = testName;
    if (organ) updateData.organ = organ;
    if (price) updateData.price = price; // Keep price as string to support ranges like "200-300"
    
    // Handle actualPrice updates
    if (actualPrice !== undefined) {
      // If actualPrice is an object, use it directly (vendor-specific pricing)
      // If it's a string/value and we have vendorId, update that vendor's price
      if (typeof actualPrice === 'object') {
        updateData.actualPrice = actualPrice;
      } else if (vendorId) {
        // We'll update the specific vendor's price in the actualPrice object
        // This requires a more complex update using MongoDB operators
        // For simplicity, we'll fetch the test and update it
      }
    }
    
    if (description !== undefined) updateData.description = description;
    if (availableAtLabs !== undefined) updateData.availableAtLabs = availableAtLabs; // Add this line
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (status) updateData.status = status;
    if (overview !== undefined) updateData.overview = overview;
    if (testPreparation !== undefined) updateData.testPreparation = testPreparation;
    if (importance !== undefined) updateData.importance = importance;
    if (youtubeLinks !== undefined) updateData.youtubeLinks = youtubeLinks;
    if (category !== undefined) updateData.category = category; // Add category field
    
    // If we're updating actualPrice for a specific vendor, we need to handle it differently
    if (actualPrice !== undefined && vendorId) {
      // Get vendor details to use labName as the key for actualPrice
      let vendorLabName = vendorId;
      try {
        const vendor = await VendorModel.findById(vendorId);
        if (vendor && vendor.labName) {
          vendorLabName = vendor.labName;
        }
      } catch (error) {
        console.warn('Could not fetch vendor details for actualPrice key:', error.message);
      }
      
      // Fetch the existing test to get current actualPrice data
      const existingTest = await TestModel.findById(testId);
      if (existingTest) {
        // Merge the new vendor price with existing ones
        const currentActualPrice = existingTest.actualPrice || {};
        if (typeof currentActualPrice === 'object') {
          updateData.actualPrice = {
            ...currentActualPrice,
            [vendorLabName]: actualPrice
          };
        } else {
          // Convert from string to object format
          updateData.actualPrice = {
            [existingTest.vendorId]: currentActualPrice,
            [vendorLabName]: actualPrice
          };
        }
      } else {
        // If we can't find the test, just set the new value
        updateData.actualPrice = typeof actualPrice === 'object' ? actualPrice : { [vendorLabName]: actualPrice };
      }
    }
    
    // Update test
    const updatedTest = await TestModel.findByIdAndUpdate(
      testId,
      updateData,
      { new: true }
    );
    
    if (!updatedTest) {
      return NextResponse.json({
        success: false,
        error: "Test not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      test: updatedTest,
      message: "Test updated successfully"
    });
  } catch (error) {
    console.error("Error updating test:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update test",
      message: error.message
    }, { status: 500 });
  }
}

// Add DELETE method for deleting tests
export async function DELETE(req) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId');
    
    // Validate required fields
    if (!testId) {
      return NextResponse.json({
        success: false,
        error: "Test ID is required"
      }, { status: 400 });
    }
    
    // Delete test
    const deletedTest = await TestModel.findByIdAndDelete(testId);
    
    if (!deletedTest) {
      return NextResponse.json({
        success: false,
        error: "Test not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Test deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting test:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete test",
      message: error.message
    }, { status: 500 });
  }
}

// Add PATCH method for updating test status (activate/deactivate)
export async function PATCH(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    const { 
      testId,
      status
    } = body;
    
    // Validate required fields
    if (!testId || !status) {
      return NextResponse.json({
        success: false,
        error: "Test ID and status are required"
      }, { status: 400 });
    }
    
    // Validate status value
    if (status !== 'Active' && status !== 'Inactive') {
      return NextResponse.json({
        success: false,
        error: "Status must be either 'Active' or 'Inactive'"
      }, { status: 400 });
    }
    
    // Update test status
    const updatedTest = await TestModel.findByIdAndUpdate(
      testId,
      { status },
      { new: true }
    );
    
    if (!updatedTest) {
      return NextResponse.json({
        success: false,
        error: "Test not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      test: updatedTest,
      message: `Test ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error("Error updating test status:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update test status",
      message: error.message
    }, { status: 500 });
  }
}

// Add GET method for counting tests
export async function GET_COUNT(req) {
  try {
    await DBConnection();
    
    // Check if we're filtering by status or showing all
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('showAll') === 'true';
    
    // Determine status filter - if showAll is true, don't filter by status
    const statusFilter = showAll ? {} : { status: 'Active' };
    
    // Count tests with the appropriate filter
    const count = await TestModel.countDocuments(statusFilter);
    
    return NextResponse.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error("Error counting tests:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to count tests",
      message: error.message
    }, { status: 500 });
  }
}
