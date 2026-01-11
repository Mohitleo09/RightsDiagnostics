"use client";

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const GoogleAuthHandler = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('GoogleAuthHandler - session:', session, 'status:', status);
    const handleGoogleAuth = async () => {
      if (status === 'authenticated' && session) {
        try {
          console.log('GoogleAuthHandler - User authenticated:', session.user?.email);
          // For Google login, the user is already created in the database by NextAuth
          // We just need to ensure the frontend knows the user is logged in
          if (typeof window !== 'undefined') {
            // Set login status in localStorage for frontend checks
            localStorage.setItem('isLoggedIn', 'true');
            
            // Check if we've already shown the success message for this login session
            const hasShownSuccessMessage = localStorage.getItem('googleLoginSuccessShown');
            
            // Dispatch custom events to notify navbar of login
            window.dispatchEvent(new CustomEvent('userLoggedIn'));
            
            // Only show success message once per login session
            if (!hasShownSuccessMessage) {
              toast.success("Login successful!");
              localStorage.setItem('googleLoginSuccessShown', 'true');
            }
          }
          
          // Redirect to patient dashboard
          router.push('/Patients/Dashboard');
        } catch (error) {
          console.error("Error handling Google auth:", error);
          toast.error("Login completed but encountered an issue. Please try again.");
        }
      } else if (status === 'unauthenticated') {
        // Not authenticated, do nothing
        console.log('GoogleAuthHandler - User not authenticated');
        // Clear the success message flag when user logs out
        if (typeof window !== 'undefined') {
          localStorage.removeItem('googleLoginSuccessShown');
        }
      } else if (status === 'loading') {
        // Still loading
        console.log('GoogleAuthHandler - Loading authentication state');
      }
    };

    handleGoogleAuth();
  }, [session, status]);

  // This component doesn't render anything
  return null;
};

export default GoogleAuthHandler;