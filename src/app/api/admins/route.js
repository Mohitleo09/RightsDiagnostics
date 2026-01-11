import DBConnection from "@/app/utils/config/db";
import AdminModel from "@/app/utils/models/Admin";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    // Connect to database
    await DBConnection();
    
    // Fetch all admins from the database
    const admins = await AdminModel.find({}, {
      password: 0 // Exclude password field for security
    }).sort({ createdAt: -1 });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        admins: admins.map(admin => ({
          id: admin._id.toString(),
          username: admin.username,
          email: admin.email,
          role: admin.role,
          status: admin.status,
          createdAt: admin.createdAt
        }))
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Admin fetch error:", error);
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

export async function PUT(request) {
  try {
    // Connect to database
    await DBConnection();
    
    // Parse request body
    const body = await request.json();
    const { id, username, email, role, status } = body;
    
    // Validate input
    if (!id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Admin ID is required" 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Prepare update object
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    
    // Update admin in the database
    const updatedAdmin = await AdminModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedAdmin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Admin not found" 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return updated admin data
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin updated successfully",
        admin: {
          id: updatedAdmin._id.toString(),
          username: updatedAdmin.username,
          email: updatedAdmin.email,
          role: updatedAdmin.role,
          status: updatedAdmin.status,
          createdAt: updatedAdmin.createdAt
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Admin update error:", error);
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

export async function DELETE(request) {
  try {
    // Connect to database
    await DBConnection();
    
    // Get admin ID from query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // Validate input
    if (!id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Admin ID is required" 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Delete admin from the database
    const deletedAdmin = await AdminModel.findByIdAndDelete(id);
    
    if (!deletedAdmin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Admin not found" 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin deleted successfully"
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Admin delete error:", error);
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