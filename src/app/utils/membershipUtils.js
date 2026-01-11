/**
 * Membership utility functions
 */

import { safeJsonParse } from './apiUtils';

/**
 * Check if user's membership is valid and not expired
 * @param {string} membershipPlan - User's current membership plan
 * @param {Date} membershipExpiry - Membership expiration date
 * @returns {Object} Membership status and benefits
 */
export function checkMembershipStatus(membershipPlan, membershipExpiry) {
  // If no plan or free plan, return basic benefits
  if (!membershipPlan || membershipPlan === 'free') {
    return {
      isValid: true,
      plan: 'free',
      benefits: {
        discount: 0,
        priorityBooking: false,
        homeCollection: false,
        prioritySupport: false,
        telehealthCredits: 0
      }
    };
  }
  
  // Check if membership has expired
  if (membershipExpiry && new Date() > new Date(membershipExpiry)) {
    // Membership expired, return free plan benefits
    return {
      isValid: true,
      plan: 'free',
      expired: true,
      benefits: {
        discount: 0,
        priorityBooking: false,
        homeCollection: false,
        prioritySupport: false,
        telehealthCredits: 0
      }
    };
  }
  
  // Return benefits based on plan
  switch (membershipPlan) {
    case 'silver':
      return {
        isValid: true,
        plan: 'silver',
        expiryDate: membershipExpiry,
        benefits: {
          discount: 5, // 5% discount
          priorityBooking: true,
          homeCollection: true,
          prioritySupport: false,
          telehealthCredits: 0
        }
      };
    
    case 'gold':
      return {
        isValid: true,
        plan: 'gold',
        expiryDate: membershipExpiry,
        benefits: {
          discount: 10, // 10% discount
          priorityBooking: true,
          homeCollection: true,
          prioritySupport: true,
          telehealthCredits: 500 // ₹500 per month
        }
      };
    
    default:
      return {
        isValid: true,
        plan: 'free',
        benefits: {
          discount: 0,
          priorityBooking: false,
          homeCollection: false,
          prioritySupport: false,
          telehealthCredits: 0
        }
      };
  }
}

/**
 * Get user's membership details
 * @param {string} phone - User's phone number
 * @param {string} email - User's email
 * @returns {Promise<Object>} Membership data
 */
export async function getMembershipDetails(phone, email) {
  try {
    const queryParam = phone 
      ? `phone=${encodeURIComponent(phone)}` 
      : `email=${encodeURIComponent(email)}`;
    
    const response = await fetch(`/api/membership?${queryParam}`);
    const data = await safeJsonParse(response);
    return data;
  } catch (error) {
    console.error('Error fetching membership details:', error);
    return {
      success: false,
      error: 'Failed to fetch membership details'
    };
  }
}

/**
 * Update user's membership plan
 * @param {string} phone - User's phone number
 * @param {string} email - User's email
 * @param {string} plan - New membership plan
 * @returns {Promise<Object>} Update result
 */
export async function updateMembershipPlan(phone, email, plan) {
  try {
    const requestBody = {
      plan
    };
    
    if (phone) {
      requestBody.phone = phone;
    } else if (email) {
      requestBody.email = email;
    }
    
    const response = await fetch('/api/membership', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await safeJsonParse(response);
    return data;
  } catch (error) {
    console.error('Error updating membership plan:', error);
    return {
      success: false,
      error: 'Failed to update membership plan'
    };
  }
}

/**
 * Cancel user's membership (downgrade to free plan)
 * @param {string} phone - User's phone number
 * @param {string} email - User's email
 * @returns {Promise<Object>} Cancel result
 */
export async function cancelMembership(phone, email) {
  try {
    const queryParam = phone 
      ? `phone=${encodeURIComponent(phone)}` 
      : `email=${encodeURIComponent(email)}`;
    
    const response = await fetch(`/api/membership?${queryParam}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await safeJsonParse(response);
    return data;
  } catch (error) {
    console.error('Error canceling membership:', error);
    return {
      success: false,
      error: 'Failed to cancel membership'
    };
  }
}

export default {
  checkMembershipStatus,
  getMembershipDetails,
  updateMembershipPlan,
  cancelMembership
};