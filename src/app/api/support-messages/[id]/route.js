import { NextResponse } from "next/server";
import mongoose from "mongoose";
import SupportMessage from "../../../utils/models/SupportMessage";

export const runtime = 'nodejs';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const updateData = await req.json();
    
    console.log('PUT request for message ID:', id);
    console.log('Update data:', updateData);
    
    // In a real application, you would check if the user is authenticated and has admin privileges
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Message ID is required"
      }, { status: 400 });
    }
    
    // Validate that we have data to update
    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        message: "Update data is required"
      }, { status: 400 });
    }
    
    // Validate status value if provided
    if (updateData.status) {
      const validStatuses = ['unread', 'read', 'replied'];
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json({
          success: false,
          message: "Invalid status value"
        }, { status: 400 });
      }
    }
    
    // Update message in database with all provided fields
    const updatedMessage = await SupportMessage.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    console.log('Updated message:', updatedMessage);
    
    if (updatedMessage) {
      return NextResponse.json({
        success: true,
        message: "Message updated successfully",
        updatedMessage: updatedMessage
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Message not found"
      }, { status: 404 });
    }
  } catch (error) {
    console.error("❌ Error updating message:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update message"
    }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    
    // In a real application, you would check if the user is authenticated and has admin privileges
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Message ID is required"
      }, { status: 400 });
    }
    
    // Delete message from database
    const deletedMessage = await SupportMessage.findByIdAndDelete(id);
    
    if (deletedMessage) {
      return NextResponse.json({
        success: true,
        message: "Message deleted successfully"
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Message not found"
      }, { status: 404 });
    }
  } catch (error) {
    console.error("❌ Error deleting message:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete message"
    }, { status: 500 });
  }
}