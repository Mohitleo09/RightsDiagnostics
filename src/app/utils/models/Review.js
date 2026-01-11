import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  labName: {
    type: String,
    required: true,
  },
  bookingId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
    required: true,
  },
  serviceQuality: {
    type: Number,
    min: 1,
    max: 5,
  },
  staffBehavior: {
    type: Number,
    min: 1,
    max: 5,
  },
  cleanliness: {
    type: Number,
    min: 1,
    max: 5,
  },
  timeTaken: {
    type: Number,
    min: 1,
    max: 5,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  vendorResponse: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
ReviewSchema.index({ labName: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ bookingId: 1 });

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

export default Review;
