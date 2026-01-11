'use server';

import { auth, signIn } from '@/app/auth';
import DBConnection from '@/app/utils/config/db';
import UserModel from '@/app/utils/models/User';
import VendorModel from '@/app/utils/models/Vendor';
import AdminModel from '@/app/utils/models/Admin';
import bcrypt from 'bcryptjs';

// Helper to check for redirect error
function isRedirectError(error) {
  return error && (
    error.digest?.startsWith('NEXT_REDIRECT') ||
    error.message === 'NEXT_REDIRECT' ||
    error.name === 'RedirectError'
  );
}

// Server action for user login
export async function loginAction({ email, password }) {
  try {
    // Connect to database
    await DBConnection();

    // 1. Manual Verification First
    let user = null;
    let collection = null; // 'User', 'Vendor', 'Admin'

    // Check in User collection
    if (email.includes('@')) {
      user = await UserModel.findOne({ email: email });
    } else if (email.startsWith('+')) {
      user = await UserModel.findOne({ phone: email });
    } else {
      user = await UserModel.findOne({ username: email });
    }
    if (user) collection = 'User';

    // If not found, check Vendor
    if (!user) {
      if (email.includes('@')) {
        user = await VendorModel.findOne({ email: email });
      } else if (email.startsWith('+')) {
        user = await VendorModel.findOne({ phone: email });
      } else {
        user = await VendorModel.findOne({ username: email });
      }
      if (user) collection = 'Vendor';
    }

    // If not found, check Admin
    if (!user) {
      if (email.includes('@')) {
        user = await AdminModel.findOne({ email: email });
      } else {
        user = await AdminModel.findOne({ username: email });
      }
      if (user) collection = 'Admin';
    }

    // If user not found
    if (!user) {
      console.log('loginAction: User not found across all collections.');
      return { success: false, message: 'User not found' };
    }
    console.log(`loginAction: User found in ${collection} collection. Role: ${user.role}`);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('loginAction: Invalid password.');
      return { success: false, message: 'Invalid credentials' };
    }
    console.log('loginAction: Password verified successfully.');

    // Check Vendor approval
    if (collection === 'Vendor' && user.role === 'vendor') {
      console.log(`loginAction: Vendor approval status: ${user.approvalStatus}`);
      if (user.approvalStatus !== 'approved') {
        return {
          success: false,
          message: 'Your account is not yet approved. Please wait for admin approval.'
        };
      }
    }

    // 2. Call signIn to create session
    console.log('loginAction: Calling signIn to create session with secure bypass...');
    try {
      // Prepare user object for session
      const sessionUser = {
        id: user._id.toString(),
        name: user.name || user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        username: user.username,
        labName: user.labName,
        approvalStatus: user.approvalStatus
      };

      const secret = process.env.NEXTAUTH_SECRET || process.env.SECRET_KEY || "rk12345";
      await signIn('credentials', {
        bypass_secret: secret,
        user_json: JSON.stringify(sessionUser),
        redirect: false,
      });
      console.log('loginAction: signIn call completed (no redirect error).');
    } catch (signInError) {
      console.log('loginAction: Caught signInError.');
      // If it's a redirect error, it means success in Auth.js v5
      if (isRedirectError(signInError)) {
        console.log('loginAction: signInError is a redirect error, proceeding as success.');
        // Swallow redirect error and proceed to return success
      } else {
        // Real error
        console.error('SignIn error:', signInError);
        const causeMessage = signInError?.cause?.message || signInError?.message;
        if (causeMessage && causeMessage.includes('not yet approved')) {
          return { success: false, message: 'Your account is not yet approved. Please wait for admin approval.' };
        }
        return {
          success: false,
          message: causeMessage || 'Authentication failed during session creation'
        };
      }
    }

    // 3. Return success with user data
    return {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name || user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        username: user.username,
        labName: user.labName,
        approvalStatus: user.approvalStatus
      }
    };

  } catch (error) {
    console.error('Login action error:', error);
    return {
      success: false,
      message: error?.message || 'An error occurred during login'
    };
  }
}

// Server action for admin login with role validation
export async function adminLoginAction({ email, password }) {
  try {
    // Connect to database
    await DBConnection();

    // 1. Manual Verification First
    let admin = null;

    // Check in Admin collection
    if (email.includes('@')) {
      admin = await AdminModel.findOne({ email: email });
    } else {
      admin = await AdminModel.findOne({ username: email });
    }

    if (!admin) {
      return { success: false, message: 'Admin not found' };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      console.log('adminLoginAction: Invalid password');
      return { success: false, message: 'Invalid credentials' };
    }
    console.log('adminLoginAction: Password verified');

    // Check if admin is active
    if (admin.status !== 'active') {
      return { success: false, message: 'Account is inactive. Please contact administrator.' };
    }

    // Validate admin role
    const allowedRoles = ['superadmin', 'admin', 'support', 'other'];
    if (!allowedRoles.includes(admin.role)) {
      return { success: false, message: 'Access denied. Invalid role.' };
    }

    // 2. Call signIn to create session
    console.log('adminLoginAction: Calling signIn with secure bypass...');
    try {
      // Prepare user object for session
      const sessionUser = {
        id: admin._id.toString(),
        name: admin.name || admin.username,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        username: admin.username,
        labName: admin.labName,
        approvalStatus: admin.approvalStatus
      };

      const secret = process.env.NEXTAUTH_SECRET || process.env.SECRET_KEY || "rk12345";
      await signIn('credentials', {
        bypass_secret: secret,
        user_json: JSON.stringify(sessionUser),
        redirect: false,
      });
      console.log('adminLoginAction: signIn completed without error');
    } catch (signInError) {
      console.log('adminLoginAction: Caught signInError');
      // If it's a redirect error, it means success in Auth.js v5
      if (isRedirectError(signInError)) {
        console.log('adminLoginAction: Redirect error swallowed (success)');
        // Swallow redirect error and proceed
      } else {
        console.error('Admin SignIn error:', signInError);
        const causeMessage = signInError?.cause?.message || signInError?.message;
        return {
          success: false,
          message: causeMessage || 'Authentication failed during session creation'
        };
      }
    }

    // 3. Return success with admin data
    return {
      success: true,
      user: {
        id: admin._id.toString(),
        name: admin.name || admin.username,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        username: admin.username,
        labName: admin.labName,
        approvalStatus: admin.approvalStatus
      }
    };
  } catch (error) {
    console.error('Admin login action error:', error);
    return {
      success: false,
      message: error?.message || 'An error occurred during login'
    };
  }
}