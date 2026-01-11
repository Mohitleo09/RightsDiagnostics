import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'replied', 'sent'],
    default: 'unread'
  },
  archived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
supportMessageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SupportMessage = mongoose.models.SupportMessage || mongoose.model('SupportMessage', supportMessageSchema);

export default SupportMessage;