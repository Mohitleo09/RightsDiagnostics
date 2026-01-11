/**
 * Authentication guard utility for protecting actions that require authentication
 */

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    return isLoggedIn;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Show login/signup modal/popup with improved UI
 * @param {string} message - Message to display in the modal
 * @param {Function} onLogin - Callback function to execute after successful login
 */
export const showAuthModal = (message = 'Please log in or sign up to use this feature', onLogin = null) => {
  if (typeof window === 'undefined') return;
  
  // Check if modal already exists
  if (document.getElementById('auth-modal')) {
    return;
  }
  
  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.className = 'fixed inset-0 bg-opacity-0 flex items-center justify-center z-[9999] p-4';
  modal.style.zIndex = '9999';
  
  // Modal content with improved UI
  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 scale-95 animate-scale-in">
      <div class="text-center">
        <!-- Icon -->
        <div class="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#007AFF] to-[#0052FF] mb-6">
          <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <!-- Title -->
        <h3 class="text-2xl font-bold text-gray-900 mb-3">Authentication Required</h3>
        
        <!-- Message -->
        <p class="text-gray-600 mb-8 text-base leading-relaxed">${message}</p>
        
        <!-- Buttons -->
        <div class="flex flex-col sm:flex-row gap-4">
          <button id="login-btn" class="flex-1 bg-gradient-to-r from-[#007AFF] to-[#0052FF] hover:from-[#0052FF] hover:to-[#0000FF] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
            Log In
          </button>
          <button id="signup-btn" class="flex-1 bg-white border-2 border-[#007AFF] text-[#0052FF] hover:bg-[#00CCFF] font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105">
            Sign Up
          </button>
        </div>
        
        <!-- Cancel button -->
        <button id="cancel-btn" class="mt-6 text-gray-500 hover:text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors underline-offset-2 hover:underline">
          Continue Browsing
        </button>
      </div>
    </div>
  `;
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes scale-in {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .animate-scale-in {
      animation: scale-in 0.3s ease-out forwards;
    }
  `;
  document.head.appendChild(style);
  
  // Add modal to body
  document.body.appendChild(modal);
  
  // Add event listeners
  const loginBtn = modal.querySelector('#login-btn');
  const signupBtn = modal.querySelector('#signup-btn');
  const cancelBtn = modal.querySelector('#cancel-btn');
  
  const closeModal = () => {
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    setTimeout(() => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 300);
  };
  
  loginBtn.addEventListener('click', () => {
    closeModal();
    // Redirect to login page
    window.location.href = '/login';
  });
  
  signupBtn.addEventListener('click', () => {
    closeModal();
    // Redirect to register page
    window.location.href = '/register';
  });

  cancelBtn.addEventListener('click', closeModal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Close modal on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  
  document.addEventListener('keydown', handleEscape);
};

/**
 * Protected action wrapper
 * @param {Function} action - The action to execute if user is authenticated
 * @param {string} message - Message to show in auth modal
 * @returns {Function} Wrapped function that checks auth before executing action
 */
export const withAuth = (action, message = 'Please log in or sign up to use this feature') => {
  return (...args) => {
    if (isAuthenticated()) {
      return action(...args);
    } else {
      showAuthModal(message);
      return null;
    }
  };
};