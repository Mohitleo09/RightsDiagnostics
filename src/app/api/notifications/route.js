import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import Notification from '../../utils/models/Notification';

// GET - Fetch notifications
export async function GET(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    let query = { userId };
    if (isRead !== null && isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    
    return NextResponse.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Create notification
export async function POST(request) {
  try {
    await DBConnection();
    
    const body = await request.json();
    
    const requiredFields = ['userId', 'userType', 'title', 'message', 'type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    const notification = await Notification.create(body);
    
    // TODO: Send push notification via FCM or OneSignal
    
    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      notification,
    });
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PUT - Mark notification as read
export async function PUT(request) {
  try {
    await DBConnection();
    
    const body = await request.json();
    const { notificationId, notificationIds, markAllAsRead, userId } = body;
    
    if (markAllAsRead && userId) {
      // Mark all notifications as read for a user
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }
    
    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark multiple notifications as read
      await Notification.updateMany(
        { _id: { $in: notificationIds } },
        { isRead: true, readAt: new Date() }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Notifications marked as read',
      });
    }
    
    if (notificationId) {
      // Mark single notification as read
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true, readAt: new Date() },
        { new: true }
      );
      
      if (!notification) {
        return NextResponse.json(
          { success: false, error: 'Notification not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
        notification,
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'No notification ID provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error updating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
export async function DELETE(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');
    const userId = searchParams.get('userId');
    const deleteAll = searchParams.get('deleteAll');
    
    if (deleteAll === 'true' && userId) {
      await Notification.deleteMany({ userId });
      return NextResponse.json({
        success: true,
        message: 'All notifications deleted',
      });
    }
    
    if (notificationId) {
      await Notification.findByIdAndDelete(notificationId);
      return NextResponse.json({
        success: true,
        message: 'Notification deleted',
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'No notification ID provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
