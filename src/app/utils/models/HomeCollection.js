import mongoose from 'mongoose';

const HomeCollectionSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  patientName: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  address: {
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String,
  },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [longitude, latitude]
  },
  preferredDate: {
    type: Date,
    required: true,
  },
  preferredTimeSlot: {
    type: String,
    required: true,
    enum: ['Morning (6AM-10AM)', 'Mid-Morning (10AM-12PM)', 'Afternoon (12PM-4PM)', 'Evening (4PM-8PM)'],
  },
  testNames: [{
    type: String,
  }],
  collectionCharge: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['requested', 'assigned', 'in-transit', 'collected', 'completed', 'cancelled'],
    default: 'requested',
  },
  assignedTo: {
    phlebotomistId: String,
    phlebotomistName: String,
    phlebotomistPhone: String,
  },
  scheduledTime: Date,
  actualCollectionTime: Date,
  notes: String,
  specialInstructions: String,
  priority: {
    type: String,
    enum: ['normal', 'urgent'],
    default: 'normal',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for geospatial queries
HomeCollectionSchema.index({ location: '2dsphere' });
HomeCollectionSchema.index({ status: 1, preferredDate: 1 });

const HomeCollection = mongoose.models.HomeCollection || mongoose.model('HomeCollection', HomeCollectionSchema);

export default HomeCollection;
