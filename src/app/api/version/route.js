import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return version information
    return NextResponse.json({
      success: true,
      version: "1.0.0",
      lastUpdated: new Date().toISOString().split('T')[0],
      message: "Version information retrieved successfully"
    });
  } catch (error) {
    console.error('Version API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve version information',
      message: error.message
    }, { status: 500 });
  }
}