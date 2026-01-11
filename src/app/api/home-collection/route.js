import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import HomeCollection from '../../utils/models/HomeCollection';

export const runtime = "nodejs";

// GET - Fetch home collection requests
export async function GET(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const bookingId = searchParams.get('bookingId');
    
    let query = {};
    
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (bookingId) query.bookingId = bookingId;
    
    const collections = await HomeCollection.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      count: collections.length,
      collections,
    });
  } catch (error) {
    console.error('❌ Error fetching home collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch home collections' },
      { status: 500 }
    );
  }
}

// POST - Create home collection request
export async function POST(request) {
  try {
    await DBConnection();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['bookingId', 'userId', 'patientName', 'contactNumber', 'address', 'preferredDate', 'preferredTimeSlot'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Calculate collection charge (₹100 for home collection)
    const collectionCharge = 100;
    
    const homeCollection = await HomeCollection.create({
      ...body,
      collectionCharge,
      status: 'requested',
    });
    
    return NextResponse.json({
      success: true,
      message: 'Home collection request created successfully',
      collection: homeCollection,
    });
  } catch (error) {
    console.error('❌ Error creating home collection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create home collection request' },
      { status: 500 }
    );
  }
}

// PUT - Update home collection status
export async function PUT(request) {
  try {
    await DBConnection();
    
    const body = await request.json();
    const { collectionId, status, assignedTo, actualCollectionTime, notes } = body;
    
    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }
    
    const updateData = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (actualCollectionTime) updateData.actualCollectionTime = actualCollectionTime;
    if (notes) updateData.notes = notes;
    
    const collection = await HomeCollection.findByIdAndUpdate(
      collectionId,
      updateData,
      { new: true }
    );
    
    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Home collection updated successfully',
      collection,
    });
  } catch (error) {
    console.error('❌ Error updating home collection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update home collection' },
      { status: 500 }
    );
  }
}
