'use server';

import { signOut } from '@/app/auth';

// Server action to logout user
export async function logoutAction() {
  try {
    await signOut({ redirect: false });
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: error?.message || 'Logout failed' };
  }
}