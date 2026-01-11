import { auth } from '@/app/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  console.log('Callback route called with request:', request.url);
  const session = await auth();
  console.log('Callback route - session:', session);
  
  // If user is authenticated, redirect to patient dashboard
  if (session) {
    // For Google login users, we need to ensure they're properly authenticated
    console.log('User authenticated:', session.user?.email);
    
    // Store user data in localStorage (handled client-side)
    // The frontend will handle storing user data in localStorage
    console.log('Redirecting authenticated user to patient dashboard');
    return NextResponse.redirect(new URL('/Patients/Dashboard', request.url));
  }
  
  // If not authenticated, redirect to login
  console.log('User not authenticated, redirecting to login');
  return NextResponse.redirect(new URL('/login', request.url));
}