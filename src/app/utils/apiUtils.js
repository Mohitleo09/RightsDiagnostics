/**
 * Safely parse JSON response from fetch requests
 * @param {Response} response - The fetch response object
 * @returns {Promise<Object>} - Parsed JSON data or error object
 */
export async function safeJsonParse(response) {
  try {
    // Check if response is ok first
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Check if response has JSON content-type
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, use the default error message
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        status: response.status
      };
    }

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textContent = await response.text();
      console.error('Expected JSON but received:', contentType, textContent.substring(0, 200));
      
      return {
        success: false,
        error: 'Server returned invalid response format. Expected JSON but received ' + (contentType || 'unknown format'),
        rawResponse: textContent.substring(0, 500) // First 500 chars for debugging
      };
    }

    // Try to parse JSON
    const data = await response.json();
    
    // Ensure the response has a success property if it doesn't already
    if (typeof data.success === 'undefined') {
      data.success = true; // Assume success if no explicit success property
    }
    
    return data;
    
  } catch (error) {
    console.error('JSON Parse Error:', error);
    
    // Try to get the raw response for debugging
    let rawResponse = '';
    try {
      response.clone(); // Clone to avoid consuming the body twice
      rawResponse = await response.text();
    } catch (textError) {
      // If we can't get text either, just log the error
    }
    
    return {
      success: false,
      error: 'Failed to parse server response. Please try again.',
      details: error.message,
      rawResponse: rawResponse.substring(0, 500) // First 500 chars for debugging
    };
  }
}

/**
 * Enhanced fetch with automatic JSON parsing and error handling
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Parsed JSON response
 */
export async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    return await safeJsonParse(response);
    
  } catch (networkError) {
    console.error('Network Error:', networkError);
    
    let errorMessage = 'Network error. Please check your connection and try again.';
    
    if (networkError.name === 'TypeError' && networkError.message.includes('Failed to fetch')) {
      errorMessage = 'Cannot connect to server. Please check if the server is running.';
    }
    
    return {
      success: false,
      error: errorMessage,
      details: networkError.message,
      type: 'network_error'
    };
  }
}
