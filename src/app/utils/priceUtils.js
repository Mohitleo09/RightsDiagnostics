/**
 * Utility functions for handling price ranges
 */

/**
 * Parse a price string that may be a single price or a range (e.g., "200" or "200-300")
 * @param {string} priceStr - The price string to parse
 * @returns {object} An object with min, max, and isRange properties
 */
export const parsePriceRange = (priceStr) => {
  if (!priceStr) return { min: 0, max: 0, isRange: false };
  
  const trimmed = priceStr.trim();
  
  // Check if it's a range
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 2) {
      const min = parseFloat(parts[0].trim()) || 0;
      const max = parseFloat(parts[1].trim()) || 0;
      return { min, max, isRange: true };
    }
  }
  
  // Single price
  const price = parseFloat(trimmed) || 0;
  return { min: price, max: price, isRange: false };
};

/**
 * Get a displayable price string from a price range
 * @param {string} priceStr - The price string to format
 * @returns {string} A formatted price string
 */
export const formatPriceRange = (priceStr) => {
  if (!priceStr) return '₹0';
  
  const { min, max, isRange } = parsePriceRange(priceStr);
  
  if (isRange) {
    return min === max ? `₹${min}` : `₹${min}-₹${max}`;
  }
  
  return `₹${min}`;
};

/**
 * Get the average price from a price range
 * @param {string} priceStr - The price string to average
 * @returns {number} The average price
 */
export const getAveragePrice = (priceStr) => {
  if (!priceStr) return 0;
  
  const { min, max } = parsePriceRange(priceStr);
  return (min + max) / 2;
};

/**
 * Check if a price string is valid
 * @param {string} priceStr - The price string to validate
 * @returns {boolean} Whether the price string is valid
 */
export const isValidPrice = (priceStr) => {
  if (!priceStr || !priceStr.trim()) return false;
  
  // Validate price format: can be single number or range (e.g., "200" or "200-300")
  const pricePattern = /^\d+(-\d+)?$/;
  if (!pricePattern.test(priceStr.trim())) {
    return false;
  }
  
  // Validate range if it contains a hyphen
  if (priceStr.includes('-')) {
    const [min, max] = priceStr.split('-').map(p => Number(p));
    if (min <= 0 || max <= 0) {
      return false;
    }
    if (min >= max) {
      return false;
    }
  } else if (Number(priceStr) <= 0) {
    return false;
  }
  
  return true;
};