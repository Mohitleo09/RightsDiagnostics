import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import UserModel from "../../utils/models/User";
import { auth } from "../../auth";

export const runtime = "nodejs";

// Helper function to get user from session
async function getUserFromRequest(req) {
  const session = await auth();
  
  if (!session || !session.user) {
    return null;
  }
  
  return session.user;
}

export async function POST(req) {
  try {
    await DBConnection();
    
    // Get user from session
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not authenticated"
      }, { status: 401 });
    }
    
    // Get form data
    const formData = await req.formData();
    
    const height = formData.get("height");
    const weight = formData.get("weight");
    const currentMedications = formData.get("currentMedications");
    const previousMedications = formData.get("previousMedications");
    const documents = formData.getAll("documents");
    
    // Validate required fields
    if (!height || !weight || !currentMedications || !previousMedications) {
      return NextResponse.json({
        success: false,
        message: "Height, weight, current medications, and previous medications are required"
      }, { status: 400 });
    }
    
    // In a real application, you would upload files to cloud storage
    // For now, we'll just store the filenames
    const documentUrls = [];
    if (documents && documents.length > 0) {
      // Process uploaded files
      for (const doc of documents) {
        if (doc && doc.name) {
          // In a real app, you would upload to cloud storage and get a URL
          // For now, we'll just store the filename
          documentUrls.push(doc.name);
        }
      }
    }
    
    // Use authenticated user's phone or email
    let query = { $or: [{ phone: user.phone }, { email: user.email }] };
    
    // Update user with additional information
    const updateData = {
      height: parseFloat(height),
      weight: parseFloat(weight),
      currentMedications: currentMedications || "",
      previousMedications: previousMedications || "",
      updatedAt: new Date()
    };
    
    // Add document URLs if any
    if (documentUrls.length > 0) {
      updateData.medicalDocuments = documentUrls;
    }
    
    const updatedUser = await UserModel.findOneAndUpdate(
      query,
      updateData,
      { 
        new: true,
        // Only include the fields we need (no mixing with exclusion)
        select: 'height weight currentMedications previousMedications medicalDocuments'
      }
    );
    
    if (!updatedUser) {
      // If user doesn't exist, create a new user with this information
      const newUser = await UserModel.create({
        phone: user.phone,
        email: user.email,
        height: parseFloat(height),
        weight: parseFloat(weight),
        currentMedications: currentMedications || "",
        previousMedications: previousMedications || "",
        medicalDocuments: documentUrls,
        name: user.name || "User", // Default name
        username: user.username || user.name || "User" // Default username
      });
      
      return NextResponse.json({
        success: true,
        message: "Additional information saved successfully",
        data: {
          height: newUser.height,
          weight: newUser.weight,
          currentMedications: newUser.currentMedications,
          previousMedications: newUser.previousMedications,
          medicalDocuments: newUser.medicalDocuments
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Additional information saved successfully",
      data: {
        height: updatedUser.height,
        weight: updatedUser.weight,
        currentMedications: updatedUser.currentMedications,
        previousMedications: updatedUser.previousMedications,
        medicalDocuments: updatedUser.medicalDocuments
      }
    });
    
  } catch (error) {
    console.error("Error saving additional patient info:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to save additional information",
      error: error.message
    }, { status: 500 });
  }
}

// GET endpoint to retrieve existing additional info
export async function GET(req) {
  try {
    await DBConnection();
    
    // Get user from session
    const requestingUser = await getUserFromRequest(req);
    
    if (!requestingUser) {
      return NextResponse.json({
        success: false,
        message: "User not authenticated"
      }, { status: 401 });
    }
    
    // Check if a specific userId is requested (for vendor access)
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    
    let query;
    
    // If a userId is provided and the requesting user is a vendor, fetch that user's data
    if (requestedUserId && requestingUser.role === 'vendor') {
      query = { _id: requestedUserId };
    } else {
      // Otherwise, fetch the requesting user's own data
      query = { $or: [{ phone: requestingUser.phone }, { email: requestingUser.email }] };
    }
    
    const dbUser = await UserModel.findOne(
      query,
      {
        // Only include the fields we need (no mixing with exclusion)
        height: 1,
        weight: 1,
        currentMedications: 1,
        previousMedications: 1,
        medicalDocuments: 1
      }
    );
    
    if (!dbUser) {
      return NextResponse.json({
        success: true,
        data: {
          height: "",
          weight: "",
          currentMedications: "",
          previousMedications: "",
          medicalDocuments: []
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        height: dbUser.height || "",
        weight: dbUser.weight || "",
        currentMedications: dbUser.currentMedications || "",
        previousMedications: dbUser.previousMedications || "",
        medicalDocuments: dbUser.medicalDocuments || []
      }
    });
    
  } catch (error) {
    console.error("Error retrieving additional patient info:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to retrieve additional information",
      error: error.message
    }, { status: 500 });
  }
}