/**
 * Utility functions for handling user redirects based on profile completion
 */

import { isProfileComplete, isAdditionalInfoComplete } from './profileUtils';

/**
 * Determine where a user should be redirected based on their profile completion status
 * @param {Object} user - User object from database
 * @param {Object} additionalInfo - Additional info object from database
 * @returns {string} - Path to redirect to
 */
export const getRedirectPath = (user, additionalInfo) => {
  // If user profile is not complete, redirect to dashboard for completion
  if (!isProfileComplete(user)) {
    return '/Patients/Dashboard';
  }
  
  // If profile is complete but additional info is not, redirect to additional info page
  if (!isAdditionalInfoComplete(additionalInfo)) {
    return '/Patients/Dashboard/additional';
  }
  
  // If both are complete, redirect to homepage
  return '/';
};

/**
 * Check if user should be redirected and perform the redirect
 * @param {Object} router - Next.js router object
 * @param {Object} user - User object from database
 * @param {Object} additionalInfo - Additional info object from database
 */
export const checkAndRedirect = (router, user, additionalInfo) => {
  const redirectPath = getRedirectPath(user, additionalInfo);
  
  // Only redirect if we're not already on the correct page
  if (typeof window !== 'undefined' && window.location.pathname !== redirectPath) {
    // Reset the redirect flag before redirecting
    sessionStorage.removeItem('hasRedirected');
    router.push(redirectPath);
  }
};

/**
 * Reset the redirect flag to allow future redirects
 */
export const resetRedirectFlag = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('hasRedirected');
  }
};

/**
 * Set the redirect flag to prevent multiple redirects
 */
export const setRedirectFlag = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('hasRedirected', 'true');
  }
};

/**
 * Check if a redirect has already been performed
 * @returns {boolean} - True if redirect has already been performed
 */
export const hasRedirected = () => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('hasRedirected') === 'true';
  }
  return false;
};