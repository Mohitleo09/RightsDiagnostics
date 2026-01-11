/**
 * Payment utility functions for wallet operations
 */

import { safeJsonParse } from './apiUtils';

/**
 * Deduct amount from user's wallet
 * @param {string} phone - User's phone number
 * @param {string} email - User's email
 * @param {number} amount - Amount to deduct
 * @param {string} description - Payment description
 * @param {string} referenceId - Reference ID (e.g., booking ID)
 * @returns {Promise<Object>} Payment result
 */
export async function deductFromWallet(phone, email, amount, description, referenceId) {
  try {
    const requestBody = {
      amount,
      description,
      referenceId
    };
    
    if (phone) {
      requestBody.phone = phone;
    } else if (email) {
      requestBody.email = email;
    }
    
    const response = await fetch('/api/wallet', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await safeJsonParse(response);
    return data;
  } catch (error) {
    console.error('Error deducting from wallet:', error);
    return {
      success: false,
      error: 'Failed to process payment'
    };
  }
}

/**
 * Add amount to user's wallet
 * @param {string} phone - User's phone number
 * @param {string} email - User's email
 * @param {number} amount - Amount to add
 * @returns {Promise<Object>} Recharge result
 */
export async function addToWallet(phone, email, amount) {
  try {
    const requestBody = {
      amount
    };
    
    if (phone) {
      requestBody.phone = phone;
    } else if (email) {
      requestBody.email = email;
    }
    
    const response = await fetch('/api/wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await safeJsonParse(response);
    return data;
  } catch (error) {
    console.error('Error adding to wallet:', error);
    return {
      success: false,
      error: 'Failed to add money to wallet'
    };
  }
}

/**
 * Get user's wallet balance
 * @param {string} phone - User's phone number
 * @param {string} email - User's email
 * @returns {Promise<Object>} Wallet data
 */
export async function getWalletBalance(phone, email) {
  try {
    const queryParam = phone 
      ? `phone=${encodeURIComponent(phone)}` 
      : `email=${encodeURIComponent(email)}`;
    
    const response = await fetch(`/api/wallet?${queryParam}`);
    const data = await safeJsonParse(response);
    return data;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return {
      success: false,
      error: 'Failed to fetch wallet balance'
    };
  }
}

export default {
  deductFromWallet,
  addToWallet,
  getWalletBalance
};