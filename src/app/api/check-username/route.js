import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import UserModel from "../../utils/models/User";

export const runtime = "nodejs"; // Explicitly set runtime for API routes

export async function POST(req) {
  try {
    await DBConnection();

    const { username } = await req.json();

    // Validate username
    if (!username || username.length < 3) {
      return NextResponse.json({
        success: false,
        error: "Username must be at least 3 characters long"
      }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await UserModel.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } // Case insensitive match
    });

    if (existingUser) {
      // Username is taken, suggest alternatives
      const suggestions = await generateUsernameSuggestions(username);
      return NextResponse.json({
        success: true,
        available: false,
        message: "Username is already taken",
        suggestions: suggestions
      });
    } else {
      // Username is available
      return NextResponse.json({
        success: true,
        available: true,
        message: "Username is available"
      });
    }
  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to check username availability"
    }, { status: 500 });
  }
}

// Generate username suggestions
async function generateUsernameSuggestions(username) {
  const suggestions = [];
  // Fixed the octal literals by removing leading zeros
  const suffixes = [123, 12, 1, 2, 3, 1, 2, 3, 99, 88];
  
  // Add numbered suffixes
  for (const suffix of suffixes) {
    const suggestion = `${username}${suffix}`;
    const existingUser = await UserModel.findOne({ 
      username: { $regex: new RegExp(`^${suggestion}$`, 'i') } 
    });
    
    if (!existingUser) {
      suggestions.push(suggestion);
      if (suggestions.length >= 3) break; // Limit to 3 suggestions
    }
  }
  
  // If we don't have enough suggestions, try random numbers
  if (suggestions.length < 3) {
    for (let i = 0; i < 3 - suggestions.length; i++) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const suggestion = `${username}${randomNum}`;
      const existingUser = await UserModel.findOne({ 
        username: { $regex: new RegExp(`^${suggestion}$`, 'i') } 
      });
      
      if (!existingUser) {
        suggestions.push(suggestion);
      }
    }
  }
  
  return suggestions.slice(0, 3); // Return max 3 suggestions
}