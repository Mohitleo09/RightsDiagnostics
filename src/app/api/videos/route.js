import { NextResponse } from 'next/server';
import Video from '../../utils/models/Video';
import dbConnect from '../../utils/config/db';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get category from query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const id = searchParams.get('id');
    
    // If ID is provided, fetch a single video
    if (id) {
      const video = await Video.findById(id);
      if (!video) {
        return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: video }, { status: 200 });
    }
    
    let videos;
    if (category) {
      // Fetch only active videos that belong to the specified category
      videos = await Video.find({ categories: category, status: 'Active' }).sort({ createdAt: -1 });
    } else {
      // Fetch all videos (both active and inactive) for admin panel
      videos = await Video.find({}).sort({ createdAt: -1 });
    }
    
    return NextResponse.json({ success: true, data: videos }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    const { name, videoLink, categories } = body;
    
    // Validation
    if (!name || !videoLink || !categories || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name, video link, and at least one category are required' },
        { status: 400 }
      );
    }
    
    const video = new Video({
      name,
      videoLink,
      categories
    });
    
    await video.save();
    
    return NextResponse.json({ success: true, data: video }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { id, action, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Video ID is required' }, { status: 400 });
    }
    
    let video;
    if (action === 'deactivate') {
      // Deactivate the video
      video = await Video.findByIdAndUpdate(id, { status: 'Inactive' }, { new: true });
    } else if (action === 'activate') {
      // Activate the video
      video = await Video.findByIdAndUpdate(id, { status: 'Active' }, { new: true });
    } else {
      // Regular update
      video = await Video.findByIdAndUpdate(id, updateData, { new: true });
    }
    
    if (!video) {
      return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: video }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Video ID is required' }, { status: 400 });
    }
    
    const video = await Video.findByIdAndDelete(id);
    
    if (!video) {
      return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Video deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}