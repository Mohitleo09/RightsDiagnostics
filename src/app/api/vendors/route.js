import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import VendorModel from "../../utils/models/Vendor";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await DBConnection();
  } catch (dbError) {
    console.error('Database connection error:', dbError);
    return NextResponse.json({
      success: false,
      error: 'Database connection failed: ' + dbError.message
    }, { status: 500 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const email = searchParams.get('email');
    const labName = searchParams.get('labName');
    
    console.log('API route called with params:', { vendorId, email, labName });
    console.log('Full request URL:', request.url);
    
    // If no filters provided, fetch all vendors (both approved and pending) for admin panel
    if (!vendorId && !email && !labName) {
      console.log('Fetching all vendors (approved and pending) for admin panel');
      const vendors = await VendorModel.find({ 
        role: 'vendor',
        $or: [
          { approvalStatus: 'approved' },
          { approvalStatus: 'pending' }
        ]
      }).select('-password');
      
      // Add the isNew property to each vendor
      const vendorsWithIsNew = vendors.map(vendor => {
        const vendorObj = vendor.toObject({ virtuals: true });
        return {
          ...vendorObj,
          isNew: vendorObj.isNew || (Date.now() - new Date(vendorObj.createdAt).getTime()) < (24 * 60 * 60 * 1000)
        };
      });
      
      console.log('Found vendors:', vendorsWithIsNew.length);
      return NextResponse.json({
        success: true,
        vendors: vendorsWithIsNew
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // If specific vendor is requested, fetch only that vendor
    if (vendorId || email || labName) {
      let query = {};
      
      if (vendorId) {
        query._id = vendorId;
      } else if (email) {
        query.email = email;
      } else if (labName) {
        // Make lab name search case-insensitive and handle special characters
        try {
          // Log the original lab name
          console.log('Original lab name:', labName);
          
          // Decode the lab name in case it's already encoded
          let decodedLabName = labName;
          try {
            decodedLabName = decodeURIComponent(labName);
            console.log('Decoded lab name:', decodedLabName);
          } catch (decodeError) {
            console.log('Lab name was not encoded');
          }
          
          // Create regex pattern
          const regexPattern = `^${decodedLabName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`;
          console.log('Regex pattern:', regexPattern);
          
          query.labName = { $regex: new RegExp(regexPattern, 'i') };
        } catch (regexError) {
          console.error('Regex error:', regexError);
          // Fallback to exact match if regex fails
          query.labName = labName;
        }
      }
      
      console.log('Searching for vendor with query:', query);
      const vendor = await VendorModel.findOne(query).select('-password');
      console.log('Vendor found:', vendor);
      
      if (!vendor) {
        console.log('Vendor not found for query:', query);
        return NextResponse.json({
          success: false,
          error: "Vendor not found"
        }, { status: 404 });
      }
      
      // Add the isNew property to the vendor
      const vendorObj = vendor.toObject({ virtuals: true });
      const vendorWithIsNew = {
        ...vendorObj,
        isNew: vendorObj.isNew || (Date.now() - new Date(vendorObj.createdAt).getTime()) < (24 * 60 * 60 * 1000)
      };
      
      return NextResponse.json({
        success: true,
        vendor: vendorWithIsNew
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error in vendors API route:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    console.log('🚀 Starting vendor creation process...');
    
    // Log request details
    console.log('📋 Request method:', req.method);
    console.log('📋 Request headers:', Object.fromEntries(req.headers.entries()));
    
    try {
      await DBConnection();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        message: "Unable to connect to the database",
        details: dbError.message
      }, { status: 500 });
    }

    let requestBody = {};
    try {
      requestBody = await req.json();
      console.log('📋 Request body received:', {
        ...requestBody,
        password: requestBody.password ? '[HIDDEN]' : 'missing'
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json({
        success: false,
        error: "Invalid request format",
        message: "Request body must be valid JSON",
        details: parseError.message
      }, { status: 400 });
    }

    const { 
      username, 
      email, 
      password, 
      labName,
      ownerName,
      contactEmail,
      phone,
      website,
      address,
      description,
      logo,
      totalTestsOffered,
      role = 'vendor' 
    } = requestBody;

    // Validate required fields
    console.log('🔍 Validating required fields...');
    if (!username || !email || !password || !labName || !ownerName) {
      console.log('❌ Missing required fields:', { username: !!username, email: !!email, password: !!password, labName: !!labName, ownerName: !!ownerName });
      return NextResponse.json({
        success: false,
        error: "Username, email, password, lab name, and owner name are required"
      }, { status: 400 });
    }
    console.log('✅ All required fields present');

    // Check if vendor already exists in the vendors collection
    console.log('🔍 Checking for existing vendor...');
    const existingVendor = await VendorModel.findOne({ 
      $or: [{ email }, { contactEmail }] 
    });
    
    if (existingVendor) {
      console.log('❌ Vendor already exists:', existingVendor.email);
      return NextResponse.json({
        success: false,
        error: "Vendor with this email already exists"
      }, { status: 409 });
    }
    console.log('✅ No existing vendor found');

    // Hash password
    console.log('🔐 Hashing password...');
    let bcrypt;
    try {
      bcrypt = require('bcryptjs');
    } catch (importError) {
      console.error('❌ Failed to import bcryptjs:', importError);
      return NextResponse.json({
        success: false,
        error: "Server configuration error - bcryptjs not available"
      }, { status: 500 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Password hashed successfully');

    // Create new vendor in the vendors collection
    console.log('👤 Creating new vendor object...');
    const vendorData = {
      username,
      email,
      password: hashedPassword,
      role,
      status: 'active',
      approvalStatus: 'pending', // Set default approval status to pending
      labName,
      ownerName,
      contactEmail: contactEmail || email,
      phone,
      website,
      address,
      description,
      logo,
      totalTestsOffered: totalTestsOffered || 0,
    };
    
    console.log('📋 Vendor data to save:', {
      ...vendorData,
      password: '[HIDDEN]',
      description: vendorData.description ? `"${vendorData.description.substring(0, 50)}..."` : 'NOT PROVIDED'
    });
    
    const newVendor = new VendorModel(vendorData);

    console.log('💾 Saving vendor to database...');
    try {
      await newVendor.save();
      console.log(`✅ Successfully created new vendor: ${email} with ID: ${newVendor._id}`);
    } catch (saveError) {
      console.error('❌ Error saving vendor to database:', saveError);
      console.error('❌ Error name:', saveError.name);
      console.error('❌ Error code:', saveError.code);
      return NextResponse.json({
        success: false,
        error: "Failed to save vendor to database",
        message: saveError.message,
        errorCode: saveError.code,
        errorName: saveError.name
      }, { status: 500 });
    }

    const responseData = {
      success: true,
      message: "Vendor created successfully",
      vendor: {
        _id: newVendor._id.toString(),
        username: newVendor.username,
        email: newVendor.email,
        role: newVendor.role,
        status: newVendor.status,
        approvalStatus: newVendor.approvalStatus, // Include approval status in response
        labName: newVendor.labName,
        ownerName: newVendor.ownerName,
        contactEmail: newVendor.contactEmail,
        phone: newVendor.phone,
        website: newVendor.website,
        address: newVendor.address,
        description: newVendor.description,
        totalTestsOffered: newVendor.totalTestsOffered
      }
    };
    
    console.log('📤 Sending response:', responseData);
    console.log('📤 Response type:', typeof responseData);
    console.log('📤 Response keys:', Object.keys(responseData));
    const response = NextResponse.json(responseData);
    console.log('📤 Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('📤 Response status:', response.status);
    return response;

  } catch (error) {
    console.error("❌ Error creating vendor:", error);
    console.error("❌ Error stack:", error.stack);
    
    // Provide more specific error messages
    let errorMessage = "Failed to create vendor";
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = "Validation failed: " + Object.values(error.errors).map(e => e.message).join(', ');
      statusCode = 400;
    } else if (error.code === 11000) {
      errorMessage = "Vendor with this email already exists";
      statusCode = 409;
    } else if (error.message.includes('bcrypt')) {
      errorMessage = "Password encryption failed";
    } else if (error.message.includes('database') || error.message.includes('connection')) {
      errorMessage = "Database connection error";
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: statusCode });
  }
}

export async function PUT(req) {
  try {
    await DBConnection();

    const { vendorId, updates } = await req.json();

    if (!vendorId) {
      return NextResponse.json({
        success: false,
        error: "Vendor ID is required"
      }, { status: 400 });
    }

    // Hash password if provided
    if (updates.password) {
      const bcrypt = require('bcryptjs');
      updates.password = await bcrypt.hash(updates.password, 12);
    }
    
    // Update vendor in the vendors collection
    const updatedVendor = await VendorModel.findByIdAndUpdate(
      vendorId,
      {
        ...updates,
        updatedAt: new Date()
      },
      { new: true, select: '-password' }
    );

    if (!updatedVendor) {
      return NextResponse.json({
        success: false,
        error: "Vendor not found"
      }, { status: 404 });
    }

    console.log(`✅ Successfully updated vendor: ${updatedVendor.email}`);

    return NextResponse.json({
      success: true,
      message: "Vendor updated successfully",
      vendor: updatedVendor
    });

  } catch (error) {
    console.error("❌ Error updating vendor:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to update vendor",
      message: error.message
    }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await DBConnection();

    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({
        success: false,
        error: "Vendor ID is required"
      }, { status: 400 });
    }

    // Delete vendor from the vendors collection
    const deletedVendor = await VendorModel.findByIdAndDelete(vendorId);

    if (!deletedVendor) {
      return NextResponse.json({
        success: false,
        error: "Vendor not found"
      }, { status: 404 });
    }

    console.log(`✅ Successfully deleted vendor: ${deletedVendor.email}`);

    return NextResponse.json({
      success: true,
      message: "Vendor deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting vendor:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to delete vendor",
      message: error.message
    }, { status: 500 });
  }
}