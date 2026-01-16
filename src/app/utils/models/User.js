import mongoose from "mongoose";
import crypto from "crypto";

// Delete existing model to force schema reload
// But only if mongoose is already defined (server side)
if (typeof window === 'undefined' && mongoose.models && mongoose.models.User) {
  delete mongoose.models.User;
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false, // Made optional for phone-only registration
  },
  username: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allows multiple null values
    index: true,
  },
  email: {
    type: String,
    required: false, // Made optional for phone-only registration
    unique: true,
    sparse: true, // Allows multiple null values - CRITICAL for OTP users
    index: true,
  },
  phone: {
    type: String,
    required: false, // Made optional for vendor registration
    unique: true,
    sparse: true, // Allows multiple null values
    index: true,
  },
  password: {
    type: String,
    required: false, // Made optional for passwordless auth
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deactivated'],
    default: 'active',
  },
  // Vendor-specific fields
  labName: {
    type: String,
    required: false,
  },
  ownerName: {
    type: String,
    required: false,
  },
  contactEmail: {
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

  logo: {
    type: String,
    required: false,
  },
  totalTestsOffered: {
    type: Number,
    default: 0,
  },
  // Profile fields
  dob: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false,
  },
  profileImage: {
    type: String,
    required: false,
    default: '',
  },
  walletBalance: {
    type: Number,
    default: 0,
    required: false
  },
  membershipPlan: {
    type: String,
    enum: ['free', 'silver', 'gold'],
    default: 'free'
  },
  membershipExpiry: {
    type: Date,
    required: false
  },
  // Additional patient information
  height: {
    type: Number,
    required: false,
  },
  weight: {
    type: Number,
    required: false,
  },
  currentMedications: {
    type: String,
    required: false,
  },
  previousMedications: {
    type: String,
    required: false,
  },
  medicalDocuments: {
    type: [String], // Array of document URLs
    required: false,
  },
  // Verification fields
  isVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  // New fields for tracking verification timestamps
  phoneVerifiedAt: {
    type: Date,
    required: false,
  },
  emailVerifiedAt: {
    type: Date,
    required: false,
  },
  verifyToken: {
    type: String,
  },
  verifyTokenExpire: {
    type: Date,
  },
  // Auth Provider fields
  googleId: {
    type: String,
    unique: true,
    sparse: true,
    required: false,
  },
  authProvider: {
    type: String,
    enum: ['credentials', 'google', 'otp'],
    default: 'credentials',
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

UserSchema.methods.getVerificationToken = function () {
  // Generate the token
  const verificationToken = crypto.randomBytes(20).toString("hex");

  // Hash the token
  this.verifyToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.verifyTokenExpire = new Date(Date.now() + 30 * 60 * 1000);

  return verificationToken;
};

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;