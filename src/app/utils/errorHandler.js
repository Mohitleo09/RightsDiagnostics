import { NextResponse } from 'next/server';

/**
 * Global error handler for API routes
 * Ensures all errors are returned as proper JSON responses
 * @param {Error} error - The error object
 * @param {string} message - Optional custom error message
 * @returns {NextResponse} - JSON response with error details
 */
export function handleApiError(error, message = 'An error occurred') {
  console.error('API Error:', error);
  
  return new NextResponse(
    JSON.stringify({
      success: false,
      error: message,
      message: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}