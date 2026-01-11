import DBConnection from '../../../utils/config/db';
import User from '../../../utils/models/User';
import Vendor from '../../../utils/models/Vendor';

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    let count = 0;
    
    if (role === 'vendor') {
      // For vendors, count only approved and active vendors
      count = await Vendor.countDocuments({ 
        approvalStatus: 'approved', 
        status: 'active' 
      });
    } else {
      // For other roles (including 'user'), count users with that role
      const query = role ? { role } : {};
      count = await User.countDocuments(query);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        count
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching count:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch count'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}