import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    enum: ['patient', 'vendor', 'admin'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['booking', 'payment', 'reminder', 'update', 'promotion', 'system'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  link: String,
  data: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  readAt: Date,
});

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export default Notification;
