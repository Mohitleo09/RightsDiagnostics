import mongoose from "mongoose";

// Delete the model from cache to force reload
// But only if mongoose is already defined (server side)
if (typeof window === 'undefined' && mongoose.models && mongoose.models.Vendor) {
  delete mongoose.models.Vendor;
}

const VendorSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['vendor'],
    default: 'vendor',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deactivated'],
    default: 'active',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  labName: {
    type: String,
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  contactEmail: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: false,
  },
  website: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  logo: {
    type: String,
    required: false,
  },
  totalTestsOffered: {
    type: Number,
    default: 0,
  },
  workingHours: [{
    day: String,
    time: String,
  }],
  holidays: [{
    date: String,
    name: String,
  }],
  notificationSettings: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    appUpdates: { type: Boolean, default: true },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Add a virtual property to check if vendor is new (registered in the last 24 hours)
VendorSchema.virtual('isNew').get(function() {
  return (Date.now() - this.createdAt) < (24 * 60 * 60 * 1000); // 24 hours in milliseconds
});

// Export the model without connecting to the database at module load time
export default mongoose.models.Vendor || mongoose.model("Vendor", VendorSchema);