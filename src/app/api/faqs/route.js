import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import FAQ from "../../utils/models/FAQ";

export const runtime = 'nodejs';

// GET - Fetch all FAQs
export async function GET(req) {
  try {
    await DBConnection();
    
    // Check if there's a category query parameter
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    
    // Build query filter
    const filter = {};
    
    if (category) {
      filter.category = { $in: [category] };
    }
    
    if (status) {
      filter.status = status;
    }
    
    const faqs = await FAQ.find(filter).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: faqs,
      count: faqs.length
    }, { 
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch FAQs"
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - Create a new FAQ
export async function POST(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    const { question, answer, category } = body;
    
    // Validate required fields
    if (!question || !answer || !category || category.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Question, answer, and at least one category are required"
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create new FAQ
    const newFAQ = new FAQ({
      question,
      answer,
      category
    });
    
    const savedFAQ = await newFAQ.save();
    
    return NextResponse.json({
      success: true,
      data: savedFAQ,
      message: "FAQ created successfully"
    }, { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create FAQ"
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT - Update an existing FAQ
export async function PUT(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    const { id, question, answer, category, status } = body;
    
    // Validate required fields
    if (!id || !question || !answer || !category || category.length === 0) {
      return NextResponse.json({
        success: false,
        error: "FAQ ID, question, answer, and at least one category are required"
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update FAQ
    const updatedFAQ = await FAQ.findByIdAndUpdate(
      id,
      { question, answer, category, status },
      { new: true, runValidators: true }
    );
    
    if (!updatedFAQ) {
      return NextResponse.json({
        success: false,
        error: "FAQ not found"
      }, { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: updatedFAQ,
      message: "FAQ updated successfully"
    }, { 
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update FAQ"
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE - Delete an FAQ
export async function DELETE(req) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: "FAQ ID is required"
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete FAQ
    const deletedFAQ = await FAQ.findByIdAndDelete(id);
    
    if (!deletedFAQ) {
      return NextResponse.json({
        success: false,
        error: "FAQ not found"
      }, { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "FAQ deleted successfully"
    }, { 
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete FAQ"
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}