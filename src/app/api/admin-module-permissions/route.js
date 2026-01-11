import DBConnection from "../../utils/config/db";
import AdminModulePermissions from "../../utils/models/AdminModulePermissions";

export async function GET(request) {
  try {
    await DBConnection();
    
    // Fetch module permissions for both roles
    const adminPermissions = await AdminModulePermissions.findOne({ role: 'admin' });
    const supportPermissions = await AdminModulePermissions.findOne({ role: 'support' });
    
    // If no permissions found, return default schema
    const defaultAdminModules = [
      { id: 'dashboard', label: 'Dashboard', enabled: true },
      { id: 'admin-management', label: 'Admin Management', enabled: true },
      { id: 'vendors-management', label: 'Vendors Management', enabled: true },
      { id: 'category', label: 'Category', enabled: true },
      { id: 'test-management', label: 'Test Management', enabled: true },
      { id: 'packages', label: 'Packages', enabled: true },
      { id: 'coupons', label: 'Coupons & Offers', enabled: true },
      { id: 'advertisements', label: 'Advertisements', enabled: true },
      { id: 'analytics', label: 'Analytics & Reports', enabled: true },
      { id: 'support', label: 'Support', enabled: true }
    ];
    
    const defaultSupportModules = [
      { id: 'dashboard', label: 'Dashboard', enabled: true },
      { id: 'admin-management', label: 'Admin Management', enabled: true },
      { id: 'vendors-management', label: 'Vendors Management', enabled: true },
      { id: 'category', label: 'Category', enabled: true },
      { id: 'test-management', label: 'Test Management', enabled: true },
      { id: 'packages', label: 'Packages', enabled: true },
      { id: 'coupons', label: 'Coupons & Offers', enabled: true },
      { id: 'advertisements', label: 'Advertisements', enabled: true },
      { id: 'analytics', label: 'Analytics & Reports', enabled: true },
      { id: 'support', label: 'Support', enabled: true }
    ];
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          adminModules: adminPermissions ? adminPermissions.modules : defaultAdminModules,
          supportModules: supportPermissions ? supportPermissions.modules : defaultSupportModules
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Failed to fetch module permissions",
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request) {
  try {
    await DBConnection();
    
    const body = await request.json();
    const { role, modules } = body;
    
    // Validate input
    if (!role || !modules) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Role and modules are required" 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate role
    if (!['admin', 'support'].includes(role)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid role. Must be 'admin' or 'support'" 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Save or update module permissions
    const updatedPermissions = await AdminModulePermissions.findOneAndUpdate(
      { role },
      { modules },
      { new: true, upsert: true, runValidators: true }
    );
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${role} module permissions saved successfully`,
        data: updatedPermissions
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Failed to save module permissions",
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}