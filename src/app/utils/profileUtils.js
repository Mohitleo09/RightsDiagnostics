/**
 * Utility functions for checking profile completion status
 */

/**
 * Check if user profile is complete (name, dob, gender)
 * @param {Object} user - User object from database
 * @returns {boolean} - True if profile is complete
 */
export const isProfileComplete = (user) => {
  return user && user.name && user.dob && user.gender;
};

/**
 * Check if user's additional information is complete (height, weight)
 * @param {Object} additionalInfo - Additional info object from database
 * @returns {boolean} - True if additional info is complete
 */
export const isAdditionalInfoComplete = (additionalInfo) => {
  return additionalInfo && additionalInfo.height && additionalInfo.weight;
};

/**
 * Check if user has completed all required profile information
 * @param {Object} user - User object from database
 * @param {Object} additionalInfo - Additional info object from database
 * @returns {boolean} - True if all profile information is complete
 */
export const isProfileFullyComplete = (user, additionalInfo) => {
  return isProfileComplete(user) && isAdditionalInfoComplete(additionalInfo);
};